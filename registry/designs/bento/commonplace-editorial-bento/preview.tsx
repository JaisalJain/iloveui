import type { DesignState } from "@/registry/definitions";
import CommonplaceEditorialBento from "./component";

// A full-width section: rendered edge to edge, without a preview canvas.
export default function Preview({ state }: { state: DesignState }) {
  if (state === "empty") return <CommonplaceEditorialBento key="empty" defaultFiled={[]} />;
  return <CommonplaceEditorialBento key={state} />;
}
