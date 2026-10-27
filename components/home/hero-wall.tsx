import { clsx } from "clsx";
import Link from "next/link";
import type { CSSProperties } from "react";
import { TierTag } from "@/components/designs/tier-tag";
import { categoryName, designPath } from "@/lib/catalog";
import type { CatalogDesign } from "@/lib/catalog-types";
import { HeroWallController } from "./hero-wall-controller";

export const HERO_WALL_ID = "hero-wall";

// Per column: drift time for one full set (seconds), how far into its cycle it starts (seconds, so the columns are
// staggered from the first frame), the offset of the static grid, and the direction. Different speeds and alternating
// directions keep neighbouring columns from moving in lockstep.
const COLUMNS = [
  { seconds: 76, start: 6, staticOffset: 0, reverse: false },
  { seconds: 104, start: 38, staticOffset: 56, reverse: true },
  { seconds: 88, start: 21, staticOffset: 24, reverse: false },
  { seconds: 120, start: 70, staticOffset: 80, reverse: true },
] as const;

// Full class strings so Tailwind sees them. Taller tiles show more of each design's small-screen layout.
const ASPECTS = ["aspect-[3/4]", "aspect-[4/5]", "aspect-[2/3]", "aspect-[5/6]"] as const;

function Tile({ design, aspect, clone }: { design: CatalogDesign; aspect: string; clone: boolean }) {
  const category = categoryName(design.category);
  return (
    <li>
      <Link
        href={designPath(design)}
        prefetch={false}
        tabIndex={clone ? -1 : undefined}
        data-wall-tile=""
        className={clsx(
          "group relative block scroll-mt-24 scroll-mb-6 rounded-card border border-hairline bg-raised shadow-sm",
          "transition-[translate,box-shadow] duration-450 ease-spring hover:-translate-y-1 hover:shadow-lg",
          "focus-visible:-translate-y-1 focus-visible:shadow-lg",
        )}
      >
        <span className={clsx("relative block overflow-hidden rounded-[9px]", aspect)}>
          <iframe
            data-src={design.thumb}
            title={`${design.name}, live thumbnail`}
            tabIndex={-1}
            aria-hidden="true"
            sandbox="allow-scripts"
            data-preview=""
            data-preview-mode="site"
            className={clsx(
              "hero-wall-frame",
              "pointer-events-none absolute top-0 left-0 h-[200%] w-[200%] origin-top-left scale-50 border-0",
            )}
          />
        </span>
        <span
          className={clsx(
            "pointer-events-none absolute inset-x-2 bottom-2 flex items-center justify-between gap-3",
            "rounded-control border border-hairline bg-surface px-3 py-2 shadow-sm",
            "translate-y-1 opacity-0 transition-[opacity,translate] duration-200 ease-site",
            "group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100",
          )}
        >
          <span className="min-w-0">
            <span className="block truncate text-14 font-medium text-fg">{design.name}</span>
            <span className="block truncate text-12 text-muted">{category}</span>
          </span>
          <TierTag tier={design.tier} />
        </span>
      </Link>
    </li>
  );
}

/**
 * Four staggered columns of real designs, each a sandboxed static thumbnail at 50% scale that follows the site's
 * light/dark and the visitor's Theme Lab tokens. Thumbnails carry data-src and are loaded by the controller only as
 * they come into view, after the page has loaded, so the headline paints first.
 */
export function HeroWall({ columns, className }: { columns: CatalogDesign[][]; className?: string }) {
  return (
    <div
      id={HERO_WALL_ID}
      data-hero-wall=""
      role="group"
      aria-label="Live designs"
      className={clsx("hero-wall", className)}
    >
      {columns.map((designs, columnIndex) => {
        const column = COLUMNS[columnIndex % COLUMNS.length]!;
        const style = {
          "--column-seconds": column.seconds,
          "--column-start": `${-column.start}s`,
          "--static-offset": `${column.staticOffset}px`,
        } as CSSProperties;
        return (
          <div key={columnIndex} className="hero-wall-column" style={style}>
            <div data-wall-track="" className={clsx("hero-wall-track", column.reverse && "hero-wall-reverse")}>
              {[false, true].map((clone) => (
                <ul
                  key={String(clone)}
                  className={clsx("hero-wall-set", clone && "hero-wall-clone")}
                  aria-hidden={clone ? "true" : undefined}
                >
                  {designs.map((design, index) => (
                    <Tile
                      key={`${design.slug}-${index}`}
                      design={design}
                      aspect={ASPECTS[(columnIndex + index) % ASPECTS.length]!}
                      clone={clone}
                    />
                  ))}
                </ul>
              ))}
            </div>
          </div>
        );
      })}
      <HeroWallController wallId={HERO_WALL_ID} />
    </div>
  );
}
