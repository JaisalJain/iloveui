"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type CopyStatus = "idle" | "copied" | "failed";

/** Counts a copy for "most copied" sorting. Fire and forget: a failed count never affects the copy. */
export function recordCopy(slug: string) {
  fetch("/api/metrics", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ slug, kind: "copy" }),
    keepalive: true,
  }).catch(() => undefined);
}

/**
 * Clipboard writes with feedback: the status flips the moment the write settles (well under 100ms), and `message`
 * feeds a polite live region so screen readers hear the result too.
 */
export function useCopy(resetAfter = 1800) {
  const [status, setStatus] = useState<CopyStatus>("idle");
  const [message, setMessage] = useState("");
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = useCallback(
    async (text: string | Promise<string>, label: string): Promise<boolean> => {
      window.clearTimeout(timer.current);
      let ok: boolean;
      try {
        await navigator.clipboard.writeText(await text);
        ok = true;
      } catch {
        ok = false;
      }
      setStatus(ok ? "copied" : "failed");
      setMessage(ok ? `Copied ${label}` : `Could not copy ${label}. Select the text and copy it instead.`);
      timer.current = window.setTimeout(() => setStatus("idle"), resetAfter);
      return ok;
    },
    [resetAfter],
  );

  return { status, message, copy };
}
