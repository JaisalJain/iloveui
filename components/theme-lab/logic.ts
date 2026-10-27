import { accentContrast, normalizeHex, type ThemeState } from "@/lib/theme";

// Pure pieces of Theme Lab's UI, kept apart from React so they can be unit tested.

export type HexInputResult = { ok: true; hex: string } | { ok: false; error: string };

/** Validates the custom accent field: #RGB or #RRGGBB (the leading # is optional when pasting). */
export function parseHexInput(raw: string): HexInputResult {
  const value = raw.trim();
  if (value === "") return { ok: false, error: "Enter a hex color, for example #FF4D1F." };
  if (!/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value)) return { ok: false, error: "Use #RGB or #RRGGBB." };
  return { ok: true, hex: normalizeHex(value) };
}

/** Accents below 3:1 against a background stop reading as a color on it (WCAG 1.4.11 non-text contrast). */
export const MIN_ACCENT_CONTRAST = 3;

/** One short line when the accent is hard to see on the light or dark background; null when it reads in both. */
export function contrastWarning(theme: ThemeState): string | null {
  const { light, dark } = accentContrast(theme);
  const lowLight = light < MIN_ACCENT_CONTRAST;
  const lowDark = dark < MIN_ACCENT_CONTRAST;
  if (lowLight && lowDark) return `Low contrast in light and dark (${light.toFixed(1)}:1, ${dark.toFixed(1)}:1).`;
  if (lowLight) return `Low contrast on light backgrounds (${light.toFixed(1)}:1).`;
  if (lowDark) return `Low contrast on dark backgrounds (${dark.toFixed(1)}:1).`;
  return null;
}

export { DOCK_STORAGE_KEY } from "@/lib/theme-storage";
export type DockView = "expanded" | "collapsed";

/** A remembered choice wins; otherwise the dock starts expanded on wide screens (1024px and up). */
export function initialDockView(stored: string | null, wide: boolean): DockView {
  if (stored === "expanded" || stored === "collapsed") return stored;
  return wide ? "expanded" : "collapsed";
}

type Frame = (callback: () => void) => number;
type CancelFrame = (id: number) => void;

/**
 * Merges patches and applies them at most once per animation frame, so dragging the radius slider re-themes a grid
 * of preview frames once per frame instead of once per pointer event. flush() applies anything pending right away.
 */
export function createPatchScheduler<T extends object>(
  apply: (patch: Partial<T>) => void,
  requestFrame: Frame,
  cancelFrame: CancelFrame,
) {
  let pending: Partial<T> | null = null;
  let frame: number | null = null;

  function run() {
    frame = null;
    const patch = pending;
    pending = null;
    if (patch) apply(patch);
  }

  return {
    schedule(patch: Partial<T>) {
      pending = { ...pending, ...patch };
      if (frame === null) frame = requestFrame(run);
    },
    flush() {
      if (frame !== null) cancelFrame(frame);
      run();
    },
  };
}

/**
 * The radius slider's keyboard steps, as Radix Slider takes them (arrows 1px, Page keys 10px, Home and End to the
 * ends). The stand-in shown before Radix loads uses it, so a key pressed in that moment is never lost. null for other
 * keys.
 */
export function radiusForKey(key: string, value: number, min: number, max: number): number | null {
  const clamp = (next: number) => Math.min(max, Math.max(min, next));
  switch (key) {
    case "ArrowRight":
    case "ArrowUp":
      return clamp(value + 1);
    case "ArrowLeft":
    case "ArrowDown":
      return clamp(value - 1);
    case "PageUp":
      return clamp(value + 10);
    case "PageDown":
      return clamp(value - 10);
    case "Home":
      return min;
    case "End":
      return max;
    default:
      return null;
  }
}
