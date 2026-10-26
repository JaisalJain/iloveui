"use client";

import { Kbd } from "@/components/ui/kbd";
import { useModKey } from "@/lib/client/platform";
import { useSiteShell } from "./site-shell";

export function HomeShortcutHints() {
  const mod = useModKey();
  const { openPalette, openShortcuts } = useSiteShell();
  return (
    <ul className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-3 text-14 text-muted">
      <li>
        <button
          type="button"
          onClick={openPalette}
          className="inline-flex h-8 items-center gap-2 rounded-control transition-colors hover:text-fg pointer-coarse:h-10"
        >
          <span className="flex items-center gap-1" aria-hidden>
            <Kbd>{mod}</Kbd>
            <Kbd>K</Kbd>
          </span>
          Search
        </button>
      </li>
      <li>
        <button
          type="button"
          onClick={openShortcuts}
          className="inline-flex h-8 items-center gap-2 rounded-control transition-colors hover:text-fg pointer-coarse:h-10"
        >
          <Kbd aria-hidden>?</Kbd>
          Keyboard shortcuts
        </button>
      </li>
    </ul>
  );
}
