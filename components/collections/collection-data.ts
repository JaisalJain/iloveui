import { COLLECTIONS, getCollection, type Collection } from "@/config/collections";
import { getDesign } from "@/lib/catalog";
import type { CatalogDesign } from "@/lib/catalog-types";
import type { Route } from "next";
import { monetizationEnabled } from "@/lib/monetization";
import type { OgContent } from "@/lib/og";

// Server-side helpers for the collection pages: resolve a set's slugs against the catalog, and describe each set
// for metadata and Open Graph images.

/** A set's designs in display order. Unknown slugs are skipped (the unit test keeps that list empty). */
export function collectionDesigns(collection: Collection): CatalogDesign[] {
  return collection.designs.flatMap((slug) => {
    const design = getDesign(slug);
    return design ? [design] : [];
  });
}

/** "4 designs · 2 free" */
export function collectionMeta(designs: readonly CatalogDesign[]): string {
  const free = designs.filter((design) => design.tier === "free").length;
  const count = `${designs.length} ${designs.length === 1 ? "design" : "designs"}`;
  return monetizationEnabled() ? `${count} · ${free} free` : count;
}

export const collectionPath = (slug: string): Route => `/collections/${slug}` as Route;

export const collectionParams = () => COLLECTIONS.map((collection) => ({ slug: collection.slug }));

export function collectionsOg(): OgContent {
  return {
    eyebrow: "Collections",
    title: "Designs that ship",
    emphasis: "together.",
    description: "Curated sets of designs for a SaaS landing page, an AI app and a dashboard.",
    meta: COLLECTIONS.map((collection) => collection.title).join(" · "),
  };
}

export function collectionOg(slug: string): OgContent {
  const collection = getCollection(slug);
  if (!collection) throw new Error(`Unknown collection "${slug}"`);
  return {
    eyebrow: "Collection",
    title: collection.title,
    description: collection.description,
    meta: collectionMeta(collectionDesigns(collection)),
  };
}
