import { getColorMode } from "./theme-mode";

// Thumbnails are sandboxed frames with an opaque origin, which Chrome gives an HTTP cache partition of its own, so every
// thumbnail fetches its stylesheet and fonts again. They load only after the page itself has loaded and gone idle, and
// only near the viewport, so they never compete with the page's first paint.

/** Card thumbnails (DesignCard) still waiting for a src. The hero wall's frames use data-src and its own controller. */
export const CARD_THUMB_SELECTOR = "iframe[data-thumb]:not([src])";

/** Runs the callback after the page's own load and an idle moment; returns a function that cancels it. */
export function afterLoadAndIdle(callback: () => void): () => void {
  // Safari has no requestIdleCallback; a short timeout stands in for it.
  const hasIdle = typeof (window.requestIdleCallback as unknown) === "function";
  let cancelled = false;
  let idleHandle: number | null = null;
  const idle = () => {
    if (cancelled) return;
    idleHandle = hasIdle ? window.requestIdleCallback(callback, { timeout: 1500 }) : window.setTimeout(callback, 200);
  };
  if (document.readyState === "complete") idle();
  else window.addEventListener("load", idle, { once: true });
  return () => {
    cancelled = true;
    window.removeEventListener("load", idle);
    if (idleHandle === null) return;
    if (hasIdle) window.cancelIdleCallback(idleHandle);
    else window.clearTimeout(idleHandle);
  };
}

/** Points a thumbnail frame at its document, marking it data-loaded once it has rendered. */
export function loadThumbnail(frame: HTMLIFrameElement, src: string) {
  frame.addEventListener("load", () => frame.setAttribute("data-loaded", ""), { once: true });
  // The thumbnail reads the mode from its URL before first paint, so it never flashes the other theme.
  frame.src = `${src}?mode=${getColorMode()}`;
}
