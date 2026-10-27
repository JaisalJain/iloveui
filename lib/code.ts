// Pure helpers for the design page's code viewer: what a copy puts on the clipboard, the generated theme.css, the
// AI prompt with the buyer's tokens, and a small highlighter for that generated CSS (the source files arrive
// highlighted from the build, but theme.css changes live with Theme Lab).

export const TOKEN_START = "/* iloveui:tokens:start */";
export const TOKEN_END = "/* iloveui:tokens:end */";

export type CodeFormat = "react" | "html";

export const FORMAT_STORAGE_KEY = "iloveui.format";
export const THEME_FILE_NAME = "theme.css";

export function isCodeFormat(value: unknown): value is CodeFormat {
  return value === "react" || value === "html";
}

/** Which tab a file belongs to: HTML files under "HTML", everything else (TSX, theme.css) under "React". */
export function formatOfFile(name: string): CodeFormat {
  return name.endsWith(".html") ? "html" : "react";
}

/** theme.css as a buyer copies it: the Theme Lab token CSS under a one-line explanation. */
export function themeFile(css: string): string {
  return `/* iloveui theme tokens from Theme Lab. Import once in your global stylesheet. */\n${css.trimEnd()}\n`;
}

/**
 * Replaces the token block of a component.html (the lines between the start and end markers) with the given CSS,
 * indented like the markers. A file without markers is returned unchanged.
 */
export function replaceTokenBlock(source: string, css: string): string {
  const start = source.indexOf(TOKEN_START);
  const end = source.indexOf(TOKEN_END, start + TOKEN_START.length);
  if (start === -1 || end === -1) return source;
  const lineStart = source.lastIndexOf("\n", start) + 1;
  const indent = /^[ \t]*/.exec(source.slice(lineStart, start))?.[0] ?? "";
  const body = css
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .map((line) => `${indent}${line}`)
    .join("\n");
  return `${source.slice(0, start)}${TOKEN_START}\n${body}\n${indent}${source.slice(end)}`;
}

/** The text a copy of one file puts on the clipboard: HTML carries the current tokens, theme.css is generated. */
export function copyText(file: { name: string; code: string }, css: string): string {
  if (file.name === THEME_FILE_NAME) return themeFile(css);
  if (file.name.endsWith(".html")) return replaceTokenBlock(file.code, css);
  return file.code;
}

/** The AI prompt for a design followed by the buyer's Theme Lab tokens. */
export function aiPromptWithTokens(aiPrompt: string, css: string): string {
  return [
    aiPrompt.trimEnd(),
    "",
    "## Theme tokens",
    "",
    "The component reads these CSS variables. Add them to the global stylesheet once, before the component renders; the `.dark` block applies when an ancestor has the `dark` class.",
    "",
    "```css",
    css.trimEnd(),
    "```",
    "",
  ].join("\n");
}

export function lineCount(text: string): number {
  return text.replace(/\n$/, "").split("\n").length;
}

const ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };

function escapeHtml(text: string): string {
  return text.replace(/[&<>"]/g, (char) => ESCAPES[char] ?? char);
}

function span(className: string, text: string): string {
  return text ? `<span class="${className}">${escapeHtml(text)}</span>` : "";
}

function highlightCssLine(line: string): string {
  const comment = /^(\s*)(\/\*.*\*\/)\s*$/.exec(line);
  if (comment) return escapeHtml(comment[1] ?? "") + span("k-comment k-italic", comment[2] ?? "");
  const declaration = /^(\s*)(--[\w-]+|[\w-]+)(\s*:\s*)(.*?)(;?)$/.exec(line);
  if (declaration && !line.trimEnd().endsWith("{")) {
    const [, indent = "", property = "", colon = "", value = "", semi = ""] = declaration;
    return (
      escapeHtml(indent) +
      span("k-cool", property) +
      span("k-punct", colon) +
      highlightCssValue(value) +
      span("k-punct", semi)
    );
  }
  const rule = /^(\s*)(.*?)(\s*)([{}])\s*$/.exec(line);
  if (rule) {
    const [, indent = "", selector = "", gap = "", brace = ""] = rule;
    return escapeHtml(indent) + span("k-warm", selector) + escapeHtml(gap) + span("k-punct", brace);
  }
  return escapeHtml(line);
}

function highlightCssValue(value: string): string {
  return value
    .split(/("[^"]*"|,)/)
    .map((part) => {
      if (part.startsWith('"')) return span("k-cool", part);
      if (part === ",") return span("k-punct", part);
      return /^\s*[\d#.]/.test(part) ? span("k-warm", part) : escapeHtml(part);
    })
    .join("");
}

/** Highlights generated CSS into the same markup and role classes as the build-time highlighter. */
export function highlightCss(css: string): string {
  const lines = css
    .replace(/\n$/, "")
    .split("\n")
    .map((line) => `<span class="line">${highlightCssLine(line)}</span>`);
  return `<pre class="iu-code"><code>${lines.join("\n")}</code></pre>`;
}
