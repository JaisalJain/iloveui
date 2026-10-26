import { describe, expect, it } from "vitest";
import {
  contrastRatio,
  formatOklch,
  oklchToRgb,
  parseHex,
  parseOklch,
  readableForeground,
  rgbToOklch,
  toHex,
} from "@/lib/color";

describe("color math", () => {
  it("parses short and long hex", () => {
    expect(parseHex("#fff")).toEqual([1, 1, 1]);
    expect(toHex(parseHex("FF4D1F")!)).toBe("#FF4D1F");
    expect(parseHex("#12345")).toBeNull();
    expect(parseHex("not a color")).toBeNull();
  });

  it("round-trips hex through OKLCH", () => {
    for (const hex of ["#FF4D1F", "#0B0B0C", "#F5F3EF", "#5C5C62", "#2563EB"]) {
      expect(toHex(oklchToRgb(rgbToOklch(parseHex(hex)!)))).toBe(hex);
    }
  });

  it("formats and parses the stylesheet notation", () => {
    const value = formatOklch(rgbToOklch(parseHex("#FF4D1F")!));
    expect(value).toBe("oklch(66.86% 0.2211 34.59)");
    expect(parseOklch(value)).toMatchObject({ l: 0.6686, c: 0.2211, h: 34.59, alpha: 1 });
    expect(parseOklch("oklch(100% 0 0 / 0.08)")?.alpha).toBe(0.08);
  });

  it("computes WCAG contrast ratios", () => {
    expect(contrastRatio([1, 1, 1], [0, 0, 0])).toBeCloseTo(21, 5);
    expect(contrastRatio(parseHex("#FF4D1F")!, [1, 1, 1])).toBeCloseTo(3.32, 2);
  });

  it("picks the readable foreground for a fill", () => {
    expect(readableForeground(parseHex("#FF4D1F")!)).toBe("#111111");
    expect(readableForeground(parseHex("#DA3805")!)).toBe("#FFFFFF");
    expect(readableForeground(parseHex("#FACC15")!)).toBe("#111111");
    expect(readableForeground(parseHex("#1E3A8A")!)).toBe("#FFFFFF");
  });
});
