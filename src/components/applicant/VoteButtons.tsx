"use client";

import { Ban, Heart, Minus, ThumbsDown, ThumbsUp, type LucideIcon } from "lucide-react";

import { VOTES } from "@/lib/options";
import type { Vote } from "@/lib/types";

export const VOTE_ICONS: Record<Vote, LucideIcon> = {
  [-2]: Ban,
  [-1]: ThumbsDown,
  0: Minus,
  1: ThumbsUp,
  2: Heart,
};

/** Five round buttons, the two ends a little bigger like Tinder's nope and like. */
export function VoteButtons({
  onVote,
  disabled,
  selected,
}: {
  onVote: (vote: Vote) => void;
  disabled?: boolean;
  selected?: Vote | null;
}) {
  return (
    <div className="flex items-start justify-between gap-1">
      {VOTES.map((o, i) => {
        const Icon = VOTE_ICONS[o.value];
        const big = o.value === -2 || o.value === 2;
        const isSelected = selected === o.value;
        return (
          <button
            key={o.value}
            type="button"
            disabled={disabled}
            onClick={() => onVote(o.value)}
            aria-label={`${o.label} (Taste ${i + 1})`}
            aria-pressed={isSelected}
            className="group flex w-[64px] flex-col items-center gap-1.5 disabled:opacity-50"
          >
            <span
              className={`flex items-center justify-center rounded-full border bg-base-10 transition-transform duration-150 group-hover:scale-105 group-active:scale-95 ${
                big ? "h-14 w-14" : "h-12 w-12"
              }`}
              style={{
                color: o.color,
                borderColor: isSelected ? o.color : `color-mix(in srgb, ${o.color} 35%, transparent)`,
                background: isSelected ? `color-mix(in srgb, ${o.color} 18%, transparent)` : undefined,
              }}
            >
              <Icon size={big ? 24 : 20} strokeWidth={2} fill={o.value === 2 ? "currentColor" : "none"} />
            </span>
            <span className="text-center text-[11px] leading-tight text-muted">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/** A compact row of five dots to change a vote in a list. */
export function VoteDots({ value, onChange }: { value: Vote | null; onChange: (vote: Vote) => void }) {
  return (
    <div className="flex gap-1">
      {VOTES.map((o) => {
        const Icon = VOTE_ICONS[o.value];
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            title={o.label}
            aria-label={o.label}
            aria-pressed={active}
            onClick={() => onChange(o.value)}
            className="flex h-7 w-7 items-center justify-center rounded-full border transition-colors"
            style={{
              color: active ? o.color : "var(--color-faint)",
              borderColor: active ? o.color : "var(--color-line)",
              background: active ? `color-mix(in srgb, ${o.color} 16%, transparent)` : "transparent",
            }}
          >
            <Icon size={13} strokeWidth={2} />
          </button>
        );
      })}
    </div>
  );
}
