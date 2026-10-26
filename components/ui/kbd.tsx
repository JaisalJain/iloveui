import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Kbd({ className, ...props }: ComponentProps<"kbd">) {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded-[4px] border border-hairline bg-raised px-1",
        "font-mono text-12 leading-none font-medium text-muted tabular-nums",
        className,
      )}
      {...props}
    />
  );
}
