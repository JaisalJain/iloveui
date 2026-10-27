// The browser side of the `iu_signed_in` hint cookie that middleware.ts keeps on page loads. It is a hint for the
// interface only (which header link to show, whether to ask the API for owner-only content); every API route and
// protected page checks the Clerk session itself. Kept free of Clerk imports so public pages can read it.

export const SIGNED_IN_HINT_COOKIE = "iu_signed_in";

/** Fired on window whenever this tab changes the hint, so mounted islands re-read it without polling. */
export const SIGNED_IN_HINT_EVENT = "iloveui:signed-in-hint";

const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export function readSignedInHint(): boolean {
  return document.cookie.split("; ").includes(`${SIGNED_IN_HINT_COOKIE}=1`);
}

// Between the sign-out click and Clerk reporting the session gone, Clerk re-renders the page while it still says
// signed in; this keeps that render from writing the hint back.
let signingOut = false;

export function setSigningOut(value: boolean) {
  signingOut = value;
}

export function writeSignedInHint(signedIn: boolean) {
  if (signedIn && signingOut) return;
  if (readSignedInHint() === signedIn) return;
  // Same attributes as the middleware, so both writers address the same cookie.
  document.cookie = signedIn
    ? `${SIGNED_IN_HINT_COOKIE}=1; Path=/; Max-Age=${MAX_AGE_SECONDS}; SameSite=Lax`
    : `${SIGNED_IN_HINT_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
  window.dispatchEvent(new Event(SIGNED_IN_HINT_EVENT));
}
