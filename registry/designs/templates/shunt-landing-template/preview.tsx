"use client";

import type { DesignState } from "@/registry/definitions";
import ShuntLandingTemplate from "./component";

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

// A full page: rendered edge to edge, without a preview canvas. The non-default states put the pricing checkout and
// the sign-up form into that state together.
export default function Preview({ state }: { state: DesignState }) {
  switch (state) {
    case "loading":
      return <ShuntLandingTemplate checkoutStatus="loading" signupStatus="loading" defaultEmail="dana@copperline.co" />;
    case "error":
      return <ShuntLandingTemplate checkoutStatus="error" signupStatus="error" defaultEmail="dana@copperline.co" />;
    case "success":
      return <ShuntLandingTemplate checkoutStatus="success" signupStatus="success" defaultEmail="dana@copperline.co" />;
    default:
      return <ShuntLandingTemplate onCheckout={() => wait(1100)} onSignup={() => wait(900)} />;
  }
}
