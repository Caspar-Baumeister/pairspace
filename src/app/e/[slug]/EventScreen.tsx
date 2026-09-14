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
import { PersonSheet } from "@/components/app/PersonSheet";
import {
  MascotCheer,
  MascotFloat,
  MascotLift,
  MascotOops,
  MascotSearch,
  MascotThink,
} from "@/components/mascot/Scenes";
import { Logo } from "@/components/site/Logo";
import { PersonAvatar } from "@/components/ui/PersonAvatar";
import { useAuth } from "@/lib/firebase/auth";
import {
  addWatcher,
  findMyParticipant,
  getEventBySlug,
  getMyContact,
  requestConnection,
  saveParticipant,
  setParticipantOpen,
  watchConnections,
  watchParticipants,
  watchSharedContacts,
} from "@/lib/firebase/db";
import { rankMatches } from "@/lib/matching";
import { usePersistentState } from "@/lib/hooks/usePersistentState";
import { deleteParticipantPhoto, uploadParticipantPhoto } from "@/lib/firebase/storage";
import type {
  Connection,
  PairspaceEvent,
  Participant,
  ParticipantContact,
  SharedContacts,
} from "@/lib/types";

type View = "choose" | "join" | "joined" | "matches" | "notify" | "notified" | "profile";

export function EventScreen({ slug }: { slug: string }) {
  const { ensureAnonymous, configured } = useAuth();

  const [event, setEvent] = useState<PairspaceEvent | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "missing" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [me, setMe] = useState<Participant | null>(null);
  const [myContact, setMyContact] = useState<ParticipantContact | null>(null);
  const [shared, setShared] = useState<SharedContacts | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  /** Whose profile sheet is open. */
  const [selectedId, setSelectedId] = useState<string | null>(null);
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
          setMyContact(await loadContact(found.id, mine));
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
    const unsubS = watchSharedContacts(event.id, me.id, setShared);
    return () => {
      unsubP();
      unsubC();
      unsubS();
    };
  }, [event, me]);

  // The join form is long, so after submitting the participant sits far down
  // the page. Snap to the top so the success screen opens with its headline.
  useEffect(() => {
    if (view === "joined") window.scrollTo({ top: 0, behavior: "instant" });
  }, [view]);

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

  /** Accepted connections in either direction, newest first. */
  const connected = useMemo(
    () =>
      connections
        .filter(
          (c) =>
            c.status === "accepted" &&
            (c.fromParticipantId === me?.id || c.toParticipantId === me?.id),
        )
        .map((c) => ({
          connection: c,
          otherId: c.fromParticipantId === me?.id ? c.toParticipantId : c.fromParticipantId,
        }))
        .sort((a, b) => (b.connection.respondedAt ?? 0) - (a.connection.respondedAt ?? 0)),
    [connections, me],
  );

  const selected = useMemo(
    () => matches.find((m) => m.participant.id === selectedId) ?? null,
    [matches, selectedId],
  );

  const handleJoin = useCallback(
    async (value: ParticipantSubmission) => {
      if (!event) return;
      const firstJoin = !me;
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
            contactMethods: value.contactMethods,
            open: me?.open ?? true,
            notifyOnMatch: value.notifyOnMatch,
          },
          { email: value.email, phone: value.phone },
          me?.id,
        );
        setMe(saved);
        setMyContact({
          uid: user.uid,
          email: value.email.trim().toLowerCase(),
          phone: value.phone.trim(),
          updatedAt: Date.now(),
        });
        setView(firstJoin ? "joined" : "matches");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not save your profile");
      } finally {
        setBusy(false);
      }
    },
    [event, me, ensureAnonymous],
  );

  if (status === "loading") {
    return (
      <Centered>
        <MascotFloat className="mx-auto w-[220px] max-w-full" label="Mo floats while the event loads" />
        <p className="mt-2 text-[0.9375rem] font-bold text-ink-muted" role="status">
          Opening the event
        </p>
      </Centered>
    );
  }

  if (status === "missing") {
    return (
      <Centered>
        <MascotSearch className="mx-auto w-[200px] max-w-full" label="Kai searching for the event" />
        <h1 className="display-m mt-2">This event link does not exist</h1>
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
        <MascotOops className="mx-auto mb-4 w-[180px] max-w-full" label="Mo looks worried" />
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
        {view === "joined" ? null : me && view !== "profile" ? (
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
          <section className="mt-6">
            <div className="relative mx-auto w-[min(300px,80vw)]">
              <div
                className="absolute inset-x-[10%] top-[8%] aspect-square rounded-full bg-accent-soft"
                aria-hidden="true"
              />
              <MascotLift className="relative w-full" label="Kai lifts Mo into the air" />
            </div>
            <div className="speech speech-top mx-auto mt-3 w-fit max-w-[32ch] text-center">
              Come in pairs. We help you find yours.
            </div>

            <div className="sheet mt-6 p-6 sm:p-8">
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
              <ParticipantForm
                event={event}
                existing={me}
                existingContact={myContact}
                onSubmit={handleJoin}
                busy={busy}
              />
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

        {view === "joined" && me ? (
          <section className="mx-auto mt-6 max-w-[520px] text-center">
            <Confetti />
            <MascotCheer className="mx-auto w-[280px] max-w-full" label="Kai and Mo cheer for you" />
            <h2 className="display-m mt-2 text-balance">You are all set, {me.firstName}!</h2>
            <p className="mx-auto mt-3 max-w-[42ch] text-[1.0625rem] leading-relaxed text-ink-muted">
              Your profile for {event.name} is live and other participants can find you now.
            </p>

            <div className="sheet mt-8 space-y-4 p-6 text-left">
              <JoinedFact title="No account, no password">
                You are done. There is nothing to sign up for and nothing to install.
              </JoinedFact>
              <JoinedFact title="Come back anytime">
                Just open this same event link again to see new people, answer requests, or change
                your profile.
              </JoinedFact>
              {myContact?.email ? (
                <JoinedFact title="We keep an eye out for you">
                  You get an email when someone wants to pair up with you
                  {me.notifyOnMatch ? ", and when a matching participant joins" : ""}.
                </JoinedFact>
              ) : (
                <JoinedFact title="Requests wait for you here">
                  You left no email address, so we cannot notify you. Open this link now and
                  then to see who wants to pair up.
                </JoinedFact>
              )}
            </div>

            <button
              type="button"
              className="btn btn-primary mt-6 w-full sm:w-auto"
              onClick={() => setView("matches")}
            >
              See who is looking
              <SparkIcon size={15} />
            </button>

            <div className="card mt-10 p-5 text-left">
              <p className="eyebrow">Organizing something yourself?</p>
              <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-muted">
                Get a link like this for your own event. Free, ready in minutes, QR code included.
              </p>
              <Link href="/create" className="btn btn-secondary btn-sm mt-4">
                Create your own event
              </Link>
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
                  <button
                    key={participant.id}
                    type="button"
                    className="flex w-16 shrink-0 cursor-pointer flex-col items-center gap-1.5"
                    aria-label={`Open the profile of ${participant.firstName}`}
                    onClick={() => setSelectedId(participant.id)}
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
                  </button>
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
                  onOpenProfile={(target) => setSelectedId(target.id)}
                  onConnect={async (target, message) => {
                    await requestConnection(event.id, me.id, target.id, message);
                  }}
                />
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                {incoming.length || connected.length ? (
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
                        <RequestActions
                          eventId={event.id}
                          connectionId={c.id}
                          otherName={from?.firstName ?? "Someone"}
                        />
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-xl border border-dashed border-line-strong bg-surface p-8 text-center">
                    <p className="text-[0.9375rem] text-ink-muted">
                      No requests yet. Send one yourself, most pairs start that way.
                    </p>
                  </div>
                )}

                {connected.length ? (
                  <div className="pt-4">
                    <p className="eyebrow">Connected</p>
                    <p className="mt-2 text-[0.875rem] text-ink-muted">
                      You both agreed, so here are the contact details. Nobody else can see them.
                    </p>
                    <ul className="mt-4 space-y-3">
                      {connected.map(({ connection, otherId }) => {
                        const other = participants.find((p) => p.id === otherId);
                        const details = shared?.contacts?.[otherId] ?? null;
                        return (
                          <li key={connection.id}>
                            <ContactCard
                              name={other?.firstName ?? details?.firstName ?? "Someone"}
                              seed={otherId}
                              photoUrl={other?.photoUrl}
                              email={details?.email ?? ""}
                              phone={details?.phone ?? ""}
                              ready={Boolean(details)}
                              onOpenProfile={other ? () => setSelectedId(other.id) : undefined}
                            />
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ) : null}
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
          <section className="mt-6 max-w-[520px]">
            <MascotThink className="w-[200px] max-w-full" label="Kai keeps an eye out for you" />
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

      {selected && me ? (
        <PersonSheet
          event={event}
          match={selected}
          pending={pendingIds.includes(selected.participant.id)}
          onClose={() => setSelectedId(null)}
          onConnect={async (target, message) => {
            await requestConnection(event.id, me.id, target.id, message);
          }}
        />
      ) : null}

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
 * Own contact details live in a private document. Profiles saved before that
 * existed still carry an email on the public record, so that is read as a
 * fallback until the person saves the profile again.
 */
async function loadContact(eventId: string, mine: Participant): Promise<ParticipantContact | null> {
  const stored = await getMyContact(eventId, mine.id).catch(() => null);
  if (stored) return stored;
  const legacyEmail = (mine as Participant & { email?: string }).email;
  if (!legacyEmail) return null;
  return { uid: mine.uid, email: legacyEmail, phone: "", updatedAt: mine.updatedAt };
}

/** One accepted connection: who it is and how to reach them. */
function ContactCard({
  name,
  seed,
  photoUrl,
  email,
  phone,
  ready,
  onOpenProfile,
}: {
  name: string;
  seed: string;
  photoUrl?: string | null;
  email: string;
  phone: string;
  ready: boolean;
  onOpenProfile?: () => void;
}) {
  const digits = phone.replace(/\D/g, "");
  return (
    <div className="card p-5">
      <div className="flex items-center gap-3.5">
        <button
          type="button"
          className="cursor-pointer disabled:cursor-default"
          onClick={onOpenProfile}
          disabled={!onOpenProfile}
          aria-label={`Open the profile of ${name}`}
        >
          <PersonAvatar name={name} seed={seed} photoUrl={photoUrl} size={48} />
        </button>
        <div className="min-w-0">
          <p className="text-[1rem] font-semibold tracking-[-0.01em] text-ink">{name}</p>
          <p className="flex items-center gap-1.5 text-[0.8125rem] text-positive">
            <CheckIcon size={12} />
            Paired up with you
          </p>
        </div>
      </div>
      {!ready ? (
        <p className="mt-3 text-[0.875rem] text-ink-muted">
          Contact details are on their way, this takes a few seconds.
        </p>
      ) : !email && !phone ? (
        <p className="mt-3 text-[0.875rem] leading-relaxed text-ink-muted">
          {name} chose not to leave contact details. Find each other at the event, or ask them
          to add a way to reach them to their profile.
        </p>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2">
          {phone ? (
            <a
              href={`https://wa.me/${digits}`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-dark btn-sm"
            >
              WhatsApp {phone}
            </a>
          ) : null}
          {phone ? (
            <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="btn btn-secondary btn-sm">
              Call
            </a>
          ) : null}
          {email ? (
            <a href={`mailto:${email}`} className="btn btn-secondary btn-sm">
              {email}
            </a>
          ) : null}
        </div>
      )}
    </div>
  );
}

function JoinedFact({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
        <CheckIcon size={12} />
      </span>
      <div>
        <p className="text-[0.9375rem] font-semibold tracking-[-0.01em] text-ink">{title}</p>
        <p className="mt-0.5 text-[0.875rem] leading-relaxed text-ink-muted">{children}</p>
      </div>
    </div>
  );
}

/** Brand palette only: teal, coral, sun and a touch of ink. */
const CONFETTI_COLORS = ["#12b4c6", "#0b8794", "#a9e9f0", "#ff6f59", "#ffc532", "#1E2A38"];

/**
 * A single celebratory burst when the profile is created. Pure CSS animation,
 * removes itself from the tree when the pieces are done, and reduced motion
 * collapses it instantly (see globals.css).
 */
function Confetti() {
  const [gone, setGone] = useState(false);
  const pieces = useMemo(
    () =>
      Array.from({ length: 56 }, (_, i) => ({
        left: `${(i * 137.5) % 100}%`,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        width: 5 + ((i * 7) % 6),
        height: 8 + ((i * 11) % 8),
        delay: `${(i % 14) * 90}ms`,
        duration: `${2200 + ((i * 53) % 1400)}ms`,
        sway: `${((i * 29) % 120) - 60}px`,
        spin: `${360 + ((i * 47) % 540)}deg`,
      })),
    [],
  );

  useEffect(() => {
    const id = window.setTimeout(() => setGone(true), 5200);
    return () => window.clearTimeout(id);
  }, []);

  if (gone) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden="true">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="confetti-piece"
          style={
            {
              left: p.left,
              width: p.width,
              height: p.height,
              background: p.color,
              "--confetti-delay": p.delay,
              "--confetti-duration": p.duration,
              "--confetti-sway": p.sway,
              "--confetti-spin": p.spin,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

/**
 * Accept or decline an incoming request: round dismiss button on the left, one
 * full width dark accept pill next to it.
 */
function RequestActions({
  eventId,
  connectionId,
  otherName,
}: {
  eventId: string;
  connectionId: string;
  otherName: string;
}) {
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
          setDone(`Accepted. ${otherName}'s contact details appear under Connected in a moment.`);
        }}
      >
        <CheckIcon size={15} />
        Accept and share contact
      </button>
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
