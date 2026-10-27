import type { DesignState } from "@/registry/definitions";
import { PreviewCanvas } from "@/registry/preview-kit";
import HopscotchOnboarding, { type HopscotchValues } from "./component";

const ANSWERS: Partial<HopscotchValues> = {
  name: "Dana Okoye",
  email: "dana@fieldnote.studio",
  password: "pebble-path-81",
  workspace: "Fieldnote Studio",
  team: "design",
  invites: ["theo.marsh@fieldnote.studio", "ama.boateng@fieldnote.studio", "lucas@fieldnote.studio"],
  template: "sprint",
  mondayDigest: true,
};

// The live preview resolves after a believable round trip so the loading dots and the finish can be seen.
function finish() {
  return new Promise<void>((resolve) => setTimeout(resolve, 1500));
}

function Flow({ state }: { state: DesignState }) {
  switch (state) {
    case "empty":
      return <HopscotchOnboarding defaultStep={2} defaultValues={{ ...ANSWERS, invites: [] }} onComplete={finish} />;
    case "loading":
      return <HopscotchOnboarding defaultStep={3} defaultValues={ANSWERS} status="loading" />;
    case "error":
      return <HopscotchOnboarding defaultStep={3} defaultValues={ANSWERS} status="error" onComplete={finish} />;
    case "success":
      return <HopscotchOnboarding defaultValues={ANSWERS} status="success" />;
    default:
      return (
        <HopscotchOnboarding
          defaultStep={1}
          defaultValues={{ ...ANSWERS, workspace: "Fieldnote Studio", team: "", invites: ANSWERS.invites }}
          onComplete={finish}
        />
      );
  }
}

export default function Preview({ state }: { state: DesignState }) {
  return (
    <PreviewCanvas width="md">
      <Flow key={state} state={state} />
    </PreviewCanvas>
  );
}
