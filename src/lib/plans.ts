import type { Subscription } from "./types";

// Prices live next to the legal texts, so the AGB, the checkout and the
// contract confirmation mail can never name different numbers.
export { BASIC, euro } from "@shared/plan";

/** Technical ceiling per flat, never shown. Keeps the flat document small. */
export const MAX_ROOMS = 100;

/** Trial and paid subscriptions both unlock the link. */
export function isActive(sub: Subscription | undefined | null, now = Date.now()): boolean {
  if (!sub) return false;
  return (sub.status === "trialing" || sub.status === "active") && sub.currentPeriodEnd > now;
}
