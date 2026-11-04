/**
 * Legal texts as plain data, so one source feeds both the website and the
 * contract confirmation mail (a link is not a durable medium, the mail has to
 * carry the full text).
 *
 * Everything in functions/src/shared is also compiled by the Next app through
 * the @shared alias in the root tsconfig. Rules for this folder: no imports
 * from outside it, no Node, React or DOM APIs.
 */

export type Locale = "de" | "en";

/** Picks the text for one language, like t("Deutsch", "English") in the app. */
export type T = (de: string, en: string) => string;

export function translator(locale: Locale): T {
  return locale === "en" ? (_de, en) => en : (de) => de;
}

/**
 * Inline text. `href` is a site path such as "/widerruf" (the website adds the
 * language prefix, the mail the full domain) or a mailto: link.
 */
export type Inline = string | { b: string } | { a: string; href: string };

export type Block =
  | { kind: "p"; text: Inline[]; small?: boolean }
  | { kind: "h3"; text: string }
  | { kind: "ul"; items: Inline[][] }
  /** A framed block, used for the statutory notice and the model form. */
  | { kind: "box"; blocks: Block[] }
  /** Lines to fill in, used by the model withdrawal form. */
  | { kind: "lines"; items: string[] };

export interface DocSection {
  id: string;
  title: string;
  blocks: Block[];
}

export interface LegalDoc {
  title: string;
  lead?: string;
  numbered: boolean;
  sections: DocSection[];
}

export const p = (...text: Inline[]): Block => ({ kind: "p", text });
export const small = (...text: Inline[]): Block => ({ kind: "p", text, small: true });
export const h3 = (text: string): Block => ({ kind: "h3", text });
export const ul = (...items: (Inline | Inline[])[]): Block => ({
  kind: "ul",
  items: items.map((i) => (Array.isArray(i) ? i : [i])),
});
export const box = (...blocks: Block[]): Block => ({ kind: "box", blocks });
export const lines = (...items: string[]): Block => ({ kind: "lines", items });
export const link = (a: string, href: string): Inline => ({ a, href });
export const b = (text: string): Inline => ({ b: text });

/** Plain text of inline parts, links keep their visible text. */
export function inlineText(parts: Inline[]): string {
  return parts.map((part) => (typeof part === "string" ? part : "b" in part ? part.b : part.a)).join("");
}
