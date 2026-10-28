import type { MetadataRoute } from "next";
import { collectionDesigns, collectionPath } from "@/components/collections/collection-data";
import { COLLECTIONS } from "@/config/collections";
import { extraPageNumbers } from "@/lib/browse";
import { designPath, getAllDesigns, getDesignsInCategory } from "@/lib/catalog";
import type { CatalogDesign } from "@/lib/catalog-types";
import { getChangelogEntries } from "@/lib/changelog";
import { DOC_PAGES } from "@/lib/docs";
import { monetizationEnabled } from "@/lib/monetization";
import { absoluteUrl } from "@/lib/site";
import { CATEGORIES } from "@/registry/definitions";

// Every public, indexable route, generated at build time with absolute URLs from NEXT_PUBLIC_SITE_URL.
// Account, checkout, API, preview and registry routes are left out (robots.ts disallows them).

type Entry = MetadataRoute.Sitemap[number];

const LEGAL_PAGES = ["/license", "/privacy", "/contact"];

/** The newest createdAt among designs, so listing pages change their lastModified when the catalog grows. */
function newest(designs: readonly CatalogDesign[]): string | undefined {
  return designs.reduce<string | undefined>(
    (latest, design) => (latest === undefined || design.createdAt > latest ? design.createdAt : latest),
    undefined,
  );
}

function entry(path: string, options: Omit<Entry, "url"> = {}): Entry {
  return { url: absoluteUrl(path), ...options };
}

export default function sitemap(): MetadataRoute.Sitemap {
  const designs = getAllDesigns();
  const catalogUpdated = newest(designs);
  const changelog = getChangelogEntries();

  return [
    entry("/", { lastModified: catalogUpdated, changeFrequency: "weekly", priority: 1 }),
    entry("/designs", { lastModified: catalogUpdated, changeFrequency: "weekly", priority: 0.9 }),
    ...extraPageNumbers(designs.length).map((n) => entry(`/designs/page/${n}`, { changeFrequency: "weekly" })),
    ...CATEGORIES.flatMap((category) => {
      const inCategory = getDesignsInCategory(category.slug);
      return [
        entry(`/designs/${category.slug}`, {
          lastModified: newest(inCategory),
          changeFrequency: "weekly",
          priority: 0.7,
        }),
        ...extraPageNumbers(inCategory.length).map((n) =>
          entry(`/designs/${category.slug}/page/${n}`, { changeFrequency: "weekly" }),
        ),
      ];
    }),
    ...designs.map((design) =>
      entry(designPath(design), { lastModified: design.createdAt, changeFrequency: "monthly", priority: 0.8 }),
    ),
    entry("/collections", { lastModified: catalogUpdated, changeFrequency: "monthly", priority: 0.6 }),
    ...COLLECTIONS.map((collection) =>
      entry(collectionPath(collection.slug), {
        lastModified: newest(collectionDesigns(collection)),
        changeFrequency: "monthly",
        priority: 0.6,
      }),
    ),
    ...(monetizationEnabled() ? [entry("/pricing", { changeFrequency: "monthly", priority: 0.8 })] : []),
    ...DOC_PAGES.map((page) => entry(page.href, { changeFrequency: "monthly", priority: 0.6 })),
    entry("/changelog", { lastModified: changelog[0]?.date, changeFrequency: "weekly", priority: 0.5 }),
    ...LEGAL_PAGES.map((path) => entry(path, { changeFrequency: "yearly", priority: 0.3 })),
  ];
}
