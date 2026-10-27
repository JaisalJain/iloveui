"use client";

import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { isBookmarked, setBookmarked } from "@/lib/client/bookmarks";
import { callApi } from "./api";

/** Removing a bookmark is easy to undo (bookmark it again), so it needs no confirmation, only quick feedback. */
export function RemoveBookmarkButton({ slug, name }: { slug: string; name: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function remove() {
    setPending(true);
    setError("");
    const result = await callApi(`/api/bookmarks/${encodeURIComponent(slug)}`, { method: "DELETE" });
    if (!result.ok) {
      setPending(false);
      setError(result.message);
      return;
    }
    // Keep this browser's copy in step, so the design page does not show it bookmarked.
    if (isBookmarked(slug)) setBookmarked(slug, false);
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={remove}
        disabled={pending}
        aria-label={`Remove bookmark: ${name}`}
        title={error || undefined}
        className="inline-flex size-8 shrink-0 items-center justify-center rounded-control text-muted transition-colors duration-160 ease-site hover:bg-raised hover:text-fg disabled:opacity-40 pointer-coarse:size-10"
      >
        <X size={16} strokeWidth={1.5} aria-hidden />
      </button>
      <span role="status" className="sr-only">
        {error}
      </span>
    </>
  );
}
