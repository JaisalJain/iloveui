import { ClerkProvider } from "@clerk/nextjs";
import { ui } from "@clerk/ui";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { clerkAppearance, clerkLocalization } from "@/components/auth/clerk-appearance";
import { SignedInHintSync } from "@/components/auth/signed-in-hint-sync";
import { monetizationEnabled } from "@/lib/monetization";

// The only place Clerk's client loads (owner rule): /sign-in, /sign-up, /account and checkout. Public pages stay
// free of Clerk; the site header and footer come from app/(site)/layout.tsx around this provider. Without
// monetization there are no accounts, and every page under it is a 404.
export default function ClerkLayout({ children }: { children: ReactNode }) {
  if (!monetizationEnabled()) notFound();
  return (
    <ClerkProvider
      // The UI version is pinned and bundled instead of loaded from Clerk's CDN, so the skeleton's selectors on
      // Clerk's markup cannot break when Clerk ships a new UI.
      ui={ui}
      appearance={clerkAppearance}
      localization={clerkLocalization}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/account"
      signUpFallbackRedirectUrl="/account"
      afterSignOutUrl="/"
    >
      <SignedInHintSync />
      {children}
    </ClerkProvider>
  );
}
