import { NextResponse } from "next/server";

import { landlordFromRequest } from "@/lib/firebase/admin";
import { stripe, stripeConfigured, syncSubscription } from "@/lib/stripe";

/**
 * Called when the landlord lands back from Checkout, so the link unlocks right
 * away instead of waiting for the webhook. Writes the same state the webhook
 * writes, so running both is harmless.
 */
export async function POST(request: Request) {
  const caller = await landlordFromRequest(request);
  if (!caller) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  if (!stripeConfigured()) return NextResponse.json({ error: "payment-unavailable" }, { status: 402 });

  const { sessionId } = (await request.json().catch(() => ({}))) as { sessionId?: string };
  if (typeof sessionId !== "string" || !sessionId.startsWith("cs_")) {
    return NextResponse.json({ error: "bad-session" }, { status: 400 });
  }

  const session = await stripe().checkout.sessions.retrieve(sessionId, { expand: ["subscription"] });
  if (session.metadata?.uid !== caller.uid) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (session.status !== "complete" || !session.subscription || typeof session.subscription === "string") {
    return NextResponse.json({ error: "not-complete" }, { status: 409 });
  }

  const subscription = await syncSubscription(caller.uid, session.subscription);
  return NextResponse.json({ subscription });
}
