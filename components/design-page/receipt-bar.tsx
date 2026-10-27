import { formatGzip } from "@/lib/catalog-shared";
import type { Receipt } from "@/lib/catalog-types";

/** The receipt, worded exactly as the spec words it: size, runtime dependencies, audit result, reduced motion. */
export function receiptItems(receipt: Receipt): { label: string; value: string }[] {
  return [
    { label: "Size", value: formatGzip(receipt.gzipBytes) },
    {
      label: "Runtime dependencies",
      value: receipt.dependencies.length > 0 ? receipt.dependencies.join(", ") : "0 deps",
    },
    {
      label: "Accessibility audit",
      value:
        receipt.axeViolations === null
          ? "axe: not audited"
          : `axe: ${receipt.axeViolations} ${receipt.axeViolations === 1 ? "violation" : "violations"}`,
    },
    { label: "Reduced motion support", value: `reduced motion: ${receipt.reducedMotion ? "yes" : "no"}` },
  ];
}

export function ReceiptBar({ receipt }: { receipt: Receipt }) {
  return (
    <dl
      aria-label="Receipt"
      data-receipt=""
      className="flex flex-wrap items-center gap-x-6 gap-y-2 border-y border-hairline py-3 font-mono text-12 text-muted tabular-nums"
    >
      {receiptItems(receipt).map((item) => (
        <div key={item.label} className="flex items-center gap-2">
          <dt className="sr-only">{item.label}</dt>
          <dd className="flex items-center gap-2 text-fg before:size-1.5 before:rounded-full before:bg-control before:content-['']">
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
