"use client";

import { Lock } from "lucide-react";
import Link from "next/link";

import { PaneBody, PaneHeader, useShell } from "@/components/app/AppShell";
import { GraphView } from "@/components/graph/GraphView";
import { useLocalePath, useT } from "@/lib/i18n/client";
import { isActive } from "@/lib/plans";

import { useCurrentFlat } from "./FlatProvider";

export default function ApplicantsPage() {
  const flat = useCurrentFlat();
  const { landlord } = useShell();
  const t = useT();
  const lp = useLocalePath();
  const sub = landlord?.subscription;

  // The graph is what the plan pays for. A failed payment keeps it open while Stripe retries.
  if (sub && !isActive(sub) && sub.status !== "past_due") {
    return (
      <>
        <PaneHeader icon={Lock} title={flat.title} />
        <PaneBody>
          <div className="fade-up">
            <h1 className="h1">{t("Dein Abo ist beendet", "Your subscription has ended")}</h1>
            <p className="mt-2 text-muted">
              {t(
                "Deine Bewerber und ihre Bewertungen sind noch da. Mit einem Abo siehst du wieder den Graphen und die besten Gruppen, und dein Link nimmt wieder Bewerbungen an.",
                "Your applicants and their ratings are still here. With a subscription you see the graph and the best groups again, and your link takes applications again.",
              )}
            </p>
            <Link href={lp("/app/abo")} className="btn btn-cta btn-lg mt-6">
              {t("Abo wählen", "Choose a plan")}
            </Link>
          </div>
        </PaneBody>
      </>
    );
  }

  return <GraphView flat={flat} />;
}
