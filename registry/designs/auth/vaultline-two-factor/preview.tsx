import type { DesignState } from "@/registry/definitions";
import { PreviewCanvas } from "@/registry/preview-kit";
import VaultlineTwoFactor from "./component";

const EMAIL = "sol@brightline.dev";

// The live preview accepts any code after a believable round trip, except 000000, which shows the error state.
function verify(code: string) {
  return new Promise<boolean>((resolve) => setTimeout(() => resolve(code !== "000000"), 1100));
}

function Flow({ state }: { state: DesignState }) {
  switch (state) {
    case "loading":
      return (
        <VaultlineTwoFactor
          defaultStep={2}
          defaultEmail={EMAIL}
          defaultCode="482913"
          windowSeconds={17}
          status="loading"
        />
      );
    case "error":
      return (
        <VaultlineTwoFactor
          defaultStep={2}
          defaultEmail={EMAIL}
          defaultCode="482931"
          windowSeconds={4}
          status="error"
          onVerify={verify}
        />
      );
    case "success":
      return <VaultlineTwoFactor defaultEmail={EMAIL} status="success" />;
    default:
      return <VaultlineTwoFactor defaultStep={1} defaultEmail={EMAIL} windowSeconds={22} onVerify={verify} />;
  }
}

export default function Preview({ state }: { state: DesignState }) {
  return (
    <PreviewCanvas width="xl">
      <Flow key={state} state={state} />
    </PreviewCanvas>
  );
}
