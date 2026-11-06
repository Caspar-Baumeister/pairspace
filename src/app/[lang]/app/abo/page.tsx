"use client";

import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { PaneBody, PaneHeader, useShell } from "@/components/app/AppShell";
import { PricingCards } from "@/components/app/PricingCards";
import { ErrorText, Setting } from "@/components/ui/Field";
import { Spinner } from "@/components/ui/Spinner";
import { track } from "@/lib/analytics";
import { BillingError, confirmCheckout, portalUrl, startSubscription } from "@/lib/billing";
import { intlLocale } from "@/lib/i18n";
import { useLocale, useLocalePath, useT } from "@/lib/i18n/client";
import { CONTRACT_BUTTONS } from "@/lib/legal";
import { BASIC, isActive } from "@/lib/plans";

export default function SubscriptionPage() {
  const { landlord } = useShell();
  const t = useT();
  const locale = useLocale();
  const lp = useLocalePath();
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [opening, setOpening] = useState(false);
  const handled = useRef(false);
  const sub = landlord?.subscription;
  const active = isActive(sub);
  const stripeManaged = sub?.provider === "stripe" && sub.status !== "canceled";

  const failed = (e: unknown) =>
    setError(
      e instanceof BillingError && e.code === "payment-unavailable"
        ? t("Die Zahlung ist gerade nicht verfügbar. Schreib uns über den Feedback Knopf.", "Payment is not available right now. Write to us with the feedback button.")
        : t("Das hat nicht geklappt. Bitte versuch es nochmal.", "That didn't work. Please try again."),
    );

  // Back from Stripe Checkout.
  useEffect(() => {
    const session = params.get("checkout");
    if (!session || handled.current) return;
    handled.current = true;
    router.replace(lp("/app/abo"), { scroll: false });
    if (session === "cancel") return;
    setConfirming(true);
    confirmCheckout(session)
      .then((s) => track("plan_started", { interval: s.interval, trial: s.status === "trialing" }))
      .catch(failed)
      .finally(() => setConfirming(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const openPortal = async () => {
    setError("");
    setOpening(true);
    try {
      window.location.assign(await portalUrl(locale));
    } catch (e) {
      failed(e);
      setOpening(false);
    }
  };

  const date = (ms: number) =>
    new Date(ms).toLocaleDateString(intlLocale(locale), { day: "numeric", month: "long", year: "numeric" });

  const status = () => {
    if (!sub) return "";
    if (sub.status === "past_due") {
      return t(
        "Die letzte Zahlung hat nicht geklappt. Bitte aktualisiere deine Zahlungsart, sonst wird dein Link pausiert.",
        "The last payment failed. Please update your payment method, otherwise your link will be paused.",
      );
    }
    if (sub.cancelAtPeriodEnd) {
      return t(`Gekündigt, läuft noch bis ${date(sub.currentPeriodEnd)}`, `Cancelled, runs until ${date(sub.currentPeriodEnd)}`);
    }
    if (sub.status === "trialing") {
      return t(
        `Testphase bis ${date(sub.trialEndsAt ?? sub.currentPeriodEnd)}${sub.provider === "stripe" ? ", danach beginnt das Abo" : ""}`,
        `Free trial until ${date(sub.trialEndsAt ?? sub.currentPeriodEnd)}${sub.provider === "stripe" ? ", then the plan starts" : ""}`,
      );
    }
    return t(`Aktiv bis ${date(sub.currentPeriodEnd)}, verlängert sich automatisch`, `Active until ${date(sub.currentPeriodEnd)}, renews automatically`);
  };

  return (
    <>
      <PaneHeader />
      <PaneBody wide>
        <h1 className="h1">{t("Abo", "Subscription")}</h1>
        {confirming ? (
          <p className="mt-4 flex items-center gap-2 text-muted">
            <Spinner size={14} /> {t("Dein Abo wird bestätigt", "Confirming your subscription")}
          </p>
        ) : null}
        {sub && (active || sub.status === "past_due") ? (
          <div className="mt-4">
            <Setting
              name={t("Tarif", "Plan")}
              description={sub.interval === "year" ? t("Basic, jährlich", "Basic, yearly") : t("Basic, monatlich", "Basic, monthly")}
            />
            <Setting name="Status" description={status()} />
            {stripeManaged ? (
              <Setting
                name={t("Zahlung und Kündigung", "Payment and cancelling")}
                description={t(
                  "Zahlungsart, Rechnungen, Wechsel zwischen monatlich und jährlich und Kündigung, sicher bei Stripe.",
                  "Payment method, invoices, switching between monthly and yearly, and cancelling, securely at Stripe.",
                )}
              >
                <button type="button" className="btn" onClick={openPortal} disabled={opening}>
                  {opening ? <Spinner size={14} /> : <ExternalLink size={14} strokeWidth={1.75} />}
                  {t("Abo verwalten", "Manage subscription")}
                </button>
              </Setting>
            ) : null}
          </div>
        ) : (
          <p className="mt-2 text-muted">
            {sub
              ? t(
                  "Dein Abo ist beendet, deine Links sind pausiert. Mit einem neuen Abo gehen sie sofort wieder live.",
                  "Your subscription has ended and your links are paused. A new subscription puts them live again right away.",
                )
              : t(
                  `Mit einem Abo wird dein Einladungslink freigeschaltet. Die ersten ${BASIC.trialDays} Tage sind kostenlos.`,
                  `A subscription unlocks your invite link. The first ${BASIC.trialDays} days are free.`,
                )}
          </p>
        )}
        {stripeManaged ? null : (
          <div className="mt-8">
            {sub?.provider === "prototype" && active ? (
              <p className="mb-4 text-ui-small text-muted">
                {t(
                  "Du testest Pairspace noch ohne Zahlungsdaten. Wähl einen Tarif, damit dein Link nach der Testphase weiterläuft. Bis dahin zahlst du nichts.",
                  "You are trying Pairspace without payment details. Choose a plan so your link keeps running after the trial. You pay nothing until then.",
                )}
              </p>
            ) : null}
            <PricingCards
              withConsent
              cta={sub ? t("Abo starten", "Start subscription") : undefined}
              onChoose={async (interval) => {
                setError("");
                try {
                  const result = await startSubscription(interval, { locale, returnPath: lp("/app/abo"), consent: true });
                  if (result.url) {
                    window.location.assign(result.url);
                    await new Promise(() => {});
                  }
                  if (result.subscription) {
                    track("plan_started", { interval, trial: result.subscription.status === "trialing" });
                  }
                } catch (e) {
                  failed(e);
                }
              }}
            />
          </div>
        )}
        <div className="mt-3">
          <ErrorText>{error}</ErrorText>
        </div>
        {/* § 312k and § 356a BGB: the public buttons, also reachable from here. */}
        <div className="mt-10 flex flex-wrap gap-x-5 gap-y-2 border-t border-line pt-5 text-ui-small">
          {CONTRACT_BUTTONS.map((button) => (
            <Link key={button.path} href={lp(button.path)} className="text-muted underline underline-offset-2 hover:text-ink">
              {t(button.de, button.en)}
            </Link>
          ))}
        </div>
      </PaneBody>
    </>
  );
}
