"use client";

import { CreditCard } from "lucide-react";
import { useState } from "react";

import { PaneBody, PaneHeader, useShell } from "@/components/app/AppShell";
import { PricingCards } from "@/components/app/PricingCards";
import { ErrorText, Setting } from "@/components/ui/Field";
import { track } from "@/lib/analytics";
import { startSubscription } from "@/lib/billing";
import { intlLocale } from "@/lib/i18n";
import { useLocale, useT } from "@/lib/i18n/client";
import { BASIC, isActive } from "@/lib/plans";

export default function SubscriptionPage() {
  const { landlord } = useShell();
  const t = useT();
  const locale = useLocale();
  const [error, setError] = useState("");
  const sub = landlord?.subscription;
  const active = isActive(sub);

  const date = (ms: number) =>
    new Date(ms).toLocaleDateString(intlLocale(locale), { day: "numeric", month: "long", year: "numeric" });

  return (
    <>
      <PaneHeader icon={CreditCard} title={t("Abo", "Subscription")} />
      <PaneBody wide>
        <h1 className="h1">{t("Abo", "Subscription")}</h1>
        {active && sub ? (
          <div className="mt-4">
            <Setting
              name={t("Tarif", "Plan")}
              description={sub.interval === "year" ? t("Basic, jährlich", "Basic, yearly") : t("Basic, monatlich", "Basic, monthly")}
            />
            <Setting
              name="Status"
              description={
                sub.status === "trialing"
                  ? t(
                      `Testphase bis ${date(sub.trialEndsAt ?? sub.currentPeriodEnd)}`,
                      `Free trial until ${date(sub.trialEndsAt ?? sub.currentPeriodEnd)}`,
                    )
                  : t(
                      `Aktiv bis ${date(sub.currentPeriodEnd)}, verlängert sich automatisch`,
                      `Active until ${date(sub.currentPeriodEnd)}, renews automatically`,
                    )
              }
            />
            <Setting
              name={t("Zahlung und Kündigung", "Payment and cancelling")}
              description={t(
                "Kommt mit der Stripe Anbindung. Im Prototyp gibt es noch keine Zahlungsdaten.",
                "Comes with the Stripe connection. The prototype has no payment details yet.",
              )}
            />
          </div>
        ) : (
          <p className="mt-2 text-muted">
            {t(
              `Mit einem Abo wird dein Einladungslink freigeschaltet. Die ersten ${BASIC.trialDays} Tage sind kostenlos.`,
              `A subscription unlocks your invite link. The first ${BASIC.trialDays} days are free.`,
            )}
          </p>
        )}
        <div className="mt-8">
          <PricingCards
            current={active ? sub?.interval : null}
            cta={active ? t("Wechseln", "Switch") : undefined}
            onChoose={async (interval) => {
              setError("");
              try {
                const started = await startSubscription(interval);
                track("plan_started", { interval, trial: started.status === "trialing" });
              } catch {
                setError(t("Das hat nicht geklappt. Bitte versuch es nochmal.", "That didn't work. Please try again."));
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
