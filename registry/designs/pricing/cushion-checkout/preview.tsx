import { useState } from "react";
import type { DesignState } from "@/registry/definitions";
import { PreviewCanvas } from "@/registry/preview-kit";
import CushionCheckout, { type CushionCheckoutStatus, type CushionValues } from "./component";

const FILLED: Partial<CushionValues> = {
  email: "ines.duarte@harbourline.io",
  cardNumber: "4242 4242 4242 4242",
  expiry: "08/29",
  cvc: "314",
  name: "Inês Duarte",
  country: "GB",
  postalCode: "EC2A 4NE",
};

/** Demo payment: processes for 1.4s, then succeeds. */
function pay() {
  return new Promise<void>((resolve) => setTimeout(resolve, 1400));
}

/** The error state, wired so Try again runs the demo payment and lands on the receipt. */
function RetryDemo() {
  const [status, setStatus] = useState<CushionCheckoutStatus>("error");
  return (
    <CushionCheckout
      status={status}
      defaultValues={FILLED}
      onPay={() => {
        setStatus("loading");
        pay().then(() => setStatus("success"));
      }}
    />
  );
}

export default function Preview({ state }: { state: DesignState }) {
  let content;
  switch (state) {
    case "loading":
      content = <CushionCheckout status="loading" defaultValues={FILLED} />;
      break;
    case "error":
      content = <RetryDemo />;
      break;
    case "success":
      content = <CushionCheckout status="success" defaultValues={FILLED} />;
      break;
    default:
      content = <CushionCheckout defaultValues={{ email: "ines.duarte@harbourline.io" }} onPay={pay} />;
  }
  return <PreviewCanvas width="xl">{content}</PreviewCanvas>;
}
