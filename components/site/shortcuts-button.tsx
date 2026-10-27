"use client";

import type { ReactNode } from "react";
import { Kbd } from "@/components/ui/kbd";
import { useSiteShell } from "./site-shell";

/** `icon` is rendered by the (server) footer, so the shell ships no icon code. */
export function ShortcutsButton({ icon }: { icon: ReactNode }) {
  const { openShortcuts, preloadDialogs } = useSiteShell();
  return (
    <button
      type="button"
      onClick={openShortcuts}
      onPointerEnter={preloadDialogs}
      onFocus={preloadDialogs}
      className="inline-flex h-8 items-center gap-2 rounded-control px-2 text-12 text-muted transition-colors hover:bg-raised hover:text-fg pointer-coarse:h-10"
    >
      {icon}
      Keyboard shortcuts
      <Kbd aria-hidden>?</Kbd>
    </button>
  );
}
