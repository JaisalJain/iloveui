import { listDesignFolders, readDesignFile, type DesignFolder } from "@/scripts/lib/registry-files";

// Spec section 16: no Pro source line reaches a non-entitled request. The same distinctive-line approach as
// tests/unit/pro-source.test.ts: lines long and specific enough that finding one in a response means a leak.

const SOURCE_FILES = ["component.tsx", "component.html", "ai-prompt.md"] as const;

// Responses also carry site markup: the page <title> (the design's public name) and lucide icon geometry the site
// itself renders. Those lines are public, not source, so they are left out of the comparison.
const PUBLIC_MARKUP = /^<(title|path|circle|rect|line|polyline|polygon|ellipse)[\s>]/;
// A line that is only a string of class names (`"flex items-center gap-3",`) is shared vocabulary: the site and
// other designs use the same strings, and nobody can rebuild a design from one.
const CLASS_LIST = /^(["\'`])[\w:\[\]()\/.%#&>~=+!@,* -]+\1,?$/;
// So is a tag that carries only a class list (`<div class="ml-auto flex gap-2">`, `class="lucide lucide-search"`): the
// site's own layout and icons render the same markup.
const CLASS_MARKUP = /^(<[a-z][\w-]*\s+)?class(Name)?=(["'])[\w:\[\]()\/.%#&>~=+!@,* -]+\3\s*\/?>?$/;

function distinctiveLines(source: string): string[] {
  return source
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length >= 28 && !/^(import |export |\/\/|\*|<\/|\)|\}|"use client")/.test(line))
    .filter((line) => !PUBLIC_MARKUP.test(line) && !CLASS_LIST.test(line) && !CLASS_MARKUP.test(line));
}

function tierOf(folder: DesignFolder): string {
  return (JSON.parse(readDesignFile(folder, "meta.json")) as { tier: string }).tier;
}

function sourceLines(folder: DesignFolder): string[] {
  return SOURCE_FILES.flatMap((file) => distinctiveLines(readDesignFile(folder, file)));
}

/** Every Pro design with its distinctive source lines (lines shared with a free design are public anyway). */
export function proDesigns(): { slug: string; category: string; lines: string[] }[] {
  const folders = listDesignFolders();
  const freeLines = new Set(folders.filter((folder) => tierOf(folder) === "free").flatMap(sourceLines));
  return folders
    .filter((folder) => tierOf(folder) === "pro")
    .map((folder) => ({
      slug: folder.slug,
      category: folder.category,
      lines: sourceLines(folder).filter((line) => !freeLines.has(line)),
    }));
}

let freeSourceText: string | undefined;

/** Every free design's source in one string: text found inside it is public, even when it is part of a longer line. */
function freeSource(): string {
  freeSourceText ??= listDesignFolders()
    .filter((folder) => tierOf(folder) === "free")
    .flatMap((folder) => SOURCE_FILES.map((file) => readDesignFile(folder, file)))
    .join("\n");
  return freeSourceText;
}

export function freeDesigns(): { slug: string; category: string }[] {
  return listDesignFolders()
    .filter((folder) => tierOf(folder) === "free")
    .map(({ slug, category }) => ({ slug, category }));
}

/** The Pro source lines found in a response body, as text: empty means nothing leaked. */
export function leakedLines(body: string, lines: readonly string[]): string[] {
  // JSON escapes quotes and newlines and HTML escapes markup: check the raw text and both decoded forms.
  const json = body.replace(/\\n/g, "\n").replace(/\\"/g, '"').replace(/\\\\/g, "\\");
  const html = body
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&amp;/g, "&");
  return lines.filter((line) => [body, json, html].some((text) => text.includes(line)) && !freeSource().includes(line));
}
