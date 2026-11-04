/**
 * Cloud Functions for Pairspace.
 *
 * Live: onFeedbackCreated mails every wish, piece of feedback and bug report
 * from the app to Caspar.
 *
 * Planned: mail the landlord when a profile is complete, and mail applicants
 * who opted in when someone new joins whom they have not rated yet.
 */
import { setGlobalOptions } from "firebase-functions/v2";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { defineSecret } from "firebase-functions/params";

import { send } from "./mail";

const RESEND_API_KEY = defineSecret("RESEND_API_KEY");

setGlobalOptions({ region: "europe-west1", maxInstances: 10 });

const FEEDBACK_TO = process.env.FEEDBACK_TO ?? "caspar.baumeister.privat@gmail.com";
const SITE = "https://joinpairspace.com";

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

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
    });
  },
);
