import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { stripe, stripeConfigured, syncSubscription, uidForCustomer } from "@/lib/stripe";

/**
 * Stripe events for the Basic plan. Every event only names the subscription,
 * its current state is fetched fresh, so retries and events that arrive out of
 * order always end in the right state.
 */
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");
  if (!stripeConfigured() || !secret) return NextResponse.json({ error: "not-configured" }, { status: 503 });
  if (!signature) return NextResponse.json({ error: "no-signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(await request.text(), signature, secret);
  } catch (e) {
    console.error("[stripe] bad signature", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "bad-signature" }, { status: 400 });
  }

  let subscriptionId: string | null = null;
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      if (session.mode === "subscription" && session.subscription) {
        subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription.id;
      }
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
    case "customer.subscription.paused":
    case "customer.subscription.resumed":
      subscriptionId = event.data.object.id;
      break;
  }
  if (!subscriptionId) return NextResponse.json({ received: true });

  try {
    const sub = await stripe().subscriptions.retrieve(subscriptionId);
    // The Stripe account is shared with Immotrim, its subscriptions are not ours.
    if (!sub.items.data.some((item) => item.price.lookup_key?.startsWith("pairspace_"))) {
      return NextResponse.json({ received: true });
    }
    const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
    const uid = sub.metadata?.uid || (await uidForCustomer(customerId));
    if (!uid) {
      console.error("[stripe] no uid for subscription", sub.id);
      return NextResponse.json({ received: true });
    }
    await syncSubscription(uid, sub);
  } catch (e) {
    console.error("[stripe] webhook failed", event.type, e);
    return NextResponse.json({ error: "handler" }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}
