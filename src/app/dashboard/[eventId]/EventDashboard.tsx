"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { AppShell } from "@/components/app/AppShell";
import { PersonAvatar } from "@/components/ui/PersonAvatar";
import { Notice } from "@/components/app/Notice";
import { ShareLink } from "@/components/app/ShareLink";
import { useAuth } from "@/lib/firebase/auth";
import {
  getEventById,
  listWatchers,
  updateEvent,
  watchConnections,
  watchParticipants,
} from "@/lib/firebase/db";
import type { Connection, PairspaceEvent, Participant, Watcher } from "@/lib/types";

export function EventDashboard({ eventId }: { eventId: string }) {
  const router = useRouter();
  const { user, isAnonymous, loading } = useAuth();

  const [event, setEvent] = useState<PairspaceEvent | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [watchers, setWatchers] = useState<Watcher[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"overview" | "participants" | "waiting">("overview");

  useEffect(() => {
    if (!loading && (!user || isAnonymous)) router.replace("/signin");
  }, [loading, user, isAnonymous, router]);

  useEffect(() => {
    if (!user || isAnonymous) return;
    let live = true;
    getEventById(eventId)
      .then((e) => {
        if (!live) return;
        if (!e) setError("This event does not exist any more.");
        else if (e.ownerUid !== user.uid) setError("This event belongs to another account.");
        else setEvent(e);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load the event"));
    return () => {
      live = false;
    };
  }, [eventId, user, isAnonymous]);

  useEffect(() => {
    if (!event) return;
    const unsubP = watchParticipants(event.id, setParticipants);
    const unsubC = watchConnections(event.id, setConnections);
    listWatchers(event.id).then(setWatchers).catch(() => setWatchers([]));
    return () => {
      unsubP();
      unsubC();
    };
  }, [event]);

  const stats = useMemo(() => {
    const open = participants.filter((p) => p.open).length;
    const accepted = connections.filter((c) => c.status === "accepted").length;
    return [
      { label: "Participants", value: participants.length },
      { label: "Still open", value: open },
      { label: "Connections made", value: accepted },
      { label: "Waiting for a match", value: watchers.length },
    ];
  }, [participants, connections, watchers]);

  const balance = useMemo(() => {
    if (!event) return [];
    const total = participants.length || 1;
    return event.categories.map((c) => ({
      label: c.label,
      count: participants.filter((p) => p.categoryIds.includes(c.id)).length,
      share: Math.round(
        (participants.filter((p) => p.categoryIds.includes(c.id)).length / total) * 100,
      ),
    }));
  }, [event, participants]);

  if (error) {
    return (
      <AppShell>
        <Notice tone="danger" title="Cannot open this event">{error}</Notice>
        <Link href="/dashboard" className="btn btn-secondary mt-6">
          Back to my events
        </Link>
      </AppShell>
    );
  }

  if (!event) {
    return (
      <AppShell>
        <p className="text-[0.9375rem] text-ink-faint">Loading the event</p>
      </AppShell>
    );
  }

  const unmatched = participants.filter((p) => p.open);

  return (
    <AppShell
      wide
      right={
        <Link href="/dashboard" className="btn btn-ghost btn-sm">
          All events
        </Link>
      }
    >
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="eyebrow">Organizer view</p>
          <h1 className="display-m mt-3">{event.name}</h1>
          <p className="mt-2 text-[0.9375rem] text-ink-muted">
            {event.location || "No location set"}
            {event.startDate ? ` · from ${event.startDate}` : ""}
            {event.endDate ? ` to ${event.endDate}` : ""}
          </p>
        </div>
        <div className="w-full max-w-[380px]">
          <ShareLink slug={event.slug} compact />
        </div>
      </header>

      <div className="mt-10 flex gap-2 border-b border-line">
        {(
          [
            ["overview", "Overview"],
            ["participants", `Participants (${participants.length})`],
            ["waiting", `Waiting for a match (${watchers.length})`],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className="relative px-1 pb-3 text-[0.9375rem] font-medium transition-colors"
            style={{ color: tab === key ? "var(--color-ink)" : "var(--color-ink-faint)" }}
          >
            {label}
            {tab === key ? (
              <span className="absolute inset-x-0 -bottom-px h-[2px] rounded-full bg-ink" />
            ) : null}
          </button>
        ))}
      </div>

      {tab === "overview" ? (
        <section className="mt-8 space-y-8">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="rounded-xl border border-line bg-surface px-5 py-4">
                <p
                  className="tnum text-[2rem] font-semibold leading-none tracking-[-0.035em] text-ink"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {s.value}
                </p>
                <p className="mt-2 text-[0.875rem] text-ink-muted">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-line bg-surface p-5">
            <h2 className="text-[0.9375rem] font-medium text-ink">Balance of categories</h2>
            {participants.length === 0 ? (
              <p className="mt-3 text-[0.875rem] text-ink-faint">
                Nobody has joined yet. Share your link to get the first profiles.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {balance.map((b) => (
                  <li key={b.label} className="flex items-center gap-4">
                    <span className="w-28 shrink-0 text-[0.875rem] text-ink-secondary">
                      {b.label}
                    </span>
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-sunken">
                      <span
                        className="block h-full rounded-full bg-accent transition-all duration-500"
                        style={{ width: `${b.share}%` }}
                      />
                    </span>
                    <span className="tnum w-20 shrink-0 text-right text-[0.875rem] text-ink-faint">
                      {b.count} · {b.share}%
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-xl border border-line bg-surface p-5">
            <h2 className="text-[0.9375rem] font-medium text-ink">Event settings</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {(["live", "closed"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  className="chip"
                  data-active={event.status === s}
                  onClick={() => {
                    setEvent({ ...event, status: s });
                    void updateEvent(event.id, { status: s });
                  }}
                >
                  {s === "live" ? "Open for new participants" : "Closed"}
                </button>
              ))}
            </div>
            <p className="mt-4 text-[0.8125rem] text-ink-faint">
              Participant data for this event is deleted {event.retentionDays} days after it ends.
            </p>
          </div>
        </section>
      ) : null}

      {tab === "participants" ? (
        <section className="mt-8">
          {participants.length === 0 ? (
            <p className="text-[0.9375rem] text-ink-faint">No participants yet.</p>
          ) : (
            <ul className="divide-y divide-line border-y border-line">
              {participants.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center gap-x-6 gap-y-2 py-4">
                  <PersonAvatar name={p.firstName} seed={p.id} photoUrl={p.photoUrl} size={40} />
                  <div className="min-w-[12rem] flex-1">
                    <p className="text-[0.9375rem] font-medium text-ink">{p.firstName}</p>
                    <p className="mt-0.5 text-[0.875rem] text-ink-muted">
                      {p.categoryIds
                        .map((id) => event.categories.find((c) => c.id === id)?.label ?? id)
                        .join(", ")}
                      {p.lookingForIds.length
                        ? ` · looking for ${p.lookingForIds
                            .map((id) => event.categories.find((c) => c.id === id)?.label ?? id)
                            .join(", ")}`
                        : ""}
                    </p>
                  </div>
                  <span
                    className={`badge ${p.open ? "bg-accent-soft text-accent" : "bg-positive-soft text-positive"}`}
                  >
                    {p.open ? "Still open" : "Found a partner"}
                  </span>
                  <span className="text-[0.8125rem] text-ink-faint">
                    {new Date(p.createdAt).toLocaleDateString("en-GB")}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {unmatched.length ? (
            <p className="mt-6 text-[0.875rem] text-ink-muted">
              {unmatched.length} participant{unmatched.length === 1 ? " is" : "s are"} still looking
              for someone. A short reminder in your group chat usually moves that number.
            </p>
          ) : null}
        </section>
      ) : null}

      {tab === "waiting" ? (
        <section className="mt-8">
          <p className="max-w-[60ch] text-[0.9375rem] text-ink-muted">
            These people asked to be notified when a matching participant joins. Their addresses are
            hidden from everyone, including you, and only used for that one email.
          </p>
          {watchers.length === 0 ? (
            <p className="mt-6 text-[0.9375rem] text-ink-faint">Nobody is waiting right now.</p>
          ) : (
            <ul className="mt-6 divide-y divide-line border-y border-line">
              {watchers.map((w) => (
                <li key={w.id} className="flex items-center gap-4 py-4">
                  <span className="text-[0.9375rem] text-ink">
                    Looking for{" "}
                    {w.lookingForIds
                      .map((id) => event.categories.find((c) => c.id === id)?.label ?? id)
                      .join(", ") || "anyone"}
                  </span>
                  <span className="ml-auto text-[0.8125rem] text-ink-faint">
                    {w.notifiedAt ? "Notified" : "Waiting"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </AppShell>
  );
}
