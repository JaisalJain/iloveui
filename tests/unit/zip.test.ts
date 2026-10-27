import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { crc32, createZip, readZip } from "@/lib/zip";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

describe("zip", () => {
  it("computes the standard CRC-32", () => {
    expect(crc32(encoder.encode("123456789"))).toBe(0xcbf43926);
    expect(crc32(new Uint8Array())).toBe(0);
  });

  it("round-trips entries, including UTF-8 names and empty files", () => {
    const entries = [
      { name: "iloveui-demo/component.tsx", data: encoder.encode('export const x = "naïve";\n') },
      { name: "iloveui-demo/empty.txt", data: new Uint8Array() },
      { name: "iloveui-demo/LICENSE.txt", data: encoder.encode("License\n") },
    ];
    const archive = createZip(entries);
    const read = readZip(archive);
    expect(read.map((entry) => entry.name)).toEqual(entries.map((entry) => entry.name));
    expect(decoder.decode(read[0]!.data)).toBe('export const x = "naïve";\n');
    expect(read[1]!.data.byteLength).toBe(0);
  });

  it("is deterministic", () => {
    const entries = [{ name: "a.txt", data: encoder.encode("same") }];
    expect(createZip(entries)).toEqual(createZip(entries));
  });

  it("produces archives a standard zip implementation accepts", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "iloveui-zip-"));
    try {
      const file = path.join(dir, "test.zip");
      writeFileSync(
        file,
        createZip([
          { name: "folder/one.txt", data: encoder.encode("one") },
          { name: "folder/two.md", data: encoder.encode("# two\n") },
        ]),
      );
      const output = execFileSync(
        "python3",
        [
          "-c",
          "import sys, zipfile; z = zipfile.ZipFile(sys.argv[1]); assert z.testzip() is None; print('|'.join(n + ':' + z.read(n).decode() for n in z.namelist()))",
          file,
        ],
        { encoding: "utf8" },
      ).trim();
      expect(output).toBe("folder/one.txt:one|folder/two.md:# two\n".trim());
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("rejects data that is not an archive", () => {
    expect(() => readZip(encoder.encode("not a zip at all, definitely not"))).toThrow("Not a zip archive");
  });
});
