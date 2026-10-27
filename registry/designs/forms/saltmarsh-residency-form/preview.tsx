import type { DesignState } from "@/registry/definitions";
import { PreviewCanvas } from "@/registry/preview-kit";
import SaltmarshResidencyForm, { type SaltmarshValues } from "./component";

const DEMO: SaltmarshValues = {
  name: "Teodora Vasić",
  email: "teodora@vasic.studio",
  discipline: "fiction",
  hometown: "Ljubljana, Slovenia",
  season: "autumn",
  title: "The Ferryman's Ledger",
  statement:
    "I am finishing a novel about a river ferry that keeps a ledger of every crossing for ninety years. Two hundred pages exist; the last third, set during the 1964 flood, needs long uninterrupted mornings and a view of moving water. At Saltmarsh I plan to draft the flood chapters and cut the middle by a quarter. My last book, Salt Hours, came out with Brda Press in 2024.",
};

// The live preview resolves after a believable round trip so the sending and received states can be seen.
function send() {
  return new Promise<void>((resolve) => setTimeout(resolve, 1600));
}

function Form({ state }: { state: DesignState }) {
  switch (state) {
    case "focus":
      return <SaltmarshResidencyForm autoFocus onSubmit={send} />;
    case "error":
      return (
        <SaltmarshResidencyForm
          defaultValues={{
            ...DEMO,
            email: "teodora@vasic",
            discipline: "",
            statement:
              "A novel about a river ferry that keeps a ledger of every crossing for ninety years. I need quiet mornings to draft the flood chapters and cut the middle.",
          }}
          errors={{
            email: "That email looks incomplete, for example noor@kettle.page.",
            discipline: "Choose the form you will work in.",
            statement: "Write at least 50 words; you have 29.",
          }}
          onSubmit={send}
        />
      );
    case "disabled":
      return <SaltmarshResidencyForm defaultValues={DEMO} disabled />;
    case "loading":
      return <SaltmarshResidencyForm defaultValues={DEMO} status="loading" />;
    case "success":
      return <SaltmarshResidencyForm defaultValues={DEMO} status="success" />;
    default:
      return <SaltmarshResidencyForm defaultValues={DEMO} onSubmit={send} />;
  }
}

export default function Preview({ state }: { state: DesignState }) {
  return (
    <PreviewCanvas align="start">
      <Form state={state} />
    </PreviewCanvas>
  );
}
