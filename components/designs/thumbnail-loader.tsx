"use client";

import { useEffect } from "react";
import { afterLoadAndIdle, CARD_THUMB_SELECTOR, loadThumbnail } from "@/lib/client/thumbnails";

/** Card thumbnails start loading this far below the viewport, so one is ready by the time it scrolls in. */
const LOAD_MARGIN = "50% 0px";

/**
 * Loads card thumbnails once the page has loaded and gone idle, each as it nears the viewport. Native lazy loading
 * starts nearly every frame in a grid of 24 at once, ahead of the page's own first paint. Cards that render later
 * (filters, Load more, client navigation) are picked up as they appear.
 */
export function ThumbnailLoader() {
  useEffect(() => {
    let loader: IntersectionObserver | null = null;
    let mutations: MutationObserver | null = null;
    const observeWaiting = () => {
      for (const frame of document.querySelectorAll<HTMLIFrameElement>(CARD_THUMB_SELECTOR)) loader?.observe(frame);
    };
    const cancelIdle = afterLoadAndIdle(() => {
      loader = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            const frame = entry.target as HTMLIFrameElement;
            loader?.unobserve(frame);
            const src = frame.dataset.thumb;
            if (src) loadThumbnail(frame, src);
          }
        },
        { rootMargin: LOAD_MARGIN },
      );
      observeWaiting();
      mutations = new MutationObserver(observeWaiting);
      mutations.observe(document.body, { childList: true, subtree: true });
    });
    return () => {
      cancelIdle();
      loader?.disconnect();
      mutations?.disconnect();
    };
  }, []);

  return null;
}
