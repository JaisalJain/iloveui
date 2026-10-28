import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { LICENSE_PARAGRAPHS, licenseText } from "@/lib/license";

describe("license", () => {
  it("ships the repository's LICENSE file word for word as LICENSE.txt", () => {
    expect(licenseText()).toBe(readFileSync(path.join(process.cwd(), "LICENSE"), "utf8"));
  });

  it("is the MIT License", () => {
    expect(licenseText().startsWith("MIT License\n\nCopyright (c) 2026 ")).toBe(true);
    expect(LICENSE_PARAGRAPHS[0]).toMatch(/^Permission is hereby granted, free of charge, to any person/);
    expect(LICENSE_PARAGRAPHS.every((paragraph) => !paragraph.includes("\n"))).toBe(true);
  });
});
