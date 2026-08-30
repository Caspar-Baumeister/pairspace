"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { MatchList } from "@/components/app/MatchList";
import { Notice } from "@/components/app/Notice";
import { ParticipantForm, type ParticipantFormValue } from "@/components/app/ParticipantForm";
import { Logo } from "@/components/site/Logo";
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
  const [busy, setBusy] = useState(false);

  const [watchEmail, setWatchEmail] = useState("");
  const [watchFor, setWatchFor] = useState<string[]>([]);

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
    async (value: ParticipantFormValue) => {
      if (!event) return;
      setBusy(true);
      setError(null);
      try {
        const user = await ensureAnonymous();
        const saved = await saveParticipant(
          event.id,
          user.uid,
          {
            firstName: value.firstName.trim(),
            categoryIds: value.categoryIds,
            lookingForIds: value.lookingForIds,
            answers: value.answers,
            note: value.note.trim(),
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
    <div className="min-h-dvh bg-canvas">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex h-14 w-full max-w-[720px] items-center justify-between px-5">
          <Logo />
          {me ? (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setView(view === "profile" ? "matches" : "profile")}
            >
              {view === "profile" ? "Back to people" : "My profile"}
            </button>
          ) : null}
        </div>
      </header>

      <main id="main" className="mx-auto w-full max-w-[720px] px-5 pb-24 pt-10">
        <section>
          <p className="eyebrow">{event.location || "Participant matching"}</p>
          <h1 className="display-m mt-3">{event.name}</h1>
          {event.description ? (
            <p className="mt-4 max-w-[54ch] text-[1.0625rem] leading-relaxed text-ink-muted">
              {event.description}
            </p>
          ) : null}
          <p className="mt-4 text-[0.875rem] text-ink-faint">
            {event.categories.map((c) => c.label).join(" · ")}
          </p>
        </section>

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
          <section className="mt-10 space-y-4">
            <div className="rounded-2xl border border-line bg-surface p-6">
              <h2 className="heading">Introduce yourself</h2>
              <p className="mt-2 max-w-[48ch] text-[0.9375rem] text-ink-muted">
                Create a profile for this event only. See who else is looking and send one request to
                the people who fit.
              </p>
              <button
                type="button"
                className="btn btn-primary mt-5"
                onClick={() => setView("join")}
                disabled={event.status === "closed"}
              >
                Create my event profile
              </button>
            </div>

            <div className="rounded-2xl border border-line bg-surface p-6">
              <h2 className="heading">Notify me instead</h2>
              <p className="mt-2 max-w-[48ch] text-[0.9375rem] text-ink-muted">
                No profile, no browsing. Leave an email address and hear from us once someone
                matching your search joins.
              </p>
              <button type="button" className="btn btn-secondary mt-5" onClick={() => setView("notify")}>
                Just notify me
              </button>
            </div>

            <p className="pt-2 text-[0.8125rem] text-ink-faint">
              Your profile exists inside this event only. It is deleted {event.retentionDays} days
              after the event ends and is never shown in search engines.
            </p>
          </section>
        ) : null}

        {view === "join" ? (
          <section className="mt-10">
            <h2 className="heading">Your event profile</h2>
            <p className="mt-2 text-[0.9375rem] text-ink-muted">
              Takes about a minute. No password, no app.
            </p>
            <div className="mt-7">
              <ParticipantForm event={event} onSubmit={handleJoin} busy={busy} />
            </div>
            <button type="button" className="btn btn-ghost mt-4" onClick={() => setView("choose")}>
              Back
            </button>
          </section>
        ) : null}

        {view === "profile" && me ? (
          <section className="mt-10">
            <h2 className="heading">Edit your profile</h2>
            <div className="mt-7">
              <ParticipantForm event={event} existing={me} onSubmit={handleJoin} busy={busy} />
            </div>
            <div className="mt-8 rounded-xl border border-line bg-surface p-5">
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
          <section className="mt-10">
            {incoming.length ? (
              <div className="mb-8 space-y-3">
                <h2 className="heading">Requests for you</h2>
                {incoming.map((c) => {
                  const from = participants.find((p) => p.id === c.fromParticipantId);
                  return (
                    <div key={c.id} className="rounded-xl border border-blue-line bg-blue-soft p-4">
                      <p className="text-[0.9375rem] font-medium text-ink">
                        {from?.firstName ?? "Someone"} wants to pair up
                      </p>
                      <p className="mt-1 text-[0.875rem] text-ink-secondary">{c.message}</p>
                      <div className="mt-3 flex gap-2">
                        <ConnectionButtons eventId={event.id} connectionId={c.id} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}

            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="heading">People looking for a partner</h2>
              <span className="text-[0.875rem] text-ink-faint">
                {matches.length} participant{matches.length === 1 ? "" : "s"}
              </span>
            </div>
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
          </section>
        ) : null}

        {view === "notify" ? (
          <section className="mt-10 max-w-[520px]">
            <h2 className="heading">Get notified when someone matching joins</h2>
            <p className="mt-2 text-[0.9375rem] text-ink-muted">
              No profile is created. Your address is used for this one event and nothing else.
            </p>

            <div className="mt-7 space-y-5">
              <div>
                <p className="label">I am looking for</p>
                <div className="flex flex-wrap gap-2">
                  {event.categories.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className="chip"
                      data-active={watchFor.includes(c.id)}
                      onClick={() =>
                        setWatchFor((v) =>
                          v.includes(c.id) ? v.filter((x) => x !== c.id) : [...v, c.id],
                        )
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
                  value={watchEmail}
                  onChange={(e) => setWatchEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>

              <button
                type="button"
                className="btn btn-primary w-full"
                disabled={busy || !/.+@.+\..+/.test(watchEmail)}
                onClick={async () => {
                  setBusy(true);
                  try {
                    await addWatcher(event.id, watchEmail, watchFor);
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
              <button type="button" className="btn btn-ghost w-full" onClick={() => setView("choose")}>
                Back
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

      <footer className="border-t border-line px-5 py-6">
        <p className="mx-auto w-full max-w-[720px] text-[0.8125rem] text-ink-faint">
          Pairspace is participant matching for events. It is not a dating service and not a social
          network. Profiles live inside this event only.
        </p>
      </footer>
    </div>
  );
}

function ConnectionButtons({ eventId, connectionId }: { eventId: string; connectionId: string }) {
  const [done, setDone] = useState<string | null>(null);
  if (done) return <p className="text-[0.875rem] text-ink-secondary">{done}</p>;
  return (
    <>
      <button
        type="button"
        className="btn btn-primary btn-sm"
        onClick={async () => {
          const { respondToConnection } = await import("@/lib/firebase/db");
          await respondToConnection(eventId, connectionId, "accepted");
          setDone("Accepted. We sent both of you an email with the contact details.");
        }}
      >
        Accept and share contact
      </button>
      <button
        type="button"
        className="btn btn-secondary btn-sm"
        onClick={async () => {
          const { respondToConnection } = await import("@/lib/firebase/db");
          await respondToConnection(eventId, connectionId, "declined");
          setDone("Declined. Nothing was shared.");
        }}
      >
        Not now
      </button>
    </>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas px-6">
      <div className="max-w-[440px] text-center">{children}</div>
    </div>
  );
}
