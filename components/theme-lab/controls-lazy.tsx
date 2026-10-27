"use client";

import { clsx } from "clsx";
import { Check, TriangleAlert, X } from "lucide-react";
import { Dialog, DropdownMenu, Popover, Slider, ToggleGroup } from "radix-ui";
import { useId, useRef, useState, type FormEvent, type RefObject } from "react";
import { preloadTooltips, Tooltip } from "@/components/ui/tooltip";
import { focusKeyProps, useCarriedFocus } from "@/lib/client/lazy";
import { useThemeLab } from "@/lib/client/theme-lab";
import { parseHex, readableForeground } from "@/lib/color";
import { ACCENT_PRESETS, FONTS, RADIUS_RANGE, type FontId } from "@/lib/theme";
import { DensityControl, NeutralControl, ResetButton, SheetField, useOpenRequest } from "./controls";
import {
  accentTriggerClasses,
  AccentTriggerContent,
  FONT_PREVIEW_FAMILY,
  fontTriggerClasses,
  FontTriggerContent,
  LAB_KEYS,
  RadiusFrame,
  radiusRootClasses,
  radiusThumbClasses,
  radiusTrackClasses,
  sheetSegmentItem,
  Swatch,
  type Layout,
} from "./views";
import { contrastWarning, parseHexInput } from "./logic";
import { updateTheme, updateThemeLive } from "./store";

// Theme Lab's on-demand half (see ./controls): the controls built on Radix Popover, Slider, DropdownMenu and Dialog.

// The accent swatches carry tooltips: start loading them now, so they never swap in under an open popover.
preloadTooltips();

const popoverSurface = clsx(
  "pointer-events-auto z-50 rounded-card border border-hairline bg-surface text-fg shadow-lg outline-hidden",
  "data-[state=closed]:animate-pop-out data-[state=open]:animate-pop-in",
);

// Accent ---------------------------------------------------------------------------------------------------------

function AccentPanel({ layout }: { layout: Layout }) {
  const theme = useThemeLab();
  const [draft, setDraft] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputId = useId();
  const errorId = useId();
  const warningId = useId();
  const selected = ACCENT_PRESETS.find((preset) => preset.hex === theme.accent)?.id ?? "";
  const warning = contrastWarning(theme);
  const value = draft ?? theme.accent;
  const parsed = parseHexInput(value);
  const fieldHeight = layout === "sheet" ? "h-10" : "h-8 pointer-coarse:h-10";

  function commit() {
    if (draft === null) return true;
    const result = parseHexInput(draft);
    if (!result.ok) {
      setError(result.error);
      return false;
    }
    updateTheme({ accent: result.hex });
    setDraft(null);
    setError(null);
    return true;
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    commit();
  }

  return (
    <div className="flex flex-col gap-3">
      <ToggleGroup.Root
        type="single"
        value={selected}
        aria-label="Accent presets"
        onValueChange={(id) => {
          const preset = ACCENT_PRESETS.find((candidate) => candidate.id === id);
          if (!preset) return;
          updateTheme({ accent: preset.hex });
          setDraft(null);
          setError(null);
        }}
        className={clsx("grid", layout === "bar" ? "grid-cols-8 gap-1.5" : "grid-cols-4 gap-2")}
      >
        {ACCENT_PRESETS.map((preset) => {
          const item = (
            <ToggleGroup.Item
              key={preset.id}
              value={preset.id}
              aria-label={`${preset.name} ${preset.hex}`}
              className={clsx(
                "group/swatch relative inline-flex items-center justify-center rounded-control",
                "transition-transform duration-160 ease-site active:scale-95",
                "aria-checked:ring-2 aria-checked:ring-fg aria-checked:ring-offset-2 aria-checked:ring-offset-surface",
                layout === "bar" ? "size-7 pointer-coarse:size-10" : "h-10 w-full",
              )}
              style={{ backgroundColor: preset.hex, color: readableForeground(parseHex(preset.hex) ?? [0, 0, 0]) }}
            >
              <span aria-hidden className="absolute inset-0 rounded-control shadow-[inset_0_0_0_1px_rgb(0_0_0/0.12)]" />
              {preset.id === selected ? <Check size={14} strokeWidth={2} aria-hidden /> : null}
            </ToggleGroup.Item>
          );
          return layout === "bar" ? (
            <Tooltip
              key={preset.id}
              side="top"
              content={<span className="font-mono">{`${preset.name} ${preset.hex}`}</span>}
            >
              {item}
            </Tooltip>
          ) : (
            item
          );
        })}
      </ToggleGroup.Root>

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-1.5">
        <label htmlFor={inputId} className="text-12 text-muted">
          Custom hex
        </label>
        <div className="flex gap-2">
          <div className="relative min-w-0 flex-1">
            <Swatch
              color={parsed.ok ? parsed.hex : "transparent"}
              className="pointer-events-none absolute top-1/2 left-2 -translate-y-1/2"
            />
            <input
              id={inputId}
              value={value}
              spellCheck={false}
              autoComplete="off"
              autoCapitalize="characters"
              maxLength={7}
              aria-invalid={error ? true : undefined}
              aria-describedby={clsx(error && errorId, warning && warningId) || undefined}
              onChange={(event) => {
                setDraft(event.target.value);
                if (error && parseHexInput(event.target.value).ok) setError(null);
              }}
              onBlur={() => {
                if (draft !== null && draft !== theme.accent) commit();
              }}
              className={clsx(
                "w-full rounded-control border bg-canvas pr-2 pl-8 font-mono text-14 text-fg uppercase tabular-nums",
                fieldHeight,
                error ? "border-danger" : "border-control",
              )}
            />
          </div>
          <button
            type="submit"
            className={clsx(
              "inline-flex shrink-0 items-center rounded-control border border-hairline bg-surface px-3 text-14 font-medium text-fg shadow-sm",
              "transition-colors duration-160 ease-site hover:bg-raised active:translate-y-px",
              fieldHeight,
            )}
          >
            Apply
          </button>
        </div>
        {error ? (
          <p id={errorId} className="text-12 text-danger">
            {error}
          </p>
        ) : null}
      </form>

      <p id={warningId} aria-live="polite" className={clsx("text-12 text-muted", !warning && "sr-only")}>
        {warning ? (
          <span className="flex items-start gap-1.5">
            <TriangleAlert size={14} strokeWidth={1.5} aria-hidden className="mt-0.5 shrink-0 text-fg" />
            {warning}
          </span>
        ) : null}
      </p>
    </div>
  );
}

export function AccentPopover() {
  const theme = useThemeLab();
  const defaultOpen = useOpenRequest("accent");
  useCarriedFocus();
  return (
    <Popover.Root defaultOpen={defaultOpen}>
      <Popover.Trigger
        aria-label={`Accent ${theme.accent}`}
        className={accentTriggerClasses}
        {...focusKeyProps(LAB_KEYS.accent)}
      >
        <AccentTriggerContent accent={theme.accent} />
      </Popover.Trigger>

      <Popover.Content
        side="top"
        align="start"
        sideOffset={10}
        collisionPadding={16}
        aria-label="Accent color"
        onOpenAutoFocus={(event) => {
          // Focus the panel itself (announced by its name) instead of popping the first swatch's tooltip.
          event.preventDefault();
          (event.currentTarget as HTMLElement | null)?.focus();
        }}
        className={clsx(popoverSurface, "w-[300px] p-4", "origin-(--radix-popover-content-transform-origin)")}
      >
        <p className="mb-3 label-mono text-muted">Accent</p>
        <AccentPanel layout="bar" />
      </Popover.Content>
    </Popover.Root>
  );
}

// Radius ---------------------------------------------------------------------------------------------------------

export function RadiusSlider({ layout }: { layout: Layout }) {
  const theme = useThemeLab();
  useCarriedFocus();
  // While a pointer drags, the thumb follows every event and the theme (and every preview frame) updates once per
  // frame. Keyboard steps commit at once. Radix may call onValueCommit before onValueChange, hence the pointer flag.
  const pointerDown = useRef(false);
  const [dragging, setDragging] = useState<number | null>(null);
  const value = dragging ?? theme.radius;
  return (
    <RadiusFrame layout={layout} value={value}>
      <Slider.Root
        min={RADIUS_RANGE.min}
        max={RADIUS_RANGE.max}
        step={1}
        value={[value]}
        onValueChange={([next]) => {
          if (next === undefined) return;
          if (pointerDown.current) setDragging(next);
          updateThemeLive({ radius: next });
        }}
        onValueCommit={([next]) => {
          pointerDown.current = false;
          setDragging(null);
          if (next !== undefined) updateTheme({ radius: next });
        }}
        onPointerDown={() => {
          pointerDown.current = true;
        }}
        className={radiusRootClasses[layout]}
      >
        <Slider.Track className={radiusTrackClasses}>
          <Slider.Range className="absolute h-full bg-fg" />
        </Slider.Track>
        <Slider.Thumb
          aria-label="Radius"
          aria-valuetext={`${value}px`}
          className={radiusThumbClasses}
          {...(layout === "bar" ? focusKeyProps(LAB_KEYS.radius) : {})}
        />
      </Slider.Root>
    </RadiusFrame>
  );
}

// Font -----------------------------------------------------------------------------------------------------------

const FONT_IDS = Object.keys(FONTS) as FontId[];

export function FontMenu() {
  const theme = useThemeLab();
  const defaultOpen = useOpenRequest("font");
  useCarriedFocus();
  return (
    <DropdownMenu.Root modal={false} defaultOpen={defaultOpen}>
      <DropdownMenu.Trigger
        aria-label={`Font ${FONTS[theme.font].name}`}
        className={fontTriggerClasses}
        {...focusKeyProps(LAB_KEYS.font)}
      >
        <FontTriggerContent font={theme.font} />
      </DropdownMenu.Trigger>

      <DropdownMenu.Content
        side="top"
        align="start"
        sideOffset={10}
        collisionPadding={16}
        className={clsx(popoverSurface, "min-w-48 p-1", "origin-(--radix-dropdown-menu-content-transform-origin)")}
      >
        <DropdownMenu.Label className="px-2 pt-1.5 pb-1 label-mono text-muted">Font</DropdownMenu.Label>
        <DropdownMenu.RadioGroup value={theme.font} onValueChange={(value) => updateTheme({ font: value as FontId })}>
          {FONT_IDS.map((id) => (
            <DropdownMenu.RadioItem
              key={id}
              value={id}
              className={clsx(
                "flex h-9 cursor-default items-center justify-between gap-4 rounded-control px-2 text-14 text-fg outline-hidden select-none",
                "data-highlighted:bg-raised pointer-coarse:h-10",
              )}
            >
              <span style={{ fontFamily: FONT_PREVIEW_FAMILY[id] }}>{FONTS[id].name}</span>
              <DropdownMenu.ItemIndicator>
                <Check size={16} strokeWidth={1.5} aria-hidden className="text-accent" />
              </DropdownMenu.ItemIndicator>
            </DropdownMenu.RadioItem>
          ))}
        </DropdownMenu.RadioGroup>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
}

function FontToggle({ labelledBy }: { labelledBy: string }) {
  const theme = useThemeLab();
  return (
    <ToggleGroup.Root
      type="single"
      value={theme.font}
      onValueChange={(value) => {
        if (value) updateTheme({ font: value as FontId });
      }}
      aria-labelledby={labelledBy}
      className="grid grid-cols-2 gap-0.5 rounded-control border border-hairline bg-canvas p-0.5"
    >
      {FONT_IDS.map((id) => (
        <ToggleGroup.Item
          key={id}
          value={id}
          className={sheetSegmentItem}
          style={{ fontFamily: FONT_PREVIEW_FAMILY[id] }}
        >
          {FONTS[id].name}
        </ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  );
}

// Phone sheet ----------------------------------------------------------------------------------------------------

/** Phones get every control stacked in a bottom sheet, opened by the Theme button in the dock. */
export function PhoneSheet({
  open,
  onOpenChange,
  triggerRef,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  triggerRef: RefObject<HTMLButtonElement | null>;
}) {
  const neutralId = useId();
  const fontId = useId();
  const densityId = useId();
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=closed]:animate-fade-out data-[state=open]:animate-fade-in dark:bg-black/60" />
        <Dialog.Content
          onCloseAutoFocus={(event) => {
            // The Theme button lives outside this module, so focus goes back to it explicitly.
            event.preventDefault();
            triggerRef.current?.focus();
          }}
          className={clsx(
            "fixed inset-x-0 bottom-0 z-50 flex max-h-[88dvh] flex-col rounded-t-card border-t border-hairline bg-surface text-fg shadow-lg outline-hidden",
            "data-[state=closed]:animate-[iu-sheet-out_200ms_var(--ease-site)] data-[state=open]:animate-[iu-sheet-in_240ms_var(--ease-site)]",
          )}
        >
          <div className="flex items-start justify-between gap-4 px-4 pt-4 pb-3">
            <div className="flex flex-col gap-1">
              <Dialog.Title className="text-20 font-semibold">Theme Lab</Dialog.Title>
              <Dialog.Description className="text-14 text-pretty text-muted">
                Every preview takes your brand. Copied code carries these tokens.
              </Dialog.Description>
            </div>
            <Dialog.Close
              aria-label="Close"
              className="-mt-1 -mr-1 inline-flex size-10 shrink-0 items-center justify-center rounded-control text-muted transition-colors hover:bg-raised hover:text-fg"
            >
              <X size={16} strokeWidth={1.5} aria-hidden />
            </Dialog.Close>
          </div>
          <div className="flex [scrollbar-gutter:stable] flex-col gap-6 overflow-y-auto overscroll-contain px-4 pt-1 pb-6">
            <SheetField label="Accent">
              <AccentPanel layout="sheet" />
            </SheetField>
            <SheetField label="Neutral" id={neutralId}>
              <NeutralControl layout="sheet" labelledBy={neutralId} />
            </SheetField>
            <SheetField label="Radius">
              <RadiusSlider layout="sheet" />
            </SheetField>
            <SheetField label="Font" id={fontId}>
              <FontToggle labelledBy={fontId} />
            </SheetField>
            <SheetField label="Density" id={densityId}>
              <DensityControl layout="sheet" labelledBy={densityId} />
            </SheetField>
          </div>
          <div className="flex gap-2 border-t border-hairline px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <ResetButton layout="sheet" className="flex-1" />
            <Dialog.Close className="inline-flex h-10 flex-1 items-center justify-center rounded-control bg-accent-fill px-4 text-14 font-medium text-accent-fg shadow-sm transition-transform active:translate-y-px">
              Done
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
