import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { relatedDesigns } from "@/components/design-page/related";
import {
  aiPromptWithTokens,
  copyText,
  highlightCss,
  lineCount,
  replaceTokenBlock,
  themeFile,
  TOKEN_END,
  TOKEN_START,
} from "@/lib/code";
import { DEFAULT_THEME, themeCss } from "@/lib/theme";

const custom = themeCss({ ...DEFAULT_THEME, accent: "#0F9F6E", radius: 4, neutral: "stone" });
const html = readFileSync("registry/designs/forms/pillow-workspace-form/component.html", "utf8");

describe("replaceTokenBlock", () => {
  it("swaps the block between the markers and keeps everything else", () => {
    const result = replaceTokenBlock(html, custom);
    expect(result).toContain("--iu-accent: #0F9F6E;");
    expect(result).toContain("--iu-radius: 4px;");
    expect(result).not.toContain("--iu-radius: 10px;");
    const before = (text: string) => text.slice(0, text.indexOf(TOKEN_START));
    const after = (text: string) => text.slice(text.indexOf(TOKEN_END));
    expect(before(result)).toBe(before(html));
    expect(after(result)).toBe(after(html));
  });

  it("indents the new block like its markers", () => {
    const source =
      "<style>\n      /* iloveui:tokens:start */\n      :root { --iu-radius: 1px; }\n      /* iloveui:tokens:end */\n</style>";
    const result = replaceTokenBlock(source, ":root {\n  --iu-radius: 4px;\n}\n\n.dark {\n  --iu-radius: 4px;\n}\n");
    expect(result).toBe(
      "<style>\n      /* iloveui:tokens:start */\n      :root {\n        --iu-radius: 4px;\n      }\n      .dark {\n        --iu-radius: 4px;\n      }\n      /* iloveui:tokens:end */\n</style>",
    );
  });

  it("is stable when applied twice", () => {
    const once = replaceTokenBlock(html, custom);
    expect(replaceTokenBlock(once, custom)).toBe(once);
  });

  it("leaves files without markers alone", () => {
    expect(replaceTokenBlock("<div>no tokens</div>", custom)).toBe("<div>no tokens</div>");
  });
});

describe("copyText", () => {
  it("copies TSX as it is, HTML with the current tokens and theme.css generated", () => {
    expect(copyText({ name: "component.tsx", code: "export const a = 1;\n" }, custom)).toBe("export const a = 1;\n");
    expect(copyText({ name: "component.html", code: html }, custom)).toContain("--iu-accent: #0F9F6E;");
    const theme = copyText({ name: "theme.css", code: "" }, custom);
    expect(theme).toBe(themeFile(custom));
    expect(theme).toContain(":root {");
    expect(theme).toContain(".dark {");
  });
});

describe("aiPromptWithTokens", () => {
  it("appends a Theme tokens section with the CSS in a fenced block", () => {
    const prompt = aiPromptWithTokens("# Pillow workspace form\n\n## Component\n\nText.\n\n", custom);
    expect(prompt.startsWith("# Pillow workspace form\n\n## Component\n\nText.\n\n## Theme tokens\n")).toBe(true);
    expect(prompt).toContain("```css\n:root {");
    expect(prompt).toContain("--iu-accent: #0F9F6E;");
    expect(prompt.trimEnd().endsWith("```")).toBe(true);
  });
});

describe("highlightCss", () => {
  it("emits one line span per line with role classes and escapes markup", () => {
    const output = highlightCss(themeFile(custom));
    expect(output.startsWith('<pre class="iu-code"><code><span class="line">')).toBe(true);
    expect(output.match(/<span class="line">/g)).toHaveLength(lineCount(themeFile(custom)));
    expect(output).toContain('<span class="k-cool">--iu-accent</span>');
    expect(output).toContain('<span class="k-warm">:root</span>');
    expect(highlightCss("/* <script> */")).toContain("&lt;script&gt;");
  });
});

describe("relatedDesigns", () => {
  const make = (slug: string, category: string, styleFamily: string, createdAt: string) => ({
    slug,
    category: category as never,
    styleFamily: styleFamily as never,
    createdAt,
  });
  const current = make("current", "hero", "editorial", "2026-10-01");
  const all = [
    current,
    make("other-new", "forms", "playful", "2026-10-20"),
    make("family", "forms", "editorial", "2026-09-01"),
    make("same-old", "hero", "luxury", "2026-08-01"),
    make("same-new", "hero", "playful", "2026-10-10"),
    make("other-old", "tables", "luxury", "2026-07-01"),
  ];

  it("ranks same category, then same family, then the newest others, and skips the design itself", () => {
    expect(relatedDesigns(current, all).map((design) => design.slug)).toEqual([
      "same-new",
      "same-old",
      "family",
      "other-new",
    ]);
  });

  it("returns fewer when the catalog is small", () => {
    expect(relatedDesigns(current, [current, all[1]!]).map((design) => design.slug)).toEqual(["other-new"]);
  });
});
