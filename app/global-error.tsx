"use client";

import "./globals.css";
import { fontVariables } from "@/lib/fonts";

// Replaces the root layout when it fails, so it renders its own document.
export default function GlobalError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <html lang="en" className={fontVariables}>
      <body>
        <title>Something went wrong · iloveui</title>
        <main className="page-frame flex min-h-dvh flex-col items-start justify-center py-16">
          <p className="label-mono text-muted">Something went wrong</p>
          <h1 className="mt-4 max-w-2xl text-40 font-semibold sm:text-64">iloveui failed to load.</h1>
          <p className="mt-6 max-w-lg text-16 text-muted">
            The page hit an unexpected error. Reload to try again, or email hello@iloveui.dev if it persists.
          </p>
          <button
            type="button"
            onClick={() => retry()}
            className="mt-10 inline-flex h-12 items-center rounded-control bg-accent-fill px-6 text-16 font-medium text-accent-fg"
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
