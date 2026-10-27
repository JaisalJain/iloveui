"use client";

import { clsx } from "clsx";
import { Tooltip as TooltipPrimitive } from "radix-ui";
import { useSyncExternalStore, type ReactElement, type ReactNode } from "react";
import { takeQuietFocus, useCarriedFocus } from "@/lib/client/lazy";

const FIRST_DELAY = 400;
const SKIP_DELAY = 500;

// Every tooltip has its own Radix provider (it loads after the page has rendered), so the site-wide rule lives here:
// 400ms before the first tooltip, then instant for 500ms after one closes.
let warm = false;
let coolDown: number | undefined;
const listeners = new Set<() => void>();

function setWarm(next: boolean) {
  if (warm === next) return;
  warm = next;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function onOpenChange(open: boolean) {
  window.clearTimeout(coolDown);
  if (open) return;
  setWarm(true);
  coolDown = window.setTimeout(() => setWarm(false), SKIP_DELAY);
}

export function TooltipImpl({
  content,
  children,
  side,
  className,
}: {
  content: ReactNode;
  children: ReactElement;
  side: "top" | "right" | "bottom" | "left";
  className?: string;
}) {
  const instant = useSyncExternalStore(
    subscribe,
    () => warm,
    () => false,
  );
  useCarriedFocus();
  return (
    <TooltipPrimitive.Provider delayDuration={instant ? 0 : FIRST_DELAY} skipDelayDuration={SKIP_DELAY}>
      <TooltipPrimitive.Root onOpenChange={onOpenChange}>
        <TooltipPrimitive.Trigger
          asChild
          onFocus={(event) => {
            // Focus handed over from a stand-in a pointer had focused: no tooltip, as Radix does for pointer focus.
            if (takeQuietFocus()) event.preventDefault();
          }}
        >
          {children}
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={side}
            sideOffset={6}
            collisionPadding={8}
            className={clsx(
              "z-50 flex items-center gap-2 rounded-control border border-hairline bg-raised px-2 py-1 text-12 text-fg shadow-lg",
              "origin-(--radix-tooltip-content-transform-origin) data-[state=closed]:animate-pop-out",
              // A tooltip opened within the skip window appears at once, as Radix's own instant-open would.
              !instant && "data-[state=delayed-open]:animate-pop-in",
              className,
            )}
          >
            {content}
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
