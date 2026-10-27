"use client";

import { FileCode2, Lock } from "lucide-react";
import Link from "next/link";
import { TierTag } from "@/components/designs/tier-tag";
import { buttonClasses } from "@/components/ui/button";
import { setCodeFormat, useCodeFormat } from "./code-format";
import { CodeShell, CodeSkeleton, FORMAT_LABELS, type CodeFiles } from "./code-panel";
import { PRICING_PATH } from "./paths";

// A Pro design's code panel for visitors without access: the real file names and line counts, a code-shaped
// silhouette and an unlock card. It receives file statistics only; no source line ever reaches this component.

export function LockedCodePanel({ files }: { files: CodeFiles }) {
  const format = useCodeFormat();
  return (
    <CodeShell format={format} onFormatChange={setCodeFormat}>
      {(tab) => (
        <>
          <div className="flex items-center gap-3 border-b border-hairline px-2 py-2 sm:px-3">
            <ul aria-label={`${FORMAT_LABELS[tab]} files`} className="flex min-w-0 gap-1 overflow-x-auto">
              {files[tab].map((file) => (
                <li
                  key={file.name}
                  className="inline-flex h-8 shrink-0 items-center gap-2 rounded-control bg-raised px-2.5 font-mono text-12 text-fg tabular-nums"
                >
                  <FileCode2 size={16} strokeWidth={1.5} aria-hidden className="text-muted" />
                  <span>{file.name}</span>
                  <span className="text-muted">{file.lines} lines</span>
                  <Lock size={14} strokeWidth={1.5} aria-hidden className="text-muted" />
                  <span className="sr-only">, locked</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="relative">
            <div className="[mask-image:linear-gradient(to_bottom,black,transparent_85%)]">
              <CodeSkeleton lines={24} />
            </div>
            <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-8">
              <UnlockCard />
            </div>
          </div>
        </>
      )}
    </CodeShell>
  );
}

function UnlockCard() {
  return (
    <div className="w-full max-w-sm rounded-card border border-hairline bg-surface p-6 shadow-lg">
      <div className="flex items-center gap-2">
        <TierTag tier="pro" />
        <span className="label-mono text-muted">Source locked</span>
      </div>
      <h3 className="mt-4 text-20 font-semibold tracking-[-0.01em] text-fg">Get the source with Pro</h3>
      <p className="mt-2 text-14 text-muted">
        Pro unlocks every current and future design, in React and HTML, with CLI installs and AI prompts. One lifetime
        payment.
      </p>
      <Link href={PRICING_PATH} className={buttonClasses({ variant: "primary", className: "mt-5 w-full" })}>
        See pricing
      </Link>
    </div>
  );
}
