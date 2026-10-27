import type { DesignState } from "@/registry/schema";
import { PreviewCanvas } from "@/registry/preview-kit";
import PillowWorkspaceForm, { type PillowWorkspaceValues } from "./component";

const DEMO: PillowWorkspaceValues = {
  name: "Fernway Studio",
  teamSize: "2-10",
  role: "design",
  timeZone: "Europe/Lisbon",
  inviteByEmail: true,
};

// The live preview resolves after a believable round trip so the press, ring and check can be seen.
function createWorkspace() {
  return new Promise<void>((resolve) => setTimeout(resolve, 1600));
}

function Form({ state }: { state: DesignState }) {
  switch (state) {
    case "focus":
      return <PillowWorkspaceForm autoFocus onSubmit={createWorkspace} />;
    case "error":
      return (
        <PillowWorkspaceForm
          defaultValues={{ ...DEMO, name: "", role: "" }}
          status="error"
          errors={{ name: "Give your workspace a name.", role: "Choose the role closest to yours." }}
          onSubmit={createWorkspace}
        />
      );
    case "disabled":
      return (
        <PillowWorkspaceForm
          defaultValues={DEMO}
          disabled
          disabledReason="Your plan includes 3 workspaces and all of them are in use. Archive one in Settings to create another."
        />
      );
    case "loading":
      return <PillowWorkspaceForm defaultValues={DEMO} status="loading" />;
    case "success":
      return <PillowWorkspaceForm defaultValues={DEMO} status="success" />;
    default:
      return <PillowWorkspaceForm defaultValues={DEMO} onSubmit={createWorkspace} />;
  }
}

export default function Preview({ state }: { state: DesignState }) {
  return (
    <PreviewCanvas>
      <Form state={state} />
    </PreviewCanvas>
  );
}
