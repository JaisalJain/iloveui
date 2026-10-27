import type { DesignState } from "@/registry/definitions";
import KettleCtaFooter from "./component";

// A full-width section: rendered edge to edge, without a preview canvas.
// The default preview subscribes for real: it resolves after 900ms so the loading and success states play.
export default function Preview({ state }: { state: DesignState }) {
  switch (state) {
    case "loading":
      return <KettleCtaFooter key={state} status="loading" defaultEmail="maya.osei@fernmail.com" />;
    case "error":
      return <KettleCtaFooter key={state} status="error" defaultEmail="maya.osei@fernmail.com" />;
    case "success":
      return <KettleCtaFooter key={state} status="success" />;
    default:
      return (
        <KettleCtaFooter
          key={state}
          onSubscribe={() => new Promise<void>((resolve) => window.setTimeout(resolve, 900))}
        />
      );
  }
}
