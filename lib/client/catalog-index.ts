import type { CatalogIndexEntry } from "@/lib/catalog-types";

// The public catalog index (public/catalog.json), fetched at most once per page load and shared by the palette and
// the browse filters. A failed fetch is retried on the next call.

let catalogPromise: Promise<CatalogIndexEntry[]> | null = null;

export function loadCatalogIndex(): Promise<CatalogIndexEntry[]> {
  catalogPromise ??= fetch("/catalog.json")
    .then((response) => {
      if (!response.ok) throw new Error(`catalog.json: ${response.status}`);
      return response.json() as Promise<CatalogIndexEntry[]>;
    })
    .catch((error: unknown) => {
      catalogPromise = null;
      throw error;
    });
  return catalogPromise;
}
