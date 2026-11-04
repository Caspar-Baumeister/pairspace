"use client";

import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo } from "react";

import { basePath, LOCALE_COOKIE, localePath, translator, type Locale, type T } from "./index";

const LocaleContext = createContext<Locale>("de");

export function I18nProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return (
    <LocaleContext value={locale}>
      <LocaleRedirect />
      {children}
    </LocaleContext>
  );
}

export function useLocale(): Locale {
  return useContext(LocaleContext);
}

export function useT(): T {
  const locale = useLocale();
  return useMemo(() => translator(locale), [locale]);
}

/** Turns "/app/neu" into "/en/app/neu" on English pages. */
export function useLocalePath(): (path: string) => string {
  const locale = useLocale();
  return useCallback((path: string) => localePath(locale, path), [locale]);
}

function savedLocale(): Locale | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE}=(de|en)`));
  return (match?.[1] as Locale | undefined) ?? null;
}

/** Switches the whole site and remembers the choice for a year. */
export function useSwitchLocale(): (locale: Locale) => void {
  const pathname = usePathname();
  const router = useRouter();
  return useCallback(
    (locale: Locale) => {
      document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
      router.replace(localePath(locale, basePath(pathname)) + window.location.search + window.location.hash, { scroll: false });
    },
    [pathname, router],
  );
}

const BOT = /bot|crawl|spider|slurp|lighthouse|headless|preview/i;

/**
 * Sends people to the language they picked before. Without a choice, a
 * browser that does not speak German leaves the German pages for English.
 * Never the other way round, an /en link stays English.
 */
function LocaleRedirect() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (BOT.test(navigator.userAgent)) return;
    const saved = savedLocale();
    const speaksGerman = (navigator.languages ?? [navigator.language]).some((l) => l.toLowerCase().startsWith("de"));
    const want: Locale | null = saved ?? (locale === "de" && !speaksGerman ? "en" : null);
    if (!want || want === locale) return;
    router.replace(localePath(want, basePath(pathname)) + window.location.search + window.location.hash, { scroll: false });
    // Only when the page language changes, not on every navigation inside it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  return null;
}
