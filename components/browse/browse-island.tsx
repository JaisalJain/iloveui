"use client";

import { lazy, Suspense, useEffect, useRef, type ComponentType } from "react";
import { isHydrated } from "@/lib/client/hydration";
import { FORMAT_STORAGE_KEY } from "@/lib/format-preference";
import type { BrowseExplorerProps } from "./browse-explorer";
import { ExplorerSkeleton } from "./browse-states";

// The browse explorer (filters, search, sorting, the grid and its cards) is server-rendered HTML that hydrates on
// intent: the first pointer, focus, key or click inside it. Until then React leaves the server markup as it is,
// thumbnails included, so a first visit runs none of the explorer's code. The explorer loads at once when the URL
// carries filters or a format, or a format preference is stored, and on client navigations (no server HTML to keep).
//
// React streams a server-rendered Suspense boundary this large after the rest of the page (it fills in as soon as
// that part of the HTML is parsed), so visitors without JavaScript get the same markup in place from <noscript>, and
// the skeleton fallback holds the explorer's place until it arrives.

let openGate: () => void = () => undefined;
const gate =
  typeof window === "undefined"
    ? Promise.resolve()
    : new Promise<void>((resolve) => {
        openGate = resolve;
      });

const BrowseExplorer = lazy(() =>
  gate.then(() => import("./browse-explorer")).then((module) => ({ default: module.BrowseExplorer })),
);

// The server renders the explorer synchronously, so its HTML sits in place in the document instead of streaming in
// after the footer. Next compiles `typeof window` to a constant, so the browser bundle drops this branch and its import.
const ServerExplorer: ComponentType<BrowseExplorerProps> | null =
  typeof window === "undefined"
    ? // eslint-disable-next-line @typescript-eslint/no-require-imports -- synchronous on the server only, see above.
      (require("./browse-explorer") as typeof import("./browse-explorer")).BrowseExplorer
    : null;

const INTENT_EVENTS = ["pointerover", "focusin", "keydown", "touchstart", "click"] as const;

let hydratedExplorer = false;
let pendingClick: HTMLElement | null = null;

/**
 * Called by the explorer once it has hydrated. React drops a click that lands on markup it has not hydrated yet, so
 * a button clicked in that moment is clicked again now (links already navigated on their own).
 */
function onExplorerHydrated() {
  hydratedExplorer = true;
  const target = pendingClick;
  pendingClick = null;
  if (target?.isConnected) target.click();
}

function hasStoredFormat() {
  try {
    return window.localStorage.getItem(FORMAT_STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}

export function BrowseIsland(props: BrowseExplorerProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  if (isHydrated()) openGate();

  useEffect(() => {
    if (hydratedExplorer) return;
    if (window.location.search || hasStoredFormat()) {
      openGate();
      return;
    }
    // Capture on window: React stops events aimed at markup it has not hydrated before they reach the page.
    function onIntent(event: Event) {
      if (hydratedExplorer) return;
      const wrapper = wrapperRef.current;
      if (!wrapper || !(event.target instanceof Element) || !wrapper.contains(event.target)) return;
      openGate();
      if (event.type === "click" && !event.target.closest("a")) {
        pendingClick = event.target.closest<HTMLElement>("button, [role='radio'], [role='switch']");
      }
    }
    for (const type of INTENT_EVENTS) window.addEventListener(type, onIntent, { capture: true, passive: true });
    return () => {
      for (const type of INTENT_EVENTS) window.removeEventListener(type, onIntent, { capture: true });
    };
  }, []);

  return (
    <div ref={wrapperRef} className="contents">
      <noscript>{ServerExplorer ? <ServerExplorer {...props} /> : null}</noscript>
      <Suspense fallback={<ExplorerSkeleton />}>
        {ServerExplorer ? <ServerExplorer {...props} /> : <BrowseExplorer {...props} onHydrated={onExplorerHydrated} />}
      </Suspense>
    </div>
  );
}
