import { describe, expect, it } from "vitest";
import { CATEGORIES, STYLE_FAMILIES, type DesignMeta } from "@/registry/schema";
import { listDesignFolders, readDesignFile } from "@/scripts/lib/registry-files";

// Catalog-wide guarantees that grow with the phases (spec section 17).
const metas = listDesignFolders().map((folder) => JSON.parse(readDesignFile(folder, "meta.json")) as DesignMeta);

describe("catalog coverage", () => {
  it("keeps every category within its free allowance from section 9.1", () => {
    const over = CATEGORIES.filter(
      (category) =>
        metas.filter((meta) => meta.category === category.slug && meta.tier === "free").length > category.free,
    );
    expect(over.map((category) => category.slug)).toEqual([]);
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
