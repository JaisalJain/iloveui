import { clsx } from "clsx";
import { monetizationEnabled } from "@/lib/monetization";

/**
 * The only two tag styles on the site: Free is a neutral outline pill, Pro an accent outline pill. Without
 * monetization every design is free, so no tag is shown.
 */
export function TierTag({ tier }: { tier: "free" | "pro" }) {
  if (!monetizationEnabled()) return null;
  return (
    <span
      className={clsx(
        "inline-flex h-5 items-center rounded-full border px-2 font-mono text-12 leading-none tracking-wide uppercase",
        tier === "pro" ? "border-accent text-accent" : "border-hairline text-muted",
      )}
    >
      {tier === "pro" ? "Pro" : "Free"}
    </span>
  );
}
