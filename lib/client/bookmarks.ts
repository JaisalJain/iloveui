"use client";

import { useSyncExternalStore } from "react";

// Bookmarked design slugs, kept in localStorage under iloveui.bookmarks (a JSON array). Storage can be unavailable
// or hold anything; the store then keeps bookmarks for this visit only.

export const BOOKMARKS_STORAGE_KEY = "iloveui.bookmarks";

const EMPTY: readonly string[] = [];
let bookmarks: readonly string[] = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function read(): readonly string[] {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(BOOKMARKS_STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed)
      ? [...new Set(parsed.filter((slug): slug is string => typeof slug === "string"))]
      : EMPTY;
  } catch {
    return EMPTY;
  }
}

function emit() {
  for (const listener of listeners) listener();
}

function load() {
  if (loaded) return;
  loaded = true;
  bookmarks = read();
  // Another tab bookmarked something: follow it.
  window.addEventListener("storage", (event) => {
    if (event.key !== BOOKMARKS_STORAGE_KEY) return;
    bookmarks = read();
    emit();
  });
}

export function getBookmarks(): readonly string[] {
  load();
  return bookmarks;
}

export function isBookmarked(slug: string): boolean {
  return getBookmarks().includes(slug);
}

export function setBookmarked(slug: string, bookmarked: boolean) {
  load();
  const without = bookmarks.filter((item) => item !== slug);
  bookmarks = bookmarked ? [...without, slug] : without;
  try {
    window.localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(bookmarks));
  } catch {
    // Storage can be unavailable; the bookmark still holds for this visit.
  }
  emit();
}

function subscribe(listener: () => void) {
  load();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Whether a design is bookmarked. The server render (and first client render) say no. */
export function useBookmarked(slug: string): boolean {
  return useSyncExternalStore(
    subscribe,
    () => isBookmarked(slug),
    () => false,
  );
}
