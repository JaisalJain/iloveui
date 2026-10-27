"use client";

import { readSignedInHint } from "@/components/auth/signed-in-hint";

// Owner-only features on static pages: whether to ask the API at all (the iu_signed_in hint cookie, a hint only;
// every /api route checks the session itself), and how to recover when the short-lived session token expired.

const REFRESH_GUARD_KEY = "iloveui.session-refresh";

export function hasSignedInHint(): boolean {
  try {
    return readSignedInHint();
  } catch {
    return false;
  }
}

/**
 * An API call answered 401 while the hint says signed in: Clerk's short-lived session token expired. A document
 * load through /account/refresh (matched by the middleware) refreshes it and comes back here. This happens at most
 * once per tab session, so a session that really ended never loops; returns false when it will not navigate.
 */
export function refreshSession(): boolean {
  try {
    if (window.sessionStorage.getItem(REFRESH_GUARD_KEY)) return false;
    window.sessionStorage.setItem(REFRESH_GUARD_KEY, "1");
  } catch {
    return false;
  }
  window.location.assign(refreshUrl());
  return true;
}

/** /account/refresh?next=<this page>, for the manual "Refresh your session" action. */
export function refreshUrl(): string {
  const next = `${window.location.pathname}${window.location.search}`;
  return `/account/refresh?next=${encodeURIComponent(next)}`;
}

/** A call succeeded with the session: the next expiry may refresh again. */
export function sessionRefreshWorked() {
  try {
    window.sessionStorage.removeItem(REFRESH_GUARD_KEY);
  } catch {
    // Storage can be unavailable; the guard then simply stays in place.
  }
}
