import type { DesignState } from "@/registry/definitions";
import KestrelSignalBento from "./component";

// A full-width section: rendered edge to edge, without a preview canvas.
export default function Preview({ state }: { state: DesignState }) {
  if (state === "loading") return <KestrelSignalBento key="loading" status="loading" />;
  return <KestrelSignalBento key={state} />;
}
