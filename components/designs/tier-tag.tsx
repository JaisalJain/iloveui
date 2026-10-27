import { clsx } from "clsx";

/** The only two tag styles on the site: Free is a neutral outline pill, Pro an accent outline pill. */
export function TierTag({ tier }: { tier: "free" | "pro" }) {
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
