import { clsx } from "clsx";
import { ChevronDown, RotateCcw, Rows3, Rows4 } from "lucide-react";
import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { DENSITIES, FONTS, NEUTRALS, RADIUS_RANGE, type DensityId, type FontId, type NeutralId } from "@/lib/theme";

// Theme Lab's markup, shared by the static dock the server renders (no JavaScript until someone reaches for it) and
// the interactive controls that replace it, so the swap never moves a pixel. Pure views: no hooks, no handlers of
// their own. Class lists are joined with clsx: none of them conflict, and tailwind-merge stays out of the first load.

/** Where a control renders: the desktop bar (compact, popovers) or the phone sheet (stacked, 40px targets). */
export type Layout = "bar" | "sheet";

/** Focus keys (see lib/client/lazy): the static dock, the stand-ins and the Radix controls share them. */
export const LAB_KEYS = {
  pill: "theme-lab-pill",
  phone: "theme-lab-phone",
  accent: "theme-lab-accent",
  radius: "theme-lab-radius",
  font: "theme-lab-font",
  reset: "theme-lab-reset",
  collapse: "theme-lab-collapse",
  neutral: (id: NeutralId) => `theme-lab-neutral-${id}`,
  density: (id: DensityId) => `theme-lab-density-${id}`,
} as const;

/** Font names are set in their own face. Inter Tight is the site font; the other two load only when shown. */
export const FONT_PREVIEW_FAMILY: Record<FontId, string> = {
  "inter-tight": "var(--font-sans)",
  geist: '"iu-lab-geist", ui-sans-serif, system-ui, sans-serif',
  "ibm-plex-sans": '"iu-lab-plex", ui-sans-serif, system-ui, sans-serif',
  "system-ui": FONTS["system-ui"].stack,
};

export const THEME_LAB_CSS = `
@font-face { font-family: "iu-lab-geist"; src: url("/fonts/geist-latin-var.woff2") format("woff2"); font-weight: 100 900; font-display: swap; }
@font-face { font-family: "iu-lab-plex"; src: url("/fonts/ibm-plex-sans-latin-var.woff2") format("woff2"); font-weight: 100 700; font-display: swap; }
@keyframes iu-sheet-in { from { transform: translate3d(0, 100%, 0); } }
@keyframes iu-sheet-out { to { transform: translate3d(0, 100%, 0); } }
`;

export const NEUTRAL_IDS = Object.keys(NEUTRALS) as NeutralId[];
export const DENSITY_ORDER: DensityId[] = ["compact", "comfortable"];

export const pillClasses = clsx(
  "pointer-events-auto inline-flex h-10 items-center gap-2 rounded-full border border-hairline bg-surface pr-4 pl-3",
  "text-14 font-medium text-fg shadow-lg transition-[background-color,transform] duration-160 ease-site",
  "hover:bg-raised active:translate-y-px",
);
export const barClasses =
  "pointer-events-auto flex max-w-full items-center rounded-card border border-hairline bg-surface p-1.5 shadow-lg *:shrink-0";
export const collapseClasses = clsx(
  "ml-0.5 inline-flex size-8 items-center justify-center rounded-control text-muted pointer-coarse:size-10",
  "transition-colors duration-160 ease-site hover:bg-raised hover:text-fg",
);

export const segmentTrack = "inline-flex items-center gap-0.5 rounded-control border border-hairline bg-canvas p-0.5";
const segmentBase = clsx(
  "inline-flex items-center justify-center gap-1.5 rounded-[4px] px-2 font-medium text-muted",
  "transition-[background-color,color,box-shadow] duration-160 ease-site hover:text-fg",
  "data-[state=on]:bg-surface data-[state=on]:text-fg data-[state=on]:shadow-sm dark:data-[state=on]:bg-raised",
  "pointer-coarse:min-w-9",
);
export const segmentItem = clsx(segmentBase, "h-7 text-12 pointer-coarse:h-9");
export const sheetSegmentItem = clsx(segmentBase, "h-9 min-w-10 flex-1 text-14 pointer-coarse:h-10");

export const barTriggerClasses = clsx(
  "inline-flex h-8 items-center rounded-control px-2 text-fg pointer-coarse:h-10",
  "transition-colors duration-160 ease-site hover:bg-raised data-[state=open]:bg-raised",
);
export const accentTriggerClasses = clsx(barTriggerClasses, "gap-2");
export const fontTriggerClasses = clsx(barTriggerClasses, "gap-1.5 text-14");

export const radiusRootClasses = {
  bar: "relative flex touch-none items-center select-none h-8 w-20 lg:w-24 pointer-coarse:h-10",
  sheet: "relative flex touch-none items-center select-none h-10 flex-1",
} as const;
export const radiusTrackClasses =
  "relative h-1 grow overflow-hidden rounded-full bg-raised dark:bg-[color-mix(in_oklab,var(--color-fg)_14%,transparent)]";
export const radiusThumbClasses = clsx(
  "block size-4 rounded-full border border-control bg-surface shadow-sm",
  "transition-transform duration-160 ease-site active:scale-110 pointer-coarse:size-6",
);

export function resetClasses(layout: Layout, className?: string) {
  return clsx(
    "inline-flex items-center justify-center gap-1.5 rounded-control text-14 font-medium text-muted",
    "transition-colors duration-160 ease-site hover:bg-raised hover:text-fg active:translate-y-px",
    "aria-disabled:cursor-default aria-disabled:opacity-50 aria-disabled:hover:bg-transparent aria-disabled:hover:text-muted aria-disabled:active:translate-y-0",
    layout === "bar"
      ? "h-8 min-w-8 px-2 pointer-coarse:h-10 pointer-coarse:min-w-10"
      : "h-10 border border-hairline bg-surface px-4 text-fg shadow-sm",
    className,
  );
}

/** The attributes Segment (components/ui/segments) puts on an item, for the static dock. */
export function segmentAttributes(checked: boolean) {
  return {
    type: "button",
    role: "radio",
    "aria-checked": checked,
    "data-state": checked ? "on" : "off",
    tabIndex: checked ? 0 : -1,
  } as const;
}

export function Divider() {
  return <span aria-hidden className="mx-1 h-5 w-px shrink-0 bg-hairline" />;
}

export function Swatch({ color, className }: { color: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={clsx("inline-block size-4 shrink-0 rounded-[4px] shadow-[inset_0_0_0_1px_rgb(0_0_0/0.12)]", className)}
      style={{ backgroundColor: color }}
    />
  );
}

export function ThemePillContent({ accent }: { accent: string }) {
  return (
    <>
      <span
        aria-hidden
        className="size-3.5 rounded-[4px] shadow-[inset_0_0_0_1px_rgb(0_0_0/0.12)]"
        style={{ backgroundColor: accent }}
      />
      Theme
    </>
  );
}

export function BarLabel() {
  return (
    <span className="hidden md:contents">
      <span className="px-2 label-mono text-fg">Theme</span>
      <Divider />
    </span>
  );
}

export function CollapseIcon() {
  return <ChevronDown size={16} strokeWidth={1.5} aria-hidden />;
}

export function AccentTriggerContent({ accent }: { accent: string }) {
  return (
    <>
      <Swatch color={accent} />
      <span className="font-mono text-12 tabular-nums">{accent}</span>
    </>
  );
}

export function NeutralItemContent({ id, layout }: { id: NeutralId; layout: Layout }) {
  return (
    <>
      <span
        aria-hidden
        className="size-3 shrink-0 rounded-full"
        style={{
          background: `linear-gradient(135deg, ${NEUTRALS[id].light.muted} 50%, ${NEUTRALS[id].dark.surface} 50%)`,
        }}
      />
      <span className={layout === "bar" ? "hidden xl:inline" : undefined}>{NEUTRALS[id].name}</span>
    </>
  );
}

const DENSITY_ICON = { compact: Rows4, comfortable: Rows3 } as const;

export function DensityItemContent({ id, layout }: { id: DensityId; layout: Layout }) {
  const Icon = DENSITY_ICON[id];
  return (
    <>
      <Icon size={16} strokeWidth={1.5} aria-hidden className={layout === "bar" ? "xl:hidden" : "hidden"} />
      <span className={layout === "bar" ? "hidden xl:inline" : undefined}>{DENSITIES[id].name}</span>
    </>
  );
}

export function FontTriggerContent({ font }: { font: FontId }) {
  return (
    <>
      <span className="max-w-[12ch] truncate" style={{ fontFamily: FONT_PREVIEW_FAMILY[font] }}>
        {FONTS[font].name}
      </span>
      <ChevronDown size={16} strokeWidth={1.5} aria-hidden className="text-muted" />
    </>
  );
}

export function ResetContent({ layout }: { layout: Layout }) {
  return (
    <>
      <RotateCcw size={16} strokeWidth={1.5} aria-hidden />
      <span className={layout === "bar" ? "hidden xl:inline" : undefined}>Reset</span>
    </>
  );
}

/** The label and value around the slider; the slider itself is the stand-in below or Radix Slider. */
export function RadiusFrame({ layout, value, children }: { layout: Layout; value: number; children: ReactNode }) {
  return (
    <div className={clsx("flex items-center gap-3", layout === "bar" ? "px-2" : "w-full")}>
      {layout === "bar" ? (
        <span aria-hidden className="label-mono text-muted">
          Radius
        </span>
      ) : null}
      {children}
      <span aria-hidden className="w-[4ch] shrink-0 text-right font-mono text-12 text-fg tabular-nums">
        {value}px
      </span>
    </div>
  );
}

/**
 * Radix Slider's markup and geometry, drawn statically: the thumb sits where Radix puts it (kept inside the track by
 * half its width at the ends). `thumbProps` adds the stand-in's key handling.
 */
export function RadiusTrack({ value, thumbProps }: { value: number; thumbProps?: HTMLAttributes<HTMLSpanElement> }) {
  const percent = ((value - RADIUS_RANGE.min) / (RADIUS_RANGE.max - RADIUS_RANGE.min)) * 100;
  const thumbPosition: CSSProperties = {
    position: "absolute",
    left: `calc(${percent}% + var(--thumb-half) * ${1 - percent / 50})`,
    transform: "translateX(-50%)",
  };
  return (
    <span
      data-orientation="horizontal"
      className={clsx(radiusRootClasses.bar, "[--thumb-half:8px] pointer-coarse:[--thumb-half:12px]")}
    >
      <span data-orientation="horizontal" className={radiusTrackClasses}>
        <span className="absolute h-full bg-fg" style={{ left: "0%", right: `${100 - percent}%` }} />
      </span>
      <span style={thumbPosition}>
        <span
          role="slider"
          tabIndex={0}
          aria-label="Radius"
          aria-valuemin={RADIUS_RANGE.min}
          aria-valuemax={RADIUS_RANGE.max}
          aria-valuenow={value}
          aria-valuetext={`${value}px`}
          aria-orientation="horizontal"
          data-focus-key={LAB_KEYS.radius}
          className={radiusThumbClasses}
          {...thumbProps}
        />
      </span>
    </span>
  );
}
