/**
 * Who runs Pairspace and which legal pages exist. The pages, the footer and
 * the sitemap all read from here. Operator, version and the AGB and
 * Widerruf texts themselves live in functions/src/shared, because the
 * contract confirmation mail sends the same text.
 */

import { CANCEL_PATH, WITHDRAW_PATH } from "@shared/operator";

export { CANCEL_PATH, LEGAL_UPDATED, OPERATOR, WITHDRAW_PATH } from "@shared/operator";

/** Same slug in both languages, English lives under /en like every other page. */
export const LEGAL_PAGES = [
  { path: "/impressum", de: "Impressum", en: "Legal notice" },
  { path: "/datenschutz", de: "Datenschutz", en: "Privacy" },
  { path: "/agb", de: "AGB", en: "Terms" },
  { path: "/widerruf", de: "Widerruf", en: "Withdrawal" },
] as const;

/**
 * The buttons § 312k and § 356a BGB ask for, always visible in the footer.
 * The German labels are the wording of the law.
 */
export const CONTRACT_BUTTONS = [
  { path: CANCEL_PATH, de: "Verträge hier kündigen", en: "Cancel contracts here" },
  { path: WITHDRAW_PATH, de: "Vertrag widerrufen", en: "Withdraw from contract" },
] as const;
