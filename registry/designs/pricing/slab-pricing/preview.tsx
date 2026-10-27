import { useState } from "react";
import type { DesignState } from "@/registry/schema";
import SlabPricing, { type SlabCheckoutStatus } from "./component";

/** Demo checkout: opens for 900ms, then confirms. */
function openCheckout() {
  return new Promise<void>((resolve) => setTimeout(resolve, 900));
}

/** The error state, wired so Retry checkout runs the demo checkout and lands on the confirmation. */
function RetryDemo() {
  const [status, setStatus] = useState<SlabCheckoutStatus>("error");
  const [planId, setPlanId] = useState("team");
  return (
    <SlabPricing
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
      return <SlabPricing status="loading" />;
    case "error":
      return <RetryDemo />;
    case "success":
      return <SlabPricing status="success" defaultBilling="yearly" />;
    default:
      return <SlabPricing onCheckout={openCheckout} />;
  }
}
