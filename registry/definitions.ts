// Catalog definitions shared by the site, the build scripts and the validator. No dependencies, so client code can
// import them without pulling in zod; the meta.json schema lives in registry/schema.ts.

// Catalog structure (spec section 9). Category order, targets and free counts follow 9.1 exactly.
export const CATEGORIES = [
  {
    slug: "hero",
    name: "Hero sections",
    target: 25,
    free: 2,
    brief:
      "One message in under 10 words, one primary action, a visual that shows the product rather than decorating it, readable at 375px without the visual.",
  },
  {
    slug: "bento",
    name: "Bento grids and feature showcases",
    target: 25,
    free: 2,
    brief:
      "Varied cell sizes with a clear reading order, each cell proving one feature with a mini UI, never icon-plus-paragraph cells only.",
  },
  {
    slug: "navigation",
    name: "Navigation, mega menus and command palettes",
    target: 20,
    free: 2,
    brief:
      "Full keyboard support, visible current location, mobile menu designed rather than collapsed, palette with groups, recent items and shortcuts.",
  },
  {
    slug: "pricing",
    name: "Pricing and checkout",
    target: 20,
    free: 2,
    brief:
      "One highlighted plan, comparable rows, monthly/yearly toggle where relevant with the saving stated, clear tax and refund line, error and success states for checkout.",
  },
  {
    slug: "testimonials",
    name: "Testimonials and social proof",
    target: 15,
    free: 1,
    brief: "Invented but plausible people with role and company, monogram avatars, no star-rating clichés.",
  },
  {
    slug: "cta-footers",
    name: "Call to action and footers",
    target: 20,
    free: 1,
    brief: "One action, footers with real link structure, newsletter field with validation states.",
  },
  {
    slug: "auth",
    name: "Auth and onboarding",
    target: 20,
    free: 2,
    brief:
      "Email and social sign-in, inline validation, password visibility toggle, loading and error states, progress indication for multi-step flows.",
  },
  {
    slug: "dashboards",
    name: "Dashboard shells and KPI cards",
    target: 25,
    free: 2,
    brief:
      "Collapsible sidebar, breadcrumb, realistic metrics with deltas and sparklines drawn in SVG, empty and loading states.",
  },
  {
    slug: "tables",
    name: "Data tables and lists",
    target: 15,
    free: 1,
    brief:
      "Sorting, selection with bulk actions, pagination, sticky header, responsive strategy for mobile, empty and loading states.",
  },
  {
    slug: "forms",
    name: "Forms and inputs",
    target: 20,
    free: 2,
    brief: "Labels always visible, helper and error text, every input state, accessible custom selects and comboboxes.",
  },
  {
    slug: "cards-buttons",
    name: "Cards and buttons",
    target: 20,
    free: 2,
    brief: "All interaction states, loading buttons that keep their width, icon buttons with accessible names.",
  },
  {
    slug: "overlays",
    name: "Modals, sheets and toasts",
    target: 15,
    free: 1,
    brief:
      "Focus trap, escape to close, return focus, stacked toasts with pause on hover, mobile bottom-sheet variants.",
  },
  {
    slug: "ai-chat",
    name: "AI chat and agent interfaces",
    target: 25,
    free: 1,
    brief:
      "Streaming text simulation, tool-call blocks that expand, message actions (copy, retry), composer with attachments and model selector, token or usage meter, stop-generating state.",
  },
  {
    slug: "effects",
    name: "Text and background effects",
    target: 20,
    free: 1,
    brief:
      "Purposeful, performant (transform and opacity only, or canvas with requestAnimationFrame paused offscreen), full fallback under reduced motion; none of the forbidden patterns in 7.1.",
  },
  {
    slug: "micro-interactions",
    name: "Micro-interactions and motion components",
    target: 35,
    free: 2,
    brief:
      "One self-contained interactive component whose motion communicates state, built with motion/react on transform and opacity at 60fps: mouse, touch and an equivalent keyboard path for every gesture; springs with velocity-aware release, snap-back and interruption; idle, active, loading, success, error and disabled states; an aria-live announcement; instant changes or short fades under reduced motion; optional vibration on success; onComplete and onChange callbacks with typed labels, thresholds and durations; no interaction repeated within the category and none of the forbidden patterns in 7.1.",
  },
  {
    slug: "settings",
    name: "Settings and account",
    target: 10,
    free: 0,
    brief: "Grouped sections, save states, danger zone with confirmation.",
  },
  {
    slug: "states",
    name: "Empty, error and loading states",
    target: 10,
    free: 0,
    brief: "One clear next action, honest copy, illustrations drawn in SVG.",
  },
  {
    slug: "ecommerce",
    name: "E-commerce",
    target: 15,
    free: 0,
    brief: "Product card, product page, cart drawer, checkout summary, with stock, variant and discount states.",
  },
  {
    slug: "templates",
    name: "Full-page templates",
    target: 10,
    free: 0,
    brief:
      "Complete pages assembled from catalog designs plus new connective sections, consistent in one style family.",
  },
] as const;

export const STYLE_FAMILIES = [
  { slug: "swiss-minimal", name: "Swiss minimal" },
  { slug: "editorial", name: "Editorial" },
  { slug: "neo-brutalist", name: "Neo-brutalist" },
  { slug: "soft-tactile", name: "Soft tactile" },
  { slug: "dark-technical", name: "Dark technical" },
  { slug: "playful", name: "Playful" },
  { slug: "luxury", name: "Luxury" },
  { slug: "data-dense", name: "Data-dense" },
] as const;

export const STATES = [
  "default",
  "hover",
  "focus",
  "active",
  "disabled",
  "loading",
  "empty",
  "error",
  "success",
] as const;

export const RUNTIME_DEPENDENCIES = ["motion", "lucide-react"] as const;

/** Registry item that every design depends on: the --iu-* tokens. */
export const TOKENS_ITEM = "@iloveui/tokens";

/** Names already used by the registry, the routes or the CLI, so no design may take them. */
export const RESERVED_SLUGS = ["registry", "tokens", "index", "page", "theme"] as const;

export type CategorySlug = (typeof CATEGORIES)[number]["slug"];
export type StyleFamilySlug = (typeof STYLE_FAMILIES)[number]["slug"];
export type DesignState = (typeof STATES)[number];

export function getCategory(slug: string) {
  return CATEGORIES.find((category) => category.slug === slug);
}

export function getStyleFamily(slug: string) {
  return STYLE_FAMILIES.find((family) => family.slug === slug);
}
