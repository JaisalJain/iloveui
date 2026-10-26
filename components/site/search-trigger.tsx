"use client";

import { Search } from "lucide-react";
import { Kbd } from "@/components/ui/kbd";
import { Tooltip } from "@/components/ui/tooltip";
import { useModKey } from "@/lib/client/platform";
import { useSiteShell } from "./site-shell";

export function SearchTrigger() {
  const { openPalette } = useSiteShell();
  const mod = useModKey();
  return (
    <>
      <button
        type="button"
        onClick={openPalette}
        className="hidden h-8 w-56 items-center gap-2 rounded-control border border-hairline bg-surface px-3 text-14 text-muted shadow-sm transition-colors duration-160 ease-site hover:text-fg md:inline-flex"
      >
        <Search size={16} strokeWidth={1.5} aria-hidden />
        <span>Search designs</span>
        <span className="ml-auto flex items-center gap-1" aria-hidden>
          <Kbd>{mod}</Kbd>
          <Kbd>K</Kbd>
        </span>
      </button>
      <Tooltip
        content={
          <>
            Search <Kbd>{mod}</Kbd>
            <Kbd>K</Kbd>
          </>
        }
      >
        <button
          type="button"
          onClick={openPalette}
          aria-label="Search designs"
          className="inline-flex size-10 items-center justify-center rounded-control text-muted transition-colors hover:bg-raised hover:text-fg md:hidden"
        >
          <Search size={16} strokeWidth={1.5} aria-hidden />
        </button>
      </Tooltip>
    </>
  );
}
