"use client";

import { ArrowRight, FilePlus2, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { PaneBody, PaneHeader, useShell } from "@/components/app/AppShell";
import { PricingCards } from "@/components/app/PricingCards";
import { HostEditor } from "@/components/flat/HostEditor";
import { RoomsEditor } from "@/components/flat/RoomsEditor";
import { ShareLink } from "@/components/flat/ShareLink";
import { StepHeader } from "@/components/flat/StepHeader";
import { ErrorText } from "@/components/ui/Field";
import { Spinner } from "@/components/ui/Spinner";
import { startSubscription } from "@/lib/billing";
import { updateFlat } from "@/lib/firebase/data";
import { isActive } from "@/lib/plans";

import { useCurrentFlat } from "../FlatProvider";

type Step = "rooms" | "host" | "plan" | "live";
const ORDER: Step[] = ["rooms", "host", "plan", "live"];

/** Steps 2 to 5 of the setup. Step 1 (the flat itself) lives in /app/neu. */
export default function SetupPage() {
  const flat = useCurrentFlat();
  const { landlord, flats } = useShell();
  const [step, setStep] = useState<Step>(flat.status === "live" ? "live" : "rooms");
  const [error, setError] = useState("");
  const [publishing, setPublishing] = useState(false);
  const subscribed = isActive(landlord?.subscription);

  const publish = async () => {
    setPublishing(true);
    setError("");
    try {
      await updateFlat(flat.id, { status: "live" });
      setStep("live");
    } catch (e) {
      console.error(e);
      setError("Freischalten hat nicht geklappt. Ist dein Abo aktiv?");
    } finally {
      setPublishing(false);
    }
  };

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
      <PaneHeader icon={FilePlus2} title={`${flat.title} einrichten`} />
      <PaneBody>
        <div key={step} className="fade-up">
          {step === "rooms" ? (
            <>
              <StepHeader
                step={2}
                total={5}
                title="Die Zimmer"
                text="Ein Foto pro Zimmer, die Warmmiete und die Größe. Bewerber sortieren die Zimmer später nach ihren Wünschen."
              />
              <RoomsEditor flat={flat} submitLabel="Weiter" onSaved={() => after("rooms")} />
            </>
          ) : null}

          {step === "host" && landlord ? (
            <>
              <StepHeader step={3} total={5} title="Kurz über dich" text="Ein paar Sätze reichen. Das sehen Bewerber, wenn sie deinen Link öffnen." />
              <HostEditor landlord={landlord} flats={flats} submitLabel="Weiter" onSaved={() => after("host")} />
              {publishing ? (
                <p className="mt-4 flex items-center gap-2 text-ui-small text-muted">
                  <Spinner size={14} /> Wohnung wird freigeschaltet
                </p>
              ) : null}
            </>
          ) : null}

          {step === "plan" ? (
            <>
              <StepHeader
                step={4}
                total={5}
                title="Tarif wählen"
                text="Dein Link wird freigeschaltet, sobald die Testphase läuft. In den ersten 7 Tagen zahlst du nichts und kannst jederzeit kündigen."
              />
              <PricingCards
                onChoose={async (interval) => {
                  setError("");
                  try {
                    await startSubscription(interval);
                    await publish();
                  } catch (e) {
                    console.error(e);
                    setError("Das hat nicht geklappt. Bitte versuch es nochmal.");
                  }
                }}
              />
              <p className="mt-4 flex items-center gap-2 text-ui-smaller text-faint">
                <ShieldCheck size={13} strokeWidth={1.75} /> Prototyp: Die Testphase startet ohne Zahlungsdaten. Stripe kommt später.
              </p>
              <div className="mt-3">
                <ErrorText>{error}</ErrorText>
              </div>
            </>
          ) : null}

          {step === "live" ? (
            <>
              <StepHeader step={5} total={5} title="Dein Link ist live" text="Schick ihn allen, die sich auf deine Anzeige melden, oder schreib ihn direkt in die Anzeige." />
              <ShareLink flat={flat} />
              <Link href={`/app/w/${flat.id}`} className="btn btn-lg mt-8">
                Zum Bewerber Graph <ArrowRight size={15} strokeWidth={1.75} />
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
