import "server-only";
import { getAllDesigns } from "@/lib/catalog";
import type { CatalogDesign } from "@/lib/catalog-types";
import { CATEGORIES } from "@/registry/definitions";

// Build-time data for the home page. Everything here derives from the generated catalog, so the page grows with it.

export const WALL_COLUMNS = 4;
/** Tiles per column before the loop repeats; four keep each column taller than the tallest wall. */
const TILES_PER_COLUMN = 4;

/** Interleaves designs by category (newest first inside each) so neighbouring tiles never share a category. */
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

/**
 * The hero wall's columns. Each column starts at a different offset in the interleaved catalog, so with a small
 * catalog every column shows the designs in a different order, and with 16 or more no design appears twice.
 */
export function wallColumns(): CatalogDesign[][] {
  const designs = interleavedDesigns();
  if (designs.length === 0) return [];
  const step = Math.max(1, Math.floor(designs.length / WALL_COLUMNS));
  const perColumn = Math.min(TILES_PER_COLUMN, designs.length);
  return Array.from({ length: WALL_COLUMNS }, (_, column) =>
    Array.from({ length: perColumn }, (_, index) => designs[(column * step + index) % designs.length]!),
  );
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

/** Up to eight free designs, newest first, one per category before any category repeats. */
export function freePicks(limit = 8): CatalogDesign[] {
  return interleaveByCategory(getAllDesigns().filter((design) => design.tier === "free")).slice(0, limit);
}
