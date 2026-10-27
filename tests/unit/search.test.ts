import Fuse from "fuse.js";
import { describe, expect, it } from "vitest";
import { createSearcher, matchesAllTokens, queryTokens, toFuseExpression, toFuseQuery } from "@/lib/search";

const items = [
  { label: "Toggle light and dark theme", keywords: ["mode"] },
  { label: "Show keyboard shortcuts", keywords: ["keys", "help"] },
  { label: "Ledger pricing", keywords: ["pricing", "billing"] },
];

describe("search", () => {
  it("tokenizes queries and strips extended-search operators", () => {
    expect(queryTokens("  Toggle   THEME ")).toEqual(["toggle", "theme"]);
    expect(queryTokens("!pricing 'exact ^start end$ =x")).toEqual(["pricing", "exact", "start", "end", "x"]);
    expect(toFuseQuery("dark  theme")).toBe("dark theme");
  });

  it("requires every word in the instant fallback", () => {
    expect(matchesAllTokens(["Toggle light and dark theme"], "toggle theme")).toBe(true);
    expect(matchesAllTokens(["Toggle light and dark theme"], "toggle pricing")).toBe(false);
  });

  it("finds multi-word and slightly misspelled queries with Fuse", () => {
    const fuse = createSearcher(Fuse, items, ["label", "keywords"]);
    const labels = (query: string) => fuse.search(toFuseQuery(query)).map((result) => result.item.label);
    expect(labels("toggle theme")[0]).toBe("Toggle light and dark theme");
    expect(labels("keybord shortcts")[0]).toBe("Show keyboard shortcuts");
    expect(labels("billing")[0]).toBe("Ledger pricing");
    expect(labels("don't")).toEqual([]);
  });

  it("lets each word of a query match a different field", () => {
    const fuse = createSearcher(Fuse, items, ["label", "keywords"]);
    const labels = (query: string) =>
      fuse.search(toFuseExpression(query, ["label", "keywords"])).map((result) => result.item.label);
    expect(labels("ledger billing")[0]).toBe("Ledger pricing");
    expect(labels("keyboard help")[0]).toBe("Show keyboard shortcuts");
    expect(labels("ledger mode")).toEqual([]);
  });
});
