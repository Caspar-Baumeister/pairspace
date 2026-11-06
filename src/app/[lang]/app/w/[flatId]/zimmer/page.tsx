"use client";


import { PaneBody, PaneHeader } from "@/components/app/AppShell";
import { RoomsEditor } from "@/components/flat/RoomsEditor";
import { useT } from "@/lib/i18n/client";

import { useCurrentFlat } from "../FlatProvider";

export default function RoomsPage() {
  const flat = useCurrentFlat();
  const t = useT();
  return (
    <>
      <PaneHeader />
      <PaneBody>
        <h1 className="h1">{t("Zimmer", "Rooms")}</h1>
        <p className="mt-2 text-muted">
          {t(
            "Was du hier änderst, sehen Bewerber sofort. Wer schon sortiert hat, behält seine Reihenfolge, neue Zimmer kommen bei ihnen ans Ende.",
            "Applicants see your changes right away. Anyone who has already ranked the rooms keeps their order, new rooms go to the end of their list.",
          )}
        </p>
        <div className="mt-6">
          <RoomsEditor key={flat.rooms.map((r) => r.id).join()} flat={flat} />
        </div>
      </PaneBody>
    </>
  );
}
