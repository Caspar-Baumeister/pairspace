/**
 * Cancellations (§ 312k BGB) and withdrawals (§ 356a BGB) sent through the
 * public pages /kuendigen and /widerrufen, and the contract record behind the
 * § 312f confirmation mail. The form, the route /api/vertrag and the Cloud
 * Functions all use these shapes and labels, so the receipt repeats exactly
 * what the person declared. See doc.ts for the rules of this folder.
 */
import { translator, type Locale } from "./doc";
import { BASIC, euro } from "./plan";

export type ContractKind = "cancel" | "withdraw";
export type CancelType = "ordinary" | "extraordinary";
export type CancelWhen = "asap" | "date";

/** What the person declared. Only what the law lets us ask for. */
export interface ContractDeclaration {
  kind: ContractKind;
  /** The only contract there is. */
  contract: "basic";
  name: string;
  email: string;
  /** Cancellations only. */
  cancelType?: CancelType;
  /** Extraordinary cancellations only, optional. */
  reason?: string;
  /** Cancellations only, "asap" is the next possible date. */
  when?: CancelWhen;
  /** YYYY-MM-DD when `when` is "date". */
  date?: string;
}

export type AutomationStatus = "done" | "already-ended" | "manual" | "failed";

/** What the route did in Stripe right away. Withdrawals are never automated. */
export interface ContractAutomation {
  status: AutomationStatus;
  /** Why it was left to Caspar, for example "no-account" or "withdrawal". */
  reason?: string;
  subscriptionId?: string;
  /** When the subscription ends, milliseconds. */
  endsAt?: number;
  error?: string;
}

/** contractRequests/{id}, written by /api/vertrag only. No client can read or write it. */
export interface ContractRequestRecord {
  kind: ContractKind;
  locale: Locale;
  data: ContractDeclaration;
  receivedAt: number;
  /** HMAC of the IP address, for abuse only. */
  ipHash: string;
  userAgent: string;
  /** The landlord account behind the email, if there is one. */
  account: { uid: string; subscriptionId: string | null } | null;
  automation: ContractAutomation;
  /** Bookkeeping of onContractRequestCreated. */
  mail?: { receiptAt?: number; noticeAt?: number };
}

/** contracts/{subscriptionId}, written once when a Stripe subscription first exists. */
export interface ContractRecord {
  uid: string;
  email: string | null;
  name: string;
  locale: Locale;
  subscriptionId: string;
  customerId: string;
  interval: "month" | "year";
  /** Price per period in euro, as Stripe charges it. */
  price: number;
  trialEndsAt: number | null;
  createdAt: number;
  /** "Stand" of the AGB and Widerrufsbelehrung sent with the confirmation. */
  termsVersion: string;
  /**
   * A cancellation the customer asked for, written by syncSubscription and
   * removed again when they take it back. "button" came from /kuendigen,
   * whose receipt already names the end date, "stripe" from the portal or
   * from Caspar in Stripe.
   */
  cancellation?: ContractCancellation;
  /** Bookkeeping of onContractCreated and onContractUpdated. */
  mail?: { confirmationAt?: number; cancellationAt?: number };
}

export interface ContractCancellation {
  requestedAt: number;
  endsAt: number;
  source: "button" | "stripe";
}

export const LIMITS = { name: 200, email: 200, reason: 2000, userAgent: 300 } as const;

const MAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max) : "";
}

/** A real calendar day, so 2026-02-30 is rejected. */
export function isDay(value: string): boolean {
  if (!DATE.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

export type Validation = { ok: true; value: ContractDeclaration } | { ok: false; error: string };

/** Trims, caps and checks a declaration from the form. Unknown fields are dropped. */
export function validateDeclaration(input: unknown): Validation {
  const raw = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const kind = raw.kind;
  if (kind !== "cancel" && kind !== "withdraw") return { ok: false, error: "kind" };
  if (raw.contract !== "basic") return { ok: false, error: "contract" };
  const name = text(raw.name, LIMITS.name);
  if (!name) return { ok: false, error: "name" };
  const email = text(raw.email, LIMITS.email).toLowerCase();
  if (!MAIL.test(email)) return { ok: false, error: "email" };
  const value: ContractDeclaration = { kind, contract: "basic", name, email };
  if (kind === "withdraw") return { ok: true, value };

  const cancelType = raw.cancelType === "extraordinary" ? "extraordinary" : raw.cancelType === "ordinary" ? "ordinary" : null;
  if (!cancelType) return { ok: false, error: "cancelType" };
  value.cancelType = cancelType;
  if (cancelType === "extraordinary") {
    const reason = typeof raw.reason === "string" ? raw.reason.trim().slice(0, LIMITS.reason) : "";
    if (reason) value.reason = reason;
  }
  const when = raw.when === "date" ? "date" : raw.when === "asap" ? "asap" : null;
  if (!when) return { ok: false, error: "when" };
  value.when = when;
  if (when === "date") {
    const date = text(raw.date, 10);
    if (!isDay(date)) return { ok: false, error: "date" };
    value.date = date;
  }
  return { ok: true, value };
}

/* ------------------------------------------------------------------ format */

export function contractLabel(locale: Locale): string {
  return translator(locale)("Pairspace Basic, Abo für Vermieter", "Pairspace Basic, subscription for landlords");
}

/** A calendar day such as 1. Dezember 2026 or 1 December 2026. */
export function formatDay(day: string, locale: Locale): string {
  return new Date(`${day}T12:00:00Z`).toLocaleDateString(locale === "en" ? "en-GB" : "de-DE", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Date of a moment in German time. */
export function formatDate(ms: number, locale: Locale): string {
  return new Date(ms).toLocaleDateString(locale === "en" ? "en-GB" : "de-DE", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Berlin",
  });
}

/** Date and time of a moment in German time, for receipts. */
export function formatDateTime(ms: number, locale: Locale): string {
  const t = translator(locale);
  const time = new Date(ms).toLocaleTimeString(locale === "en" ? "en-GB" : "de-DE", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "Europe/Berlin",
  });
  return t(`${formatDate(ms, locale)} um ${time} Uhr (deutsche Zeit)`, `${formatDate(ms, locale)} at ${time} (German time)`);
}

/** The declaration as label and value pairs, for the success page and the receipt. */
export function declarationLines(d: ContractDeclaration, locale: Locale): { label: string; value: string }[] {
  const t = translator(locale);
  const out = [
    { label: t("Erklärung", "Declaration"), value: d.kind === "cancel" ? t("Kündigung", "Cancellation") : t("Widerruf", "Withdrawal") },
    { label: t("Vertrag", "Contract"), value: contractLabel(locale) },
    { label: "Name", value: d.name },
    { label: t("Mail", "Email"), value: d.email },
  ];
  if (d.kind === "cancel") {
    out.push({
      label: t("Art der Kündigung", "Type of cancellation"),
      value: d.cancelType === "extraordinary" ? t("Außerordentlich", "Extraordinary") : t("Ordentlich", "Ordinary"),
    });
    if (d.cancelType === "extraordinary") out.push({ label: t("Grund", "Reason"), value: d.reason || t("Keiner angegeben", "None given") });
    out.push({
      label: t("Gewünschter Zeitpunkt", "Requested date"),
      value: d.when === "date" && d.date ? formatDay(d.date, locale) : t("Nächstmöglicher Zeitpunkt", "Earliest possible date"),
    });
  }
  return out;
}

/** "9,99 € im Monat" or "€100 per year". */
export function pricePerPeriod(price: number, interval: "month" | "year", locale: Locale): string {
  const t = translator(locale);
  return `${euro(price, locale)} ${interval === "year" ? t("im Jahr", "per year") : t("im Monat", "per month")}`;
}

/** Today's list price for an interval, used when Stripe does not say. */
export function listPrice(interval: "month" | "year"): number {
  return interval === "year" ? BASIC.yearly : BASIC.monthly;
}
