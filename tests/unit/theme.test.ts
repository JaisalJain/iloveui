import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { contrastRatio, parseHex } from "@/lib/color";
import {
  ACCENT_PRESETS,
  DEFAULT_THEME,
  IU_TOKEN_NAMES,
  NEUTRALS,
  isDefaultTheme,
  normalizeTheme,
  themeCss,
  themeTokens,
} from "@/lib/theme";

const rgb = (hex: string) => parseHex(hex)!;

describe("theme tokens", () => {
  it("keeps registry/preview-base.css in sync with the default theme", () => {
    const css = readFileSync("registry/preview-base.css", "utf8");
    const block = (selector: string) =>
      new RegExp(`\\n  ${selector.replace(".", "\\.")} \\{([\\s\\S]*?)\\n  \\}`).exec(css)?.[1] ?? "";
    const { light, dark } = themeTokens(DEFAULT_THEME);
    for (const name of IU_TOKEN_NAMES) {
      expect(block(":root").toLowerCase(), name).toContain(`${name}: ${light[name]};`.toLowerCase());
      expect(block(".dark").toLowerCase(), name).toContain(`${name}: ${dark[name]};`.toLowerCase());
    }
  });

  it("writes CSS for :root and .dark with all ten tokens", () => {
    const css = themeCss({ ...DEFAULT_THEME, accent: "#0F9F6E", radius: 4, font: "geist", density: "compact" });
    for (const name of IU_TOKEN_NAMES) expect(css.split(`${name}:`).length - 1).toBe(2);
    expect(css).toContain("--iu-radius: 4px;");
    expect(css).toContain('--iu-font: "Geist"');
    expect(css).toContain("--iu-density: 0.8;");
    expect(css.indexOf(":root {")).toBeLessThan(css.indexOf(".dark {"));
  });

  it("keeps text and muted text at 4.5:1 on backgrounds and surfaces for every neutral", () => {
    for (const neutral of Object.values(NEUTRALS)) {
      for (const set of [neutral.light, neutral.dark]) {
        for (const bg of [set.background, set.surface]) {
          expect(contrastRatio(rgb(set.foreground), rgb(bg))).toBeGreaterThanOrEqual(4.5);
          expect(contrastRatio(rgb(set.muted), rgb(bg))).toBeGreaterThanOrEqual(4.5);
        }
      }
    }
  });

  it("picks an accent foreground with at least 4.5:1 for every preset", () => {
    for (const preset of ACCENT_PRESETS) {
      const { light } = themeTokens({ ...DEFAULT_THEME, accent: preset.hex });
      expect(contrastRatio(rgb(light["--iu-accent-foreground"]), rgb(preset.hex)), preset.name).toBeGreaterThanOrEqual(
        4.5,
      );
    }
  });

  it("normalizes stored values field by field", () => {
    expect(normalizeTheme(null)).toEqual(DEFAULT_THEME);
    expect(normalizeTheme({ accent: "#abc", radius: 99, font: "comic-sans", density: "compact" })).toEqual({
      ...DEFAULT_THEME,
      accent: "#AABBCC",
      radius: 24,
      density: "compact",
    });
    expect(normalizeTheme({ neutral: "slate", radius: -3 })).toMatchObject({ neutral: "slate", radius: 0 });
    expect(isDefaultTheme(normalizeTheme({}))).toBe(true);
  });
});
