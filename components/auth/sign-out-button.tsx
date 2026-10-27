"use client";

import { useClerk } from "@clerk/nextjs";
import { LogOut } from "lucide-react";
import { useState } from "react";
import { buttonClasses } from "@/components/ui/button-classes";
import { setSigningOut, writeSignedInHint } from "./signed-in-hint";

/** Ends the Clerk session and clears the header hint first, so the page we land on already says "Sign in". */
export function SignOutButton() {
  const { signOut } = useClerk();
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  async function handleClick() {
    setPending(true);
    setFailed(false);
    // Cleared before the redirect: the landing page is public, so the middleware will not clear it there.
    setSigningOut(true);
    writeSignedInHint(false);
    try {
      await signOut({ redirectUrl: "/" });
    } catch {
      setSigningOut(false);
      writeSignedInHint(true);
      setPending(false);
      setFailed(true);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        aria-busy={pending}
        className={buttonClasses({ variant: "outline", size: "md", className: "min-w-32" })}
      >
        <LogOut size={16} strokeWidth={1.5} aria-hidden />
        {pending ? "Signing out" : "Sign out"}
      </button>
      <p role="status" className="text-14 text-danger empty:hidden">
        {failed ? "Could not sign out. Check your connection and try again." : ""}
      </p>
    </div>
  );
}
