import type { ComponentProps } from "react";
import { clsx } from "clsx";

// clsx, not cn(): Kbd sits in the always-loaded shell, and callers only add positioning classes that never conflict.
export function Kbd({ className, ...props }: ComponentProps<"kbd">) {
  return (
    <kbd
      className={clsx(
        "inline-flex h-5 min-w-5 items-center justify-center rounded-[4px] border border-hairline bg-raised px-1",
        "font-mono text-12 leading-none font-medium text-muted tabular-nums",
        className,
      )}
      {...props}
    />
  );
}
