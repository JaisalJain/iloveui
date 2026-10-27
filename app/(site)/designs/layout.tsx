import type { ReactNode } from "react";
import { ThemeLabDock } from "@/components/theme-lab/theme-lab-dock";

// Browse and design pages share this layout; Theme Lab is docked to the bottom of every page under /designs.
export default function DesignsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <ThemeLabDock />
    </>
  );
}
