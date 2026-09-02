"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * State that survives a reload.
 *
 * Losing a half filled form to an accidental refresh is the single most annoying
 * thing a web form can do, so every form in Pairspace keeps its value in local
 * storage under a stable key and restores it on mount. Writes are debounced so a
 * fast typist does not hit storage on every keystroke.
 *
 * Returns the usual pair plus `restored`, which tells the UI whether it should
 * mention that a draft came back, and `clear`, which is called after a
 * successful submit so the next visit starts empty.
 */
export function usePersistentState<T>(
  key: string,
  initial: T,
  options: { debounceMs?: number; enabled?: boolean } = {},
): [T, (updater: T | ((prev: T) => T)) => void, { restored: boolean; clear: () => void }] {
  const { debounceMs = 300, enabled = true } = options;

  const [value, setValue] = useState<T>(initial);
  const [restored, setRestored] = useState(false);
  const timer = useRef<number | null>(null);
  const hydrated = useRef(false);

  // Restore once, after mount, so the server rendered markup and the first
  // client render agree and React does not complain about a mismatch.
  useEffect(() => {
    if (!enabled) {
      hydrated.current = true;
      return;
    }
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw) as { v: T; t: number };
        if (parsed && typeof parsed === "object" && "v" in parsed) {
          setValue(parsed.v);
          setRestored(true);
        }
      }
    } catch {
      /* storage can be disabled, the form still works in memory */
    }
    hydrated.current = true;
  }, [key, enabled]);

  useEffect(() => {
    if (!enabled || !hydrated.current) return;
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      try {
        window.localStorage.setItem(key, JSON.stringify({ v: value, t: Date.now() }));
      } catch {
        /* quota or private mode, ignore */
      }
    }, debounceMs);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [key, value, debounceMs, enabled]);

  const clear = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
    setRestored(false);
  }, [key]);

  const update = useCallback((updater: T | ((prev: T) => T)) => {
    setValue((prev) => (typeof updater === "function" ? (updater as (p: T) => T)(prev) : updater));
  }, []);

  return [value, update, { restored, clear }];
}
