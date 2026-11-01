"use client";

import { FilePlus2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { PaneBody, PaneHeader, useShell } from "@/components/app/AppShell";
import { FlatBasicsForm } from "@/components/flat/FlatBasicsForm";
import { StepHeader } from "@/components/flat/StepHeader";
import { useAuth } from "@/lib/firebase/auth";
import { createFlat } from "@/lib/firebase/data";
import { BASIC } from "@/lib/plans";

export default function NewFlatPage() {
  const { user } = useAuth();
  const { landlord, flats, flatsLoading } = useShell();
  const router = useRouter();
  const atLimit = !flatsLoading && flats.length >= BASIC.maxFlats;

  return (
    <>
      <PaneHeader icon={FilePlus2} title="Neue Wohnung" />
      <PaneBody>
        {atLimit ? (
          <div className="fade-up">
            <h1 className="h2">Im Basic Tarif ist eine Wohnung enthalten</h1>
            <p className="mt-3 text-muted">
              Du hast schon <span className="text-ink">{flats[0]?.title || "eine Wohnung"}</span> angelegt. Tarife für
              mehrere Wohnungen kommen bald. Bis dahin kannst du die bestehende Wohnung bearbeiten oder nach der Vermietung
              für die nächsten Zimmer wiederverwenden.
            </p>
            <div className="mt-6 flex gap-2">
              <Link href={`/app/w/${flats[0]?.id}`} className="btn btn-cta btn-lg">
                Zur Wohnung
              </Link>
              <Link href={`/app/w/${flats[0]?.id}/einstellungen`} className="btn btn-lg">
                Einstellungen
              </Link>
            </div>
          </div>
        ) : (
          <div className="fade-up">
            <StepHeader step={1} total={5} title="Deine Wohnung" text="Fang mit dem Wichtigsten an. Alles lässt sich später ändern." />
            <FlatBasicsForm
              submitLabel="Weiter zu den Zimmern"
              onSubmit={async (values) => {
                if (!user) return;
                const id = await createFlat(
                  {
                    uid: user.uid,
                    name: landlord?.name || user.displayName || "",
                    about: landlord?.about ?? "",
                    photo: landlord?.photo ?? null,
                  },
                  values,
                );
                router.push(`/app/w/${id}/einrichten`);
              }}
            />
          </div>
        )}
      </PaneBody>
    </>
  );
}
