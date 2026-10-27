import { useState } from "react";
import type { DesignState } from "@/registry/definitions";
import OrsoloMembership, { type OrsoloStatus } from "./component";

/** Demo request: the membership desk answers after 1.6s. */
function reserve() {
  return new Promise<void>((resolve) => setTimeout(resolve, 1600));
}

/** The error state, wired so Try again runs the demo request and lands on the member card. */
function RetryDemo() {
  const [status, setStatus] = useState<OrsoloStatus>("error");
  return (
    <OrsoloMembership
      status={status}
      onRequest={() => {
        setStatus("loading");
        reserve().then(() => setStatus("success"));
      }}
    />
  );
}

// A full-width section: rendered edge to edge, without a preview canvas.
export default function Preview({ state }: { state: DesignState }) {
  switch (state) {
    case "loading":
      return <OrsoloMembership status="loading" defaultTerm="two" />;
    case "error":
      return <RetryDemo />;
    case "success":
      return <OrsoloMembership status="success" defaultTerm="two" />;
    default:
      return <OrsoloMembership onRequest={reserve} />;
  }
}
