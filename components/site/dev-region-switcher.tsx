"use client";

import { useRouter } from "next/navigation";
import { useSyncExternalStore } from "react";
import { DEV_REGION_COOKIE } from "@/lib/region";

// Development only (spec section 11): switch the pricing region to test rupee and dollar prices locally.
// The server honours the cookie only when NODE_ENV is development.

function readCookie(): string {
  const match = document.cookie.split("; ").find((part) => part.startsWith(`${DEV_REGION_COOKIE}=`));
  return match ? decodeURIComponent(match.slice(DEV_REGION_COOKIE.length + 1)) : "";
}

const subscribe = () => () => {};

export function DevRegionSwitcher() {
  const router = useRouter();
  const value = useSyncExternalStore(subscribe, readCookie, () => "");

  return (
    <label className="flex items-center gap-2 text-12 text-muted">
      <span className="label-mono">Dev region</span>
      <select
        value={value}
        onChange={(event) => {
          const next = event.target.value;
          document.cookie = next
            ? `${DEV_REGION_COOKIE}=${encodeURIComponent(next)}; path=/; max-age=31536000; samesite=lax`
            : `${DEV_REGION_COOKIE}=; path=/; max-age=0; samesite=lax`;
          router.refresh();
        }}
        className="h-8 rounded-control border border-control bg-surface px-2 text-12 text-fg pointer-coarse:h-10"
      >
        <option value="">DEV_REGION</option>
        <option value="IN">India, INR</option>
        <option value="US">Elsewhere, USD</option>
      </select>
    </label>
  );
}
