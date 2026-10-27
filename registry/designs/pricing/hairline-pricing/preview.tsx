import { useState } from "react";
import type { DesignState } from "@/registry/definitions";
import HairlinePricing, { type HairlineCheckoutStatus } from "./component";

/** Demo checkout: opens for 1.2s, then confirms. */
function openCheckout() {
  return new Promise<void>((resolve) => setTimeout(resolve, 1200));
}

/** The error state, wired so Try again runs the demo checkout and lands on the confirmation. */
function RetryDemo() {
  const [status, setStatus] = useState<HairlineCheckoutStatus>("error");
  const [planId, setPlanId] = useState("studio");
  return (
    <HairlinePricing
      status={status}
      checkoutPlanId={planId}
      onCheckout={(id) => {
        setPlanId(id);
        setStatus("loading");
        openCheckout().then(() => setStatus("success"));
      }}
    />
  );
}

// A full-width section: rendered edge to edge, without a preview canvas.
export default function Preview({ state }: { state: DesignState }) {
  switch (state) {
    case "loading":
      return <HairlinePricing status="loading" />;
    case "error":
      return <RetryDemo />;
    case "success":
      return <HairlinePricing status="success" />;
    default:
      return <HairlinePricing onCheckout={openCheckout} />;
  }
}
