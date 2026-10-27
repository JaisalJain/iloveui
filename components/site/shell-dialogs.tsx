"use client";

import { CommandPalette } from "./command-palette";
import { ShortcutsDialog } from "./shortcuts-dialog";

/** The search palette and the shortcuts dialog: loaded by the site shell on first intent, never at page load. */
export function ShellDialogs({
  paletteOpen,
  onPaletteOpenChange,
  shortcutsOpen,
  onShortcutsOpenChange,
}: {
  paletteOpen: boolean;
  onPaletteOpenChange: (open: boolean) => void;
  shortcutsOpen: boolean;
  onShortcutsOpenChange: (open: boolean) => void;
}) {
  return (
    <>
      <CommandPalette
        open={paletteOpen}
        onOpenChange={onPaletteOpenChange}
        onShowShortcuts={() => {
          onPaletteOpenChange(false);
          onShortcutsOpenChange(true);
        }}
      />
      <ShortcutsDialog open={shortcutsOpen} onOpenChange={onShortcutsOpenChange} />
    </>
  );
}
