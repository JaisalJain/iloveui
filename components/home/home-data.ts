import "server-only";
import { FREE_PICKS, HERO_WALL } from "@/config/home";
import { getAllDesigns, getDesign } from "@/lib/catalog";
import type { CatalogDesign } from "@/lib/catalog-types";
import { CATEGORIES } from "@/registry/definitions";

// Build-time data for the home page. Counts derive from the generated catalog, so the page grows with it; the wall and
// the free picks are curated in config/home.ts.

/** Interleaves designs by category (newest first inside each) so neighbouring designs never share a category. */
function interleaveByCategory(designs: readonly CatalogDesign[]): CatalogDesign[] {
  const byCategory = new Map<string, CatalogDesign[]>();
  const sorted = [...designs].sort((a, b) => b.createdAt.localeCompare(a.createdAt) || a.slug.localeCompare(b.slug));
  for (const design of sorted) {
    const list = byCategory.get(design.category) ?? [];
    list.push(design);
    byCategory.set(design.category, list);
  }
  const queues = [...byCategory.values()];
  const out: CatalogDesign[] = [];
  while (out.length < sorted.length) {
    for (const queue of queues) {
      const next = queue.shift();
      if (next) out.push(next);
    }
  }
  return out;
}

/** The hero wall's four curated columns, top to bottom. */
export function wallColumns(): CatalogDesign[][] {
  return HERO_WALL.map((column) => column.flatMap((slug) => getDesign(slug) ?? []));
}

export function interleavedDesigns(): CatalogDesign[] {
  return interleaveByCategory(getAllDesigns());
}

export function catalogStats() {
  const designs = getAllDesigns();
  const free = designs.filter((design) => design.tier === "free").length;
  return {
    total: designs.length,
    free,
    pro: designs.length - free,
    target: CATEGORIES.reduce((sum, category) => sum + category.target, 0),
  };
}

export function categoryIndex() {
  const designs = getAllDesigns();
  return CATEGORIES.map((category) => ({
    slug: category.slug,
    name: category.name,
    target: category.target,
    count: designs.filter((design) => design.category === category.slug).length,
  }));
}

/** The eight curated free designs, in display order. */
export function freePicks(): CatalogDesign[] {
  return FREE_PICKS.flatMap((slug) => getDesign(slug) ?? []);
}
