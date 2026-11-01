"use client";

import { BedDouble } from "lucide-react";

import { PaneBody, PaneHeader } from "@/components/app/AppShell";
import { RoomsEditor } from "@/components/flat/RoomsEditor";

import { useCurrentFlat } from "../FlatProvider";

export default function RoomsPage() {
  const flat = useCurrentFlat();
  return (
    <>
      <PaneHeader icon={BedDouble} title={`Zimmer · ${flat.title}`} />
      <PaneBody>
        <h1 className="h1">Zimmer</h1>
        <p className="mt-2 text-muted">
          Was du hier änderst, sehen Bewerber sofort. Wer schon sortiert hat, behält seine Reihenfolge, neue Zimmer kommen
          bei ihnen ans Ende.
        </p>
        <div className="mt-6">
          <RoomsEditor key={flat.rooms.map((r) => r.id).join()} flat={flat} />
        </div>
      </PaneBody>
    </>
  );
}
