import type { ReactNode } from "react";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";
import { SiteShell } from "./site-shell";

export function SiteChrome({ children }: { children: ReactNode }) {
  return (
    <SiteShell>
      <a
        href="#main"
        className="sr-only z-50 rounded-control bg-surface px-4 py-2 text-14 text-fg shadow-lg focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <div className="flex min-h-dvh flex-col">
        <SiteHeader />
        <main id="main" tabIndex={-1} className="flex-1 outline-hidden">
          {children}
        </main>
        <SiteFooter />
      </div>
    </SiteShell>
  );
}
