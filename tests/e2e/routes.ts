// Every public site route. Each must have a unique title and description, pass axe in both themes and never
// overflow horizontally. Later phases add their routes here. /pricing, /sign-in, /sign-up and /account exist only
// with MONETIZATION_ENABLED on (access.spec.ts checks they are 404 by default).
export const SITE_ROUTES = [
  "/",
  "/designs",
  "/designs/hero",
  // A category with no designs yet: its designed empty state must pass the same checks.
  "/designs/settings",
  "/designs/forms/pillow-workspace-form",
  "/designs/ecommerce/atelier-product-page",
  "/collections",
  "/collections/saas-landing",
  "/collections/ai-app",
  "/collections/dashboard",
  "/docs",
  "/docs/installation",
  "/docs/cli",
  "/docs/theming",
  "/docs/ai-prompts",
  "/docs/license",
  "/changelog",
  "/license",
  "/privacy",
] as const;
