import { useState } from "react";
import type { DesignState } from "@/registry/definitions";
import { PreviewCanvas } from "@/registry/preview-kit";
import QuireResearchAssistant from "./component";

/** Asking a follow-up or retrying writes the answer again; Stop freezes it where it is. */
function LiveDesk({
  initialStatus = "idle",
  streamFrom = 0,
}: {
  initialStatus?: "idle" | "streaming" | "error";
  streamFrom?: number;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [from, setFrom] = useState(streamFrom);
  const restart = () => {
    setFrom(0);
    setStatus("streaming");
  };
  return (
    <QuireResearchAssistant
      status={status}
      streamFrom={from}
      defaultActiveCitation={initialStatus === "idle" ? 1 : null}
      onSend={restart}
      onRetry={restart}
      onStop={() => undefined}
      onStreamEnd={() => setStatus("idle")}
    />
  );
}

export default function Preview({ state }: { state: DesignState }) {
  switch (state) {
    case "loading":
      return (
        <PreviewCanvas width="xl" align="start">
          <LiveDesk key="loading" initialStatus="streaming" streamFrom={0.62} />
        </PreviewCanvas>
      );
    case "error":
      return (
        <PreviewCanvas width="xl" align="start">
          <LiveDesk key="error" initialStatus="error" streamFrom={0.5} />
        </PreviewCanvas>
      );
    default:
      return (
        <PreviewCanvas width="xl" align="start">
          <LiveDesk key="default" />
        </PreviewCanvas>
      );
  }
}
