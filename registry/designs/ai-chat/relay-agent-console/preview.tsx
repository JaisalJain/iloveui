import { useState } from "react";
import type { DesignState } from "@/registry/definitions";
import { PreviewCanvas } from "@/registry/preview-kit";
import RelayAgentConsole, { RELAY_DEMO_TURNS, type RelayToolHealth, type RelayTurn } from "./component";

const DEMO_ANSWER = RELAY_DEMO_TURNS.find((turn) => turn.role === "agent");

// The incident lookup times out; retrying it resumes the run from that call.
const ERROR_TURNS: RelayTurn[] = RELAY_DEMO_TURNS.map((turn) =>
  turn.role === "agent"
    ? {
        ...turn,
        tokens: 1104,
        parts: turn.parts.map((part) =>
          part.type === "tool" && part.id === "call-incidents"
            ? {
                ...part,
                status: "error" as const,
                error: {
                  code: "504 · upstream timeout",
                  message:
                    "incident-log did not answer within 10,000 ms, so no incidents were read. The warehouse result above is unaffected.",
                  afterMs: 10_000,
                },
              }
            : part,
        ),
      }
    : turn,
);

const DEGRADED_TOOLS: RelayToolHealth[] = [
  { name: "warehouse", status: "ready" },
  { name: "incident-log", status: "degraded" },
  { name: "deploys", status: "ready" },
];

/** A new thread: picking the refunds prompt and sending it plays the full run. */
function EmptyThread() {
  const [turns, setTurns] = useState<RelayTurn[]>([]);
  const [status, setStatus] = useState<"idle" | "streaming">("idle");
  return (
    <RelayAgentConsole
      title={turns.length > 0 ? "EU refund spike, Sat 24 Oct" : "New thread"}
      turns={turns}
      status={status}
      attachments={[]}
      defaultDraft=""
      contextUsed={turns.length > 0 ? 30_818 : 28_914}
      onSend={(message) => {
        if (!DEMO_ANSWER || !/refund/i.test(message.text)) return;
        setTurns([
          { id: "demo-question", role: "user", time: "09:52", text: message.text },
          { ...DEMO_ANSWER, id: "demo-answer", time: "09:52" },
        ]);
        setStatus("streaming");
      }}
    />
  );
}

export default function Preview({ state }: { state: DesignState }) {
  switch (state) {
    case "loading":
      return (
        <PreviewCanvas width="xl" align="start">
          <RelayAgentConsole key="loading" status="streaming" streamFrom={{ part: 1, progress: 0.52 }} />
        </PreviewCanvas>
      );
    case "error":
      return (
        <PreviewCanvas width="xl" align="start">
          <RelayAgentConsole key="error" turns={ERROR_TURNS} tools={DEGRADED_TOOLS} contextUsed={30_076} />
        </PreviewCanvas>
      );
    case "empty":
      return (
        <PreviewCanvas width="xl" align="start">
          <EmptyThread key="empty" />
        </PreviewCanvas>
      );
    default:
      return (
        <PreviewCanvas width="xl" align="start">
          <RelayAgentConsole key="default" />
        </PreviewCanvas>
      );
  }
}
