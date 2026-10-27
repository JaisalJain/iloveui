import type { DesignState } from "@/registry/definitions";
import { PreviewCanvas } from "@/registry/preview-kit";
import BoxcarCommandPalette from "./component";

// The palette starts open over its trigger so the preview shows it; Esc closes it and Cmd+K or the trigger reopens it.
export default function Preview({ state }: { state: DesignState }) {
  switch (state) {
    case "loading":
      return (
        <PreviewCanvas align="start">
          <BoxcarCommandPalette defaultOpen defaultQuery="inv" status="loading" />
        </PreviewCanvas>
      );
    case "empty":
      return (
        <PreviewCanvas align="start">
          <BoxcarCommandPalette defaultOpen defaultQuery="#warehouse robots" />
        </PreviewCanvas>
      );
    default:
      return (
        <PreviewCanvas align="start">
          <BoxcarCommandPalette defaultOpen />
        </PreviewCanvas>
      );
  }
}
