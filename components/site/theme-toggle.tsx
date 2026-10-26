"use client";

import { Moon, Sun } from "lucide-react";
import { toggleColorMode, useColorMode } from "@/lib/client/theme-mode";
import { Kbd } from "@/components/ui/kbd";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const mode = useColorMode();
  const next = mode === "dark" ? "light" : "dark";
  return (
    <Tooltip
      content={
        <>
          Switch to {next} theme <Kbd>T</Kbd>
        </>
      }
    >
      <button
        type="button"
        onClick={toggleColorMode}
        aria-label={`Switch to ${next} theme`}
        className={cn(
          "inline-flex size-8 items-center justify-center rounded-control text-muted transition-colors duration-160 ease-site",
          "hover:bg-raised hover:text-fg active:translate-y-px pointer-coarse:size-10",
          className,
        )}
      >
        {mode === "dark" ? (
          <Sun size={16} strokeWidth={1.5} aria-hidden />
        ) : (
          <Moon size={16} strokeWidth={1.5} aria-hidden />
        )}
      </button>
    </Tooltip>
  );
}
