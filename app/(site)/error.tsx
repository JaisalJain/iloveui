"use client";

import { lazy, Suspense } from "react";

// Next loads every error boundary with the page, so the boundary itself stays a stub and its content loads only when
// an error is actually shown.
const SiteErrorContent = lazy(() => import("@/components/site/site-error"));

export default function SiteError(props: { error: unknown; retry: () => void }) {
  return (
    <Suspense fallback={null}>
      <SiteErrorContent {...props} />
    </Suspense>
  );
}
