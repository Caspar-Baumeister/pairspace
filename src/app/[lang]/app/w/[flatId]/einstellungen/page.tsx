"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { PaneBody, PaneHeader, useShell } from "@/components/app/AppShell";
import { FlatBasicsForm } from "@/components/flat/FlatBasicsForm";
import { HostEditor } from "@/components/flat/HostEditor";
import { ErrorText, Setting, Toggle } from "@/components/ui/Field";
import { Spinner } from "@/components/ui/Spinner";
import { deleteApplications, deleteFlat, updateFlat } from "@/lib/firebase/data";
import { useLocalePath, useT } from "@/lib/i18n/client";

import { useCurrentFlat } from "../FlatProvider";

export default function FlatSettingsPage() {
  const flat = useCurrentFlat();
  const { landlord, flats } = useShell();
  const router = useRouter();
  const t = useT();
  const lp = useLocalePath();
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const act = async (name: string, fn: () => Promise<void>) => {
    setBusy(name);
    setError("");
    setMessage("");
    try {
      await fn();
    } catch (e) {
      console.error(e);
      setError(t("Das hat nicht geklappt.", "That didn't work."));
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <PaneHeader />
      <PaneBody>
        <h1 className="h1">{t("Einstellungen", "Settings")}</h1>

        <h2 className="h4 mt-8">{t("Wohnung", "Flat")}</h2>
        <div className="mt-4">
          <FlatBasicsForm
            initial={flat}
            submitLabel={t("Speichern", "Save")}
            onSubmit={async (values) => {
              await updateFlat(flat.id, values);
              setMessage(t("Gespeichert", "Saved"));
            }}
          />
        </div>

        <h2 className="h4 mt-10">{t("Über dich", "About you")}</h2>
        <div className="mt-4">{landlord ? <HostEditor landlord={landlord} flats={flats} /> : <Spinner />}</div>

        <h2 className="h4 mt-10">{t("Bewerbungen", "Applications")}</h2>
        <div className="mt-2">
          {flat.status !== "draft" ? (
            <Setting
              name={t("Link nimmt Bewerbungen an", "Link accepts applications")}
              description={t(
                "Ausgeschaltet sehen Bewerber nur noch einen Hinweis. Alles bleibt gespeichert.",
                "When it's off, applicants only see a short notice. Everything stays saved.",
              )}
            >
              <Toggle
                checked={flat.status === "live"}
                label={t("Link aktiv", "Link active")}
                onChange={(on) =>
                  act("status", async () => {
                    await updateFlat(flat.id, { status: on ? "live" : "closed" });
                  })
                }
              />
            </Setting>
          ) : null}
          <Setting
            name={t("Suche abschließen", "Finish your search")}
            description={t(
              "Löscht alle Profile, Fotos, Bewertungen und Kontaktdaten der Bewerber dieser Wohnung. Danach kannst du sie für die nächsten Zimmer neu starten.",
              "Deletes all applicant profiles, photos, ratings and contact details for this flat. Then you can start fresh for the next rooms.",
            )}
          >
            <button
              type="button"
              className="btn btn-danger"
              disabled={busy !== null}
              onClick={() => {
                if (!window.confirm(t("Alle Bewerbungen dieser Wohnung endgültig löschen?", "Delete all applications for this flat for good?")))
                  return;
                act("clear", async () => {
                  const n = await deleteApplications(flat.id);
                  setMessage(
                    n === 1
                      ? t("1 Bewerbung gelöscht", "1 application deleted")
                      : t(`${n} Bewerbungen gelöscht`, `${n} applications deleted`),
                  );
                });
              }}
            >
              {busy === "clear" ? <Spinner size={13} /> : null}
              {t("Bewerbungen löschen", "Delete applications")}
            </button>
          </Setting>
          <Setting
            name={t("Wohnung löschen", "Delete flat")}
            description={t(
              "Entfernt die Wohnung samt Link, Zimmerfotos und allen Bewerbungen.",
              "Removes the flat with its link, room photos and all applications.",
            )}
          >
            <button
              type="button"
              className="btn btn-danger"
              disabled={busy !== null}
              onClick={() => {
                if (!window.confirm(t(`${flat.title} endgültig löschen?`, `Delete ${flat.title} for good?`))) return;
                act("delete", async () => {
                  await deleteApplications(flat.id);
                  await deleteFlat(flat.id);
                  router.replace(lp("/app"));
                });
              }}
            >
              {t("Wohnung löschen", "Delete flat")}
            </button>
          </Setting>
        </div>
        {message ? <p className="mt-3 text-ui-small text-green">{message}</p> : null}
        <div className="mt-3">
          <ErrorText>{error}</ErrorText>
        </div>
      </PaneBody>
    </>
  );
}
