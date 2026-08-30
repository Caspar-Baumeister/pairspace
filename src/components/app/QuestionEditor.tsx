"use client";

import { useState } from "react";

import { slugify } from "@/lib/slug";
import type { EventQuestion, QuestionType } from "@/lib/types";

const TYPES: { value: QuestionType; label: string; hint: string }[] = [
  { value: "single", label: "One choice", hint: "Level, height, experience" },
  { value: "multi", label: "Several choices", hint: "Availability, days, styles" },
  { value: "text", label: "Free text", hint: "A short sentence about themselves" },
];

export function QuestionEditor({
  questions,
  onChange,
}: {
  questions: EventQuestion[];
  onChange: (next: EventQuestion[]) => void;
}) {
  const [label, setLabel] = useState("");
  const [type, setType] = useState<QuestionType>("single");
  const [options, setOptions] = useState("");

  function add() {
    const trimmed = label.trim();
    if (!trimmed) return;
    const id = slugify(trimmed) || `q${questions.length + 1}`;
    if (questions.some((q) => q.id === id)) return;
    const parsed = options
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean);
    onChange([
      ...questions,
      {
        id,
        label: trimmed,
        type,
        options: type === "text" ? [] : parsed,
        required: false,
        usedForMatching: type !== "text",
      },
    ]);
    setLabel("");
    setOptions("");
  }

  function patch(id: string, next: Partial<EventQuestion>) {
    onChange(questions.map((q) => (q.id === id ? { ...q, ...next } : q)));
  }

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        {questions.map((q) => (
          <div key={q.id} className="rounded-xl border border-line bg-surface p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[0.9375rem] font-medium text-ink">{q.label}</p>
                <p className="mt-1 text-[0.8125rem] text-ink-muted">
                  {q.type === "text"
                    ? "Free text"
                    : q.options.join(", ") || "No options yet"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onChange(questions.filter((x) => x.id !== q.id))}
                className="text-[0.8125rem] text-ink-faint transition-colors hover:text-danger"
              >
                Remove
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
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
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-dashed border-line-strong bg-sunken p-4">
        <p className="text-[0.8125rem] font-medium text-ink-secondary">Add a question</p>
        <div className="mt-3 space-y-3">
          <input
            className="field"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Experience level"
            aria-label="Question"
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
          {type !== "text" ? (
            <input
              className="field"
              value={options}
              onChange={(e) => setOptions(e.target.value)}
              placeholder="Beginner, Improver, Intermediate, Advanced"
              aria-label="Options separated by commas"
            />
          ) : null}
          <button type="button" className="btn btn-secondary btn-sm" onClick={add} disabled={!label.trim()}>
            Add question
          </button>
        </div>
      </div>
    </div>
  );
}
