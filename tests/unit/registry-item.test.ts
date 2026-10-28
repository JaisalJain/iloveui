import { describe, expect, it } from "vitest";
import type { DesignMeta } from "@/registry/schema";
import { highlight } from "@/scripts/lib/highlight";
import { designItem, registryIndex, tokensItem } from "@/scripts/lib/registry-item";

const meta: DesignMeta = {
  slug: "ledger-pricing",
  name: "Ledger pricing",
  category: "pricing",
  styleFamily: "swiss-minimal",
  tier: "pro",
  description: "A pricing table used by the registry item tests.",
  tags: ["pricing", "table", "toggle"],
  states: ["default"],
  hasMotion: false,
  dependencies: ["lucide-react"],
  registryDependencies: ["@iloveui/tokens"],
  version: "1.0.0",
  createdAt: "2026-10-26",
};

describe("registry items", () => {
  it("builds the tokens theme item with all ten variables", () => {
    const item = tokensItem();
    expect(item.name).toBe("tokens");
    expect(item.type).toBe("registry:theme");
    expect(Object.keys(item.cssVars?.light ?? {})).toHaveLength(10);
    expect(item.cssVars?.light?.["iu-accent"]).toBe("#FF4D1F");
  });

  it("builds a design item that installs into components/iloveui", () => {
    const item = designItem(meta, "export default function X() {}\n", "https://example.com");
    expect(item.type).toBe("registry:block");
    expect(item.registryDependencies).toEqual(["@iloveui/tokens"]);
    expect(item.files?.[0]).toMatchObject({
      target: "@components/iloveui/ledger-pricing.tsx",
      content: "export default function X() {}\n",
    });
    expect(item.meta).toMatchObject({ tier: "pro", url: "https://example.com/designs/pricing/ledger-pricing" });
  });

  it("lists designs in the index without any file content", () => {
    const index = registryIndex([meta], "https://example.com");
    expect(index.items.map((item) => item.name)).toEqual(["tokens", "ledger-pricing"]);
    expect(JSON.stringify(index)).not.toContain("content");
  });
});

describe("highlighting", () => {
  it("emits role classes instead of inline styles and escapes markup", () => {
    const html = highlight('const greeting = "<b>hi</b>"; // say hi\n', "tsx");
    expect(html).toContain('class="iu-code"');
    expect(html).toContain("k-warm");
    expect(html).toContain("k-cool");
    expect(html).toContain("k-comment");
    expect(html).not.toContain("style=");
    expect(html).toContain("&#x3C;b>");
  });
});
