"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { AnimatePresence, MotionConfig, animate, motion, useMotionValue, useReducedMotion } from "motion/react";
import { ArrowRight, CircleAlert, RotateCcw } from "lucide-react";

export type InvoiceSubmitStatus = "idle" | "loading" | "error" | "success";

export type InvoiceDraft = { email: string; amount: string; memo: string };

export type InvoiceSubmitLabels = {
  idle: string;
  loading: string;
  /** Shown on the button after a successful send. */
  success: string;
  error: string;
};

export type InvoiceMorphSubmitProps = {
  brand?: string;
  invoiceNumber?: string;
  clientName?: string;
  dueLabel?: string;
  currencySymbol?: string;
  defaultValues?: Partial<InvoiceDraft>;
  labels?: Partial<InvoiceSubmitLabels>;
  /** Shown under the button on error. */
  errorMessage?: string;
  /** Shown under the button on success. */
  successMessage?: string;
  /** The loading bar eases toward 90% over this long, then completes when the send resolves. */
  expectedDurationMs?: number;
  /** Keep the loading state at least this long so fast responses do not flash. */
  minLoadingMs?: number;
  /** Return to idle this long after success; 0 keeps the success state. */
  resetAfterMs?: number;
  /** Controlled status. Leave unset to let the component run `onSubmit`. */
  status?: InvoiceSubmitStatus;
  disabled?: boolean;
  disabledReason?: string;
  /** Renders the pressed look on demand, for previews and docs. */
  forceState?: "active";
  onChange?: (draft: InvoiceDraft) => void;
  /** Send the invoice. Resolve for success, reject for error. */
  onSubmit?: (draft: InvoiceDraft) => void | Promise<void>;
  /** Called once the success state shows. */
  onComplete?: (draft: InvoiceDraft) => void;
  className?: string;
};

const DEFAULT_LABELS: InvoiceSubmitLabels = {
  idle: "Send invoice",
  loading: "Sending",
  success: "Sent",
  error: "Try again",
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ease = [0.2, 0.8, 0.2, 1] as const;

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function wait(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

const fieldClass =
  "h-11 w-full rounded-[min(var(--iu-radius),6px)] border border-(--iu-foreground)/35 bg-(--iu-surface) px-3 text-[15px] text-(--iu-foreground) placeholder:text-(--iu-muted) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--iu-accent) disabled:cursor-not-allowed disabled:bg-(--iu-background) aria-invalid:border-red-700 dark:aria-invalid:border-red-400";
const labelClass = "flex items-baseline gap-2 text-[11px] font-medium tracking-[0.08em] text-(--iu-muted) uppercase";

export function InvoiceMorphSubmit({
  brand = "Quillmark",
  invoiceNumber = "INV-2026-0418",
  clientName = "Marlowe & Daughters",
  dueLabel = "Due 14 Nov 2026",
  currencySymbol = "€",
  defaultValues,
  labels: labelOverrides,
  errorMessage = "The mail server did not answer. Your invoice is saved as a draft.",
  successMessage = "Delivered. You will see it in Sent once Marlowe & Daughters opens it.",
  expectedDurationMs = 1600,
  minLoadingMs = 600,
  resetAfterMs = 0,
  status: controlledStatus,
  disabled = false,
  disabledReason = "Add a recipient email to send this invoice.",
  forceState,
  onChange,
  onSubmit,
  onComplete,
  className = "",
}: InvoiceMorphSubmitProps) {
  const labels = { ...DEFAULT_LABELS, ...labelOverrides };
  const reduceMotion = useReducedMotion();
  const [draft, setDraft] = useState<InvoiceDraft>({
    email: defaultValues?.email ?? "accounts@marlowe-daughters.co.uk",
    amount: defaultValues?.amount ?? "4,860.00",
    memo: defaultValues?.memo ?? "Brand refresh, phase 2: packaging system and launch assets",
  });
  const [emailError, setEmailError] = useState("");
  const [internalStatus, setInternalStatus] = useState<InvoiceSubmitStatus>("idle");
  const status = controlledStatus ?? internalStatus;
  const busy = status === "loading";

  const progress = useMotionValue(status === "success" ? 1 : status === "loading" ? 0.42 : 0);
  const emailRef = useRef<HTMLInputElement>(null);
  const titleId = useId();
  const emailId = useId();
  const amountId = useId();
  const memoId = useId();
  const emailErrorId = useId();
  const messageId = useId();

  // The hairline inside the button: eases toward 90% while sending, completes on success, empties otherwise.
  useEffect(() => {
    if (forceState) return;
    const target = status === "loading" ? 0.9 : status === "success" ? 1 : 0;
    const instant = reduceMotion || status === "idle" || status === "error";
    const controls = animate(progress, target, {
      duration: instant ? 0 : status === "loading" ? expectedDurationMs / 1000 : 0.2,
      ease: status === "loading" ? [0.1, 0.6, 0.3, 1] : ease,
    });
    return () => controls.stop();
  }, [expectedDurationMs, forceState, progress, reduceMotion, status]);

  useEffect(() => {
    if (status !== "success" || !resetAfterMs || controlledStatus) return;
    const timer = setTimeout(() => setInternalStatus("idle"), resetAfterMs);
    return () => clearTimeout(timer);
  }, [controlledStatus, resetAfterMs, status]);

  function update(field: keyof InvoiceDraft, value: string) {
    const next = { ...draft, [field]: value };
    setDraft(next);
    if (field === "email" && emailError && EMAIL.test(value)) setEmailError("");
    if (status === "error" || status === "success") setInternalStatus("idle");
    onChange?.(next);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || disabled) return;
    if (!EMAIL.test(draft.email)) {
      setEmailError("Enter an email address like name@company.com.");
      emailRef.current?.focus();
      return;
    }
    setInternalStatus("loading");
    try {
      await Promise.all([onSubmit?.(draft), wait(minLoadingMs)]);
      setInternalStatus("success");
      if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(10);
      onComplete?.(draft);
    } catch {
      setInternalStatus("error");
    }
  }

  const buttonText =
    status === "loading"
      ? labels.loading
      : status === "success"
        ? labels.success
        : status === "error"
          ? labels.error
          : labels.idle;
  const announcement =
    status === "loading"
      ? `${labels.loading} invoice ${invoiceNumber}.`
      : status === "success"
        ? `${labels.success}. ${successMessage}`
        : status === "error"
          ? errorMessage
          : "";

  const fade = reduceMotion ? { duration: 0.12 } : { type: "spring" as const, stiffness: 400, damping: 40 };

  return (
    <MotionConfig reducedMotion="user" transition={fade}>
      <form
        aria-labelledby={titleId}
        noValidate
        onSubmit={handleSubmit}
        data-status={status}
        className={cx(
          "w-full border-t border-(--iu-foreground) bg-(--iu-surface) font-(family-name:--iu-font) text-(--iu-foreground)",
          className,
        )}
      >
        <div className="flex items-baseline justify-between gap-4 border-b border-(--iu-border) py-3 text-[11px] font-medium tracking-[0.08em] text-(--iu-muted) uppercase">
          <span>{brand}</span>
          <span className="tabular-nums">{dueLabel}</span>
        </div>

        <div className="px-[calc(20px*var(--iu-density))] pt-[calc(24px*var(--iu-density))] pb-[calc(24px*var(--iu-density))] sm:px-[calc(32px*var(--iu-density))]">
          <h2 id={titleId} className="text-[11px] font-medium tracking-[0.08em] text-(--iu-muted) uppercase">
            Invoice <span className="font-mono tracking-normal normal-case tabular-nums">{invoiceNumber}</span>
          </h2>
          <p className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-[44px] leading-none font-semibold tracking-[-0.035em] tabular-nums sm:text-[56px]">
              {currencySymbol}
              {draft.amount || "0.00"}
            </span>
            <span className="text-sm text-(--iu-muted)">to {clientName}</span>
          </p>

          <div className="mt-8 grid gap-x-6 gap-y-5 border-t border-(--iu-border) pt-6 sm:grid-cols-12">
            <div className="sm:col-span-7">
              <label htmlFor={emailId} className={labelClass}>
                <span className="font-mono tabular-nums">01</span> Bill to
              </label>
              <input
                ref={emailRef}
                id={emailId}
                type="email"
                autoComplete="email"
                value={draft.email}
                disabled={disabled || busy}
                aria-invalid={emailError ? true : undefined}
                aria-describedby={emailError ? emailErrorId : undefined}
                onChange={(event) => update("email", event.target.value)}
                className={cx(fieldClass, "mt-2")}
              />
              {emailError ? (
                <p id={emailErrorId} className="mt-2 flex items-center gap-1.5 text-sm text-red-700 dark:text-red-300">
                  <CircleAlert size={16} strokeWidth={1.5} aria-hidden="true" />
                  {emailError}
                </p>
              ) : null}
            </div>
            <div className="sm:col-span-5">
              <label htmlFor={amountId} className={labelClass}>
                <span className="font-mono tabular-nums">02</span> Amount
              </label>
              <div className="relative mt-2">
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[15px] text-(--iu-muted)"
                >
                  {currencySymbol}
                </span>
                <input
                  id={amountId}
                  inputMode="decimal"
                  value={draft.amount}
                  disabled={disabled || busy}
                  onChange={(event) => update("amount", event.target.value)}
                  className={cx(fieldClass, "pl-7 text-right font-mono tabular-nums")}
                />
              </div>
            </div>
            <div className="sm:col-span-12">
              <label htmlFor={memoId} className={labelClass}>
                <span className="font-mono tabular-nums">03</span> Memo
              </label>
              <input
                id={memoId}
                value={draft.memo}
                disabled={disabled || busy}
                onChange={(event) => update("memo", event.target.value)}
                className={cx(fieldClass, "mt-2")}
              />
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-(--iu-muted)">Net 30 · Paid by bank transfer or card</p>

            {/* The button keeps its footprint: every label sits in one grid cell, only the current one shows. */}
            <motion.button
              type="submit"
              disabled={disabled}
              aria-disabled={busy || undefined}
              aria-describedby={status === "error" || status === "success" || disabled ? messageId : undefined}
              data-force-state={forceState}
              whileTap={busy || disabled ? undefined : { scale: 0.98 }}
              className={cx(
                "relative inline-flex h-12 shrink-0 items-center justify-center overflow-hidden rounded-[min(var(--iu-radius),6px)] px-5 text-[15px] font-medium transition-colors duration-150 motion-reduce:transition-none",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--iu-accent)",
                disabled
                  ? "cursor-not-allowed border border-(--iu-foreground)/35 bg-(--iu-background) text-(--iu-muted) dark:bg-(--iu-surface)"
                  : status === "error"
                    ? "border border-(--iu-foreground) bg-(--iu-surface) text-(--iu-foreground) pointer-fine:hover:bg-(--iu-foreground)/5"
                    : "border border-transparent bg-(--iu-foreground) text-(--iu-background) data-[force-state=active]:bg-[color-mix(in_oklab,var(--iu-foreground)_80%,var(--iu-background))] pointer-fine:hover:bg-[color-mix(in_oklab,var(--iu-foreground)_86%,var(--iu-background))]",
                forceState === "active" && "scale-[0.98]",
                busy && "cursor-progress",
              )}
            >
              <span className="grid items-center">
                {[labels.idle, labels.loading, labels.success, labels.error].map((text) => (
                  <span
                    key={text}
                    aria-hidden="true"
                    className="invisible col-start-1 row-start-1 flex items-center gap-2 pr-7 whitespace-nowrap"
                  >
                    {text}
                  </span>
                ))}
                <AnimatePresence initial={false} mode="popLayout">
                  <motion.span
                    key={status}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="col-start-1 row-start-1 flex items-center justify-between gap-2 whitespace-nowrap"
                  >
                    <span>{buttonText}</span>
                    <span aria-hidden="true" className="flex h-4 w-5 items-center justify-end">
                      {status === "loading" ? (
                        <span className="font-mono text-[11px] tabular-nums">
                          <LoadingCount />
                        </span>
                      ) : status === "success" ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <motion.path
                            d="M20 6 9 17l-5-5"
                            stroke="currentColor"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            initial={{ pathLength: reduceMotion ? 1 : 0 }}
                            animate={{ pathLength: 1 }}
                            transition={reduceMotion ? { duration: 0 } : { duration: 0.24, ease, delay: 0.05 }}
                          />
                        </svg>
                      ) : status === "error" ? (
                        <RotateCcw size={16} strokeWidth={1.5} />
                      ) : (
                        <ArrowRight size={16} strokeWidth={1.5} />
                      )}
                    </span>
                  </motion.span>
                </AnimatePresence>
              </span>
              <span className="sr-only">{status === "idle" ? ` invoice ${invoiceNumber}` : ""}</span>
              {/* Progress hairline along the button's bottom edge. */}
              <motion.span
                aria-hidden="true"
                style={{ scaleX: progress }}
                className={cx(
                  "absolute inset-x-0 bottom-0 h-0.5 origin-left bg-(--iu-accent)",
                  (status === "idle" || status === "error" || disabled) && "hidden",
                )}
              />
            </motion.button>
          </div>

          <div className="mt-4 min-h-6 text-sm">
            <AnimatePresence initial={false} mode="popLayout">
              {status === "error" ? (
                <motion.p
                  key="error"
                  id={messageId}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-start gap-1.5 text-red-700 sm:justify-end dark:text-red-300"
                >
                  <CircleAlert size={16} strokeWidth={1.5} aria-hidden="true" className="mt-0.5 shrink-0" />
                  <span>{errorMessage}</span>
                </motion.p>
              ) : status === "success" ? (
                <motion.p
                  key="success"
                  id={messageId}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-(--iu-muted) sm:text-right"
                >
                  {successMessage}
                </motion.p>
              ) : disabled ? (
                <motion.p
                  key="disabled"
                  id={messageId}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-(--iu-muted) sm:text-right"
                >
                  {disabledReason}
                </motion.p>
              ) : null}
            </AnimatePresence>
          </div>

          <div aria-live="polite" className="sr-only">
            {announcement}
          </div>
        </div>
      </form>
    </MotionConfig>
  );
}

/** Three dots that step in one at a time: an honest "still working" indicator that stops under reduced motion. */
function LoadingCount() {
  const reduceMotion = useReducedMotion();
  const [step, setStep] = useState(3);
  useEffect(() => {
    if (reduceMotion) return;
    const timer = setInterval(() => setStep((value) => (value % 3) + 1), 320);
    return () => clearInterval(timer);
  }, [reduceMotion]);
  return <>{"•••".slice(0, step).padEnd(3, " ")}</>;
}

export default InvoiceMorphSubmit;
