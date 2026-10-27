"use client";

import { useState } from "react";
import type { DesignState } from "@/registry/definitions";
import { PreviewCanvas } from "@/registry/preview-kit";
import TesseraInvoiceTable from "./component";

// Two overdue invoices start selected so the bulk bar and its rolling total are visible on first paint.
export default function Preview({ state }: { state: DesignState }) {
  switch (state) {
    case "loading":
      return (
        <PreviewCanvas align="start" width="xl">
          <TesseraInvoiceTable status="loading" />
        </PreviewCanvas>
      );
    case "empty":
      return (
        <PreviewCanvas align="start" width="xl">
          <TesseraInvoiceTable invoices={[]} />
        </PreviewCanvas>
      );
    case "error":
      return <RetryDemo />;
    default:
      return (
        <PreviewCanvas align="start" width="xl">
          <TesseraInvoiceTable defaultSelected={["TS-2499", "TS-2496"]} />
        </PreviewCanvas>
      );
  }
}

// The error state's retry shows the skeleton for 900ms, then the data.
function RetryDemo() {
  const [status, setStatus] = useState<"error" | "loading" | "ready">("error");
  return (
    <PreviewCanvas align="start" width="xl">
      <TesseraInvoiceTable
        status={status}
        onRetry={() => {
          setStatus("loading");
          setTimeout(() => setStatus("ready"), 900);
        }}
      />
    </PreviewCanvas>
  );
}
