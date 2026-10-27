import { ArrowRight, Search } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { buttonClasses } from "@/components/ui/button-classes";
import { Kbd } from "@/components/ui/kbd";

const DESTINATIONS: { href: Route; label: string; description: string }[] = [
  { href: "/designs", label: "All designs", description: "Browse and filter the whole catalog." },
  { href: "/collections", label: "Collections", description: "Sets for a landing page, an AI app, a dashboard." },
  { href: "/pricing", label: "Pricing", description: "Free, Pro and Team." },
  { href: "/docs", label: "Docs", description: "Install, theme and use the CLI." },
];

/**
 * The site's 404. Server-rendered and script-free: the search is a plain GET form to /designs?q=, which the browse
 * page reads, and "/" focuses it through the shell's data-page-search hook.
 */
export function NotFoundContent() {
  return (
    <section className="page-frame grid gap-12 pt-24 pb-16 sm:pt-32 lg:grid-cols-12 lg:gap-6">
      <div className="lg:col-span-7">
        <p className="label-mono text-muted">Error 404</p>
        <h1 className="mt-4 max-w-2xl text-40 font-semibold sm:text-64">
          {"This page doesn't "}
          <em className="font-serif font-normal tracking-normal">exist.</em>
        </h1>
        <p className="mt-6 max-w-lg text-16 text-muted">
          The link may be out of date, or the address mistyped. Search for the design you were after, or start from one
          of these pages.
        </p>

        <form action="/designs" method="get" role="search" className="mt-10 max-w-lg">
          <label htmlFor="not-found-search" className="text-14 font-medium">
            Search designs
          </label>
          <div className="mt-2 flex gap-2">
            <div className="relative min-w-0 flex-1">
              <Search
                size={16}
                strokeWidth={1.5}
                aria-hidden
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted"
              />
              <input
                id="not-found-search"
                name="q"
                type="search"
                data-page-search=""
                autoComplete="off"
                enterKeyHint="search"
                placeholder="pricing, dashboard, command palette"
                className="h-10 w-full rounded-control border border-control bg-surface pr-10 pl-9 text-16 text-fg shadow-sm placeholder:text-muted sm:text-14"
              />
              <Kbd aria-hidden className="absolute top-1/2 right-3 -translate-y-1/2 max-sm:hidden">
                /
              </Kbd>
            </div>
            <button type="submit" className={buttonClasses({ variant: "primary", size: "md" })}>
              Search
            </button>
          </div>
        </form>
      </div>

      <nav aria-label="Where to next" className="lg:col-span-4 lg:col-start-9 lg:pt-10">
        <p className="label-mono text-muted">Where to next</p>
        <ul className="mt-3 divide-y divide-hairline border-y border-hairline">
          {DESTINATIONS.map((destination) => (
            <li key={destination.href}>
              <Link
                href={destination.href}
                className="group flex min-h-14 items-center justify-between gap-4 py-3 transition-colors duration-160 ease-site"
              >
                <span>
                  <span className="block text-14 font-medium text-fg">{destination.label}</span>
                  <span className="block text-14 text-muted">{destination.description}</span>
                </span>
                <ArrowRight
                  size={16}
                  strokeWidth={1.5}
                  aria-hidden
                  className="shrink-0 text-muted transition-transform duration-200 ease-site group-hover:translate-x-0.5 group-hover:text-fg"
                />
              </Link>
            </li>
          ))}
        </ul>
        <Link href="/" className={buttonClasses({ variant: "outline", size: "md", className: "mt-6" })}>
          Back to home
        </Link>
      </nav>
    </section>
  );
}
