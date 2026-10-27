"use client";

import { useState } from "react";
import type { DesignState } from "@/registry/definitions";
import BigtopAnalyticsShell from "./component";

// A full-page app shell: rendered edge to edge, without a preview canvas.
export default function Preview({ state }: { state: DesignState }) {
  if (state === "loading") return <BigtopAnalyticsShell status="loading" />;
  if (state === "empty")
    return (
      <BigtopAnalyticsShell
        status="empty"
        site="fernlog.page"
        breadcrumbs={["Sites", "fernlog.page", "Traffic"]}
        snippet='<script defer data-site="fernlog.page" src="/bigtop.js"></script>'
      />
    );
  if (state === "error") return <RetryDemo />;
  return <BigtopAnalyticsShell />;
}

// The stats request timed out; Try again loads for a moment, then the data arrives.
function RetryDemo() {
  const [status, setStatus] = useState<"error" | "loading" | "ready">("error");
  return (
    <BigtopAnalyticsShell
      status={status}
      onRetry={() => {
        setStatus("loading");
        window.setTimeout(() => setStatus("ready"), 900);
      }}
    />
  );
}
