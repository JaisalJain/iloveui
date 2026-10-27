import { Info, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { IU_TOKEN_NAMES, type IuTokenName } from "@/lib/theme";

/** A note set apart from the text. Neutral by design: the accent is reserved for actions and selected states. */
export function Callout({
  title,
  tone = "note",
  children,
}: {
  title?: string;
  tone?: "note" | "caution";
  children: ReactNode;
}) {
  const Icon = tone === "caution" ? TriangleAlert : Info;
  return (
    <aside
      aria-label={title ?? (tone === "caution" ? "Caution" : "Note")}
      className="mt-6 flex gap-3 rounded-card border border-hairline bg-raised/60 p-4 text-14 sm:p-5"
    >
      <Icon size={16} strokeWidth={1.5} aria-hidden className="mt-[3px] shrink-0 text-muted" />
      <div className="min-w-0 [&>p]:mt-2 [&>p]:text-14 [&>p:first-child]:mt-0">
        {title ? <p className="font-semibold text-fg">{title}</p> : null}
        {children}
      </div>
    </aside>
  );
}

/** A two-or-more column reference table; the first column is set in mono when it holds names. */
export function DataTable({
  head,
  rows,
  monoFirst = true,
  caption,
}: {
  head: string[];
  rows: ReactNode[][];
  monoFirst?: boolean;
  caption?: string;
}) {
  return (
    <div className="mt-6 overflow-hidden rounded-card border border-hairline bg-surface shadow-sm">
      <table className="w-full border-collapse text-left text-14">
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        <thead>
          <tr className="border-b border-hairline">
            {head.map((cell) => (
              <th key={cell} scope="col" className="px-4 py-3 align-bottom label-mono font-normal text-muted">
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-b border-hairline align-top last:border-b-0">
              {row.map((cell, cellIndex) =>
                cellIndex === 0 ? (
                  <th
                    key={cellIndex}
                    scope="row"
                    className={
                      monoFirst
                        ? "px-4 py-3 font-mono text-12 leading-[1.55rem] font-normal [overflow-wrap:anywhere] text-fg"
                        : "px-4 py-3 font-medium text-fg"
                    }
                  >
                    {cell}
                  </th>
                ) : (
                  <td key={cellIndex} className="px-4 py-3 text-muted">
                    {cell}
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const TOKEN_MEANINGS: Record<IuTokenName, string> = {
  "--iu-accent": "Your brand color: primary fills, active markers, focus rings and key icons.",
  "--iu-accent-foreground": "Text and icons that sit on an accent fill. Theme Lab picks black or white for contrast.",
  "--iu-background": "The page or section background.",
  "--iu-surface": "Cards, panels, inputs and anything raised off the background.",
  "--iu-border": "Hairlines and dividers. Form controls use a stronger mix of the foreground instead.",
  "--iu-foreground": "Primary text.",
  "--iu-muted": "Secondary text and labels; keeps 4.5:1 on background and surface.",
  "--iu-radius": "The base corner radius. Each style family clamps it with min() and max() to stay in character.",
  "--iu-font": "The font family stack for the whole design.",
  "--iu-density": "A spacing multiplier: 1 is comfortable, 0.8 is compact.",
};

/** The ten --iu-* tokens and what each one controls, straight from lib/theme.ts. */
export function TokenTable() {
  return (
    <DataTable
      caption="The --iu-* tokens"
      head={["Token", "What it controls"]}
      rows={IU_TOKEN_NAMES.map((name) => [name, TOKEN_MEANINGS[name]])}
    />
  );
}
