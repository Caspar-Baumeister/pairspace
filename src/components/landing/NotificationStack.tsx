"use client";

import { useEffect, useState } from "react";

import { PersonAvatar } from "@/components/ui/PersonAvatar";
import { castAvatar } from "@/lib/avatar";

interface Note {
  title: string;
  detail: string;
  tone: "accent" | "positive" | "neutral";
  /** Cast portrait seed, or a short label when the card is about a group. */
  seed?: string;
  name: string;
  label?: string;
}

const NOTES: Note[] = [
  {
    name: "Lena Weber",
    seed: "lena-weber",
    title: "Lena joined as a Flyer",
    detail: "Intermediate, available Saturday and Sunday",
    tone: "accent",
  },
  {
    name: "Ana Ribeiro",
    seed: "ana-ribeiro",
    title: "Looking for an intermediate Base",
    detail: "Posted 4 minutes ago in Acro Weekend Berlin",
    tone: "neutral",
  },
  {
    name: "Leo Fischer",
    seed: "leo-fischer",
    title: "Leo matches your search",
    detail: "Base, intermediate, same days as you",
    tone: "positive",
  },
  {
    name: "Sara Lindqvist",
    seed: "sara-lindqvist",
    title: "A matching participant has joined",
    detail: "We sent you an email because you asked to be notified",
    tone: "accent",
  },
  {
    name: "Three participants",
    label: "3",
    title: "3 participants want updates",
    detail: "They get an email the moment a suitable partner joins",
    tone: "neutral",
  },
];

const TONES = {
  accent: { bg: "#E7F4EE", fg: "#0D8A5E" },
  positive: { bg: "#E9F6EE", fg: "#15803D" },
  neutral: { bg: "#F4F4F5", fg: "#3C3C42" },
};

/**
 * The stacked cards under the hero call to action. The top card rotates through
 * the list, the two behind it stay as a quiet suggestion of depth.
 */
export function NotificationStack() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % NOTES.length), 3200);
    return () => window.clearInterval(id);
  }, []);

  const order = [0, 1, 2].map((offset) => NOTES[(index + offset) % NOTES.length]);

  return (
    <div className="relative mx-auto mt-14 w-full max-w-[440px]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[300px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: "var(--glow, rgba(13,138,94,0.14))", filter: "blur(64px)" }}
      />

      <div className="relative h-[168px]" aria-live="polite">
        {order.map((note, i) => {
          const tone = TONES[note.tone];
          return (
            <div
              key={`${note.title}-${i}`}
              className="absolute left-1/2 top-0 w-full rounded-2xl border border-line bg-surface px-4 py-3.5 transition-all duration-500"
              style={{
                transform: `translateX(-50%) translateY(${i * 22}px) scale(${1 - i * 0.05})`,
                zIndex: 10 - i,
                boxShadow: i === 0 ? "var(--shadow-md)" : "var(--shadow-xs)",
                transitionTimingFunction: "var(--ease-out-quint)",
              }}
            >
              <div
                className="flex items-start gap-3"
                style={{ opacity: i === 0 ? 1 : i === 1 ? 0.55 : 0.3 }}
              >
                {note.seed ? (
                  <span className="mt-0.5">
                    <PersonAvatar name={note.name} src={castAvatar(note.seed)} size={36} />
                  </span>
                ) : (
                  <div
                    className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[0.8125rem] font-semibold"
                    style={{
                      background: tone.bg,
                      color: tone.fg,
                      fontFamily: "var(--font-display)",
                    }}
                  >
                    {note.label}
                  </div>
                )}
                <div className="min-w-0 text-left">
                  <p className="truncate text-[0.9375rem] font-medium tracking-[-0.01em] text-ink">
                    {note.title}
                  </p>
                  <p className="mt-0.5 truncate text-[0.8125rem] text-ink-muted">{note.detail}</p>
                </div>
                {i === 0 ? (
                  <span
                    className="ml-auto mt-1 h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ background: tone.fg }}
                    aria-hidden="true"
                  />
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
