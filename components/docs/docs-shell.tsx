import { ArrowLeft, ArrowRight, ChevronDown } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { DOC_PAGES, docNeighbors, docPosition, type DocPage } from "@/lib/docs";
import { cn } from "@/lib/utils";

// The docs frame, rendered on the server by each docs page with its own slug, so the current page is marked in
// static HTML and the layout ships no JavaScript of its own. Wide screens get a sticky sidebar and, on long pages,
// an on-page contents column; narrow screens get a page picker that opens in place above the article.

export type TocItem = { id: string; title: string; depth: 2 | 3 };

const GROUPS: { label: string; slugs: string[] }[] = [
  { label: "Start", slugs: ["overview", "installation"] },
  { label: "Use", slugs: ["cli", "theming", "ai-prompts"] },
  { label: "Terms", slugs: ["license"] },
];

/** Long pages (three or more sections) get the on-page contents. */
const MIN_TOC_ITEMS = 3;

function groupedPages() {
  return GROUPS.map((group) => ({
    label: group.label,
    pages: group.slugs
      .map((slug) => DOC_PAGES.find((page) => page.slug === slug))
      .filter((page): page is DocPage => page !== undefined),
  }));
}

function NavList({ current, compact = false }: { current: DocPage; compact?: boolean }) {
  return (
    <div className={cn("flex flex-col", compact ? "gap-5" : "gap-8")}>
      {groupedPages().map((group) => (
        <div key={group.label}>
          <p className="label-mono text-muted">{group.label}</p>
          <ul className="mt-2 flex flex-col">
            {group.pages.map((page) => {
              const active = page.slug === current.slug;
              return (
                <li key={page.slug}>
                  <Link
                    href={page.href as Route}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative flex min-h-9 items-center rounded-control py-1.5 pr-3 pl-3 text-14 transition-colors duration-160 ease-site pointer-coarse:min-h-11",
                      "before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full",
                      active
                        ? "font-medium text-fg before:bg-accent"
                        : "text-muted before:bg-transparent hover:bg-raised hover:text-fg",
                    )}
                  >
                    {page.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      <div className="border-t border-hairline pt-5">
        <ul className="flex flex-col">
          <li>
            <Link
              href="/changelog"
              className="flex min-h-9 items-center rounded-control px-3 py-1.5 text-14 text-muted transition-colors duration-160 ease-site hover:bg-raised hover:text-fg pointer-coarse:min-h-11"
            >
              Changelog
            </Link>
          </li>
          <li>
            <a
              href="/llms.txt"
              className="flex min-h-9 items-center justify-between gap-3 rounded-control px-3 py-1.5 text-14 text-muted transition-colors duration-160 ease-site hover:bg-raised hover:text-fg pointer-coarse:min-h-11"
            >
              llms.txt
              <span className="font-mono text-12">txt</span>
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}

function MobileNav({ current }: { current: DocPage }) {
  return (
    <details className="group rounded-card border border-hairline bg-surface shadow-sm lg:hidden">
      <summary className="flex min-h-12 cursor-pointer list-none items-center gap-3 rounded-card px-4 select-none [&::-webkit-details-marker]:hidden">
        <span className="font-mono text-12 text-muted tabular-nums">{docPosition(current)}</span>
        <span className="min-w-0 flex-1 truncate text-14 font-medium">
          <span className="sr-only">Docs pages, current: </span>
          {current.title}
        </span>
        <span className="label-mono text-muted">Pages</span>
        <ChevronDown
          size={16}
          strokeWidth={1.5}
          aria-hidden
          className="shrink-0 text-muted transition-transform duration-200 ease-site group-open:rotate-180"
        />
      </summary>
      <nav aria-label="Docs" className="border-t border-hairline px-1 pt-4 pb-3">
        <NavList current={current} compact />
      </nav>
    </details>
  );
}

function OnThisPage({ toc }: { toc: TocItem[] }) {
  return (
    <nav aria-label="On this page" className="sticky top-24">
      <p className="label-mono text-muted">On this page</p>
      <ul className="mt-3 flex flex-col border-l border-hairline">
        {toc.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className={cn(
                "-ml-px flex min-h-8 items-center border-l border-transparent py-1 text-14 text-muted transition-colors duration-160 ease-site hover:border-fg hover:text-fg",
                item.depth === 3 ? "pl-6" : "pl-3",
              )}
            >
              {item.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function PagerLink({ page, direction }: { page: DocPage; direction: "previous" | "next" }) {
  const next = direction === "next";
  return (
    <Link
      href={page.href as Route}
      rel={next ? "next" : "prev"}
      data-pager={direction}
      className={cn(
        "group/pager flex flex-col gap-1 rounded-card border border-hairline bg-surface p-4 shadow-sm transition-colors duration-160 ease-site hover:bg-raised sm:p-5",
        next ? "items-end text-right sm:col-start-2" : "items-start",
      )}
    >
      <span className="flex items-center gap-1.5 font-mono text-12 text-muted">
        {next ? null : <ArrowLeft size={16} strokeWidth={1.5} aria-hidden />}
        {next ? "Next" : "Previous"}
        {next ? <ArrowRight size={16} strokeWidth={1.5} aria-hidden /> : null}
      </span>
      <span className="text-16 font-semibold text-fg">{page.title}</span>
    </Link>
  );
}

export function DocsShell({
  slug,
  toc = [],
  title,
  lead,
  children,
}: {
  slug: string;
  toc?: TocItem[];
  /** The page heading; defaults to the page's navigation title. */
  title?: ReactNode;
  /** The sentence under the heading; defaults to the page's description. */
  lead?: ReactNode;
  children: ReactNode;
}) {
  const current = DOC_PAGES.find((page) => page.slug === slug);
  if (!current) throw new Error(`Unknown docs page "${slug}"`);
  const { previous, next } = docNeighbors(slug);
  const showToc = toc.length >= MIN_TOC_ITEMS;

  return (
    <div className="page-frame pt-6 pb-24 sm:pt-10 lg:pt-16">
      <div className="lg:grid lg:grid-cols-12 lg:gap-6">
        <div className="hidden lg:col-span-3 lg:block xl:col-span-2">
          <nav aria-label="Docs" className="sticky top-24 -ml-3">
            <NavList current={current} />
          </nav>
        </div>

        <div className={cn("min-w-0 lg:col-span-9", showToc ? "xl:col-span-7" : "xl:col-span-8")}>
          <MobileNav current={current} />
          <article className="mt-10 max-w-[46rem] lg:mt-0">
            <header>
              <p className="label-mono text-muted">
                Docs <span className="tabular-nums">· {docPosition(current)}</span>
              </p>
              <h1 className="mt-4 text-40 font-semibold sm:text-64">{title ?? current.title}</h1>
              <p className="mt-6 text-16 text-muted sm:text-20">{lead ?? current.description}</p>
            </header>
            <div className="mt-12 border-t border-hairline pt-12" data-docs-content>
              {children}
            </div>
          </article>

          <nav aria-label="Previous and next page" className="mt-24 grid max-w-[46rem] gap-4 sm:grid-cols-2">
            {previous ? <PagerLink page={previous} direction="previous" /> : null}
            {next ? <PagerLink page={next} direction="next" /> : null}
          </nav>
        </div>

        {showToc ? (
          <div className="hidden xl:col-span-3 xl:block xl:pl-8">
            <OnThisPage toc={toc} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
