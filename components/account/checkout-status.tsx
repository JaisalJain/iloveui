"use client";

import { CircleCheck, Clock } from "lucide-react";
import { useRefreshUntil } from "./use-refresh-until";

/**
 * After the hosted checkout returns to /account?checkout=success. The return URL proves nothing (spec section 11):
 * access comes only from the webhook, so this keeps re-rendering the page until the license is there.
 */
export function CheckoutStatus({ pro }: { pro: boolean }) {
  const timedOut = useRefreshUntil({ active: true, done: pro, timeoutMs: 30_000 });

  const tone = pro ? "border-accent/40" : "border-hairline";
  return (
    <div
      role="status"
      className={`mt-10 flex gap-3 rounded-card border bg-surface px-5 py-4 shadow-sm ${tone}`}
      data-checkout-status={pro ? "active" : timedOut ? "slow" : "pending"}
    >
      {pro ? (
        <CircleCheck size={16} strokeWidth={1.5} aria-hidden className="mt-1 shrink-0 text-accent" />
      ) : (
        <Clock size={16} strokeWidth={1.5} aria-hidden className="mt-1 shrink-0 text-muted" />
      )}
      <div className="min-w-0 text-14">
        <p className="font-semibold text-fg">
          {pro ? "Pro is active." : timedOut ? "Payment received. Confirmation is taking longer." : "Payment received."}
        </p>
        <p className="mt-1 text-pretty text-muted">
          {pro ? (
            "Every design is unlocked. Create a CLI token below to install Pro designs with the shadcn CLI."
          ) : timedOut ? (
            <>
              Confirmation can take a minute. Reload this page shortly; Pro unlocks as soon as the payment provider
              confirms the payment.
            </>
          ) : (
            "Confirming your license with the payment provider. This page updates by itself."
          )}
        </p>
      </div>
    </div>
  );
}
