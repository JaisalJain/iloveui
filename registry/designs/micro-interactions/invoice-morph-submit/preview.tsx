import type { DesignState } from "@/registry/definitions";
import { PreviewCanvas } from "@/registry/preview-kit";
import InvoiceMorphSubmit from "./component";

// Demo behaviour: the send resolves after a believable round trip so the live preview shows loading, then success.
const send = () => new Promise<void>((resolve) => setTimeout(resolve, 1500));

function Demo({ state }: { state: DesignState }) {
  switch (state) {
    case "active":
      return <InvoiceMorphSubmit forceState="active" onSubmit={send} />;
    case "disabled":
      return <InvoiceMorphSubmit disabled defaultValues={{ email: "" }} />;
    case "loading":
      return <InvoiceMorphSubmit status="loading" />;
    case "error":
      return <InvoiceMorphSubmit status="error" onSubmit={send} />;
    case "success":
      return <InvoiceMorphSubmit status="success" />;
    default:
      return <InvoiceMorphSubmit onSubmit={send} />;
  }
}

export default function Preview({ state }: { state: DesignState }) {
  return (
    <PreviewCanvas width="md">
      <Demo state={state} />
    </PreviewCanvas>
  );
}
