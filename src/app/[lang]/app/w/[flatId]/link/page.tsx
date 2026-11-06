"use client";

import { ExternalLink } from "lucide-react";
import Link from "next/link";

import { PaneBody, PaneHeader } from "@/components/app/AppShell";
import { ShareLink } from "@/components/flat/ShareLink";
import { useLocalePath, useT } from "@/lib/i18n/client";

import { useCurrentFlat } from "../FlatProvider";

export default function LinkPage() {
  const flat = useCurrentFlat();
  const t = useT();
  const lp = useLocalePath();
  return (
    <>
      <PaneHeader
        actions={
          flat.status === "live" ? (
            // The applicant page has no language prefix, applicants get their language by themselves.
            <a
              href={`/w/${flat.id}`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-ghost h-7 px-2"
              aria-label={t("Als Bewerber ansehen", "View as applicant")}
              title={t("Als Bewerber ansehen", "View as applicant")}
            >
              <ExternalLink size={13} strokeWidth={1.75} />
              {/* On phones the flat switcher needs the room. */}
              <span className="hidden sm:inline">{t("Als Bewerber ansehen", "View as applicant")}</span>
            </a>
          ) : null
        }
      />
      <PaneBody>
        <h1 className="h1">{t("Einladungslink", "Invite link")}</h1>
        {flat.status === "live" ? (
          <>
            <p className="mt-2 text-muted">
              {t(
                "Jeder mit diesem Link kann sich für die Wohnung eintragen. Bewerber sehen die Zimmer, dein kurzes Profil und die Profile der anderen Bewerber. Ihre Bewertungen und Kontaktdaten siehst nur du.",
                "Anyone with this link can apply for the flat. Applicants see the rooms, your short profile and the profiles of the other applicants. Only you see their ratings and contact details.",
              )}
            </p>
            <div className="mt-6">
              <ShareLink flat={flat} />
            </div>
          </>
        ) : (
          <>
            <p className="mt-2 text-muted">
              {flat.status === "draft"
                ? t(
                    "Der Link wird aktiv, sobald die Einrichtung abgeschlossen und deine Testphase gestartet ist.",
                    "The link goes live once the setup is done and your free trial has started.",
                  )
                : t(
                    "Die Wohnung ist pausiert. In den Einstellungen kannst du sie wieder öffnen.",
                    "This flat is paused. You can open it again in the settings.",
                  )}
            </p>
            <Link
              href={lp(flat.status === "draft" ? `/app/w/${flat.id}/einrichten` : `/app/w/${flat.id}/einstellungen`)}
              className="btn btn-cta btn-lg mt-6"
            >
              {flat.status === "draft" ? t("Einrichtung abschließen", "Finish setup") : t("Zu den Einstellungen", "Go to settings")}
            </Link>
          </>
        )}
      </PaneBody>
    </>
  );
}
