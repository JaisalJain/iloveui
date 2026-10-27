import "./preview.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { PREVIEW_BOOT_SCRIPT } from "@/components/preview/protocol";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// Preview documents load only the catalog stylesheet: no site chrome, no site CSS, no auth.
export default function PreviewLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: PREVIEW_BOOT_SCRIPT }} />
      {children}
    </>
  );
}
