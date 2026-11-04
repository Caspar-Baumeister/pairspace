"use client";

import { Check } from "lucide-react";
import { useState } from "react";

import { Spinner } from "@/components/ui/Spinner";
import type { T } from "@/lib/i18n";
import { useLocale, useT } from "@/lib/i18n/client";
import { BASIC, euro } from "@/lib/plans";
import type { PlanInterval } from "@/lib/types";

export function basicFeatures(t: T): string[] {
  return [
    t("Unbegrenzte Wohnungen", "Unlimited flats"),
    t("Unbegrenzt viele Bewerber", "Unlimited applicants"),
    t("Matching Graph mit Clustern", "Matching graph with clusters"),
    t("Beste Gruppen samt Zimmerverteilung", "Best groups including who gets which room"),
    t("Eigener Link und QR Code für deine Anzeige", "Your own link and QR code for your listing"),
  ];
}

/**
 * Monthly and yearly Basic. `onChoose` decides what the button does: on the
 * public page it leads to sign up, inside the app it starts the trial.
 */
export function PricingCards({
  onChoose,
  cta,
  current,
}: {
  onChoose: (interval: PlanInterval) => Promise<void> | void;
  cta?: string;
  current?: PlanInterval | null;
}) {
  const t = useT();
  const locale = useLocale();
  const [busy, setBusy] = useState<PlanInterval | null>(null);
  const yearlySaving = BASIC.monthly * 12 - BASIC.yearly;
  const days = BASIC.trialDays;
  const label = cta ?? t(`${days} Tage kostenlos testen`, `Try free for ${days} days`);

  const choose = async (interval: PlanInterval) => {
    setBusy(interval);
    try {
      await onChoose(interval);
    } finally {
      setBusy(null);
    }
  };

  const perMonth = euro(Math.round((BASIC.yearly / 12) * 100) / 100, locale);
  const plans: { interval: PlanInterval; price: string; per: string; note: string; badge?: string }[] = [
    {
      interval: "month",
      price: euro(BASIC.monthly, locale),
      per: t("pro Monat", "per month"),
      note: t(`${days} Tage kostenlos, danach monatlich kündbar`, `Free for ${days} days, then cancel any month`),
    },
    {
      interval: "year",
      price: euro(BASIC.yearly, locale),
      per: t("pro Jahr", "per year"),
      note: t(`${days} Tage kostenlos, entspricht ${perMonth} im Monat`, `Free for ${days} days, works out at ${perMonth} per month`),
      badge: t(`${euro(Math.round(yearlySaving), locale)} gespart`, `Save ${euro(Math.round(yearlySaving), locale)}`),
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {plans.map((p) => (
        <div
          key={p.interval}
          className={`card relative flex flex-col p-5 ${p.interval === "year" ? "border-accent-line" : ""}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-ui-small font-semibold text-muted">
              {p.interval === "month" ? t("Basic monatlich", "Basic monthly") : t("Basic jährlich", "Basic yearly")}
            </span>
            {p.badge ? <span className="tag">{p.badge}</span> : null}
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-[32px] font-bold tracking-[-0.02em]">{p.price}</span>
            <span className="text-ui-small text-faint">{p.per}</span>
          </div>
          <p className="mt-1 text-ui-smaller text-muted">{p.note}</p>
          <ul className="mt-4 flex-1 space-y-2">
            {basicFeatures(t).map((f) => (
              <li key={f} className="flex items-start gap-2 text-ui-small text-muted">
                <Check size={14} strokeWidth={2} className="mt-[3px] shrink-0 text-accent" />
                {f}
              </li>
            ))}
          </ul>
          <button
            type="button"
            className={`btn btn-lg mt-5 w-full ${p.interval === "year" ? "btn-cta" : ""}`}
            disabled={busy !== null || current === p.interval}
            onClick={() => choose(p.interval)}
          >
            {busy === p.interval ? <Spinner size={14} /> : null}
            {current === p.interval ? t("Aktueller Tarif", "Current plan") : label}
          </button>
        </div>
      ))}
    </div>
  );
}
