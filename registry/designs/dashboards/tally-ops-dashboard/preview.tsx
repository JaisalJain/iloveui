"use client";

import { useState } from "react";
import type { DesignState } from "@/registry/definitions";
import TallyOpsDashboard from "./component";

// A full-page app shell: rendered edge to edge, without a preview canvas.
export default function Preview({ state }: { state: DesignState }) {
  if (state === "loading") return <TallyOpsDashboard status="loading" />;
  if (state === "empty") return <EmptyRangeDemo />;
  return <TallyOpsDashboard />;
}

// Nothing was captured in the last 7 days; the empty state's action widens the range and the data draws in.
function EmptyRangeDemo() {
  const [range, setRange] = useState("7d");
  return <TallyOpsDashboard range={range} onRangeChange={setRange} status={range === "7d" ? "empty" : "ready"} />;
}
