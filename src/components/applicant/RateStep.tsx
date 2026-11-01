"use client";

import { Lock, PartyPopper, Undo2, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { saveVote } from "@/lib/firebase/data";
import type { Applicant, Vote } from "@/lib/types";
import { BottomBar, Column, FlowHeader } from "./FlowShell";
import { ProfileCard } from "./ProfileCard";
import { ProfileFacts } from "./ProfileDetails";
import { useSerial } from "./useSerial";
import { VoteButtons } from "./VoteButtons";

type Direction = "left" | "right" | "up";

function directionOf(vote: Vote): Direction {
  if (vote < 0) return "left";
  if (vote > 0) return "right";
  return "up";
}

const ANIMATION_MS = 300;

/**
 * Tinder style rating of the other applicants. Unrated people come first in
 * the order they applied; people who join while this screen is open are
 * appended. Votes are applied locally at once and written one by one.
 */
export function RateStep({
  flatId,
  uid,
  flatTitle,
  others,
  votes,
  returning,
  onDone,
  onBack,
}: {
  flatId: string;
  uid: string;
  flatTitle: string;
  others: Applicant[];
  votes: Record<string, Vote>;
  returning: boolean;
  onDone: () => void;
  onBack?: () => void;
}) {
  const serial = useSerial();
  // Optimistic overlay over the stored votes. null means removed by undo.
  const [local, setLocal] = useState<Record<string, Vote | null>>({});
  const [history, setHistory] = useState<string[]>([]);
  const [front, setFront] = useState<string | null>(null);
  const [leaving, setLeaving] = useState<{ id: string; dir: Direction } | null>(null);
  const [error, setError] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  const effective = useCallback(
    (id: string): Vote | null => (id in local ? local[id] : (votes[id] ?? null)),
    [local, votes],
  );

  const ordered = useMemo(() => [...others].sort((a, b) => a.createdAt - b.createdAt), [others]);
  const pending = useMemo(() => {
    const list = ordered.filter((o) => effective(o.uid) === null);
    if (front) {
      const i = list.findIndex((o) => o.uid === front);
      if (i > 0) list.unshift(...list.splice(i, 1));
    }
    return list;
  }, [ordered, effective, front]);

  const byId = useMemo(() => new Map(others.map((o) => [o.uid, o])), [others]);
  const top = leaving ? byId.get(leaving.id) : pending[0];
  const under = pending.find((o) => o.uid !== top?.uid);
  const total = others.length;
  const rated = ordered.filter((o) => effective(o.uid) !== null).length;
  const position = Math.min(rated + 1, total);

  const vote = useCallback(
    (value: Vote) => {
      if (!top || leaving) return;
      const id = top.uid;
      setError("");
      setLeaving({ id, dir: directionOf(value) });
      serial(() => saveVote(flatId, uid, id, value)).catch(() =>
        setError("Eine Bewertung konnte nicht gespeichert werden. Prüf deine Verbindung."),
      );
      timer.current = setTimeout(() => {
        setLocal((l) => ({ ...l, [id]: value }));
        setHistory((h) => [...h, id]);
        setFront(null);
        setLeaving(null);
      }, ANIMATION_MS);
    },
    [top, leaving, serial, flatId, uid],
  );

  const undo = useCallback(() => {
    if (leaving || !history.length) return;
    const id = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setLocal((l) => ({ ...l, [id]: null }));
    setFront(id);
    serial(() => saveVote(flatId, uid, id, null)).catch(() => undefined);
  }, [leaving, history, serial, flatId, uid]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      const n = Number(e.key);
      if (n >= 1 && n <= 5) {
        e.preventDefault();
        vote((n - 3) as Vote);
      } else if (e.key === "Backspace") {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [vote, undo]);

  const header = (
    <FlowHeader
      title={returning ? "Mitbewerber einschätzen" : flatTitle}
      subtitle={top ? `Person ${position} von ${total}` : returning ? undefined : "Schritt 1 von 4"}
      onBack={onBack}
      step={returning ? undefined : 0}
      right={
        history.length ? (
          <button type="button" className="btn btn-ghost" onClick={undo} aria-label="Letzte Bewertung zurücknehmen">
            <Undo2 size={15} strokeWidth={1.75} />
            Zurück
          </button>
        ) : null
      }
    />
  );

  if (!top) {
    const nobody = total === 0;
    return (
      <div className="flex min-h-dvh flex-col">
        {header}
        <Column className="flex flex-1 flex-col items-center justify-center py-12 text-center fade-up">
          <span className="flex h-14 w-14 items-center justify-center rounded-full border border-line bg-base-10 text-accent">
            {nobody ? <Users size={24} strokeWidth={1.75} /> : <PartyPopper size={24} strokeWidth={1.75} />}
          </span>
          <h2 className="h3 mt-5 text-ink">{nobody ? "Du bist unter den Ersten" : "Alle eingeschätzt"}</h2>
          <p className="mt-2 max-w-[320px] text-ui-medium leading-relaxed text-muted">
            {nobody
              ? "Sobald weitere Bewerber dazukommen, kannst du sie hier einschätzen."
              : `Du hast alle ${total} Mitbewerber eingeschätzt. Wenn jemand Neues dazukommt, kannst du später weitermachen.`}
          </p>
          <button type="button" className="btn btn-cta btn-lg mt-7 w-full max-w-[320px]" onClick={onDone}>
            {returning ? "Zur Übersicht" : "Weiter zu den Zimmern"}
          </button>
        </Column>
      </div>
    );
  }

  const animation = leaving ? `card-out-${leaving.dir}` : "";

  return (
    <div className="flex min-h-dvh flex-col">
      {header}
      <Column className="flex-1 pt-4">
        <div className="relative">
          {under ? (
            <div className="pointer-events-none absolute inset-0 origin-bottom scale-[0.95] opacity-60" aria-hidden="true">
              <ProfileCard key={`under-${under.uid}`} applicant={under} />
            </div>
          ) : null}
          <div key={top.uid} className={`relative ${animation || "fade-up"}`}>
            <ProfileCard applicant={top} />
          </div>
        </div>

        <div key={`details-${top.uid}`} className={`mt-5 grid gap-4 ${leaving ? "opacity-0" : "fade-up"}`}>
          {top.bio ? <p className="whitespace-pre-line text-[15px] leading-relaxed text-ink">{top.bio}</p> : null}
          {top.interests?.length ? (
            <div className="flex flex-wrap gap-1.5">
              {top.interests.map((t) => (
                <span key={t} className="tag">
                  #{t}
                </span>
              ))}
            </div>
          ) : null}
          <ProfileFacts applicant={top} />
        </div>
      </Column>

      <BottomBar>
        <p className="mb-3 text-center text-ui-small text-muted">
          Wie gut könntest du mit <span className="font-semibold text-ink">{top.firstName || "dieser Person"}</span>{" "}
          zusammen wohnen?
        </p>
        <VoteButtons onVote={vote} disabled={Boolean(leaving)} />
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="flex items-center gap-1.5 text-ui-smaller text-faint">
            <Lock size={11} strokeWidth={2} />
            Deine Einschätzung sieht nur der Vermieter.
          </p>
          {!returning ? (
            <button type="button" className="text-ui-smaller text-faint underline-offset-2 hover:text-muted hover:underline" onClick={onDone}>
              Später weiter
            </button>
          ) : null}
        </div>
        {error ? <p className="mt-2 text-center text-ui-small text-red">{error}</p> : null}
      </BottomBar>
    </div>
  );
}
