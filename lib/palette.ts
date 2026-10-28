import type { Route } from "next";
import type { CatalogIndexEntry } from "@/lib/catalog-types";
import { monetizationEnabled } from "@/lib/monetization";
import { CATEGORIES, STYLE_FAMILIES } from "@/registry/definitions";

// Entries of the Cmd+K palette. Pages and actions are fixed; designs and categories come from /catalog.json, which
// the palette fetches the first time it opens.
export type PaletteGroup = "Recent" | "Designs" | "Categories" | "Pages" | "Actions";

export type PaletteEntry = {
  id: string;
  group: Exclude<PaletteGroup, "Recent">;
  label: string;
  hint?: string;
  keywords?: string[];
  /** Longer text that is searched with a low weight (design descriptions). */
  description?: string;
  href?: Route;
  action?: "toggle-theme" | "show-shortcuts";
};

export const PAGE_ENTRIES: PaletteEntry[] = [
  { id: "page:/", group: "Pages", label: "Home", hint: "/", href: "/", keywords: ["start", "landing"] },
  {
    id: "page:/designs",
    group: "Pages",
    label: "All designs",
    hint: "/designs",
    href: "/designs",
    keywords: ["browse", "catalog", "gallery", "components"],
  },
  ...(monetizationEnabled()
    ? [
        {
          id: "page:/pricing",
          group: "Pages",
          label: "Pricing",
          hint: "/pricing",
          href: "/pricing",
          keywords: ["pro", "team", "license", "buy", "lifetime", "price"],
        } satisfies PaletteEntry,
      ]
    : []),
];

export const ACTION_ENTRIES: PaletteEntry[] = [
  { id: "action:theme", group: "Actions", label: "Toggle light and dark theme", hint: "T", action: "toggle-theme" },
  {
    id: "action:shortcuts",
    group: "Actions",
    label: "Show keyboard shortcuts",
    hint: "?",
    action: "show-shortcuts",
    keywords: ["keys", "help", "hotkeys"],
  },
];

export const RECENT_STORAGE_KEY = "iloveui.recent";
export const MAX_RECENT = 5;

/** Designs and categories as palette entries; categories show how many designs they hold. */
export function catalogEntries(index: readonly CatalogIndexEntry[]): PaletteEntry[] {
  const categoryName = new Map<string, string>(CATEGORIES.map((category) => [category.slug, category.name]));
  const familyName = new Map<string, string>(STYLE_FAMILIES.map((family) => [family.slug, family.name]));
  const designs = index.map((design): PaletteEntry => ({
    id: `design:${design.slug}`,
    group: "Designs",
    label: design.name,
    hint: categoryName.get(design.category) ?? design.category,
    href: `/designs/${design.category}/${design.slug}` as Route,
    keywords: [design.tier, familyName.get(design.styleFamily) ?? design.styleFamily, ...design.tags],
    description: design.description,
  }));
  const categories = CATEGORIES.map((category): PaletteEntry => ({
    id: `category:${category.slug}`,
    group: "Categories",
    label: category.name,
    hint: String(index.filter((design) => design.category === category.slug).length),
    href: `/designs/${category.slug}` as Route,
    keywords: [category.slug],
  }));
  return [...designs, ...categories];
}
