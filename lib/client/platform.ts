"use client";

import { useSyncExternalStore } from "react";

function isApplePlatform() {
  const platform =
    (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform ?? navigator.platform;
  return /mac|iphone|ipad|ipod/i.test(platform);
}

const noop = () => () => {};

/** "⌘" on Apple platforms, "Ctrl" elsewhere. The server renders "⌘"; other platforms correct it on hydration. */
export function useModKey(): "⌘" | "Ctrl" {
  return useSyncExternalStore(
    noop,
    () => (isApplePlatform() ? "⌘" : "Ctrl"),
    () => "⌘",
  );
}
