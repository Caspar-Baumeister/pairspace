import { Resend } from "resend";

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
  subject: string;
  heading: string;
  body: string[];
  cta?: { label: string; url: string };
  footer?: string;
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

/**
 * Sends one mail and returns true when Resend accepted it.
 *
 * The Resend SDK never throws. A rejected request, for example an unverified
 * sender domain or a recipient the account may not write to, comes back as
 * `{ error }`. That has to be logged loudly, otherwise the whole notification
 * side of the product fails in silence.
 */
export async function send(mail: Mail): Promise<boolean> {
  const api = resend();
  if (!api) {
    console.warn("[mail skipped, no RESEND_API_KEY]", mail.to, mail.subject);
    return false;
  }
  const { data, error } = await api.emails.send({
    from: FROM,
    to: mail.to,
    subject: mail.subject,
    html: render(mail),
    text: [mail.heading, ...mail.body.map(stripTags), mail.cta?.url ?? ""].join("\n\n"),
  });
  if (error) {
    console.error("[mail failed]", { to: mail.to, subject: mail.subject, from: FROM, error });
    return false;
  }
  console.log("[mail sent]", { id: data?.id, to: mail.to, subject: mail.subject });
  return true;
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, "");
}
