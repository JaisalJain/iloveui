import type { DesignState } from "@/registry/schema";
import MarginNotesTestimonials from "./component";

// A full-width section: rendered edge to edge, without a preview canvas.
export default function Preview({ state }: { state: DesignState }) {
  return <MarginNotesTestimonials key={state} />;
}
