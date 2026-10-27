import type { DesignState } from "@/registry/schema";
import { PreviewCanvas } from "@/registry/preview-kit";
import GumdropButtons from "./component";

// Demo behaviour: every async action settles after a short, realistic delay so the live preview shows the dots,
// then the check.
const settle = (ms: number) => () => new Promise<void>((resolve) => setTimeout(resolve, ms));
const demo = { onPublish: settle(1100), onSaveDraft: settle(800), onDelete: settle(900), onCheckIn: settle(1000) };

export default function Preview({ state }: { state: DesignState }) {
  switch (state) {
    case "hover":
    case "focus":
    case "active":
      return (
        <PreviewCanvas>
          <GumdropButtons forceState={state} {...demo} />
        </PreviewCanvas>
      );
    case "disabled":
      return (
        <PreviewCanvas>
          <GumdropButtons disabled />
        </PreviewCanvas>
      );
    case "loading":
      return (
        <PreviewCanvas>
          <GumdropButtons status="loading" />
        </PreviewCanvas>
      );
    case "success":
      return (
        <PreviewCanvas>
          <GumdropButtons status="success" />
        </PreviewCanvas>
      );
    default:
      return (
        <PreviewCanvas>
          <GumdropButtons {...demo} />
        </PreviewCanvas>
      );
  }
}
