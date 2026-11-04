/**
 * Two languages, chosen by the URL: German has no prefix (/preise), English
 * lives under /en (/en/preise). next.config rewrites the German paths onto the
 * [lang] segment, so every page is still prerendered once per language.
 *
 * Copy stays next to the code that shows it: t("Deutsch", "English").
 */

export const LOCALES = ["de", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "de";

/** Set only when someone picks a language, never guessed. */
export const LOCALE_COOKIE = "lang";

export function isLocale(value: unknown): value is Locale {
  return value === "de" || value === "en";
}

export function toLocale(value: unknown): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export type T = (de: string, en: string) => string;

export function translator(locale: Locale): T {
  return locale === "en" ? (_de, en) => en : (de) => de;
}

/** The path for this language. Takes paths without prefix, query and hash are kept. */
export function localePath(locale: Locale, path: string): string {
  if (locale === DEFAULT_LOCALE || !path.startsWith("/")) return path;
  if (path === "/" || path.startsWith("/?") || path.startsWith("/#")) return `/en${path.slice(1)}`;
  return `/en${path}`;
}

/** The browser path without the language prefix. */
export function basePath(pathname: string): string {
  if (pathname === "/en") return "/";
  if (pathname.startsWith("/en/")) return pathname.slice(3);
  return pathname;
}

/** For Intl: dates and money. British English writes €9.99 and 3 Nov 2026. */
export function intlLocale(locale: Locale): string {
  return locale === "en" ? "en-GB" : "de-DE";
}

/** hreflang links for a public page, path without prefix. */
export function alternates(locale: Locale, path: string) {
  return {
    canonical: localePath(locale, path),
    languages: { de: path, en: localePath("en", path), "x-default": path },
  };
}
