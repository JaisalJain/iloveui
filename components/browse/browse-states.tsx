/** A static placeholder with the exact geometry of a DesignCard. */
export function CardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-card border border-hairline bg-surface shadow-sm">
      <div className="relative aspect-[16/10] border-b border-hairline bg-raised">
        <div className="absolute inset-x-[12%] top-[22%] h-2 rounded-full bg-hairline" />
        <div className="absolute top-[34%] left-[12%] h-2 w-[38%] rounded-full bg-hairline" />
        <div className="absolute bottom-[18%] left-[12%] h-[30%] w-[76%] rounded-control border border-hairline" />
      </div>
      <div className="flex items-start justify-between gap-3 px-4 py-3">
        <div className="flex min-w-0 flex-col gap-2 py-0.5">
          <div className="h-3 w-32 rounded-full bg-raised" />
          <div className="h-2.5 w-20 rounded-full bg-raised" />
        </div>
        <div className="flex flex-col items-end gap-2 py-0.5">
          <div className="h-5 w-10 rounded-full border border-hairline" />
          <div className="h-2.5 w-16 rounded-full bg-raised" />
        </div>
      </div>
    </div>
  );
}

const GRID_TRACKS = "grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3";
export const GRID_CLASSES = `grid ${GRID_TRACKS}`;

/**
 * Skeleton cards in the result grid. `pendingOnly` keeps it hidden except while the island is still applying the
 * URL's filters (the [data-browse-pending] state), so unfiltered cards never flash.
 */
export function SkeletonGrid({ count = 6, pendingOnly = false }: { count?: number; pendingOnly?: boolean }) {
  return (
    <div aria-hidden className={pendingOnly ? `hidden [[data-browse-pending]_&]:grid ${GRID_TRACKS}` : GRID_CLASSES}>
      {Array.from({ length: count }, (_, index) => (
        <CardSkeleton key={index} />
      ))}
    </div>
  );
}

/**
 * The explorer's place while it is on its way: React streams a server-rendered boundary this large after the rest of
 * the page, and a client navigation loads the explorer's code first. The same columns, the search row and skeleton
 * cards hold the space, so the footer never jumps up into view and back down.
 */
export function ExplorerSkeleton() {
  return (
    // Without JavaScript the boundary never fills in; those visitors get the <noscript> copy instead.
    <div aria-hidden className="noscript:hidden">
      <div className="lg:grid lg:grid-cols-12 lg:gap-6">
        <div className="hidden lg:col-span-3 lg:block" />
        <div className="min-w-0 lg:col-span-9">
          <div className="h-10 rounded-control border border-hairline bg-surface shadow-sm" />
          <div className="mt-6 flex min-h-8 items-center">
            <div className="h-2.5 w-24 rounded-full bg-raised" />
          </div>
          <div className="mt-4">
            <SkeletonGrid />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Drawn empty frame: a card outline with a dashed thumbnail and a crossed search lens. */
export function EmptyIllustration({ variant }: { variant: "filters" | "category" }) {
  return (
    <svg viewBox="0 0 160 112" width="160" height="112" aria-hidden className="text-muted" fill="none">
      <rect
        x="8.5"
        y="8.5"
        width="112"
        height="88"
        rx="9.5"
        className="fill-surface"
        stroke="currentColor"
        strokeOpacity=".35"
      />
      <rect
        x="18.5"
        y="18.5"
        width="92"
        height="46"
        rx="5.5"
        stroke="currentColor"
        strokeOpacity=".35"
        strokeDasharray="4 4"
      />
      <rect x="18" y="74" width="48" height="6" rx="3" fill="currentColor" fillOpacity=".25" />
      <rect x="18" y="84" width="30" height="4" rx="2" fill="currentColor" fillOpacity=".18" />
      <rect x="92" y="75" width="18" height="10" rx="5" stroke="currentColor" strokeOpacity=".35" />
      {variant === "filters" ? (
        <g className="text-accent" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="122" cy="74" r="15" className="fill-canvas" />
          <path d="m133 85 13 13" />
          <path d="m116 68 12 12m0-12-12 12" strokeWidth="1.75" />
        </g>
      ) : (
        <g className="text-accent" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
          <circle cx="126" cy="78" r="15" className="fill-canvas" />
          <path d="M126 71v14m-7-7h14" />
        </g>
      )}
    </svg>
  );
}
