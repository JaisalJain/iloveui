import type { DesignState } from "@/registry/definitions";
import { PreviewCanvas } from "@/registry/preview-kit";
import PriorityRankList from "./component";

// Demo backend: saving takes a moment and always succeeds.
function saveOrder() {
  return new Promise<void>((resolve) => setTimeout(resolve, 650));
}

function render(state: DesignState) {
  switch (state) {
    case "active":
      return <PriorityRankList forceState="active" />;
    case "loading":
      return <PriorityRankList forceState="loading" />;
    case "error":
      return <PriorityRankList forceState="error" />;
    case "success":
      return <PriorityRankList forceState="success" />;
    case "empty":
      return <PriorityRankList items={[]} />;
    case "disabled":
      return <PriorityRankList disabled />;
    default:
      return <PriorityRankList onChange={saveOrder} />;
  }
}

export default function Preview({ state }: { state: DesignState }) {
  return (
    <PreviewCanvas width="md">
      <div key={state}>{render(state)}</div>
    </PreviewCanvas>
  );
}
