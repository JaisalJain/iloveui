// MONETIZATION_ENABLED (default false): every design is free and the site has no accounts, pricing or checkout.
// Set it to "true" to turn the paid architecture back on (Clerk sign-in, Pro and Team licenses, the payment
// providers, CLI tokens and Pro-only registry items); the code stays in the repo as a working reference.
// next.config.ts inlines the value at build time, so server, client and middleware bundles agree; scripts read it
// from the environment or .env.local (scripts/lib/env-file.ts).

export function monetizationEnabled(): boolean {
  return process.env.MONETIZATION_ENABLED === "true";
}

/**
 * The tier a design is served with: free without monetization; with it, the meta.json tier, or Pro for a slug listed
 * in MONETIZATION_PRO_SLUGS (comma-separated). That list marks designs Pro for one registry build without editing
 * meta.json: the end-to-end suite uses it to exercise the paid flows, and it is the quickest way to try them.
 */
export function effectiveTier(tier: "free" | "pro", slug?: string): "free" | "pro" {
  if (!monetizationEnabled()) return "free";
  const listed = (process.env.MONETIZATION_PRO_SLUGS ?? "").split(",").map((entry) => entry.trim());
  return slug && listed.includes(slug) ? "pro" : tier;
}
