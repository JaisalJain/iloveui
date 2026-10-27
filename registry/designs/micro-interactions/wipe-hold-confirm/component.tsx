"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import {
  MotionConfig,
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useTransform,
  type AnimationPlaybackControls,
} from "motion/react";
import { Check, LoaderCircle, Lock, RotateCcw, TriangleAlert } from "lucide-react";

export type WipeHoldStatus = "idle" | "loading" | "error" | "success";

export type WipeDevice = {
  name: string;
  model: string;
  serial: string;
  os: string;
  lastSeen: string;
  location: string;
};

export type WipeHoldLabels = {
  idle: string;
  holding: string;
  retry: string;
  loading: string;
  success: string;
};

export type WipeHoldConfirmProps = {
  brand?: string;
  device?: WipeDevice;
  consequences?: string[];
  labels?: Partial<WipeHoldLabels>;
  /** How long the control must be held, in milliseconds. */
  holdDurationMs?: number;
  /** Spring used when an unfinished hold drains back to empty. */
  spring?: { stiffness: number; damping: number };
  errorMessage?: string;
  successMessage?: string;
  /** Controlled status. Leave unset to let the component run `onComplete`. */
  status?: WipeHoldStatus;
  disabled?: boolean;
  disabledReason?: string;
  /** Renders the mid-hold look on demand, for previews and docs. */
  forceState?: "active";
  /** Called with progress from 0 to 1 while the hold fills and drains. */
  onChange?: (progress: number) => void;
  /** Called when a hold completes. Return a promise to show loading, then success or error. */
  onComplete?: () => void | Promise<void>;
  /** Called when a hold is released early. */
  onCancel?: () => void;
  className?: string;
};

const DEFAULT_DEVICE: WipeDevice = {
  name: "Kofi Mensah's MacBook Pro",
  model: "MacBook Pro 14-inch, 2025",
  serial: "C02FK3ZQMD6T",
  os: "macOS 15.4",
  lastSeen: "3 min ago",
  location: "Lisbon HQ",
};

const DEFAULT_CONSEQUENCES = [
  "Erases every file, account and setting on the disk.",
  "Removes the device from Bolthouse and revokes its certificates.",
  "Locks it to the activation PIN until it is set up again.",
];

const DEFAULT_LABELS: WipeHoldLabels = {
  idle: "Hold to wipe",
  holding: "Keep holding",
  retry: "Hold to retry",
  loading: "Sending wipe",
  success: "Wipe queued",
};

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function WipeHoldConfirm({
  brand = "Bolthouse",
  device = DEFAULT_DEVICE,
  consequences = DEFAULT_CONSEQUENCES,
  labels: labelOverrides,
  holdDurationMs = 1600,
  spring = { stiffness: 700, damping: 45 },
  errorMessage = "The laptop did not answer. Nothing was erased. Hold again to retry.",
  successMessage = "The wipe runs the moment the laptop next checks in, usually within a minute.",
  status: controlledStatus,
  disabled = false,
  disabledReason = "Only workspace admins can wipe devices. Ask Ines Duarte for access.",
  forceState,
  onChange,
  onComplete,
  onCancel,
  className = "",
}: WipeHoldConfirmProps) {
  const labels = { ...DEFAULT_LABELS, ...labelOverrides };
  const reduceMotion = useReducedMotion();
  const [internalStatus, setInternalStatus] = useState<WipeHoldStatus>("idle");
  const status = controlledStatus ?? internalStatus;
  const settled = status === "loading" || status === "success";
  const locked = disabled || settled;

  const progress = useMotionValue(settled ? 1 : forceState === "active" ? 0.55 : 0);
  const [holding, setHolding] = useState(false);
  const [remaining, setRemaining] = useState(holdDurationMs);
  const controls = useRef<AnimationPlaybackControls | null>(null);
  const gesture = useRef(false);
  const holdingRef = useRef(false);
  const pressed = holding || forceState === "active";

  const titleId = useId();
  const hintId = useId();
  const messageId = useId();

  // Two opposite translations reveal the filled label without scaling or clipping it.
  const fillX = useTransform(progress, (value) => `${(value - 1) * 100}%`);
  const fillLabelX = useTransform(progress, (value) => `${(1 - value) * 100}%`);

  useMotionValueEvent(progress, "change", (value) => {
    const clamped = Math.min(1, Math.max(0, value));
    setRemaining(Math.round(((1 - clamped) * holdDurationMs) / 100) * 100);
    onChange?.(clamped);
  });

  useEffect(() => {
    if (settled) progress.set(1);
    else if (forceState === "active") progress.set(0.55);
    else if (status === "error") progress.set(0);
  }, [forceState, progress, settled, status]);

  function finish() {
    holdingRef.current = false;
    setHolding(false);
    const result = onComplete?.();
    if (result && typeof (result as Promise<void>).then === "function") {
      setInternalStatus("loading");
      (result as Promise<void>).then(
        () => {
          setInternalStatus("success");
          if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate([12, 40, 12]);
        },
        () => setInternalStatus("error"),
      );
    } else {
      setInternalStatus("success");
    }
  }

  function startHold() {
    if (locked || holdingRef.current) return;
    controls.current?.stop();
    holdingRef.current = true;
    setHolding(true);
    // Resume from wherever the fill is, so grabbing a draining hold carries on from there.
    const from = progress.get();
    controls.current = animate(progress, 1, {
      duration: ((1 - from) * holdDurationMs) / 1000,
      ease: "linear",
      onComplete: finish,
    });
  }

  function releaseHold() {
    if (!holdingRef.current) return;
    holdingRef.current = false;
    setHolding(false);
    if (progress.get() >= 1) return;
    const velocity = progress.getVelocity();
    controls.current?.stop();
    onCancel?.();
    if (reduceMotion) {
      progress.set(0);
      return;
    }
    // Drain with a stiff spring that starts from the fill's current speed.
    controls.current = animate(progress, 0, {
      type: "spring",
      stiffness: spring.stiffness,
      damping: spring.damping,
      velocity: -Math.abs(velocity),
    });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "Escape") {
      releaseHold();
      return;
    }
    if (event.key !== " " && event.key !== "Enter") return;
    event.preventDefault();
    gesture.current = true;
    if (!event.repeat) startHold();
  }

  function handleKeyUp(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== " " && event.key !== "Enter") return;
    event.preventDefault();
    releaseHold();
  }

  // Assistive tech that sends a single click (no key or pointer hold) runs the full hold; Escape cancels it.
  function handleClick() {
    if (gesture.current) {
      gesture.current = false;
      return;
    }
    if (locked || holdingRef.current) return;
    startHold();
  }

  const label = settled
    ? status === "success"
      ? labels.success
      : labels.loading
    : pressed
      ? labels.holding
      : status === "error"
        ? labels.retry
        : labels.idle;
  const seconds = (remaining / 1000).toFixed(1);
  const announcement =
    status === "loading"
      ? `${labels.loading} to ${device.name}.`
      : status === "success"
        ? `${labels.success}. ${successMessage}`
        : status === "error"
          ? errorMessage
          : holding
            ? `Holding. Release or press Escape to cancel.`
            : "";

  const icon =
    status === "loading" ? (
      <LoaderCircle size={20} strokeWidth={2} aria-hidden="true" className="animate-spin motion-reduce:animate-none" />
    ) : status === "success" ? (
      <Check size={20} strokeWidth={2.5} aria-hidden="true" />
    ) : status === "error" && !pressed ? (
      <RotateCcw size={20} strokeWidth={2} aria-hidden="true" />
    ) : disabled ? (
      <Lock size={20} strokeWidth={2} aria-hidden="true" />
    ) : null;

  return (
    <MotionConfig reducedMotion="user" transition={reduceMotion ? { duration: 0 } : { duration: 0.1, ease: "linear" }}>
      <section
        aria-labelledby={titleId}
        data-status={status}
        className={cx(
          "relative w-full rounded-[min(var(--iu-radius),4px)] border-2 border-(--iu-foreground) bg-(--iu-surface) font-(family-name:--iu-font) text-(--iu-foreground) shadow-[6px_6px_0_var(--iu-foreground)]",
          className,
        )}
      >
        <div className="flex items-center justify-between gap-3 border-b-2 border-(--iu-foreground) px-[calc(16px*var(--iu-density))] py-2.5 font-mono text-xs font-bold tracking-[0.08em] uppercase">
          <span>{brand} / Devices</span>
          <span className="-rotate-2 border-2 border-(--iu-foreground) bg-(--iu-accent) px-2 py-0.5 text-(--iu-accent-foreground)">
            Danger zone
          </span>
        </div>

        <div className="p-[calc(20px*var(--iu-density))] sm:p-[calc(28px*var(--iu-density))]">
          <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
            <div className="min-w-0">
              <p className="font-mono text-xs font-bold tracking-[0.08em] text-(--iu-muted) uppercase">
                {device.model}
              </p>
              <h2
                id={titleId}
                className="mt-2 text-[28px] leading-[1.05] font-extrabold tracking-[-0.03em] text-balance sm:text-[36px]"
              >
                Wipe {device.name}
              </h2>
            </div>
            <span
              className={cx(
                "inline-flex shrink-0 items-center gap-2 border-2 border-(--iu-foreground) px-2 py-1 font-mono text-xs font-bold uppercase",
                status === "success" ? "rotate-2 bg-(--iu-foreground) text-(--iu-background)" : "bg-(--iu-surface)",
              )}
            >
              <span
                aria-hidden="true"
                className={cx(
                  "size-2",
                  status === "success" ? "bg-(--iu-accent)" : "bg-emerald-600 dark:bg-emerald-400",
                )}
              />
              {status === "success" ? "Erase pending" : "Online"}
            </span>
          </div>

          <dl className="mt-6 grid grid-cols-2 border-2 border-(--iu-foreground) font-mono text-xs sm:grid-cols-4">
            {[
              ["Serial", device.serial],
              ["System", device.os],
              ["Last seen", device.lastSeen],
              ["Location", device.location],
            ].map(([term, value], index) => (
              <div
                key={term}
                className={cx(
                  "min-w-0 p-[calc(12px*var(--iu-density))]",
                  index % 2 === 1 && "border-l-2 border-(--iu-foreground)",
                  index > 1 && "border-t-2 border-(--iu-foreground) sm:border-t-0",
                  index === 2 && "sm:border-l-2",
                )}
              >
                <dt className="font-bold tracking-[0.08em] text-(--iu-muted) uppercase">{term}</dt>
                <dd className="mt-1 truncate text-[13px] font-medium text-(--iu-foreground) tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>

          <ul className="mt-6 space-y-2 text-[15px] leading-snug">
            {consequences.map((item) => (
              <li key={item} className="flex gap-3">
                <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 bg-(--iu-foreground)" />
                <span className="text-pretty">{item}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 flex items-center gap-2 text-sm font-bold text-red-700 dark:text-red-300">
            <TriangleAlert size={16} strokeWidth={2} aria-hidden="true" />
            This cannot be undone.
          </p>

          <button
            type="button"
            aria-describedby={`${hintId} ${messageId}`}
            aria-disabled={locked || undefined}
            data-force-state={forceState}
            onPointerDown={(event) => {
              if (event.button !== 0) return;
              gesture.current = true;
              event.currentTarget.setPointerCapture(event.pointerId);
              startHold();
            }}
            onPointerUp={releaseHold}
            onPointerCancel={releaseHold}
            onLostPointerCapture={releaseHold}
            onKeyDown={handleKeyDown}
            onKeyUp={handleKeyUp}
            onBlur={releaseHold}
            onClick={handleClick}
            onContextMenu={(event) => event.preventDefault()}
            className={cx(
              "relative mt-7 block h-16 w-full touch-none overflow-hidden rounded-[min(var(--iu-radius),4px)] border-2 border-(--iu-foreground) bg-(--iu-surface) text-lg font-extrabold tracking-[0.04em] uppercase select-none [-webkit-touch-callout:none]",
              "transition-[translate,box-shadow] duration-100 ease-linear motion-reduce:transition-none",
              "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--iu-accent)",
              pressed || settled
                ? "translate-x-1 translate-y-1 shadow-[0_0_0_var(--iu-foreground)]"
                : "shadow-[4px_4px_0_var(--iu-foreground)]",
              disabled
                ? "cursor-not-allowed border-dashed text-(--iu-muted) shadow-none"
                : settled
                  ? "cursor-default"
                  : "cursor-pointer",
            )}
          >
            <span className="absolute inset-0 flex items-center justify-center gap-3 px-4">
              {icon}
              <span>{label}</span>
            </span>
            {/* The fill: a block of accent that slides in from the left, carrying its own copy of the label. */}
            <motion.span
              aria-hidden="true"
              style={{ x: fillX }}
              className={cx("absolute inset-0 overflow-hidden bg-(--iu-accent)", disabled && "hidden")}
            >
              <motion.span
                style={{ x: fillLabelX }}
                className="absolute inset-0 flex items-center justify-center gap-3 px-4 text-(--iu-accent-foreground)"
              >
                {icon}
                <span>{label}</span>
              </motion.span>
            </motion.span>
          </button>

          <div className="mt-3 flex items-center justify-between gap-4 font-mono text-xs font-bold tracking-[0.08em] text-(--iu-muted) uppercase">
            <span id={hintId}>
              {disabled ? "Locked" : settled ? "Confirmed" : `Press and hold, or hold Space or Enter`}
            </span>
            <span aria-hidden="true" className="shrink-0 text-(--iu-foreground) normal-case tabular-nums">
              {settled ? "0.0s" : `${seconds}s`}
            </span>
          </div>

          <p
            id={messageId}
            className={cx(
              "mt-5 min-h-12 border-t-2 border-(--iu-foreground) pt-4 text-sm text-pretty",
              status === "error" ? "font-semibold text-red-700 dark:text-red-300" : "text-(--iu-muted)",
            )}
          >
            {status === "error"
              ? errorMessage
              : status === "success"
                ? successMessage
                : status === "loading"
                  ? "Waiting for the laptop to acknowledge the command."
                  : disabled
                    ? disabledReason
                    : "Releasing early cancels. Nothing happens until the bar is full."}
          </p>

          <div aria-live="polite" className="sr-only">
            {announcement}
          </div>
        </div>
      </section>
    </MotionConfig>
  );
}

export default WipeHoldConfirm;
