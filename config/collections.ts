// Curated sets (spec section 8): designs that belong together in one kind of product, in display order.
// Every slug must exist in the catalog (tests/unit/collections.test.ts checks it). A design may sit in more than one
// set when it genuinely fits each; designs that fit none stay out.

export type CollectionSlug = "saas-landing" | "ai-app" | "dashboard";

export type Collection = {
  slug: CollectionSlug;
  title: string;
  description: string;
  designs: string[];
};

export const COLLECTIONS: Collection[] = [
  {
    slug: "saas-landing",
    title: "SaaS landing",
    description:
      "The sections a product launch page is made of: a hero that shows the product working, proof in customers' own words, and pricing a buyer can compare in one look.",
    designs: [
      "plumbline-mega-header",
      "gridline-hero",
      "waterfall-trace-hero",
      "typeset-hero",
      "meridian-bento",
      "kestrel-signal-bento",
      "casefile-testimonials",
      "margin-notes-testimonials",
      "hairline-pricing",
      "slab-pricing",
      "kettle-cta-footer",
      "shunt-landing-template",
    ],
  },
  {
    slug: "ai-app",
    title: "AI app",
    description:
      "Screens for products built around a model: agent consoles that stream answers and show their tool calls, and the onboarding that gets a team to its first result.",
    designs: [
      "wren-assistant-chat",
      "relay-agent-console",
      "quire-research-assistant",
      "stepwise-agent-run",
      "boxcar-command-palette",
      "hopscotch-onboarding",
      "pillow-workspace-form",
    ],
  },
  {
    slug: "dashboard",
    title: "Dashboard",
    description:
      "The inside of the product, where people spend their day: app shells, KPI cards with sparklines, and consoles that make a running system easy to read.",
    designs: [
      "loadstar-app-nav",
      "tally-ops-dashboard",
      "bigtop-analytics-shell",
      "quillby-creator-dashboard",
      "aldermoor-wealth-dashboard",
      "tessera-invoice-table",
      "gristmill-order-board",
      "tripwire-alert-rule-form",
      "swipe-triage-alerts",
      "quorum-workspace-settings",
      "index-account-settings",
    ],
  },
];

export function getCollection(slug: string): Collection | undefined {
  return COLLECTIONS.find((collection) => collection.slug === slug);
}
