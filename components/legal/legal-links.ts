import type { Route } from "next";

/** The date the legal pages last changed. Update it with any change to their substance. */
export const LEGAL_UPDATED = "2026-10-28";

export type RelatedLink = { href: Route; label: string; description: string };

export const RELATED: Record<"license" | "privacy" | "docs", RelatedLink> = {
  license: { href: "/license", label: "License", description: "MIT: use, change and share the designs." },
  privacy: { href: "/privacy", label: "Privacy", description: "No accounts, no analytics, no tracking cookies." },
  docs: { href: "/docs", label: "Docs", description: "Install, theme and ship the designs." },
};
