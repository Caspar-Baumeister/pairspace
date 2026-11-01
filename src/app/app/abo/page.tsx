"use client";

import { CreditCard } from "lucide-react";
import { useState } from "react";

import { PaneBody, PaneHeader, useShell } from "@/components/app/AppShell";
import { PricingCards } from "@/components/app/PricingCards";
import { ErrorText, Setting } from "@/components/ui/Field";
import { startSubscription } from "@/lib/billing";
import { isActive } from "@/lib/plans";

function date(ms: number) {
  return new Date(ms).toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" });
}

export default function SubscriptionPage() {
  const { landlord } = useShell();
  const [error, setError] = useState("");
  const sub = landlord?.subscription;
  const active = isActive(sub);

  return (
    <>
      <PaneHeader icon={CreditCard} title="Abo" />
      <PaneBody wide>
        <h1 className="h1">Abo</h1>
        {active && sub ? (
          <div className="mt-4">
            <Setting name="Tarif" description={sub.interval === "year" ? "Basic, jährlich" : "Basic, monatlich"} />
            <Setting
              name="Status"
              description={
                sub.status === "trialing"
                  ? `Testphase bis ${date(sub.trialEndsAt ?? sub.currentPeriodEnd)}`
                  : `Aktiv bis ${date(sub.currentPeriodEnd)}, verlängert sich automatisch`
              }
            />
            <Setting name="Zahlung und Kündigung" description="Kommt mit der Stripe Anbindung. Im Prototyp gibt es noch keine Zahlungsdaten." />
          </div>
        ) : (
          <p className="mt-2 text-muted">
            Mit einem Abo wird dein Einladungslink freigeschaltet. Die ersten 7 Tage sind kostenlos.
          </p>
        )}
        <div className="mt-8">
          <PricingCards
            current={active ? sub?.interval : null}
            cta={active ? "Wechseln" : undefined}
            onChoose={async (interval) => {
              setError("");
              try {
                await startSubscription(interval);
              } catch {
                setError("Das hat nicht geklappt. Bitte versuch es nochmal.");
              }
            }}
          />
        </div>
        <div className="mt-3">
          <ErrorText>{error}</ErrorText>
        </div>
      </PaneBody>
    </>
  );
}
