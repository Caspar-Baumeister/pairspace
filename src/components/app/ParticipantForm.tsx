"use client";

import { useEffect, useState } from "react";

import { PhotoField, type PhotoSelection } from "@/components/app/PhotoField";
import { usePersistentState } from "@/lib/hooks/usePersistentState";
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

export interface ParticipantSubmission extends ParticipantFormValue {
  photo: PhotoSelection;
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
  onSubmit: (value: ParticipantSubmission) => void | Promise<void>;
  busy?: boolean;
}) {
  // While editing an existing profile the source of truth is the record, not a
  // draft, so persistence is only enabled for a first time join.
  const isNew = !existing;
  const [value, setValue, { restored, clear }] = usePersistentState<ParticipantFormValue>(
    `pairspace.participant.${event.id}`,
    emptyValue(),
    { enabled: isNew },
  );
  const [photo, setPhoto] = useState<PhotoSelection>({
    blob: null,
    preview: existing?.photoUrl ?? null,
    removed: false,
  });
  const [touched, setTouched] = useState(false);
  const [noticeVisible, setNoticeVisible] = useState(false);

  useEffect(() => {
    if (!existing) return;
    setValue({
      firstName: existing.firstName,
      categoryIds: existing.categoryIds,
      lookingForIds: existing.lookingForIds,
      answers: existing.answers,
      note: existing.note,
      email: existing.email,
      notifyOnMatch: existing.notifyOnMatch,
    });
  }, [existing, setValue]);

  useEffect(() => {
    if (restored) setNoticeVisible(true);
  }, [restored]);

  function toggle(list: "categoryIds" | "lookingForIds", id: string) {
    setValue((v) => {
      const has = v[list].includes(id);
      return { ...v, [list]: has ? v[list].filter((x) => x !== id) : [...v[list], id] };
    });
  }

  function answerFor(q: EventQuestion): string[] {
    const found = value.answers.find((a) => a.questionId === q.id);
    if (!found) return [];
    return Array.isArray(found.value) ? found.value : found.value ? [found.value] : [];
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

  const photoMissing =
    event.allowPhotos && event.requirePhotos && !photo.preview && !existing?.photoUrl;

  const valid =
    value.firstName.trim().length >= 2 &&
    value.categoryIds.length > 0 &&
    /.+@.+\..+/.test(value.email) &&
    missingRequired.length === 0 &&
    !photoMissing;

  return (
    <form
      className="space-y-7"
      onSubmit={async (e) => {
        e.preventDefault();
        setTouched(true);
        if (!valid) return;
        await onSubmit({ ...value, photo });
        if (isNew) clear();
      }}
    >
      {noticeVisible ? (
        <div className="flex items-start gap-3 rounded-xl border border-accent-line bg-accent-soft px-4 py-3">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mt-[3px] shrink-0" aria-hidden="true">
            <circle cx="8" cy="8" r="7.25" stroke="var(--color-accent)" />
            <path d="M8 4.6v4.2M8 11.1v.6" stroke="var(--color-accent)" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <div className="flex-1">
            <p className="text-[0.875rem] text-ink-secondary">
              We brought back what you had already filled in.
            </p>
          </div>
          <button
            type="button"
            className="text-[0.8125rem] text-accent hover:underline"
            onClick={() => {
              clear();
              setValue(emptyValue());
              setNoticeVisible(false);
            }}
          >
            Start over
          </button>
        </div>
      ) : null}

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
          autoComplete="given-name"
        />
        <p className="mt-1.5 text-[0.8125rem] text-ink-faint">
          Only your first name is shown to other participants.
        </p>
      </div>

      {event.allowPhotos ? (
        <PhotoField
          name={value.firstName}
          seed={existing?.id ?? `${event.id}:${value.firstName || "you"}`}
          currentUrl={existing?.photoUrl}
          required={event.requirePhotos}
          onChange={setPhoto}
        />
      ) : null}

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
            {q.required ? <span className="ml-1 text-accent">required</span> : null}
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
                        setAnswer(q, selected ? current.filter((x) => x !== o) : [...current, o]);
                      }
                    }}
                  >
                    {o}
                  </button>
                );
              })}
            </div>
          )}
          {q.helpText ? <p className="mt-1.5 text-[0.8125rem] text-ink-faint">{q.helpText}</p> : null}
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
          autoComplete="email"
        />
        <p className="mt-1.5 text-[0.8125rem] text-ink-faint">
          Hidden from everyone. It is shared only with a person you both agreed to connect with.
        </p>
      </div>

      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          className="mt-1 h-4 w-4 accent-[var(--color-accent)]"
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
          {missingRequired.length
            ? `, answer ${missingRequired.map((q) => q.label).join(", ")}`
            : ""}
          {photoMissing ? " and upload a photo" : ""}.
        </p>
      ) : null}

      <button type="submit" className="btn btn-primary w-full" disabled={busy}>
        {busy ? "Saving" : existing ? "Save changes" : "Join this event"}
      </button>

      {isNew ? (
        <p className="text-center text-[0.8125rem] text-ink-faint">
          Your answers are kept in this browser while you fill them in, so a reload never loses
          them.
        </p>
      ) : null}
    </form>
  );
}
