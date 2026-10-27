"use client";

import { Pause, Play } from "lucide-react";
import { useEffect, useState } from "react";
import { getColorMode } from "@/lib/client/theme-mode";

/** Thumbnails start loading this far beyond the wall's visible edge, so a tile is ready before it drifts in. */
const LOAD_MARGIN = "40% 0px";
/** Where a keyboard-focused tile is brought to, as a share of the wall's height from its top. */
const FOCUS_ANCHOR = 0.18;

/** After the page's own load and an idle moment: the headline and the page's scripts come before any thumbnail. */
function afterLoadAndIdle(callback: () => void): () => void {
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

/** Moves a column's drift so the focused tile sits near the top of the wall (the wall is paused while focused). */
function bringIntoView(wall: HTMLElement, tile: HTMLElement) {
  const track = tile.closest<HTMLElement>("[data-wall-track]");
  const column = track?.parentElement;
  const animation = track?.getAnimations()[0];
  if (!track || !column || !animation) return;
  const timing = animation.effect?.getComputedTiming();
  const duration = Number(timing?.duration);
  // The column's staggered start is a negative delay, which runs the effect ahead of the animation's own clock.
  const delay = Number(timing?.delay ?? 0);
  const setHeight = track.offsetHeight / 2;
  const item = tile.parentElement;
  if (!Number.isFinite(duration) || duration <= 0 || setHeight <= 0 || !item) return;
  // The drift translates the track between 0 and -setHeight. Only the original set is focusable, so a tile near the
  // top of its set stops at 0 rather than wrapping round (which would show its aria-hidden clone instead).
  const wanted = wall.clientHeight * FOCUS_ANCHOR - column.offsetTop - item.offsetTop;
  const translate = Math.min(0, Math.max(-setHeight + 1, wanted));
  const share = -translate / setHeight;
  const progress = getComputedStyle(track).animationDirection === "reverse" ? 1 - share : share;
  // Active time = currentTime - delay; any whole number of cycles lands on the same frame, so keep it non-negative.
  animation.currentTime = (((progress * duration + delay) % duration) + duration) % duration;
}

/**
 * Runs the hero wall: loads thumbnails lazily, pauses the drift offscreen and in a hidden tab, keeps a focused tile
 * in view, and renders the pause button (moving content that lasts more than five seconds needs one, WCAG 2.2.2).
 */
export function HeroWallController({ wallId }: { wallId: string }) {
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const wall = document.getElementById(wallId);
    if (!wall) return;
    const frames = [...wall.querySelectorAll<HTMLIFrameElement>("iframe[data-src]")];

    const loader = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const frame = entry.target as HTMLIFrameElement;
          loader.unobserve(frame);
          const src = frame.dataset.src;
          if (!src) continue;
          frame.addEventListener("load", () => frame.setAttribute("data-loaded", ""), { once: true });
          // The thumbnail reads the mode from its URL before first paint, so it never flashes the other theme.
          frame.src = `${src}?mode=${getColorMode()}`;
        }
      },
      { root: wall, rootMargin: LOAD_MARGIN },
    );

    let ready = false;
    let onscreen = false;
    const startLoading = () => {
      if (!ready || !onscreen) return;
      for (const frame of frames) loader.observe(frame);
    };
    const cancelIdle = afterLoadAndIdle(() => {
      ready = true;
      startLoading();
    });

    const visibility = new IntersectionObserver(([entry]) => {
      if (!entry) return;
      const wasOnscreen = onscreen;
      onscreen = entry.isIntersecting;
      wall.toggleAttribute("data-offscreen", !onscreen);
      if (onscreen && !wasOnscreen) startLoading();
    });
    visibility.observe(wall);

    const onVisibilityChange = () => wall.toggleAttribute("data-tab-hidden", document.hidden);
    onVisibilityChange();
    document.addEventListener("visibilitychange", onVisibilityChange);

    const onFocusIn = (event: FocusEvent) => {
      const tile = event.target instanceof HTMLElement ? event.target.closest<HTMLElement>("[data-wall-tile]") : null;
      if (!tile) return;
      bringIntoView(wall, tile);
      // The browser scrolled the page for the tile's old position; settle it for the new one (its scroll margin
      // keeps it clear of the sticky header).
      tile.scrollIntoView({ block: "nearest" });
    };
    wall.addEventListener("focusin", onFocusIn);

    return () => {
      cancelIdle();
      loader.disconnect();
      visibility.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      wall.removeEventListener("focusin", onFocusIn);
    };
  }, [wallId]);

  useEffect(() => {
    document.getElementById(wallId)?.toggleAttribute("data-paused", paused);
  }, [wallId, paused]);

  return (
    <button
      type="button"
      onClick={() => setPaused((value) => !value)}
      data-wall-toggle=""
      className={
        "absolute right-4 bottom-4 z-10 inline-flex h-8 items-center gap-2 rounded-full border border-hairline " +
        "bg-surface px-3 text-12 font-medium text-fg shadow-sm transition-colors duration-160 ease-site " +
        "hover:bg-raised motion-reduce:hidden sm:right-6 sm:bottom-6 pointer-coarse:h-10"
      }
    >
      {paused ? <Play size={14} strokeWidth={1.5} aria-hidden /> : <Pause size={14} strokeWidth={1.5} aria-hidden />}
      {paused ? "Play wall" : "Pause wall"}
    </button>
  );
}
