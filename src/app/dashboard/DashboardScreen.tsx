"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { AppShell } from "@/components/app/AppShell";
import { MascotFloat, MascotWave } from "@/components/mascot/Scenes";
import { Notice } from "@/components/app/Notice";
import { ShareLink } from "@/components/app/ShareLink";
import { useAuth } from "@/lib/firebase/auth";
import { listEventsForOwner } from "@/lib/firebase/db";
import { takeRememberedEvent } from "@/lib/draft";
import type { PairspaceEvent } from "@/lib/types";

function formatRange(event: PairspaceEvent): string {
  if (!event.startDate) return "No dates set";
  const start = new Date(event.startDate).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  if (!event.endDate || event.endDate === event.startDate) return start;
  const end = new Date(event.endDate).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return `${start} to ${end}`;
}

export function DashboardScreen() {
  const router = useRouter();
  const { user, isAnonymous, loading, signOut, configured } = useAuth();
  const [events, setEvents] = useState<PairspaceEvent[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [justCreated, setJustCreated] = useState<string | null>(null);

  useEffect(() => {
    setJustCreated(takeRememberedEvent());
  }, []);

  useEffect(() => {
    if (!loading && (!user || isAnonymous)) router.replace("/signin");
  }, [loading, user, isAnonymous, router]);

  const load = useCallback(async () => {
    if (!user || isAnonymous) return;
    try {
      setEvents(await listEventsForOwner(user.uid));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load your events");
    }
  }, [user, isAnonymous]);

  useEffect(() => {
    void load();
  }, [load]);

  const now = Date.now();
  const upcoming = (events ?? []).filter(
    (e) => !e.endDate || new Date(e.endDate).getTime() + 86400000 >= now,
  );
  const past = (events ?? []).filter(
    (e) => e.endDate && new Date(e.endDate).getTime() + 86400000 < now,
  );

  return (
    <AppShell
      wide
      right={
        <>
          <Link href="/create" className="btn btn-primary btn-sm">
            New event
          </Link>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => void signOut()}>
            Sign out
          </button>
        </>
      }
    >
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Organizer</p>
          <h1 className="display-m mt-3">My events</h1>
        </div>
        <p className="text-[0.875rem] text-ink-faint">{user?.email ?? ""}</p>
      </header>

      {justCreated ? (
        <div className="mt-8">
          <Notice tone="positive" title="Your event is live">
            <p className="mb-3">Share this link with your participants.</p>
            <ShareLink slug={justCreated} compact />
          </Notice>
        </div>
      ) : null}

      {!configured ? (
        <div className="mt-8">
          <Notice tone="warning" title="Firebase keys missing">
            Add your Firebase web app keys to .env.local to load real events.
          </Notice>
        </div>
      ) : null}

      {error ? (
        <div className="mt-8">
          <Notice tone="danger" title="Could not load">{error}</Notice>
        </div>
      ) : null}

      <section className="mt-10">
        {events === null ? (
          <div className="pop mx-auto w-[220px] text-center" role="status">
            <MascotFloat className="w-full" label="Loading your events" />
          </div>
        ) : events.length === 0 ? (
          <div className="card p-8 text-center sm:p-10">
            <div className="pop mx-auto w-[150px]">
              <MascotWave className="w-full" label="Kai waves" />
            </div>
            <h2 className="heading mt-4">No events yet</h2>
            <p className="mx-auto mt-3 max-w-[42ch] text-[0.9375rem] text-ink-muted">
              Create your first event, define the categories your participants pick from, and share
              one link.
            </p>
            <Link href="/create" className="btn btn-primary mt-6">
              Create your event
            </Link>
          </div>
        ) : (
          <>
            <EventList title="Upcoming and open" events={upcoming} />
            {past.length ? <EventList title="History" events={past} muted /> : null}
          </>
        )}
      </section>
    </AppShell>
  );
}

function EventList({
  title,
  events,
  muted = false,
}: {
  title: string;
  events: PairspaceEvent[];
  muted?: boolean;
}) {
  if (!events.length) return null;
  return (
    <div className={muted ? "mt-14" : ""}>
      <h2 className="text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-ink-faint">
        {title}
      </h2>
      <ul className="mt-4 divide-y divide-line border-y border-line">
        {events.map((event) => (
          <li key={event.id}>
            <Link
              href={`/dashboard/${event.id}`}
              className="flex flex-wrap items-center gap-x-8 gap-y-2 py-5 transition-colors hover:bg-sunken"
            >
              <div className="min-w-[15rem] flex-1">
                <p className="text-[1.0625rem] font-semibold tracking-[-0.02em] text-ink">
                  {event.name}
                </p>
                <p className="mt-1 text-[0.875rem] text-ink-muted">
                  {formatRange(event)}
                  {event.location ? ` · ${event.location}` : ""}
                </p>
              </div>
              <Stat label="Participants" value={event.counts?.participants ?? 0} />
              <Stat label="Still open" value={event.counts?.openForPartner ?? 0} />
              <Stat label="Connections" value={event.counts?.connections ?? 0} />
              <span className="badge bg-accent-soft text-accent">Open</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="w-[6.5rem]">
      <p
        className="tnum text-[1.25rem] font-semibold leading-none tracking-[-0.03em] text-ink"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {value}
      </p>
      <p className="mt-1 text-[0.8125rem] text-ink-faint">{label}</p>
    </div>
  );
}
