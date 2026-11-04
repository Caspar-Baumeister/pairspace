"use client";

import { Globe } from "lucide-react";

import { track } from "@/lib/analytics";
import type { Locale } from "@/lib/i18n";
import { useLocale, useSwitchLocale } from "@/lib/i18n/client";

/**
 * DE | EN. Switches the whole site, the choice is remembered.
 * `source` says where it was used, for the analytics event.
 */
export function LanguageSwitch({ source, className = "" }: { source: string; className?: string }) {
  const locale = useLocale();
  const switchTo = useSwitchLocale();
  const pick = (to: Locale) => {
    if (to === locale) return;
    track("language_switched", { to, source });
    switchTo(to);
  };
  return (
    <div
      className={`inline-flex items-center gap-0.5 text-ui-small ${className}`}
      role="group"
      aria-label={locale === "en" ? "Language" : "Sprache"}
    >
      <Globe size={14} strokeWidth={1.75} className="mr-1 text-faint" aria-hidden="true" />
      {(["de", "en"] as const).map((l) => (
        <button
          key={l}
          type="button"
          lang={l}
          aria-pressed={locale === l}
          aria-label={l === "de" ? "Deutsch" : "English"}
          onClick={() => pick(l)}
          className={`rounded-md px-1.5 py-1 font-medium uppercase transition-colors ${
            locale === l ? "text-ink" : "text-faint hover:text-muted"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
