// Color math shared by Theme Lab (custom accents, readable foregrounds) and the token contrast tests.

export type Rgb = readonly [number, number, number];

const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toGamma = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
const clamp01 = (c: number) => Math.min(1, Math.max(0, c));

export function parseHex(hex: string): Rgb | null {
  const match = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!match?.[1]) return null;
  const digits = match[1].length === 3 ? [...match[1]].map((d) => d + d).join("") : match[1];
  const n = Number.parseInt(digits, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

export function toHex(rgb: Rgb): string {
  return `#${rgb
    .map((c) =>
      Math.round(clamp01(c) * 255)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`.toUpperCase();
}

export type Oklch = { l: number; c: number; h: number; alpha?: number };

export function oklchToRgb({ l, c, h }: Oklch): Rgb {
  const a = c * Math.cos((h * Math.PI) / 180);
  const b = c * Math.sin((h * Math.PI) / 180);
  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.291485548 * b;
  const L = l_ ** 3;
  const M = m_ ** 3;
  const S = s_ ** 3;
  return [
    toGamma(4.0767416621 * L - 3.3077115913 * M + 0.2309699292 * S),
    toGamma(-1.2684380046 * L + 2.6097574011 * M - 0.3413193965 * S),
    toGamma(-0.0041960863 * L - 0.7034186147 * M + 1.707614701 * S),
  ];
}

export function rgbToOklch(rgb: Rgb): Oklch {
  const [r, g, b] = rgb.map(toLinear) as [number, number, number];
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  const C = Math.hypot(A, B);
  const H = C < 0.0005 ? 0 : ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360;
  return { l: L, c: C < 0.0005 ? 0 : C, h: H };
}

/** Formats an OKLCH color the way app/globals.css writes it, e.g. "oklch(66.86% 0.2211 34.59)". */
export function formatOklch({ l, c, h, alpha }: Oklch): string {
  const base = `${+(l * 100).toFixed(2)}% ${+c.toFixed(4)} ${+h.toFixed(2)}`;
  return alpha === undefined || alpha === 1 ? `oklch(${base})` : `oklch(${base} / ${+alpha.toFixed(3)})`;
}

/** Parses "oklch(L% C H)" or "oklch(L% C H / A)". */
export function parseOklch(value: string): Oklch | null {
  const match = /^oklch\(\s*([\d.]+)%\s+([\d.]+)\s+([\d.]+)\s*(?:\/\s*([\d.]+))?\s*\)$/.exec(value.trim());
  if (!match?.[1] || !match[2] || !match[3]) return null;
  return {
    l: Number(match[1]) / 100,
    c: Number(match[2]),
    h: Number(match[3]),
    alpha: match[4] === undefined ? 1 : Number(match[4]),
  };
}

/** Composites a translucent color over an opaque background in sRGB, as browsers do. */
export function composite(top: Rgb, alpha: number, bottom: Rgb): Rgb {
  return [0, 1, 2].map((i) => top[i]! * alpha + bottom[i]! * (1 - alpha)) as unknown as Rgb;
}

export function relativeLuminance(rgb: Rgb): number {
  const [r, g, b] = rgb.map((c) => toLinear(clamp01(c))) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: Rgb, b: Rgb): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

const WHITE: Rgb = [1, 1, 1];
const INK: Rgb = [17 / 255, 17 / 255, 17 / 255];

/** Picks white or near-black text for a fill, whichever reads better. */
export function readableForeground(fill: Rgb): "#FFFFFF" | "#111111" {
  return contrastRatio(fill, WHITE) >= contrastRatio(fill, INK) ? "#FFFFFF" : "#111111";
}
