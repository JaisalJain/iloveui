import type { DesignState } from "@/registry/definitions";
import { PreviewCanvas } from "@/registry/preview-kit";
import OndineOtpInput from "./component";

// Demo backend: 481902 is the code that was sent; anything else is rejected after a short check.
function verify(code: string) {
  return new Promise<boolean>((resolve) => setTimeout(() => resolve(code === "481902"), 900));
}

function render(state: DesignState) {
  switch (state) {
    case "active":
      return <OndineOtpInput forceState="active" />;
    case "loading":
      return <OndineOtpInput forceState="loading" />;
    case "error":
      return <OndineOtpInput forceState="error" />;
    case "success":
      return <OndineOtpInput forceState="success" />;
    case "disabled":
      return <OndineOtpInput disabled />;
    default:
      return (
        <>
          <OndineOtpInput onComplete={verify} />
          <p className="mt-4 text-center text-xs text-(--iu-muted)">
            Demo code: <span className="font-mono tabular-nums">481902</span>
          </p>
        </>
      );
  }
}

export default function Preview({ state }: { state: DesignState }) {
  return (
    <PreviewCanvas width="md">
      <div key={state}>{render(state)}</div>
    </PreviewCanvas>
  );
}
