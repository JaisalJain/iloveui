"use client";

import { useLayoutEffect, useSyncExternalStore, type KeyboardEvent } from "react";

/**
 * A module loaded on intent (pointerenter, focus, a key or a click) instead of at page load, so it never counts
 * against the first load. Components read it with `use()` and render a light stand-in until it arrives.
 */
export type LazyModule<T> = {
  /** Starts the import once; later calls return the same promise. */
  load: () => Promise<T>;
  /** `load()` for event handlers: a failed import is retried on the next intent. */
  preload: () => void;
  /** The module once loaded, else null. Re-renders when it arrives. */
  use: () => T | null;
};

const FOCUS_KEY = "data-focus-key" as const;

// What the stand-ins received before their real controls arrived, handed over by useCarriedFocus.
let carriedFocus: { key: string; visible: boolean } | null = null;
let deferredClickKey: string | null = null;
let deferredKeys: { key: string; init: KeyboardEventInit }[] = [];
let quietFocus = false;

// A stand-in swapped out between pointerdown and click would swallow the click, so swaps wait for the pointer.
let pointerDown = false;
let pointerTracking = false;
const waitingForPointer: (() => void)[] = [];

function trackPointer() {
  if (pointerTracking) return;
  pointerTracking = true;
  const options = { capture: true, passive: true } as const;
  window.addEventListener("pointerdown", () => (pointerDown = true), options);
  const release = () => {
    pointerDown = false;
    // After the click that follows this pointerup.
    window.setTimeout(() => {
      if (pointerDown) return;
      for (const run of waitingForPointer.splice(0)) run();
    });
  };
  window.addEventListener("pointerup", release, options);
  window.addEventListener("pointercancel", release, options);
}

function whenPointerFree(run: () => void) {
  if (pointerDown) waitingForPointer.push(run);
  else run();
}

export function lazyModule<T>(loader: () => Promise<T>): LazyModule<T> {
  let loaded: T | null = null;
  let pending: Promise<T> | null = null;
  const listeners = new Set<() => void>();

  function load() {
    trackPointer();
    pending ??= loader().then(
      (module) =>
        new Promise<T>((resolve) =>
          whenPointerFree(() => {
            // The stand-in that has focus is about to be replaced: the real control with its key takes the focus.
            const active = document.activeElement;
            const key = active?.getAttribute(FOCUS_KEY);
            carriedFocus = key ? { key, visible: active?.matches(":focus-visible") ?? false } : null;
            loaded = module;
            for (const listener of listeners) listener();
            resolve(module);
          }),
        ),
      (error: unknown) => {
        pending = null;
        throw error;
      },
    );
    return pending;
  }

  function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  return {
    load,
    preload: () => {
      load().catch(() => undefined);
    },
    use: () =>
      useSyncExternalStore(
        subscribe,
        () => loaded,
        () => null,
      ),
  };
}

/** Props that let a lazily loaded control take over focus from the stand-in it replaces. */
export function focusKeyProps(key: string): { "data-focus-key": string } {
  return { [FOCUS_KEY]: key };
}

function focusKeyOf(target: EventTarget | null) {
  const element = target instanceof Element ? target.closest(`[${FOCUS_KEY}]`) : null;
  return element?.getAttribute(FOCUS_KEY) ?? null;
}

/** A click on a static stand-in before its real control has loaded: replayed on the real control when it mounts. */
export function deferClick(target: EventTarget | null) {
  deferredClickKey = focusKeyOf(target);
}

const NAVIGATION_KEYS = new Set([
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "Home",
  "End",
  "PageUp",
  "PageDown",
]);

/**
 * Arrow, Home, End and Page keys pressed on a static stand-in (a slider, a radio group) before its real control has
 * loaded: kept, and replayed on the real control when it mounts. Other keys keep their native behavior.
 */
export function deferNavigationKey(event: KeyboardEvent) {
  const key = focusKeyOf(event.target);
  if (!key || !NAVIGATION_KEYS.has(event.key)) return;
  event.preventDefault();
  deferredKeys.push({
    key,
    init: { key: event.key, code: event.code, shiftKey: event.shiftKey, bubbles: true, cancelable: true },
  });
}

/**
 * For a tooltip trigger receiving carried focus: true when that focus came from a pointer, so the tooltip should
 * not open as it would for keyboard focus. Reading it clears it.
 */
export function takeQuietFocus() {
  const quiet = quietFocus;
  quietFocus = false;
  return quiet;
}

function byFocusKey(key: string) {
  return document.querySelector<HTMLElement>(`[${FOCUS_KEY}="${CSS.escape(key)}"]`);
}

/**
 * Call once at the root of a lazily loaded component: if its stand-in had focus when the module arrived, the
 * element with the same focus key gets it back in the same commit, so keyboard users never lose their place; a
 * click or navigation keys the stand-in received are replayed on the real control.
 */
export function useCarriedFocus() {
  useLayoutEffect(() => {
    const focus = carriedFocus;
    const clickKey = deferredClickKey;
    const keys = deferredKeys;
    carriedFocus = null;
    deferredClickKey = null;
    deferredKeys = [];
    function moveFocus(onlyIfLost: boolean) {
      const target = focus ? byFocusKey(focus.key) : null;
      if (!focus || !target || target === document.activeElement) return;
      // The retry never takes focus from where the new control put it (an opened menu focuses itself).
      if (onlyIfLost && document.activeElement !== document.body && document.activeElement !== null) return;
      quietFocus = !focus.visible;
      target.focus();
      quietFocus = false;
    }
    moveFocus(false);
    // Some controls are not focusable in their first commit (Radix Slider shows its thumb once it has measured it,
    // in a render React runs straight after this one), so try again once that has run, then replay the input.
    queueMicrotask(() => {
      moveFocus(true);
      if (clickKey) byFocusKey(clickKey)?.click();
      for (const { key, init } of keys) byFocusKey(key)?.dispatchEvent(new KeyboardEvent("keydown", init));
    });
  }, []);
}
