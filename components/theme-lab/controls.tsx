"use client";

import { clsx } from "clsx";
import { useEffect, useState, type CSSProperties } from "react";
import { Segment, Segments } from "@/components/ui/segments";
import { focusKeyProps, lazyModule } from "@/lib/client/lazy";
import { resetTheme, useThemeLab } from "@/lib/client/theme-lab";
import { DENSITIES, FONTS, isDefaultTheme, NEUTRALS, RADIUS_RANGE, type DensityId, type NeutralId } from "@/lib/theme";
import { radiusForKey } from "./logic";
import { updateTheme } from "./store";
import {
  accentTriggerClasses,
  AccentTriggerContent,
  DENSITY_ORDER,
  DensityItemContent,
  fontTriggerClasses,
  FontTriggerContent,
  LAB_KEYS,
  NEUTRAL_IDS,
  NeutralItemContent,
  RadiusFrame,
  RadiusTrack,
  resetClasses,
  ResetContent,
  segmentItem,
  segmentTrack,
  sheetSegmentItem,
  type Layout,
} from "./views";

// The interactive dock's light controls. The accent popover, the radius slider, the font menu and the phone sheet
// (Radix Popover, Slider, DropdownMenu and Dialog) load from ./controls-lazy on the first pointerenter or focus inside
// the dock, and replace their stand-ins here without moving a pixel (the markup comes from ./views).

export const labControls = lazyModule(() => import("./controls-lazy"));

// A click on a stand-in before the real control has arrived opens it as soon as it does.
type Openable = "accent" | "font";
let requestedOpen: Openable | null = null;

function requestOpen(control: Openable) {
  requestedOpen = control;
  labControls.preload();
}

/** For the real control's first render: true when its stand-in was clicked. Clears the request after mounting. */
export function useOpenRequest(control: Openable) {
  const [requested] = useState(() => requestedOpen === control);
  useEffect(() => {
    if (requestedOpen === control) requestedOpen = null;
  }, [control]);
  return requested;
}

/** A labelled group in the phone sheet. */
export function SheetField({ label, children, id }: { label: string; children: React.ReactNode; id?: string }) {
  return (
    <div className="flex flex-col gap-2">
      <span id={id} className="label-mono text-muted">
        {label}
      </span>
      {children}
    </div>
  );
}

/** The bar's accent button: a stand-in until the popover arrives. */
export function AccentControl() {
  const theme = useThemeLab();
  const Lab = labControls.use();
  if (Lab) return <Lab.AccentPopover />;
  return (
    <button
      type="button"
      aria-label={`Accent ${theme.accent}`}
      aria-haspopup="dialog"
      aria-expanded={false}
      onClick={() => requestOpen("accent")}
      className={accentTriggerClasses}
      {...focusKeyProps(LAB_KEYS.accent)}
    >
      <AccentTriggerContent accent={theme.accent} />
    </button>
  );
}

export function NeutralControl({ layout, labelledBy }: { layout: Layout; labelledBy?: string }) {
  const theme = useThemeLab();
  return (
    <Segments
      value={theme.neutral}
      onValueChange={(value) => {
        if (value) updateTheme({ neutral: value as NeutralId });
      }}
      {...(labelledBy ? { "aria-labelledby": labelledBy } : { "aria-label": "Neutral" })}
      className={clsx(segmentTrack, layout === "sheet" && "flex w-full")}
    >
      {NEUTRAL_IDS.map((id) => (
        <Segment
          key={id}
          value={id}
          aria-label={NEUTRALS[id].name}
          className={layout === "sheet" ? sheetSegmentItem : segmentItem}
          {...(layout === "bar" ? focusKeyProps(LAB_KEYS.neutral(id)) : {})}
        >
          <NeutralItemContent id={id} layout={layout} />
        </Segment>
      ))}
    </Segments>
  );
}

export function RadiusControl() {
  const theme = useThemeLab();
  const Lab = labControls.use();
  if (Lab) return <Lab.RadiusSlider layout="bar" />;
  // The stand-in already answers the slider keys, so a key pressed before Radix arrives still counts.
  return (
    <RadiusFrame layout="bar" value={theme.radius}>
      <RadiusTrack
        value={theme.radius}
        thumbProps={{
          onKeyDown: (event) => {
            const next = radiusForKey(event.key, theme.radius, RADIUS_RANGE.min, RADIUS_RANGE.max);
            if (next === null) return;
            event.preventDefault();
            updateTheme({ radius: next });
          },
        }}
      />
    </RadiusFrame>
  );
}

/** The bar's font button: a stand-in until the menu arrives. */
export function FontControl() {
  const theme = useThemeLab();
  const Lab = labControls.use();
  if (Lab) return <Lab.FontMenu />;
  return (
    <button
      type="button"
      aria-label={`Font ${FONTS[theme.font].name}`}
      aria-haspopup="menu"
      aria-expanded={false}
      onClick={() => requestOpen("font")}
      className={fontTriggerClasses}
      {...focusKeyProps(LAB_KEYS.font)}
    >
      <FontTriggerContent font={theme.font} />
    </button>
  );
}

export function DensityControl({ layout, labelledBy }: { layout: Layout; labelledBy?: string }) {
  const theme = useThemeLab();
  return (
    <Segments
      value={theme.density}
      onValueChange={(value) => {
        if (value) updateTheme({ density: value as DensityId });
      }}
      {...(labelledBy ? { "aria-labelledby": labelledBy } : { "aria-label": "Density" })}
      className={clsx(segmentTrack, layout === "sheet" && "flex w-full")}
    >
      {DENSITY_ORDER.map((id) => (
        <Segment
          key={id}
          value={id}
          aria-label={DENSITIES[id].name}
          className={layout === "sheet" ? sheetSegmentItem : segmentItem}
          {...(layout === "bar" ? focusKeyProps(LAB_KEYS.density(id)) : {})}
        >
          <DensityItemContent id={id} layout={layout} />
        </Segment>
      ))}
    </Segments>
  );
}

/** aria-disabled rather than disabled, so focus stays on the button after a reset instead of falling to the page. */
export function ResetButton({
  layout,
  className,
  style,
}: {
  layout: Layout;
  className?: string;
  style?: CSSProperties;
}) {
  const theme = useThemeLab();
  const disabled = isDefaultTheme(theme);
  return (
    <button
      type="button"
      aria-disabled={disabled}
      aria-label={layout === "bar" ? "Reset theme" : undefined}
      onClick={() => {
        if (!disabled) resetTheme();
      }}
      style={style}
      className={resetClasses(layout, className)}
      {...(layout === "bar" ? focusKeyProps(LAB_KEYS.reset) : {})}
    >
      <ResetContent layout={layout} />
    </button>
  );
}
