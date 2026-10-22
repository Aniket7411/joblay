"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * A short list of strings kept in localStorage (newest first), shared live
 * by every component using the same key — e.g. the saved-jobs hearts and
 * the navbar count. Empty during server render and when storage is blocked.
 */
const EVENT = "joblay:stored-list";
const EMPTY: string[] = [];
const cache = new Map<string, { raw: string | null; value: string[] }>();

function read(key: string): string[] {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(key);
  } catch {
    // storage blocked
  }
  const hit = cache.get(key);
  if (hit && hit.raw === raw) return hit.value; // same reference → no re-render
  let value: string[] = EMPTY;
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) value = parsed.filter((v): v is string => typeof v === "string");
  } catch {
    // corrupt value → treat as empty
  }
  cache.set(key, { raw, value });
  return value;
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange); // other tabs
  window.addEventListener(EVENT, onChange); // this tab
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(EVENT, onChange);
  };
}

export function useStoredList(key: string, max: number) {
  const list = useSyncExternalStore(subscribe, () => read(key), () => EMPTY);

  const write = useCallback(
    (next: string[]) => {
      try {
        window.localStorage.setItem(key, JSON.stringify(next.slice(0, max)));
      } catch {
        // storage blocked or full
      }
      window.dispatchEvent(new Event(EVENT));
    },
    [key, max]
  );

  /** Moves the value to the front (adding it if new). */
  const add = useCallback(
    (value: string) => write([value, ...read(key).filter((v) => v !== value)]),
    [key, write]
  );
  const remove = useCallback((value: string) => write(read(key).filter((v) => v !== value)), [key, write]);
  const toggle = useCallback(
    (value: string) => (read(key).includes(value) ? remove(value) : add(value)),
    [key, add, remove]
  );

  return { list, add, remove, toggle };
}

/** Jobs a visitor hearted (no account needed). */
export const useSavedJobs = () => useStoredList("joblay-saved-jobs", 100);

/** The visitor's last few keyword searches. */
export const useRecentSearches = () => useStoredList("joblay-recent-searches", 5);
