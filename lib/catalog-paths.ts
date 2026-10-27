import type { Route } from "next";
import type { CatalogDesign } from "./catalog-types";

// Path and size formatting with no runtime imports, for client components that must stay small (design cards ship
// with every browse page; the category list behind categoryName does not need to).

export function designPath(design: Pick<CatalogDesign, "category" | "slug">): Route {
  return `/designs/${design.category}/${design.slug}` as Route;
}

export function previewPath(slug: string): string {
  return `/preview/${slug}`;
}

export function formatGzip(bytes: number): string {
  return `${(bytes / 1000).toFixed(1)} kB gzip`;
}
