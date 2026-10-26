import type { Route } from "next";

// Entries of the Cmd+K palette that are not designs. Designs and categories come from /catalog.json once it exists.
export type PaletteGroup = "Recent" | "Designs" | "Categories" | "Pages" | "Actions";

export type PaletteEntry = {
  id: string;
  group: Exclude<PaletteGroup, "Recent">;
  label: string;
  hint?: string;
  keywords?: string[];
  href?: Route;
  action?: "toggle-theme" | "show-shortcuts";
};

export const PAGE_ENTRIES: PaletteEntry[] = [
  { id: "page:/", group: "Pages", label: "Home", hint: "/", href: "/", keywords: ["start", "landing"] },
];

export const ACTION_ENTRIES: PaletteEntry[] = [
  { id: "action:theme", group: "Actions", label: "Toggle light and dark theme", hint: "T", action: "toggle-theme" },
  {
    id: "action:shortcuts",
    group: "Actions",
    label: "Show keyboard shortcuts",
    hint: "?",
    action: "show-shortcuts",
    keywords: ["keys", "help", "hotkeys"],
  },
];

export const RECENT_STORAGE_KEY = "iloveui.recent";
export const MAX_RECENT = 5;
