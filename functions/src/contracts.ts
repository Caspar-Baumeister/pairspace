/**
 * Mails around the subscription contract.
 *
 *   handleContractRequest   contractRequests/{id} from /kuendigen and /widerrufen
 *                           (route /api/vertrag). The person gets a receipt with
 *                           the full declaration, date and time of receipt and,
 *                           when the route already cancelled in Stripe, the end
 *                           date (§ 312k Abs. 4, § 356a BGB). Caspar gets a notice
 *                           with what is left to do.
 *   handleContractCreated   contracts/{subscriptionId}, written once by
 *                           syncSubscription. The § 312f BGB confirmation with the
 *                           contract details and the full AGB and Widerrufsbelehrung
 *                           with the model form, because a link is no durable medium.
 *   handleContractCancelled `cancellation` on the same document, noted by
 *                           syncSubscription. Confirms a cancellation from the
 *                           Stripe portal or from Caspar in Stripe with its end
 *                           date, as the AGB promise for every way of cancelling.
 *
 * All claim their mails in the document itself before sending (field `mail`),
 * so a retried event never mails twice, and give the claim back when the send
 * fails. Clients cannot read or write either collection.
 */
import { FieldValue, type DocumentReference } from "firebase-admin/firestore";

import { db } from "./admin";
import { joinDocs, legalDocMail } from "./legalMail";
import { send, type Mail } from "./mail";
import { agbDoc } from "./shared/agb";
import {
  contractLabel,
  declarationLines,
  formatDate,
  formatDateTime,
  pricePerPeriod,
  type ContractCancellation,
  type ContractRecord,
  type ContractRequestRecord,
} from "./shared/contract";
import { translator, type Locale } from "./shared/doc";
import { CANCEL_PATH, LEGAL_UPDATED, OPERATOR, WITHDRAW_PATH } from "./shared/operator";
import { widerrufDoc } from "./shared/widerruf";
import { escapeHtml, siteUrl } from "./templates";

export const CASPAR = process.env.FEEDBACK_TO ?? "caspar.baumeister.privat@gmail.com";

export const requestRef = (id: string) => db().doc(`contractRequests/${id}`);
export const contractRef = (subscriptionId: string) => db().doc(`contracts/${subscriptionId}`);

/** Takes one mail slot in `mail.<field>`. False when it is taken or the document is gone. */
async function claim(ref: DocumentReference, field: string): Promise<boolean> {
  return db().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists || snap.get(`mail.${field}`) != null) return false;
    tx.set(ref, { mail: { [field]: Date.now() } }, { merge: true });
    return true;
  });
}

async function release(ref: DocumentReference, field: string): Promise<void> {
  await ref.update({ [`mail.${field}`]: FieldValue.delete() }).catch(() => undefined);
}

async function sendClaimed(ref: DocumentReference, field: string, mail: Mail): Promise<boolean> {
  if (!(await claim(ref, field))) return false;
  const ok = await send(mail);
  if (!ok) await release(ref, field);
  return ok;
}

const lineList = (lines: { label: string; value: string }[]) =>
  lines.map((l) => `<strong>${escapeHtml(l.label)}:</strong> ${escapeHtml(l.value).replace(/\n/g, "<br>")}`).join("<br>");

const operatorLine = (locale: Locale) =>
  `${OPERATOR.name}, ${OPERATOR.street}, ${OPERATOR.city}, ${OPERATOR.country[locale]}`;

/* ------------------------------------------------------------------ receipt */

/** To the person who cancelled or withdrew, in the language of the page they used. */
export function receiptMail(id: string, r: ContractRequestRecord, now = Date.now()): Mail {
  const locale = r.locale;
  const t = translator(locale);
  const cancel = r.kind === "cancel";
  const received = formatDateTime(r.receivedAt, locale);
  const a = r.automation;

  let status: string;
  if (!cancel) {
    status = t(
      "Wir bearbeiten deinen Widerruf und zahlen dir zu viel gezahlte Beträge innerhalb von 14 Tagen zurück, auf dem Weg, auf dem du bezahlt hast. Hast du verlangt, dass Pairspace sofort startet, behalten wir einen anteiligen Betrag für die bezahlten Tage bis zu deinem Widerruf. Die Testtage sind kostenlos.",
      "We are processing your withdrawal and will refund any amount you overpaid within 14 days, using the payment method you paid with. If you asked for Pairspace to start right away, we keep a proportionate amount for the paid days up to your withdrawal. The trial days are free.",
    );
  } else if ((a.status === "done" || a.status === "already-ended") && a.endsAt) {
    const end = formatDate(a.endsAt, locale);
    status =
      a.status === "done"
        ? t(
            `Wir haben dein Abo gekündigt. Es endet am ${end}. Bis dahin kannst du Pairspace wie gewohnt nutzen, danach wird nichts mehr abgebucht.`,
            `We have cancelled your subscription. It ends on ${end}. You can use Pairspace as usual until then, after that nothing more is charged.`,
          )
        : a.endsAt > now
          ? t(`Dein Abo war schon gekündigt. Es endet am ${end}.`, `Your subscription was already cancelled. It ends on ${end}.`)
          : t(`Dein Abo ist bereits beendet, seit ${end}.`, `Your subscription has already ended, on ${end}.`);
  } else {
    status = t(
      "Wir bearbeiten deine Kündigung und bestätigen dir per Mail, zu welchem Zeitpunkt dein Vertrag endet.",
      "We are processing your cancellation and will confirm by email when your contract ends.",
    );
  }

  return {
    to: r.data.email,
    template: "contract-receipt",
    idempotencyKey: `contract-receipt/${id}`,
    subject: cancel
      ? t("Eingangsbestätigung: deine Kündigung bei Pairspace", "Receipt: your cancellation at Pairspace")
      : t("Eingangsbestätigung: dein Widerruf bei Pairspace", "Receipt: your withdrawal at Pairspace"),
    heading: cancel
      ? t("Deine Kündigung ist eingegangen", "We have received your cancellation")
      : t("Dein Widerruf ist eingegangen", "We have received your withdrawal"),
    body: [
      escapeHtml(t(`Hallo ${r.data.name},`, `Hi ${r.data.name},`)),
      cancel
        ? t(`deine Kündigung ist am ${received} bei uns eingegangen.`, `Your cancellation reached us on ${received}.`)
        : t(`dein Widerruf ist am ${received} bei uns eingegangen.`, `Your withdrawal reached us on ${received}.`),
      `${escapeHtml(t("Das hast du erklärt:", "This is what you declared:"))}<br>${lineList(declarationLines(r.data, locale))}`,
      escapeHtml(status),
      escapeHtml(t("Bewahre diese Mail als Nachweis auf.", "Please keep this email as proof.")),
      escapeHtml(
        t(
          "Hast du das nicht selbst abgeschickt? Dann antworte bitte kurz auf diese Mail.",
          "Did you not send this yourself? Then please reply to this email.",
        ),
      ),
    ],
    footer: escapeHtml(t(`Eingangsnummer ${id}. Pairspace, ${operatorLine(locale)}.`, `Reference ${id}. Pairspace, ${operatorLine(locale)}.`)),
  };
}

/* ------------------------------------------------------------------- notice */

const MANUAL: Record<string, string> = {
  "no-stripe": "Stripe ist hier nicht eingerichtet.",
  "no-account": "Kein Vermieterkonto mit dieser Mail.",
  "no-subscription": "Das Konto hat kein Stripe-Abo.",
  "later-date": "Das gewünschte Datum liegt nach dem Ende des laufenden Zeitraums.",
  withdrawal: "Widerrufe laufen nie automatisch.",
};

/** To Caspar, German only, reply goes to the person. */
export function noticeMail(id: string, r: ContractRequestRecord): Mail {
  const cancel = r.kind === "cancel";
  const what = cancel ? "Kündigung" : "Widerruf";
  const a = r.automation;
  const done = cancel && a.status === "done";
  const automation =
    a.status === "done"
      ? `In Stripe gekündigt (${a.subscriptionId}), endet am ${a.endsAt ? formatDate(a.endsAt, "de") : "?"}.`
      : a.status === "already-ended"
        ? `War in Stripe schon gekündigt (${a.subscriptionId}), Ende ${a.endsAt ? formatDate(a.endsAt, "de") : "?"}.`
        : a.status === "failed"
          ? `Stripe-Fehler bei ${a.subscriptionId}: ${a.error ?? "unbekannt"}`
          : `Nicht automatisch: ${MANUAL[a.reason ?? ""] ?? a.reason ?? "?"}${a.endsAt ? ` Laufender Zeitraum endet am ${formatDate(a.endsAt, "de")}.` : ""}`;
  const todo = !cancel
    ? "Zu tun: Abo in Stripe sofort beenden, den zu viel gezahlten Betrag anteilig erstatten (Testtage kostenlos) und der Person das Ergebnis per Mail bestätigen."
    : done || a.status === "already-ended"
      ? "Nichts zu tun. Die Eingangsbestätigung mit dem Enddatum ist an die Person raus."
      : "Zu tun: Vertrag finden, die Kündigung in Stripe eintragen und der Person das Vertragsende per Mail bestätigen.";

  return {
    to: CASPAR,
    replyTo: r.data.email,
    template: "contract-notice",
    idempotencyKey: `contract-notice/${id}`,
    subject: `Pairspace ${what}: ${r.data.name.slice(0, 60)}${done || a.status === "already-ended" ? ", erledigt" : ", bitte bearbeiten"}`,
    heading: `${what} eingegangen`,
    body: [
      `Eingegangen am ${escapeHtml(formatDateTime(r.receivedAt, "de"))}, Seite auf ${r.locale === "en" ? "Englisch" : "Deutsch"}.`,
      lineList(declarationLines(r.data, "de")),
      escapeHtml(
        r.account
          ? `Konto: UID ${r.account.uid}, Abo ${r.account.subscriptionId ?? "keins"}.`
          : "Konto: keins mit dieser Mailadresse gefunden.",
      ),
      escapeHtml(automation),
      `<strong>${escapeHtml(todo)}</strong>`,
      `<span style="color:#9a9a9a">IP-Hash ${escapeHtml(r.ipHash)}, ${escapeHtml(r.userAgent)}</span>`,
    ],
    footer: escapeHtml(`Eingang ${id} in Firestore unter contractRequests/. Antworten geht direkt an ${r.data.email}.`),
  };
}

export interface RequestResult {
  receipt: boolean;
  notice: boolean;
}

export async function handleContractRequest(id: string): Promise<RequestResult> {
  const ref = requestRef(id);
  const snap = await ref.get();
  const r = snap.data() as ContractRequestRecord | undefined;
  if (!r) return { receipt: false, notice: false };
  const receipt = await sendClaimed(ref, "receiptAt", receiptMail(id, r));
  const notice = await sendClaimed(ref, "noticeAt", noticeMail(id, r));
  return { receipt, notice };
}

/* ------------------------------------------------------------- confirmation */

/**
 * The binding German texts, for English speakers followed by the courtesy
 * translation. Built from functions/src/shared, the same source as the site.
 */
export function contractTexts(locale: Locale, version: string): { html: string; text: string } {
  const german = [legalDocMail(agbDoc("de"), "de", version), legalDocMail(widerrufDoc("de"), "de", version)];
  const versionEn = version === LEGAL_UPDATED.de ? LEGAL_UPDATED.en : version;
  if (locale === "de") return joinDocs(german);
  const note = {
    html: `<p style="margin:0 0 10px;font:600 13px/1.55 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#221418">${escapeHtml(
      "Below are our terms and the withdrawal notice. The German version comes first and is legally binding. The English translation follows it.",
    )}</p>`,
    text: "Below are our terms and the withdrawal notice. The German version comes first and is legally binding. The English translation follows it.",
  };
  const english = [legalDocMail(agbDoc("en"), "en", versionEn), legalDocMail(widerrufDoc("en"), "en", versionEn)];
  return joinDocs([note, ...german, ...english]);
}

export function confirmationMail(c: ContractRecord): Mail {
  const locale = c.locale;
  const t = translator(locale);
  const version = locale === "en" && c.termsVersion === LEGAL_UPDATED.de ? LEGAL_UPDATED.en : c.termsVersion;
  const details = [
    { label: t("Vertragspartner", "Contracting party"), value: `${operatorLine(locale)}, ${OPERATOR.email}` },
    {
      label: t("Tarif", "Plan"),
      value: `${contractLabel(locale)}, ${c.interval === "year" ? t("jährlich", "yearly") : t("monatlich", "monthly")}`,
    },
    { label: t("Preis", "Price"), value: `${pricePerPeriod(c.price, c.interval, locale)}, ${t("Endpreis", "final price")}` },
    {
      label: t("Testphase", "Free trial"),
      value: c.trialEndsAt
        ? t(
            `kostenlos bis ${formatDate(c.trialEndsAt, locale)}. Kündigst du nicht vorher, beginnt danach das bezahlte Abo.`,
            `free until ${formatDate(c.trialEndsAt, locale)}. Unless you cancel before then, the paid subscription starts afterwards.`,
          )
        : t("keine", "none"),
    },
    {
      label: t("Laufzeit", "Term"),
      value: t(
        "verlängert sich automatisch um denselben Zeitraum und ist jederzeit zum Ende des laufenden Zeitraums kündbar.",
        "renews automatically for the same period and can be cancelled at any time, effective at the end of the current period.",
      ),
    },
    { label: t("Abgeschlossen am", "Concluded on"), value: formatDateTime(c.createdAt, locale) },
    { label: t("Vertragsnummer", "Contract number"), value: c.subscriptionId },
  ];
  const cancelUrl = siteUrl(locale, CANCEL_PATH);
  const withdrawUrl = siteUrl(locale, WITHDRAW_PATH);
  const a = (url: string) => `<a href="${escapeHtml(url)}" style="color:#0d8a5e">${escapeHtml(url)}</a>`;

  return {
    to: c.email ?? "",
    template: "contract-confirmation",
    idempotencyKey: `contract-confirmation/${c.subscriptionId}`,
    subject: t("Deine Vertragsbestätigung für Pairspace Basic", "Your contract confirmation for Pairspace Basic"),
    heading: t("Dein Abo ist abgeschlossen", "Your subscription is confirmed"),
    body: [
      escapeHtml(c.name ? t(`Hallo ${c.name},`, `Hi ${c.name},`) : t("Hallo,", "Hi,")),
      escapeHtml(
        t(
          "danke für dein Abo. Hiermit bestätigen wir dir den Vertrag. Unten stehen die AGB und die Widerrufsbelehrung mit dem Muster-Widerrufsformular, so wie sie für deinen Vertrag gelten. Bewahre diese Mail bitte auf.",
          "Thank you for subscribing. This email confirms your contract. Below you find the terms and the withdrawal notice with the model withdrawal form, as they apply to your contract. Please keep this email.",
        ),
      ),
      lineList(details),
      escapeHtml(
        t(
          "Du hast verlangt, dass Pairspace sofort startet. Widerrufst du nach der Testphase, aber innerhalb der Widerrufsfrist, zahlst du einen anteiligen Betrag für die bezahlte Zeit bis zu deinem Widerruf.",
          "You asked for Pairspace to start right away. If you withdraw after the trial but within the withdrawal period, you pay a proportionate amount for the paid time up to your withdrawal.",
        ),
      ),
      `${escapeHtml(t("Kündigen, ohne Anmeldung:", "Cancel, without signing in:"))} ${a(cancelUrl)}<br>${escapeHtml(
        t("Widerrufen, ohne Anmeldung:", "Withdraw, without signing in:"),
      )} ${a(withdrawUrl)}`,
    ],
    cta: { label: t("Zu deinem Abo", "Open your subscription"), url: siteUrl(locale, "/app/abo") },
    appendix: contractTexts(locale, c.termsVersion),
    footer: escapeHtml(
      t(
        `Vertragsbestätigung nach § 312f BGB. AGB und Widerrufsbelehrung, Stand ${c.termsVersion}. Pairspace, ${operatorLine(locale)}.`,
        `Contract confirmation under § 312f BGB. Terms and withdrawal notice as of ${version}. Pairspace, ${operatorLine(locale)}.`,
      ),
    ),
  };
}

export async function handleContractCreated(subscriptionId: string): Promise<{ confirmation: boolean }> {
  const ref = contractRef(subscriptionId);
  const c = (await ref.get()).data() as ContractRecord | undefined;
  if (!c) return { confirmation: false };
  if (!c.email) {
    console.warn("[contracts] no email for contract", subscriptionId);
    return { confirmation: false };
  }
  return { confirmation: await sendClaimed(ref, "confirmationAt", confirmationMail(c)) };
}

/* ------------------------------------------------------------- cancellation */

export function cancellationMail(c: ContractRecord, cancellation: ContractCancellation): Mail {
  const locale = c.locale;
  const t = translator(locale);
  const end = formatDate(cancellation.endsAt, locale);
  const details = [
    {
      label: t("Tarif", "Plan"),
      value: `${contractLabel(locale)}, ${c.interval === "year" ? t("jährlich", "yearly") : t("monatlich", "monthly")}`,
    },
    { label: t("Kündigung eingegangen", "Cancellation received"), value: formatDateTime(cancellation.requestedAt, locale) },
    { label: t("Vertragsende", "Contract ends"), value: end },
    { label: t("Vertragsnummer", "Contract number"), value: c.subscriptionId },
  ];
  const inTrial = c.trialEndsAt != null && cancellation.endsAt <= c.trialEndsAt;

  return {
    to: c.email ?? "",
    template: "contract-cancellation",
    idempotencyKey: `contract-cancellation/${c.subscriptionId}/${cancellation.requestedAt}`,
    subject: t("Deine Kündigung bei Pairspace ist bestätigt", "Your Pairspace cancellation is confirmed"),
    heading: t("Dein Abo ist gekündigt", "Your subscription is cancelled"),
    body: [
      escapeHtml(c.name ? t(`Hallo ${c.name},`, `Hi ${c.name},`) : t("Hallo,", "Hi,")),
      escapeHtml(
        t(
          `wir haben deine Kündigung erhalten. Dein Abo endet am ${end}. Bis dahin kannst du Pairspace wie gewohnt nutzen, danach wird nichts mehr abgebucht.`,
          `We have received your cancellation. Your subscription ends on ${end}. You can use Pairspace as usual until then, after that nothing more is charged.`,
        ) + (inTrial ? t(" Du hast in der Testphase gekündigt, du zahlst also nichts.", " You cancelled during the free trial, so you pay nothing.") : ""),
      ),
      lineList(details),
      escapeHtml(
        t(
          `Doch weitermachen? Unter „Abo verwalten“ kannst du die Kündigung bis zum ${end} zurücknehmen.`,
          `Changed your mind? Under “Manage subscription” you can undo the cancellation until ${end}.`,
        ),
      ),
      escapeHtml(
        t(
          "Bewahre diese Mail als Nachweis auf. Hast du nicht selbst gekündigt? Dann antworte bitte kurz auf diese Mail.",
          "Please keep this email as proof. Did you not cancel yourself? Then please reply to this email.",
        ),
      ),
    ],
    cta: { label: t("Zu deinem Abo", "Open your subscription"), url: siteUrl(locale, "/app/abo") },
    footer: escapeHtml(`Pairspace, ${operatorLine(locale)}.`),
  };
}

export async function handleContractCancelled(subscriptionId: string): Promise<{ cancellation: boolean }> {
  const ref = contractRef(subscriptionId);
  const c = (await ref.get()).data() as ContractRecord | undefined;
  // The receipt from /kuendigen already confirmed this one with its end date.
  if (!c?.cancellation || c.cancellation.source === "button") return { cancellation: false };
  if (!c.email) {
    console.warn("[contracts] no email for cancellation", subscriptionId);
    return { cancellation: false };
  }
  return { cancellation: await sendClaimed(ref, "cancellationAt", cancellationMail(c, c.cancellation)) };
}
