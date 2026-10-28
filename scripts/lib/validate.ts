import { existsSync } from "node:fs";
import path from "node:path";
import * as z from "zod";
import { DesignMetaSchema, type DesignMeta } from "../../registry/schema";
import { DESIGN_FILES, readDesignFile, type DesignFolder } from "./registry-files";

export type Problem = { where: string; message: string };

export const TAILWIND_BROWSER_URL = "https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4.3.3";
const ALLOWED_IMPORTS = new Set(["react", "motion/react", "lucide-react"]);
const STATUS_HUES = new Set(["red", "rose", "emerald", "green", "amber"]);
const PALETTE =
  /\b(?:bg|text|border|ring|outline|fill|stroke|from|via|to|decoration|divide|shadow|accent|caret|placeholder|ring-offset)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|mauve|olive|mist|taupe)-\d{2,3}\b/g;
const TOKENS = [
  "--iu-accent",
  "--iu-accent-foreground",
  "--iu-background",
  "--iu-surface",
  "--iu-border",
  "--iu-foreground",
  "--iu-muted",
  "--iu-radius",
  "--iu-font",
  "--iu-density",
] as const;

export const AI_PROMPT_SECTIONS = [
  "Component",
  "Props",
  "Tokens",
  "Dependencies",
  "Integration steps",
  "Customization ideas",
] as const;

export const SELF_REVIEW_ITEMS = [
  "One clear focal point",
  "Spacing on the 4px scale",
  "Belongs in a Linear, Stripe or Vercel product",
  "Meets its category brief",
  "Distinct from every other design in its category",
] as const;

export function pascalCase(slug: string): string {
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

/** Lines that are code, without // and block comments (good enough for rule checks, not a parser). */
function withoutComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`])\/\/.*$/gm, "$1");
}

function lineOf(source: string, index: number): number {
  return source.slice(0, index).split("\n").length;
}

/** Shared styling rules for component.tsx and component.html. */
function styleProblems(source: string, file: string): string[] {
  const problems: string[] = [];
  const code = withoutComments(source);

  for (const match of code.matchAll(/\[--[\w-]+\]/g)) {
    problems.push(`${file}:${lineOf(code, match.index)}: "${match[0]}" is Tailwind v3 variable syntax; write (--name)`);
  }
  for (const match of code.matchAll(/\bfont-\(--/g)) {
    problems.push(
      `${file}:${lineOf(code, match.index)}: font-(--x) sets font-weight; use font-(family-name:--iu-font)`,
    );
  }
  // Hover only behind pointer-fine: the variant chain before hover: must include pointer-fine.
  for (const match of code.matchAll(/(?<=^|[\s"'`{(])((?:[\w[\]&=@().-]+:)*?)((?:group-|peer-)?hover):/gm)) {
    const chain = match[1] ?? "";
    if (!chain.includes("pointer-fine:")) {
      problems.push(
        `${file}:${lineOf(code, match.index)}: "${chain}${match[2]}:" must be gated with pointer-fine: (spec 7.3)`,
      );
    }
  }
  for (const match of code.matchAll(PALETTE)) {
    if (!STATUS_HUES.has(match[1] ?? "")) {
      problems.push(`${file}:${lineOf(code, match.index)}: hard-coded palette color "${match[0]}"; use --iu-* tokens`);
    }
  }
  for (const match of code.matchAll(/\b(?:rgba?|hsla?|oklch|oklab|lab|lch|hwb)\(/g)) {
    problems.push(`${file}:${lineOf(code, match.index)}: hard-coded color function "${match[0]}"; use --iu-* tokens`);
  }
  // Hex only in color positions (arbitrary values, SVG paint, color style keys), so content such as "Order #2817"
  // is not mistaken for a color.
  const HEX_IN_COLOR_POSITION =
    /(?:\[|(?:fill|stroke|color|stop-?[cC]olor|background(?:Color)?|border(?:Color)?|outline(?:Color)?|(?:box|text)Shadow)\s*[=:]\s*\{?\s*["'`]?)#[0-9a-fA-F]{3,8}\b/g;
  for (const match of code.matchAll(HEX_IN_COLOR_POSITION)) {
    problems.push(`${file}:${lineOf(code, match.index)}: hard-coded hex color "${match[0]}"; use --iu-* tokens`);
  }
  for (const match of code.matchAll(/https?:\/\/[^\s"'`)<>]+/g)) {
    const url = match[0];
    if (url.startsWith("http://www.w3.org/") || url === TAILWIND_BROWSER_URL) continue;
    problems.push(`${file}:${lineOf(code, match.index)}: external URL "${url}" (designs ship no external resources)`);
  }
  if (/<img\b/i.test(code)) problems.push(`${file}: <img> is not allowed; draw visuals with CSS and SVG`);
  return problems;
}

export function componentProblems(source: string, meta: DesignMeta): string[] {
  const problems: string[] = [];
  const code = withoutComments(source);
  const name = pascalCase(meta.slug);

  if (!/^\s*["']use client["'];?/.test(source)) problems.push('component.tsx must start with "use client";');

  const imported = new Set<string>();
  for (const match of code.matchAll(/^\s*import\s+(?:type\s+)?(?:[\s\S]*?\sfrom\s+)?["']([^"']+)["']/gm)) {
    const specifier = match[1]!;
    imported.add(specifier);
    if (!ALLOWED_IMPORTS.has(specifier)) {
      problems.push(`component.tsx imports "${specifier}"; only react, motion/react and lucide-react are allowed`);
    }
  }
  const packages = new Set<string>();
  if (imported.has("motion/react")) packages.add("motion");
  if (imported.has("lucide-react")) packages.add("lucide-react");
  const declared = new Set(meta.dependencies);
  for (const dep of packages)
    if (!declared.has(dep as never)) problems.push(`meta.json dependencies is missing "${dep}"`);
  for (const dep of declared)
    if (!packages.has(dep)) problems.push(`meta.json lists "${dep}" but component.tsx does not import it`);

  if (!new RegExp(`export\\s+(?:function|const)\\s+${name}\\b`).test(code)) {
    problems.push(`component.tsx must have a named export "${name}"`);
  }
  if (!/export\s+default\s+/.test(code)) problems.push("component.tsx must have a default export");
  if (!new RegExp(`export\\s+(?:type|interface)\\s+${name}Props\\b`).test(code)) {
    problems.push(`component.tsx must export its props type "${name}Props"`);
  }

  for (const token of ["--iu-font", "--iu-radius", "--iu-density"]) {
    if (!code.includes(token)) problems.push(`component.tsx never reads ${token}`);
  }
  if (!/--iu-(?:accent|background|surface|foreground|muted|border)/.test(code)) {
    problems.push("component.tsx reads no color tokens");
  }

  if (meta.hasMotion) {
    const handlesReducedMotion =
      /useReducedMotion|reducedMotion=|motion-reduce:|motion-safe:|prefers-reduced-motion/.test(code);
    if (!handlesReducedMotion) problems.push("hasMotion is true but component.tsx never handles reduced motion");
  }
  if (imported.has("motion/react") && !/reducedMotion=["{]?["']?user/.test(code)) {
    problems.push('components that use motion wrap their root in <MotionConfig reducedMotion="user">');
  }
  if (/\b(?:localStorage|sessionStorage|document\.cookie)\b|\bfetch\(/.test(code)) {
    problems.push("component.tsx must not use storage, cookies or network requests");
  }

  problems.push(...styleProblems(source, "component.tsx"));
  return problems;
}

function tokenBlock(html: string): { root: string; dark: string } | null {
  const block = /\/\*\s*iloveui:tokens:start\s*\*\/([\s\S]*?)\/\*\s*iloveui:tokens:end\s*\*\//.exec(html)?.[1];
  if (!block) return null;
  const root = /:root\s*\{([^}]*)\}/.exec(block)?.[1] ?? "";
  const dark = /\.dark\s*\{([^}]*)\}/.exec(block)?.[1] ?? "";
  return { root, dark };
}

export function htmlProblems(source: string): string[] {
  const problems: string[] = [];
  if (!/^\s*<!doctype html>/i.test(source)) problems.push("component.html must start with <!doctype html>");
  if (!/<html\s+lang="[a-z-]+"/i.test(source)) problems.push('component.html needs <html lang="...">');
  if (!/<meta\s+name="viewport"/i.test(source)) problems.push("component.html needs a viewport meta tag");
  if (!/<title>[^<]+<\/title>/i.test(source)) problems.push("component.html needs a <title>");
  if (!source.includes(`<script src="${TAILWIND_BROWSER_URL}"></script>`)) {
    problems.push(`component.html must load Tailwind with <script src="${TAILWIND_BROWSER_URL}"></script>`);
  }
  if (!source.includes("@custom-variant dark (&:where(.dark, .dark *));")) {
    problems.push("component.html must declare @custom-variant dark (&:where(.dark, .dark *));");
  }
  const tokens = tokenBlock(source);
  if (!tokens) problems.push("component.html is missing the /* iloveui:tokens:start */ ... end block");
  else {
    for (const token of TOKENS) {
      if (!tokens.root.includes(`${token}:`)) problems.push(`component.html :root tokens are missing ${token}`);
    }
    for (const token of TOKENS.slice(0, 7)) {
      if (!tokens.dark.includes(`${token}:`)) problems.push(`component.html .dark tokens are missing ${token}`);
    }
  }
  if (!/<!--\s*iloveui:component:start\s*-->[\s\S]+<!--\s*iloveui:component:end\s*-->/.test(source)) {
    problems.push("component.html is missing the <!-- iloveui:component:start --> ... end markers");
  }
  const withoutTokens = source.replace(/\/\*\s*iloveui:tokens:start[\s\S]*?iloveui:tokens:end\s*\*\//, "");
  problems.push(...styleProblems(withoutTokens, "component.html"));
  return problems;
}

export function previewProblems(source: string, meta: DesignMeta): string[] {
  const problems: string[] = [];
  if (!/export\s+default\s+function\s+\w+/.test(source)) problems.push("preview.tsx must export a default function");
  if (!/from\s+["']\.\/component["']/.test(source)) problems.push('preview.tsx must import "./component"');
  for (const match of source.matchAll(/^\s*import\s+(?:type\s+)?[\s\S]*?\sfrom\s+["']([^"']+)["']/gm)) {
    const specifier = match[1]!;
    if (!["./component", "react", "@/registry/preview-kit", "@/registry/definitions"].includes(specifier)) {
      problems.push(`preview.tsx imports "${specifier}"`);
    }
  }
  for (const state of meta.states.slice(1)) {
    if (!source.includes(`"${state}"`)) problems.push(`preview.tsx never handles the "${state}" state`);
  }
  return problems;
}

export function aiPromptProblems(source: string, meta: DesignMeta): string[] {
  const problems: string[] = [];
  const headings = [...source.matchAll(/^## (.+)$/gm)].map((match) => match[1]!.trim());
  if (headings.join("|") !== AI_PROMPT_SECTIONS.join("|")) {
    problems.push(
      `ai-prompt.md sections must be exactly: ${AI_PROMPT_SECTIONS.join(", ")} (found: ${headings.join(", ")})`,
    );
  }
  if (!source.includes(`npx shadcn@latest add @iloveui/${meta.slug}`)) {
    problems.push(`ai-prompt.md must include "npx shadcn@latest add @iloveui/${meta.slug}"`);
  }
  return problems;
}

export function notesProblems(source: string): string[] {
  const problems: string[] = [];
  if (!/^## Usage notes$/m.test(source)) problems.push('notes.md needs a "## Usage notes" section');
  if (!/^## Taste self-review$/m.test(source)) problems.push('notes.md needs a "## Taste self-review" section');
  for (const item of SELF_REVIEW_ITEMS) {
    const line = source.split("\n").find((candidate) => candidate.startsWith(`- ${item}:`));
    if (!line) problems.push(`notes.md self-review is missing "- ${item}: Yes. ..."`);
    else if (!/:\s*Yes\.\s+\S/.test(line)) problems.push(`notes.md: "${item}" must be answered "Yes." with a reason`);
  }
  return problems;
}

export function validateFolder(folder: DesignFolder): { meta: DesignMeta | null; problems: Problem[] } {
  const where = `${folder.category}/${folder.slug}`;
  const problems: Problem[] = [];
  const missing = DESIGN_FILES.filter((file) => !existsSync(path.join(folder.dir, file)));
  for (const file of missing) problems.push({ where, message: `missing ${file}` });
  if (missing.includes("meta.json")) return { meta: null, problems };

  let raw: unknown;
  try {
    raw = JSON.parse(readDesignFile(folder, "meta.json"));
  } catch (error) {
    problems.push({ where, message: `meta.json is not valid JSON (${(error as Error).message})` });
    return { meta: null, problems };
  }
  const parsed = DesignMetaSchema.safeParse(raw);
  if (!parsed.success) {
    problems.push({ where, message: `meta.json:\n${z.prettifyError(parsed.error)}` });
    return { meta: null, problems };
  }
  const meta = parsed.data;
  if (meta.slug !== folder.slug) problems.push({ where, message: `slug "${meta.slug}" must match its folder name` });
  if (meta.category !== folder.category) {
    problems.push({ where, message: `category "${meta.category}" must match its folder "${folder.category}"` });
  }
  const add = (messages: string[]) => problems.push(...messages.map((message) => ({ where, message })));
  if (!missing.includes("component.tsx")) add(componentProblems(readDesignFile(folder, "component.tsx"), meta));
  if (!missing.includes("component.html")) add(htmlProblems(readDesignFile(folder, "component.html")));
  if (!missing.includes("preview.tsx")) add(previewProblems(readDesignFile(folder, "preview.tsx"), meta));
  if (!missing.includes("ai-prompt.md")) add(aiPromptProblems(readDesignFile(folder, "ai-prompt.md"), meta));
  if (!missing.includes("notes.md")) add(notesProblems(readDesignFile(folder, "notes.md")));
  return { meta, problems };
}

export function validateCatalog(metas: DesignMeta[]): Problem[] {
  const problems: Problem[] = [];
  const count = (values: string[]) =>
    values.reduce((map, value) => map.set(value, (map.get(value) ?? 0) + 1), new Map<string, number>());
  for (const [slug, n] of count(metas.map((meta) => meta.slug))) {
    if (n > 1) problems.push({ where: slug, message: `slug is used ${n} times; slugs are unique across the catalog` });
  }
  for (const [name, n] of count(metas.map((meta) => meta.name.toLowerCase()))) {
    if (n > 1) problems.push({ where: name, message: `name is used ${n} times; names are unique` });
  }
  return problems;
}
