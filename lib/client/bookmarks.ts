"use client";

import { useSyncExternalStore } from "react";
import { hasSignedInHint } from "./session";

// Bookmarked design slugs, kept in localStorage under iloveui.bookmarks (a JSON array). Storage can be unavailable
// or hold anything; the store then keeps bookmarks for this visit only.
// Signed in (the hint cookie is present), the store also syncs with D1 through /api/bookmarks: the first time in a
// browser it merges the local bookmarks into the account, after that the account's list is the truth, and every
// toggle is mirrored. Sync failures never block a toggle; localStorage still holds it.

export const BOOKMARKS_STORAGE_KEY = "iloveui.bookmarks";
/** Set once this browser's local bookmarks were merged into the account; cleared when the hint disappears. */
export const BOOKMARKS_MERGED_KEY = "iloveui.bookmarks.merged";

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

function store(next: readonly string[]) {
  bookmarks = next;
  try {
    window.localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(bookmarks));
  } catch {
    // Storage can be unavailable; the bookmarks still hold for this visit.
  }
}

function storageFlag(write?: boolean): boolean {
  try {
    if (write === true) window.localStorage.setItem(BOOKMARKS_MERGED_KEY, "1");
    if (write === false) window.localStorage.removeItem(BOOKMARKS_MERGED_KEY);
    return window.localStorage.getItem(BOOKMARKS_MERGED_KEY) === "1";
  } catch {
    return false;
  }
}

// Bumped by every toggle, so a sync response that started before a toggle never overwrites it.
let toggles = 0;

async function syncWithAccount() {
  if (!hasSignedInHint()) {
    storageFlag(false);
    return;
  }
  const merged = storageFlag();
  const startedAt = toggles;
  const response = await fetch("/api/bookmarks", {
    method: merged ? "GET" : "PUT",
    credentials: "same-origin",
    headers: merged ? undefined : { "content-type": "application/json" },
    body: merged ? undefined : JSON.stringify({ slugs: bookmarks }),
  });
  if (!response.ok) return;
  const { slugs } = (await response.json()) as { slugs?: unknown };
  if (!Array.isArray(slugs) || !slugs.every((slug) => typeof slug === "string")) return;
  storageFlag(true);
  if (toggles !== startedAt) return;
  store(slugs as string[]);
  emit();
}

function mirror(slug: string, bookmarked: boolean) {
  if (!hasSignedInHint()) return;
  const request = bookmarked
    ? fetch("/api/bookmarks", {
        method: "PUT",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slugs: [slug] }),
      })
    : fetch(`/api/bookmarks/${encodeURIComponent(slug)}`, { method: "DELETE", credentials: "same-origin" });
  request.catch(() => undefined);
}

function load() {
  if (loaded) return;
  loaded = true;
  bookmarks = read();
  syncWithAccount().catch(() => undefined);
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
  toggles += 1;
  store(bookmarked ? [...without, slug] : without);
  emit();
  mirror(slug, bookmarked);
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
