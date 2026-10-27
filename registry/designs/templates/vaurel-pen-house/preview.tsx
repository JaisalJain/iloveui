import type { DesignState } from "@/registry/definitions";
import VaurelPenHouse from "./component";

// Demo newsletter backend: any well-formed address is accepted after a short wait.
function subscribe() {
  return new Promise<void>((resolve) => setTimeout(resolve, 900));
}

const EMAIL = "ines.carvalho@atelier-nord.fr";

// A full page: rendered edge to edge, without a preview canvas. The states are the newsletter form's.
export default function Preview({ state }: { state: DesignState }) {
  switch (state) {
    case "loading":
      return <VaurelPenHouse key={state} defaultBagCount={1} defaultEmail={EMAIL} newsletterStatus="loading" />;
    case "error":
      return <VaurelPenHouse key={state} defaultBagCount={1} defaultEmail={EMAIL} newsletterStatus="error" />;
    case "success":
      return <VaurelPenHouse key={state} defaultBagCount={1} defaultEmail={EMAIL} newsletterStatus="success" />;
    default:
      return <VaurelPenHouse key={state} defaultBagCount={1} onSubscribe={subscribe} />;
  }
}
