"use client";

import { Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { PaneBody, PaneHeader, useShell } from "@/components/app/AppShell";
import { FlatBasicsForm } from "@/components/flat/FlatBasicsForm";
import { HostEditor } from "@/components/flat/HostEditor";
import { ErrorText, Setting, Toggle } from "@/components/ui/Field";
import { Spinner } from "@/components/ui/Spinner";
import { deleteApplications, deleteFlat, updateFlat } from "@/lib/firebase/data";

import { useCurrentFlat } from "../FlatProvider";

export default function FlatSettingsPage() {
  const flat = useCurrentFlat();
  const { landlord, flats } = useShell();
  const router = useRouter();
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
      setError("Das hat nicht geklappt.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <PaneHeader icon={Settings} title={`Einstellungen · ${flat.title}`} />
      <PaneBody>
        <h1 className="h1">Einstellungen</h1>

        <h2 className="h4 mt-8">Wohnung</h2>
        <div className="mt-4">
          <FlatBasicsForm
            initial={flat}
            submitLabel="Speichern"
            onSubmit={async (values) => {
              await updateFlat(flat.id, values);
              setMessage("Gespeichert");
            }}
          />
        </div>

        <h2 className="h4 mt-10">Über dich</h2>
        <div className="mt-4">{landlord ? <HostEditor landlord={landlord} flats={flats} /> : <Spinner />}</div>

        <h2 className="h4 mt-10">Bewerbungen</h2>
        <div className="mt-2">
          {flat.status !== "draft" ? (
            <Setting
              name="Link nimmt Bewerbungen an"
              description="Ausgeschaltet sehen Bewerber nur noch einen Hinweis. Alles bleibt gespeichert."
            >
              <Toggle
                checked={flat.status === "live"}
                label="Link aktiv"
                onChange={(on) =>
                  act("status", async () => {
                    await updateFlat(flat.id, { status: on ? "live" : "closed" });
                  })
                }
              />
            </Setting>
          ) : null}
          <Setting
            name="Suche abschließen"
            description="Löscht alle Profile, Bewertungen und Kontaktdaten der Bewerber dieser Wohnung. Danach kannst du sie für die nächsten Zimmer neu starten."
          >
            <button
              type="button"
              className="btn btn-danger"
              disabled={busy !== null}
              onClick={() => {
                if (!window.confirm("Alle Bewerbungen dieser Wohnung endgültig löschen?")) return;
                act("clear", async () => {
                  const n = await deleteApplications(flat.id);
                  setMessage(`${n} Bewerbungen gelöscht`);
                });
              }}
            >
              {busy === "clear" ? <Spinner size={13} /> : null}
              Bewerbungen löschen
            </button>
          </Setting>
          <Setting name="Wohnung löschen" description="Entfernt die Wohnung samt Link. Lösch vorher die Bewerbungen.">
            <button
              type="button"
              className="btn btn-danger"
              disabled={busy !== null}
              onClick={() => {
                if (!window.confirm(`${flat.title} endgültig löschen?`)) return;
                act("delete", async () => {
                  await deleteApplications(flat.id);
                  await deleteFlat(flat.id);
                  router.replace("/app");
                });
              }}
            >
              Wohnung löschen
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
