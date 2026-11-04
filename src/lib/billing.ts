"use client";

import { firebase } from "./firebase/client";
import type { Locale } from "./i18n";
import type { PlanInterval, Subscription } from "./types";

export class BillingError extends Error {
  constructor(readonly code: string) {
    super(`Billing failed: ${code}`);
  }
}

async function call<T>(path: string, body: unknown): Promise<T> {
  const { auth } = firebase();
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new BillingError("unauthenticated");
  const res = await fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new BillingError(data.error ?? `http-${res.status}`);
  return data;
}

/**
 * Starts the plan. With Stripe it returns the Checkout (or portal) URL to send
 * the browser to; locally without Stripe it returns the granted trial.
 */
export function startSubscription(
  interval: PlanInterval,
  options: { locale: Locale; returnPath: string; consent: boolean },
): Promise<{ url?: string; subscription?: Subscription }> {
  return call("/api/abo", { interval, ...options });
}

/** Back from Checkout: writes the plan right away instead of waiting for the webhook. */
export async function confirmCheckout(sessionId: string): Promise<Subscription> {
  return (await call<{ subscription: Subscription }>("/api/abo/sync", { sessionId })).subscription;
}

/** The Stripe customer portal for payment details, invoices, switching and cancelling. */
export async function portalUrl(locale: Locale): Promise<string> {
  return (await call<{ url: string }>("/api/abo/portal", { locale })).url;
}
