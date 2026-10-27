import { Bookmark } from "lucide-react";
import Link from "next/link";
import { TierTag } from "@/components/designs/tier-tag";
import { buttonClasses } from "@/components/ui/button-classes";
import { categoryName, designPath } from "@/lib/catalog-shared";
import type { CatalogDesign } from "@/lib/catalog-types";
import { Panel } from "./account-section";
import { RemoveBookmarkButton } from "./remove-bookmark-button";

export function BookmarkList({ designs }: { designs: CatalogDesign[] }) {
  if (designs.length === 0) {
    return (
      <Panel className="flex flex-col items-start gap-4 px-5 py-8 sm:px-6" data-bookmarks-empty>
        <span className="inline-flex size-10 items-center justify-center rounded-control border border-hairline bg-canvas text-muted">
          <Bookmark size={16} strokeWidth={1.5} aria-hidden />
        </span>
        <div>
          <p className="text-16 font-semibold">No bookmarks yet</p>
          <p className="mt-1 max-w-md text-14 text-pretty text-muted">
            Bookmark a design from its page and it shows up here, on every device you sign in on.
          </p>
        </div>
        <Link href="/designs" className={buttonClasses({ variant: "outline", size: "md" })}>
          Browse designs
        </Link>
      </Panel>
    );
  }
  return (
    <Panel>
      <ul className="divide-y divide-hairline" aria-label="Bookmarked designs">
        {designs.map((design) => (
          <li key={design.slug} className="flex items-center gap-3 py-2 pr-3 pl-5 sm:pl-6">
            <Link
              href={designPath(design)}
              className="group -my-1 flex min-w-0 flex-1 flex-col gap-0.5 rounded-control py-1 sm:flex-row sm:items-center sm:gap-4"
            >
              <span className="truncate text-14 font-medium text-fg group-hover:underline group-hover:underline-offset-4">
                {design.name}
              </span>
              <span className="truncate text-12 text-muted">{categoryName(design.category)}</span>
            </Link>
            <TierTag tier={design.tier} />
            <RemoveBookmarkButton slug={design.slug} name={design.name} />
          </li>
        ))}
      </ul>
    </Panel>
  );
}
