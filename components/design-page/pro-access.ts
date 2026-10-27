"use client";

import { useSyncExternalStore } from "react";
import { hasSignedInHint, refreshSession, sessionRefreshWorked } from "@/lib/client/session";
import { CodeRequestError, loadDesignCode } from "./design-code-store";

// Whether this visitor may see a Pro design's source. The page is static and never loads Clerk: when the signed-in
// hint cookie is present it asks /api/code/<slug>, and the server decides. The code panel, the AI prompt button and
// the download button share the answer.

export type ProAccessState =
  /** Signed out (no hint), or not checked yet: the server-rendered locked panel. */
  | "locked"
  | "checking"
  | "unlocked"
  /** Signed in without a Pro license or seat. */
  | "forbidden"
  /** The session token expired and the automatic refresh already ran in this tab. */
  | "expired"
  | "error";

const states = new Map<string, ProAccessState>();
const listeners = new Set<() => void>();

export function proCodeUrl(slug: string): string {
  return `/api/code/${slug}`;
}

function set(slug: string, state: ProAccessState) {
  states.set(slug, state);
  for (const listener of listeners) listener();
}

/** Asks the server once per page (again after an error) whether the visitor may see this design's source. */
export function checkProAccess(slug: string) {
  const current = states.get(slug);
  if (current && current !== "error" && current !== "locked") return;
  if (!hasSignedInHint()) {
    set(slug, "locked");
    return;
  }
  set(slug, "checking");
  loadDesignCode(proCodeUrl(slug)).then(
    () => {
      sessionRefreshWorked();
      set(slug, "unlocked");
    },
    (error: unknown) => {
      const status = error instanceof CodeRequestError ? error.status : 0;
      if (status === 401) {
        // Navigating away: keep "checking" so the panel does not flash a different state first.
        if (!refreshSession()) set(slug, "expired");
      } else if (status === 403) {
        set(slug, "forbidden");
      } else {
        set(slug, "error");
      }
    },
  );
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useProAccess(slug: string): ProAccessState {
  return useSyncExternalStore(
    subscribe,
    () => states.get(slug) ?? "locked",
    () => "locked",
  );
}
