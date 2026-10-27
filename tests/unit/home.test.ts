import { describe, expect, it } from "vitest";
import { freePicks, wallColumns } from "@/components/home/home-data";
import { FREE_PICKS, HERO_WALL } from "@/config/home";
import { getDesign } from "@/lib/catalog";
import { STYLE_FAMILIES } from "@/registry/definitions";

describe("home page picks (config/home.ts)", () => {
  it("the hero wall is four columns of four real designs, two from each style family", () => {
    expect(HERO_WALL).toHaveLength(4);
    for (const column of HERO_WALL) expect(column).toHaveLength(4);
    const slugs = HERO_WALL.flat();
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(getDesign(slug), `unknown design "${slug}"`).toBeDefined();
    const families = slugs.map((slug) => getDesign(slug)?.styleFamily);
    for (const family of STYLE_FAMILIES) expect(families.filter((slug) => slug === family.slug)).toHaveLength(2);
    expect(wallColumns().map((column) => column.map((design) => design.slug))).toEqual(HERO_WALL);
  });

  it("free picks are eight free designs from eight categories, none of them on the wall", () => {
    const designs = freePicks();
    expect(designs.map((design) => design.slug)).toEqual(FREE_PICKS);
    expect(designs).toHaveLength(8);
    for (const design of designs) expect(design.tier, design.slug).toBe("free");
    expect(new Set(designs.map((design) => design.category)).size).toBe(8);
    const wall = new Set(HERO_WALL.flat());
    for (const slug of FREE_PICKS) expect(wall.has(slug), slug).toBe(false);
  });
});
