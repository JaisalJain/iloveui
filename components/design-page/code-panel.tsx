"use client";

import { Check, Copy, FileCode2, RotateCw, TriangleAlert } from "lucide-react";
import { Tabs, ToggleGroup } from "radix-ui";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { COPY_CODE_EVENT } from "@/components/site/site-shell";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Tooltip } from "@/components/ui/tooltip";
import type { DesignCode, FileStat } from "@/lib/catalog-types";
import { useThemeLab } from "@/lib/client/theme-lab";
import { copyText, highlightCss, lineCount, THEME_FILE_NAME, themeFile, type CodeFormat } from "@/lib/code";
import { themeCss } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { setCodeFormat, useCodeFormat } from "./code-format";
import { loadDesignCode, useDesignCode } from "./design-code-store";
import { recordCopy, useCopy } from "./use-copy";

// The code viewer of a free design: React (component.tsx plus theme.css generated from Theme Lab) and HTML
// (component.html), highlighted at build time and fetched once the panel nears the viewport.

export type CodeFiles = { react: FileStat[]; html: FileStat[] };

export const FORMAT_LABELS: Record<CodeFormat, string> = { react: "React", html: "HTML" };

const tabTrigger = cn(
  "relative inline-flex h-12 items-center px-3 text-14 font-medium text-muted transition-colors duration-160 ease-site hover:text-fg",
  "after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:bg-transparent",
  "data-[state=active]:text-fg data-[state=active]:after:bg-accent",
);

const fileButton = cn(
  "inline-flex h-8 shrink-0 items-center gap-2 rounded-control px-2.5 font-mono text-12 text-muted tabular-nums",
  "transition-colors duration-160 ease-site hover:bg-raised hover:text-fg pointer-coarse:h-10",
  "data-[state=on]:bg-raised data-[state=on]:text-fg",
);

/** Line numbers need a wider gutter once a file passes 999 lines. */
function gutterStyle(lines: number) {
  return { "--code-gutter": `${Math.max(3, String(lines).length)}ch` } as CSSProperties;
}

export function CodeShell({
  format,
  onFormatChange,
  actions,
  children,
}: {
  format: CodeFormat;
  onFormatChange: (format: CodeFormat) => void;
  actions?: ReactNode;
  children: (format: CodeFormat) => ReactNode;
}) {
  return (
    <section
      aria-labelledby="code-heading"
      className="min-w-0 overflow-hidden rounded-card border border-hairline bg-surface shadow-sm"
    >
      <Tabs.Root
        value={format}
        onValueChange={(value) => {
          if (value === "react" || value === "html") onFormatChange(value);
        }}
      >
        <div className="flex items-center gap-2 border-b border-hairline pr-2 pl-1 sm:pr-3">
          <h2 id="code-heading" className="sr-only">
            Code
          </h2>
          <Tabs.List aria-label="Code format" className="flex">
            {(["react", "html"] as const).map((value) => (
              <Tabs.Trigger key={value} value={value} className={tabTrigger}>
                {FORMAT_LABELS[value]}
              </Tabs.Trigger>
            ))}
          </Tabs.List>
          <div className="ml-auto flex items-center gap-2">{actions}</div>
        </div>
        {(["react", "html"] as const).map((value) => (
          <Tabs.Content key={value} value={value} className="outline-none focus-visible:outline-none">
            {children(value)}
          </Tabs.Content>
        ))}
      </Tabs.Root>
    </section>
  );
}

type ViewFile = { name: string; lines: number; html: string | null; code: string | null };

export function CodePanel({ slug, codeUrl, files }: { slug: string; codeUrl: string; files: CodeFiles }) {
  const format = useCodeFormat();
  const theme = useThemeLab();
  const css = useMemo(() => themeCss(theme), [theme]);
  const themeSource = useMemo(() => themeFile(css), [css]);
  const themeHtml = useMemo(() => highlightCss(themeSource), [themeSource]);
  const codeState = useDesignCode(codeUrl);
  const code: DesignCode | null = codeState.status === "ready" ? codeState.code : null;
  const [selected, setSelected] = useState<Record<CodeFormat, string>>({
    react: files.react[0]?.name ?? "component.tsx",
    html: files.html[0]?.name ?? "component.html",
  });
  const sectionRef = useRef<HTMLDivElement>(null);
  const { status, message, copy } = useCopy();

  // Fetch the code once the panel is within a screen of the viewport.
  useEffect(() => {
    const element = sectionRef.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect();
          loadDesignCode(codeUrl).catch(() => undefined);
        }
      },
      { rootMargin: "800px 0px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [codeUrl]);

  const filesFor = useCallback(
    (tab: CodeFormat): ViewFile[] => {
      const stats = files[tab].map((stat) => {
        const loaded = code?.files.find((file) => file.name === stat.name);
        return { name: stat.name, lines: stat.lines, html: loaded?.html ?? null, code: loaded?.code ?? null };
      });
      if (tab === "react") {
        stats.push({ name: THEME_FILE_NAME, lines: lineCount(themeSource), html: themeHtml, code: themeSource });
      }
      return stats;
    },
    [files, code, themeSource, themeHtml],
  );

  const activeName = selected[format];

  const copyActive = useCallback(async () => {
    const name = activeName;
    const text =
      name === THEME_FILE_NAME
        ? Promise.resolve(themeFile(css))
        : loadDesignCode(codeUrl).then((loaded) => {
            const file = loaded.files.find((candidate) => candidate.name === name);
            if (!file) throw new Error(`${name} is missing`);
            return copyText(file, css);
          });
    if (await copy(text, name)) recordCopy(slug);
  }, [activeName, css, codeUrl, copy, slug]);

  useEffect(() => {
    const onCopyShortcut = () => void copyActive();
    window.addEventListener(COPY_CODE_EVENT, onCopyShortcut);
    return () => window.removeEventListener(COPY_CODE_EVENT, onCopyShortcut);
  }, [copyActive]);

  return (
    <div ref={sectionRef} className="min-w-0">
      <CodeShell
        format={format}
        onFormatChange={setCodeFormat}
        actions={
          <>
            <Tooltip
              content={
                <>
                  Copy {activeName} <Kbd>C</Kbd>
                </>
              }
            >
              <Button size="sm" variant="outline" onClick={() => void copyActive()} data-copy-code="">
                {status === "copied" ? (
                  <Check size={16} strokeWidth={1.5} aria-hidden className="text-accent" />
                ) : (
                  <Copy size={16} strokeWidth={1.5} aria-hidden />
                )}
                <span className="tabular-nums">{status === "copied" ? "Copied" : "Copy"}</span>
                <span className="sr-only"> {activeName}</span>
              </Button>
            </Tooltip>
            <p role="status" className="sr-only">
              {message}
            </p>
          </>
        }
      >
        {(tab) => {
          const tabFiles = filesFor(tab);
          const active = tabFiles.find((file) => file.name === selected[tab]) ?? tabFiles[0];
          return (
            <>
              <div className="flex items-center gap-3 border-b border-hairline px-2 py-2 sm:px-3">
                <ToggleGroup.Root
                  type="single"
                  value={active?.name ?? ""}
                  onValueChange={(value) => {
                    if (value) setSelected((current) => ({ ...current, [tab]: value }));
                  }}
                  aria-label={`${FORMAT_LABELS[tab]} files`}
                  className="flex min-w-0 gap-1 overflow-x-auto"
                >
                  {tabFiles.map((file) => (
                    <ToggleGroup.Item key={file.name} value={file.name} className={fileButton}>
                      <FileCode2 size={16} strokeWidth={1.5} aria-hidden />
                      <span>{file.name}</span>
                      <span className="text-muted">{file.lines} lines</span>
                    </ToggleGroup.Item>
                  ))}
                </ToggleGroup.Root>
                {tab === "html" || active?.name === THEME_FILE_NAME ? (
                  <p className="ml-auto hidden shrink-0 text-12 text-muted md:block">
                    {tab === "html" ? "Copies carry your Theme Lab tokens" : "Generated live from Theme Lab"}
                  </p>
                ) : null}
              </div>
              {active ? <CodeViewer file={active} failed={codeState.status === "error"} codeUrl={codeUrl} /> : null}
            </>
          );
        }}
      </CodeShell>
    </div>
  );
}

const VIEWER = "h-[560px] overflow-auto overscroll-contain [scrollbar-gutter:stable] py-4 pr-4 pl-2 sm:h-[640px]";

function CodeViewer({ file, failed, codeUrl }: { file: ViewFile; failed: boolean; codeUrl: string }) {
  if (file.html) {
    return (
      <div
        role="region"
        tabIndex={0}
        aria-label={`${file.name} source`}
        data-code-viewer=""
        className={VIEWER}
        style={gutterStyle(file.lines)}
        // Build-time shiki output (or the escaped theme.css highlighter); never user input.
        dangerouslySetInnerHTML={{ __html: file.html }}
      />
    );
  }
  if (failed) {
    return (
      <div className={cn(VIEWER, "flex flex-col items-start justify-center gap-4 px-6 sm:px-10")}>
        <TriangleAlert size={20} strokeWidth={1.5} aria-hidden className="text-danger" />
        <div className="max-w-sm">
          <p className="text-16 font-medium text-fg">The code did not load.</p>
          <p className="mt-1 text-14 text-muted">
            Your connection dropped or the file moved. The preview still works; try loading the code again.
          </p>
        </div>
        <Button size="sm" onClick={() => loadDesignCode(codeUrl).catch(() => undefined)}>
          <RotateCw size={16} strokeWidth={1.5} aria-hidden />
          Retry
        </Button>
      </div>
    );
  }
  return <CodeSkeleton lines={Math.min(file.lines, 28)} label={`Loading ${file.name}`} />;
}

// Deterministic line lengths, so the skeleton reads like indented code and never shifts between renders.
const SKELETON_SHAPES = [
  [0, 46],
  [0, 0],
  [0, 62],
  [2, 38],
  [2, 54],
  [2, 30],
  [0, 8],
  [0, 0],
  [0, 70],
  [2, 44],
  [4, 58],
  [4, 36],
  [2, 12],
  [2, 64],
  [4, 48],
  [6, 40],
  [4, 22],
  [2, 6],
  [0, 4],
] as const;

export function CodeSkeleton({ lines, label }: { lines: number; label?: string }) {
  return (
    <div
      role={label ? "status" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn(VIEWER, "overflow-hidden font-mono text-[13px] leading-[1.7]")}
    >
      {Array.from({ length: lines }, (_, index) => {
        const [indent, width] = SKELETON_SHAPES[index % SKELETON_SHAPES.length] ?? [0, 0];
        return (
          <div key={index} className="flex h-[1.7em] items-center">
            <span className="w-[3ch] shrink-0 text-right text-muted tabular-nums select-none">{index + 1}</span>
            <span
              className="h-[0.7em] rounded-[3px] bg-raised"
              style={{ marginLeft: `${2 + indent}ch`, width: width ? `${width}%` : 0 }}
            />
          </div>
        );
      })}
    </div>
  );
}
