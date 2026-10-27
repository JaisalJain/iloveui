"use client";

import { useState } from "react";
import type { DesignState } from "@/registry/definitions";
import QuillbyCreatorDashboard from "./component";

// A full-page app shell: rendered edge to edge, without a preview canvas.
export default function Preview({ state }: { state: DesignState }) {
  if (state === "loading") return <QuillbyCreatorDashboard status="loading" />;
  if (state === "empty") return <FirstIssueDemo />;
  return <QuillbyCreatorDashboard />;
}

// A brand-new publication; writing the first issue jumps ahead to a month of data so the preview can be explored.
function FirstIssueDemo() {
  const [sent, setSent] = useState(false);
  return <QuillbyCreatorDashboard status={sent ? "ready" : "empty"} onWriteIssue={() => setSent(true)} />;
}
