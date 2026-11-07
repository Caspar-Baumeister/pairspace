/**
 * Cloud Functions for Pairspace.
 *
 *   onFeedbackCreated    mails every wish, piece of feedback and bug report to Caspar
 *   onApplicantWritten   a complete profile mails the landlord once, and the other
 *                        applicants with notify on at most once a day (notify.ts)
 *   onApplicantDeleted   removes photos, contact, ballot and the ratings others
 *                        gave this person (cleanup.ts)
 *   onFlatDeleted        removes whatever is left below a deleted flat, applicant
 *                        and room photos included (cleanup.ts)
 *   unsubscribe          signed one-click link in every applicant mail, sets
 *                        notify: false (unsubscribe.ts)
 *   onContractRequestCreated  receipt for a cancellation or withdrawal from
 *                        /kuendigen or /widerrufen, plus a notice to Caspar (contracts.ts)
 *   onContractCreated    § 312f confirmation with the full AGB and
 *                        Widerrufsbelehrung when a subscription starts (contracts.ts)
 *   onContractUpdated    confirms a cancellation from the Stripe portal or from
 *                        Caspar in Stripe with its end date (contracts.ts)
 *
 * The handlers are plain functions, scripts/test-triggers.mjs runs them
 * against the emulators.
 */
import { setGlobalOptions } from "firebase-functions/v2";
import { onDocumentCreated, onDocumentDeleted, onDocumentUpdated, onDocumentWritten } from "firebase-functions/v2/firestore";
import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";

import { handleApplicantDeleted, handleFlatDeleted } from "./cleanup";
import { handleContractCancelled, handleContractCreated, handleContractRequest } from "./contracts";
import { send } from "./mail";
import { handleApplicantWritten } from "./notify";
import { escapeHtml } from "./templates";
import { handleUnsubscribe } from "./unsubscribe";

const RESEND_API_KEY = defineSecret("RESEND_API_KEY");

setGlobalOptions({ region: "europe-west1", maxInstances: 10 });

const FEEDBACK_TO = process.env.FEEDBACK_TO ?? "caspar.baumeister.privat@gmail.com";
const SITE = "https://joinpairspace.com";

const KIND: Record<string, string> = { idea: "Wunsch", feedback: "Feedback", bug: "Bug" };
const SOURCE: Record<string, string> = { landlord: "Vermieter", applicant: "Bewerber" };

export const onFeedbackCreated = onDocumentCreated(
  { document: "feedback/{feedbackId}", secrets: [RESEND_API_KEY] },
  async (event) => {
    const data = event.data?.data();
    if (!data) return;
    const kind = KIND[String(data.kind)] ?? String(data.kind);
    const source = SOURCE[String(data.source)] ?? String(data.source);
    const text = String(data.text ?? "").trim();
    const email = typeof data.email === "string" && data.email.includes("@") ? data.email : null;
    const page = String(data.page ?? "");
    const body = [
      `<strong>${escapeHtml(kind)}</strong> von einem ${escapeHtml(source)}, Seite ${escapeHtml(page) || "unbekannt"}, Sprache ${escapeHtml(String(data.locale ?? "?"))}.`,
      `"${escapeHtml(text).replace(/\n/g, "<br>")}"`,
      email
        ? `Antworten an: <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a>`
        : "Keine Mail angegeben, Antworten geht nicht.",
      `<span style="color:#9a9a9a">UID ${escapeHtml(String(data.uid ?? ""))}${data.flatId ? `, Wohnung ${escapeHtml(String(data.flatId))}` : ""}, ${escapeHtml(String(data.userAgent ?? ""))}</span>`,
    ];
    await send({
      to: FEEDBACK_TO,
      replyTo: email ?? undefined,
      subject: `Pairspace ${kind}: ${text.slice(0, 60).replace(/\s+/g, " ")}${text.length > 60 ? "…" : ""}`,
      heading: `${kind} aus der App`,
      body,
      cta: page ? { label: "Seite öffnen", url: `${SITE}${page}` } : undefined,
      footer: `Feedback ${event.params.feedbackId} in Firestore unter feedback/.`,
      template: "feedback",
    });
  },
);

const APPLICANT = "flats/{flatId}/applicants/{uid}";

export const onApplicantWritten = onDocumentWritten(
  { document: APPLICANT, secrets: [RESEND_API_KEY], timeoutSeconds: 300 },
  async (event) => {
    const after = event.data?.after;
    if (!after?.exists) return;
    await handleApplicantWritten(event.params.flatId, event.params.uid, after.data());
  },
);

export const onApplicantDeleted = onDocumentDeleted({ document: APPLICANT, timeoutSeconds: 300 }, async (event) => {
  await handleApplicantDeleted(event.params.flatId, event.params.uid, Date.parse(event.time));
});

export const onFlatDeleted = onDocumentDeleted({ document: "flats/{flatId}", timeoutSeconds: 300 }, async (event) => {
  await handleFlatDeleted(event.params.flatId, event.data?.get("ownerUid") as string | undefined);
});

/** https://europe-west1-pairspace-live.cloudfunctions.net/unsubscribe?f=<flatId>&u=<uid>&s=<sig> */
export const unsubscribe = onRequest({ secrets: [RESEND_API_KEY], invoker: "public", cors: false }, async (req, res) => {
  const page = await handleUnsubscribe(req.method, req.query as Record<string, unknown>);
  res.status(page.status).set(page.headers).send(req.method === "HEAD" ? "" : page.body);
});

export const onContractRequestCreated = onDocumentCreated(
  { document: "contractRequests/{requestId}", secrets: [RESEND_API_KEY] },
  async (event) => {
    await handleContractRequest(event.params.requestId);
  },
);

export const onContractCreated = onDocumentCreated(
  { document: "contracts/{subscriptionId}", secrets: [RESEND_API_KEY] },
  async (event) => {
    await handleContractCreated(event.params.subscriptionId);
  },
);

export const onContractUpdated = onDocumentUpdated(
  { document: "contracts/{subscriptionId}", secrets: [RESEND_API_KEY] },
  async (event) => {
    const before = event.data?.before.get("cancellation") as { requestedAt?: number } | undefined;
    const after = event.data?.after.get("cancellation") as { requestedAt?: number } | undefined;
    if (!after || before?.requestedAt === after.requestedAt) return;
    await handleContractCancelled(event.params.subscriptionId);
  },
);
