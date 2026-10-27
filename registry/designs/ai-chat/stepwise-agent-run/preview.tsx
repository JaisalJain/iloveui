import { useState } from "react";
import type { DesignState } from "@/registry/definitions";
import { PreviewCanvas } from "@/registry/preview-kit";
import StepwiseAgentRun, { STEPWISE_STEPS, type StepwiseStep } from "./component";

// slack.post is rate limited after 0.5 s, so the run fails on its last step.
const FAILED_STEPS: StepwiseStep[] = STEPWISE_STEPS.map((step) =>
  step.id === "s9"
    ? {
        ...step,
        error:
          "429 rate_limited · Slack allows 1 message per second to #finance-close. Retry-After: 4 s. Nothing was posted; the report is saved on the run.",
      }
    : step,
);

/** Running a task or retrying replays the run; Stop freezes it where it is. */
function LiveRun({
  initialStatus = "idle",
  runFrom = 0,
  steps = STEPWISE_STEPS,
  expanded,
}: {
  initialStatus?: "idle" | "running" | "error";
  runFrom?: number;
  steps?: StepwiseStep[];
  expanded?: string | null;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [from, setFrom] = useState(runFrom);
  const [runSteps, setRunSteps] = useState(steps);
  const restart = () => {
    setRunSteps(STEPWISE_STEPS);
    setFrom(0);
    setStatus("running");
  };
  return (
    <StepwiseAgentRun
      status={status}
      runFrom={from}
      steps={runSteps}
      defaultExpandedStepId={expanded}
      onSend={restart}
      onRetry={restart}
      onRunEnd={() => setStatus("idle")}
    />
  );
}

export default function Preview({ state }: { state: DesignState }) {
  switch (state) {
    case "loading":
      return (
        <PreviewCanvas width="xl" align="start">
          <LiveRun key="loading" initialStatus="running" runFrom={10.62} expanded="s8" />
        </PreviewCanvas>
      );
    case "error":
      return (
        <PreviewCanvas width="xl" align="start">
          <LiveRun key="error" initialStatus="error" runFrom={13.41} steps={FAILED_STEPS} expanded="s9" />
        </PreviewCanvas>
      );
    default:
      return (
        <PreviewCanvas width="xl" align="start">
          <LiveRun key="default" />
        </PreviewCanvas>
      );
  }
}
