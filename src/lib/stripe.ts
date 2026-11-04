import "server-only";

import { listPrice, type ContractRecord } from "@shared/contract";
import { LEGAL_UPDATED } from "@shared/operator";
import { FieldValue } from "firebase-admin/firestore";
import Stripe from "stripe";

import { adminAuth, adminDb } from "./firebase/admin";
import type { PlanInterval, Subscription, SubscriptionStatus } from "./types";

/**
 * Stripe for the Basic plan. Products and prices are found by lookup key, so
 * the only configuration is two secrets: STRIPE_SECRET_KEY and
 * STRIPE_WEBHOOK_SECRET. `scripts/stripe-setup.mjs` creates everything once.
 *
 * Server only state lives in `billing/{uid}` (customer id, trial used, flats
 * paused by billing). No client can read or write that collection.
 */

export const LOOKUP_KEYS: Record<PlanInterval, string> = {
  month: "pairspace_basic_monthly",
  year: "pairspace_basic_yearly",
};

/** Marks the portal configuration this app created, so it is found again. */
export const APP_TAG = "pairspace";

let client: Stripe | null = null;

export function stripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function stripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return (client ??= new Stripe(key, { appInfo: { name: "Pairspace", url: "https://joinpairspace.com" } }));
}

const priceCache = new Map<PlanInterval, string>();

export async function priceFor(interval: PlanInterval): Promise<string> {
  const cached = priceCache.get(interval);
  if (cached) return cached;
  const { data } = await stripe().prices.list({ lookup_keys: [LOOKUP_KEYS[interval]], active: true, limit: 1 });
  if (!data[0]) throw new Error(`No active Stripe price with lookup key ${LOOKUP_KEYS[interval]}`);
  priceCache.set(interval, data[0].id);
  return data[0].id;
}

let portalConfig: string | null = null;

/** The customer portal set up by the setup script, or Stripe's default if it is missing. */
export async function portalConfiguration(): Promise<string | undefined> {
  if (portalConfig) return portalConfig;
  const { data } = await stripe().billingPortal.configurations.list({ active: true, limit: 100 });
  const ours = data.find((c) => c.metadata?.app === APP_TAG);
  if (ours) portalConfig = ours.id;
  return ours?.id;
}

/* ------------------------------------------------------------------ billing */

export interface Billing {
  customerId?: string;
  subscriptionId?: string;
  trialUsed?: boolean;
  /** Flats this account had live when the plan ended, reopened when it starts again. */
  pausedFlats?: string[];
}

export const billingRef = (uid: string) => adminDb().doc(`billing/${uid}`);

export async function getBilling(uid: string): Promise<Billing> {
  const snap = await billingRef(uid).get();
  return (snap.data() as Billing | undefined) ?? {};
}

export async function customerFor(uid: string, email: string | undefined, name: string | undefined): Promise<string> {
  const billing = await getBilling(uid);
  if (billing.customerId) return billing.customerId;
  const customer = await stripe().customers.create(
    { email, name: name || undefined, metadata: { uid } },
    { idempotencyKey: `customer-${uid}` },
  );
  await billingRef(uid).set({ customerId: customer.id }, { merge: true });
  return customer.id;
}

/** The uid behind a Stripe customer: metadata first, then our own records. */
export async function uidForCustomer(customerId: string): Promise<string | null> {
  const query = await adminDb().collection("billing").where("customerId", "==", customerId).limit(1).get();
  if (!query.empty) return query.docs[0].id;
  const customer = await stripe().customers.retrieve(customerId);
  return "deleted" in customer && customer.deleted ? null : (customer.metadata?.uid ?? null);
}

/* ------------------------------------------------------------- subscription */

function statusOf(status: Stripe.Subscription.Status): SubscriptionStatus {
  switch (status) {
    case "trialing":
      return "trialing";
    case "active":
      return "active";
    case "past_due":
    case "unpaid":
    case "incomplete":
      return "past_due";
    default:
      return "canceled";
  }
}

export function toSubscription(sub: Stripe.Subscription): Subscription {
  const item = sub.items.data[0];
  const end = item?.current_period_end ?? sub.trial_end ?? Math.floor(Date.now() / 1000);
  return {
    plan: "basic",
    interval: item?.price.recurring?.interval === "year" ? "year" : "month",
    status: statusOf(sub.status),
    trialEndsAt: sub.trial_end ? sub.trial_end * 1000 : null,
    currentPeriodEnd: end * 1000,
    cancelAtPeriodEnd: sub.cancel_at_period_end || sub.cancel_at !== null,
    provider: "stripe",
    stripeCustomerId: typeof sub.customer === "string" ? sub.customer : sub.customer.id,
  };
}

/**
 * Writes the Stripe state onto the landlord, the one shape the app and the
 * Firestore rules read. When the plan ends, live flats are paused so the link
 * stops taking applications. When it runs again, exactly those flats reopen.
 */
export async function syncSubscription(uid: string, sub: Stripe.Subscription): Promise<Subscription> {
  const db = adminDb();
  const subscription = toSubscription(sub);
  const running = subscription.status === "trialing" || subscription.status === "active";
  const ended = subscription.status === "canceled";
  const billing = await getBilling(uid);

  // An older subscription that ends must not overwrite a newer one that runs.
  if (billing.subscriptionId && billing.subscriptionId !== sub.id && !running) return subscription;
  // A deleted account has nothing left to unlock.
  if (!(await db.doc(`landlords/${uid}`).get()).exists) return subscription;

  const batch = db.batch();
  batch.update(db.doc(`landlords/${uid}`), { subscription, updatedAt: Date.now() });
  const billingPatch: Record<string, unknown> = {
    subscriptionId: sub.id,
    customerId: subscription.stripeCustomerId,
    trialUsed: billing.trialUsed || sub.trial_end !== null,
  };

  if (ended) {
    const live = await db.collection("flats").where("ownerUid", "==", uid).where("status", "==", "live").get();
    live.docs.forEach((d) => batch.update(d.ref, { status: "closed", updatedAt: Date.now() }));
    if (!live.empty) billingPatch.pausedFlats = FieldValue.arrayUnion(...live.docs.map((d) => d.id));
  } else if (running && billing.pausedFlats?.length) {
    for (const id of billing.pausedFlats) {
      const flat = await db.doc(`flats/${id}`).get();
      if (flat.exists && flat.get("status") === "closed") batch.update(flat.ref, { status: "live", updatedAt: Date.now() });
    }
    billingPatch.pausedFlats = [];
  }

  batch.set(billingRef(uid), billingPatch, { merge: true });
  await batch.commit();
  if (running) await recordContract(uid, sub, subscription);
  return subscription;
}

/* ----------------------------------------------------------------- contract */

const ALREADY_EXISTS = 6;

/**
 * § 312f BGB: the first time a subscription runs, contracts/{subscriptionId}
 * is created exactly once. The function onContractCreated then mails the
 * confirmation with the full AGB and Widerrufsbelehrung. Webhook and the
 * return from Checkout may both get here, create() lets only one through.
 */
export async function recordContract(uid: string, sub: Stripe.Subscription, subscription: Subscription): Promise<boolean> {
  const ref = adminDb().doc(`contracts/${sub.id}`);
  if ((await ref.get()).exists) return false;
  const [user, landlord] = await Promise.all([
    adminAuth()
      .getUser(uid)
      .catch(() => null),
    adminDb().doc(`landlords/${uid}`).get(),
  ]);
  const amount = sub.items.data[0]?.price.unit_amount;
  const record: ContractRecord = {
    uid,
    email: user?.email ?? (landlord.get("email") as string | null | undefined) ?? null,
    name: String(landlord.get("name") ?? user?.displayName ?? ""),
    locale: landlord.get("locale") === "en" ? "en" : "de",
    subscriptionId: sub.id,
    customerId: subscription.stripeCustomerId ?? "",
    interval: subscription.interval,
    price: typeof amount === "number" ? amount / 100 : listPrice(subscription.interval),
    trialEndsAt: subscription.trialEndsAt,
    createdAt: Date.now(),
    termsVersion: LEGAL_UPDATED.de,
  };
  try {
    await ref.create(record);
    return true;
  } catch (e) {
    if ((e as { code?: number }).code === ALREADY_EXISTS) return false;
    throw e;
  }
}
