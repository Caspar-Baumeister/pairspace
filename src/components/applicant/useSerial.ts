"use client";

import { useCallback, useRef } from "react";

/**
 * Runs async writes one after another. saveVote reads the ballot before it
 * writes, so two quick votes in parallel would overwrite each other.
 */
export function useSerial() {
  const chain = useRef<Promise<unknown>>(Promise.resolve());
  return useCallback(<T,>(task: () => Promise<T>): Promise<T> => {
    const next = chain.current.then(task, task);
    chain.current = next.catch(() => undefined);
    return next;
  }, []);
}
