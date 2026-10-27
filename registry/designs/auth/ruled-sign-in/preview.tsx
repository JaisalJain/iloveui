import type { DesignState } from "@/registry/definitions";
import RuledSignIn from "./component";

const RETURNING = { email: "ines@northwind-labs.com", password: "harbour-lights-27" };
const NEW_ACCOUNT = { name: "Ines Carvalho", email: "ines@northwind-labs.com", password: "tidepool-4" };

// The live preview resolves after a believable round trip so the loading and success states can be seen.
function signIn() {
  return new Promise<void>((resolve) => setTimeout(resolve, 1400));
}

// A full-width screen: rendered edge to edge, without a preview canvas.
export default function Preview({ state }: { state: DesignState }) {
  switch (state) {
    case "loading":
      return <RuledSignIn key={state} defaultValues={RETURNING} status="loading" />;
    case "error":
      return <RuledSignIn key={state} defaultValues={RETURNING} status="error" onSubmit={signIn} />;
    case "success":
      return <RuledSignIn key={state} defaultMode="sign-up" defaultValues={NEW_ACCOUNT} status="success" />;
    default:
      return <RuledSignIn key={state} defaultMode="sign-up" defaultValues={NEW_ACCOUNT} onSubmit={signIn} />;
  }
}
