"use client";

import { useEffect, useState } from "react";

import { MascotPeek, MascotProud } from "@/components/mascot/Scenes";
import { sendFeedback } from "@/lib/firebase/db";
import type { FeedbackMood, FeedbackMoment, PairspaceEvent, Participant } from "@/lib/types";

const MOODS: { id: FeedbackMood; label: string }[] = [
  { id: "loved", label: "Loved it" },
  { id: "okay", label: "It was okay" },
  { id: "off", label: "Something was off" },
];

const COPY: Record<FeedbackMoment, { ask: string; hint: string; placeholder: string }> = {
  joined: {
    ask: "Quick one before you go on: what would have made that easier?",
    hint: "One sentence is plenty. Caspar reads every single one.",
    placeholder: "A question I missed, a step that felt odd, anything at all",
  },
  matched: {
    ask: "You found someone! Did Pairspace do its job?",
    hint: "What should be different next time? Caspar reads every single one.",
    placeholder: "What was missing, what got in the way, what surprised you",
  },
  later: {
    ask: "What should Pairspace do better?",
    hint: "Ideas, bugs, wishes. Caspar reads every single one.",
    placeholder: "Anything on your mind",
  },
};

function storageKey(eventId: string, moment: FeedbackMoment) {
  return `ps-feedback-${eventId}-${moment}`;
}

function wasHandled(eventId: string, moment: FeedbackMoment): boolean {
  try {
    return window.localStorage.getItem(storageKey(eventId, moment)) !== null;
  } catch {
    return false;
  }
}

function markHandled(eventId: string, moment: FeedbackMoment, how: "sent" | "dismissed") {
  try {
    window.localStorage.setItem(storageKey(eventId, moment), how);
  } catch {
    /* private mode, fine */
  }
}

/**
 * A short feedback ask from Mo. Shown once per event and moment: after the
 * profile is created, after the first accepted connection, and on demand from
 * the feedback link. Dismissing it counts as answered, so nobody sees it twice.
 */
export function FeedbackPrompt({
  event,
  me,
  moment,
  email,
  onClose,
  className,
}: {
  event: PairspaceEvent;
  me: Participant | null;
  moment: FeedbackMoment;
  /** Contact email of the participant, offered as a reply channel if present. */
  email?: string | null;
  /** Only used for the on demand variant that lives in a sheet. */
  onClose?: () => void;
  className?: string;
}) {
  const [visible, setVisible] = useState(moment === "later");
  const [mood, setMood] = useState<FeedbackMood | null>(null);
  const [text, setText] = useState("");
  const [allowReply, setAllowReply] = useState(true);
  const [state, setState] = useState<"idle" | "busy" | "sent" | "error">("idle");

  useEffect(() => {
    if (moment === "later") return;
    setVisible(!wasHandled(event.id, moment));
  }, [event.id, moment]);

  if (!visible) return null;

  const copy = COPY[moment];
  const canSend = state !== "busy" && (mood !== null || text.trim().length > 0);

  async function submit() {
    if (!canSend || !me) return;
    setState("busy");
    try {
      await sendFeedback({
        uid: me.uid,
        eventId: event.id,
        eventName: event.name,
        participantId: me.id,
        moment,
        mood,
        text,
        email: allowReply && email ? email : null,
      });
      markHandled(event.id, moment, "sent");
      setState("sent");
    } catch {
      setState("error");
    }
  }

  function dismiss() {
    markHandled(event.id, moment, "dismissed");
    setVisible(false);
    onClose?.();
  }

  if (state === "sent") {
    return (
      <div className={`card p-6 text-center ${className ?? ""}`}>
        <MascotProud className="mx-auto w-[140px]" label="Mo says thank you" />
        <p className="heading mt-2">Thank you, that helps a lot</p>
        <p className="mt-1 text-[0.9375rem] text-ink-muted">Mo passes it straight on to Caspar.</p>
        {onClose ? (
          <button type="button" className="btn btn-secondary btn-sm mt-4" onClick={onClose}>
            Close
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className={`card relative p-5 pt-6 sm:p-6 ${className ?? ""}`}>
      {moment !== "later" ? (
        <button
          type="button"
          className="icon-btn absolute right-3 top-3"
          aria-label="Not now"
          onClick={dismiss}
        >
          <CloseGlyph />
        </button>
      ) : null}

      <div className="flex items-end gap-3">
        <div className="w-16 shrink-0 sm:w-20">
          <MascotPeek className="w-full" />
        </div>
        <div className="speech mb-2 flex-1 text-[0.9375rem]">{copy.ask}</div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="How was it">
        {MOODS.map((m) => (
          <button
            key={m.id}
            type="button"
            className="chip"
            data-active={mood === m.id ? "true" : "false"}
            aria-pressed={mood === m.id}
            onClick={() => setMood(mood === m.id ? null : m.id)}
          >
            {m.label}
          </button>
        ))}
      </div>

      <textarea
        className="field mt-3 min-h-[88px]"
        placeholder={copy.placeholder}
        value={text}
        maxLength={1000}
        onChange={(e) => setText(e.target.value)}
        aria-label="Your feedback"
      />
      <p className="mt-2 text-[0.8125rem] text-ink-faint">{copy.hint}</p>

      {email ? (
        <label className="mt-3 flex cursor-pointer items-center gap-2 text-[0.875rem] text-ink-muted">
          <input
            type="checkbox"
            className="h-4 w-4 accent-(--color-accent)"
            checked={allowReply}
            onChange={(e) => setAllowReply(e.target.checked)}
          />
          Caspar may write back to {email}
        </label>
      ) : null}

      {state === "error" ? (
        <p className="mt-3 text-[0.875rem] text-danger">Could not send that. Please try again.</p>
      ) : null}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <button type="button" className="btn btn-primary w-full sm:w-auto" disabled={!canSend} onClick={submit}>
          {state === "busy" ? "Sending" : "Send to Caspar"}
        </button>
        <button type="button" className="btn btn-ghost w-full sm:w-auto" onClick={dismiss}>
          {moment === "later" ? "Cancel" : "Not now"}
        </button>
      </div>
    </div>
  );
}

/** The on demand variant, opened from the feedback link at the bottom of the event page. */
export function FeedbackSheet({
  event,
  me,
  email,
  onClose,
}: {
  event: PairspaceEvent;
  me: Participant | null;
  email?: string | null;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/45 backdrop-blur-[2px] sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Feedback"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[520px] rounded-t-3xl bg-surface p-3 shadow-(--shadow-lg) sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <FeedbackPrompt
          event={event}
          me={me}
          email={email}
          moment="later"
          onClose={onClose}
          className="border-0 shadow-none"
        />
      </div>
    </div>
  );
}

function CloseGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
