import type { DesignState } from "@/registry/definitions";
import WaterfallTraceHero from "./component";

// A full-width section: rendered edge to edge, without a preview canvas.
export default function Preview({ state }: { state: DesignState }) {
  return <WaterfallTraceHero key={state} />;
}
