import type { DesignState } from "@/registry/schema";
import GridlineHero from "./component";

// A full-width section: rendered edge to edge, without a preview canvas.
export default function Preview({ state }: { state: DesignState }) {
  return <GridlineHero key={state} />;
}
