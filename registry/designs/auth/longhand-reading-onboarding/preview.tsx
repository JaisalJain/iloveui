import type { DesignState } from "@/registry/definitions";
import { PreviewCanvas } from "@/registry/preview-kit";
import LonghandReadingOnboarding, { type LonghandAnswers } from "./component";

const ANSWERS: LonghandAnswers = {
  topics: ["essays", "science", "cities"],
  time: "evening",
  length: "15",
  challenge: "stretch",
};
const EMAIL = "nadia.farouk@fastmail.com";

// The live preview saves after a believable round trip so the loading state and the saved issue can be seen.
function save() {
  return new Promise<void>((resolve) => setTimeout(resolve, 1400));
}

function Flow({ state }: { state: DesignState }) {
  switch (state) {
    case "empty":
      return <LonghandReadingOnboarding onSave={save} />;
    case "loading":
      return (
        <LonghandReadingOnboarding defaultStep={4} defaultAnswers={ANSWERS} defaultEmail={EMAIL} status="loading" />
      );
    case "error":
      return (
        <LonghandReadingOnboarding
          defaultStep={4}
          defaultAnswers={ANSWERS}
          defaultEmail={EMAIL}
          status="error"
          onSave={save}
        />
      );
    case "success":
      return <LonghandReadingOnboarding defaultAnswers={ANSWERS} defaultEmail={EMAIL} status="success" />;
    default:
      return (
        <LonghandReadingOnboarding
          defaultStep={1}
          defaultAnswers={{ topics: ANSWERS.topics, time: "evening" }}
          onSave={save}
        />
      );
  }
}

export default function Preview({ state }: { state: DesignState }) {
  return (
    <PreviewCanvas width="xl">
      <Flow key={state} state={state} />
    </PreviewCanvas>
  );
}
