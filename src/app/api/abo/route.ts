import { NextResponse } from "next/server";

import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { BASIC } from "@/lib/plans";
import type { PlanInterval, Subscription } from "@/lib/types";

const DAY = 86_400_000;

/**
 * Starts the subscription for the signed in landlord.
 *
 * Prototype: grants the 7 day trial straight away, no payment. This is the one
 * place Stripe goes later: create a Checkout session with trial_period_days,
 * return its URL, and let a webhook write the same Subscription shape.
 * The client can never write `subscription` itself, firestore.rules forbid it.
 */
export async function POST(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!token) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  let uid: string;
  try {
    const decoded = await adminAuth().verifyIdToken(token);
    if (decoded.firebase.sign_in_provider === "anonymous") {
      return NextResponse.json({ error: "anonymous" }, { status: 403 });
    }
    uid = decoded.uid;
  } catch {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { interval?: PlanInterval };
  const interval: PlanInterval = body.interval === "year" ? "year" : "month";

  const ref = adminDb().doc(`landlords/${uid}`);
  const snap = await ref.get();
  if (!snap.exists) return NextResponse.json({ error: "no-landlord" }, { status: 404 });

  const existing = snap.get("subscription") as Subscription | undefined;
  const now = Date.now();
  // One trial per account. Someone who had one already starts paying right away.
  const hadTrial = Boolean(existing);
  const subscription: Subscription = hadTrial
    ? {
        plan: "basic",
        interval,
        status: "active",
        trialEndsAt: null,
        currentPeriodEnd: now + (interval === "year" ? 365 : 30) * DAY,
        provider: "prototype",
      }
    : {
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
