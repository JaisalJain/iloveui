"use client";

import { useState } from "react";
import type { DesignState } from "@/registry/definitions";
import AldermoorWealthDashboard from "./component";

// A full-page app shell: rendered edge to edge, without a preview canvas.
export default function Preview({ state }: { state: DesignState }) {
  if (state === "loading") return <AldermoorWealthDashboard status="loading" />;
  if (state === "empty") return <NewClientDemo />;
  return <AldermoorWealthDashboard />;
}

// A new client with no custodians linked; linking one loads briefly, then a year of history arrives.
function NewClientDemo() {
  const [status, setStatus] = useState<"empty" | "loading" | "ready">("empty");
  return (
    <AldermoorWealthDashboard
      status={status}
      client="Adeyemi Foundation"
      breadcrumbs={["Clients", "Adeyemi Foundation", "Overview"]}
      onLinkAccount={() => {
        setStatus("loading");
        window.setTimeout(() => setStatus("ready"), 900);
      }}
    />
  );
}
