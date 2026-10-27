"use client";

import type { ReactNode } from "react";
import { toggleColorMode, useColorMode } from "@/lib/client/theme-mode";
import { Kbd } from "@/components/ui/kbd";
import { Tooltip } from "@/components/ui/tooltip";

/** The icons are rendered by the (server) header, so the shell ships no icon code. */
export function ThemeToggle({ sunIcon, moonIcon }: { sunIcon: ReactNode; moonIcon: ReactNode }) {
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
        className={
          "inline-flex size-8 items-center justify-center rounded-control text-muted transition-colors duration-160 ease-site " +
          "hover:bg-raised hover:text-fg active:translate-y-px pointer-coarse:size-10"
        }
      >
        {mode === "dark" ? sunIcon : moonIcon}
      </button>
    </Tooltip>
  );
}
