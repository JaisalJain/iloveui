"use client";

import { clsx } from "clsx";
import Link from "next/link";
import { useState } from "react";
import { designPath, formatGzip } from "@/lib/catalog-paths";
import type { CatalogIndexEntry } from "@/lib/catalog-types";
import { TierTag } from "./tier-tag";

export type DesignCardData = Pick<CatalogIndexEntry, "slug" | "name" | "category" | "tier" | "thumb" | "gzipBytes">;

/**
 * A design in a grid: a live thumbnail (the static, script-free rendering of its default state, at half scale),
 * its name, category, tier and gzipped size. The whole card is one link.
 * A grid holds up to 24 cards, so the design page is prefetched on intent (pointerenter or focus) rather than as each
 * card scrolls into view, which would pull the design page's JavaScript into every browse page load.
 */
export function DesignCard({
  design,
  categoryLabel,
  eager = false,
  className,
}: {
  design: DesignCardData;
  /** The category's display name (the caller has the category list; the card does not import it). */
  categoryLabel: string;
  /** Load the thumbnail immediately (cards in the first viewport). */
  eager?: boolean;
  className?: string;
}) {
  const [intent, setIntent] = useState(false);
  return (
    <Link
      href={designPath(design)}
      prefetch={intent ? null : false}
      onPointerEnter={() => setIntent(true)}
      onFocus={() => setIntent(true)}
      className={clsx(
        "group flex flex-col overflow-hidden rounded-card border border-hairline bg-surface shadow-sm",
        "transition-[translate,box-shadow] duration-450 ease-spring hover:-translate-y-1 hover:shadow-lg",
        className,
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden border-b border-hairline bg-raised">
        <iframe
          src={design.thumb}
          title={`${design.name}, thumbnail`}
          loading={eager ? "eager" : "lazy"}
          tabIndex={-1}
          aria-hidden="true"
          sandbox="allow-scripts"
          data-preview=""
          data-preview-mode="site"
          className="pointer-events-none absolute top-0 left-0 h-[200%] w-[200%] origin-top-left scale-50 border-0"
        />
      </div>
      <div className="flex items-start justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <h3 className="truncate text-14 font-medium text-fg">{design.name}</h3>
          <p className="truncate text-12 text-muted">{categoryLabel}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <TierTag tier={design.tier} />
          <span className="font-mono text-12 text-muted tabular-nums">{formatGzip(design.gzipBytes)}</span>
        </div>
      </div>
    </Link>
  );
}
