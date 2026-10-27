import type { DesignState } from "@/registry/definitions";
import { PreviewCanvas } from "@/registry/preview-kit";
import WipeHoldConfirm from "./component";

// Demo behaviour: the device acknowledges after a short round trip so the live preview shows loading, then success.
const wipe = () => new Promise<void>((resolve) => setTimeout(resolve, 1300));

function Demo({ state }: { state: DesignState }) {
  switch (state) {
    case "active":
      return <WipeHoldConfirm forceState="active" onComplete={wipe} />;
    case "disabled":
      return <WipeHoldConfirm disabled />;
    case "loading":
      return <WipeHoldConfirm status="loading" />;
    case "error":
      return <WipeHoldConfirm status="error" onComplete={wipe} />;
    case "success":
      return <WipeHoldConfirm status="success" />;
    default:
      return <WipeHoldConfirm onComplete={wipe} />;
  }
}

export default function Preview({ state }: { state: DesignState }) {
  return (
    <PreviewCanvas width="md">
      <Demo state={state} />
    </PreviewCanvas>
  );
}
