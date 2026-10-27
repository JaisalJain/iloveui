"use client";

import { Check, CircleAlert, CreditCard, LoaderCircle, Lock } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { buttonClasses } from "@/components/ui/button-classes";
import { completeLocalCheckout } from "./actions";

type State = { kind: "idle" } | { kind: "success"; returnUrl: string } | { kind: "declined" } | { kind: "error" };

const TEST_CARD = [
  ["Card number", "4242 4242 4242 4242"],
  ["Expiry", "12 / 34"],
  ["CVC", "123"],
] as const;

export function LocalCheckoutForm({
  token,
  email,
  amount,
  cancelUrl,
  reference,
}: {
  token: string;
  email: string;
  amount: string;
  cancelUrl: string;
  reference: string;
}) {
  const [state, setState] = useState<State>({ kind: "idle" });
  const [pending, startTransition] = useTransition();
  const [action, setAction] = useState<"succeeded" | "failed" | null>(null);

  useEffect(() => {
    if (state.kind !== "success") return;
    // A short beat so the confirmation is readable, then on to the return URL like a hosted checkout.
    const timer = window.setTimeout(() => window.location.assign(state.returnUrl), 900);
    return () => window.clearTimeout(timer);
  }, [state]);

  function submit(outcome: "succeeded" | "failed") {
    setAction(outcome);
    startTransition(async () => {
      try {
        const result = await completeLocalCheckout(token, outcome);
        if (!result.ok) setState({ kind: "error" });
        else if (outcome === "failed") setState({ kind: "declined" });
        else setState({ kind: "success", returnUrl: result.returnUrl ?? "/account?checkout=success" });
      } catch {
        setState({ kind: "error" });
      }
    });
  }

  if (state.kind === "success") {
    return (
      <div role="status" className="mt-8 flex flex-col items-start">
        <span className="flex size-10 items-center justify-center rounded-full border border-accent text-accent">
          <Check size={20} strokeWidth={1.5} aria-hidden />
        </span>
        <p className="mt-4 text-20 font-semibold">Payment received</p>
        <p className="mt-2 text-14 text-pretty text-muted">
          The signed webhook reached fulfilment. Taking you to your account…
        </p>
        <a href={state.returnUrl} className={buttonClasses({ variant: "outline", className: "mt-6" })}>
          Continue to your account
        </a>
      </div>
    );
  }

  if (state.kind === "declined" || state.kind === "error") {
    const declined = state.kind === "declined";
    return (
      <div role="alert" className="mt-8 flex flex-col items-start">
        <span className="flex size-10 items-center justify-center rounded-full border border-hairline text-danger">
          <CircleAlert size={20} strokeWidth={1.5} aria-hidden />
        </span>
        <p className="mt-4 text-20 font-semibold">{declined ? "Payment declined" : "Something went wrong"}</p>
        <p className="mt-2 text-14 text-pretty text-muted">
          {declined
            ? "The test card was declined and a payment.failed webhook was sent. Nothing was charged and no license was created."
            : "The webhook could not be delivered, or this checkout link is no longer valid. Nothing was charged."}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button variant="primary" onClick={() => setState({ kind: "idle" })}>
            Try again
          </Button>
          <a href={cancelUrl} className={buttonClasses({ variant: "outline" })}>
            Back to pricing
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <dl className="grid gap-6 text-14">
        <div>
          <dt className="label-mono text-muted">Email</dt>
          <dd className="mt-2 rounded-control border border-hairline bg-canvas px-3 py-2.5 break-all">{email}</dd>
        </div>
        <div>
          <dt className="label-mono text-muted">Test card</dt>
          <dd className="mt-2 rounded-control border border-hairline bg-canvas">
            <div className="flex items-center gap-3 border-b border-hairline px-3 py-2.5">
              <CreditCard size={16} strokeWidth={1.5} aria-hidden className="text-muted" />
              <span className="font-mono tabular-nums">{TEST_CARD[0][1]}</span>
            </div>
            <div className="grid grid-cols-2 divide-x divide-hairline">
              {TEST_CARD.slice(1).map(([label, value]) => (
                <span key={label} className="px-3 py-2.5 font-mono tabular-nums">
                  <span className="sr-only">{label} </span>
                  {value}
                </span>
              ))}
            </div>
          </dd>
        </div>
      </dl>

      <div className="mt-8 grid gap-3">
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          disabled={pending}
          aria-busy={pending && action === "succeeded"}
          onClick={() => submit("succeeded")}
        >
          {pending && action === "succeeded" ? (
            <>
              <LoaderCircle
                size={16}
                strokeWidth={1.5}
                aria-hidden
                className="animate-spin motion-reduce:animate-none"
              />
              Processing payment
            </>
          ) : (
            <>
              <Lock size={16} strokeWidth={1.5} aria-hidden />
              Pay {amount}
            </>
          )}
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="w-full"
          disabled={pending}
          aria-busy={pending && action === "failed"}
          onClick={() => submit("failed")}
        >
          {pending && action === "failed" ? (
            <>
              <LoaderCircle
                size={16}
                strokeWidth={1.5}
                aria-hidden
                className="animate-spin motion-reduce:animate-none"
              />
              Declining
            </>
          ) : (
            "Fail payment"
          )}
        </Button>
      </div>
      <p aria-live="polite" className="sr-only">
        {pending ? (action === "succeeded" ? "Processing payment" : "Declining payment") : ""}
      </p>
      <p className="mt-6 font-mono text-12 break-all text-muted">Session {reference}</p>
    </div>
  );
}
