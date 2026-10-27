"use client";

import { useLayoutEffect, type ReactNode } from "react";
import { deferClick, deferNavigationKey, lazyModule } from "@/lib/client/lazy";
import { DOCK_STORAGE_KEY, THEME_STORAGE_KEY } from "@/lib/theme-storage";

const dock = lazyModule(() => import("./dock"));

/** Set before first paint (see ThemeLabDock) and on mount while the real dock loads: the static one is hidden. */
export const PENDING_ATTRIBUTE = "data-theme-lab-pending";

/** A visitor who has changed the theme or the dock sees their own values, so the real dock loads at once for them. */
export function hasStoredLabState() {
  try {
    return (
      window.localStorage.getItem(THEME_STORAGE_KEY) !== null || window.localStorage.getItem(DOCK_STORAGE_KEY) !== null
    );
  } catch {
    return false;
  }
}

/**
 * Shows the server-rendered static dock (its children) until the real one is wanted: the first pointerenter, focus
 * or click inside it, a stored theme or dock state, or a change from another tab. Focus and a click that arrived
 * before the real dock carry over to it (see lib/client/lazy).
 */
export function ThemeLabActivator({ children }: { children: ReactNode }) {
  const Dock = dock.use();

  useLayoutEffect(() => {
    if (Dock) {
      document.documentElement.removeAttribute(PENDING_ATTRIBUTE);
      return;
    }
    if (hasStoredLabState()) {
      document.documentElement.setAttribute(PENDING_ATTRIBUTE, "");
      dock.preload();
      return;
    }
    function onStorage(event: StorageEvent) {
      if (event.key === THEME_STORAGE_KEY || event.key === DOCK_STORAGE_KEY) dock.preload();
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [Dock]);

  if (Dock) return <Dock.ThemeLabDockClient />;

  return (
    <div
      className="contents [[data-theme-lab-pending]_&]:hidden"
      onPointerEnter={dock.preload}
      onFocus={dock.preload}
      onClickCapture={(event) => {
        deferClick(event.target);
        dock.preload();
      }}
      onKeyDownCapture={(event) => {
        deferNavigationKey(event);
        dock.preload();
      }}
    >
      {children}
    </div>
  );
}
