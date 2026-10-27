"use client";

import { useEffect } from "react";
import {
  currentThemeCss,
  frameTargetOrigin,
  PREVIEW_FRAME_SELECTOR,
  postToFrames,
  SITE_MODE_FRAME_SELECTOR,
  storedThemeCss,
} from "@/lib/client/frames";
import { COLOR_MODE_EVENT, getColorMode } from "@/lib/client/theme-mode";
import { THEME_STORAGE_KEY } from "@/lib/theme-storage";
import { FRAME_SOURCE, PARENT_SOURCE } from "./protocol";

// Keeps preview frames in step with the site: light and dark for frames that follow the site, and the Theme Lab
// tokens for every frame that announces itself (frames also read both from storage before first paint, but storage
// can be unavailable). It reads the theme as CSS (live from Theme Lab once loaded, else as stored), so the shell never
// loads the token code for a visitor who has not changed the theme.
export function PreviewBridge() {
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const syncMode = () => postToFrames({ type: "mode", mode: getColorMode() }, SITE_MODE_FRAME_SELECTOR);

    function onMessage(event: MessageEvent) {
      const data: unknown = event.data;
      if (typeof data !== "object" || data === null || (data as { source?: unknown }).source !== FRAME_SOURCE) return;
      // Only frames on this page count; sandboxed thumbnails post from an opaque origin, so the window decides.
      const frame = [...document.querySelectorAll<HTMLIFrameElement>(PREVIEW_FRAME_SELECTOR)].find(
        (candidate) => candidate.contentWindow === event.source,
      );
      const target = frame?.contentWindow;
      if (!frame || !target) return;
      const origin = frameTargetOrigin(frame);
      const css = currentThemeCss();
      if (css !== null) target.postMessage({ source: PARENT_SOURCE, type: "theme", css }, origin);
      if (frame.dataset.previewMode === "site") {
        target.postMessage({ source: PARENT_SOURCE, type: "mode", mode: getColorMode() }, origin);
      }
    }

    // Another tab changed the theme. Once Theme Lab has loaded its store follows the change itself.
    function onStorage(event: StorageEvent) {
      if (event.key !== THEME_STORAGE_KEY) return;
      const css = storedThemeCss();
      if (css !== null) postToFrames({ type: "theme", css });
    }

    window.addEventListener(COLOR_MODE_EVENT, syncMode);
    window.addEventListener("storage", onStorage);
    media.addEventListener("change", syncMode);
    window.addEventListener("message", onMessage);
    return () => {
      window.removeEventListener(COLOR_MODE_EVENT, syncMode);
      window.removeEventListener("storage", onStorage);
      media.removeEventListener("change", syncMode);
      window.removeEventListener("message", onMessage);
    };
  }, []);

  return null;
}
