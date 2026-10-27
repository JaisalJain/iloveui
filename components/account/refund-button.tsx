"use client";

import { useState } from "react";
import { buttonClasses } from "@/components/ui/button-classes";
import { site } from "@/lib/site";
import { callApi } from "./api";
import { ConfirmDialog } from "./confirm-dialog";
import { useRefreshUntil } from "./use-refresh-until";

type Phase = "idle" | "requesting" | "waiting" | "error";

/**
 * Self-serve refund within the window. POST /api/refund only asks the payment provider (202); access ends when the
 * provider's refund event reaches fulfilment, so after the request the page keeps re-rendering until the license
 * shows as refunded, and says plainly when that takes longer.
 */
export function RefundButton({
  licenseId,
  amount,
  deadline,
  team,
}: {
  licenseId: string;
  amount: string;
  deadline: string;
  team: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState("");
  const slow = useRefreshUntil({ active: phase === "waiting", done: false, timeoutMs: 60_000 });

  async function refund() {
    setPhase("requesting");
    setError("");
    const result = await callApi<{ refundId: string; status: string }>("/api/refund", {
      method: "POST",
      body: JSON.stringify({ licenseId }),
    });
    if (result.ok) {
      setPhase("waiting");
    } else {
      setPhase("error");
      setError(result.message);
    }
  }

  const busy = phase === "requesting" || phase === "waiting";
  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={busy}
        aria-busy={busy}
        className={buttonClasses({ variant: "outline", size: "sm", className: "min-w-36" })}
      >
        {phase === "requesting" ? "Requesting refund" : phase === "waiting" ? "Refund requested" : "Request a refund"}
      </button>
      <p role="status" className="max-w-md text-14 text-pretty empty:hidden">
        {phase === "waiting" ? (
          <span className="text-muted">
            {slow
              ? `The refund is on its way. Pro access ends when the payment provider confirms it, which can take a few minutes. Questions go to ${site.supportEmail}.`
              : "Waiting for the payment provider to confirm the refund."}
          </span>
        ) : phase === "error" ? (
          <span className="text-danger">{error}</span>
        ) : null}
      </p>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Refund this purchase?"
        description={`You get ${amount} back. Pro access ends for you${team ? " and everyone on your Team" : ""} as soon as the refund is confirmed.`}
        confirmLabel="Refund and end access"
        destructive
        onConfirm={refund}
      >
        Your CLI token stops working too. Refunds are open until {deadline}.
      </ConfirmDialog>
    </div>
  );
}
