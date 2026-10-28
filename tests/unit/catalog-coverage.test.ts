import { describe, expect, it } from "vitest";
import { CATEGORIES, STYLE_FAMILIES, type DesignMeta } from "@/registry/schema";
import { listDesignFolders, readDesignFile } from "@/scripts/lib/registry-files";

// Catalog-wide guarantees that grow with the phases (spec section 17).
const metas = listDesignFolders().map((folder) => JSON.parse(readDesignFile(folder, "meta.json")) as DesignMeta);

describe("catalog coverage", () => {
  // Phase 6 (catalog batch one) and every batch after it.
  it("marks every design free (the open-source catalog; MONETIZATION_ENABLED is off by default)", () => {
    expect(metas.filter((meta) => meta.tier !== "free").map((meta) => meta.slug)).toEqual([]);
  });

  it("has at least 60 designs and at least one in every category", () => {
    expect(metas.length).toBeGreaterThanOrEqual(60);
    const categories = new Set(metas.map((meta) => meta.category));
    expect(CATEGORIES.map((category) => category.slug).filter((slug) => !categories.has(slug))).toEqual([]);
  });

  it("has at least six micro-interactions, including slide to pay and the morphing submit button", () => {
    const micro = metas.filter((meta) => meta.category === "micro-interactions");
    expect(micro.length).toBeGreaterThanOrEqual(6);
    expect(micro.map((meta) => meta.slug)).toEqual(
      expect.arrayContaining(["fare-slide-to-pay", "invoice-morph-submit"]),
    );
  });

  it("keeps the style families balanced", () => {
    const sizes = STYLE_FAMILIES.map((family) => metas.filter((meta) => meta.styleFamily === family.slug).length);
    expect(Math.max(...sizes)).toBeLessThanOrEqual(Math.min(...sizes) * 2);
  });

  it("has at least one design in every style family", () => {
    const families = new Set(metas.map((meta) => meta.styleFamily));
    expect(STYLE_FAMILIES.map((family) => family.slug).filter((slug) => !families.has(slug))).toEqual([]);
  });

  it("can show one design per style family, each from a different category", () => {
    // Bipartite matching of style families to categories (augmenting paths).
    const options = new Map<string, string[]>(
      STYLE_FAMILIES.map((family) => [
        family.slug,
        [...new Set(metas.filter((meta) => meta.styleFamily === family.slug).map((meta) => meta.category))],
      ]),
    );
    const owner = new Map<string, string>();
    const assign = (family: string, seen: Set<string>): boolean => {
      for (const category of options.get(family) ?? []) {
        if (seen.has(category)) continue;
        seen.add(category);
        const current = owner.get(category);
        if (current === undefined || assign(current, seen)) {
          owner.set(category, family);
          return true;
        }
      }
      return false;
    };
    const unmatched = STYLE_FAMILIES.filter((family) => !assign(family.slug, new Set()));
    expect(unmatched.map((family) => family.slug)).toEqual([]);
  });
});
