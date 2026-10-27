import type { DesignState } from "@/registry/definitions";
import { PreviewCanvas } from "@/registry/preview-kit";
import VerelleCards from "./component";

// Demo behaviour: a reservation settles after 1.6s, long enough to watch the hairline trace.
const reserve = () => new Promise<void>((resolve) => setTimeout(resolve, 1600));

export default function Preview({ state }: { state: DesignState }) {
  switch (state) {
    case "hover":
    case "focus":
    case "active":
      return (
        <PreviewCanvas width="xl">
          <VerelleCards forceState={state} onReserve={reserve} />
        </PreviewCanvas>
      );
    case "disabled":
      return (
        <PreviewCanvas width="xl">
          <VerelleCards disabled />
        </PreviewCanvas>
      );
    case "loading":
      return (
        <PreviewCanvas width="xl">
          <VerelleCards status="loading" />
        </PreviewCanvas>
      );
    case "success":
      return (
        <PreviewCanvas width="xl">
          <VerelleCards status="success" />
        </PreviewCanvas>
      );
    default:
      return (
        <PreviewCanvas width="xl">
          <VerelleCards onReserve={reserve} />
        </PreviewCanvas>
      );
  }
}
