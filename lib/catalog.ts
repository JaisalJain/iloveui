import type { Route } from "next";
import data from "@/registry/generated/catalog.json";
import { CATEGORIES, STYLE_FAMILIES, type CategorySlug, type StyleFamilySlug } from "@/registry/schema";
import type { Catalog, CatalogDesign } from "./catalog-types";

// Typed access to the generated catalog (registry/generated/catalog.json, written by scripts/build-registry.ts).
const catalog = data as unknown as Catalog;

export function getAllDesigns(): CatalogDesign[] {
  return catalog.designs;
}

export function getDesign(slug: string): CatalogDesign | undefined {
  return catalog.designs.find((design) => design.slug === slug);
}

export function getDesignsInCategory(category: string): CatalogDesign[] {
  return catalog.designs.filter((design) => design.category === category);
}

export function categoryName(slug: CategorySlug): string {
  return CATEGORIES.find((category) => category.slug === slug)?.name ?? slug;
}

export function styleFamilyName(slug: StyleFamilySlug): string {
  return STYLE_FAMILIES.find((family) => family.slug === slug)?.name ?? slug;
}

export function designPath(design: Pick<CatalogDesign, "category" | "slug">): Route {
  return `/designs/${design.category}/${design.slug}` as Route;
}

export function previewPath(slug: string): string {
  return `/preview/${slug}`;
}

export function formatGzip(bytes: number): string {
  return `${(bytes / 1000).toFixed(1)} kB gzip`;
}
