import type { DesignState } from "@/registry/definitions";
import LayerPeelCard from "./component";

// A full-width section: rendered edge to edge, without a preview canvas.
export default function Preview({ state }: { state: DesignState }) {
  return <LayerPeelCard key={state} />;
}
