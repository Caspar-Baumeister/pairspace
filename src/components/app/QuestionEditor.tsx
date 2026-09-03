"use client";

import { useState } from "react";

import { slugify } from "@/lib/slug";
import type { EventQuestion, QuestionType } from "@/lib/types";

const TYPES: { value: QuestionType; label: string; hint: string }[] = [
  { value: "single", label: "One choice", hint: "Level, height, experience" },
  { value: "multi", label: "Several choices", hint: "Availability, days, styles" },
  { value: "text", label: "Free text", hint: "A short sentence about themselves" },
];

/** Editable list of choices for one question. Add, rename, reorder, remove. */
function OptionList({
  question,
  onChange,
}: {
  question: EventQuestion;
  onChange: (options: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  function add() {
    const parts = draft
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean)
      .filter((o) => !question.options.includes(o));
    if (!parts.length) return;
    onChange([...question.options, ...parts]);
    setDraft("");
  }

  function rename(index: number, next: string) {
    onChange(question.options.map((o, i) => (i === index ? next : o)));
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= question.options.length) return;
    const next = [...question.options];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div className="mt-3">
      <p className="text-[0.8125rem] text-ink-muted">Choices</p>

      <ul className="mt-2 space-y-2">
        {question.options.map((option, i) => (
          <li key={`${option}-${i}`} className="flex items-center gap-2">
            <input
              className="field h-9 flex-1 sm:text-[0.875rem]"
              value={option}
              onChange={(e) => rename(i, e.target.value)}
              aria-label={`Choice ${i + 1} of ${question.label}`}
            />
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-ink-faint transition-colors hover:text-ink disabled:opacity-35"
                onClick={() => move(i, -1)}
                disabled={i === 0}
                aria-label={`Move ${option} up`}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path d="M6 9.5V2.5M2.8 5.7L6 2.5l3.2 3.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-ink-faint transition-colors hover:text-ink disabled:opacity-35"
                onClick={() => move(i, 1)}
                disabled={i === question.options.length - 1}
                aria-label={`Move ${option} down`}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path d="M6 2.5v7M2.8 6.3L6 9.5l3.2-3.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-ink-faint transition-colors hover:border-danger hover:text-danger"
                onClick={() => onChange(question.options.filter((_, x) => x !== i))}
                aria-label={`Remove ${option}`}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-2 flex gap-2">
        <input
          className="field h-9 sm:text-[0.875rem]"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder="Add a choice, or paste several separated by commas"
          aria-label={`Add a choice to ${question.label}`}
        />
        <button
          type="button"
          className="btn btn-secondary btn-sm shrink-0"
          onClick={add}
          disabled={!draft.trim()}
        >
          Add
        </button>
      </div>

      {question.options.length === 0 ? (
        <p className="mt-2 text-[0.8125rem] text-warning">
          This question has no choices yet, so participants cannot answer it.
        </p>
      ) : null}
    </div>
  );
}

export function QuestionEditor({
  questions,
  onChange,
}: {
  questions: EventQuestion[];
  onChange: (next: EventQuestion[]) => void;
}) {
  const [label, setLabel] = useState("");
  const [type, setType] = useState<QuestionType>("single");
  const [openId, setOpenId] = useState<string | null>(null);

  function add() {
    const trimmed = label.trim();
    if (!trimmed) return;
    let id = slugify(trimmed) || `q${questions.length + 1}`;
    if (questions.some((q) => q.id === id)) id = `${id}-${questions.length + 1}`;
    onChange([
      ...questions,
      {
        id,
        label: trimmed,
        type,
        options: [],
        required: false,
        usedForMatching: type !== "text",
      },
    ]);
    setLabel("");
    // Open the new question right away so the choices can be typed in place.
    if (type !== "text") setOpenId(id);
  }

  function patch(id: string, next: Partial<EventQuestion>) {
    onChange(questions.map((q) => (q.id === id ? { ...q, ...next } : q)));
  }

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        {questions.map((q) => {
          const isOpen = openId === q.id;
          return (
            <div key={q.id} className="rounded-xl border border-line bg-surface p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <input
                    className="w-full bg-transparent text-[0.9375rem] font-medium text-ink outline-none"
                    value={q.label}
                    onChange={(e) => patch(q.id, { label: e.target.value })}
                    aria-label="Question"
                  />
                  <p className="mt-1 truncate text-[0.8125rem] text-ink-muted">
                    {q.type === "text"
                      ? "Free text"
                      : q.options.length
                        ? `${TYPES.find((t) => t.value === q.type)?.label}: ${q.options.join(", ")}`
                        : "No choices yet"}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  {q.type !== "text" ? (
                    <button
                      type="button"
                      className="text-[0.8125rem] text-accent hover:underline"
                      onClick={() => setOpenId(isOpen ? null : q.id)}
                      aria-expanded={isOpen}
                    >
                      {isOpen ? "Done" : "Edit choices"}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => onChange(questions.filter((x) => x.id !== q.id))}
                    className="text-[0.8125rem] text-ink-faint transition-colors hover:text-danger"
                  >
                    Remove
                  </button>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    className="chip"
                    data-active={q.type === t.value}
                    title={t.hint}
                    onClick={() =>
                      patch(q.id, {
                        type: t.value,
                        options: t.value === "text" ? [] : q.options,
                        usedForMatching: t.value === "text" ? false : q.usedForMatching,
                      })
                    }
                  >
                    {t.label}
                  </button>
                ))}
                <span className="w-px self-stretch bg-line" aria-hidden="true" />
                <button
                  type="button"
                  className="chip"
                  data-active={q.required}
                  onClick={() => patch(q.id, { required: !q.required })}
                >
                  {q.required ? "Required" : "Optional"}
                </button>
                {q.type !== "text" ? (
                  <button
                    type="button"
                    className="chip"
                    data-active={q.usedForMatching}
                    onClick={() => patch(q.id, { usedForMatching: !q.usedForMatching })}
                  >
                    {q.usedForMatching ? "Counts for matching" : "Shown only"}
                  </button>
                ) : null}
              </div>

              {isOpen && q.type !== "text" ? (
                <OptionList question={q} onChange={(options) => patch(q.id, { options })} />
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-dashed border-line-strong bg-sunken p-4">
        <p className="text-[0.8125rem] font-medium text-ink-secondary">Add a question</p>
        <div className="mt-3 space-y-3">
          <input
            className="field"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              }
            }}
            placeholder="Experience level"
            aria-label="New question"
          />
          <div className="flex flex-wrap gap-2">
            {TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                className="chip"
                data-active={type === t.value}
                onClick={() => setType(t.value)}
                title={t.hint}
              >
                {t.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={add}
            disabled={!label.trim()}
          >
            Add question
          </button>
        </div>
      </div>
    </div>
  );
}
