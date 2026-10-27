import { formatGzip } from "@/lib/catalog";
import type { CatalogDesign } from "@/lib/catalog-types";
import { IU_TOKEN_NAMES } from "@/lib/theme";

const SHOWN_TOKENS = ["--iu-accent", "--iu-radius", "--iu-font"] as const;

/** The three promises under the hero, each with a receipt line taken from the real catalog. */
export function ValueStrip({ sample }: { sample: CatalogDesign | undefined }) {
  const react = sample?.files.react[0];
  const html = sample?.files.html[0];
  const receipt = sample?.receipt;
  const items = [
    {
      title: "Re-themeable",
      body: `Every design reads ${IU_TOKEN_NAMES.length} --iu-* CSS variables, so Theme Lab re-skins each preview live and the code you copy carries your tokens.`,
      proof: (
        <>
          {SHOWN_TOKENS.join("  ")}
          <span className="text-muted"> +{IU_TOKEN_NAMES.length - SHOWN_TOKENS.length}</span>
        </>
      ),
    },
    {
      title: "Two formats",
      body: "One React component in TypeScript, and the same design as plain HTML with vanilla JS. Both use Tailwind CSS v4.",
      proof:
        react && html ? (
          <>
            {react.name} <span className="text-muted">{react.lines} lines</span>
            {"  "}
            {html.name} <span className="text-muted">{html.lines} lines</span>
          </>
        ) : (
          "component.tsx  component.html"
        ),
    },
    {
      title: "Audited",
      body: "Each design passes axe in light and dark at 375, 768 and 1440 px, and ships a receipt with its size and dependencies.",
      proof: receipt ? (
        <>
          {formatGzip(receipt.gzipBytes)}
          {"  "}
          {receipt.axeViolations === null ? "axe: pending" : `axe: ${receipt.axeViolations} violations`}
          {"  "}
          {`reduced motion: ${receipt.reducedMotion ? "yes" : "no"}`}
        </>
      ) : (
        "axe: 0 violations"
      ),
    },
  ];
  return (
    <section aria-label="What every design includes" className="border-b border-hairline">
      <ul className="page-frame grid sm:grid-cols-3">
        {items.map((item, index) => (
          <li
            key={item.title}
            className="flex flex-col gap-3 border-hairline py-10 sm:py-12 sm:pr-6 [&:not(:first-child)]:border-t sm:[&:not(:first-child)]:border-t-0 sm:[&:not(:first-child)]:border-l sm:[&:not(:first-child)]:pl-6"
          >
            <h2 className="flex items-baseline gap-3 text-20 font-semibold">
              <span className="font-mono text-12 font-normal text-muted tabular-nums">0{index + 1}</span>
              {item.title}
            </h2>
            <p className="max-w-sm text-14 text-muted">{item.body}</p>
            <p className="mt-auto pt-3 font-mono text-12 whitespace-pre-wrap text-fg tabular-nums">{item.proof}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
