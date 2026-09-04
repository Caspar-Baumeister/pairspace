"use client";

import { useEffect, useState } from "react";

import { CheckIcon, ConnectComposer, SendIcon, SparkIcon, XIcon } from "@/components/app/MatchList";
import { poolAvatar, tintFor } from "@/lib/avatar";
import { matchStrength } from "@/lib/matching";
import type { MatchResult, PairspaceEvent, Participant } from "@/lib/types";

/**
 * The full profile of one person, opened from the avatar row or from a card.
 * A sheet over the page: portrait on top, everything the person shared below,
 * and the connect composer at the bottom, so nobody has to go back to the
 * list to send a request.
 */
export function PersonSheet({
  event,
  match,
  pending,
  onConnect,
  onClose,
}: {
  event: PairspaceEvent;
  match: MatchResult;
  pending: boolean;
  onConnect: (target: Participant, message: string) => Promise<void>;
  onClose: () => void;
}) {
  const { participant, score, reasons } = match;
  const strength = matchStrength(score);
  const [composing, setComposing] = useState(false);
  const [busy, setBusy] = useState(false);

  // Lock the page behind the sheet and let Escape close it.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const labelFor = (id: string) => event.categories.find((c) => c.id === id)?.label ?? id;

  const answers = event.questions
    .map((q) => {
      const found = participant.answers?.find((a) => a.questionId === q.id);
      const values = !found
        ? []
        : Array.isArray(found.value)
          ? found.value
          : found.value
            ? [found.value]
            : [];
      return { question: q, values };
    })
    .filter((a) => a.values.length);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/45 backdrop-blur-[2px] sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`Profile of ${participant.firstName}`}
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[94dvh] w-full max-w-[520px] flex-col overflow-hidden rounded-t-3xl bg-surface shadow-(--shadow-lg) sm:max-h-[90dvh] sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="overflow-y-auto">
          {/* Portrait */}
          <div
            className="relative aspect-[4/5] sm:aspect-[5/4]"
            style={{
              background: participant.photoUrl ? "var(--color-sunken)" : tintFor(participant.id),
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={participant.photoUrl ?? poolAvatar(participant.id)}
              alt={participant.firstName}
              className="absolute inset-0 h-full w-full object-cover object-top"
            />
            <div className="scrim-b absolute inset-x-0 bottom-0 h-2/3" aria-hidden="true" />

            <button
              type="button"
              className="icon-btn absolute right-4 top-4 h-10 w-10"
              aria-label="Close"
              onClick={onClose}
            >
              <XIcon size={15} />
            </button>

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

            <div className="absolute inset-x-0 bottom-0 p-5">
              <p className="flex items-center gap-2 text-[0.8125rem] font-medium text-white/85">
                <span
                  className={`inline-block h-2 w-2 rounded-full ${
                    participant.open ? "bg-[#4ade80]" : "bg-white/50"
                  }`}
                  aria-hidden="true"
                />
                {participant.open ? "Open to pair up" : "Found a partner"}
              </p>
              <p className="mt-0.5 font-display text-[1.75rem] font-bold tracking-[-0.02em] text-white">
                {participant.firstName}
              </p>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-5 p-5 sm:p-6">
            {reasons.length ? (
              <p className="text-[0.875rem] leading-relaxed text-accent">{reasons.join(" · ")}</p>
            ) : null}

            <Row label="Is a">
              {participant.categoryIds.map((id) => (
                <Chip key={id}>{labelFor(id)}</Chip>
              ))}
            </Row>

            {participant.lookingForIds?.length ? (
              <Row label="Looking for">
                {participant.lookingForIds.map((id) => (
                  <Chip key={id}>{labelFor(id)}</Chip>
                ))}
              </Row>
            ) : null}

            {answers.map(({ question, values }) => (
              <Row key={question.id} label={question.label}>
                {question.type === "text" ? (
                  <p className="text-[0.9375rem] leading-relaxed text-ink-secondary">{values[0]}</p>
                ) : (
                  values.map((v) => <Chip key={v}>{v}</Chip>)
                )}
              </Row>
            ))}

            {participant.note ? (
              <Row label="Worth knowing">
                <p className="text-[0.9375rem] leading-relaxed text-ink-secondary">
                  {participant.note}
                </p>
              </Row>
            ) : null}
          </div>
        </div>

        {/* Action bar, always visible under the scrolling content */}
        <div className="border-t border-line bg-surface p-4 sm:p-5">
          {pending ? (
            <p className="flex items-center gap-2 text-[0.9375rem] font-medium text-accent">
              <CheckIcon size={15} />
              Request sent. You hear back as soon as {participant.firstName} answers.
            </p>
          ) : !participant.open ? (
            <p className="text-[0.9375rem] text-ink-muted">
              {participant.firstName} already found a partner.
            </p>
          ) : composing ? (
            <ConnectComposer
              event={event}
              participant={participant}
              busy={busy}
              onCancel={() => setComposing(false)}
              onSend={async (message) => {
                setBusy(true);
                try {
                  await onConnect(participant, message);
                  setComposing(false);
                } finally {
                  setBusy(false);
                }
              }}
            />
          ) : (
            <button
              type="button"
              className="btn btn-primary w-full"
              onClick={() => setComposing(true)}
            >
              Connect with {participant.firstName}
              <SendIcon size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[0.75rem] font-semibold uppercase tracking-[0.12em] text-ink-faint">
        {label}
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-line bg-sunken px-3 py-1.5 text-[0.8125rem] font-medium text-ink-secondary">
      {children}
    </span>
  );
}
