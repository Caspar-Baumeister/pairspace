"use client";

import { Eye, ImagePlus, Star, X } from "lucide-react";
import { useMemo, useRef, useState, type ReactNode } from "react";

import { Field } from "@/components/ui/Field";
import { Spinner } from "@/components/ui/Spinner";
import { emptyApplicant, emptyLifestyle, saveApplicant } from "@/lib/firebase/data";
import { PhotoError, SHAPES, deletePhoto, randomId, uploadPhoto } from "@/lib/firebase/storage";
import {
  CLEANLINESS,
  FLAT_LIFE,
  INTERESTS,
  LANGUAGES,
  MAX_INTERESTS,
  MAX_PHOTOS,
  RHYTHM,
  STAY,
} from "@/lib/options";
import type { Applicant, Lifestyle } from "@/lib/types";
import { BottomBar, Column, FlowHeader } from "./FlowShell";
import { ProfileCard } from "./ProfileCard";
import { ProfileFacts } from "./ProfileDetails";

const BIO_MAX = 500;

interface Pending {
  id: string;
  preview: string;
}

/** Single choice chips. Clicking the active chip clears the choice. */
function ChipChoice<T extends string | boolean>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T | null;
  onChange: (value: T | null) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          className="chip"
          aria-pressed={value === o.value}
          onClick={() => onChange(value === o.value ? null : o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="border-t border-line pt-5">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="text-ui-medium font-semibold text-ink">{title}</h2>
        {hint ? <span className="text-ui-smaller text-faint">{hint}</span> : null}
      </div>
      {children}
    </section>
  );
}

const YES_NO_SMOKE = [
  { value: false, label: "Nichtraucher" },
  { value: true, label: "Raucher" },
];
const YES_NO_PETS = [
  { value: false, label: "Kein Haustier" },
  { value: true, label: "Bringe ein Haustier mit" },
];

/**
 * Tinder style profile editor: a 3 × 2 photo grid, the basics, interests as
 * chips and the lifestyle facts that matter in a shared flat.
 */
export function ProfileStep({
  flatId,
  uid,
  flatTitle,
  me,
  returning,
  onDone,
  onBack,
}: {
  flatId: string;
  uid: string;
  flatTitle: string;
  me: Applicant | null;
  returning: boolean;
  onDone: () => void;
  onBack?: () => void;
}) {
  const [draft, setDraft] = useState<Applicant>(() =>
    me
      ? { ...emptyApplicant(uid), ...me, lifestyle: { ...emptyLifestyle, ...me.lifestyle } }
      : emptyApplicant(uid),
  );
  const savedPaths = useMemo(() => new Set((me?.photos ?? []).map((p) => p.path)), [me]);
  const [pending, setPending] = useState<Pending[]>([]);
  const [photoError, setPhotoError] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const set = <K extends keyof Applicant>(key: K, value: Applicant[K]) => setDraft((d) => ({ ...d, [key]: value }));
  const setLife = <K extends keyof Lifestyle>(key: K, value: Lifestyle[K]) =>
    setDraft((d) => ({ ...d, lifestyle: { ...d.lifestyle, [key]: value } }));

  const free = MAX_PHOTOS - draft.photos.length - pending.length;

  const onFiles = (files: FileList | null) => {
    if (!files) return;
    setPhotoError("");
    Array.from(files)
      .slice(0, Math.max(free, 0))
      .forEach((file) => {
        const id = randomId(6);
        const local = URL.createObjectURL(file);
        setPending((p) => [...p, { id, preview: local }]);
        uploadPhoto(`flats/${flatId}/applicants/${uid}/${randomId()}.webp`, file, SHAPES.applicant)
          .then((photo) => setDraft((d) => ({ ...d, photos: [...d.photos, photo].slice(0, MAX_PHOTOS) })))
          .catch((e) =>
            setPhotoError(e instanceof PhotoError ? e.message : "Hochladen hat nicht geklappt. Versuch es nochmal."),
          )
          .finally(() => {
            setPending((p) => p.filter((x) => x.id !== id));
            URL.revokeObjectURL(local);
          });
      });
    if (fileInput.current) fileInput.current.value = "";
  };

  const removePhoto = (path: string) => {
    setDraft((d) => ({ ...d, photos: d.photos.filter((p) => p.path !== path) }));
    // Saved photos go only once the profile is saved, so leaving here keeps them.
    if (!savedPaths.has(path)) void deletePhoto(path);
  };

  const makeMain = (path: string) =>
    setDraft((d) => {
      const photo = d.photos.find((p) => p.path === path);
      return photo ? { ...d, photos: [photo, ...d.photos.filter((p) => p.path !== path)] } : d;
    });

  const toggleIn = (key: "interests" | "languages", value: string, max = Infinity) =>
    setDraft((d) => {
      const list = d[key];
      if (list.includes(value)) return { ...d, [key]: list.filter((v) => v !== value) };
      if (list.length >= max) return d;
      return { ...d, [key]: [...list, value] };
    });

  const save = async () => {
    const problems: string[] = [];
    if (!draft.firstName.trim()) problems.push("Sag uns deinen Vornamen.");
    if (!draft.photos.length) problems.push("Lade mindestens ein Foto hoch.");
    if (pending.length) problems.push("Warte kurz, bis alle Fotos hochgeladen sind.");
    setErrors(problems);
    if (problems.length) return;

    setBusy(true);
    try {
      const now = Date.now();
      await saveApplicant(flatId, {
        ...draft,
        uid,
        firstName: draft.firstName.trim(),
        occupation: draft.occupation.trim(),
        bio: draft.bio.trim().slice(0, BIO_MAX),
        age: draft.age && draft.age >= 16 && draft.age <= 99 ? Math.round(draft.age) : null,
        status: "complete",
        createdAt: me?.createdAt ?? now,
        updatedAt: now,
      });
      savedPaths.forEach((path) => {
        if (!draft.photos.some((p) => p.path === path)) void deletePhoto(path);
      });
      onDone();
    } catch {
      setErrors(["Speichern hat nicht geklappt. Prüf deine Verbindung und versuch es nochmal."]);
      setBusy(false);
    }
  };

  const slots = Array.from({ length: MAX_PHOTOS }, (_, i) => {
    if (i < draft.photos.length) return { kind: "photo" as const, photo: draft.photos[i], i };
    const p = pending[i - draft.photos.length];
    if (p) return { kind: "pending" as const, pending: p, i };
    return { kind: "empty" as const, i };
  });

  return (
    <div className="flex min-h-dvh flex-col">
      <FlowHeader
        title={returning ? "Profil bearbeiten" : flatTitle}
        subtitle={returning ? undefined : "Schritt 3 von 4"}
        onBack={onBack}
        step={returning ? undefined : 2}
        right={
          <button type="button" className="btn btn-ghost" onClick={() => setPreview(true)}>
            <Eye size={15} strokeWidth={1.75} />
            Vorschau
          </button>
        }
      />
      <Column className="flex-1 pt-5">
        <h1 className="h3 text-ink">{returning ? "Dein Profil" : "Zeig dich den anderen"}</h1>
        <p className="mt-2 text-ui-medium leading-relaxed text-muted">
          So sehen dich die anderen Bewerber und der Vermieter. Kontaktdaten kommen erst im nächsten Schritt und
          bleiben privat.
        </p>

        <div className="mt-5 grid gap-6 pb-2">
          <Section title="Fotos" hint={`${draft.photos.length} von ${MAX_PHOTOS}`}>
            <div className="grid grid-cols-3 gap-2">
              {slots.map((slot) => (
                <div
                  key={slot.kind === "photo" ? slot.photo.path : slot.kind === "pending" ? slot.pending.id : `empty-${slot.i}`}
                  className="relative aspect-[4/5] overflow-hidden rounded-xl border border-line bg-base-10"
                >
                  {slot.kind === "photo" ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={slot.photo.url} alt="" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhoto(slot.photo.path)}
                        aria-label="Foto entfernen"
                        className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white hover:bg-black"
                      >
                        <X size={13} strokeWidth={2} />
                      </button>
                      {slot.i === 0 ? (
                        <span className="absolute bottom-1.5 left-1.5 rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-white">
                          Hauptfoto
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => makeMain(slot.photo.path)}
                          aria-label="Als Hauptfoto nehmen"
                          title="Als Hauptfoto nehmen"
                          className="absolute bottom-1.5 left-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white hover:bg-black"
                        >
                          <Star size={12} strokeWidth={2} />
                        </button>
                      )}
                    </>
                  ) : slot.kind === "pending" ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={slot.pending.preview} alt="" className="h-full w-full object-cover opacity-40" />
                      <span className="absolute inset-0 flex items-center justify-center">
                        <Spinner size={20} />
                      </span>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInput.current?.click()}
                      className="flex h-full w-full flex-col items-center justify-center gap-1 border-dashed text-faint transition-colors hover:bg-base-25 hover:text-muted"
                      aria-label="Foto hinzufügen"
                    >
                      <ImagePlus size={20} strokeWidth={1.5} />
                      {slot.i === draft.photos.length + pending.length ? (
                        <span className="text-ui-smaller">Hinzufügen</span>
                      ) : null}
                    </button>
                  )}
                </div>
              ))}
            </div>
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => onFiles(e.target.files)}
            />
            {photoError ? <p className="mt-2 text-ui-small text-red">{photoError}</p> : null}
            <p className="mt-2 text-ui-smaller text-faint">
              Am besten ein klares Porträt als Hauptfoto, dazu gern Bilder von dem, was du gern machst.
            </p>
          </Section>

          <Section title="Über dich">
            <div className="grid gap-4">
              <div className="grid grid-cols-[1fr_96px] gap-3">
                <Field label="Vorname">
                  <input
                    className="input input-lg"
                    value={draft.firstName}
                    onChange={(e) => set("firstName", e.target.value)}
                    autoComplete="given-name"
                    maxLength={40}
                  />
                </Field>
                <Field label="Alter">
                  <input
                    className="input input-lg"
                    type="number"
                    inputMode="numeric"
                    min={16}
                    max={99}
                    value={draft.age ?? ""}
                    onChange={(e) => set("age", e.target.value ? Number(e.target.value) : null)}
                  />
                </Field>
              </div>
              <Field label="Was machst du?">
                <input
                  className="input input-lg"
                  value={draft.occupation}
                  onChange={(e) => set("occupation", e.target.value)}
                  placeholder="Zum Beispiel Medizinstudium oder UX Designerin"
                  maxLength={80}
                />
              </Field>
              <Field label="Über mich" hint={`${draft.bio.length} von ${BIO_MAX} Zeichen`}>
                <textarea
                  className="input min-h-[120px] text-ui-medium"
                  value={draft.bio}
                  maxLength={BIO_MAX}
                  onChange={(e) => set("bio", e.target.value)}
                  placeholder="Wie bist du so im Alltag, was ist dir in einer WG wichtig?"
                />
              </Field>
            </div>
          </Section>

          <Section title="Interessen" hint={`${draft.interests.length} von ${MAX_INTERESTS}`}>
            <div className="flex flex-wrap gap-1.5">
              {INTERESTS.map((t) => {
                const on = draft.interests.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    className="chip disabled:cursor-not-allowed disabled:opacity-40"
                    aria-pressed={on}
                    disabled={!on && draft.interests.length >= MAX_INTERESTS}
                    onClick={() => toggleIn("interests", t, MAX_INTERESTS)}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </Section>

          <Section title="Sprachen">
            <div className="flex flex-wrap gap-1.5">
              {LANGUAGES.map((t) => (
                <button
                  key={t}
                  type="button"
                  className="chip"
                  aria-pressed={draft.languages.includes(t)}
                  onClick={() => toggleIn("languages", t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </Section>

          <Section title="Wie du wohnst">
            <div className="grid gap-4">
              <div>
                <p className="mb-2 text-ui-small text-muted">Sauberkeit</p>
                <ChipChoice options={CLEANLINESS} value={draft.lifestyle.cleanliness} onChange={(v) => setLife("cleanliness", v)} />
              </div>
              <div>
                <p className="mb-2 text-ui-small text-muted">WG Leben</p>
                <ChipChoice options={FLAT_LIFE} value={draft.lifestyle.flatLife} onChange={(v) => setLife("flatLife", v)} />
              </div>
              <div>
                <p className="mb-2 text-ui-small text-muted">Rhythmus</p>
                <ChipChoice options={RHYTHM} value={draft.lifestyle.rhythm} onChange={(v) => setLife("rhythm", v)} />
              </div>
              <div>
                <p className="mb-2 text-ui-small text-muted">Rauchen</p>
                <ChipChoice options={YES_NO_SMOKE} value={draft.lifestyle.smoker} onChange={(v) => setLife("smoker", v)} />
              </div>
              <div>
                <p className="mb-2 text-ui-small text-muted">Haustier</p>
                <ChipChoice options={YES_NO_PETS} value={draft.lifestyle.pets} onChange={(v) => setLife("pets", v)} />
              </div>
            </div>
          </Section>

          <Section title="Einzug">
            <div className="grid gap-4">
              <Field label="Einzug ab">
                <input
                  className="input input-lg"
                  type="date"
                  value={draft.moveIn ?? ""}
                  onChange={(e) => set("moveIn", e.target.value || null)}
                />
              </Field>
              <div>
                <p className="mb-2 text-ui-small text-muted">Wie lange möchtest du bleiben?</p>
                <ChipChoice options={STAY} value={draft.stay} onChange={(v) => set("stay", v)} />
              </div>
            </div>
          </Section>
        </div>
      </Column>

      <BottomBar>
        {errors.length ? (
          <ul className="mb-2 grid gap-0.5">
            {errors.map((e) => (
              <li key={e} className="text-ui-small text-red">
                {e}
              </li>
            ))}
          </ul>
        ) : null}
        <button type="button" className="btn btn-cta btn-lg w-full" onClick={save} disabled={busy}>
          {busy ? <Spinner size={14} /> : null}
          {returning ? "Profil speichern" : "Profil speichern und weiter"}
        </button>
      </BottomBar>

      {preview ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center"
          onClick={() => setPreview(false)}
        >
          <div
            className="modal max-h-[92dvh] w-full max-w-[400px] overflow-y-auto p-4 fade-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-ui-small font-semibold text-ink">So sehen dich die anderen</p>
              <button type="button" className="icon-btn" onClick={() => setPreview(false)} aria-label="Schließen">
                <X size={16} strokeWidth={1.75} />
              </button>
            </div>
            <ProfileCard applicant={{ ...draft, firstName: draft.firstName || "Dein Name" }} />
            <div className="mt-4 grid gap-3">
              {draft.bio ? <p className="whitespace-pre-line text-ui-medium text-ink">{draft.bio}</p> : null}
              {draft.interests.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {draft.interests.map((t) => (
                    <span key={t} className="tag">
                      #{t}
                    </span>
                  ))}
                </div>
              ) : null}
              <ProfileFacts applicant={draft} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
