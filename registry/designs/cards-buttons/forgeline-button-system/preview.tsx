import type { DesignState } from "@/registry/definitions";
import { PreviewCanvas } from "@/registry/preview-kit";
import ForgelineButtonSystem from "./component";

// Demo behaviour: a deploy settles after 2.8s, so the elapsed timer ticks before "Live in 3s".
const deploy = () => new Promise<void>((resolve) => setTimeout(resolve, 2800));

export default function Preview({ state }: { state: DesignState }) {
  switch (state) {
    case "hover":
    case "focus":
    case "active":
      return (
        <PreviewCanvas width="xl">
          <ForgelineButtonSystem forceState={state} onDeploy={deploy} />
        </PreviewCanvas>
      );
    case "disabled":
      return (
        <PreviewCanvas width="xl">
          <ForgelineButtonSystem disabled />
        </PreviewCanvas>
      );
    case "loading":
      return (
        <PreviewCanvas width="xl">
          <ForgelineButtonSystem status="loading" progress={0.42} step="Building" />
        </PreviewCanvas>
      );
    case "success":
      return (
        <PreviewCanvas width="xl">
          <ForgelineButtonSystem status="success" lastDuration={38} />
        </PreviewCanvas>
      );
    default:
      return (
        <PreviewCanvas width="xl">
          <ForgelineButtonSystem onDeploy={deploy} />
        </PreviewCanvas>
      );
  }
}
