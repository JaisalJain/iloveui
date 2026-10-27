"use client";

import { clsx } from "clsx";
import { Check, X } from "lucide-react";
import { Dialog as DialogPrimitive, ToggleGroup } from "radix-ui";
import { useId, type RefObject } from "react";
import { buttonClasses } from "@/components/ui/button-classes";
import type { BrowseFilters, Format } from "@/lib/browse";
import {
  CategoryNav,
  COUNT,
  FORMAT_HINT,
  FORMAT_OPTIONS,
  Section,
  Segmented,
  TIER_OPTIONS,
  type Option,
} from "./filter-panel";

type SheetFiltersProps = {
  category: string | null;
  categories: readonly Option[];
  families: readonly Option[];
  filters: BrowseFilters;
  onChange: (patch: Partial<BrowseFilters>) => void;
  /** Format preference: from the URL, else the stored one. */
  format: Format;
  totalCount: number;
  categoryCounts: Readonly<Record<string, number>>;
  familyCounts: Readonly<Record<string, number>>;
  /** Query string carried by category links, so filters survive a change of category. */
  query: string;
};

/** Every filter, stacked: the desktop toolbar's controls first, the long category list last. */
function SheetFilters({
  families,
  filters,
  onChange,
  format,
  familyCounts,
  onNavigate,
  ...nav
}: SheetFiltersProps & {
  onNavigate: () => void;
}) {
  const motionLabelId = useId();
  const motionHintId = useId();
  return (
    <div className="flex flex-col gap-6">
      <Section title="Tier">
        <Segmented
          label="Tier"
          value={filters.tier}
          options={TIER_OPTIONS}
          onValueChange={(tier) => onChange({ tier })}
        />
      </Section>

      <Section title="Style family">
        <ToggleGroup.Root
          type="multiple"
          orientation="vertical"
          aria-label="Style family"
          value={filters.families}
          onValueChange={(selected) =>
            onChange({ families: families.map((family) => family.slug).filter((slug) => selected.includes(slug)) })
          }
          className="-mx-2 flex flex-col"
        >
          {families.map((family) => {
            const count = familyCounts[family.slug] ?? 0;
            return (
              <ToggleGroup.Item
                key={family.slug}
                value={family.slug}
                className={clsx(
                  "group/family flex min-h-8 items-center gap-3 rounded-control px-2 py-1.5 text-left text-14 pointer-coarse:min-h-10",
                  "transition-colors duration-160 ease-site hover:bg-raised",
                  count > 0 ? "text-fg" : "text-muted",
                )}
              >
                <span
                  aria-hidden
                  className={clsx(
                    "inline-flex size-4 shrink-0 items-center justify-center rounded-[4px] border border-control",
                    "transition-colors duration-160 ease-site",
                    "group-data-[state=on]/family:border-accent group-data-[state=on]/family:bg-accent group-data-[state=on]/family:text-canvas",
                  )}
                >
                  <Check size={12} strokeWidth={2.5} className="hidden group-data-[state=on]/family:block" />
                </span>
                <span className="min-w-0 flex-1">{family.name}</span>
                <span className={clsx(COUNT, "text-muted")}>{count}</span>
              </ToggleGroup.Item>
            );
          })}
        </ToggleGroup.Root>
      </Section>

      <Section title="Motion">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-0.5">
            <span id={motionLabelId} className="text-14 text-fg">
              Has motion
            </span>
            <span id={motionHintId} className="text-12 text-muted">
              Every one still works with motion turned off.
            </span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={filters.motion}
            aria-labelledby={motionLabelId}
            aria-describedby={motionHintId}
            onClick={() => onChange({ motion: !filters.motion })}
            className="group/switch -m-2 inline-flex tap-target shrink-0 items-center rounded-full p-2"
          >
            <span
              aria-hidden
              className={clsx(
                "relative h-5 w-9 rounded-full border transition-colors duration-160 ease-site",
                filters.motion ? "border-accent bg-accent" : "border-control bg-raised",
              )}
            >
              <span
                className={clsx(
                  "absolute top-0.5 left-0.5 size-3.5 rounded-full shadow-sm transition-[translate,background-color] duration-450 ease-spring",
                  filters.motion ? "translate-x-4 bg-canvas" : "bg-muted",
                )}
              />
            </span>
          </button>
        </div>
      </Section>

      <Section title="Code format" hint={FORMAT_HINT}>
        <Segmented
          label="Preferred code format"
          value={format}
          options={FORMAT_OPTIONS}
          onValueChange={(next) => onChange({ format: next })}
        />
      </Section>
      <CategoryNav {...nav} onNavigate={onNavigate} variant="sheet" />
    </div>
  );
}

/**
 * The phone and tablet filter sheet, loaded by the browse island on intent (pointerenter, focus or a click on the
 * Filters button). The button stays in the island, so focus is handed back to it explicitly on close.
 */
export function FilterSheet({
  open,
  onOpenChange,
  triggerRef,
  onClear,
  canClear,
  showLabel,
  ...filters
}: SheetFiltersProps & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  triggerRef: RefObject<HTMLButtonElement | null>;
  onClear: () => void;
  canClear: boolean;
  showLabel: string;
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=closed]:animate-fade-out data-[state=open]:animate-fade-in dark:bg-black/60" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            (event.currentTarget as HTMLElement | null)?.focus();
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            triggerRef.current?.focus();
          }}
          className={
            "fixed inset-x-0 bottom-0 z-50 flex max-h-[88dvh] flex-col rounded-t-frame border-t border-hairline bg-surface text-fg shadow-lg outline-hidden " +
            "data-[state=closed]:animate-dialog-out data-[state=open]:animate-dialog-in sm:inset-x-auto sm:top-0 sm:right-0 sm:bottom-0 sm:max-h-none sm:w-96 sm:rounded-none sm:border-t-0 sm:border-l"
          }
        >
          <div className="flex items-center justify-between gap-4 border-b border-hairline px-4 py-3 sm:px-6">
            <DialogPrimitive.Title className="text-16 font-semibold">Filters</DialogPrimitive.Title>
            <DialogPrimitive.Close
              aria-label="Close filters"
              className="-mr-2 inline-flex size-10 items-center justify-center rounded-control text-muted hover:bg-raised hover:text-fg"
            >
              <X size={16} strokeWidth={1.5} aria-hidden />
            </DialogPrimitive.Close>
          </div>
          <div className="flex-1 [scrollbar-gutter:stable] overflow-y-auto overscroll-contain px-4 py-4 sm:px-6">
            <SheetFilters {...filters} onNavigate={() => onOpenChange(false)} />
          </div>
          <div className="flex items-center gap-3 border-t border-hairline px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6">
            <button
              type="button"
              onClick={onClear}
              disabled={!canClear}
              className={buttonClasses({ variant: "ghost" })}
            >
              Clear
            </button>
            <DialogPrimitive.Close className={buttonClasses({ variant: "primary", className: "flex-1" })}>
              {showLabel}
            </DialogPrimitive.Close>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
