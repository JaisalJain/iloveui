import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";

// Vitest cannot compile MDX, so each entry's module is mocked with the metadata its file exports. The export is
// evaluated from the file itself, which keeps this test on the real content rather than a copy.

const DIR = path.join(process.cwd(), "content/changelog");
const FILES = readdirSync(DIR).filter((name) => name.endsWith(".mdx"));

function exportedMetadata(file: string): unknown {
  const source = readFileSync(path.join(DIR, file), "utf8");
  const match = /^export const metadata = (\{[\s\S]*?\n\});?$/m.exec(source);
  if (!match?.[1]) throw new Error(`${file} does not start with export const metadata = { ... }`);
  return new Function(`return (${match[1]});`)();
}

async function loadChangelog() {
  vi.resetModules();
  for (const file of FILES) {
    const metadata = exportedMetadata(file);
    vi.doMock(`/content/changelog/${file}`, () => ({ metadata }));
  }
  return import("@/lib/changelog");
}

async function loadEntries() {
  return (await loadChangelog()).getChangelogEntries();
}

describe("changelog", () => {
  it("has one entry per MDX file", async () => {
    const entries = await loadEntries();
    expect(FILES.length).toBeGreaterThan(0);
    expect(entries.map((entry) => entry.slug).sort()).toEqual(FILES.map((file) => file.replace(/\.mdx$/, "")).sort());
  });

  it("lists entries newest first", async () => {
    const entries = await loadEntries();
    for (let i = 1; i < entries.length; i += 1) {
      const previous = entries[i - 1]!;
      const current = entries[i]!;
      expect(previous.date >= current.date, `${previous.slug} before ${current.slug}`).toBe(true);
    }
  });

  it("gives every entry an ISO date, a title and a summary", async () => {
    for (const entry of await loadEntries()) {
      expect(entry.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Number.isNaN(Date.parse(entry.date))).toBe(false);
      expect(entry.title.length).toBeGreaterThan(0);
      expect(entry.summary.length).toBeGreaterThan(0);
      expect(entry.slug.startsWith(entry.date), `${entry.slug} is named after its date`).toBe(true);
    }
  });

  it("has unique slugs and titles", async () => {
    const entries = await loadEntries();
    expect(new Set(entries.map((entry) => entry.slug)).size).toBe(entries.length);
    expect(new Set(entries.map((entry) => entry.title)).size).toBe(entries.length);
  });

  it("sorts same-day entries by file name, newest first, and rejects malformed metadata", async () => {
    const { toChangelogEntries } = await loadChangelog();
    const sorted = toChangelogEntries({
      "/content/changelog/2026-11-02-a.mdx": { date: "2026-11-02", title: "A", summary: "a" },
      "/content/changelog/2026-11-03-x.mdx": { date: "2026-11-03", title: "X", summary: "x" },
      "/content/changelog/2026-11-02-b.mdx": { date: "2026-11-02", title: "B", summary: "b" },
    });
    expect(sorted.map((entry) => entry.slug)).toEqual(["2026-11-03-x", "2026-11-02-b", "2026-11-02-a"]);
    expect(() =>
      toChangelogEntries({ "/content/changelog/2026-11-02-a.mdx": { date: "Nov 2", title: "A", summary: "a" } }),
    ).toThrow(/ISO date/);
    expect(() =>
      toChangelogEntries({ "/content/changelog/2026-11-02-a.mdx": { date: "2026-11-02", summary: "a" } }),
    ).toThrow(/title/);
  });
});
