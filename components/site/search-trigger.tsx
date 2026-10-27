"use client";

import type { ReactNode } from "react";
import { Kbd } from "@/components/ui/kbd";
import { Tooltip } from "@/components/ui/tooltip";
import { useModKey } from "@/lib/client/platform";
import { useSiteShell } from "./site-shell";

/** `icon` is rendered by the (server) header, so the shell ships no icon code. */
export function SearchTrigger({ icon }: { icon: ReactNode }) {
  const { openPalette, preloadDialogs } = useSiteShell();
  const mod = useModKey();
  return (
    <>
      <button
        type="button"
        onClick={openPalette}
        onPointerEnter={preloadDialogs}
        onFocus={preloadDialogs}
        className="hidden h-8 w-56 items-center gap-2 rounded-control border border-hairline bg-surface px-3 text-14 text-muted shadow-sm transition-colors duration-160 ease-site hover:text-fg md:inline-flex"
      >
        {icon}
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
          onPointerEnter={preloadDialogs}
          onFocus={preloadDialogs}
          aria-label="Search designs"
          className="inline-flex size-10 items-center justify-center rounded-control text-muted transition-colors hover:bg-raised hover:text-fg md:hidden"
        >
          {icon}
        </button>
      </Tooltip>
    </>
  );
}
