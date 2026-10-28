import Link from "next/link";
import { buttonClasses } from "@/components/ui/button-classes";
import { HomeShortcutHints } from "@/components/site/home-shortcut-hints";
import type { CatalogDesign } from "@/lib/catalog-types";
import { monetizationEnabled } from "@/lib/monetization";
import { site } from "@/lib/site";
import { HeroWall } from "./hero-wall";

/**
 * Spec 7.4: a left-aligned headline on a solid canvas panel, with the wall of live designs to its right on wide
 * screens and below it on narrow ones. The headline is plain server-rendered text, so it paints before any thumbnail.
 */
export function Hero({ columns, total, free }: { columns: CatalogDesign[][]; total: number; free: number }) {
  return (
    <section
      aria-labelledby="home-title"
      className="relative border-b border-hairline lg:h-[clamp(640px,calc(100svh-4rem),880px)]"
    >
      <div className="page-frame lg:grid lg:h-full lg:grid-cols-12 lg:gap-6">
        <div className="relative z-10 flex flex-col justify-center bg-canvas pt-12 pb-12 sm:pt-20 sm:pb-16 lg:col-span-5 lg:py-16 lg:pr-6">
          <p className="label-mono text-muted">
            <span className="text-fg tabular-nums">{total}</span> designs live
            <span aria-hidden className="mx-2">
              /
            </span>
            {monetizationEnabled() ? (
              <>
                <span className="text-fg tabular-nums">{free}</span> free forever
              </>
            ) : (
              <>
                <span className="text-fg">MIT</span> licensed
              </>
            )}
          </p>
          <h1 id="home-title" className="mt-6 text-64 font-semibold xl:text-96">
            {"UI you'll "}
            <em className="font-serif font-normal tracking-normal">actually</em>
            {" ship."}
          </h1>
          <p className="mt-6 max-w-md text-20 text-muted">{site.description}</p>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Link href="/designs" className={buttonClasses({ variant: "primary", size: "lg" })}>
              Browse designs
            </Link>
            {monetizationEnabled() ? (
              <Link href="/pricing" className={buttonClasses({ variant: "outline", size: "lg" })}>
                See pricing
              </Link>
            ) : (
              <a href={site.repository} className={buttonClasses({ variant: "outline", size: "lg" })}>
                View on GitHub
              </a>
            )}
          </div>
          <HomeShortcutHints />
        </div>
      </div>
      <HeroWall columns={columns} className="border-t border-hairline lg:border-t-0 lg:border-l" />
    </section>
  );
}
