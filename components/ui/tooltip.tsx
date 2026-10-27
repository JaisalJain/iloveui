"use client";

import {
  cloneElement,
  useId,
  type FocusEvent,
  type HTMLAttributes,
  type PointerEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import { focusKeyProps, lazyModule } from "@/lib/client/lazy";

// Radix Tooltip (and its positioning engine) loads on the first pointerenter or focus on any tooltip trigger, not at
// page load. Until then each trigger renders as itself; the 400ms first-open delay hides the load, and a trigger
// that had focus when Radix arrived keeps it (see useCarriedFocus).
const tooltips = lazyModule(() => import("./tooltip-impl"));

/** For lazily loaded UI that is full of tooltips: start loading them along with it. */
export const preloadTooltips = tooltips.preload;

type TriggerElement = ReactElement<HTMLAttributes<HTMLElement> & { "data-focus-key"?: string }>;

export function Tooltip({
  content,
  children,
  side = "bottom",
  className,
}: {
  content: ReactNode;
  /** One element that accepts a ref and event handlers, as Radix's asChild trigger requires. */
  children: TriggerElement;
  side?: "top" | "right" | "bottom" | "left";
  /** Extra classes for the bubble; they add to its styles and must not override them. */
  className?: string;
}) {
  const loaded = tooltips.use();
  const focusKey = focusKeyProps(`tooltip${useId()}`);
  if (!loaded) {
    return cloneElement(children, {
      ...focusKey,
      onPointerEnter: (event: PointerEvent<HTMLElement>) => {
        tooltips.preload();
        children.props.onPointerEnter?.(event);
      },
      onFocus: (event: FocusEvent<HTMLElement>) => {
        tooltips.preload();
        children.props.onFocus?.(event);
      },
    });
  }
  return (
    <loaded.TooltipImpl content={content} side={side} className={className}>
      {cloneElement(children, focusKey)}
    </loaded.TooltipImpl>
  );
}
