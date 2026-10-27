"use client";

import { useState } from "react";
import type { DesignState } from "@/registry/definitions";
import { PreviewCanvas } from "@/registry/preview-kit";
import GristmillOrderBoard from "./component";

export default function Preview({ state }: { state: DesignState }) {
  switch (state) {
    case "loading":
      return (
        <PreviewCanvas align="start" width="xl">
          <GristmillOrderBoard status="loading" />
        </PreviewCanvas>
      );
    case "empty":
      return (
        <PreviewCanvas align="start" width="xl">
          <GristmillOrderBoard orders={[]} />
        </PreviewCanvas>
      );
    case "error":
      return <RetryDemo />;
    default:
      // Two orders start selected so the bulk slab is visible on first paint.
      return (
        <PreviewCanvas align="start" width="xl">
          <GristmillOrderBoard defaultSelected={["GM-1057", "GM-1054"]} />
        </PreviewCanvas>
      );
  }
}

// Retry shows the skeleton for 900ms, then the board.
function RetryDemo() {
  const [status, setStatus] = useState<"error" | "loading" | "ready">("error");
  return (
    <PreviewCanvas align="start" width="xl">
      <GristmillOrderBoard
        status={status}
        onRetry={() => {
          setStatus("loading");
          setTimeout(() => setStatus("ready"), 900);
        }}
      />
    </PreviewCanvas>
  );
}
