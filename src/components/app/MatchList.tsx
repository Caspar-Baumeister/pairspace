"use client";

import { useState } from "react";

import { matchStrength } from "@/lib/matching";
import type { MatchResult, PairspaceEvent, Participant } from "@/lib/types";

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
      <div className="rounded-2xl border border-dashed border-line-strong bg-surface p-8 text-center">
        <h3 className="heading">You are the first one here</h3>
        <p className="mx-auto mt-3 max-w-[40ch] text-[0.9375rem] text-ink-muted">
          Nobody else has joined yet. You will get an email as soon as someone matching your search
          creates a profile.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-line border-y border-line">
      {matches.map(({ participant, score, reasons }) => {
        const strength = matchStrength(score);
        const pending = pendingIds.includes(participant.id);
        const isOpen = openId === participant.id;
        return (
          <li key={participant.id} className="py-5">
            <div className="flex flex-wrap items-start gap-x-4 gap-y-3">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sunken text-[0.9375rem] font-semibold text-ink-secondary"
                style={{ fontFamily: "var(--font-display)" }}
                aria-hidden="true"
              >
                {participant.firstName.slice(0, 1).toUpperCase()}
              </div>

              <div className="min-w-[12rem] flex-1">
                <p className="text-[1.0625rem] font-semibold tracking-[-0.02em] text-ink">
                  {participant.firstName}
                  <span className="ml-2 text-[0.875rem] font-normal text-ink-faint">
                    {participant.categoryIds
                      .map((id) => event.categories.find((c) => c.id === id)?.label ?? id)
                      .join(" and ")}
                  </span>
                </p>
                <ul className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
                  {reasons.map((r) => (
                    <li key={r} className="text-[0.875rem] text-ink-muted">
                      {r}
                    </li>
                  ))}
                </ul>
                {participant.note ? (
                  <p className="mt-2 max-w-[52ch] text-[0.875rem] text-ink-secondary">
                    {participant.note}
                  </p>
                ) : null}
              </div>

              <span
                className={`badge shrink-0 ${
                  strength.tone === "high"
                    ? "bg-positive-soft text-positive"
                    : strength.tone === "mid"
                      ? "bg-blue-soft text-blue"
                      : "bg-sunken text-ink-muted"
                }`}
              >
                {strength.label}
              </span>

              <button
                type="button"
                className="btn btn-secondary btn-sm shrink-0"
                disabled={pending || !participant.open}
                onClick={() => {
                  setOpenId(isOpen ? null : participant.id);
                  setMessage(`Hi ${participant.firstName}, want to pair up at ${event.name}?`);
                }}
              >
                {pending ? "Request sent" : participant.open ? "Connect" : "Not available"}
              </button>
            </div>

            {isOpen && !pending ? (
              <div className="mt-4 rounded-xl border border-line bg-sunken p-4">
                <label className="label" htmlFor={`msg-${participant.id}`}>
                  Message
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
                  {participant.firstName} sees your first name and this message. Your email address
                  is shared only if the request is accepted.
                </p>
                <div className="mt-3 flex gap-2">
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
          </li>
        );
      })}
      <li className="py-4 text-[0.8125rem] text-ink-faint">
        You are visible in this list as {me.firstName}. You can hide yourself at any time.
      </li>
    </ul>
  );
}
