import type { CategorySlug } from "@/registry/definitions";

/** One specific sentence per category for its page heading and meta description. */
export const CATEGORY_INTROS: Record<CategorySlug, string> = {
  hero: "Opening sections with one message, one action and a visual that shows the product at work.",
  bento: "Feature grids where every cell proves its point with a working miniature of the interface.",
  navigation: "Headers, mega menus and command palettes you can drive end to end from the keyboard.",
  pricing: "Plan tables and checkout flows with one highlighted plan, stated savings, tax lines and payment errors.",
  testimonials: "Quotes and proof sections with named people, roles and companies, and no star ratings.",
  "cta-footers": "Closing sections with a single action, and footers with real link structure and a validated signup.",
  auth: "Sign-in, sign-up and onboarding flows with inline validation, social providers and step progress.",
  dashboards: "App shells and KPI cards with collapsible sidebars, deltas and sparklines drawn in SVG.",
  tables: "Tables and lists with sorting, bulk selection, sticky headers and a plan for narrow screens.",
  forms: "Inputs, selects and comboboxes with visible labels, helper text and every validation state.",
  "cards-buttons": "Cards and buttons in every interaction state, including loading buttons that hold their width.",
  overlays: "Dialogs, sheets and toasts that trap focus, close on Escape and return focus where it came from.",
  "ai-chat":
    "Chat and agent interfaces with streaming replies, expandable tool calls, a model picker and usage meters.",
  effects: "Text and background treatments built on transform, opacity and canvas, with a still fallback.",
  "micro-interactions":
    "Single components whose motion explains state: drag, press, hold and release with a keyboard path.",
  settings: "Account and settings screens with grouped sections, save states and a confirmed danger zone.",
  states: "Empty, error and loading screens with honest copy, one next step and illustrations drawn in SVG.",
  ecommerce: "Product cards, product pages, cart drawers and checkout summaries with stock, variants and discounts.",
  templates: "Complete pages assembled from catalog designs and held together in one style family.",
};
