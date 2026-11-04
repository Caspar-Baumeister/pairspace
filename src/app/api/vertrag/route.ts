import { createHash, createHmac } from "node:crypto";

import { LIMITS, validateDeclaration, type ContractAutomation, type ContractDeclaration, type ContractRequestRecord } from "@shared/contract";
import { NextResponse } from "next/server";

import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { toLocale } from "@/lib/i18n";
import { getBilling, stripe, stripeConfigured, syncSubscription, toSubscription } from "@/lib/stripe";

/**
 * Cancellations (§ 312k BGB) and withdrawals (§ 356a BGB) from the public
 * pages /kuendigen and /widerrufen. No sign in, on purpose.
 *
 * Every declaration is stored in contractRequests/{id}. The function
 * onContractRequestCreated mails the person a receipt with the full content,
 * date and time, and mails Caspar. A cancellation whose email belongs to a
 * landlord with a Stripe subscription is carried out right away
 * (cancel_at_period_end), so the receipt can name the end date. Withdrawals
 * are never automated, the pro rata refund is done by hand.
 *
 * The answer never says whether the email has an account.
 */

const MAX_BODY = 8_000;
const WINDOW_MS = 10 * 60 * 1000;
const PER_WINDOW = 5;

/** Per instance, which is enough to stop a script hammering the form. */
const hits = new Map<string, number[]>();

function limited(key: string, now: number): boolean {
  const since = now - WINDOW_MS;
  const recent = (hits.get(key) ?? []).filter((at) => at > since);
  if (recent.length >= PER_WINDOW) {
    hits.set(key, recent);
    return true;
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5_000) {
    for (const [k, list] of hits) if (!list.some((at) => at > since)) hits.delete(k);
  }
  return false;
}

function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

/** Keyed, so a stored hash cannot be turned back into an address by trying all of them. */
function ipHash(ip: string): string {
  const key = createHash("sha256")
    .update(`contract-ip:${process.env.STRIPE_SECRET_KEY ?? process.env.FIREBASE_SERVICE_ACCOUNT_JSON ?? "pairspace-local"}`)
    .digest();
  return createHmac("sha256", key).update(ip).digest("hex").slice(0, 32);
}

async function findAccount(email: string): Promise<ContractRequestRecord["account"]> {
  const user = await adminAuth()
    .getUserByEmail(email)
    .catch(() => null);
  if (!user) return null;
  const billing = await getBilling(user.uid);
  return { uid: user.uid, subscriptionId: billing.subscriptionId ?? null };
}

/**
 * Ordinary or extraordinary, a cancellation always ends the plan at the end
 * of the period at the latest, so that part is safe to do at once. A date
 * after the period end is left to Caspar, Stripe would otherwise end it too
 * early.
 */
async function cancelInStripe(d: ContractDeclaration, account: ContractRequestRecord["account"]): Promise<ContractAutomation> {
  if (!stripeConfigured()) return { status: "manual", reason: "no-stripe" };
  if (!account) return { status: "manual", reason: "no-account" };
  if (!account.subscriptionId) return { status: "manual", reason: "no-subscription" };
  try {
    const current = await stripe().subscriptions.retrieve(account.subscriptionId);
    const before = toSubscription(current);
    if (current.status === "canceled" || current.status === "incomplete_expired") {
      return { status: "already-ended", subscriptionId: current.id, endsAt: before.currentPeriodEnd };
    }
    if (d.when === "date" && d.date && Date.parse(`${d.date}T23:59:59Z`) > before.currentPeriodEnd) {
      return { status: "manual", reason: "later-date", subscriptionId: current.id, endsAt: before.currentPeriodEnd };
    }
    const updated = current.cancel_at_period_end
      ? current
      : await stripe().subscriptions.update(current.id, { cancel_at_period_end: true });
    const after = await syncSubscription(account.uid, updated);
    return { status: "done", subscriptionId: updated.id, endsAt: after.currentPeriodEnd };
  } catch (e) {
    console.error("[vertrag] stripe cancel failed", account.subscriptionId, e);
    return { status: "failed", subscriptionId: account.subscriptionId, error: e instanceof Error ? e.message.slice(0, 300) : "unknown" };
  }
}

export async function POST(request: Request) {
  const now = Date.now();
  const ip = clientIp(request);
  const hash = ipHash(ip);
  if (limited(hash, now)) return NextResponse.json({ error: "rate-limited" }, { status: 429 });

  const raw = await request.text();
  if (raw.length > MAX_BODY) return NextResponse.json({ error: "too-large" }, { status: 413 });
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "bad-json" }, { status: 400 });
  }

  const checked = validateDeclaration(body);
  if (!checked.ok) return NextResponse.json({ error: checked.error }, { status: 400 });
  const data = checked.value;
  const locale = toLocale(body.locale);

  const account = await findAccount(data.email);
  const automation: ContractAutomation =
    data.kind === "cancel" ? await cancelInStripe(data, account) : { status: "manual", reason: "withdrawal" };

  const record: ContractRequestRecord = {
    kind: data.kind,
    locale,
    data,
    receivedAt: now,
    ipHash: hash,
    userAgent: (request.headers.get("user-agent") ?? "").slice(0, LIMITS.userAgent),
    account,
    automation,
  };
  // One write with everything, so the function that mails the receipt never sees half a record.
  const ref = await adminDb().collection("contractRequests").add(record);
  return NextResponse.json({ id: ref.id, receivedAt: now });
}
