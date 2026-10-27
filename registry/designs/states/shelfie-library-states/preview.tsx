import type { DesignState } from "@/registry/definitions";
import { PreviewCanvas } from "@/registry/preview-kit";
import ShelfieLibraryStates from "./component";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export default function Preview({ state }: { state: DesignState }) {
  const status = state === "empty" || state === "error" || state === "loading" ? state : "no-results";
  return (
    <PreviewCanvas width="lg">
      <ShelfieLibraryStates key={state} status={status} onRetry={() => wait(1400)} />
    </PreviewCanvas>
  );
}
