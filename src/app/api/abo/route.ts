import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { adminDb, landlordFromRequest } from "@/lib/firebase/admin";
import { toLocale } from "@/lib/i18n";
import { BASIC, euro } from "@/lib/plans";
import { customerFor, getBilling, portalConfiguration, priceFor, stripe, stripeConfigured } from "@/lib/stripe";
import type { PlanInterval, Subscription } from "@/lib/types";

const DAY = 86_400_000;
const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

/** Only pages inside the landlord app may be the way back from Stripe. */
function safeReturnPath(value: unknown, locale: string): string {
  const fallback = locale === "en" ? "/en/app/abo" : "/app/abo";
  return typeof value === "string" && /^(\/en)?\/app(\/[a-z0-9-]+)*$/i.test(value) ? value : fallback;
}

/**
 * Starts the plan for the signed in landlord.
 *
 * With Stripe configured this returns a Checkout URL: 7 days free for a first
 * trial, the payment method is collected up front. Someone who already has a
 * running Stripe plan gets the customer portal instead, which also switches
 * between monthly and yearly. The webhook and /api/abo/sync write the result.
 *
 * Without Stripe (local development) it grants one trial without payment and
 * nothing after that. The client can never write `subscription` itself,
 * firestore.rules forbid it.
 */
export async function POST(request: Request) {
  const caller = await landlordFromRequest(request);
  if (!caller) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as {
    interval?: PlanInterval;
    locale?: string;
    returnPath?: string;
    consent?: boolean;
  };
  const interval: PlanInterval = body.interval === "year" ? "year" : "month";
  const locale = toLocale(body.locale);

  const ref = adminDb().doc(`landlords/${caller.uid}`);
  const snap = await ref.get();
  if (!snap.exists) return NextResponse.json({ error: "no-landlord" }, { status: 404 });
  const existing = snap.get("subscription") as Subscription | undefined;
  const now = Date.now();

  if (!stripeConfigured()) {
    if (existing) return NextResponse.json({ error: "payment-unavailable" }, { status: 402 });
    const subscription: Subscription = {
      plan: "basic",
      interval,
      status: "trialing",
      trialEndsAt: now + BASIC.trialDays * DAY,
      currentPeriodEnd: now + BASIC.trialDays * DAY,
      provider: "prototype",
    };
    await ref.update({ subscription, updatedAt: now });
    return NextResponse.json({ subscription });
  }

  if (body.consent !== true) return NextResponse.json({ error: "consent" }, { status: 400 });

  const returnPath = safeReturnPath(body.returnPath, locale);
  const billing = await getBilling(caller.uid);
  const customer = await customerFor(caller.uid, caller.email, snap.get("name") || caller.name);

  // A running Stripe plan is changed or cancelled in the portal, never doubled.
  if (existing?.provider === "stripe" && existing.status !== "canceled" && billing.subscriptionId) {
    const portal = await stripe().billingPortal.sessions.create({
      customer,
      return_url: `${site}${returnPath}`,
      configuration: await portalConfiguration(),
      locale,
    });
    return NextResponse.json({ url: portal.url });
  }

  // One trial per account. A prototype trial that still runs carries over,
  // Stripe needs at least two days for that.
  const subscriptionData: Stripe.Checkout.SessionCreateParams.SubscriptionData = {
    metadata: { uid: caller.uid },
    trial_settings: { end_behavior: { missing_payment_method: "cancel" } },
  };
  const prototypeTrial = existing?.provider === "prototype" && existing.status === "trialing" && existing.currentPeriodEnd > now;
  if (prototypeTrial) {
    subscriptionData.trial_end = Math.ceil(Math.max(existing.currentPeriodEnd, now + 2 * DAY + 60_000) / 1000);
  } else if (!existing && !billing.trialUsed) {
    subscriptionData.trial_period_days = BASIC.trialDays;
  }
  const trial = Boolean(subscriptionData.trial_end || subscriptionData.trial_period_days);

  const price = interval === "year" ? euro(BASIC.yearly, locale) : euro(BASIC.monthly, locale);
  const per = interval === "year" ? (locale === "en" ? "per year" : "im Jahr") : locale === "en" ? "per month" : "im Monat";
  const message =
    locale === "en"
      ? `${trial ? "You pay nothing during the free trial. After that " : ""}Basic costs ${price} ${per} and renews until you cancel. You can cancel anytime in the app under Subscription.`
      : `${trial ? "In der Testphase zahlst du nichts. Danach " : ""}kostet Basic ${price} ${per} und verlängert sich, bis du kündigst. Kündigen kannst du jederzeit in der App unter Abo.`;

  const session = await stripe().checkout.sessions.create({
    mode: "subscription",
    // "Abonnieren" names the obligation to pay (§ 312j BGB) better than the default.
    submit_type: "subscribe",
    customer,
    client_reference_id: caller.uid,
    line_items: [{ price: await priceFor(interval), quantity: 1 }],
    subscription_data: subscriptionData,
    payment_method_collection: "always",
    allow_promotion_codes: true,
    billing_address_collection: "auto",
    tax_id_collection: { enabled: true },
    customer_update: { name: "auto", address: "auto" },
    locale,
    // The Stripe account is shared with Immotrim, so the page names Pairspace itself.
    branding_settings: {
      display_name: "Pairspace",
      button_color: "#8b6cef",
      // Stripe fetches the icon itself, which localhost cannot serve.
      ...(site.startsWith("https://") ? { icon: { type: "url" as const, url: `${site}/icon-maskable-512.png` } } : {}),
    },
    custom_text: { submit: { message: message.charAt(0).toUpperCase() + message.slice(1) } },
    metadata: { uid: caller.uid, consentAt: new Date(now).toISOString(), interval },
    success_url: `${site}${returnPath}?checkout={CHECKOUT_SESSION_ID}`,
    cancel_url: `${site}${returnPath}?checkout=cancel`,
  });
  if (!session.url) return NextResponse.json({ error: "no-url" }, { status: 502 });
  return NextResponse.json({ url: session.url });
}
