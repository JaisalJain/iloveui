"use client";

import { Check, Copy } from "lucide-react";
import { useCopy } from "@/components/design-page/use-copy";

/** A mono block with its own copy button; the label names the block for the button and the live region. */
export function CopyBlock({ label, value, multiline = false }: { label: string; value: string; multiline?: boolean }) {
  const { status, message, copy } = useCopy();
  return (
    <div className="group relative min-w-0 rounded-control border border-hairline bg-canvas">
      <pre
        tabIndex={0}
        aria-label={label}
        className={`[scrollbar-gutter:stable] overflow-x-auto py-3 pr-14 pl-4 font-mono text-12 leading-5 text-fg ${multiline ? "" : "whitespace-pre"}`}
      >
        <code>{value}</code>
      </pre>
      <button
        type="button"
        onClick={() => copy(value, label)}
        aria-label={`Copy ${label}`}
        className="absolute top-1.5 right-1.5 inline-flex size-8 items-center justify-center rounded-control text-muted transition-colors duration-160 ease-site hover:bg-raised hover:text-fg pointer-coarse:size-10"
      >
        {status === "copied" ? (
          <Check size={16} strokeWidth={1.5} aria-hidden className="text-accent" />
        ) : (
          <Copy size={16} strokeWidth={1.5} aria-hidden />
        )}
      </button>
      <span role="status" className="sr-only">
        {message}
      </span>
    </div>
  );
}
