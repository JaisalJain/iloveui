"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { toggleColorMode } from "@/lib/client/theme-mode";
import { isTypingTarget } from "@/lib/shortcuts";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CommandPalette } from "./command-palette";
import { ShortcutsDialog } from "./shortcuts-dialog";

type SiteShellContextValue = {
  openPalette: () => void;
  openShortcuts: () => void;
};

const SiteShellContext = createContext<SiteShellContextValue | null>(null);

export function useSiteShell() {
  const value = useContext(SiteShellContext);
  if (!value) throw new Error("useSiteShell must be used inside <SiteShell>");
  return value;
}

/** Event other components can listen to for the C shortcut (the design page code viewer copies its tab). */
export const COPY_CODE_EVENT = "iloveui:copy-code";

export function SiteShell({ children }: { children: ReactNode }) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  const openPalette = useCallback(() => setPaletteOpen(true), []);
  const openShortcuts = useCallback(() => setShortcutsOpen(true), []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented) return;
      const key = event.key.toLowerCase();
      if ((event.metaKey || event.ctrlKey) && !event.altKey && !event.shiftKey && key === "k") {
        event.preventDefault();
        setShortcutsOpen(false);
        setPaletteOpen((open) => !open);
        return;
      }
      if (event.metaKey || event.ctrlKey || event.altKey || isTypingTarget(event.target)) return;
      // Single-key shortcuts stay quiet while a dialog has focus.
      if (document.body.hasAttribute("data-scroll-locked")) return;
      if (event.key === "/") {
        event.preventDefault();
        const field = document.querySelector<HTMLInputElement>("[data-page-search]");
        if (field) field.focus();
        else setPaletteOpen(true);
      } else if (event.key === "?") {
        event.preventDefault();
        setShortcutsOpen(true);
      } else if (key === "t" && !event.shiftKey) {
        event.preventDefault();
        toggleColorMode();
      } else if (key === "c" && !event.shiftKey) {
        window.dispatchEvent(new CustomEvent(COPY_CODE_EVENT));
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const value = useMemo(() => ({ openPalette, openShortcuts }), [openPalette, openShortcuts]);

  return (
    <SiteShellContext.Provider value={value}>
      <TooltipProvider>
        {children}
        <CommandPalette
          open={paletteOpen}
          onOpenChange={setPaletteOpen}
          onShowShortcuts={() => {
            setPaletteOpen(false);
            setShortcutsOpen(true);
          }}
        />
        <ShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
      </TooltipProvider>
    </SiteShellContext.Provider>
  );
}
