"use client";

import { useState } from "react";

import { ErrorText, Field } from "@/components/ui/Field";
import { Spinner } from "@/components/ui/Spinner";
import { useT } from "@/lib/i18n/client";
import type { Flat } from "@/lib/types";

export type FlatBasics = Pick<Flat, "title" | "city" | "district" | "description">;

export function FlatBasicsForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial?: Partial<FlatBasics>;
  submitLabel: string;
  onSubmit: (values: FlatBasics) => Promise<void>;
}) {
  const [values, setValues] = useState<FlatBasics>({
    title: initial?.title ?? "",
    city: initial?.city ?? "",
    district: initial?.district ?? "",
    description: initial?.description ?? "",
  });
  const t = useT();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (key: keyof FlatBasics) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        try {
          await onSubmit({
            title: values.title.trim(),
            city: values.city.trim(),
            district: values.district.trim(),
            description: values.description.trim(),
          });
        } catch (err) {
          console.error(err);
          setError(t("Speichern hat nicht geklappt. Bitte versuch es nochmal.", "Saving didn't work. Please try again."));
        } finally {
          setBusy(false);
        }
      }}
    >
      <Field
        label={t("Name der Wohnung", "Name of the flat")}
        hint={t(
          "So sehen Bewerber die Wohnung, zum Beispiel 3er WG Weserstraße.",
          "This is what applicants see, for example Flatshare for 3 on Weserstraße.",
        )}
      >
        <input className="input input-lg" value={values.title} onChange={set("title")} maxLength={80} required />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("Stadt", "City")}>
          <input className="input input-lg" value={values.city} onChange={set("city")} maxLength={60} required />
        </Field>
        <Field label={t("Stadtteil", "Neighbourhood")}>
          <input className="input input-lg" value={values.district} onChange={set("district")} maxLength={60} />
        </Field>
      </div>
      <Field
        label={t("Kurzbeschreibung", "Short description")}
        hint={t(
          "Optional. Größe, Ausstattung, Lage in zwei, drei Sätzen.",
          "Optional. Size, furnishings and location in two or three sentences.",
        )}
      >
        <textarea className="input" value={values.description} onChange={set("description")} maxLength={600} rows={3} />
      </Field>
      <ErrorText>{error}</ErrorText>
      <button type="submit" className="btn btn-cta btn-lg" disabled={busy}>
        {busy ? <Spinner size={14} /> : null}
        {submitLabel}
      </button>
    </form>
  );
}
