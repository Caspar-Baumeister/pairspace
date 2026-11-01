"use client";

import {
  BedDouble,
  ChevronRight,
  CircleCheck,
  Mail,
  PartyPopper,
  Trash2,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useState } from "react";

import { Spinner } from "@/components/ui/Spinner";
import { deletePhoto } from "@/lib/firebase/storage";
import { saveVote, withdrawApplication } from "@/lib/firebase/data";
import type { Applicant, ApplicantContact, Flat, Vote } from "@/lib/types";
import { Column, FlowHeader } from "./FlowShell";
import { PrivacyNote } from "./Intro";
import { displayName } from "./ProfileDetails";
import { useSerial } from "./useSerial";
import { VoteDots } from "./VoteButtons";

export type HomeTarget = "rate" | "rooms" | "profile" | "contact";

function favouriteRoom(flat: Flat, ranks: Record<string, number> | undefined): string | null {
  if (!ranks) return null;
  const best = flat.rooms
    .filter((r) => typeof ranks[r.id] === "number")
    .sort((a, b) => ranks[a.id] - ranks[b.id]);
  if (!best.length) return null;
  const top = best.filter((r) => ranks[r.id] === ranks[best[0].id]);
  return top.map((r) => r.name).join(" oder ");
}

function Avatar({ applicant, size = 36 }: { applicant: Applicant; size?: number }) {
  const photo = applicant.photos?.[0];
  return (
    <span
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-base-30 text-faint"
      style={{ width: size, height: size }}
    >
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photo.url} alt="" className="h-full w-full object-cover" />
      ) : (
        <UserRound size={size * 0.5} strokeWidth={1.5} />
      )}
    </span>
  );
}

function NavRow({
  icon: Icon,
  title,
  detail,
  onClick,
}: {
  icon: LucideIcon;
  title: string;
  detail?: string | null;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className="nav-item w-full py-2.5 text-left">
      <Icon size={16} strokeWidth={1.75} className="shrink-0 text-faint" />
      <span className="min-w-0 flex-1">
        <span className="block text-ui-medium text-ink">{title}</span>
        {detail ? <span className="block truncate text-ui-smaller text-faint">{detail}</span> : null}
      </span>
      <ChevronRight size={15} strokeWidth={1.75} className="shrink-0 text-faint" />
    </button>
  );
}

export function DoneView({
  flat,
  ratedCount,
  ranks,
  onContinue,
}: {
  flat: Flat;
  ratedCount: number;
  ranks: Record<string, number> | undefined;
  onContinue: () => void;
}) {
  const fav = favouriteRoom(flat, ranks);
  const lines = [
    ratedCount
      ? `Du hast ${ratedCount} Mitbewerber eingeschätzt.`
      : "Sobald andere dazukommen, kannst du sie einschätzen.",
    fav ? `Dein Lieblingszimmer: ${fav}.` : null,
    "Dein Profil ist jetzt für die anderen Bewerber dieser Wohnung sichtbar.",
    "Der Vermieter sieht, wer gut zusammenpasst, und meldet sich bei dir.",
  ].filter(Boolean) as string[];

  return (
    <div className="flex min-h-dvh items-center">
      <Column className="py-12 fade-up">
        <span className="flex h-14 w-14 items-center justify-center rounded-full border border-accent-line bg-accent-soft text-accent">
          <PartyPopper size={24} strokeWidth={1.75} />
        </span>
        <h1 className="h2 mt-5 text-ink">Du bist dabei</h1>
        <p className="mt-2 text-ui-medium text-muted">Deine Bewerbung für {flat.title || "diese Wohnung"} ist vollständig.</p>
        <ul className="mt-6 grid gap-3">
          {lines.map((line) => (
            <li key={line} className="flex gap-2.5 text-ui-medium text-ink">
              <CircleCheck size={17} strokeWidth={1.75} className="mt-0.5 shrink-0 text-green" />
              {line}
            </li>
          ))}
        </ul>
        <button type="button" className="btn btn-cta btn-lg mt-8 w-full" onClick={onContinue}>
          Zur Übersicht
        </button>
      </Column>
    </div>
  );
}

/** What a returning applicant sees: status, new people to rate, edit links. */
export function HomeView({
  flat,
  uid,
  me,
  others,
  votes,
  ranks,
  contact,
  onGo,
  onWithdrawn,
}: {
  flat: Flat;
  uid: string;
  me: Applicant;
  others: Applicant[];
  votes: Record<string, Vote>;
  ranks: Record<string, number> | undefined;
  contact: ApplicantContact | null;
  onGo: (target: HomeTarget) => void;
  onWithdrawn: () => void;
}) {
  const serial = useSerial();
  const [local, setLocal] = useState<Record<string, Vote>>({});
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const merged = useMemo(() => ({ ...votes, ...local }), [votes, local]);
  const sorted = useMemo(() => [...others].sort((a, b) => a.createdAt - b.createdAt), [others]);
  const unrated = sorted.filter((o) => merged[o.uid] === undefined).length;
  const rated = sorted.length - unrated;
  const fav = favouriteRoom(flat, ranks);

  const change = (other: string, vote: Vote) => {
    setLocal((l) => ({ ...l, [other]: vote }));
    serial(() => saveVote(flat.id, uid, other, vote)).catch(() =>
      setError("Eine Änderung konnte nicht gespeichert werden."),
    );
  };

  const withdraw = async () => {
    setBusy(true);
    try {
      await withdrawApplication(flat.id, uid);
      await Promise.all((me.photos ?? []).map((p) => deletePhoto(p.path)));
      onWithdrawn();
    } catch {
      setError("Zurückziehen hat nicht geklappt. Versuch es nochmal.");
      setBusy(false);
      setConfirm(false);
    }
  };

  return (
    <div className="min-h-dvh pb-12">
      <FlowHeader title={flat.title || "Deine Bewerbung"} subtitle="Deine Bewerbung" />
      <Column className="pt-5">
        <div className="card flex items-center gap-3 p-3">
          <Avatar applicant={me} size={52} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-ui-medium font-semibold text-ink">{displayName(me)}</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-ui-smaller text-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-green" />
              Bewerbung aktiv
            </p>
          </div>
        </div>

        {unrated > 0 ? (
          <div className="mt-4 rounded-xl border border-accent-line bg-accent-soft p-4 fade-up">
            <p className="text-ui-medium font-semibold text-ink">
              {unrated === 1 ? "1 neue Person" : `${unrated} neue Personen`} zum Einschätzen
            </p>
            <p className="mt-1 text-ui-small text-muted">
              Seit deinem letzten Besuch haben sich weitere Leute beworben.
            </p>
            <button type="button" className="btn btn-cta mt-3" onClick={() => onGo("rate")}>
              Jetzt einschätzen
            </button>
          </div>
        ) : null}

        <div className="card mt-4 p-1.5">
          <NavRow
            icon={Users}
            title="Mitbewerber einschätzen"
            detail={sorted.length ? `${rated} von ${sorted.length} eingeschätzt` : "Noch niemand sonst da"}
            onClick={() => onGo("rate")}
          />
          {flat.rooms.length > 1 ? (
            <NavRow icon={BedDouble} title="Zimmer sortieren" detail={fav ? `Favorit: ${fav}` : "Noch nicht sortiert"} onClick={() => onGo("rooms")} />
          ) : null}
          <NavRow icon={UserRound} title="Profil bearbeiten" detail={me.occupation || null} onClick={() => onGo("profile")} />
          <NavRow
            icon={Mail}
            title="Kontakt und Benachrichtigungen"
            detail={contact?.email ?? "Noch keine Mail hinterlegt"}
            onClick={() => onGo("contact")}
          />
        </div>

        {sorted.length ? (
          <section className="mt-8">
            <p className="ui-label">Deine Einschätzungen</p>
            <ul className="mt-2 grid gap-1">
              {sorted.map((o) => (
                <li key={o.uid} className="flex items-center gap-3 rounded-lg px-1 py-1.5">
                  <Avatar applicant={o} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-ui-small font-medium text-ink">{displayName(o)}</p>
                    {o.occupation ? <p className="truncate text-ui-smaller text-faint">{o.occupation}</p> : null}
                  </div>
                  <VoteDots value={merged[o.uid] ?? null} onChange={(v) => change(o.uid, v)} />
                </li>
              ))}
            </ul>
            <p className="mt-2 text-ui-smaller text-faint">Nur der Vermieter sieht, wie du andere eingeschätzt hast.</p>
          </section>
        ) : null}

        <div className="mt-8">
          <PrivacyNote />
        </div>

        {error ? <p className="mt-4 text-ui-small text-red">{error}</p> : null}

        <div className="mt-8 border-t border-line pt-5">
          {confirm ? (
            <div className="rounded-xl border border-line bg-base-10 p-4">
              <p className="text-ui-medium font-semibold text-ink">Bewerbung wirklich zurückziehen?</p>
              <p className="mt-1 text-ui-small text-muted">
                Dein Profil, deine Fotos, deine Einschätzungen und deine Kontaktdaten für diese Wohnung werden
                gelöscht.
              </p>
              <div className="mt-4 flex gap-2">
                <button type="button" className="btn btn-danger" onClick={withdraw} disabled={busy}>
                  {busy ? <Spinner size={13} /> : <Trash2 size={14} strokeWidth={1.75} />}
                  Ja, zurückziehen
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setConfirm(false)} disabled={busy}>
                  Abbrechen
                </button>
              </div>
            </div>
          ) : (
            <button type="button" className="btn btn-ghost text-red hover:text-red" onClick={() => setConfirm(true)}>
              <Trash2 size={14} strokeWidth={1.75} />
              Bewerbung zurückziehen
            </button>
          )}
        </div>
      </Column>
    </div>
  );
}
