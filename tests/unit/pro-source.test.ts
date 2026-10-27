import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { listDesignFolders, readDesignFile } from "@/scripts/lib/registry-files";

// Spec section 10: Pro items exist only in server-side code paths, never in public/, static JSON or client bundles.
// Every distinctive line of every Pro design's source files must be absent from every public build artifact.

const PUBLIC_ARTIFACTS = ["public/r", "public/code", "public/catalog.json", "registry/generated/catalog.json"];

function files(target: string): string[] {
  if (!existsSync(target)) return [];
  if (target.endsWith(".json")) return [target];
  return readdirSync(target).map((name) => path.join(target, name));
}

/** Lines long and specific enough that finding one elsewhere means the source leaked. */
export function distinctiveLines(source: string): string[] {
  return (
    source
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length >= 28 && !/^(import |export |\/\/|\*|<\/|\)|\}|"use client")/.test(line))
      // A lone string of class names is shared vocabulary between designs and the site, not reusable source.
      .filter((line) => !/^(["\'`])[\w:\[\]()\/.%#&>~=+!@,* -]+\1,?$/.test(line))
      // So is a tag that carries only a class list (`<div class="ml-auto flex gap-2">`, `class="lucide lucide-search"`).
      .filter((line) => !/^(<[a-z][\w-]*\s+)?class(Name)?=(["'])[\w:\[\]()\/.%#&>~=+!@,* -]+\3\s*\/?>?$/.test(line))
  );
}

describe("Pro source never reaches public artifacts", () => {
  const SOURCE_FILES = ["component.tsx", "component.html", "ai-prompt.md"] as const;
  const folders = listDesignFolders();
  const tierOf = (folder: (typeof folders)[number]) =>
    (JSON.parse(readDesignFile(folder, "meta.json")) as { tier: string }).tier;
  const sourceLines = (folder: (typeof folders)[number]) =>
    SOURCE_FILES.flatMap((file) => distinctiveLines(readDesignFile(folder, file)));
  const proFolders = folders.filter((folder) => tierOf(folder) === "pro");
  const freeFolders = folders.filter((folder) => tierOf(folder) === "free");
  // Lines a free design also contains (token blocks, markers, shared helpers) are public by definition.
  const freeLines = new Set(freeFolders.flatMap(sourceLines));
  // So is any text inside a free design's source, even part of a longer line (`window.clearInterval(timer);`).
  const freeSource = freeFolders
    .flatMap((folder) => SOURCE_FILES.map((file) => readDesignFile(folder, file)))
    .join("\n");
  const artifacts = PUBLIC_ARTIFACTS.flatMap(files).map((file) => ({ file, text: readFileSync(file, "utf8") }));

  it("has the generated artifacts to check", () => {
    expect(artifacts.length).toBeGreaterThan(0);
  });

  it.each(proFolders.map((folder) => [folder.slug, folder] as const))("%s", (_slug, folder) => {
    const lines = sourceLines(folder).filter((line) => !freeLines.has(line));
    expect(lines.length).toBeGreaterThan(10);
    const leaks = artifacts.flatMap(({ file, text }) =>
      lines.filter((line) => text.includes(line) && !freeSource.includes(line)).map((line) => `${file}: ${line}`),
    );
    expect(leaks).toEqual([]);
  });
});
