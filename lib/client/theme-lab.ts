"use client";

import { useSyncExternalStore } from "react";
import { DEFAULT_THEME, normalizeTheme, THEME_STORAGE_KEY, themeCss, type ThemeState } from "@/lib/theme";
import { postToFrames, registerThemeSource } from "./frames";

export { frameTargetOrigin, PREVIEW_FRAME_SELECTOR, postToFrames, SITE_MODE_FRAME_SELECTOR } from "./frames";

// Theme Lab state for the whole site. One store, persisted under iloveui.theme as the state plus its CSS (preview
// documents read that CSS before first paint), and pushed to every preview frame by postMessage on each change.

let theme: ThemeState = DEFAULT_THEME;
let loaded = false;
const listeners = new Set<() => void>();

function read(): ThemeState {
  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
    return raw ? normalizeTheme(JSON.parse(raw)) : DEFAULT_THEME;
  } catch {
    // Unavailable storage or unreadable JSON: the defaults apply.
    return DEFAULT_THEME;
  }
}

function load() {
  if (loaded) return;
  loaded = true;
  theme = read();
  // Another tab changed the theme: follow it.
  window.addEventListener("storage", (event) => {
    if (event.key !== THEME_STORAGE_KEY) return;
    theme = read();
    postToFrames({ type: "theme", css: themeCss(theme) });
    for (const listener of listeners) listener();
  });
}

// Preview frames that announce themselves after this point get the live theme (see PreviewBridge).
registerThemeSource(() => themeCss(getTheme()));

export function getTheme(): ThemeState {
  load();
  return theme;
}

export function setTheme(next: ThemeState | ((current: ThemeState) => ThemeState)) {
  load();
  theme = normalizeTheme(typeof next === "function" ? next(theme) : next);
  const css = themeCss(theme);
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify({ ...theme, css }));
  } catch {
    // Storage can be unavailable; the theme still applies to this page.
  }
  postToFrames({ type: "theme", css });
  for (const listener of listeners) listener();
}

export function resetTheme() {
  setTheme(DEFAULT_THEME);
}

function subscribe(listener: () => void) {
  load();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** The current Theme Lab state. The server render (and first client render) use the defaults. */
export function useThemeLab(): ThemeState {
  return useSyncExternalStore(subscribe, getTheme, () => DEFAULT_THEME);
}
