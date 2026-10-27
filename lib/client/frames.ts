"use client";

import { PARENT_SOURCE, type ParentMessage } from "@/components/preview/protocol";
import { THEME_STORAGE_KEY } from "@/lib/theme-storage";

// Preview frame plumbing with no theme math, so the site shell can keep frames in step without loading Theme Lab's
// token code (lib/theme, lib/color) on pages where nobody has touched the theme.

/** Every preview iframe carries data-preview; frames that follow the site's light/dark also carry
 * data-preview-mode="site" (cards, the hero wall). The preview stage sets its own mode. */
export const PREVIEW_FRAME_SELECTOR = "iframe[data-preview]";
export const SITE_MODE_FRAME_SELECTOR = 'iframe[data-preview][data-preview-mode="site"]';

/** Sandboxed thumbnails have an opaque origin, which only the "*" target reaches; messages carry no secrets. */
export function frameTargetOrigin(frame: HTMLIFrameElement): string {
  return frame.hasAttribute("sandbox") && !frame.sandbox.contains("allow-same-origin") ? "*" : window.location.origin;
}

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
export type FrameMessage = DistributiveOmit<ParentMessage, "source">;

/** Sends a message to preview frames (all of them by default) on this page. */
export function postToFrames(message: FrameMessage, selector: string = PREVIEW_FRAME_SELECTOR) {
  for (const frame of document.querySelectorAll<HTMLIFrameElement>(selector)) {
    frame.contentWindow?.postMessage({ source: PARENT_SOURCE, ...message }, frameTargetOrigin(frame));
  }
}

let liveThemeCss: (() => string) | null = null;

/** Called by the Theme Lab store when it loads: from then on its state is the source of the theme CSS. */
export function registerThemeSource(source: () => string) {
  liveThemeCss = source;
}

/** The theme CSS stored with the theme (Theme Lab saves its state plus its CSS). */
export function storedThemeCss(): string | null {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(THEME_STORAGE_KEY) ?? "null");
    const css = typeof parsed === "object" && parsed !== null ? (parsed as { css?: unknown }).css : null;
    return typeof css === "string" ? css : null;
  } catch {
    return null;
  }
}

/**
 * The CSS a preview frame needs for the current theme: the live store once Theme Lab has loaded, else the stored
 * theme, else null (the default theme, which every frame already renders).
 */
export function currentThemeCss(): string | null {
  return liveThemeCss ? liveThemeCss() : storedThemeCss();
}
