import { FieldValue } from "firebase-admin/firestore";
import { Resend } from "resend";

import { db, isEmulator } from "./admin";

const FROM = process.env.MAIL_FROM ?? "Pairspace <hello@joinpairspace.com>";

let client: Resend | null = null;

function resend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!client) client = new Resend(key);
  return client;
}

export interface Mail {
  to: string;
  /** Where a reply goes, for example the person who sent feedback. */
  replyTo?: string;
  subject: string;
  heading: string;
  body: string[];
  cta?: { label: string; url: string };
  footer?: string;
  /** Short name for logs and the dev outbox, for example "landlord-new-applicant". */
  template?: string;
  /** Resend drops a second send with the same key within 24 hours. */
  idempotencyKey?: string;
  /** Extra mail headers, for example List-Unsubscribe. */
  headers?: Record<string, string>;
  /**
   * Long text after the button, already rendered, for example the full AGB in
   * a contract confirmation. `html` is trusted markup, escape typed text first.
   */
  appendix?: { html: string; text: string };
}

/** Plain, quiet HTML that renders the same in every client. */
function render(mail: Mail): string {
  const paragraphs = mail.body
    .map(
      (p) =>
        `<p style="margin:0 0 14px;font:400 15px/1.6 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#3C3C42">${p}</p>`,
    )
    .join("");

  const cta = mail.cta
    ? `<a href="${mail.cta.url}" style="display:inline-block;margin-top:8px;padding:12px 22px;border-radius:999px;background:#0d8a5e;color:#ffffff;text-decoration:none;font:500 15px/1 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">${mail.cta.label}</a>`
    : "";

  return `<!doctype html><html><body style="margin:0;background:#faf5f2;padding:32px 16px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <table role="presentation" width="100%" style="max-width:520px;background:#ffffff;border:1px solid #f0e5e0;border-radius:20px" cellpadding="0" cellspacing="0">
      <tr><td style="padding:32px">
        <p style="margin:0 0 20px;font:600 15px/1 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#221418">Pairspace</p>
        <h1 style="margin:0 0 16px;font:700 24px/1.25 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#221418;letter-spacing:-0.02em">${mail.heading}</h1>
        ${paragraphs}
        ${cta}
        ${mail.appendix ? `<div style="margin-top:28px;padding-top:20px;border-top:1px solid #f0e5e0">${mail.appendix.html}</div>` : ""}
      </td></tr>
      <tr><td style="padding:18px 32px;border-top:1px solid #f0e5e0">
        <p style="margin:0;font:400 12px/1.5 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#b5a3aa">${
          mail.footer ??
          "You are receiving this because you joined an event on Pairspace. Your address is used for this event only."
        }</p>
      </td></tr>
    </table>
  </td></tr></table></body></html>`;
}

/** Resend allows a few requests per second, so one instance never fires them back to back. */
const GAP_MS = 600;
let nextSlot = 0;

async function pace(): Promise<void> {
  const now = Date.now();
  const wait = Math.max(0, nextSlot - now);
  nextSlot = Math.max(now, nextSlot) + GAP_MS;
  if (wait) await new Promise((r) => setTimeout(r, wait));
}

function plainText(mail: Mail): string {
  return [
    stripTags(mail.heading),
    ...mail.body.map(stripTags),
    mail.cta?.url ?? "",
    mail.appendix?.text ?? "",
    mail.footer ? stripTags(mail.footer) : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

/**
 * Sends one mail and returns true when Resend accepted it.
 *
 * In the emulator nothing leaves the machine: the mail is written to the
 * devOutbox collection, where scripts and the emulator UI can read it.
 *
 * The Resend SDK never throws. A rejected request, for example an unverified
 * sender domain or a recipient the account may not write to, comes back as
 * `{ error }`. That has to be logged loudly, otherwise the whole notification
 * side of the product fails in silence.
 */
export async function send(mail: Mail): Promise<boolean> {
  if (isEmulator()) {
    await db().collection("devOutbox").add({
      channel: "email",
      template: mail.template ?? null,
      idempotencyKey: mail.idempotencyKey ?? null,
      headers: mail.headers ?? null,
      to: mail.to,
      replyTo: mail.replyTo ?? null,
      subject: mail.subject,
      text: plainText(mail),
      html: render(mail),
      createdAt: FieldValue.serverTimestamp(),
    });
    console.log("[mail to devOutbox]", { to: mail.to, subject: mail.subject, template: mail.template });
    return true;
  }
  const api = resend();
  if (!api) {
    console.warn("[mail skipped, no RESEND_API_KEY]", mail.to, mail.subject);
    return false;
  }
  for (let attempt = 1; ; attempt++) {
    await pace();
    const { data, error } = await api.emails.send(
      {
        from: FROM,
        to: mail.to,
        replyTo: mail.replyTo,
        subject: mail.subject,
        html: render(mail),
        text: plainText(mail),
        headers: mail.headers,
      },
      mail.idempotencyKey ? { idempotencyKey: mail.idempotencyKey } : undefined,
    );
    if (!error) {
      console.log("[mail sent]", { id: data?.id, to: mail.to, subject: mail.subject, template: mail.template });
      return true;
    }
    if (error.name === "rate_limit_exceeded" && attempt < 4) {
      await new Promise((r) => setTimeout(r, 1000 * attempt));
      continue;
    }
    console.error("[mail failed]", { to: mail.to, subject: mail.subject, template: mail.template, from: FROM, error });
    return false;
  }
}

/** Plain text twin of the HTML. Links keep their address, entities turn back into characters. */
function stripTags(html: string): string {
  return html
    .replace(/<a\s[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g, "$2: $1")
    .replace(/<[^>]+>/g, "")
    .replace(/&(amp|lt|gt|quot|#39);/g, (_, e: string) => ({ amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'" })[e]!);
}
