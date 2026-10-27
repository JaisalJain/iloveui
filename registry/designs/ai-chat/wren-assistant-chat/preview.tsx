import { useState } from "react";
import type { DesignState } from "@/registry/definitions";
import { PreviewCanvas } from "@/registry/preview-kit";
import WrenAssistantChat, { WREN_DEMO_MESSAGES, type WrenMessage } from "./component";

const DEMO_REPLY = WREN_DEMO_MESSAGES.find((message) => message.role === "assistant");

/** A live thread: sending replays the demo reply, Retry streams it again, Stop freezes it. */
function LiveThread({
  initial,
  initialStatus = "idle",
  streamFrom = 0,
}: {
  initial: WrenMessage[];
  initialStatus?: "idle" | "streaming" | "error";
  streamFrom?: number;
}) {
  const [messages, setMessages] = useState(initial);
  const [status, setStatus] = useState(initialStatus);
  const [from, setFrom] = useState(streamFrom);
  return (
    <WrenAssistantChat
      messages={messages}
      status={status}
      streamFrom={from}
      onSend={({ text, attachments }) => {
        if (!DEMO_REPLY) return;
        const stamp = String(messages.length);
        setMessages((list) => [
          ...list,
          { id: `u${stamp}`, role: "user", time: "09:44", text, attachments },
          { ...DEMO_REPLY, id: `r${stamp}`, time: "09:44" },
        ]);
        setFrom(0);
        setStatus("streaming");
      }}
      onRetry={() => {
        setFrom(0);
        setStatus("streaming");
      }}
      onStop={() => setStatus("idle")}
      onStreamEnd={() => setStatus("idle")}
    />
  );
}

export default function Preview({ state }: { state: DesignState }) {
  switch (state) {
    case "loading":
      return (
        <PreviewCanvas width="lg" align="start">
          <LiveThread key="loading" initial={WREN_DEMO_MESSAGES} initialStatus="streaming" streamFrom={0.78} />
        </PreviewCanvas>
      );
    case "error":
      return (
        <PreviewCanvas width="lg" align="start">
          <LiveThread key="error" initial={WREN_DEMO_MESSAGES} initialStatus="error" streamFrom={0.55} />
        </PreviewCanvas>
      );
    case "empty":
      return (
        <PreviewCanvas width="lg" align="start">
          <LiveThread key="empty" initial={[]} />
        </PreviewCanvas>
      );
    default:
      return (
        <PreviewCanvas width="lg" align="start">
          <LiveThread key="default" initial={WREN_DEMO_MESSAGES} />
        </PreviewCanvas>
      );
  }
}
