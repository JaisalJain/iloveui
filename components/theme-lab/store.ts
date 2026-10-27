"use client";

import { useSyncExternalStore } from "react";
import { setTheme } from "@/lib/client/theme-lab";
import type { ThemeState } from "@/lib/theme";
import { createPatchScheduler, DOCK_STORAGE_KEY, initialDockView, type DockView } from "./logic";

let scheduler: ReturnType<typeof createPatchScheduler<ThemeState>> | null = null;

function getScheduler() {
  scheduler ??= createPatchScheduler<ThemeState>(
    (patch) => setTheme((current) => ({ ...current, ...patch })),
    (callback) => window.requestAnimationFrame(callback),
    (id) => window.cancelAnimationFrame(id),
  );
  return scheduler;
}

/** Continuous input (a slider drag): coalesced to one theme update per animation frame. */
export function updateThemeLive(patch: Partial<ThemeState>) {
  getScheduler().schedule(patch);
}

/** Discrete input (a click, a committed value): applied now, after anything still pending. */
export function updateTheme(patch: Partial<ThemeState>) {
  const queue = getScheduler();
  queue.schedule(patch);
  queue.flush();
}

// The dock's expanded or collapsed view: remembered under iloveui.themelab, else by screen width.
const WIDE_QUERY = "(min-width: 1024px)";
const dockListeners = new Set<() => void>();

function readDockView(): DockView {
  let stored: string | null = null;
  try {
    stored = window.localStorage.getItem(DOCK_STORAGE_KEY);
  } catch {
    // Storage unavailable: fall back to the width default.
  }
  return initialDockView(stored, window.matchMedia(WIDE_QUERY).matches);
}

export function setDockView(view: DockView) {
  try {
    window.localStorage.setItem(DOCK_STORAGE_KEY, view);
  } catch {
    // The choice still holds for this page; it just is not remembered.
  }
  for (const listener of dockListeners) listener();
}

function subscribeDock(listener: () => void) {
  const media = window.matchMedia(WIDE_QUERY);
  const onStorage = (event: StorageEvent) => {
    if (event.key === DOCK_STORAGE_KEY) listener();
  };
  dockListeners.add(listener);
  media.addEventListener("change", listener);
  window.addEventListener("storage", onStorage);
  return () => {
    dockListeners.delete(listener);
    media.removeEventListener("change", listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** null during the server render and hydration: the dock mounts once the client knows the remembered view. */
export function useDockView(): DockView | null {
  return useSyncExternalStore(subscribeDock, readDockView, () => null);
}
