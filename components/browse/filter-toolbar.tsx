import { clsx } from "clsx";
import { Check, ChevronDown } from "lucide-react";
import { useState } from "react";
import { Tooltip } from "@/components/ui/tooltip";
import type { BrowseFilters, Format } from "@/lib/browse";
import { focusKeyProps, lazyModule } from "@/lib/client/lazy";
import { monetizationEnabled } from "@/lib/monetization";
import { FORMAT_HINT, FORMAT_OPTIONS, Segmented, TIER_OPTIONS, type Option } from "./filter-panel";

// Desktop filters, in a row under the search field, so every filter is visible without scrolling. The mobile sheet
// (FilterPanel variant "sheet") carries the same controls. The style family menu (Radix DropdownMenu) loads on the
// first pointerenter, focus or click on its button, which renders as a plain button until then.

const familyMenu = lazyModule(() => import("./family-menu"));

export const FAMILY_FOCUS_KEY = "browse-style-family";

const pill = clsx(
  "inline-flex h-9 items-center gap-2 rounded-control border bg-surface px-3 text-14 text-fg shadow-sm",
  "transition-[background-color,border-color] duration-160 ease-site",
);

/** The pill's border: hairline at rest, accent when it holds a selection. */
function pillBorder(active: boolean) {
  return active ? "border-accent hover:border-accent" : "border-hairline hover:border-control";
}

export function familyTriggerClasses(selected: number) {
  return clsx(pill, pillBorder(selected > 0), "data-[state=open]:border-control");
}

export function FamilyTriggerContent({ selected }: { selected: number }) {
  return (
    <>
      Style family
      {selected > 0 ? (
        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full border border-accent px-1.5 font-mono text-12 text-accent tabular-nums">
          {selected}
          <span className="sr-only"> selected</span>
        </span>
      ) : null}
      <ChevronDown size={16} strokeWidth={1.5} aria-hidden className="text-muted" />
    </>
  );
}

export function FilterToolbar({
  families,
  filters,
  onChange,
  format,
  familyCounts,
}: {
  families: readonly Option[];
  filters: BrowseFilters;
  onChange: (patch: Partial<BrowseFilters>) => void;
  format: Format;
  familyCounts: Readonly<Record<string, number>>;
}) {
  const selected = filters.families.length;
  const Menu = familyMenu.use();
  // A click that lands before the menu has loaded opens it as soon as it arrives.
  const [menuRequested, setMenuRequested] = useState(false);

  return (
    <div role="group" aria-label="Filters" className="flex flex-wrap items-center gap-x-3 gap-y-3">
      {monetizationEnabled() ? (
        <Segmented
          label="Tier"
          value={filters.tier}
          options={TIER_OPTIONS}
          onValueChange={(tier) => onChange({ tier })}
          className="w-48"
        />
      ) : null}

      {Menu ? (
        <Menu.FamilyMenu
          families={families}
          filters={filters}
          onChange={onChange}
          familyCounts={familyCounts}
          defaultOpen={menuRequested}
        />
      ) : (
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={false}
          onPointerEnter={familyMenu.preload}
          onFocus={familyMenu.preload}
          onClick={() => {
            setMenuRequested(true);
            familyMenu.preload();
          }}
          className={familyTriggerClasses(selected)}
          {...focusKeyProps(FAMILY_FOCUS_KEY)}
        >
          <FamilyTriggerContent selected={selected} />
        </button>
      )}

      <button
        type="button"
        aria-pressed={filters.motion}
        onClick={() => onChange({ motion: !filters.motion })}
        className={clsx(pill, pillBorder(filters.motion))}
      >
        <span
          aria-hidden
          className={clsx(
            "inline-flex size-4 items-center justify-center rounded-[4px] border transition-colors duration-160 ease-site",
            filters.motion ? "border-accent bg-accent text-canvas" : "border-control",
          )}
        >
          {filters.motion ? <Check size={12} strokeWidth={2.5} /> : null}
        </span>
        Has motion
      </button>

      <div className="ml-auto flex items-center gap-2">
        <Tooltip content={FORMAT_HINT}>
          <span className="label-mono text-muted">First tab</span>
        </Tooltip>
        <Segmented
          label="Preferred code format"
          value={format}
          options={FORMAT_OPTIONS}
          onValueChange={(next) => onChange({ format: next })}
          className="w-36"
          description={FORMAT_HINT}
        />
      </div>
    </div>
  );
}
