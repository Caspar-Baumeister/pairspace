"use client";

import { Check } from "lucide-react";
import { useState } from "react";

import { Spinner } from "@/components/ui/Spinner";
import { BASIC, euro } from "@/lib/plans";
import type { PlanInterval } from "@/lib/types";

export const BASIC_FEATURES = [
  "Unbegrenzte Wohnungen",
  "Unbegrenzt viele Bewerber",
  "Matching Graph mit Clustern",
  "Beste Gruppen samt Zimmerverteilung",
  "Eigener Link und QR Code für deine Anzeige",
];

/**
 * Monthly and yearly Basic. `onChoose` decides what the button does: on the
 * public page it leads to sign up, inside the app it starts the trial.
 */
export function PricingCards({
  onChoose,
  cta = `${BASIC.trialDays} Tage kostenlos testen`,
  current,
}: {
  onChoose: (interval: PlanInterval) => Promise<void> | void;
  cta?: string;
  current?: PlanInterval | null;
}) {
  const [busy, setBusy] = useState<PlanInterval | null>(null);
  const yearlySaving = BASIC.monthly * 12 - BASIC.yearly;

  const choose = async (interval: PlanInterval) => {
    setBusy(interval);
    try {
      await onChoose(interval);
    } finally {
      setBusy(null);
    }
  };

  const plans: { interval: PlanInterval; price: string; per: string; note: string; badge?: string }[] = [
    {
      interval: "month",
      price: euro(BASIC.monthly),
      per: "pro Monat",
      note: `${BASIC.trialDays} Tage kostenlos, danach monatlich kündbar`,
    },
    {
      interval: "year",
      price: euro(BASIC.yearly),
      per: "pro Jahr",
      note: `${BASIC.trialDays} Tage kostenlos, entspricht ${euro(Math.round((BASIC.yearly / 12) * 100) / 100)} im Monat`,
      badge: `${euro(Math.round(yearlySaving))} gespart`,
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
              Basic {p.interval === "month" ? "monatlich" : "jährlich"}
            </span>
            {p.badge ? <span className="tag">{p.badge}</span> : null}
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-[32px] font-bold tracking-[-0.02em]">{p.price}</span>
            <span className="text-ui-small text-faint">{p.per}</span>
          </div>
          <p className="mt-1 text-ui-smaller text-muted">{p.note}</p>
          <ul className="mt-4 flex-1 space-y-2">
            {BASIC_FEATURES.map((f) => (
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
            {current === p.interval ? "Aktueller Tarif" : cta}
          </button>
        </div>
      ))}
    </div>
  );
}
