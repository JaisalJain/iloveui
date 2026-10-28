import { describe, expect, it, vi } from "vitest";
import { collectionDesigns, collectionMeta, collectionPath } from "@/components/collections/collection-data";
import { COLLECTIONS, getCollection } from "@/config/collections";
import { getDesign } from "@/lib/catalog";

describe("collections (spec section 8)", () => {
  it("are exactly the three curated sets", () => {
    expect(COLLECTIONS.map((collection) => collection.slug)).toEqual(["saas-landing", "ai-app", "dashboard"]);
  });

  it.each(COLLECTIONS.map((collection) => [collection.slug, collection] as const))(
    "%s has a title, a description and only designs that exist in the catalog",
    (_, collection) => {
      expect(collection.title.trim()).not.toBe("");
      expect(collection.description.length).toBeGreaterThan(40);
      expect(collection.designs.length).toBeGreaterThan(0);
      expect(new Set(collection.designs).size).toBe(collection.designs.length);
      for (const slug of collection.designs) expect(getDesign(slug), `unknown design "${slug}"`).toBeDefined();
      expect(collectionDesigns(collection).map((design) => design.slug)).toEqual(collection.designs);
    },
  );

  it("resolves slugs, paths and counts", () => {
    expect(getCollection("dashboard")?.title).toBe("Dashboard");
    expect(getCollection("missing")).toBeUndefined();
    expect(collectionPath("ai-app")).toBe("/collections/ai-app");
    const designs = collectionDesigns(COLLECTIONS[0]!);
    expect(collectionMeta(designs)).toBe(`${designs.length} designs`);
    vi.stubEnv("MONETIZATION_ENABLED", "true");
    const free = designs.filter((design) => design.tier === "free").length;
    expect(collectionMeta(designs)).toBe(`${designs.length} designs · ${free} free`);
    vi.unstubAllEnvs();
  });
});
