import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { composite, contrastRatio, oklchToRgb, parseOklch, type Rgb } from "@/lib/color";

// Reads the color tokens straight from app/globals.css so the stylesheet itself is what gets verified.
const css = readFileSync("app/globals.css", "utf8");

function tokensIn(block: string): Record<string, string> {
  const tokens: Record<string, string> = {};
  for (const match of block.matchAll(/--color-([a-z-]+):\s*(oklch\([^)]*\))/g)) {
    if (match[1] && match[2]) tokens[match[1]] = match[2];
  }
  return tokens;
}

const themeBlock = /@theme \{([\s\S]*?)\n\}/.exec(css)?.[1] ?? "";
const darkBlock = /:root\[data-theme="dark"\] \{([\s\S]*?)\}/.exec(css)?.[1] ?? "";
const light = tokensIn(themeBlock);
const dark = { ...light, ...tokensIn(darkBlock) };

function solid(tokens: Record<string, string>, name: string, over?: Rgb): Rgb {
  const value = tokens[name];
  if (!value) throw new Error(`token --color-${name} not found`);
  const parsed = parseOklch(value);
  if (!parsed) throw new Error(`token --color-${name} is not oklch: ${value}`);
  const rgb = oklchToRgb(parsed);
  return parsed.alpha !== undefined && parsed.alpha < 1 && over ? composite(rgb, parsed.alpha, over) : rgb;
}

describe.each([
  ["light", light],
  ["dark", dark],
] as const)("%s mode tokens", (_mode, tokens) => {
  const surfaces = ["canvas", "surface", "raised"] as const;

  it.each(surfaces)("text, muted text and accent text keep 4.5:1 on %s", (surface) => {
    const bg = solid(tokens, surface);
    expect(contrastRatio(solid(tokens, "fg"), bg)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(solid(tokens, "muted"), bg)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(solid(tokens, "accent"), bg)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(solid(tokens, "danger"), bg)).toBeGreaterThanOrEqual(4.5);
  });

  it("white text on the accent fill keeps 4.5:1", () => {
    expect(contrastRatio(solid(tokens, "accent-fg"), solid(tokens, "accent-fill"))).toBeGreaterThanOrEqual(4.5);
  });

  it.each(surfaces)("form control borders keep 3:1 on %s", (surface) => {
    const bg = solid(tokens, surface);
    expect(contrastRatio(solid(tokens, "control", bg), bg)).toBeGreaterThanOrEqual(3);
  });

  it("focus rings keep 3:1 against the canvas", () => {
    expect(contrastRatio(solid(tokens, "accent"), solid(tokens, "canvas"))).toBeGreaterThanOrEqual(3);
  });
});

describe("spec values", () => {
  it("keeps the spec hex values for the dark canvas, the light canvas and the heart", () => {
    const hex = (rgb: Rgb) => rgb.map((c) => Math.round(c * 255)).join(",");
    expect(hex(solid(dark, "canvas"))).toBe("11,11,12");
    expect(hex(solid(light, "canvas"))).toBe("245,243,239");
    expect(hex(solid(light, "heart"))).toBe("255,77,31");
    expect(hex(solid(dark, "accent"))).toBe("255,77,31");
  });
});
