import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { TOKEN_END, TOKEN_START } from "@/lib/code";
import { designMetrics } from "@/lib/db/schema";
import { downloadFileName, themeFromSearchParams, themeSearchParams, themeZip } from "@/lib/download";
import { DEFAULT_THEME } from "@/lib/theme";
import { recordCopy, recordDownload, recordInstall } from "@/lib/metrics";
import { createZip, readZip } from "@/lib/zip";
import { createTestDb, type TestDb } from "./helpers/d1";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const HTML = [
  "<!doctype html>",
  "<style>",
  `  ${TOKEN_START}`,
  "  :root { --iu-accent: #FF4D1F; }",
  `  ${TOKEN_END}`,
  "</style>",
  "<main>Northpeak billing</main>",
  "",
].join("\n");

function archive() {
  return createZip([
    { name: "iloveui-slab-pricing/component.tsx", data: encoder.encode("export default function SlabPricing() {}\n") },
    { name: "iloveui-slab-pricing/component.html", data: encoder.encode(HTML) },
    { name: "iloveui-slab-pricing/ai-prompt.md", data: encoder.encode("# Slab pricing\n") },
    { name: "iloveui-slab-pricing/LICENSE.txt", data: encoder.encode("iloveui License\n") },
  ]);
}

describe("theme query parameters", () => {
  it("round-trips a theme", () => {
    const theme = { accent: "#00AA55", neutral: "stone", radius: 4, font: "geist", density: "compact" } as const;
    expect(themeFromSearchParams(themeSearchParams(theme))).toEqual(theme);
  });

  it("falls back field by field on missing or invalid values", () => {
    expect(themeFromSearchParams(new URLSearchParams())).toEqual(DEFAULT_THEME);
    expect(
      themeFromSearchParams(new URLSearchParams("accent=nothex&neutral=plaid&radius=999&font=comic&density=x")),
    ).toEqual({ ...DEFAULT_THEME, radius: 24 });
    expect(themeFromSearchParams(new URLSearchParams("accent=%2300aa55&radius="))).toEqual({
      ...DEFAULT_THEME,
      accent: "#00AA55",
    });
  });
});

describe("themed zip", () => {
  it("replaces the HTML token block and adds theme.css after the HTML", () => {
    const theme = { ...DEFAULT_THEME, accent: "#00AA55", radius: 4 };
    const entries = readZip(themeZip(archive(), theme));
    expect(entries.map((entry) => entry.name)).toEqual([
      "iloveui-slab-pricing/component.tsx",
      "iloveui-slab-pricing/component.html",
      "iloveui-slab-pricing/theme.css",
      "iloveui-slab-pricing/ai-prompt.md",
      "iloveui-slab-pricing/LICENSE.txt",
    ]);
    const html = decoder.decode(entries[1]?.data);
    expect(html).toContain("--iu-accent: #00AA55;");
    expect(html).toContain("--iu-radius: 4px;");
    expect(html).not.toContain("#FF4D1F");
    expect(html).toContain("<main>Northpeak billing</main>");
    const css = decoder.decode(entries[2]?.data);
    expect(css).toContain("--iu-accent: #00AA55;");
    expect(css).toContain(".dark {");
    expect(decoder.decode(entries[0]?.data)).toBe("export default function SlabPricing() {}\n");
  });

  it("is idempotent when the archive already has a theme.css", () => {
    const once = themeZip(archive(), DEFAULT_THEME);
    const twice = themeZip(once, DEFAULT_THEME);
    expect(readZip(twice).filter((entry) => entry.name.endsWith("theme.css"))).toHaveLength(1);
  });

  it("names the file after the design", () => {
    expect(downloadFileName("slab-pricing")).toBe("iloveui-slab-pricing.zip");
  });
});

describe("download and install counters", () => {
  let t: TestDb;
  beforeAll(async () => {
    t = await createTestDb();
  });
  afterAll(async () => {
    await t?.dispose();
  });

  it("counts downloads and installs next to copies", async () => {
    await recordDownload(t.db, "slab-pricing");
    await recordDownload(t.db, "slab-pricing");
    await recordInstall(t.db, "slab-pricing");
    await recordCopy(t.db, "slab-pricing");
    expect(await t.db.select().from(designMetrics)).toEqual([
      { slug: "slab-pricing", copies: 1, installs: 1, downloads: 2 },
    ]);
  });
});
