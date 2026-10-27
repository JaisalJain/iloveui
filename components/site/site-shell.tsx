"use client";

import { createContext, useContext, useEffect, useSyncExternalStore, type ReactNode } from "react";
import { ThumbnailLoader } from "@/components/designs/thumbnail-loader";
import { PreviewBridge } from "@/components/preview/preview-bridge";
import { markHydrated } from "@/lib/client/hydration";
import { lazyModule } from "@/lib/client/lazy";
import { toggleColorMode } from "@/lib/client/theme-mode";
import { isTypingTarget } from "@/lib/shortcuts";

// Radix Dialog, the palette and the search index load on intent: the shortcut keys, a click on a trigger, or a
// pointerenter or focus on one (a prefetch), so none of it counts against the first load.
const dialogs = lazyModule(() => import("./shell-dialogs"));

/** Event other components can listen to for the C shortcut (the design page code viewer copies its tab). */
export const COPY_CODE_EVENT = "iloveui:copy-code";

// Which dialog is open lives outside React, so the shortcut keys work from the moment this module runs, before the
// page has hydrated (a key pressed that early opens the dialog as soon as hydration finishes).
type DialogState = { palette: boolean; shortcuts: boolean };
const CLOSED: DialogState = { palette: false, shortcuts: false };
let dialogState = CLOSED;
const listeners = new Set<() => void>();

function setDialogs(next: Partial<DialogState> | ((current: DialogState) => Partial<DialogState>)) {
  dialogState = { ...dialogState, ...(typeof next === "function" ? next(dialogState) : next) };
  if (dialogState.palette || dialogState.shortcuts) dialogs.preload();
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const openPalette = () => setDialogs({ palette: true });
const openShortcuts = () => setDialogs({ shortcuts: true });
const setPaletteOpen = (palette: boolean) => setDialogs({ palette });
const setShortcutsOpen = (shortcuts: boolean) => setDialogs({ shortcuts });

function onKeyDown(event: KeyboardEvent) {
  if (event.defaultPrevented) return;
  const key = event.key.toLowerCase();
  if ((event.metaKey || event.ctrlKey) && !event.altKey && !event.shiftKey && key === "k") {
    event.preventDefault();
    setDialogs((current) => ({ shortcuts: false, palette: !current.palette }));
    return;
  }
  if (event.metaKey || event.ctrlKey || event.altKey || isTypingTarget(event.target)) return;
  // Single-key shortcuts stay quiet while a dialog has focus.
  if (document.body.hasAttribute("data-scroll-locked")) return;
  if (event.key === "/") {
    event.preventDefault();
    const field = document.querySelector<HTMLInputElement>("[data-page-search]");
    if (field) field.focus();
    else openPalette();
  } else if (event.key === "?") {
    event.preventDefault();
    openShortcuts();
  } else if (key === "t" && !event.shiftKey) {
    event.preventDefault();
    toggleColorMode();
  } else if (key === "c" && !event.shiftKey) {
    window.dispatchEvent(new CustomEvent(COPY_CODE_EVENT));
  }
}

// One listener per page, also when a hot reload evaluates this module again.
const KEY_HANDLER = Symbol.for("iloveui.shell-keydown");
if (typeof window !== "undefined") {
  const host = window as Window & { [KEY_HANDLER]?: (event: KeyboardEvent) => void };
  const previous = host[KEY_HANDLER];
  if (previous) window.removeEventListener("keydown", previous);
  host[KEY_HANDLER] = onKeyDown;
  window.addEventListener("keydown", onKeyDown);
}

type SiteShellContextValue = {
  openPalette: () => void;
  openShortcuts: () => void;
  /** Starts loading the palette and shortcuts dialog; for pointerenter and focus on their triggers. */
  preloadDialogs: () => void;
};

const SHELL_ACTIONS: SiteShellContextValue = { openPalette, openShortcuts, preloadDialogs: dialogs.preload };

const SiteShellContext = createContext<SiteShellContextValue | null>(null);

export function useSiteShell() {
  const value = useContext(SiteShellContext);
  if (!value) throw new Error("useSiteShell must be used inside <SiteShell>");
  return value;
}

export function SiteShell({ children }: { children: ReactNode }) {
  const { palette, shortcuts } = useSyncExternalStore(
    subscribe,
    () => dialogState,
    () => CLOSED,
  );
  const Dialogs = dialogs.use();

  // Children's effects run first, so islands rendering during this first hydration still see it as hydration.
  useEffect(markHydrated, []);

  return (
    <SiteShellContext.Provider value={SHELL_ACTIONS}>
      {children}
      {Dialogs ? (
        <Dialogs.ShellDialogs
          paletteOpen={palette}
          onPaletteOpenChange={setPaletteOpen}
          shortcutsOpen={shortcuts}
          onShortcutsOpenChange={setShortcutsOpen}
        />
      ) : null}
      <PreviewBridge />
      <ThumbnailLoader />
    </SiteShellContext.Provider>
  );
}
