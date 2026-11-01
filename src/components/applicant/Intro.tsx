"use client";

import { BedDouble, ListOrdered, MapPin, ShieldCheck, Users, UserRound, type LucideIcon } from "lucide-react";
import { useState } from "react";

import { RoomCard } from "@/components/flat/RoomCard";
import { LogoMark } from "@/components/ui/Logo";
import { Spinner } from "@/components/ui/Spinner";
import { euro } from "@/lib/plans";
import type { Flat } from "@/lib/types";
import { Column } from "./FlowShell";

const STEPS: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: Users,
    title: "Mitbewerber einschätzen",
    text: "Du siehst, wer sich schon beworben hat, und sagst bei jeder Person, wie gut ihr zusammen wohnen könntet.",
  },
  {
    icon: ListOrdered,
    title: "Zimmer sortieren",
    text: "Bring die Zimmer in deine Reihenfolge. Zwei Zimmer dürfen auch gleich gut sein.",
  },
  {
    icon: UserRound,
    title: "Profil anlegen",
    text: "Ein paar Fotos und ein paar Sätze über dich, damit die anderen dich auch einschätzen können.",
  },
];

export function rentRange(flat: Flat): string | null {
  const rents = flat.rooms.map((r) => r.rent).filter((r): r is number => typeof r === "number" && r > 0);
  if (!rents.length) return null;
  const min = Math.min(...rents);
  const max = Math.max(...rents);
  return min === max ? `${euro(min)} warm` : `${euro(min)} bis ${euro(max)} warm`;
}

export function PrivacyNote() {
  return (
    <div className="flex gap-3 rounded-xl border border-accent-line bg-accent-soft p-4">
      <ShieldCheck size={18} strokeWidth={1.75} className="mt-0.5 shrink-0 text-accent" />
      <p className="text-ui-small leading-relaxed text-ink">
        Deine Bewertungen, Zimmerwünsche und Kontaktdaten sieht nur der Vermieter. Andere Bewerber sehen nur
        dein Profil, und nur für diese Wohnung. Wenn die Suche vorbei ist, wird deine Bewerbung gelöscht.
      </p>
    </div>
  );
}

export function Intro({
  flat,
  onStart,
  isOwner,
}: {
  flat: Flat;
  onStart: () => Promise<void>;
  isOwner: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const cover = flat.rooms.find((r) => r.photo)?.photo?.url ?? null;
  const place = [flat.district, flat.city].filter(Boolean).join(", ");
  const rent = rentRange(flat);

  const start = async () => {
    setBusy(true);
    setError("");
    try {
      await onStart();
    } catch {
      setError("Das hat nicht geklappt. Prüf deine Verbindung und versuch es nochmal.");
      setBusy(false);
    }
  };

  return (
    <div className="min-h-dvh pb-10">
      <Column className="pt-4">
        <div className="mb-4 flex items-center gap-2 text-ui-small font-semibold text-ink">
          <LogoMark size={18} /> Pairspace
        </div>

        <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-line bg-base-25">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-faint">
              <BedDouble size={40} strokeWidth={1.25} />
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent" />
        </div>

        <h1 className="h1 mt-5 text-ink">{flat.title || "WG Zimmer"}</h1>
        {place ? (
          <p className="mt-1.5 flex items-center gap-1.5 text-ui-medium text-muted">
            <MapPin size={15} strokeWidth={1.75} className="text-faint" />
            {place}
          </p>
        ) : null}
        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="tag">
            {flat.rooms.length} {flat.rooms.length === 1 ? "Zimmer" : "Zimmer frei"}
          </span>
          {rent ? <span className="tag">{rent}</span> : null}
          <span className="tag">möbliert</span>
        </div>

        {flat.description ? (
          <p className="mt-4 whitespace-pre-line text-[15px] leading-relaxed text-muted">{flat.description}</p>
        ) : null}

        {flat.host?.name ? (
          <div className="card mt-5 flex gap-3 p-3">
            <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-base-30">
              {flat.host.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={flat.host.photoUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-ui-medium font-semibold text-muted">
                  {flat.host.name.charAt(0)}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-ui-smaller text-faint">Vermietet von</p>
              <p className="text-ui-medium font-semibold text-ink">{flat.host.name}</p>
              {flat.host.about ? <p className="mt-1 text-ui-small text-muted">{flat.host.about}</p> : null}
            </div>
          </div>
        ) : null}
      </Column>

      {flat.rooms.length ? (
        <section className="mt-7">
          <Column>
            <p className="ui-label">Die Zimmer</p>
          </Column>
          <div className="mx-auto mt-2 flex w-full max-w-[440px] snap-x gap-3 overflow-x-auto px-4 pb-2">
            {flat.rooms.map((room) => (
              <div key={room.id} className="w-[240px] shrink-0 snap-start">
                <RoomCard room={room} compact />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <Column className="mt-7">
        <p className="ui-label">So läuft es</p>
        <ol className="mt-3 grid gap-4">
          {STEPS.map(({ icon: Icon, title, text }, i) => (
            <li key={title} className="flex gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line bg-base-10 text-accent">
                <Icon size={15} strokeWidth={1.75} />
              </span>
              <div>
                <p className="text-ui-medium font-semibold text-ink">
                  <span className="text-faint">{i + 1}.</span> {title}
                </p>
                <p className="mt-0.5 text-ui-small leading-relaxed text-muted">{text}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-6">
          <PrivacyNote />
        </div>

        {isOwner ? (
          <p className="mt-6 rounded-xl border border-line bg-base-10 p-4 text-ui-small text-muted">
            Das ist deine eigene Wohnung. So sehen Bewerber deinen Link. Zum Ausprobieren öffne ihn in einem
            privaten Fenster.
          </p>
        ) : (
          <>
            <button type="button" className="btn btn-cta btn-lg mt-6 w-full" onClick={start} disabled={busy}>
              {busy ? <Spinner size={14} /> : null}
              Los geht&apos;s
            </button>
            {error ? <p className="mt-2 text-center text-ui-small text-red">{error}</p> : null}
            <p className="mt-3 text-center text-ui-smaller text-faint">
              Kein Download, kein Passwort. Dauert etwa fünf Minuten.
            </p>
          </>
        )}
      </Column>
    </div>
  );
}

export function NotLive({ isOwner }: { isOwner: boolean }) {
  return (
    <div className="flex min-h-dvh items-center justify-center px-6">
      <div className="max-w-[360px] text-center fade-up">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-line bg-base-10 text-ink">
          <LogoMark size={22} />
        </div>
        <h1 className="h3 mt-5 text-ink">Diese Wohnung ist gerade nicht freigeschaltet</h1>
        <p className="mt-3 text-ui-medium leading-relaxed text-muted">
          {isOwner
            ? "Schalte den Link in deinem Konto frei, dann können sich Bewerber hier melden."
            : "Vielleicht ist die Suche schon vorbei, oder der Link ist noch nicht aktiv. Frag am besten bei der Person nach, die dir den Link geschickt hat."}
        </p>
      </div>
    </div>
  );
}
