"use client";

import { Camera } from "lucide-react";
import { useRef, useState } from "react";

import { ErrorText, Field } from "@/components/ui/Field";
import { Spinner } from "@/components/ui/Spinner";
import { updateFlat, updateLandlord } from "@/lib/firebase/data";
import { deletePhoto, PhotoError, randomId, SHAPES, uploadPhoto } from "@/lib/firebase/storage";
import { useT } from "@/lib/i18n/client";
import type { Flat, Landlord, Photo } from "@/lib/types";

const MAX_ABOUT = 280;

/** "Über dich": name, a few sentences and an optional photo. Kept small on purpose. */
export function HostEditor({
  landlord,
  flats,
  submitLabel,
  onSaved,
}: {
  landlord: Landlord;
  /** Every flat whose host snapshot should follow the change. */
  flats: Pick<Flat, "id">[];
  submitLabel?: string;
  onSaved?: () => void;
}) {
  const t = useT();
  const [name, setName] = useState(landlord.name);
  const [about, setAbout] = useState(landlord.about);
  const [photo, setPhoto] = useState<Photo | null>(landlord.photo);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    setUploading(true);
    setError("");
    try {
      const next = await uploadPhoto(`landlords/${landlord.uid}/avatar-${randomId(4)}.webp`, file, SHAPES.avatar);
      await deletePhoto(photo?.path);
      setPhoto(next);
    } catch (e) {
      setError(
        e instanceof PhotoError
          ? t(e.message, e.en)
          : t("Das Foto konnte nicht hochgeladen werden.", "The photo couldn't be uploaded."),
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        try {
          const clean = { name: name.trim(), about: about.trim(), photo };
          await updateLandlord(landlord.uid, clean);
          await Promise.all(
            flats.map((f) =>
              updateFlat(f.id, { host: { name: clean.name, about: clean.about, photoUrl: photo?.url ?? null } }),
            ),
          );
          setSaved(true);
          onSaved?.();
        } catch (err) {
          console.error(err);
          setError(t("Speichern hat nicht geklappt.", "Saving didn't work."));
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-dashed border-base-40 bg-base-25 text-faint"
          aria-label={t("Foto wählen", "Choose a photo")}
        >
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo.url} alt="" className="h-full w-full object-cover" />
          ) : (
            <Camera size={18} strokeWidth={1.5} />
          )}
          {uploading ? (
            <span className="absolute inset-0 flex items-center justify-center bg-black/50">
              <Spinner />
            </span>
          ) : null}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) upload(f);
            e.target.value = "";
          }}
        />
        <div className="text-ui-small text-muted">
          {t(
            "Ein Foto ist freiwillig, macht die Anfrage aber persönlicher.",
            "A photo is optional, but it makes your invite feel more personal.",
          )}
        </div>
      </div>
      <Field label={t("Dein Name", "Your name")}>
        <input
          className="input input-lg"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setSaved(false);
          }}
          maxLength={60}
          required
        />
      </Field>
      <Field
        label={t("Kurz über dich", "A little about you")}
        hint={t(`${about.length} von ${MAX_ABOUT} Zeichen`, `${about.length} of ${MAX_ABOUT} characters`)}
      >
        <textarea
          className="input"
          rows={3}
          value={about}
          onChange={(e) => {
            setAbout(e.target.value.slice(0, MAX_ABOUT));
            setSaved(false);
          }}
          placeholder={t(
            "Zum Beispiel: Ich vermiete die Zimmer selbst und wohne in der Nähe.",
            "For example: I rent out the rooms myself and live nearby.",
          )}
        />
      </Field>
      <ErrorText>{error}</ErrorText>
      <div className="flex items-center gap-3">
        <button type="submit" className="btn btn-cta btn-lg" disabled={busy || uploading}>
          {busy ? <Spinner size={14} /> : null}
          {submitLabel ?? t("Speichern", "Save")}
        </button>
        {saved && !onSaved ? <span className="text-ui-small text-green">{t("Gespeichert", "Saved")}</span> : null}
      </div>
    </form>
  );
}
