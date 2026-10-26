import { describe, expect, it } from "vitest";
import { CATEGORIES, DesignMetaSchema, STYLE_FAMILIES } from "@/registry/schema";

const valid = {
  slug: "ledger-pricing",
  name: "Ledger pricing",
  category: "pricing",
  styleFamily: "swiss-minimal",
  tier: "pro",
  description: "A three-plan pricing table with a yearly toggle that states the saving and a clear tax line.",
  tags: ["pricing", "toggle", "table"],
  states: ["default", "loading", "error", "success"],
  hasMotion: true,
  dependencies: ["motion", "lucide-react"],
  registryDependencies: ["@iloveui/tokens"],
  version: "1.0.0",
  createdAt: "2026-10-26",
};

describe("catalog definitions", () => {
  it("matches the spec targets: 365 designs, 24 free, 18 categories, 8 style families", () => {
    expect(CATEGORIES).toHaveLength(18);
    expect(CATEGORIES.reduce((sum, category) => sum + category.target, 0)).toBe(365);
    expect(CATEGORIES.reduce((sum, category) => sum + category.free, 0)).toBe(24);
    expect(STYLE_FAMILIES).toHaveLength(8);
  });
});

describe("DesignMetaSchema", () => {
  it("accepts a complete meta.json", () => {
    expect(DesignMetaSchema.safeParse(valid).success).toBe(true);
  });

  it.each([
    ["a non-kebab slug", { slug: "Ledger Pricing" }],
    ["a reserved slug", { slug: "tokens" }],
    ["an unknown category", { category: "widgets" }],
    ["an unknown style family", { styleFamily: "brutal" }],
    ["a description over 160 characters", { description: "x".repeat(161) }],
    ["too few tags", { tags: ["pricing", "table"] }],
    ["too many tags", { tags: ["a", "b", "c", "d", "e", "f", "g", "h", "i"] }],
    ["duplicate tags", { tags: ["pricing", "pricing", "table"] }],
    ["an unknown state", { states: ["default", "busy"] }],
    ["states that do not start with default", { states: ["loading", "default"] }],
    ["an unknown dependency", { dependencies: ["framer-motion"] }],
    ["motion without hasMotion", { hasMotion: false }],
    ["missing the tokens item", { registryDependencies: [] }],
    ["a non-semver version", { version: "1.0" }],
    ["a datetime instead of a date", { createdAt: "2026-10-26T10:00:00Z" }],
    ["an impossible date", { createdAt: "2026-02-30" }],
    ["an unknown key", { price: 10 }],
  ])("rejects %s", (_label, override) => {
    expect(DesignMetaSchema.safeParse({ ...valid, ...override }).success).toBe(false);
  });
});
