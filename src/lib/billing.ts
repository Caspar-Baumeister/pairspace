"use client";

import { firebase } from "./firebase/client";
import type { PlanInterval, Subscription } from "./types";

/** Asks the server to start the plan. Today it grants the trial, later it returns a Stripe Checkout URL. */
export async function startSubscription(interval: PlanInterval): Promise<Subscription> {
  const { auth } = firebase();
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error("Not signed in");
  const res = await fetch("/api/abo", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: JSON.stringify({ interval }),
  });
  if (!res.ok) throw new Error("The plan could not be started.");
  return ((await res.json()) as { subscription: Subscription }).subscription;
}
