"use client";

import Link from "next/link";
import { clsx } from "clsx";
import { SlidersHorizontal, Search, X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useEffectEvent,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { DesignCard, type DesignCardData } from "@/components/designs/design-card";
import { buttonClasses } from "@/components/ui/button-classes";
import { Segment, Segments } from "@/components/ui/segments";
import { Kbd } from "@/components/ui/kbd";
import {
  activeFilterCount,
  browsePath,
  changesResults,
  clearFilters,
  countByCategory,
  FORMAT_STORAGE_KEY,
  PAGE_SIZE,
  parseFilters,
  passesFilters,
  selectDesigns,
  serializeFilters,
  SORTS,
  type BrowseFilters,
  type Format,
  type Sort,
} from "@/lib/browse";
import type { CatalogIndexEntry } from "@/lib/catalog-types";
import { loadCatalogIndex } from "@/lib/client/catalog-index";
import { createSearcher, loadFuse, matchesAllTokens, toFuseExpression } from "@/lib/search";
import { lazyModule } from "@/lib/client/lazy";
import { EmptyIllustration, GRID_CLASSES, SkeletonGrid } from "./browse-states";
import { CategoryNav, type Option } from "./filter-panel";
import { FilterToolbar } from "./filter-toolbar";

export type BrowseExplorerProps = {
  category: string | null;
  /** 1-based page of the unfiltered view this route renders. */
  page: number;
  pageTotal: number;
  categories: Option[];
  families: Option[];
  /** The page's designs in the unfiltered newest-first order, rendered on the server. */
  initialDesigns: DesignCardData[];
  /** Unfiltered counts, so the static HTML is complete. */
  initialTotal: number;
  initialCategoryCounts: Record<string, number>;
  initialFamilyCounts: Record<string, number>;
  /** Designs in this route's scope with no filters (0 means the category is still empty). */
  scopeTotal: number;
  /** Planned size of the category, for its empty state. */
  categoryTarget: number | null;
  categoryLabel: string | null;
  /** Called once the explorer has hydrated (see BrowseIsland). */
  onHydrated?: () => void;
};

// The mobile filter sheet (Radix Dialog) loads on intent, not with the page.
const filterSheet = lazyModule(() => import("./filter-sheet"));

const SORT_LABELS: Record<Sort, string> = { newest: "Newest", copied: "Most copied" };

function readStoredFormat(): Format | null {
  try {
    const stored = window.localStorage.getItem(FORMAT_STORAGE_KEY);
    return stored === "react" || stored === "html" ? stored : null;
  } catch {
    return null;
  }
}

function storeFormat(format: Format) {
  try {
    window.localStorage.setItem(FORMAT_STORAGE_KEY, format);
  } catch {
    // Storage can be unavailable (private windows); the URL still carries the preference.
  }
}

// The URL query is the single source of truth for filters. replaceState does not fire an event, so writes go
// through setSearch, which notifies subscribers; popstate covers back and forward.
const URL_EVENT = "iloveui:browse-url";

function subscribeUrl(onChange: () => void) {
  window.addEventListener(URL_EVENT, onChange);
  window.addEventListener("popstate", onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(URL_EVENT, onChange);
    window.removeEventListener("popstate", onChange);
    window.removeEventListener("storage", onChange);
  };
}

function setUrl(href: string) {
  window.history.replaceState(window.history.state, "", href);
  window.dispatchEvent(new Event(URL_EVENT));
}

const getSearch = () => window.location.search;
const getServerSearch = () => "";
const getServerFormat = () => null;

type SearchItem = CatalogIndexEntry & { categoryName: string; familyName: string };

const SEARCH_KEYS = [
  { name: "name", weight: 3 },
  { name: "tags", weight: 2 },
  { name: "categoryName", weight: 1.5 },
  { name: "familyName", weight: 1.5 },
  { name: "description", weight: 1 },
] as const satisfies readonly { name: keyof SearchItem; weight: number }[];

let copiesPromise: Promise<Record<string, number>> | null = null;

function loadCopies(): Promise<Record<string, number>> {
  copiesPromise ??= fetch("/api/metrics", { cache: "no-store" })
    .then((response) => {
      if (!response.ok) throw new Error(`metrics: ${response.status}`);
      return response.json() as Promise<{ copies: Record<string, number> }>;
    })
    .then((body) => body.copies)
    .catch((error: unknown) => {
      copiesPromise = null;
      throw error;
    });
  return copiesPromise;
}

export function BrowseExplorer(props: BrowseExplorerProps) {
  const { category, page, pageTotal, categories, families } = props;
  const familySlugs = useMemo(() => families.map((family) => family.slug), [families]);

  const search = useSyncExternalStore(subscribeUrl, getSearch, getServerSearch);
  const storedFormat = useSyncExternalStore(subscribeUrl, readStoredFormat, getServerFormat);
  const filters = useMemo(() => parseFilters(search, familySlugs), [search, familySlugs]);
  const [index, setIndex] = useState<CatalogIndexEntry[] | null>(null);
  const [indexFailed, setIndexFailed] = useState(false);
  const [copies, setCopies] = useState<Record<string, number> | null>(null);
  const [copiesFailed, setCopiesFailed] = useState(false);
  const [fuseMatches, setFuseMatches] = useState<{ q: string; slugs: Set<string> } | null>(null);
  const [extraPages, setExtraPages] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const sheetTriggerRef = useRef<HTMLButtonElement>(null);
  const Sheet = filterSheet.use();
  const gridRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const focusFromRef = useRef<number | null>(null);

  // Hydration renders with the server's empty query, then again with the real one. The pre-hydration script hid
  // the server grid when the URL has filters; once this component renders the real query it shows its own
  // skeleton or results, so the hook is released before that render paints.
  useLayoutEffect(() => {
    if (search === window.location.search) document.documentElement.removeAttribute("data-browse-pending");
  }, [search]);

  const resultsChange = changesResults(filters);
  const needsIndex = resultsChange || extraPages > 0;

  useEffect(() => {
    if (!needsIndex || index) return;
    let cancelled = false;
    loadCatalogIndex()
      .then((entries) => {
        if (!cancelled) setIndex(entries);
      })
      .catch(() => {
        if (!cancelled) setIndexFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [needsIndex, index]);

  useEffect(() => {
    if (filters.sort !== "copied" || copies) return;
    let cancelled = false;
    loadCopies()
      .then((counts) => {
        if (!cancelled) setCopies(counts);
      })
      .catch(() => {
        if (!cancelled) setCopiesFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [filters.sort, copies]);

  const categoryNames = useMemo(() => new Map(categories.map((c) => [c.slug, c.name])), [categories]);
  const familyNames = useMemo(() => new Map(families.map((f) => [f.slug, f.name])), [families]);
  const fieldsOf = useCallback(
    (design: CatalogIndexEntry) => [
      design.name,
      design.description,
      design.tags.join(" "),
      categoryNames.get(design.category),
      familyNames.get(design.styleFamily),
    ],
    [categoryNames, familyNames],
  );

  // Fuse refines the instant substring match once it has loaded.
  const q = filters.q.trim();
  useEffect(() => {
    if (!q || !index) return;
    let cancelled = false;
    loadFuse()
      .then((Fuse) => {
        if (cancelled) return;
        const items: SearchItem[] = index.map((design) => ({
          ...design,
          categoryName: categoryNames.get(design.category) ?? design.category,
          familyName: familyNames.get(design.styleFamily) ?? design.styleFamily,
        }));
        const searcher = createSearcher(Fuse, items, [...SEARCH_KEYS]);
        const expression = toFuseExpression(
          q,
          SEARCH_KEYS.map((key) => key.name),
        );
        const slugs = new Set(searcher.search(expression).map((result) => result.item.slug));
        setFuseMatches({ q, slugs });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [q, index, categoryNames, familyNames]);

  const matchesQuery = useCallback(
    (design: CatalogIndexEntry) =>
      fuseMatches?.q === q
        ? fuseMatches.slugs.has(design.slug) || matchesAllTokens(fieldsOf(design), q)
        : matchesAllTokens(fieldsOf(design), q),
    [fuseMatches, q, fieldsOf],
  );

  const sortReady = filters.sort !== "copied" || copies !== null || copiesFailed;
  const ready = !needsIndex || (index !== null && sortReady);
  const failed = needsIndex && indexFailed;

  const view = useMemo(() => {
    if (!index || !needsIndex) return null;
    const results = selectDesigns(index, category, filters, { matchesQuery, copies: copies ?? {} });
    const counts = countByCategory(
      index,
      categories.map((c) => c.slug),
      filters,
      matchesQuery,
    );
    const familyCounts: Record<string, number> = {};
    const withoutFamilies = { ...filters, families: [] };
    for (const design of index) {
      if (category !== null && design.category !== category) continue;
      if (!passesFilters(design, withoutFamilies, matchesQuery)) continue;
      familyCounts[design.styleFamily] = (familyCounts[design.styleFamily] ?? 0) + 1;
    }
    return { results, counts, familyCounts };
  }, [index, needsIndex, category, filters, matchesQuery, copies, categories]);

  // Unfiltered views continue from this route's page; filtered views always start at the first result.
  const offset = resultsChange ? 0 : (page - 1) * PAGE_SIZE;
  const visibleCount = PAGE_SIZE * (1 + extraPages);
  const designs: DesignCardData[] = view ? view.results.slice(offset, offset + visibleCount) : props.initialDesigns;
  const resultTotal = view ? view.results.length : resultsChange ? 0 : props.scopeTotal;
  const hasMore = view ? view.results.length > offset + visibleCount : page < pageTotal;
  const nextPage = page + 1 + extraPages;

  const totalCount = view ? view.counts.total : props.initialTotal;
  const categoryCounts = view ? view.counts.byCategory : props.initialCategoryCounts;
  const familyCounts = view ? view.familyCounts : props.initialFamilyCounts;

  const format: Format = filters.format ?? storedFormat ?? "react";
  const activeCount = activeFilterCount(filters);

  function update(patch: Partial<BrowseFilters>) {
    const next = { ...filters, ...patch };
    if (patch.format) storeFormat(patch.format);
    // Filtering restarts at the first result, so the URL drops any /page/n.
    const resultsChanged = Object.keys(patch).some((key) => key !== "format");
    if (resultsChanged) setExtraPages(0);
    const path = resultsChanged || changesResults(next) ? browsePath(category) : window.location.pathname;
    setUrl(`${path}${serializeFilters(next)}`);
  }

  // The explorer hydrates on intent, so text typed into the server-rendered search field just before has not reached
  // the URL yet: take it from the field. Then tell the island it can replay a click that arrived in that moment.
  const onFirstCommit = useEffectEvent(() => {
    const typed = searchRef.current?.value ?? "";
    if (typed !== filters.q) update({ q: typed });
    props.onHydrated?.();
  });
  useEffect(() => onFirstCommit(), []);

  // A format in the URL is a preference too.
  useEffect(() => {
    if (filters.format) storeFormat(filters.format);
  }, [filters.format]);

  // After "Load more", move focus to the first new card so keyboard users continue where the list grew.
  useEffect(() => {
    const from = focusFromRef.current;
    if (from === null) return;
    const link = gridRef.current?.querySelectorAll<HTMLAnchorElement>(":scope > a")[from];
    if (link) {
      focusFromRef.current = null;
      link.focus({ preventScroll: false });
    }
  }, [designs.length]);

  function loadMore() {
    focusFromRef.current = designs.length;
    if (index) {
      setExtraPages((count) => count + 1);
      return;
    }
    setLoadingMore(true);
    loadCatalogIndex()
      .then((entries) => {
        setIndex(entries);
        setExtraPages((count) => count + 1);
      })
      .catch(() => {
        // Fall back to the real paginated URL.
        window.location.assign(browsePath(category, nextPage));
      })
      .finally(() => setLoadingMore(false));
  }

  const query = serializeFilters({ ...filters, format: null });

  const showSkeleton = !ready && !failed;
  const resultLabel = `${resultTotal} ${resultTotal === 1 ? "design" : "designs"}`;

  return (
    <div className="lg:grid lg:grid-cols-12 lg:gap-6">
      <aside
        aria-label="Categories"
        className="hidden lg:sticky lg:top-24 lg:col-span-3 lg:block lg:max-h-[calc(100dvh-7rem)] lg:[scrollbar-gutter:stable] lg:overflow-y-auto lg:pr-4 lg:pb-24 xl:col-span-3"
      >
        <CategoryNav
          category={category}
          categories={categories}
          totalCount={totalCount}
          categoryCounts={categoryCounts}
          query={query}
          variant="sidebar"
        />
      </aside>

      <div className="min-w-0 lg:col-span-9">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <label htmlFor="browse-search" className="sr-only">
              Search designs
            </label>
            <Search
              size={16}
              strokeWidth={1.5}
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted"
            />
            <input
              ref={searchRef}
              id="browse-search"
              type="search"
              data-page-search=""
              value={filters.q}
              onChange={(event) => update({ q: event.target.value })}
              onKeyDown={(event) => {
                if (event.key === "Escape" && filters.q) {
                  event.preventDefault();
                  update({ q: "" });
                }
              }}
              placeholder={
                category ? `Search ${props.categoryLabel ?? "this category"}` : "Search by name, tag or style"
              }
              autoComplete="off"
              spellCheck={false}
              maxLength={80}
              className={clsx(
                "h-10 w-full rounded-control border border-control bg-surface pr-10 pl-9 text-14 text-fg shadow-sm",
                "placeholder:text-muted [&::-webkit-search-cancel-button]:hidden",
              )}
            />
            {filters.q ? (
              <button
                type="button"
                onClick={() => update({ q: "" })}
                aria-label="Clear search"
                className="absolute top-1/2 right-1 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-control text-muted hover:bg-raised hover:text-fg"
              >
                <X size={16} strokeWidth={1.5} aria-hidden />
              </button>
            ) : (
              <Kbd className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 pointer-coarse:hidden">
                /
              </Kbd>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              ref={sheetTriggerRef}
              type="button"
              aria-haspopup="dialog"
              aria-expanded={sheetOpen}
              onPointerEnter={filterSheet.preload}
              onFocus={filterSheet.preload}
              onClick={() => {
                filterSheet.preload();
                setSheetOpen(true);
              }}
              className={buttonClasses({ variant: "outline", className: "lg:hidden" })}
            >
              <SlidersHorizontal size={16} strokeWidth={1.5} aria-hidden />
              Filters
              {activeCount > 0 ? (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full border border-accent px-1.5 font-mono text-12 text-accent tabular-nums">
                  {activeCount}
                  <span className="sr-only"> active</span>
                </span>
              ) : null}
            </button>
            {Sheet ? (
              <Sheet.FilterSheet
                open={sheetOpen}
                onOpenChange={setSheetOpen}
                triggerRef={sheetTriggerRef}
                onClear={() => update(clearFilters(filters))}
                canClear={activeCount > 0}
                showLabel={showSkeleton ? "Show designs" : `Show ${resultLabel}`}
                category={category}
                categories={categories}
                families={families}
                filters={filters}
                onChange={update}
                format={format}
                totalCount={totalCount}
                categoryCounts={categoryCounts}
                familyCounts={familyCounts}
                query={query}
              />
            ) : null}

            <Segments
              aria-label="Sort"
              value={filters.sort}
              onValueChange={(next) => {
                const sort = SORTS.find((candidate) => candidate === next);
                if (sort) update({ sort });
              }}
              className="ml-auto flex rounded-control border border-hairline bg-raised p-0.5 sm:ml-0"
            >
              {SORTS.map((sort) => (
                <Segment
                  key={sort}
                  value={sort}
                  className={clsx(
                    "inline-flex h-8 items-center rounded-[4px] px-3 text-14 whitespace-nowrap text-muted pointer-coarse:h-9",
                    "transition-[background-color,color,box-shadow] duration-160 ease-site hover:text-fg",
                    "data-[state=on]:bg-surface data-[state=on]:text-fg data-[state=on]:shadow-sm",
                  )}
                >
                  {SORT_LABELS[sort]}
                </Segment>
              ))}
            </Segments>
          </div>
        </div>

        <div className="mt-3 hidden lg:block">
          <FilterToolbar
            families={families}
            filters={filters}
            onChange={update}
            format={format}
            familyCounts={familyCounts}
          />
        </div>

        <div className="mt-6 flex min-h-8 flex-wrap items-center gap-x-4 gap-y-2">
          <p
            aria-live="polite"
            className="font-mono text-12 text-muted tabular-nums [[data-browse-pending]_&]:invisible"
          >
            {showSkeleton ? "Filtering…" : failed ? "Filters unavailable" : resultLabel}
            {!showSkeleton && filters.sort === "copied" && copiesFailed
              ? ", newest first (copy counts unavailable)"
              : null}
          </p>
          {activeCount > 0 ? (
            <ul aria-label="Active filters" className="flex flex-wrap items-center gap-2">
              {activeChips(filters, familyNames).map((chip) => (
                <li key={chip.key}>
                  <button
                    type="button"
                    onClick={() => update(chip.remove(filters))}
                    aria-label={`Remove filter: ${chip.label}`}
                    className="inline-flex h-7 items-center gap-1.5 rounded-full border border-hairline bg-surface pr-1.5 pl-2.5 text-12 text-fg hover:border-control pointer-coarse:h-10"
                  >
                    {chip.label}
                    <X size={12} strokeWidth={1.5} aria-hidden className="text-muted" />
                  </button>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  onClick={() => update(clearFilters(filters))}
                  className="inline-flex h-7 items-center rounded-control px-2 text-12 text-muted underline-offset-4 hover:text-fg hover:underline pointer-coarse:h-10"
                >
                  Clear all
                </button>
              </li>
            </ul>
          ) : null}
        </div>

        <div className="mt-4">
          <h2 className="sr-only">Results</h2>
          <SkeletonGrid pendingOnly />
          {showSkeleton ? (
            <SkeletonGrid />
          ) : failed ? (
            <EmptyState
              variant="filters"
              title="Filters could not load."
              body="The catalog index did not arrive. Reload to try again, or browse the unfiltered list."
              action={
                <Link href={browsePath(category)} className={buttonClasses({ variant: "outline" })}>
                  Show all designs
                </Link>
              }
            />
          ) : designs.length === 0 ? (
            props.scopeTotal === 0 ? (
              <EmptyState
                variant="category"
                title={`Nothing in ${props.categoryLabel ?? "this category"} yet.`}
                body={
                  props.categoryTarget
                    ? `This category is planned at ${props.categoryTarget} designs and the first ones are in progress. Everything that has shipped is one click away.`
                    : "The first designs are in progress."
                }
                action={
                  <Link href={browsePath(null)} className={buttonClasses({ variant: "outline" })}>
                    Browse all designs
                  </Link>
                }
              />
            ) : (
              <EmptyState
                variant="filters"
                title="Nothing matches these filters."
                body={
                  q
                    ? `No design here matches “${q}” with the filters you picked.`
                    : "No design in this view has every filter you picked."
                }
                action={
                  <button
                    type="button"
                    onClick={() => update(clearFilters(filters))}
                    className={buttonClasses({ variant: "outline" })}
                  >
                    Clear filters
                  </button>
                }
              />
            )
          ) : (
            <div ref={gridRef} className={`${GRID_CLASSES} [[data-browse-pending]_&]:hidden`}>
              {designs.map((design) => (
                <DesignCard
                  key={design.slug}
                  design={design}
                  categoryLabel={categoryNames.get(design.category) ?? design.category}
                />
              ))}
            </div>
          )}
        </div>

        {!showSkeleton && !failed && hasMore ? (
          <div className="mt-12 flex flex-col items-start gap-3 [[data-browse-pending]_&]:hidden">
            {resultsChange ? (
              <button type="button" onClick={loadMore} className={buttonClasses({ variant: "outline", size: "lg" })}>
                Load more
              </button>
            ) : (
              <Link
                href={browsePath(category, nextPage)}
                onClick={(event) => {
                  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
                  event.preventDefault();
                  loadMore();
                }}
                aria-busy={loadingMore || undefined}
                className={buttonClasses({ variant: "outline", size: "lg" })}
              >
                {loadingMore ? "Loading…" : "Load more"}
              </Link>
            )}
            <p className="font-mono text-12 text-muted tabular-nums">
              Showing {offset + 1} to {offset + designs.length} of {resultTotal}
            </p>
          </div>
        ) : null}

        {!resultsChange && page > 1 && extraPages === 0 ? (
          <nav aria-label="Pagination" className="mt-6">
            <Link
              href={browsePath(category, page - 1)}
              className="font-mono text-12 text-muted underline-offset-4 hover:text-fg hover:underline"
            >
              Previous page ({page - 1} of {pageTotal})
            </Link>
          </nav>
        ) : null}
      </div>
    </div>
  );
}

function EmptyState({
  variant,
  title,
  body,
  action,
}: {
  variant: "filters" | "category";
  title: string;
  body: string;
  action: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-start gap-6 rounded-card border border-dashed border-hairline bg-surface px-6 py-12 sm:flex-row sm:items-center sm:gap-10 sm:px-12 sm:py-16">
      <EmptyIllustration variant={variant} />
      <div className="flex max-w-md flex-col items-start gap-3">
        <h2 className="text-20 font-semibold">{title}</h2>
        <p className="text-14 text-muted">{body}</p>
        <div className="mt-2">{action}</div>
      </div>
    </div>
  );
}

type Chip = { key: string; label: string; remove: (filters: BrowseFilters) => Partial<BrowseFilters> };

function activeChips(filters: BrowseFilters, familyNames: Map<string, string>): Chip[] {
  const chips: Chip[] = [];
  if (filters.q.trim()) chips.push({ key: "q", label: `“${filters.q.trim()}”`, remove: () => ({ q: "" }) });
  if (filters.tier !== "all")
    chips.push({ key: "tier", label: filters.tier === "free" ? "Free" : "Pro", remove: () => ({ tier: "all" }) });
  for (const family of filters.families)
    chips.push({
      key: `family:${family}`,
      label: familyNames.get(family) ?? family,
      remove: (current) => ({ families: current.families.filter((slug) => slug !== family) }),
    });
  if (filters.motion) chips.push({ key: "motion", label: "Has motion", remove: () => ({ motion: false }) });
  return chips;
}
