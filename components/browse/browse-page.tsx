import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { toIndexEntry } from "@/lib/catalog-types";
import { getAllDesigns } from "@/lib/catalog";
import {
  browsePath,
  countByCategory,
  DEFAULT_FILTERS,
  extraPageNumbers,
  pageCount,
  pageSlice,
  parsePageParam,
  RESULT_PARAMS,
  selectDesigns,
} from "@/lib/browse";
import { CATEGORIES, getCategory, STYLE_FAMILIES } from "@/registry/definitions";
import { BrowseIsland } from "./browse-island";
import { CATEGORY_INTROS } from "./category-copy";

// Shared by the four statically generated browse routes: /designs, /designs/page/[n], /designs/[category] and
// /designs/[category]/page/[n].

function designsIn(category: string | null) {
  const all = getAllDesigns();
  return category === null ? all : all.filter((design) => design.category === category);
}

/** Static params helpers. */
export function categoryParams() {
  return CATEGORIES.map((category) => ({ category: category.slug }));
}

export function pageParams(category: string | null) {
  return extraPageNumbers(designsIn(category).length).map((n) => ({ n }));
}

export function categoryPageParams() {
  return CATEGORIES.flatMap((category) => pageParams(category.slug).map(({ n }) => ({ category: category.slug, n })));
}

/** Validates route params; anything outside the generated set is a 404. */
export function resolveRoute(categorySlug: string | null, pageParam: string | null) {
  const category = categorySlug === null ? null : getCategory(categorySlug);
  if (categorySlug !== null && !category) notFound();
  const page = pageParam === null ? 1 : parsePageParam(pageParam);
  if (page === null || page > pageCount(designsIn(categorySlug).length)) notFound();
  return { category: category ?? null, page };
}

export function browseMetadata(categorySlug: string | null, page: number): Metadata {
  const category = categorySlug ? getCategory(categorySlug) : undefined;
  const total = designsIn(categorySlug).length;
  const suffix = page > 1 ? `, page ${page}` : "";
  const title = `${category ? category.name : "Designs"}${suffix}`;
  const description = category
    ? `${CATEGORY_INTROS[category.slug]} ${total === 1 ? "1 design" : `${total} designs`} in React and HTML.`
    : `${total} hand-built designs in React and plain HTML across ${CATEGORIES.length} categories. Filter by style family, tier and motion, then copy, install or download.`;
  return {
    title,
    description: page > 1 ? `${description} Page ${page} of ${pageCount(total)}.` : description,
    alternates: { canonical: browsePath(categorySlug, page) },
    openGraph: { title, description, url: browsePath(categorySlug, page) },
  };
}

// Runs before the browse island hydrates: if the URL carries filters, the server's unfiltered grid is swapped for
// the skeleton (CSS hooks on [data-browse-pending]) instead of flashing. The island removes the attribute.
const PENDING_SCRIPT = `(function(){try{var p=new URLSearchParams(location.search);if(${JSON.stringify(
  RESULT_PARAMS,
)}.some(function(k){return p.has(k)}))document.documentElement.setAttribute("data-browse-pending","")}catch(e){}})()`;

export function BrowsePage({ categorySlug, page }: { categorySlug: string | null; page: number }) {
  const category = categorySlug ? getCategory(categorySlug) : undefined;
  const all = getAllDesigns().map(toIndexEntry);
  const scope = designsIn(categorySlug).map(toIndexEntry);
  const ordered = selectDesigns(scope, categorySlug, DEFAULT_FILTERS);
  const pageTotal = pageCount(ordered.length);
  const counts = countByCategory(
    all,
    CATEGORIES.map((c) => c.slug),
    DEFAULT_FILTERS,
  );
  const familyCounts: Record<string, number> = {};
  for (const design of scope) familyCounts[design.styleFamily] = (familyCounts[design.styleFamily] ?? 0) + 1;
  const free = scope.filter((design) => design.tier === "free").length;

  const stats = category
    ? [
        { label: "Designs", value: scope.length },
        { label: "Free", value: free },
        { label: "Pro", value: scope.length - free },
        { label: "Planned", value: category.target },
      ]
    : [
        { label: "Free", value: free },
        { label: "Pro", value: scope.length - free },
        { label: "Categories", value: CATEGORIES.length },
        { label: "Families", value: STYLE_FAMILIES.length },
      ];

  return (
    <div className="page-frame pt-10 pb-8 sm:pt-16">
      {/* Inside markup so the HTML parser runs it on first load, and React never re-creates it on client navigation
          (where the island reads the URL itself). */}
      <div hidden dangerouslySetInnerHTML={{ __html: `<script>${PENDING_SCRIPT}</script>` }} />
      <header className="grid gap-8 border-b border-hairline pb-10 sm:pb-12 xl:grid-cols-12 xl:items-end xl:gap-6">
        <div className="xl:col-span-8">
          <nav aria-label="Breadcrumb">
            <ol className="flex items-center gap-2 label-mono text-muted">
              {category ? (
                <>
                  <li>
                    <Link href="/designs" className="rounded-[4px] hover:text-fg">
                      Designs
                    </Link>
                  </li>
                  <li aria-hidden>/</li>
                  <li aria-current="page" className="text-fg">
                    {category.name}
                  </li>
                </>
              ) : (
                <li aria-current="page" className="text-fg">
                  Catalog
                </li>
              )}
              {page > 1 ? (
                <>
                  <li aria-hidden>/</li>
                  <li className="tabular-nums">
                    Page {page} of {pageTotal}
                  </li>
                </>
              ) : null}
            </ol>
          </nav>
          <h1 className="mt-4 text-40 font-semibold sm:text-64">
            {category ? (
              category.name
            ) : (
              <>
                Designs{" "}
                <span className="align-top font-mono text-20 font-normal tracking-normal text-muted tabular-nums sm:text-28">
                  {scope.length}
                </span>
              </>
            )}
          </h1>
          <p className="mt-4 max-w-2xl text-16 text-muted sm:text-20">
            {category
              ? CATEGORY_INTROS[category.slug]
              : "Every design ships as React and plain HTML, themed through CSS variables, with its size and audit on the label."}
          </p>
        </div>
        <dl className="grid grid-cols-2 gap-4 sm:max-w-2xl sm:grid-cols-4 xl:col-span-4">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col gap-1 border-l border-hairline pl-3">
              <dt className="label-mono text-muted">{stat.label}</dt>
              <dd className="font-mono text-20 text-fg tabular-nums">{stat.value}</dd>
            </div>
          ))}
        </dl>
      </header>

      <div className="mt-8 sm:mt-10">
        <BrowseIsland
          category={categorySlug}
          page={page}
          pageTotal={pageTotal}
          categories={CATEGORIES.map((c) => ({ slug: c.slug, name: c.name }))}
          families={STYLE_FAMILIES.map((f) => ({ slug: f.slug, name: f.name }))}
          initialDesigns={pageSlice(ordered, page).map(({ slug, name, category: c, tier, thumb, gzipBytes }) => ({
            slug,
            name,
            category: c,
            tier,
            thumb,
            gzipBytes,
          }))}
          initialTotal={counts.total}
          initialCategoryCounts={counts.byCategory}
          initialFamilyCounts={familyCounts}
          scopeTotal={scope.length}
          categoryTarget={category?.target ?? null}
          categoryLabel={category?.name ?? null}
        />
      </div>
    </div>
  );
}
