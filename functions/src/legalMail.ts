/**
 * Renders the shared legal texts (functions/src/shared) into mail HTML and
 * plain text, for the contract confirmation. Same text as the website, so a
 * change to the AGB reaches both at once.
 */
import type { Block, Inline, LegalDoc, Locale } from "./shared/doc";
import { SITE } from "./shared/operator";
import { escapeHtml } from "./templates";

const FONT = "-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif";
const STYLE = {
  title: `margin:0 0 4px;font:700 19px/1.3 ${FONT};color:#221418`,
  meta: `margin:0 0 14px;font:400 12px/1.5 ${FONT};color:#9a8a90`,
  section: `margin:18px 0 8px;font:600 15px/1.4 ${FONT};color:#221418`,
  h3: `margin:14px 0 6px;font:600 13px/1.4 ${FONT};color:#221418`,
  p: `margin:0 0 10px;font:400 13px/1.55 ${FONT};color:#3C3C42`,
  small: `margin:0 0 10px;font:400 12px/1.5 ${FONT};color:#9a8a90`,
  li: `margin:0 0 6px;font:400 13px/1.55 ${FONT};color:#3C3C42`,
  box: "margin:0 0 12px;padding:14px 16px 4px;border:1px solid #f0e5e0;border-radius:12px;background:#fcf9f7",
  line: `margin:0 0 14px;padding-bottom:16px;border-bottom:1px solid #e6dad4;font:400 13px/1.5 ${FONT};color:#3C3C42`,
  link: "color:#0d8a5e",
};

/** Site paths get the domain and the language prefix, mailto stays as it is. */
function url(href: string, locale: Locale): string {
  return href.startsWith("/") ? `${SITE}${locale === "en" ? "/en" : ""}${href}` : href;
}

function inlineHtml(parts: Inline[], locale: Locale): string {
  return parts
    .map((part) => {
      if (typeof part === "string") return escapeHtml(part);
      if ("b" in part) return `<strong>${escapeHtml(part.b)}</strong>`;
      return `<a href="${escapeHtml(url(part.href, locale))}" style="${STYLE.link}">${escapeHtml(part.a)}</a>`;
    })
    .join("");
}

/** Plain text: a site link shows its address after the words, a mail address is already the words. */
function inlinePlain(parts: Inline[], locale: Locale): string {
  return parts
    .map((part) => {
      if (typeof part === "string") return part;
      if ("b" in part) return part.b;
      return part.href.startsWith("/") ? `${part.a} (${url(part.href, locale)})` : part.a;
    })
    .join("");
}

function blockHtml(block: Block, locale: Locale): string {
  switch (block.kind) {
    case "p":
      return `<p style="${block.small ? STYLE.small : STYLE.p}">${inlineHtml(block.text, locale)}</p>`;
    case "h3":
      return `<p style="${STYLE.h3}">${escapeHtml(block.text)}</p>`;
    case "ul":
      return `<ul style="margin:0 0 10px;padding-left:20px">${block.items
        .map((item) => `<li style="${STYLE.li}">${inlineHtml(item, locale)}</li>`)
        .join("")}</ul>`;
    case "box":
      return `<div style="${STYLE.box}">${block.blocks.map((b) => blockHtml(b, locale)).join("")}</div>`;
    case "lines":
      return block.items.map((line) => `<p style="${STYLE.line}">${escapeHtml(line)}</p>`).join("");
  }
}

function blockPlain(block: Block, locale: Locale): string {
  switch (block.kind) {
    case "p":
      return inlinePlain(block.text, locale);
    case "h3":
      return block.text;
    case "ul":
      return block.items.map((item) => `• ${inlinePlain(item, locale)}`).join("\n");
    case "box":
      return block.blocks.map((b) => blockPlain(b, locale)).join("\n\n");
    case "lines":
      return block.items.map((line) => `${line}: ____________________`).join("\n\n");
  }
}

/** One document, the "Stand" line under the title. */
export function legalDocMail(doc: LegalDoc, locale: Locale, version: string): { html: string; text: string } {
  const stand = locale === "en" ? `Last updated: ${version}` : `Stand: ${version}`;
  const title = (i: number, s: string) => (doc.numbered ? `${i + 1}. ${s}` : s);
  const html = [
    `<p style="${STYLE.title}">${escapeHtml(doc.title)}</p>`,
    `<p style="${STYLE.meta}">${escapeHtml(stand)}</p>`,
    doc.lead ? `<p style="${STYLE.p}">${escapeHtml(doc.lead)}</p>` : "",
    ...doc.sections.map(
      (s, i) =>
        `<p style="${STYLE.section}">${escapeHtml(title(i, s.title))}</p>${s.blocks.map((b) => blockHtml(b, locale)).join("")}`,
    ),
  ].join("");
  const text = [
    doc.title.toUpperCase(),
    stand,
    doc.lead ?? "",
    ...doc.sections.map((s, i) => `${title(i, s.title)}\n\n${s.blocks.map((b) => blockPlain(b, locale)).join("\n\n")}`),
  ]
    .filter(Boolean)
    .join("\n\n");
  return { html, text };
}

/** Several documents one after the other, with a rule between them. */
export function joinDocs(parts: { html: string; text: string }[]): { html: string; text: string } {
  return {
    html: parts.map((p) => p.html).join('<div style="margin:24px 0;border-top:1px solid #f0e5e0"></div>'),
    text: parts.map((p) => p.text).join("\n\n\n"),
  };
}
