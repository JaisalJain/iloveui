import { site } from "@/lib/site";
import { CopyCodeButton } from "./copy-code-button";

// Fenced code in docs and changelog MDX arrives here pre-highlighted (lib/mdx/rehype-docs.mjs runs shiki at build
// time), so no highlighter ships to the Worker or the browser. %SITE_URL% in a fence becomes this deployment's
// NEXT_PUBLIC_SITE_URL, which keeps registry snippets correct locally and in production.

const SITE_URL_TOKEN = /%SITE_URL%/g;

const LANGUAGE_LABELS: Record<string, string> = {
  bash: "Terminal",
  sh: "Terminal",
  shell: "Terminal",
  zsh: "Terminal",
  tsx: "TSX",
  ts: "TypeScript",
  jsx: "JSX",
  js: "JavaScript",
  html: "HTML",
  css: "CSS",
  json: "JSON",
  jsonc: "JSON",
  env: ".env",
  text: "Text",
};

export function CodeBlock({
  html,
  code,
  language,
  title,
}: {
  html: string;
  code: string;
  language: string;
  title?: string;
}) {
  const base = site.url.replace(/\/$/, "");
  const label = title ?? LANGUAGE_LABELS[language] ?? language.toUpperCase();
  const source = code.replace(SITE_URL_TOKEN, base);
  return (
    <figure className="group/code mt-6 min-w-0 overflow-hidden rounded-card border border-hairline bg-surface shadow-sm">
      <figcaption className="flex h-11 items-center justify-between gap-4 border-b border-hairline pr-1.5 pl-4 pointer-coarse:h-12">
        <span className="truncate font-mono text-12 text-muted">{label}</span>
        <CopyCodeButton code={source} label={title ? `${title} code` : `${label} code`} />
      </figcaption>
      <div
        tabIndex={0}
        className="[scrollbar-gutter:stable] overflow-x-auto px-4 py-3 [&_.iu-code]:w-max [&_.iu-code]:min-w-full [&_.line]:before:hidden"
        dangerouslySetInnerHTML={{ __html: html.replace(SITE_URL_TOKEN, base) }}
      />
    </figure>
  );
}
