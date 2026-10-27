"use client";

import { FileCode2, Lock, RotateCw } from "lucide-react";
import Link from "next/link";
import { TierTag } from "@/components/designs/tier-tag";
import { Button, buttonClasses } from "@/components/ui/button";
import { refreshUrl } from "@/lib/client/session";
import { setCodeFormat, useCodeFormat } from "./code-format";
import { CodeShell, CodeSkeleton, FORMAT_LABELS, type CodeFiles } from "./code-panel";
import { PRICING_PATH } from "./paths";

// A Pro design's code panel for visitors without access: the real file names and line counts, a code-shaped
// silhouette and an unlock card. It receives file statistics only; no source line ever reaches this component.
// Without a notice it renders exactly what the server rendered; notices come from the signed-in access check.

export type LockedNotice = "checking" | "forbidden" | "expired" | "error";

export function LockedCodePanel({
  files,
  notice,
  onRetry,
}: {
  files: CodeFiles;
  notice?: LockedNotice;
  onRetry?: () => void;
}) {
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
              <UnlockCard notice={notice} onRetry={onRetry} />
            </div>
          </div>
        </>
      )}
    </CodeShell>
  );
}

const CARD_COPY: Record<"default" | LockedNotice, { label: string; title: string; body: string }> = {
  default: {
    label: "Source locked",
    title: "Get the source with Pro",
    body: "Pro unlocks every current and future design, in React and HTML, with CLI installs and AI prompts. One lifetime payment.",
  },
  checking: {
    label: "Checking access",
    title: "Get the source with Pro",
    body: "Pro unlocks every current and future design, in React and HTML, with CLI installs and AI prompts. One lifetime payment.",
  },
  forbidden: {
    label: "No Pro access",
    title: "This account has no Pro access yet",
    body: "You are signed in, but this account holds no Pro license or Team seat. Pro unlocks every design with one lifetime payment.",
  },
  expired: {
    label: "Session expired",
    title: "Refresh your session",
    body: "Your sign-in needs a refresh before the source can load. It takes one page load.",
  },
  error: {
    label: "Access check failed",
    title: "We could not check your access",
    body: "The request did not go through. Check your connection and try again.",
  },
};

function UnlockCard({ notice, onRetry }: { notice?: LockedNotice; onRetry?: () => void }) {
  const copy = CARD_COPY[notice ?? "default"];
  return (
    <div className="w-full max-w-sm rounded-card border border-hairline bg-surface p-6 shadow-lg">
      <div className="flex items-center gap-2">
        <TierTag tier="pro" />
        <span className="label-mono text-muted" role={notice ? "status" : undefined}>
          {copy.label}
        </span>
      </div>
      <h3 className="mt-4 text-20 font-semibold tracking-[-0.01em] text-fg">{copy.title}</h3>
      <p className="mt-2 text-14 text-muted">{copy.body}</p>
      {notice === "expired" ? (
        <a href={refreshUrl()} className={buttonClasses({ variant: "primary", className: "mt-5 w-full" })}>
          <RotateCw size={16} strokeWidth={1.5} aria-hidden />
          Refresh your session
        </a>
      ) : notice === "error" && onRetry ? (
        <Button variant="primary" className="mt-5 w-full" onClick={onRetry}>
          <RotateCw size={16} strokeWidth={1.5} aria-hidden />
          Try again
        </Button>
      ) : (
        <Link href={PRICING_PATH} className={buttonClasses({ variant: "primary", className: "mt-5 w-full" })}>
          See pricing
        </Link>
      )}
    </div>
  );
}
