/**
 * One-click unsubscribe for the "new people to rate" mails.
 *
 *   GET  ?f=<flatId>&u=<uid>&s=<sig>   small page with a button, changes nothing
 *                                      (mail scanners open links on their own)
 *   POST same URL                      sets notify: false in private/contact.
 *                                      Also the RFC 8058 one-click POST from
 *                                      Gmail and others, body List-Unsubscribe=One-Click.
 *
 * sig is base64url HMAC-SHA256 of "flatId:uid", keyed with RESEND_API_KEY, so
 * no extra secret is needed. Rotating that key makes old links stop working.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

import { db, isEmulator } from "./admin";
import { escapeHtml } from "./templates";

const ID = /^[A-Za-z0-9_-]{1,128}$/;

/** Where the function answers. Override with UNSUBSCRIBE_URL, for example behind a rewrite. */
export function unsubscribeBase(): string {
  const project = process.env.GCLOUD_PROJECT ?? "pairspace-live";
  return process.env.UNSUBSCRIBE_URL ?? `https://europe-west1-${project}.cloudfunctions.net/unsubscribe`;
}

function signingKey(): string | null {
  return process.env.RESEND_API_KEY || (isEmulator() ? "pairspace-emulator-unsubscribe" : null);
}

export function sign(flatId: string, uid: string): string | null {
  const key = signingKey();
  return key ? createHmac("sha256", key).update(`${flatId}:${uid}`).digest("base64url") : null;
}

/** The personal link for one applicant of one flat, or null without a key. */
export function unsubscribeUrl(flatId: string, uid: string): string | null {
  const s = sign(flatId, uid);
  if (!s) return null;
  const q = new URLSearchParams({ f: flatId, u: uid, s });
  return `${unsubscribeBase()}?${q.toString()}`;
}

function valid(flatId: unknown, uid: unknown, sig: unknown): flatId is string {
  if (typeof flatId !== "string" || typeof uid !== "string" || typeof sig !== "string") return false;
  if (!ID.test(flatId) || !ID.test(uid)) return false;
  const expected = sign(flatId, uid);
  if (!expected) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(sig);
  // Same length first, timingSafeEqual throws otherwise. The length of a
  // signature is public anyway.
  return a.length === b.length && timingSafeEqual(a, b);
}

export interface PageResponse {
  status: number;
  headers: Record<string, string>;
  body: string;
}

const HEADERS = {
  "Content-Type": "text/html; charset=utf-8",
  "Cache-Control": "no-store",
  "X-Robots-Tag": "noindex",
  "Referrer-Policy": "no-referrer",
  "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'",
};

function page(status: number, title: string, lines: string[], form?: { action: string; label: string }): PageResponse {
  const font = "-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif";
  const button = form
    ? `<form method="post" action="${escapeHtml(form.action)}"><input type="hidden" name="List-Unsubscribe" value="One-Click"><button type="submit" style="margin-top:8px;padding:12px 22px;border:0;border-radius:999px;background:#0d8a5e;color:#fff;font:500 15px/1 ${font};cursor:pointer">${form.label}</button></form>`
    : "";
  const body = `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Pairspace</title></head>
<body style="margin:0;background:#faf5f2;padding:32px 16px;font:400 15px/1.6 ${font};color:#3C3C42">
<div style="max-width:520px;margin:0 auto;background:#fff;border:1px solid #f0e5e0;border-radius:20px;padding:32px">
<p style="margin:0 0 20px;font-weight:600;color:#221418">Pairspace</p>
<h1 style="margin:0 0 16px;font:700 22px/1.3 ${font};color:#221418">${title}</h1>
${lines.map((l) => `<p style="margin:0 0 14px">${l}</p>`).join("")}
${button}
</div></body></html>`;
  return { status, headers: HEADERS, body };
}

const refused = () =>
  page(403, "Dieser Link funktioniert nicht.<br>This link does not work.", [
    "Schalte die Mails in deiner Bewerbung unter \"Mail bei neuen Mitbewerbern\" aus.",
    "Switch the emails off in your application under \"Email me about new applicants\".",
  ]);

/**
 * The whole endpoint as a plain function, so scripts can call it without HTTP.
 * `query` carries f, u and s. The POST body is not needed, any POST with a
 * valid signature unsubscribes.
 */
export async function handleUnsubscribe(method: string, query: Record<string, unknown>): Promise<PageResponse> {
  const { f, u, s } = query;
  const m = method.toUpperCase();
  if (m !== "GET" && m !== "HEAD" && m !== "POST") return { ...refused(), status: 405 };
  if (!valid(f, u, s)) return refused();
  const flatId = f;
  const uid = u as string;

  if (m !== "POST") {
    const action = `?${new URLSearchParams({ f: flatId, u: uid, s: s as string }).toString()}`;
    return page(
      200,
      "Keine Mails mehr zu neuen Mitbewerbern?<br>No more emails about new applicants?",
      [
        "Deine Bewerbung bleibt, wie sie ist. Du bekommst nur keine Mail mehr, wenn jemand Neues dazukommt.",
        "Your application stays as it is. You just won't get an email when someone new joins.",
      ],
      { action, label: "Abmelden · Unsubscribe" },
    );
  }

  // update() never brings back a contact that was deleted with the application.
  await db()
    .doc(`flats/${flatId}/applicants/${uid}/private/contact`)
    .update({ notify: false, updatedAt: Date.now() })
    .catch((e: { code?: number }) => {
      if (e.code !== 5) throw e;
    });
  return page(200, "Erledigt.<br>Done.", [
    "Du bekommst keine Mails mehr zu neuen Mitbewerbern. Wieder einschalten kannst du sie in deiner Bewerbung.",
    "You won't get emails about new applicants any more. You can switch them back on in your application.",
  ]);
}
