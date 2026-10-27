import type { CatalogDesign } from "@/lib/catalog-types";

type Relatable = Pick<CatalogDesign, "slug" | "category" | "styleFamily" | "createdAt">;

/** Up to `count` other designs: same category first, then the same style family, then the newest of the rest. */
export function relatedDesigns<T extends Relatable>(design: Relatable, all: readonly T[], count = 4): T[] {
  const newestFirst = all
    .filter((candidate) => candidate.slug !== design.slug)
    .toSorted((a, b) => b.createdAt.localeCompare(a.createdAt) || a.slug.localeCompare(b.slug));
  const rank = (candidate: T) =>
    candidate.category === design.category ? 0 : candidate.styleFamily === design.styleFamily ? 1 : 2;
  return newestFirst.toSorted((a, b) => rank(a) - rank(b)).slice(0, count);
}
