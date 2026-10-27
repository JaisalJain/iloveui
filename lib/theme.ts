import { contrastRatio, parseHex, readableForeground, type Rgb } from "./color";

// Theme Lab: the buyer's brand, expressed as the ten --iu-* variables every catalog design reads.
// One theme yields a light and a dark token set; previews switch between them with the .dark class.

export const IU_TOKEN_NAMES = [
  "--iu-accent",
  "--iu-accent-foreground",
  "--iu-background",
  "--iu-surface",
  "--iu-border",
  "--iu-foreground",
  "--iu-muted",
  "--iu-radius",
  "--iu-font",
  "--iu-density",
] as const;

export type IuTokenName = (typeof IU_TOKEN_NAMES)[number];
export type IuTokens = Record<IuTokenName, string>;

export const ACCENT_PRESETS = [
  { id: "vermilion", name: "Vermilion", hex: "#FF4D1F" },
  { id: "cobalt", name: "Cobalt", hex: "#2F5BEA" },
  { id: "emerald", name: "Emerald", hex: "#0F9F6E" },
  { id: "saffron", name: "Saffron", hex: "#F2A516" },
  { id: "rose", name: "Rose", hex: "#E5375F" },
  { id: "iris", name: "Iris", hex: "#6E56CF" },
  { id: "lagoon", name: "Lagoon", hex: "#0E8FA8" },
  { id: "graphite", name: "Graphite", hex: "#2B2B30" },
] as const;

type NeutralSet = { background: string; surface: string; border: string; foreground: string; muted: string };

export const NEUTRALS = {
  zinc: {
    name: "Zinc",
    light: { background: "#FAFAFA", surface: "#FFFFFF", border: "#E4E4E7", foreground: "#18181B", muted: "#52525B" },
    dark: { background: "#09090B", surface: "#18181B", border: "#2E2E33", foreground: "#FAFAFA", muted: "#A1A1AA" },
  },
  stone: {
    name: "Stone",
    light: { background: "#FAFAF9", surface: "#FFFFFF", border: "#E7E5E4", foreground: "#1C1917", muted: "#57534E" },
    dark: { background: "#0C0A09", surface: "#1C1917", border: "#33302E", foreground: "#FAFAF9", muted: "#A8A29E" },
  },
  slate: {
    name: "Slate",
    light: { background: "#F8FAFC", surface: "#FFFFFF", border: "#E2E8F0", foreground: "#0F172A", muted: "#475569" },
    dark: { background: "#020617", surface: "#0F172A", border: "#243248", foreground: "#F8FAFC", muted: "#94A3B8" },
  },
} as const satisfies Record<string, { name: string; light: NeutralSet; dark: NeutralSet }>;

export type NeutralId = keyof typeof NEUTRALS;

export const FONTS = {
  "inter-tight": { name: "Inter Tight", stack: '"Inter Tight", ui-sans-serif, system-ui, sans-serif' },
  geist: { name: "Geist", stack: '"Geist", ui-sans-serif, system-ui, sans-serif' },
  "ibm-plex-sans": { name: "IBM Plex Sans", stack: '"IBM Plex Sans", ui-sans-serif, system-ui, sans-serif' },
  "system-ui": {
    name: "system-ui",
    stack: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
} as const;

export type FontId = keyof typeof FONTS;

export const DENSITIES = { comfortable: { name: "Comfortable", value: 1 }, compact: { name: "Compact", value: 0.8 } };
export type DensityId = keyof typeof DENSITIES;

export const RADIUS_RANGE = { min: 0, max: 24 } as const;

export type ThemeState = {
  accent: string; // #RRGGBB
  neutral: NeutralId;
  radius: number; // px, 0-24
  font: FontId;
  density: DensityId;
};

export const DEFAULT_THEME: ThemeState = {
  accent: "#FF4D1F",
  neutral: "zinc",
  radius: 10,
  font: "inter-tight",
  density: "comfortable",
};

export { THEME_STORAGE_KEY } from "./theme-storage";

/** Validates anything (for example localStorage contents) into a ThemeState, falling back field by field. */
export function normalizeTheme(input: unknown): ThemeState {
  const value = (typeof input === "object" && input !== null ? input : {}) as Partial<
    Record<keyof ThemeState, unknown>
  >;
  const accent = typeof value.accent === "string" && parseHex(value.accent) ? normalizeHex(value.accent) : null;
  const radius = typeof value.radius === "number" && Number.isFinite(value.radius) ? Math.round(value.radius) : null;
  return {
    accent: accent ?? DEFAULT_THEME.accent,
    neutral:
      typeof value.neutral === "string" && value.neutral in NEUTRALS
        ? (value.neutral as NeutralId)
        : DEFAULT_THEME.neutral,
    radius: radius === null ? DEFAULT_THEME.radius : Math.min(RADIUS_RANGE.max, Math.max(RADIUS_RANGE.min, radius)),
    font: typeof value.font === "string" && value.font in FONTS ? (value.font as FontId) : DEFAULT_THEME.font,
    density:
      typeof value.density === "string" && value.density in DENSITIES
        ? (value.density as DensityId)
        : DEFAULT_THEME.density,
  };
}

export function normalizeHex(hex: string): string {
  const rgb = parseHex(hex);
  if (!rgb) return DEFAULT_THEME.accent;
  return `#${rgb
    .map((c) =>
      Math.round(c * 255)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`.toUpperCase();
}

export function isDefaultTheme(theme: ThemeState): boolean {
  return (Object.keys(DEFAULT_THEME) as (keyof ThemeState)[]).every((key) => theme[key] === DEFAULT_THEME[key]);
}

function tokensFor(theme: ThemeState, mode: "light" | "dark"): IuTokens {
  const neutral = NEUTRALS[theme.neutral][mode];
  const accentRgb = parseHex(theme.accent) as Rgb;
  return {
    "--iu-accent": normalizeHex(theme.accent),
    "--iu-accent-foreground": readableForeground(accentRgb),
    "--iu-background": neutral.background,
    "--iu-surface": neutral.surface,
    "--iu-border": neutral.border,
    "--iu-foreground": neutral.foreground,
    "--iu-muted": neutral.muted,
    "--iu-radius": `${theme.radius}px`,
    "--iu-font": FONTS[theme.font].stack,
    "--iu-density": String(DENSITIES[theme.density].value),
  };
}

export function themeTokens(theme: ThemeState): { light: IuTokens; dark: IuTokens } {
  return { light: tokensFor(theme, "light"), dark: tokensFor(theme, "dark") };
}

function declarations(tokens: IuTokens, indent: string) {
  return IU_TOKEN_NAMES.map((name) => `${indent}${name}: ${tokens[name]};`).join("\n");
}

/** CSS for the token set: light values on :root, dark values on .dark (the class Tailwind's dark: variant uses). */
export function themeCss(theme: ThemeState, { selector = ":root", darkSelector = ".dark" } = {}): string {
  const { light, dark } = themeTokens(theme);
  return `${selector} {\n${declarations(light, "  ")}\n}\n\n${darkSelector} {\n${declarations(dark, "  ")}\n}\n`;
}

/** Contrast of the accent against each mode's background, for Theme Lab's warning on low-contrast accents. */
export function accentContrast(theme: ThemeState): { light: number; dark: number } {
  const accent = parseHex(theme.accent) as Rgb;
  return {
    light: contrastRatio(accent, parseHex(NEUTRALS[theme.neutral].light.background) as Rgb),
    dark: contrastRatio(accent, parseHex(NEUTRALS[theme.neutral].dark.background) as Rgb),
  };
}
