"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect } from "react";
import { setSigningOut, writeSignedInHint } from "./signed-in-hint";

/**
 * Keeps the hint cookie in step with Clerk on the pages that load it. The middleware only updates the hint on full
 * page loads, but Clerk finishes sign-in and sign-up with a client-side navigation, so without this the header
 * would keep saying "Sign in" on /account until the next reload.
 */
export function SignedInHintSync() {
  const { isLoaded, isSignedIn } = useAuth();
  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) setSigningOut(false);
    writeSignedInHint(Boolean(isSignedIn));
  }, [isLoaded, isSignedIn]);
  return null;
}
