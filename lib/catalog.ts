import data from "@/registry/generated/catalog.json";
import type { Catalog, CatalogDesign } from "./catalog-types";

// Typed access to the generated catalog (registry/generated/catalog.json, written by scripts/build-registry.ts).
// Server code only: importing this module bundles the whole catalog. Client code uses lib/catalog-shared.ts.
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

export { categoryName, designPath, formatGzip, previewPath, styleFamilyName } from "./catalog-shared";
