"use client";

import { Bookmark, Check, Copy, Lock, MessageSquareCode } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { setBookmarked, useBookmarked } from "@/lib/client/bookmarks";
import { getTheme } from "@/lib/client/theme-lab";
import { aiPromptWithTokens } from "@/lib/code";
import { themeCss } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { loadDesignCode } from "./design-code-store";
import { PRICING_PATH } from "./paths";
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

export function AiPromptButton({ codeUrl }: { codeUrl: string | null }) {
  const { status, message, copy } = useCopy();
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

export function BookmarkButton({ slug, name }: { slug: string; name: string }) {
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
