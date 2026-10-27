import type { DesignState } from "@/registry/definitions";
import { PreviewCanvas } from "@/registry/preview-kit";
import SwipeTriageAlerts, { type SwipeAlert } from "./component";

// Demo backend: every commit takes a moment, and the ledger-worker alert cannot be deleted while its incident is open.
function settleAfter(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

async function demoDelete(item: SwipeAlert) {
  await settleAfter(700);
  if (item.service === "ledger-worker") {
    throw new Error("Couldn't delete: ledger-worker is linked to open incident INC-2291.");
  }
}

function render(state: DesignState) {
  switch (state) {
    case "active":
      return <SwipeTriageAlerts forceState="active" />;
    case "loading":
      return <SwipeTriageAlerts forceState="loading" />;
    case "error":
      return <SwipeTriageAlerts forceState="error" />;
    case "success":
      return <SwipeTriageAlerts forceState="success" />;
    case "empty":
      return <SwipeTriageAlerts items={[]} />;
    case "disabled":
      return <SwipeTriageAlerts disabled />;
    default:
      return <SwipeTriageAlerts onDelete={demoDelete} onArchive={() => settleAfter(500)} />;
  }
}

export default function Preview({ state }: { state: DesignState }) {
  return (
    <PreviewCanvas width="md">
      <div key={state}>{render(state)}</div>
    </PreviewCanvas>
  );
}
