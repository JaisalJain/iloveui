"use client";

import { Bookmark, Check, Copy, Download, LoaderCircle, Lock, MessageSquareCode } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { setBookmarked, useBookmarked } from "@/lib/client/bookmarks";
import { refreshSession } from "@/lib/client/session";
import { getTheme } from "@/lib/client/theme-lab";
import { aiPromptWithTokens } from "@/lib/code";
import { downloadFileName, themeSearchParams } from "@/lib/download";
import { monetizationEnabled } from "@/lib/monetization";
import { themeCss } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { loadDesignCode } from "./design-code-store";
import { PRICING_PATH } from "./paths";
import { proCodeUrl, useProAccess } from "./pro-access";
import { useCopy } from "./use-copy";

export function InstallBar({ slug, pro }: { slug: string; pro: boolean }) {
  const command = `npx shadcn@latest add @iloveui/${slug}`;
  const { status, message, copy } = useCopy();
  return (
    <div>
      <div className="flex min-h-11 items-center gap-2 rounded-control border border-hairline bg-surface py-1 pr-1 pl-3 shadow-sm">
        <code className="min-w-0 flex-1 py-1 font-mono text-12 [overflow-wrap:anywhere] text-fg">
          <span aria-hidden className="mr-2 text-muted select-none">
            $
          </span>
          {command}
        </code>
        <Tooltip content="Copy command">
          <button
            type="button"
            onClick={() => void copy(command, "the install command")}
            aria-label="Copy install command"
            className={cn(
              "inline-flex size-8 shrink-0 items-center justify-center rounded-[4px] text-muted transition-colors duration-160 ease-site",
              "hover:bg-raised hover:text-fg active:translate-y-px pointer-coarse:size-10",
            )}
          >
            {status === "copied" ? (
              <Check size={16} strokeWidth={1.5} aria-hidden className="text-accent" />
            ) : (
              <Copy size={16} strokeWidth={1.5} aria-hidden />
            )}
          </button>
        </Tooltip>
      </div>
      <p role="status" className="sr-only">
        {message}
      </p>
      {pro ? (
        <p className="mt-2 text-12 text-muted">
          Pro installs need an access token from your account page, set as ILOVEUI_TOKEN.
        </p>
      ) : null}
    </div>
  );
}

/** Copy AI prompt: free designs read their static code; Pro designs unlock once the access check succeeds. */
export function AiPromptButton({ slug, codeUrl: freeCodeUrl }: { slug: string; codeUrl: string | null }) {
  const { status, message, copy } = useCopy();
  const access = useProAccess(slug);
  const codeUrl = freeCodeUrl ?? (access === "unlocked" ? proCodeUrl(slug) : null);
  if (!codeUrl) {
    return (
      <div className="flex items-start gap-3 rounded-control border border-hairline bg-surface p-3">
        <Lock size={16} strokeWidth={1.5} aria-hidden className="mt-0.5 shrink-0 text-muted" />
        <p className="text-14 text-muted">
          The AI prompt for this design comes with Pro.{" "}
          <Link
            href={PRICING_PATH}
            className="font-medium text-fg underline decoration-hairline underline-offset-4 hover:decoration-fg"
          >
            See pricing
          </Link>
        </p>
      </div>
    );
  }
  const text = loadDesignCodeText(codeUrl);
  return (
    <>
      <Button className="w-full justify-start" onClick={() => void copy(text(), "the AI prompt")} data-copy-prompt="">
        {status === "copied" ? (
          <Check size={16} strokeWidth={1.5} aria-hidden className="text-accent" />
        ) : (
          <MessageSquareCode size={16} strokeWidth={1.5} aria-hidden />
        )}
        {status === "copied" ? "Copied AI prompt" : "Copy AI prompt"}
      </Button>
      <p role="status" className="sr-only">
        {message}
      </p>
    </>
  );
}

function loadDesignCodeText(codeUrl: string) {
  return () => loadDesignCode(codeUrl).then((code) => aiPromptWithTokens(code.aiPrompt, themeCss(getTheme())));
}

/** Bookmarks live on the account page, so the button exists only with monetization (and accounts) on. */
export function BookmarkButton({ slug, name }: { slug: string; name: string }) {
  if (!monetizationEnabled()) return null;
  return <BookmarkToggle slug={slug} name={name} />;
}

function BookmarkToggle({ slug, name }: { slug: string; name: string }) {
  const bookmarked = useBookmarked(slug);
  return (
    <Button
      variant="outline"
      aria-pressed={bookmarked}
      onClick={() => setBookmarked(slug, !bookmarked)}
      className={cn("group", bookmarked && "border-accent")}
    >
      <Bookmark
        size={16}
        strokeWidth={1.5}
        aria-hidden
        className={cn(
          "transition-[fill,color,transform] duration-160 ease-site group-active:scale-90",
          bookmarked ? "fill-current text-accent" : "text-muted",
        )}
      />
      Bookmark<span className="sr-only"> {name}</span>
    </Button>
  );
}

type DownloadStatus = "idle" | "loading" | "done" | "failed";

/**
 * Download zip: component.tsx, component.html, ai-prompt.md and LICENSE.txt, with the current Theme Lab tokens in
 * component.html and a theme.css. Shown for free designs, and for Pro designs once the access check unlocks them.
 */
export function DownloadButton({ slug, name, pro }: { slug: string; name: string; pro: boolean }) {
  const access = useProAccess(slug);
  const [status, setStatus] = useState<DownloadStatus>("idle");
  const [message, setMessage] = useState("");
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  if (pro && access !== "unlocked") return null;

  const finish = (next: DownloadStatus, text: string) => {
    setStatus(next);
    setMessage(text);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setStatus("idle"), next === "done" ? 1800 : 4000);
  };

  const download = async () => {
    if (status === "loading") return;
    window.clearTimeout(timer.current);
    setStatus("loading");
    setMessage(`Preparing the ${name} download`);
    let response: Response;
    try {
      response = await fetch(`/api/download/${slug}?${themeSearchParams(getTheme()).toString()}`, {
        credentials: "same-origin",
      });
    } catch {
      finish("failed", "The download did not start. Check your connection and try again.");
      return;
    }
    if (response.status === 401 && refreshSession()) return;
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { message?: string } | null;
      finish("failed", body?.message ?? "The download did not start. Try again.");
      return;
    }
    const url = URL.createObjectURL(await response.blob());
    const link = document.createElement("a");
    link.href = url;
    link.download = downloadFileName(slug);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
    finish("done", `Downloaded ${downloadFileName(slug)} with your Theme Lab tokens`);
  };

  return (
    <div className="flex flex-col items-start gap-1 lg:items-end">
      <Button variant="outline" onClick={() => void download()} aria-busy={status === "loading"} data-download="">
        <span className="relative inline-flex size-4 items-center justify-center">
          {status === "loading" ? (
            <LoaderCircle size={16} strokeWidth={1.5} aria-hidden className="animate-spin motion-reduce:animate-none" />
          ) : status === "done" ? (
            <Check size={16} strokeWidth={1.5} aria-hidden className="text-accent" />
          ) : (
            <Download size={16} strokeWidth={1.5} aria-hidden className="text-muted" />
          )}
        </span>
        Download zip<span className="sr-only"> of {name}</span>
      </Button>
      <p role="status" className={cn("text-12", status === "failed" ? "text-danger" : "sr-only")}>
        {message}
      </p>
    </div>
  );
}
