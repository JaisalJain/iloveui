import { describe, expect, it } from "vitest";
import type { DesignMeta } from "@/registry/schema";
import {
  aiPromptProblems,
  componentProblems,
  htmlProblems,
  notesProblems,
  pascalCase,
  validateCatalog,
} from "@/scripts/lib/validate";

const meta: DesignMeta = {
  slug: "ledger-pricing",
  name: "Ledger pricing",
  category: "pricing",
  styleFamily: "swiss-minimal",
  tier: "pro",
  description: "A pricing table used by the validator tests to check every rule.",
  tags: ["pricing", "table", "toggle"],
  states: ["default", "loading"],
  hasMotion: false,
  dependencies: ["lucide-react"],
  registryDependencies: ["@iloveui/tokens"],
  version: "1.0.0",
  createdAt: "2026-10-26",
};

const good = `"use client";

import { useState } from "react";
import { Check } from "lucide-react";

export type LedgerPricingProps = { className?: string };

export function LedgerPricing({ className = "" }: LedgerPricingProps) {
  const [on] = useState(false);
  return (
    <section className={\`font-(family-name:--iu-font) rounded-(--iu-radius) bg-(--iu-surface) py-[calc(8px*var(--iu-density))] pointer-fine:hover:bg-(--iu-background) \${className}\`}>
      <p>Order #2817 {on ? "on" : "off"}</p>
      <Check size={16} strokeWidth={1.5} />
    </section>
  );
}

export default LedgerPricing;
`;

describe("component rules", () => {
  it("accepts a component that follows the contract", () => {
    expect(componentProblems(good, meta)).toEqual([]);
  });

  it("derives the component name from the slug", () => {
    expect(pascalCase("ledger-pricing")).toBe("LedgerPricing");
  });

  it.each([
    ["a missing use client directive", good.replace('"use client";\n', ""), "use client"],
    ["an import outside the allowed packages", good.replace('"lucide-react"', '"@radix-ui/react-icons"'), "only react"],
    ["a missing named export", good.replace("export function LedgerPricing", "function LedgerPricing"), "named export"],
    ["a missing default export", good.replace("export default LedgerPricing;", ""), "default export"],
    ["bare hover", good.replace("pointer-fine:hover:", "hover:"), "pointer-fine"],
    ["v3 variable syntax", good.replace("bg-(--iu-surface)", "bg-[--iu-surface]"), "v3"],
    ["a hard-coded palette color", good.replace("bg-(--iu-surface)", "bg-zinc-100"), "palette"],
    ["a hard-coded hex color", good.replace("bg-(--iu-surface)", "bg-[#ff0000]"), "hex"],
    ["a color function", good.replace("bg-(--iu-surface)", "bg-[rgb(255,0,0)]"), "color function"],
    ["an external URL", good.replace("<p>", '<a href="https://example.org">x</a><p>'), "external URL"],
    ["an image", good.replace("<p>", '<img alt="" src="/x.png" /><p>'), "<img>"],
    ["storage access", good.replace("const [on]", "localStorage.getItem('x'); const [on]"), "storage"],
    ["no density token", good.replace("py-[calc(8px*var(--iu-density))] ", ""), "--iu-density"],
  ])("rejects %s", (_label, source, expected) => {
    expect(componentProblems(source, meta).join("\n")).toContain(expected);
  });

  it("allows semantic status hues for errors and success", () => {
    const status = good.replace("bg-(--iu-surface)", "bg-(--iu-surface) text-red-700 dark:text-red-300");
    expect(componentProblems(status, meta)).toEqual([]);
  });

  it("flags dependencies that disagree with the imports", () => {
    expect(componentProblems(good, { ...meta, dependencies: ["motion", "lucide-react"], hasMotion: true })).toContain(
      'meta.json lists "motion" but component.tsx does not import it',
    );
  });
});

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Ledger pricing · iloveui</title>
    <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4.3.3"></script>
    <style type="text/tailwindcss">
      @custom-variant dark (&:where(.dark, .dark *));
      /* iloveui:tokens:start */
      :root { --iu-accent: #FF4D1F; --iu-accent-foreground: #111111; --iu-background: #FAFAFA; --iu-surface: #FFFFFF; --iu-border: #E4E4E7; --iu-foreground: #18181B; --iu-muted: #52525B; --iu-radius: 10px; --iu-font: system-ui; --iu-density: 1; }
      .dark { --iu-accent: #FF4D1F; --iu-accent-foreground: #111111; --iu-background: #09090B; --iu-surface: #18181B; --iu-border: #2E2E33; --iu-foreground: #FAFAFA; --iu-muted: #A1A1AA; }
      /* iloveui:tokens:end */
    </style>
  </head>
  <body class="bg-(--iu-background)">
    <!-- iloveui:component:start -->
    <section class="pointer-fine:hover:bg-(--iu-surface)">Pricing</section>
    <!-- iloveui:component:end -->
  </body>
</html>`;

describe("HTML rules", () => {
  it("accepts a document that follows the contract", () => {
    expect(htmlProblems(html)).toEqual([]);
  });

  it.each([
    ["no doctype", html.replace("<!doctype html>\n", ""), "doctype"],
    ["a different Tailwind script", html.replace("@4.3.3", "@4"), "load Tailwind"],
    ["no token block", html.replace("/* iloveui:tokens:start */", ""), "tokens"],
    ["a missing token", html.replace(" --iu-density: 1;", ""), "--iu-density"],
    ["no component markers", html.replace("<!-- iloveui:component:start -->", ""), "component"],
    ["bare hover", html.replace("pointer-fine:hover:", "hover:"), "pointer-fine"],
  ])("rejects %s", (_label, source, expected) => {
    expect(htmlProblems(source).join("\n")).toContain(expected);
  });
});

describe("documentation rules", () => {
  const prompt = [
    "# Ledger pricing",
    "## Component",
    "## Props",
    "## Tokens",
    "## Dependencies",
    "## Integration steps",
    "npx shadcn@latest add @iloveui/ledger-pricing",
    "## Customization ideas",
  ].join("\n\n");

  it("requires the six AI prompt sections in order and the install command", () => {
    expect(aiPromptProblems(prompt, meta)).toEqual([]);
    expect(aiPromptProblems(prompt.replace("## Props", "## Properties"), meta)).toHaveLength(1);
    expect(aiPromptProblems(prompt.replace("@iloveui/ledger-pricing", "@iloveui/x"), meta)).toHaveLength(1);
  });

  it("requires a yes for every taste question", () => {
    const notes = [
      "## Usage notes",
      "- Use it on pricing pages.",
      "## Taste self-review",
      "- One clear focal point: Yes. The middle plan.",
      "- Spacing on the 4px scale: Yes. Every gap is a multiple of 4px.",
      "- Belongs in a Linear, Stripe or Vercel product: Yes. Calm and exact.",
      "- Meets its category brief: Yes. Every point is covered.",
      "- Distinct from every other design in its category: Yes. Only one with a ledger layout.",
    ].join("\n");
    expect(notesProblems(notes)).toEqual([]);
    expect(notesProblems(notes.replace("focal point: Yes.", "focal point: Mostly."))).toHaveLength(1);
    expect(notesProblems(notes.replace("## Usage notes", "## Usage"))).toHaveLength(1);
  });
});

describe("validateCatalog", () => {
  const design = (slug: string, overrides: Partial<DesignMeta> = {}): DesignMeta => ({
    ...meta,
    slug,
    name: slug,
    ...overrides,
  });

  it("keeps each category within its free allowance from section 9.1", () => {
    const free = (slug: string) => design(slug, { category: "micro-interactions", tier: "free" });
    expect(validateCatalog([free("slide-to-pay"), free("morphing-submit")])).toEqual([]);
    expect(validateCatalog([free("slide-to-pay"), free("morphing-submit"), free("hold-to-confirm")])).toEqual([
      { where: "micro-interactions", message: "3 free designs; this category has 2" },
    ]);
    expect(validateCatalog([design("settings-panel", { category: "settings", tier: "free" })])).toHaveLength(1);
  });

  it("rejects repeated slugs and names", () => {
    expect(validateCatalog([design("ledger"), design("ledger")])).toHaveLength(2);
  });
});
