import type { DesignState } from "@/registry/definitions";
import { PreviewCanvas } from "@/registry/preview-kit";
import FareSlideToPay from "./component";

// Demo behaviour: the bank answers after a believable pause, so the live preview shows loading, then success.
const pay = () => new Promise<void>((resolve) => setTimeout(resolve, 1400));

function Demo({ state }: { state: DesignState }) {
  switch (state) {
    case "active":
      return <FareSlideToPay forceState="active" onComplete={pay} />;
    case "disabled":
      return <FareSlideToPay disabled />;
    case "loading":
      return <FareSlideToPay status="loading" />;
    case "error":
      return <FareSlideToPay status="error" onComplete={pay} />;
    case "success":
      return <FareSlideToPay status="success" />;
    default:
      return <FareSlideToPay onComplete={pay} />;
  }
}

export default function Preview({ state }: { state: DesignState }) {
  return (
    <PreviewCanvas width="sm">
      <Demo state={state} />
    </PreviewCanvas>
  );
}
