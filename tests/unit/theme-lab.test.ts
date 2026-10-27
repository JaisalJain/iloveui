import { describe, expect, it } from "vitest";
import {
  contrastWarning,
  createPatchScheduler,
  initialDockView,
  parseHexInput,
  radiusForKey,
} from "@/components/theme-lab/logic";
import { DEFAULT_THEME, type ThemeState } from "@/lib/theme";

describe("Theme Lab custom hex", () => {
  it("accepts #RGB and #RRGGBB, with or without the hash, and normalizes to uppercase #RRGGBB", () => {
    expect(parseHexInput("#2f5bea")).toEqual({ ok: true, hex: "#2F5BEA" });
    expect(parseHexInput("#0a8")).toEqual({ ok: true, hex: "#00AA88" });
    expect(parseHexInput("  0F9F6E ")).toEqual({ ok: true, hex: "#0F9F6E" });
  });

  it("rejects everything else with a short reason", () => {
    for (const bad of ["", "   ", "#12", "#1234", "#12345", "#GGGGGG", "red", "#FF4D1F00", "rgb(0,0,0)"]) {
      const result = parseHexInput(bad);
      expect(result.ok, bad).toBe(false);
      if (!result.ok) expect(result.error.length).toBeGreaterThan(0);
    }
  });
});

describe("Theme Lab contrast warning", () => {
  it("stays quiet for the presets that read on both backgrounds", () => {
    expect(contrastWarning(DEFAULT_THEME)).toBeNull();
  });

  it("names the background an accent disappears on", () => {
    expect(contrastWarning({ ...DEFAULT_THEME, accent: "#FFF6D5" })).toMatch(/^Low contrast on light backgrounds/);
    expect(contrastWarning({ ...DEFAULT_THEME, accent: "#1A1A1D" })).toMatch(/^Low contrast on dark backgrounds/);
    expect(contrastWarning({ ...DEFAULT_THEME, accent: "#808080" })).toBeNull();
  });
});

describe("Theme Lab dock view", () => {
  it("remembers the choice, else expands on wide screens only", () => {
    expect(initialDockView("collapsed", true)).toBe("collapsed");
    expect(initialDockView("expanded", false)).toBe("expanded");
    expect(initialDockView(null, true)).toBe("expanded");
    expect(initialDockView(null, false)).toBe("collapsed");
    expect(initialDockView("garbage", false)).toBe("collapsed");
  });
});

describe("Theme Lab frame scheduler", () => {
  function setup() {
    const frames = new Map<number, () => void>();
    let nextId = 1;
    const applied: Partial<ThemeState>[] = [];
    const scheduler = createPatchScheduler<ThemeState>(
      (patch) => applied.push(patch),
      (callback) => {
        frames.set(nextId, callback);
        return nextId++;
      },
      (id) => frames.delete(id),
    );
    const tick = () => {
      const pending = [...frames.values()];
      frames.clear();
      for (const callback of pending) callback();
    };
    return { scheduler, applied, frames, tick };
  }

  it("applies a burst of updates once per frame, with the latest values merged", () => {
    const { scheduler, applied, frames, tick } = setup();
    for (let radius = 0; radius <= 24; radius++) scheduler.schedule({ radius });
    scheduler.schedule({ neutral: "stone" });
    expect(frames.size).toBe(1);
    expect(applied).toEqual([]);
    tick();
    expect(applied).toEqual([{ radius: 24, neutral: "stone" }]);
    tick();
    expect(applied).toHaveLength(1);
  });

  it("flushes pending work immediately and cancels the frame", () => {
    const { scheduler, applied, frames } = setup();
    scheduler.schedule({ radius: 4 });
    scheduler.flush();
    expect(applied).toEqual([{ radius: 4 }]);
    expect(frames.size).toBe(0);
    scheduler.flush();
    expect(applied).toHaveLength(1);
  });
});

describe("Theme Lab radius keys", () => {
  it("steps like Radix Slider and stays inside the range", () => {
    expect(radiusForKey("ArrowRight", 10, 0, 24)).toBe(11);
    expect(radiusForKey("ArrowDown", 10, 0, 24)).toBe(9);
    expect(radiusForKey("PageUp", 20, 0, 24)).toBe(24);
    expect(radiusForKey("PageDown", 5, 0, 24)).toBe(0);
    expect(radiusForKey("Home", 10, 0, 24)).toBe(0);
    expect(radiusForKey("End", 10, 0, 24)).toBe(24);
  });

  it("ignores every other key", () => {
    expect(radiusForKey("Enter", 10, 0, 24)).toBeNull();
    expect(radiusForKey("a", 10, 0, 24)).toBeNull();
  });
});
