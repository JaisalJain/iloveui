import type { Route } from "next";
import type { CatalogIndexEntry } from "./catalog-types";
import { monetizationEnabled } from "./monetization";

// Pure browse logic shared by the statically generated /designs pages and the client filter island: filters and
// their URL form, sorting, category counts and pagination. No imports with runtime weight, so the island stays small.

export const PAGE_SIZE = 24;

export const TIERS = ["all", "free", "pro"] as const;
export const SORTS = ["newest", "copied"] as const;
export const FORMATS = ["react", "html"] as const;

export type Tier = (typeof TIERS)[number];
export type Sort = (typeof SORTS)[number];
export type Format = (typeof FORMATS)[number];

export { FORMAT_STORAGE_KEY } from "./format-preference";

export type BrowseFilters = {
  tier: Tier;
  /** Style family slugs, in the order of the family list. */
  families: string[];
  motion: boolean;
  /** Preferred code format; every design ships both, so it never narrows results. */
  format: Format | null;
  sort: Sort;
  q: string;
};

export const DEFAULT_FILTERS: BrowseFilters = {
  tier: "all",
  families: [],
  motion: false,
  format: null,
  sort: "newest",
  q: "",
};

/** Query parameter names that change which designs show, or their order. Used by the pre-hydration script. */
export const RESULT_PARAMS = ["tier", "family", "motion", "sort", "q"] as const;

const MAX_QUERY_LENGTH = 80;

function oneOf<T extends string>(values: readonly T[], value: string | null | undefined): T | undefined {
  return values.find((candidate) => candidate === value);
}

/** Reads filters from a query string. Unknown or malformed values fall back to the defaults. */
export function parseFilters(params: URLSearchParams | string, knownFamilies: readonly string[] = []): BrowseFilters {
  const search = typeof params === "string" ? new URLSearchParams(params) : params;
  const requested = (search.get("family") ?? "")
    .split(",")
    .map((family) => family.trim())
    .filter(Boolean);
  const families =
    knownFamilies.length > 0 ? knownFamilies.filter((family) => requested.includes(family)) : [...new Set(requested)];
  return {
    // Without monetization every design is free, so a tier in the URL narrows nothing.
    tier: (monetizationEnabled() && oneOf(TIERS, search.get("tier"))) || "all",
    families,
    motion: search.get("motion") === "1",
    format: oneOf(FORMATS, search.get("format")) ?? null,
    sort: oneOf(SORTS, search.get("sort")) ?? "newest",
    // Kept as typed (trailing spaces included) so the search field can be driven by the URL.
    q: (search.get("q") ?? "").trimStart().slice(0, MAX_QUERY_LENGTH),
  };
}

/** The canonical query string for a set of filters ("" for the defaults), with a stable parameter order. */
export function serializeFilters(filters: BrowseFilters): string {
  const search = new URLSearchParams();
  if (filters.tier !== "all") search.set("tier", filters.tier);
  if (filters.families.length > 0) search.set("family", filters.families.join(","));
  if (filters.motion) search.set("motion", "1");
  if (filters.format) search.set("format", filters.format);
  if (filters.sort !== "newest") search.set("sort", filters.sort);
  if (filters.q.trim()) search.set("q", filters.q);
  // Commas in family lists stay readable.
  const query = search.toString().replaceAll("%2C", ",");
  return query ? `?${query}` : "";
}

/** Number of filters that narrow the results (shown on the mobile Filters button). */
export function activeFilterCount(filters: BrowseFilters): number {
  return (
    (filters.tier === "all" ? 0 : 1) + filters.families.length + (filters.motion ? 1 : 0) + (filters.q.trim() ? 1 : 0)
  );
}

/** True when the results differ from the server-rendered, unfiltered newest-first view. */
export function changesResults(filters: BrowseFilters): boolean {
  return activeFilterCount(filters) > 0 || filters.sort !== "newest";
}

/** Clears everything that narrows results; keeps the sort and the format preference. */
export function clearFilters(filters: BrowseFilters): BrowseFilters {
  return { ...DEFAULT_FILTERS, sort: filters.sort, format: filters.format };
}

/** Newest first (createdAt descending), then by name, so the order is total and stable. */
export function compareNewest(a: Pick<CatalogIndexEntry, "createdAt" | "name">, b: typeof a): number {
  if (a.createdAt !== b.createdAt) return a.createdAt < b.createdAt ? 1 : -1;
  return a.name.localeCompare(b.name, "en");
}

export function sortDesigns<T extends Pick<CatalogIndexEntry, "slug" | "createdAt" | "name">>(
  designs: readonly T[],
  sort: Sort,
  copies: Readonly<Record<string, number>> = {},
): T[] {
  return [...designs].sort((a, b) => {
    if (sort === "copied") {
      const difference = (copies[b.slug] ?? 0) - (copies[a.slug] ?? 0);
      if (difference !== 0) return difference;
    }
    return compareNewest(a, b);
  });
}

type Filterable = Pick<CatalogIndexEntry, "slug" | "category" | "styleFamily" | "tier" | "hasMotion">;

/**
 * Whether a design passes every filter except the category. `matchesQuery` decides the search (Fuse results or the
 * instant token fallback); it is only called when there is a query.
 */
export function passesFilters<T extends Filterable>(
  design: T,
  filters: BrowseFilters,
  matchesQuery: (design: T) => boolean = () => true,
): boolean {
  if (filters.tier !== "all" && design.tier !== filters.tier) return false;
  if (filters.families.length > 0 && !filters.families.includes(design.styleFamily)) return false;
  if (filters.motion && !design.hasMotion) return false;
  if (filters.q.trim() && !matchesQuery(design)) return false;
  return true;
}

/** Designs passing the filters, counted per category (every requested category appears, zero included). */
export function countByCategory<T extends Filterable>(
  designs: readonly T[],
  categories: readonly string[],
  filters: BrowseFilters,
  matchesQuery?: (design: T) => boolean,
): { total: number; byCategory: Record<string, number> } {
  const byCategory: Record<string, number> = Object.fromEntries(categories.map((category) => [category, 0]));
  let total = 0;
  for (const design of designs) {
    if (!passesFilters(design, filters, matchesQuery)) continue;
    total += 1;
    byCategory[design.category] = (byCategory[design.category] ?? 0) + 1;
  }
  return { total, byCategory };
}

/** Designs in a category (or all, for null) passing the filters, in the requested order. */
export function selectDesigns<T extends Filterable & Pick<CatalogIndexEntry, "createdAt" | "name">>(
  designs: readonly T[],
  category: string | null,
  filters: BrowseFilters,
  options: { matchesQuery?: (design: T) => boolean; copies?: Readonly<Record<string, number>> } = {},
): T[] {
  const matching = designs.filter(
    (design) =>
      (category === null || design.category === category) && passesFilters(design, filters, options.matchesQuery),
  );
  return sortDesigns(matching, filters.sort, options.copies);
}

export function pageCount(total: number): number {
  return Math.max(1, Math.ceil(total / PAGE_SIZE));
}

/** Items of a 1-based page. */
export function pageSlice<T>(items: readonly T[], page: number): T[] {
  return items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
}

/** Static params for /page/[n]: pages 2 to the last (page 1 is the base path). */
export function extraPageNumbers(total: number): string[] {
  return Array.from({ length: pageCount(total) - 1 }, (_, index) => String(index + 2));
}

/** Parses a /page/[n] segment: a canonical integer of at least 2, or null. */
export function parsePageParam(value: string): number | null {
  if (!/^[1-9]\d{0,4}$/.test(value)) return null;
  const page = Number(value);
  return page >= 2 ? page : null;
}

/** /designs, /designs/page/n, /designs/<category> or /designs/<category>/page/n. */
export function browsePath(category: string | null, page = 1): Route {
  const base = category ? `/designs/${category}` : "/designs";
  return (page > 1 ? `${base}/page/${page}` : base) as Route;
}
