// The home page's curated designs (spec sections 7.4 and 8), picked by eye from the whole catalog: the hero wall shows
// two designs from each style family, and Free picks shows eight free designs the wall does not, from eight categories.
// Every slug must exist in the catalog with the right tier (tests/unit/home.test.ts checks it).

/** Four columns, top to bottom. Neighbouring tiles differ in family and in visual weight. */
export const HERO_WALL: readonly (readonly string[])[] = [
  ["waterfall-trace-hero", "vaurel-pen-house", "priority-rank-list", "kestrel-signal-bento"],
  ["redaction-reveal-headline", "quire-research-assistant", "fare-slide-to-pay", "atelier-product-page"],
  ["tally-ops-dashboard", "kettle-cta-footer", "boxcar-command-palette", "meridian-bento"],
  ["saltmarsh-residency-form", "vaultline-two-factor", "invoice-morph-submit", "cushion-checkout"],
];

/** In display order; the first also supplies the receipt and install examples further down the page. */
export const FREE_PICKS: readonly string[] = [
  "typeset-hero",
  "bigtop-analytics-shell",
  "wren-assistant-chat",
  "verelle-cards",
  "tessera-invoice-table",
  "hopscotch-onboarding",
  "plumbline-mega-header",
  "cushion-dialog-toasts",
];
