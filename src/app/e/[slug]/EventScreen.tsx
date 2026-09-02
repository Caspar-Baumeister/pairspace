"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  CheckIcon,
  MatchList,
  PinIcon,
  SendIcon,
  SparkIcon,
  XIcon,
} from "@/components/app/MatchList";
import { Notice } from "@/components/app/Notice";
import { ParticipantForm, type ParticipantSubmission } from "@/components/app/ParticipantForm";
import { Logo } from "@/components/site/Logo";
import { PersonAvatar } from "@/components/ui/PersonAvatar";
import { poolAvatar, tintFor } from "@/lib/avatar";
import { useAuth } from "@/lib/firebase/auth";
import {
  addWatcher,
  findMyParticipant,
  getEventBySlug,
  requestConnection,
  saveParticipant,
  setParticipantOpen,
  watchConnections,
  watchParticipants,
} from "@/lib/firebase/db";
import { rankMatches } from "@/lib/matching";
import { usePersistentState } from "@/lib/hooks/usePersistentState";
import { deleteParticipantPhoto, uploadParticipantPhoto } from "@/lib/firebase/storage";
import type { Connection, PairspaceEvent, Participant } from "@/lib/types";

type View = "choose" | "join" | "matches" | "notify" | "notified" | "profile";

export function EventScreen({ slug }: { slug: string }) {
  const { ensureAnonymous, configured } = useAuth();

  const [event, setEvent] = useState<PairspaceEvent | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "missing" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [me, setMe] = useState<Participant | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [view, setView] = useState<View>("choose");
  const [tab, setTab] = useState<"people" | "requests">("people");
  const [busy, setBusy] = useState(false);

  // The notify me form is persisted too, so a reload never costs a typed address.
  const [watch, setWatch, { clear: clearWatch }] = usePersistentState<{
    email: string;
    lookingFor: string[];
  }>(`pairspace.notify.${slug}`, { email: "", lookingFor: [] });

  useEffect(() => {
    let live = true;
    (async () => {
      if (!configured) {
        setStatus("error");
        setError("This app is not connected to Firebase yet.");
        return;
      }
      try {
        const found = await getEventBySlug(slug);
        if (!live) return;
        if (!found) {
          setStatus("missing");
          return;
        }
        setEvent(found);
        setStatus("ready");
        const user = await ensureAnonymous();
        const mine = await findMyParticipant(found.id, user.uid);
        if (!live) return;
        if (mine) {
          setMe(mine);
          setView("matches");
        }
      } catch (e) {
        if (!live) return;
        setStatus("error");
        setError(e instanceof Error ? e.message : "Could not open this event");
      }
    })();
    return () => {
      live = false;
    };
  }, [slug, configured, ensureAnonymous]);

  useEffect(() => {
    if (!event || !me) return;
    const unsubP = watchParticipants(event.id, setParticipants);
    const unsubC = watchConnections(event.id, setConnections);
    return () => {
      unsubP();
      unsubC();
    };
  }, [event, me]);

  const matches = useMemo(() => {
    if (!event || !me) return [];
    return rankMatches(me, participants, event);
  }, [event, me, participants]);

  const pendingIds = useMemo(
    () =>
      connections
        .filter((c) => c.fromParticipantId === me?.id && c.status !== "declined")
        .map((c) => c.toParticipantId),
    [connections, me],
  );

  const incoming = useMemo(
    () => connections.filter((c) => c.toParticipantId === me?.id && c.status === "pending"),
    [connections, me],
  );

  const handleJoin = useCallback(
    async (value: ParticipantSubmission) => {
      if (!event) return;
      setBusy(true);
      setError(null);
      try {
        const user = await ensureAnonymous();

        // Resolve the photo first, so a failed upload never leaves a profile
        // pointing at an object that is not there.
        let photoUrl = me?.photoUrl ?? null;
        let photoPath = me?.photoPath ?? null;

        if (event.allowPhotos && value.photo.blob) {
          const file = new File([value.photo.blob], "photo.webp", { type: "image/webp" });
          const uploaded = await uploadParticipantPhoto(event.id, user.uid, file);
          photoUrl = uploaded.url;
          photoPath = uploaded.path;
        } else if (value.photo.removed) {
          if (photoPath) await deleteParticipantPhoto(photoPath);
          photoUrl = null;
          photoPath = null;
        }

        const saved = await saveParticipant(
          event.id,
          user.uid,
          {
            firstName: value.firstName.trim(),
            categoryIds: value.categoryIds,
            lookingForIds: value.lookingForIds,
            answers: value.answers,
            note: value.note.trim(),
            photoUrl,
            photoPath,
            email: value.email.trim().toLowerCase(),
            emailVerified: false,
            open: me?.open ?? true,
            notifyOnMatch: value.notifyOnMatch,
          },
          me?.id,
        );
        setMe(saved);
        setView("matches");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not save your profile");
      } finally {
        setBusy(false);
      }
    },
    [event, me, ensureAnonymous],
  );

  if (status === "loading") {
    return <Centered>Opening the event</Centered>;
  }

  if (status === "missing") {
    return (
      <Centered>
        <h1 className="display-m">This event link does not exist</h1>
        <p className="mt-3 text-[0.9375rem] text-ink-muted">
          Check the link with the person who sent it to you.
        </p>
        <Link href="/" className="btn btn-secondary mt-6">
          What is Pairspace
        </Link>
      </Centered>
    );
  }

  if (status === "error" || !event) {
    return (
      <Centered>
        <Notice tone="danger" title="Could not open this event">
          {error ?? "Unknown error"}
        </Notice>
      </Centered>
    );
  }

  return (
    <div className="wash min-h-dvh bg-canvas">
      <header className="sticky top-0 z-40 border-b border-line/60 bg-canvas/75 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-[760px] items-center justify-between px-5">
          <Logo />
          {me ? (
            <button
              type="button"
              aria-label={view === "profile" ? "Back to people" : "Edit my profile"}
              onClick={() => setView(view === "profile" ? "matches" : "profile")}
              className="story-ring cursor-pointer transition-transform hover:scale-105"
            >
              <PersonAvatar
                name={me.firstName}
                seed={me.id}
                photoUrl={me.photoUrl}
                size={38}
                ring={false}
              />
            </button>
          ) : null}
        </div>
      </header>

      <main id="main" className="mx-auto w-full max-w-[760px] px-5 pb-24 pt-8">
        {me && view !== "profile" ? (
          <section aria-label="Greeting">
            <div className="flex items-center gap-4">
              <PersonAvatar name={me.firstName} seed={me.id} photoUrl={me.photoUrl} size={56} />
              <div className="min-w-0">
                <p className="text-[0.875rem] text-ink-muted">Hello,</p>
                <p className="truncate font-display text-[1.625rem] font-bold tracking-[-0.03em] text-ink">
                  {me.firstName}
                </p>
              </div>
            </div>
            <p className="mt-3 flex items-center gap-1.5 text-[0.875rem] text-ink-muted">
              <PinIcon size={14} />
              <span className="truncate">
                {event.name}
                {event.location ? ` · ${event.location}` : ""}
              </span>
            </p>
          </section>
        ) : (
          <section>
            <p className="eyebrow flex items-center gap-1.5">
              {event.location ? (
                <>
                  <PinIcon size={13} />
                  {event.location}
                </>
              ) : (
                "Participant matching"
              )}
            </p>
            <h1 className="display-m mt-3 text-balance">{event.name}</h1>
            {event.description ? (
              <p className="mt-4 max-w-[54ch] text-[1.0625rem] leading-relaxed text-ink-muted">
                {event.description}
              </p>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-1.5">
              {event.categories.map((c) => (
                <span
                  key={c.id}
                  className="rounded-full border border-line bg-surface/70 px-3 py-1 text-[0.8125rem] font-medium text-ink-secondary"
                >
                  {c.label}
                </span>
              ))}
            </div>
          </section>
        )}

        {event.status === "closed" && !me ? (
          <div className="mt-8">
            <Notice tone="warning" title="This event is closed">
              The organizer stopped taking new participants.
            </Notice>
          </div>
        ) : null}

        {error ? (
          <div className="mt-8">
            <Notice tone="danger" title="Something went wrong">{error}</Notice>
          </div>
        ) : null}

        {view === "choose" && !me ? (
          <section className="mt-10">
            <BubbleCluster />

            <div className="sheet mt-8 p-6 sm:p-8">
              <h2 className="heading">Your partner is already looking</h2>
              <p className="mt-2 max-w-[48ch] text-[0.9375rem] leading-relaxed text-ink-muted">
                Create a profile for this event only, see who else is searching, and send a request
                to the people who fit.
              </p>
              <button
                type="button"
                className="btn btn-primary mt-6 w-full sm:w-auto"
                onClick={() => setView("join")}
                disabled={event.status === "closed"}
              >
                Find my partner
                <SendIcon size={15} />
              </button>
              <button
                type="button"
                className="btn btn-ghost mt-2 w-full sm:mt-0 sm:ml-2 sm:w-auto"
                onClick={() => setView("notify")}
              >
                Just notify me by email
              </button>
              {event.allowPhotos ? (
                <p className="mt-4 text-[0.8125rem] text-ink-faint">
                  {event.requirePhotos
                    ? "This event asks every participant for a photo."
                    : "You can add a photo, or keep the illustrated portrait."}
                </p>
              ) : null}
            </div>

            <p className="mt-5 text-center text-[0.8125rem] text-ink-faint">
              Your profile exists inside this event only. It is deleted {event.retentionDays} days
              after the event ends and is never shown in search engines.
            </p>
          </section>
        ) : null}

        {view === "join" ? (
          <section className="mt-10">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="icon-btn"
                aria-label="Back"
                onClick={() => setView("choose")}
              >
                <BackIcon />
              </button>
              <div>
                <h2 className="heading">Your event profile</h2>
                <p className="text-[0.875rem] text-ink-muted">
                  Takes about a minute. No password, no app.
                </p>
              </div>
            </div>
            <div className="sheet mt-6 p-6 sm:p-8">
              <ParticipantForm event={event} onSubmit={handleJoin} busy={busy} />
            </div>
          </section>
        ) : null}

        {view === "profile" && me ? (
          <section className="mt-2">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="icon-btn"
                aria-label="Back to people"
                onClick={() => setView("matches")}
              >
                <BackIcon />
              </button>
              <h2 className="heading">Edit your profile</h2>
            </div>
            <div className="sheet mt-6 p-6 sm:p-8">
              <ParticipantForm event={event} existing={me} onSubmit={handleJoin} busy={busy} />
            </div>
            <div className="card mt-6 p-5">
              <p className="text-[0.9375rem] font-medium text-ink">Still looking for a partner?</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="chip"
                  data-active={me.open}
                  onClick={() => {
                    setMe({ ...me, open: true });
                    void setParticipantOpen(event.id, me.id, true);
                  }}
                >
                  Yes, still open
                </button>
                <button
                  type="button"
                  className="chip"
                  data-active={!me.open}
                  onClick={() => {
                    setMe({ ...me, open: false });
                    void setParticipantOpen(event.id, me.id, false);
                  }}
                >
                  I found someone
                </button>
              </div>
            </div>
          </section>
        ) : null}

        {view === "matches" && me ? (
          <section className="mt-7">
            {matches.length ? (
              <div
                className="-mx-5 flex gap-4 overflow-x-auto px-5 pb-1 no-scrollbar"
                aria-label="People at this event"
              >
                <button
                  type="button"
                  className="flex w-16 shrink-0 cursor-pointer flex-col items-center gap-1.5"
                  onClick={() => setView("profile")}
                >
                  <span className="relative">
                    <PersonAvatar name={me.firstName} seed={me.id} photoUrl={me.photoUrl} size={56} />
                    <span
                      className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full text-white outline-2 outline-canvas"
                      style={{ background: "var(--gradient-accent)" }}
                      aria-hidden="true"
                    >
                      <PlusIcon />
                    </span>
                  </span>
                  <span className="text-[0.75rem] text-ink-muted">You</span>
                </button>
                {matches.map(({ participant }) => (
                  <a
                    key={participant.id}
                    href={`#person-${participant.id}`}
                    className="flex w-16 shrink-0 flex-col items-center gap-1.5"
                  >
                    <span className="story-ring">
                      <PersonAvatar
                        name={participant.firstName}
                        seed={participant.id}
                        photoUrl={participant.photoUrl}
                        size={52}
                        ring={false}
                      />
                    </span>
                    <span className="w-full truncate text-center text-[0.75rem] text-ink-muted">
                      {participant.firstName}
                    </span>
                  </a>
                ))}
              </div>
            ) : null}

            <div className="mt-6 flex items-center justify-between gap-3">
              <div className="seg" role="tablist" aria-label="People or requests">
                <button
                  type="button"
                  role="tab"
                  aria-selected={tab === "people"}
                  className="seg-item"
                  data-active={tab === "people"}
                  onClick={() => setTab("people")}
                >
                  <SparkIcon size={14} />
                  For you
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={tab === "requests"}
                  className="seg-item"
                  data-active={tab === "requests"}
                  onClick={() => setTab("requests")}
                >
                  Requests
                  {incoming.length ? (
                    <span
                      className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[0.6875rem] font-bold ${
                        tab === "requests" ? "bg-white/25 text-white" : "bg-accent text-white"
                      }`}
                    >
                      {incoming.length}
                    </span>
                  ) : null}
                </button>
              </div>
              <span className="text-[0.875rem] text-ink-faint tnum">
                {matches.length} {matches.length === 1 ? "person" : "people"}
              </span>
            </div>

            {tab === "people" ? (
              <div className="mt-5">
                <MatchList
                  event={event}
                  matches={matches}
                  me={me}
                  pendingIds={pendingIds}
                  onConnect={async (target, message) => {
                    await requestConnection(event.id, me.id, target.id, message);
                  }}
                />
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                {incoming.length ? (
                  incoming.map((c) => {
                    const from = participants.find((p) => p.id === c.fromParticipantId);
                    return (
                      <div key={c.id} className="card p-5">
                        <div className="flex items-center gap-3.5">
                          <PersonAvatar
                            name={from?.firstName ?? "Someone"}
                            seed={c.fromParticipantId}
                            photoUrl={from?.photoUrl}
                            size={48}
                          />
                          <div className="min-w-0">
                            <p className="text-[1rem] font-semibold tracking-[-0.01em] text-ink">
                              {from?.firstName ?? "Someone"}
                            </p>
                            <p className="text-[0.8125rem] text-accent">Wants to pair up with you</p>
                          </div>
                        </div>
                        {c.message ? (
                          <p className="mt-3 rounded-2xl rounded-tl-md bg-sunken px-4 py-3 text-[0.9375rem] leading-relaxed text-ink-secondary">
                            {c.message}
                          </p>
                        ) : null}
                        <RequestActions eventId={event.id} connectionId={c.id} />
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-xl border border-dashed border-line-strong bg-surface p-8 text-center">
                    <p className="text-[0.9375rem] text-ink-muted">
                      No requests yet. Send one yourself — most pairs start that way.
                    </p>
                  </div>
                )}
              </div>
            )}
          </section>
        ) : null}

        {view === "notify" ? (
          <section className="mt-10 max-w-[520px]">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="icon-btn"
                aria-label="Back"
                onClick={() => setView("choose")}
              >
                <BackIcon />
              </button>
              <h2 className="heading">Get notified when someone matching joins</h2>
            </div>
            <p className="mt-4 text-[0.9375rem] text-ink-muted">
              No profile is created. Your address is used for this one event and nothing else.
            </p>

            <div className="sheet mt-6 space-y-5 p-6">
              <div>
                <p className="label">I am looking for</p>
                <div className="flex flex-wrap gap-2">
                  {event.categories.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className="chip"
                      data-active={watch.lookingFor.includes(c.id)}
                      onClick={() =>
                        setWatch((v) => ({
                          ...v,
                          lookingFor: v.lookingFor.includes(c.id)
                            ? v.lookingFor.filter((x) => x !== c.id)
                            : [...v.lookingFor, c.id],
                        }))
                      }
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label" htmlFor="watch-email">
                  Your email address
                </label>
                <input
                  id="watch-email"
                  type="email"
                  className="field"
                  value={watch.email}
                  onChange={(e) => setWatch((v) => ({ ...v, email: e.target.value }))}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>

              <button
                type="button"
                className="btn btn-primary w-full"
                disabled={busy || !/.+@.+\..+/.test(watch.email)}
                onClick={async () => {
                  setBusy(true);
                  try {
                    await addWatcher(event.id, watch.email, watch.lookingFor);
                    clearWatch();
                    setView("notified");
                  } catch (e) {
                    setError(e instanceof Error ? e.message : "Could not save your address");
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                {busy ? "Saving" : "Notify me"}
              </button>
            </div>
          </section>
        ) : null}

        {view === "notified" ? (
          <section className="mt-10 max-w-[520px]">
            <Notice tone="positive" title="You are on the list">
              We will email you as soon as a matching participant joins {event.name}. You can create
              a profile at any time if you would rather look yourself.
            </Notice>
            <button type="button" className="btn btn-secondary mt-6" onClick={() => setView("join")}>
              Create a profile after all
            </button>
          </section>
        ) : null}
      </main>

      <footer className="border-t border-line/60 px-5 py-6">
        <p className="mx-auto w-full max-w-[760px] text-[0.8125rem] text-ink-faint">
          Pairspace is participant matching for events. It is not a dating service and not a social
          network. Profiles live inside this event only.
        </p>
      </footer>
    </div>
  );
}

/**
 * Accept or decline an incoming request: round dismiss button on the left, one
 * full width dark accept pill next to it.
 */
function RequestActions({ eventId, connectionId }: { eventId: string; connectionId: string }) {
  const [done, setDone] = useState<string | null>(null);
  if (done) {
    return (
      <p className="mt-4 flex items-center gap-2 text-[0.875rem] font-medium text-ink-secondary">
        <CheckIcon size={14} />
        {done}
      </p>
    );
  }
  return (
    <div className="mt-4 flex items-center gap-2.5">
      <button
        type="button"
        className="icon-btn shrink-0"
        aria-label="Decline"
        onClick={async () => {
          const { respondToConnection } = await import("@/lib/firebase/db");
          await respondToConnection(eventId, connectionId, "declined");
          setDone("Declined. Nothing was shared.");
        }}
      >
        <XIcon size={16} />
      </button>
      <button
        type="button"
        className="btn btn-dark flex-1"
        onClick={async () => {
          const { respondToConnection } = await import("@/lib/firebase/db");
          await respondToConnection(eventId, connectionId, "accepted");
          setDone("Accepted. We sent both of you an email with the contact details.");
        }}
      >
        <CheckIcon size={15} />
        Accept and share contact
      </button>
    </div>
  );
}

/**
 * The "who is here" teaser above the join card: a loose cluster of illustrated
 * portraits with two question mark bubbles, one of them yours to claim.
 */
function BubbleCluster() {
  const bubbles: { seed?: string; size: number; x: string; y: number; delay: string }[] = [
    { seed: "cluster-1", size: 72, x: "6%", y: 24, delay: "0ms" },
    { seed: "cluster-2", size: 96, x: "24%", y: 64, delay: "300ms" },
    { size: 64, x: "44%", y: 8, delay: "150ms" },
    { seed: "cluster-3", size: 84, x: "58%", y: 68, delay: "450ms" },
    { seed: "cluster-4", size: 64, x: "78%", y: 16, delay: "600ms" },
    { size: 52, x: "90%", y: 78, delay: "220ms" },
  ];
  return (
    <div className="relative h-44 select-none sm:h-48" aria-hidden="true">
      {bubbles.map((b, i) => (
        <span
          key={i}
          className="absolute animate-[float-soft_5s_ease-in-out_infinite]"
          style={{ left: b.x, top: b.y, animationDelay: b.delay }}
        >
          {!b.seed ? (
            <span
              className="flex items-center justify-center rounded-full bg-surface font-display font-bold text-accent shadow-(--shadow-md)"
              style={{ width: b.size, height: b.size, fontSize: b.size * 0.42 }}
            >
              ?
            </span>
          ) : (
            <span
              className="block overflow-hidden rounded-full shadow-(--shadow-md)"
              style={{ width: b.size, height: b.size, background: tintFor(b.seed!) }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={poolAvatar(b.seed!)} alt="" className="h-full w-full object-cover" />
            </span>
          )}
        </span>
      ))}
    </div>
  );
}

function BackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M9.8 3.2 5 8l4.8 4.8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
      <path d="M5 1.2v7.6M1.2 5h7.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="wash flex min-h-dvh items-center justify-center bg-canvas px-6">
      <div className="max-w-[440px] text-center">{children}</div>
    </div>
  );
}
