"use client";

import {
  BedDouble,
  Bell,
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

import { FeedbackButton } from "@/components/feedback/Feedback";
import { Toggle } from "@/components/ui/Field";
import { Spinner } from "@/components/ui/Spinner";
import { deletePhoto } from "@/lib/firebase/storage";
import { saveVote, setNotify, withdrawApplication } from "@/lib/firebase/data";
import type { T } from "@/lib/i18n";
import { useLocale, useT } from "@/lib/i18n/client";
import type { Applicant, ApplicantContact, Flat, Vote } from "@/lib/types";
import { Column, FlowHeader } from "./FlowShell";
import { PrivacyNote } from "./Intro";
import { displayName } from "./ProfileDetails";
import { useSerial } from "./useSerial";
import { VoteDots } from "./VoteButtons";

export type HomeTarget = "rate" | "rooms" | "profile" | "contact";

function favouriteRoom(flat: Flat, ranks: Record<string, number> | undefined, t: T): string | null {
  if (!ranks) return null;
  const best = flat.rooms
    .filter((r) => typeof ranks[r.id] === "number")
    .sort((a, b) => ranks[a.id] - ranks[b.id]);
  if (!best.length) return null;
  const top = best.filter((r) => ranks[r.id] === ranks[best[0].id]);
  return top.map((r) => r.name).join(t(" oder ", " or "));
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
  const t = useT();
  const fav = favouriteRoom(flat, ranks, t);
  const lines = [
    ratedCount
      ? t(
          `Du hast ${ratedCount} Mitbewerber eingeschätzt.`,
          ratedCount === 1 ? "You rated 1 other applicant." : `You rated ${ratedCount} other applicants.`,
        )
      : t("Sobald andere dazukommen, kannst du sie einschätzen.", "As soon as others join, you can rate them."),
    fav ? t(`Dein Lieblingszimmer: ${fav}.`, `Your favourite room: ${fav}.`) : null,
    t(
      "Dein Profil ist jetzt für die anderen Bewerber dieser Wohnung sichtbar.",
      "Your profile is now visible to the other applicants for this flat.",
    ),
    t(
      "Der Vermieter sieht, wer gut zusammenpasst, und meldet sich bei dir.",
      "The landlord sees who fits well together and will get in touch with you.",
    ),
  ].filter(Boolean) as string[];

  return (
    <div className="flex min-h-dvh items-center">
      <Column className="py-12 fade-up">
        <span className="flex h-14 w-14 items-center justify-center rounded-full border border-accent-line bg-accent-soft text-accent">
          <PartyPopper size={24} strokeWidth={1.75} />
        </span>
        <h1 className="h2 mt-5 text-ink">{t("Du bist dabei", "You're in")}</h1>
        <p className="mt-2 text-ui-medium text-muted">
          {t(
            `Deine Bewerbung für ${flat.title || "diese Wohnung"} ist vollständig.`,
            `Your application for ${flat.title || "this flat"} is complete.`,
          )}
        </p>
        <ul className="mt-6 grid gap-3">
          {lines.map((line) => (
            <li key={line} className="flex gap-2.5 text-ui-medium text-ink">
              <CircleCheck size={17} strokeWidth={1.75} className="mt-0.5 shrink-0 text-green" />
              {line}
            </li>
          ))}
        </ul>
        <button type="button" className="btn btn-cta btn-lg mt-8 w-full" onClick={onContinue}>
          {t("Zur Übersicht", "Go to overview")}
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
  const t = useT();
  const locale = useLocale();
  const serial = useSerial();
  const [local, setLocal] = useState<Record<string, Vote>>({});
  // Shown right away, the snapshot catches up a moment later.
  const [notifyLocal, setNotifyLocal] = useState<boolean | null>(null);
  const notify = notifyLocal ?? contact?.notify ?? false;
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const merged = useMemo(() => ({ ...votes, ...local }), [votes, local]);
  const sorted = useMemo(() => [...others].sort((a, b) => a.createdAt - b.createdAt), [others]);
  const unrated = sorted.filter((o) => merged[o.uid] === undefined).length;
  const rated = sorted.length - unrated;
  const fav = favouriteRoom(flat, ranks, t);

  const change = (other: string, vote: Vote) => {
    setLocal((l) => ({ ...l, [other]: vote }));
    serial(() => saveVote(flat.id, uid, other, vote)).catch(() =>
      setError(t("Eine Änderung konnte nicht gespeichert werden.", "A change could not be saved.")),
    );
  };

  const toggleNotify = (on: boolean) => {
    setNotifyLocal(on);
    setError("");
    setNotify(flat.id, uid, on, locale).catch(() => {
      setNotifyLocal(!on);
      setError(t("Die Einstellung konnte nicht gespeichert werden.", "The setting could not be saved."));
    });
  };

  // The server removes the rest: leftover photos and how others rated you.
  const withdraw = async () => {
    setBusy(true);
    try {
      await withdrawApplication(flat.id, uid);
      await Promise.all((me.photos ?? []).map((p) => deletePhoto(p.path)));
      onWithdrawn();
    } catch {
      setError(t("Löschen hat nicht geklappt. Versuch es nochmal.", "Deleting did not work. Try again."));
      setBusy(false);
      setConfirm(false);
    }
  };

  return (
    <div className="min-h-dvh pb-12">
      <FlowHeader
        title={flat.title || t("Deine Bewerbung", "Your application")}
        subtitle={t("Deine Bewerbung", "Your application")}
        flatId={flat.id}
      />
      <Column className="pt-5">
        <div className="card flex items-center gap-3 p-3">
          <Avatar applicant={me} size={52} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-ui-medium font-semibold text-ink">{displayName(me, t)}</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-ui-smaller text-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-green" />
              {t("Bewerbung aktiv", "Application active")}
            </p>
          </div>
        </div>

        {unrated > 0 ? (
          <div className="mt-4 rounded-xl border border-accent-line bg-accent-soft p-4 fade-up">
            <p className="text-ui-medium font-semibold text-ink">
              {unrated === 1
                ? t("1 neue Person zum Einschätzen", "1 new person to rate")
                : t(`${unrated} neue Personen zum Einschätzen`, `${unrated} new people to rate`)}
            </p>
            <p className="mt-1 text-ui-small text-muted">
              {t(
                "Seit deinem letzten Besuch haben sich weitere Leute beworben.",
                "More people have applied since your last visit.",
              )}
            </p>
            <button type="button" className="btn btn-cta mt-3" onClick={() => onGo("rate")}>
              {t("Jetzt einschätzen", "Rate now")}
            </button>
          </div>
        ) : null}

        <div className="card mt-4 p-1.5">
          <NavRow
            icon={Users}
            title={t("Mitbewerber einschätzen", "Rate the other applicants")}
            detail={
              sorted.length
                ? t(`${rated} von ${sorted.length} eingeschätzt`, `${rated} of ${sorted.length} rated`)
                : t("Noch niemand sonst da", "Nobody else here yet")
            }
            onClick={() => onGo("rate")}
          />
          {flat.rooms.length > 1 ? (
            <NavRow
              icon={BedDouble}
              title={t("Zimmer sortieren", "Rank the rooms")}
              detail={fav ? t(`Favorit: ${fav}`, `Favourite: ${fav}`) : t("Noch nicht sortiert", "Not ranked yet")}
              onClick={() => onGo("rooms")}
            />
          ) : null}
          <NavRow
            icon={UserRound}
            title={t("Profil bearbeiten", "Edit profile")}
            detail={me.occupation || null}
            onClick={() => onGo("profile")}
          />
          <NavRow
            icon={Mail}
            title={t("Kontakt und Benachrichtigungen", "Contact and notifications")}
            detail={contact?.email ?? t("Noch keine Mail hinterlegt", "No email added yet")}
            onClick={() => onGo("contact")}
          />
        </div>

        {contact?.email ? (
          <div className="card mt-4 flex items-center gap-3 p-3">
            <Bell size={16} strokeWidth={1.75} className="shrink-0 text-faint" />
            <div className="min-w-0 flex-1">
              <p className="text-ui-small text-ink">{t("Mail bei neuen Mitbewerbern", "Email me about new applicants")}</p>
              <p className="mt-0.5 text-ui-smaller text-faint">
                {notify
                  ? t(`Höchstens eine am Tag an ${contact.email}`, `At most one a day to ${contact.email}`)
                  : t("Aus. Schau einfach ab und zu vorbei.", "Off. Just check back now and then.")}
              </p>
            </div>
            <Toggle checked={notify} onChange={toggleNotify} label={t("Mail bei neuen Mitbewerbern", "Email me about new applicants")} />
          </div>
        ) : null}

        {sorted.length ? (
          <section className="mt-8">
            <p className="ui-label">{t("Deine Einschätzungen", "Your ratings")}</p>
            <ul className="mt-2 grid gap-1">
              {sorted.map((o) => (
                <li key={o.uid} className="flex items-center gap-3 rounded-lg px-1 py-1.5">
                  <Avatar applicant={o} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-ui-small font-medium text-ink">{displayName(o, t)}</p>
                    {o.occupation ? <p className="truncate text-ui-smaller text-faint">{o.occupation}</p> : null}
                  </div>
                  <VoteDots value={merged[o.uid] ?? null} onChange={(v) => change(o.uid, v)} />
                </li>
              ))}
            </ul>
            <p className="mt-2 text-ui-smaller text-faint">
              {t("Nur der Vermieter sieht, wie du andere eingeschätzt hast.", "Only the landlord sees how you rated others.")}
            </p>
          </section>
        ) : null}

        <div className="mt-8">
          <PrivacyNote />
        </div>

        {error ? <p className="mt-4 text-ui-small text-red">{error}</p> : null}

        <div className="mt-8 border-t border-line pt-5">
          {confirm ? (
            <div className="rounded-xl border border-line bg-base-10 p-4">
              <p className="text-ui-medium font-semibold text-ink">
                {t("Bewerbung wirklich löschen?", "Delete your application?")}
              </p>
              <p className="mt-1 text-ui-small text-muted">
                {t(
                  "Dein Profil, deine Fotos, deine Einschätzungen und deine Kontaktdaten für diese Wohnung werden gelöscht, auch wie die anderen dich eingeschätzt haben. Das lässt sich nicht rückgängig machen.",
                  "Your profile, photos, ratings and contact details for this flat will be deleted, along with how the others rated you. This can't be undone.",
                )}
              </p>
              <div className="mt-4 flex gap-2">
                <button type="button" className="btn btn-danger" onClick={withdraw} disabled={busy}>
                  {busy ? <Spinner size={13} /> : <Trash2 size={14} strokeWidth={1.75} />}
                  {t("Ja, löschen", "Yes, delete")}
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setConfirm(false)} disabled={busy}>
                  {t("Abbrechen", "Cancel")}
                </button>
              </div>
            </div>
          ) : (
            <button type="button" className="btn btn-ghost text-red hover:text-red" onClick={() => setConfirm(true)}>
              <Trash2 size={14} strokeWidth={1.75} />
              {t("Bewerbung löschen", "Delete my application")}
            </button>
          )}
        </div>

        <div className="mt-6">
          <FeedbackButton source="applicant" variant="text" flatId={flat.id} />
        </div>
      </Column>
    </div>
  );
}
