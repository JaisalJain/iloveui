import type { DesignState } from "@/registry/definitions";
import CasefileTestimonials from "./component";

function openStory() {
  // The demo has no story pages; a real app routes to /customers/<id>.
}

// A full-width section: rendered edge to edge, without a preview canvas.
export default function Preview({ state }: { state: DesignState }) {
  switch (state) {
    case "loading":
      return <CasefileTestimonials status="loading" />;
    case "empty":
      return <CasefileTestimonials defaultIndustry="Health" defaultSize="small" onOpenStory={openStory} />;
    default:
      return <CasefileTestimonials onOpenStory={openStory} />;
  }
}
