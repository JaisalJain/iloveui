"use client";

import { useSyncExternalStore } from "react";

// Light/dark for the site chrome. Theme Lab (brand tokens for previews) is separate and lives under iloveui.theme.
export type ColorMode = "light" | "dark";

export const COLOR_MODE_STORAGE_KEY = "iloveui.mode";
export const COLOR_MODE_EVENT = "iloveui:mode";

const DARK_QUERY = "(prefers-color-scheme: dark)";

function explicitMode(): ColorMode | null {
  const value = document.documentElement.getAttribute("data-theme");
  return value === "light" || value === "dark" ? value : null;
}

export function getColorMode(): ColorMode {
  return explicitMode() ?? (window.matchMedia(DARK_QUERY).matches ? "dark" : "light");
}

export function setColorMode(mode: ColorMode) {
  document.documentElement.setAttribute("data-theme", mode);
  try {
    window.localStorage.setItem(COLOR_MODE_STORAGE_KEY, mode);
  } catch {
    // Storage can be unavailable (private mode, blocked cookies); the attribute still applies for this visit.
  }
  window.dispatchEvent(new CustomEvent<ColorMode>(COLOR_MODE_EVENT, { detail: mode }));
}

export function toggleColorMode() {
  setColorMode(getColorMode() === "dark" ? "light" : "dark");
}

function subscribe(onChange: () => void) {
  const media = window.matchMedia(DARK_QUERY);
  media.addEventListener("change", onChange);
  window.addEventListener(COLOR_MODE_EVENT, onChange);
  return () => {
    media.removeEventListener("change", onChange);
    window.removeEventListener(COLOR_MODE_EVENT, onChange);
  };
}

/** The effective mode. Server render assumes dark, the default for most visitors; the client corrects it. */
export function useColorMode(): ColorMode {
  return useSyncExternalStore(subscribe, getColorMode, () => "dark");
}

/** The inline script that applies a stored choice before first paint (kept as a string literal on purpose). */
export const COLOR_MODE_BOOT_SCRIPT = `(function(){try{if(location.pathname.indexOf('/preview/')===0)return;var m=localStorage.getItem('${COLOR_MODE_STORAGE_KEY}');if(m==='light'||m==='dark')document.documentElement.setAttribute('data-theme',m)}catch(e){}})();`;
