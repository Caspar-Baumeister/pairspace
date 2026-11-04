"use client";

import { ArrowRight, FilePlus2, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { PaneBody, PaneHeader, useShell } from "@/components/app/AppShell";
import { PricingCards } from "@/components/app/PricingCards";
import { HostEditor } from "@/components/flat/HostEditor";
import { RoomsEditor } from "@/components/flat/RoomsEditor";
import { ShareLink } from "@/components/flat/ShareLink";
import { StepHeader } from "@/components/flat/StepHeader";
import { ErrorText } from "@/components/ui/Field";
import { Spinner } from "@/components/ui/Spinner";
import { track } from "@/lib/analytics";
import { confirmCheckout, startSubscription } from "@/lib/billing";
import { updateFlat } from "@/lib/firebase/data";
import { useLocale, useLocalePath, useT } from "@/lib/i18n/client";
import { BASIC, isActive } from "@/lib/plans";

import { useCurrentFlat } from "../FlatProvider";

type Step = "rooms" | "host" | "plan" | "live";
const ORDER: Step[] = ["rooms", "host", "plan", "live"];

/** Steps 2 to 5 of the setup. Step 1 (the flat itself) lives in /app/neu. */
export default function SetupPage() {
  const flat = useCurrentFlat();
  const { landlord, flats } = useShell();
  const t = useT();
  const locale = useLocale();
  const lp = useLocalePath();
  const router = useRouter();
  const params = useSearchParams();
  const returning = params.get("checkout");
  const [step, setStep] = useState<Step>(flat.status === "live" ? "live" : returning ? "plan" : "rooms");
  const [error, setError] = useState("");
  const [publishing, setPublishing] = useState(false);
  const handled = useRef(false);
  const subscribed = isActive(landlord?.subscription);
  const setupPath = lp(`/app/w/${flat.id}/einrichten`);

  const publish = async () => {
    setPublishing(true);
    setError("");
    try {
      await updateFlat(flat.id, { status: "live" });
      setStep("live");
    } catch (e) {
      console.error(e);
      setError(t("Freischalten hat nicht geklappt. Ist dein Abo aktiv?", "We couldn't unlock your link. Is your subscription active?"));
    } finally {
      setPublishing(false);
    }
  };

  // Back from Stripe Checkout: confirm the plan, then put the link live.
  useEffect(() => {
    if (!returning || handled.current) return;
    handled.current = true;
    router.replace(setupPath, { scroll: false });
    if (returning === "cancel") return;
    setPublishing(true);
    confirmCheckout(returning)
      .then((s) => {
        track("plan_started", { interval: s.interval, trial: s.status === "trialing" });
        return publish();
      })
      .catch((e) => {
        console.error(e);
        setPublishing(false);
        setError(t("Dein Abo konnte nicht bestätigt werden. Schau unter Abo nach oder versuch es nochmal.", "We couldn't confirm your subscription. Check under Subscription or try again."));
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [returning]);

  const after = (s: Step) => {
    const next = ORDER[ORDER.indexOf(s) + 1];
    if (next === "plan" && subscribed) {
      publish();
      return;
    }
    setStep(next);
  };

  return (
    <>
      <PaneHeader icon={FilePlus2} title={t(`${flat.title} einrichten`, `Set up ${flat.title}`)} />
      <PaneBody>
        <div key={step} className="fade-up">
          {step === "rooms" ? (
            <>
              <StepHeader
                step={2}
                total={5}
                title={t("Die Zimmer", "The rooms")}
                text={t(
                  "Ein Foto pro Zimmer, die Warmmiete und die Größe. Bewerber sortieren die Zimmer später nach ihren Wünschen.",
                  "One photo per room, the rent incl. bills and the size. Applicants rank the rooms by preference later on.",
                )}
              />
              <RoomsEditor flat={flat} submitLabel={t("Weiter", "Continue")} onSaved={() => after("rooms")} />
            </>
          ) : null}

          {step === "host" && landlord ? (
            <>
              <StepHeader
                step={3}
                total={5}
                title={t("Kurz über dich", "A little about you")}
                text={t(
                  "Ein paar Sätze reichen. Das sehen Bewerber, wenn sie deinen Link öffnen.",
                  "A few sentences are enough. Applicants see this when they open your link.",
                )}
              />
              <HostEditor landlord={landlord} flats={flats} submitLabel={t("Weiter", "Continue")} onSaved={() => after("host")} />
              {publishing ? (
                <p className="mt-4 flex items-center gap-2 text-ui-small text-muted">
                  <Spinner size={14} /> {t("Wohnung wird freigeschaltet", "Unlocking your flat")}
                </p>
              ) : null}
            </>
          ) : null}

          {step === "plan" ? (
            <>
              <StepHeader
                step={4}
                total={5}
                title={t("Tarif wählen", "Choose a plan")}
                text={t(
                  `Dein Link wird freigeschaltet, sobald die Testphase läuft. In den ersten ${BASIC.trialDays} Tagen zahlst du nichts und kannst jederzeit kündigen.`,
                  `Your link goes live as soon as the free trial starts. You pay nothing for the first ${BASIC.trialDays} days and can cancel anytime.`,
                )}
              />
              {publishing ? (
                <p className="mb-4 flex items-center gap-2 text-muted">
                  <Spinner size={14} /> {t("Abo wird bestätigt und dein Link freigeschaltet", "Confirming your plan and unlocking your link")}
                </p>
              ) : null}
              <PricingCards
                withConsent
                onChoose={async (interval) => {
                  setError("");
                  try {
                    const result = await startSubscription(interval, { locale, returnPath: setupPath, consent: true });
                    if (result.url) {
                      window.location.assign(result.url);
                      await new Promise(() => {});
                    }
                    if (result.subscription) {
                      track("plan_started", { interval, trial: result.subscription.status === "trialing" });
                      await publish();
                    }
                  } catch (e) {
                    console.error(e);
                    setError(t("Das hat nicht geklappt. Bitte versuch es nochmal.", "That didn't work. Please try again."));
                  }
                }}
              />
              <p className="mt-4 flex items-center gap-2 text-ui-smaller text-faint">
                <ShieldCheck size={13} strokeWidth={1.75} />{" "}
                {t(
                  `Sichere Zahlung über Stripe. In den ${BASIC.trialDays} Tagen Testphase zahlst du nichts, kündigen geht jederzeit in der App.`,
                  `Secure payment with Stripe. You pay nothing during the ${BASIC.trialDays} day trial and can cancel anytime in the app.`,
                )}
              </p>
              <div className="mt-3">
                <ErrorText>{error}</ErrorText>
              </div>
            </>
          ) : null}

          {step === "live" ? (
            <>
              <StepHeader
                step={5}
                total={5}
                title={t("Dein Link ist live", "Your link is live")}
                text={t(
                  "Schick ihn allen, die sich auf deine Anzeige melden, oder schreib ihn direkt in die Anzeige.",
                  "Send it to everyone who answers your listing, or put it straight into the listing.",
                )}
              />
              <ShareLink flat={flat} />
              <Link href={lp(`/app/w/${flat.id}`)} className="btn btn-lg mt-8">
                {t("Zum Bewerber Graph", "Go to the applicant graph")} <ArrowRight size={15} strokeWidth={1.75} />
              </Link>
            </>
          ) : null}
          {step !== "plan" ? (
            <div className="mt-3">
              <ErrorText>{error}</ErrorText>
            </div>
          ) : null}
        </div>
      </PaneBody>
    </>
  );
}
