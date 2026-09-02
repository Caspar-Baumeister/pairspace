"use client";

import { useState } from "react";

import { poolAvatar, tintFor } from "@/lib/avatar";
import { matchStrength } from "@/lib/matching";
import type { MatchResult, PairspaceEvent, Participant } from "@/lib/types";

/**
 * The people feed: one tall portrait card per person, name and category chips
 * sitting on a scrim at the bottom of the portrait, reasons underneath, and a
 * round send button that folds a message composer out of the card.
 */
export function MatchList({
  event,
  matches,
  me,
  onConnect,
  pendingIds,
}: {
  event: PairspaceEvent;
  matches: MatchResult[];
  me: Participant;
  onConnect: (target: Participant, message: string) => Promise<void>;
  pendingIds: string[];
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  if (!matches.length) {
    return (
      <div className="rounded-xl border border-dashed border-line-strong bg-surface p-8 text-center">
        <div className="mx-auto flex w-fit -space-x-3">
          {["seat-a", "seat-b", "seat-c"].map((seed) => (
            <span
              key={seed}
              className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-surface text-[1rem] font-semibold text-ink-faint"
              style={{ background: tintFor(seed) }}
            >
              ?
            </span>
          ))}
        </div>
        <h3 className="heading mt-4">You are the first one here</h3>
        <p className="mx-auto mt-2 max-w-[40ch] text-[0.9375rem] text-ink-muted">
          Nobody else has joined yet. You will get an email as soon as someone matching your search
          creates a profile.
        </p>
      </div>
    );
  }

  return (
    <div>
      <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {matches.map(({ participant, score, reasons }) => {
          const strength = matchStrength(score);
          const pending = pendingIds.includes(participant.id);
          const isOpen = openId === participant.id;
          const categories = participant.categoryIds.map(
            (id) => event.categories.find((c) => c.id === id)?.label ?? id,
          );
          return (
            <li
              key={participant.id}
              id={`person-${participant.id}`}
              className="scroll-mt-24 overflow-hidden rounded-xl border border-line bg-surface shadow-(--shadow-sm)"
            >
              {/* Portrait */}
              <div
                className="relative aspect-[4/5] sm:aspect-[5/6]"
                style={{
                  background: participant.photoUrl ? "var(--color-sunken)" : tintFor(participant.id),
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={participant.photoUrl ?? poolAvatar(participant.id)}
                  alt={participant.firstName}
                  className="absolute inset-0 h-full w-full object-cover object-top"
                  loading="lazy"
                />

                <div className="scrim-b absolute inset-x-0 bottom-0 h-2/3" aria-hidden="true" />

                <span
                  className="glass-chip absolute left-4 top-4"
                  style={{
                    color:
                      strength.tone === "high"
                        ? "var(--color-accent)"
                        : strength.tone === "mid"
                          ? "var(--color-ink)"
                          : "var(--color-ink-muted)",
                  }}
                >
                  <SparkIcon size={13} />
                  {strength.label}
                </span>

                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-[0.8125rem] font-medium text-white/85">
                      <span
                        className={`inline-block h-2 w-2 rounded-full ${
                          participant.open ? "bg-[#4ade80]" : "bg-white/50"
                        }`}
                        aria-hidden="true"
                      />
                      {participant.open ? "Open to pair up" : "Found a partner"}
                    </p>
                    <p className="mt-0.5 truncate font-display text-[1.5rem] font-bold tracking-[-0.02em] text-white">
                      {participant.firstName}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {categories.map((label) => (
                        <span
                          key={label}
                          className="glass-chip glass-chip-dark px-2.5! py-1! text-[0.75rem]!"
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    aria-label={
                      pending
                        ? "Request sent"
                        : participant.open
                          ? `Connect with ${participant.firstName}`
                          : `${participant.firstName} is not available`
                    }
                    aria-expanded={isOpen}
                    disabled={pending || !participant.open}
                    className="icon-btn h-12 w-12 shrink-0 border-0! text-white disabled:cursor-not-allowed"
                    style={
                      pending
                        ? {
                            background: "rgba(255,255,255,0.28)",
                            backdropFilter: "blur(6px)",
                            boxShadow: "none",
                          }
                        : { background: "var(--gradient-accent)", boxShadow: "var(--shadow-accent)" }
                    }
                    onClick={() => {
                      if (isOpen) {
                        setOpenId(null);
                        return;
                      }
                      setOpenId(participant.id);
                      setMessage(`Hi ${participant.firstName}, want to pair up at ${event.name}?`);
                    }}
                  >
                    {pending ? <CheckIcon size={18} /> : <SendIcon size={18} />}
                  </button>
                </div>
              </div>

              {/* Details */}
              <div className="p-5">
                {reasons.length ? (
                  <p className="text-[0.875rem] leading-relaxed text-ink-muted">
                    {reasons.join(" · ")}
                  </p>
                ) : null}
                {participant.note ? (
                  <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-ink-secondary">
                    {participant.note}
                  </p>
                ) : null}
                {pending ? (
                  <p className="mt-1.5 text-[0.8125rem] font-medium text-accent">
                    Request sent. You get an email when {participant.firstName} answers.
                  </p>
                ) : null}

                {isOpen && !pending ? (
                  <div className="mt-4 rounded-lg border border-line bg-sunken p-4">
                    <label className="label" htmlFor={`msg-${participant.id}`}>
                      Your message to {participant.firstName}
                    </label>
                    <textarea
                      id={`msg-${participant.id}`}
                      className="field"
                      rows={2}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      maxLength={300}
                    />
                    <p className="mt-2 text-[0.8125rem] text-ink-faint">
                      {participant.firstName} sees your first name and this message. Your email
                      address is shared only if the request is accepted.
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        disabled={busy}
                        onClick={async () => {
                          setBusy(true);
                          try {
                            await onConnect(participant, message);
                            setOpenId(null);
                          } finally {
                            setBusy(false);
                          }
                        }}
                      >
                        {busy ? "Sending" : "Send request"}
                        <SendIcon size={14} />
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => setOpenId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-5 text-center text-[0.8125rem] text-ink-faint">
        You appear in this list as {me.firstName}. You can hide yourself at any time.
      </p>
    </div>
  );
}

/* Small inline icons, all currentColor so they follow the text. ------------- */

export function SendIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M4.5 11.5 11.5 4.5M6 4.5h5.5V10"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CheckIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M3 8.4 6.4 11.8 13 5.2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SparkIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 1.8 9.6 6.4 14.2 8 9.6 9.6 8 14.2 6.4 9.6 1.8 8 6.4 6.4 8 1.8Z" fill="currentColor" />
    </svg>
  );
}

export function XIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M4.2 4.2 11.8 11.8M11.8 4.2 4.2 11.8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function PinIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M8 14.2s-4.6-4.2-4.6-7.7a4.6 4.6 0 1 1 9.2 0c0 3.5-4.6 7.7-4.6 7.7Z"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <circle cx="8" cy="6.4" r="1.7" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}
