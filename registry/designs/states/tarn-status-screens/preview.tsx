import type { DesignState } from "@/registry/definitions";
import TarnStatusScreens, { type TarnScreenKind } from "./component";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

// Each catalog state shows one screen: error is the 500, loading the maintenance window, disabled the rate
// limit (the action is locked until it resets) and empty the offline screen (nothing could be loaded).
function kindFor(state: DesignState): TarnScreenKind {
  switch (state) {
    case "error":
      return "server-error";
    case "loading":
      return "maintenance";
    case "disabled":
      return "rate-limited";
    case "empty":
      return "offline";
    default:
      return "not-found";
  }
}

export default function Preview({ state }: { state: DesignState }) {
  return <TarnStatusScreens key={state} kind={kindFor(state)} onRetry={() => wait(1200)} />;
}
