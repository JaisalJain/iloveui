import { describe, expect, it } from "vitest";
import {
  activeFilterCount,
  browsePath,
  changesResults,
  clearFilters,
  countByCategory,
  DEFAULT_FILTERS,
  extraPageNumbers,
  PAGE_SIZE,
  pageCount,
  pageSlice,
  parseFilters,
  parsePageParam,
  selectDesigns,
  serializeFilters,
  sortDesigns,
  type BrowseFilters,
} from "@/lib/browse";

const FAMILIES = ["swiss-minimal", "editorial", "luxury"];

type Row = {
  slug: string;
  name: string;
  category: "hero" | "pricing" | "forms";
  styleFamily: "swiss-minimal" | "editorial" | "luxury";
  tier: "free" | "pro";
  hasMotion: boolean;
  createdAt: string;
};

const rows: Row[] = [
  {
    slug: "a",
    name: "Alder",
    category: "hero",
    styleFamily: "swiss-minimal",
    tier: "free",
    hasMotion: false,
    createdAt: "2026-10-01",
  },
  {
    slug: "b",
    name: "Birch",
    category: "hero",
    styleFamily: "luxury",
    tier: "pro",
    hasMotion: true,
    createdAt: "2026-10-03",
  },
  {
    slug: "c",
    name: "Cedar",
    category: "pricing",
    styleFamily: "editorial",
    tier: "pro",
    hasMotion: true,
    createdAt: "2026-10-03",
  },
  {
    slug: "d",
    name: "Dogwood",
    category: "forms",
    styleFamily: "editorial",
    tier: "free",
    hasMotion: false,
    createdAt: "2026-10-02",
  },
];

const filters = (patch: Partial<BrowseFilters>): BrowseFilters => ({ ...DEFAULT_FILTERS, ...patch });

describe("filters in the URL", () => {
  it("parses every parameter and ignores unknown values", () => {
    expect(
      parseFilters("?tier=pro&family=luxury,editorial,nope&motion=1&format=html&sort=copied&q=chat", FAMILIES),
    ).toEqual({
      tier: "pro",
      families: ["editorial", "luxury"],
      motion: true,
      format: "html",
      sort: "copied",
      q: "chat",
    });
    expect(parseFilters("?tier=gold&motion=yes&format=vue&sort=random", FAMILIES)).toEqual(DEFAULT_FILTERS);
  });

  it("caps the query length and keeps a typed trailing space", () => {
    expect(parseFilters(`?q=${"x".repeat(200)}`).q).toHaveLength(80);
    expect(parseFilters("?q=luxury+").q).toBe("luxury ");
  });

  it("serializes in a stable order, omits defaults and round-trips", () => {
    expect(serializeFilters(DEFAULT_FILTERS)).toBe("");
    const value = filters({
      tier: "free",
      families: ["swiss-minimal", "luxury"],
      motion: true,
      sort: "copied",
      q: "bento grid",
    });
    const query = serializeFilters(value);
    expect(query).toBe("?tier=free&family=swiss-minimal,luxury&motion=1&sort=copied&q=bento+grid");
    expect(parseFilters(query, FAMILIES)).toEqual({ ...value, families: ["swiss-minimal", "luxury"] });
    expect(serializeFilters(filters({ q: "   " }))).toBe("");
  });

  it("counts only filters that narrow results", () => {
    expect(activeFilterCount(filters({ format: "html", sort: "copied" }))).toBe(0);
    expect(activeFilterCount(filters({ tier: "pro", families: ["luxury", "editorial"], motion: true, q: "x" }))).toBe(
      5,
    );
    expect(changesResults(filters({ format: "html" }))).toBe(false);
    expect(changesResults(filters({ sort: "copied" }))).toBe(true);
  });

  it("clears narrowing filters but keeps sort and format", () => {
    expect(clearFilters(filters({ tier: "pro", motion: true, sort: "copied", format: "html", q: "x" }))).toEqual(
      filters({ sort: "copied", format: "html" }),
    );
  });
});

describe("selection and sorting", () => {
  it("orders newest first, then by name", () => {
    expect(sortDesigns(rows, "newest").map((row) => row.slug)).toEqual(["b", "c", "d", "a"]);
  });

  it("orders by copies, falling back to newest", () => {
    expect(sortDesigns(rows, "copied", { a: 5, d: 5, c: 1 }).map((row) => row.slug)).toEqual(["d", "a", "c", "b"]);
  });

  it("applies tier, family, motion, category and search together", () => {
    const pick = (patch: Partial<BrowseFilters>, category: string | null = null, match?: (row: Row) => boolean) =>
      selectDesigns(rows, category, filters(patch), { matchesQuery: match }).map((row) => row.slug);
    expect(pick({ tier: "free" })).toEqual(["d", "a"]);
    expect(pick({ families: ["editorial"] })).toEqual(["c", "d"]);
    expect(pick({ motion: true }, "hero")).toEqual(["b"]);
    expect(pick({ q: "ced" }, null, (row) => row.name.toLowerCase().includes("ced"))).toEqual(["c"]);
    expect(pick({ tier: "pro", families: ["swiss-minimal"] })).toEqual([]);
  });

  it("counts per category with zero rows kept", () => {
    expect(countByCategory(rows, ["hero", "pricing", "forms", "settings"], filters({ tier: "pro" }))).toEqual({
      total: 2,
      byCategory: { hero: 1, pricing: 1, forms: 0, settings: 0 },
    });
  });
});

describe("pagination", () => {
  it("pages by 24 with at least one page", () => {
    expect(PAGE_SIZE).toBe(24);
    expect(pageCount(0)).toBe(1);
    expect(pageCount(24)).toBe(1);
    expect(pageCount(25)).toBe(2);
    const items = Array.from({ length: 50 }, (_, index) => index);
    expect(pageSlice(items, 2)).toEqual(items.slice(24, 48));
    expect(pageSlice(items, 3)).toEqual([48, 49]);
  });

  it("generates params for pages 2 and up only", () => {
    expect(extraPageNumbers(8)).toEqual([]);
    expect(extraPageNumbers(49)).toEqual(["2", "3"]);
  });

  it("accepts only canonical page numbers of 2 or more", () => {
    expect(parsePageParam("2")).toBe(2);
    expect(parsePageParam("15")).toBe(15);
    for (const bad of ["1", "0", "02", "-2", "2.5", "two", "", "999999"]) expect(parsePageParam(bad)).toBeNull();
  });

  it("builds real paginated URLs", () => {
    expect(browsePath(null)).toBe("/designs");
    expect(browsePath(null, 2)).toBe("/designs/page/2");
    expect(browsePath("hero")).toBe("/designs/hero");
    expect(browsePath("hero", 3)).toBe("/designs/hero/page/3");
  });
});
