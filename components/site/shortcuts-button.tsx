"use client";

import { Keyboard } from "lucide-react";
import { Kbd } from "@/components/ui/kbd";
import { useSiteShell } from "./site-shell";

export function ShortcutsButton() {
  const { openShortcuts } = useSiteShell();
  return (
    <button
      type="button"
      onClick={openShortcuts}
      className="inline-flex h-8 items-center gap-2 rounded-control px-2 text-12 text-muted transition-colors hover:bg-raised hover:text-fg pointer-coarse:h-10"
    >
      <Keyboard size={16} strokeWidth={1.5} aria-hidden />
      Keyboard shortcuts
      <Kbd aria-hidden>?</Kbd>
    </button>
  );
}
