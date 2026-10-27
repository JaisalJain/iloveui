"use client";

import { Check, Copy } from "lucide-react";
import { useCopy } from "@/components/design-page/use-copy";

/** Copies a docs code block. The label flips within the clipboard write, and a live region announces the result. */
export function CopyCodeButton({ code, label }: { code: string; label: string }) {
  const { status, message, copy } = useCopy();
  return (
    <>
      <button
        type="button"
        onClick={() => void copy(code, label)}
        aria-label={`Copy ${label}`}
        data-copy-code=""
        className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-control px-2 font-mono text-12 text-muted transition-colors duration-160 ease-site select-none hover:bg-raised hover:text-fg active:translate-y-px pointer-coarse:h-10"
      >
        {status === "copied" ? (
          <Check size={16} strokeWidth={1.5} aria-hidden className="text-accent" />
        ) : (
          <Copy size={16} strokeWidth={1.5} aria-hidden />
        )}
        <span aria-hidden>{status === "copied" ? "Copied" : status === "failed" ? "Failed" : "Copy"}</span>
      </button>
      <span role="status" className="sr-only">
        {message}
      </span>
    </>
  );
}
