import type { DesignState } from "@/registry/definitions";
import { PreviewCanvas } from "@/registry/preview-kit";
import TripwireAlertRuleForm, { type TripwireValues } from "./component";

const RULE: Partial<TripwireValues> = {
  name: "payments-p95-latency",
  metric: "http.p95_latency",
  operator: "above",
  threshold: "800",
  duration: "10",
  services: ["checkout-api", "payments-worker"],
  severity: "sev2",
  channel: "slack",
  slackChannel: "#oncall-payments",
};

// The live preview saves after a believable round trip.
function save() {
  return new Promise<void>((resolve) => setTimeout(resolve, 1200));
}

function Form({ state }: { state: DesignState }) {
  switch (state) {
    case "error":
      return (
        <TripwireAlertRuleForm
          defaultValues={{
            ...RULE,
            name: "checkout-p95-latency",
            services: [],
            slackChannel: "oncall payments",
            mute: true,
            muteStart: "2026-11-07",
            muteEnd: "2026-11-01",
          }}
          errors={{
            name: "“checkout-p95-latency” already exists. Pick another name.",
            services: "Pick at least one service.",
            slackChannel: "Start with # and use lowercase, for example #oncall-payments.",
            muteEnd: "The end is before the start.",
          }}
          onSave={save}
        />
      );
    case "disabled":
      return <TripwireAlertRuleForm defaultValues={RULE} disabled />;
    case "loading":
      return <TripwireAlertRuleForm defaultValues={{ ...RULE, duration: "15" }} status="saving" />;
    case "success":
      return <TripwireAlertRuleForm defaultValues={RULE} status="saved" version={5} savedAt="14:36" />;
    default:
      return <TripwireAlertRuleForm defaultValues={RULE} onSave={save} />;
  }
}

export default function Preview({ state }: { state: DesignState }) {
  return (
    <PreviewCanvas align="start">
      <Form state={state} />
    </PreviewCanvas>
  );
}
