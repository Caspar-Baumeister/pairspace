"use client";

import { ExternalLink, Link2 } from "lucide-react";
import Link from "next/link";

import { PaneBody, PaneHeader } from "@/components/app/AppShell";
import { ShareLink } from "@/components/flat/ShareLink";

import { useCurrentFlat } from "../FlatProvider";

export default function LinkPage() {
  const flat = useCurrentFlat();
  return (
    <>
      <PaneHeader
        icon={Link2}
        title={`Einladungslink · ${flat.title}`}
        actions={
          flat.status === "live" ? (
            <a href={`/w/${flat.id}`} target="_blank" rel="noreferrer" className="btn btn-ghost h-7 px-2">
              <ExternalLink size={13} strokeWidth={1.75} /> Als Bewerber ansehen
            </a>
          ) : null
        }
      />
      <PaneBody>
        <h1 className="h1">Einladungslink</h1>
        {flat.status === "live" ? (
          <>
            <p className="mt-2 text-muted">
              Jeder mit diesem Link kann sich für die Wohnung eintragen. Bewerber sehen die Zimmer, dein kurzes Profil und
              die Profile der anderen Bewerber. Ihre Bewertungen und Kontaktdaten siehst nur du.
            </p>
            <div className="mt-6">
              <ShareLink flat={flat} />
            </div>
          </>
        ) : (
          <>
            <p className="mt-2 text-muted">
              {flat.status === "draft"
                ? "Der Link wird aktiv, sobald die Einrichtung abgeschlossen und deine Testphase gestartet ist."
                : "Die Wohnung ist pausiert. In den Einstellungen kannst du sie wieder öffnen."}
            </p>
            <Link
              href={flat.status === "draft" ? `/app/w/${flat.id}/einrichten` : `/app/w/${flat.id}/einstellungen`}
              className="btn btn-cta btn-lg mt-6"
            >
              {flat.status === "draft" ? "Einrichtung abschließen" : "Zu den Einstellungen"}
            </Link>
          </>
        )}
      </PaneBody>
    </>
  );
}
