"use client";

import { useSyncExternalStore } from "react";
import { readSignedInHint, SIGNED_IN_HINT_EVENT } from "@/components/auth/signed-in-hint";
import { buttonClasses } from "@/components/ui/button-classes";

// Never imports Clerk: the header is on every page, and public pages must not load it. The cookie is only a hint;
// /account checks the session itself and sends signed-out visitors to /sign-in.

function subscribe(onChange: () => void) {
  window.addEventListener(SIGNED_IN_HINT_EVENT, onChange);
  window.addEventListener("focus", onChange);
  window.addEventListener("pageshow", onChange);
  return () => {
    window.removeEventListener(SIGNED_IN_HINT_EVENT, onChange);
    window.removeEventListener("focus", onChange);
    window.removeEventListener("pageshow", onChange);
  };
}

const signedOutOnServer = () => false;

export function AccountLink() {
  const signedIn = useSyncExternalStore(subscribe, readSignedInHint, signedOutOnServer);
  // Plain links, not next/link: a full page load lets the middleware refresh the Clerk session before /account
  // renders, and prefetching would pull the Clerk-only routes into public pages.
  return (
    <a
      href={signedIn ? "/account" : "/sign-in"}
      className={buttonClasses({ variant: "ghost", size: "sm", className: "min-w-20" })}
    >
      {signedIn ? "Account" : "Sign in"}
    </a>
  );
}
