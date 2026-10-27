import { CATEGORIES, STYLE_FAMILIES, type CategorySlug, type StyleFamilySlug } from "@/registry/definitions";

// Catalog helpers that are safe in client bundles: no generated catalog data and no validation library.

export function categoryName(slug: CategorySlug): string {
  return CATEGORIES.find((category) => category.slug === slug)?.name ?? slug;
}

export function styleFamilyName(slug: StyleFamilySlug): string {
  return STYLE_FAMILIES.find((family) => family.slug === slug)?.name ?? slug;
}

export { designPath, formatGzip, previewPath } from "./catalog-paths";
