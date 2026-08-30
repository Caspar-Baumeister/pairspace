"use client";

import { useState } from "react";

import { slugify } from "@/lib/slug";
import type { EventCategory } from "@/lib/types";

export function CategoryEditor({
  categories,
  onChange,
}: {
  categories: EventCategory[];
  onChange: (next: EventCategory[]) => void;
}) {
  const [draft, setDraft] = useState("");

  function add() {
    const label = draft.trim();
    if (!label) return;
    const id = slugify(label) || `cat${categories.length + 1}`;
    if (categories.some((c) => c.id === id)) return;
    onChange([...categories, { id, label, matchesWith: [] }]);
    setDraft("");
  }

  function remove(id: string) {
    onChange(
      categories
        .filter((c) => c.id !== id)
        .map((c) => ({ ...c, matchesWith: c.matchesWith.filter((m) => m !== id) })),
    );
  }

  function togglePair(fromId: string, toId: string) {
    onChange(
      categories.map((c) => {
        if (c.id !== fromId) return c;
        const has = c.matchesWith.includes(toId);
        return {
          ...c,
          matchesWith: has ? c.matchesWith.filter((m) => m !== toId) : [...c.matchesWith, toId],
        };
      }),
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          className="field"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder="Add a category, for example Base"
          aria-label="New participant category"
        />
        <button type="button" className="btn btn-secondary" onClick={add} disabled={!draft.trim()}>
          Add
        </button>
      </div>

      {categories.length === 0 ? (
        <p className="text-[0.875rem] text-ink-faint">
          No categories yet. Pick a preset above or add your own.
        </p>
      ) : null}

      <div className="space-y-3">
        {categories.map((c) => (
          <div key={c.id} className="rounded-xl border border-line bg-surface p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[0.9375rem] font-medium text-ink">{c.label}</p>
              <button
                type="button"
                onClick={() => remove(c.id)}
                className="text-[0.8125rem] text-ink-faint transition-colors hover:text-danger"
              >
                Remove
              </button>
            </div>
            <p className="mt-3 text-[0.8125rem] text-ink-muted">Can pair with</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {categories.map((other) => (
                <button
                  key={other.id}
                  type="button"
                  className="chip"
                  data-active={c.matchesWith.includes(other.id)}
                  onClick={() => togglePair(c.id, other.id)}
                >
                  {other.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
