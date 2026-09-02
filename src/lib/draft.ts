"use client";

import type { EventDraft } from "./types";

const KEY = "pairspace.draft.v1";
const PENDING_KEY = "pairspace.pendingEvent.v1";

export const emptyDraft: EventDraft = {
  name: "",
  location: "",
  startDate: "",
  endDate: "",
  description: "",
  categories: [],
  questions: [],
  visibility: "participants",
  allowPhotos: false,
  requirePhotos: false,
  retentionDays: 30,
};

export function loadDraft(): EventDraft {
  if (typeof window === "undefined") return emptyDraft;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return emptyDraft;
    return { ...emptyDraft, ...(JSON.parse(raw) as Partial<EventDraft>) };
  } catch {
    return emptyDraft;
  }
}

export function saveDraft(draft: EventDraft) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(draft));
  } catch {
    /* storage can be blocked, the flow still works in memory */
  }
}

export function clearDraft() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

/** Remembers which event was just created so the dashboard can highlight it. */
export function rememberEvent(slug: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PENDING_KEY, slug);
  } catch {
    /* ignore */
  }
}

export function takeRememberedEvent(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(PENDING_KEY);
    if (v) window.localStorage.removeItem(PENDING_KEY);
    return v;
  } catch {
    return null;
  }
}
