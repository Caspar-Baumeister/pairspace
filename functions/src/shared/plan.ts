/**
 * The one paid plan. Shared with the website (src/lib/plans.ts re-exports it)
 * so the AGB on the site, the checkout and the contract confirmation mail
 * always name the same prices. See doc.ts for the rules of this folder.
 */
import type { Locale } from "./doc";

export const BASIC = {
  id: "basic",
  name: "Basic",
  monthly: 9.99,
  yearly: 100,
  trialDays: 7,
} as const;

/** 9,99 € in German, €9.99 in British English, whole euros without cents. */
export function euro(value: number, locale: Locale = "de"): string {
  return value.toLocaleString(locale === "en" ? "en-GB" : "de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
  });
}
