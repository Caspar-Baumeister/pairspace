"use client";

import { useState } from "react";

import type { EventQuestion, PairspaceEvent, Participant, ParticipantAnswer } from "@/lib/types";

export interface ParticipantFormValue {
  firstName: string;
  categoryIds: string[];
  lookingForIds: string[];
  answers: ParticipantAnswer[];
  note: string;
  email: string;
  notifyOnMatch: boolean;
}

function emptyValue(): ParticipantFormValue {
  return {
    firstName: "",
    categoryIds: [],
    lookingForIds: [],
    answers: [],
    note: "",
    email: "",
    notifyOnMatch: true,
  };
}

export function ParticipantForm({
  event,
  existing,
  onSubmit,
  busy,
}: {
  event: PairspaceEvent;
  existing?: Participant | null;
  onSubmit: (value: ParticipantFormValue) => void | Promise<void>;
  busy?: boolean;
}) {
  const [value, setValue] = useState<ParticipantFormValue>(
    existing
      ? {
          firstName: existing.firstName,
          categoryIds: existing.categoryIds,
          lookingForIds: existing.lookingForIds,
          answers: existing.answers,
          note: existing.note,
          email: existing.email,
          notifyOnMatch: existing.notifyOnMatch,
        }
      : emptyValue(),
  );
  const [touched, setTouched] = useState(false);

  function toggle(list: "categoryIds" | "lookingForIds", id: string) {
    setValue((v) => {
      const has = v[list].includes(id);
      return { ...v, [list]: has ? v[list].filter((x) => x !== id) : [...v[list], id] };
    });
  }

  function answerFor(q: EventQuestion): string[] {
    const found = value.answers.find((a) => a.questionId === q.id);
    if (!found) return [];
    return Array.isArray(found.value) ? found.value : [found.value];
  }

  function setAnswer(q: EventQuestion, next: string | string[]) {
    setValue((v) => ({
      ...v,
      answers: [
        ...v.answers.filter((a) => a.questionId !== q.id),
        { questionId: q.id, value: next },
      ],
    }));
  }

  const missingRequired = event.questions
    .filter((q) => q.required)
    .filter((q) => answerFor(q).length === 0);

  const valid =
    value.firstName.trim().length >= 2 &&
    value.categoryIds.length > 0 &&
    /.+@.+\..+/.test(value.email) &&
    missingRequired.length === 0;

  return (
    <form
      className="space-y-7"
      onSubmit={(e) => {
        e.preventDefault();
        setTouched(true);
        if (valid) void onSubmit(value);
      }}
    >
      <div>
        <label className="label" htmlFor="firstName">
          Your first name
        </label>
        <input
          id="firstName"
          className="field"
          value={value.firstName}
          onChange={(e) => setValue((v) => ({ ...v, firstName: e.target.value }))}
          placeholder="Maya"
          maxLength={40}
        />
        <p className="mt-1.5 text-[0.8125rem] text-ink-faint">
          Only your first name is shown to other participants.
        </p>
      </div>

      <div>
        <p className="label">I am</p>
        <div className="flex flex-wrap gap-2">
          {event.categories.map((c) => (
            <button
              key={c.id}
              type="button"
              className="chip"
              data-active={value.categoryIds.includes(c.id)}
              onClick={() => toggle("categoryIds", c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="label">I am looking for</p>
        <div className="flex flex-wrap gap-2">
          {event.categories.map((c) => (
            <button
              key={c.id}
              type="button"
              className="chip"
              data-active={value.lookingForIds.includes(c.id)}
              onClick={() => toggle("lookingForIds", c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {event.questions.map((q) => (
        <div key={q.id}>
          <label className="label" htmlFor={`q-${q.id}`}>
            {q.label}
            {q.required ? <span className="ml-1 text-blue">required</span> : null}
          </label>
          {q.type === "text" ? (
            <textarea
              id={`q-${q.id}`}
              className="field"
              rows={2}
              value={answerFor(q)[0] ?? ""}
              onChange={(e) => setAnswer(q, e.target.value)}
              maxLength={280}
            />
          ) : (
            <div className="flex flex-wrap gap-2">
              {q.options.map((o) => {
                const selected = answerFor(q).includes(o);
                return (
                  <button
                    key={o}
                    type="button"
                    className="chip"
                    data-active={selected}
                    onClick={() => {
                      if (q.type === "single") setAnswer(q, selected ? "" : o);
                      else {
                        const current = answerFor(q);
                        setAnswer(
                          q,
                          selected ? current.filter((x) => x !== o) : [...current, o],
                        );
                      }
                    }}
                  >
                    {o}
                  </button>
                );
              })}
            </div>
          )}
          {q.helpText ? (
            <p className="mt-1.5 text-[0.8125rem] text-ink-faint">{q.helpText}</p>
          ) : null}
        </div>
      ))}

      <div>
        <label className="label" htmlFor="note">
          Anything else worth knowing
        </label>
        <textarea
          id="note"
          className="field"
          rows={2}
          value={value.note}
          onChange={(e) => setValue((v) => ({ ...v, note: e.target.value }))}
          placeholder="Happy to warm up slowly, I train mostly standing acro."
          maxLength={280}
        />
      </div>

      <div>
        <label className="label" htmlFor="email">
          Your email address
        </label>
        <input
          id="email"
          type="email"
          className="field"
          value={value.email}
          onChange={(e) => setValue((v) => ({ ...v, email: e.target.value }))}
          placeholder="you@example.com"
        />
        <p className="mt-1.5 text-[0.8125rem] text-ink-faint">
          Hidden from everyone. It is shared only with a person you both agreed to connect with.
        </p>
      </div>

      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          className="mt-1 h-4 w-4 accent-[var(--color-blue)]"
          checked={value.notifyOnMatch}
          onChange={(e) => setValue((v) => ({ ...v, notifyOnMatch: e.target.checked }))}
        />
        <span className="text-[0.875rem] text-ink-secondary">
          Email me when a matching participant joins this event
        </span>
      </label>

      {touched && !valid ? (
        <p className="text-[0.875rem] text-danger">
          Please add your name, at least one category, a valid email address
          {missingRequired.length ? ` and answer ${missingRequired.map((q) => q.label).join(", ")}` : ""}
          .
        </p>
      ) : null}

      <button type="submit" className="btn btn-primary w-full" disabled={busy}>
        {busy ? "Saving" : existing ? "Save changes" : "Join this event"}
      </button>
    </form>
  );
}
