import type { Subscription } from "./types";

export const BASIC = {
  id: "basic",
  name: "Basic",
  monthly: 9.99,
  yearly: 100,
  trialDays: 7,
} as const;

/** Technical ceiling per flat, never shown. Keeps the flat document small. */
export const MAX_ROOMS = 100;

export function euro(value: number): string {
  return value.toLocaleString("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
  });
}

/** Trial and paid subscriptions both unlock the link. */
export function isActive(sub: Subscription | undefined | null, now = Date.now()): boolean {
  if (!sub) return false;
  return (sub.status === "trialing" || sub.status === "active") && sub.currentPeriodEnd > now;
}
