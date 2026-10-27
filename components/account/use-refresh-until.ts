"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * While `active`, re-renders the server page every `intervalMs` until `done` turns true or `timeoutMs` passes.
 * Returns whether it gave up. The account page is server-rendered, so router.refresh() is how new rows appear.
 */
export function useRefreshUntil({
  active,
  done,
  intervalMs = 2000,
  timeoutMs = 30_000,
}: {
  active: boolean;
  done: boolean;
  intervalMs?: number;
  timeoutMs?: number;
}): boolean {
  const router = useRouter();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!active || done) return;
    const started = Date.now();
    const timer = window.setInterval(() => {
      if (Date.now() - started >= timeoutMs) {
        window.clearInterval(timer);
        setTimedOut(true);
        return;
      }
      router.refresh();
    }, intervalMs);
    router.refresh();
    return () => window.clearInterval(timer);
  }, [active, done, intervalMs, timeoutMs, router]);

  return timedOut && !done;
}
