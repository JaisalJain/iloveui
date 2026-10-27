"use client";

import { clsx } from "clsx";
import { Check } from "lucide-react";
import { DropdownMenu } from "radix-ui";
import type { BrowseFilters } from "@/lib/browse";
import { focusKeyProps, useCarriedFocus } from "@/lib/client/lazy";
import type { Option } from "./filter-panel";
import { FAMILY_FOCUS_KEY, FamilyTriggerContent, familyTriggerClasses } from "./filter-toolbar";

const COUNT = "font-mono text-12 tabular-nums [[data-browse-pending]_&]:invisible";

/** The desktop style family menu, loaded on intent by the filter toolbar (see ./filter-toolbar). */
export function FamilyMenu({
  families,
  filters,
  onChange,
  familyCounts,
  defaultOpen,
}: {
  families: readonly Option[];
  filters: BrowseFilters;
  onChange: (patch: Partial<BrowseFilters>) => void;
  familyCounts: Readonly<Record<string, number>>;
  defaultOpen: boolean;
}) {
  useCarriedFocus();
  const selected = filters.families.length;

  function toggleFamily(slug: string, on: boolean) {
    const next = new Set(filters.families);
    if (on) next.add(slug);
    else next.delete(slug);
    onChange({ families: families.map((family) => family.slug).filter((family) => next.has(family)) });
  }

  return (
    <DropdownMenu.Root modal={false} defaultOpen={defaultOpen}>
      <DropdownMenu.Trigger className={familyTriggerClasses(selected)} {...focusKeyProps(FAMILY_FOCUS_KEY)}>
        <FamilyTriggerContent selected={selected} />
      </DropdownMenu.Trigger>
      {/* Rendered in place (no portal) so the menu stays inside the main landmark. */}
      <DropdownMenu.Content
        align="start"
        sideOffset={6}
        collisionPadding={16}
        className={clsx(
          "z-50 min-w-60 rounded-card border border-hairline bg-surface p-1 text-fg shadow-lg",
          "origin-(--radix-dropdown-menu-content-transform-origin)",
          "data-[state=closed]:animate-pop-out data-[state=open]:animate-pop-in",
        )}
      >
        <DropdownMenu.Label className="px-2 pt-1.5 pb-1 label-mono text-muted">Style family</DropdownMenu.Label>
        {families.map((family) => {
          const count = familyCounts[family.slug] ?? 0;
          return (
            <DropdownMenu.CheckboxItem
              key={family.slug}
              checked={filters.families.includes(family.slug)}
              onCheckedChange={(on) => toggleFamily(family.slug, on)}
              // Keep the menu open so several families can be picked in one go.
              onSelect={(event) => event.preventDefault()}
              className={clsx(
                "group/family flex h-9 cursor-default items-center gap-3 rounded-control px-2 text-14 outline-hidden select-none",
                "data-highlighted:bg-raised pointer-coarse:h-10",
                count > 0 ? "text-fg" : "text-muted",
              )}
            >
              <span
                aria-hidden
                className={clsx(
                  "inline-flex size-4 shrink-0 items-center justify-center rounded-[4px] border border-control",
                  "group-data-[state=checked]/family:border-accent group-data-[state=checked]/family:bg-accent group-data-[state=checked]/family:text-canvas",
                )}
              >
                <DropdownMenu.ItemIndicator>
                  <Check size={12} strokeWidth={2.5} />
                </DropdownMenu.ItemIndicator>
              </span>
              <span className="flex-1">{family.name}</span>
              <span className={clsx(COUNT, "text-muted")}>{count}</span>
            </DropdownMenu.CheckboxItem>
          );
        })}
        {selected > 0 ? (
          <>
            <DropdownMenu.Separator className="my-1 h-px bg-hairline" />
            <DropdownMenu.Item
              onSelect={() => onChange({ families: [] })}
              className="flex h-9 cursor-default items-center rounded-control px-2 text-14 text-muted outline-hidden select-none data-highlighted:bg-raised data-highlighted:text-fg pointer-coarse:h-10"
            >
              Clear style families
            </DropdownMenu.Item>
          </>
        ) : null}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
}
