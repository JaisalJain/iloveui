"use client";

import { createContext, useContext, type ComponentProps, type KeyboardEvent } from "react";

// A single-choice segmented control with the markup and keyboard model of Radix ToggleGroup (type "single"): a
// radiogroup of buttons with a roving tab stop, arrow keys moving focus, Home and End, and Space or Enter choosing.
// It exists because these controls are visible on first paint: Radix ToggleGroup and its roving-focus machinery cost
// about 9 kB gzipped at load, this costs a few hundred bytes. Controls that only appear after an interaction (the
// accent swatches, the filter sheet) still use Radix ToggleGroup.

type SegmentsContextValue = { value: string; select: (value: string) => void };

const SegmentsContext = createContext<SegmentsContextValue | null>(null);

const STEP: Partial<Record<string, number>> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };

/** `value` must always match one item: the checked item is the group's tab stop. */
export function Segments({
  value,
  onValueChange,
  onKeyDown,
  children,
  ...props
}: Omit<ComponentProps<"div">, "defaultValue"> & { value: string; onValueChange: (value: string) => void }) {
  function moveFocus(event: KeyboardEvent<HTMLDivElement>) {
    onKeyDown?.(event);
    const items = [...event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="radio"]:not(:disabled)')];
    const index = items.findIndex((item) => item === document.activeElement);
    if (index === -1 || items.length === 0) return;
    const step = STEP[event.key];
    let next: number | null = null;
    if (step !== undefined) next = (index + step + items.length) % items.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = items.length - 1;
    if (next === null) return;
    event.preventDefault();
    items[next]?.focus();
  }

  return (
    <SegmentsContext.Provider value={{ value, select: onValueChange }}>
      <div {...props} role="radiogroup" onKeyDown={moveFocus}>
        {children}
      </div>
    </SegmentsContext.Provider>
  );
}

export function Segment({ value, onClick, ...props }: Omit<ComponentProps<"button">, "value"> & { value: string }) {
  const context = useContext(SegmentsContext);
  if (!context) throw new Error("<Segment> must be used inside <Segments>");
  const checked = context.value === value;
  return (
    <button
      {...props}
      type="button"
      role="radio"
      aria-checked={checked}
      data-state={checked ? "on" : "off"}
      tabIndex={checked ? 0 : -1}
      onClick={(event) => {
        onClick?.(event);
        context.select(value);
      }}
    />
  );
}
