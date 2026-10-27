"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import {
  AnimatePresence,
  MotionConfig,
  animate,
  motion,
  useMotionTemplate,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useTransform,
  type PanInfo,
} from "motion/react";
import { ArrowRight, Check, ChevronsRight, CircleAlert, LoaderCircle, RotateCcw, TrainFront } from "lucide-react";

export type FareSlideStatus = "idle" | "loading" | "error" | "success";

export type FareLine = { label: string; amount: number };

export type FareStop = { station: string; time: string };

export type FareSlideLabels = {
  /** Track label before the gesture. The amount is appended. */
  idle: string;
  /** Track label after an error. */
  retry: string;
  loading: string;
  /** Track label once paid. The amount is appended. */
  success: string;
  /** Hint under the track. */
  hint: string;
};

export type FareSlideToPayProps = {
  operator?: string;
  service?: string;
  date?: string;
  duration?: string;
  from?: FareStop;
  to?: FareStop;
  seat?: string;
  passengers?: string;
  lines?: FareLine[];
  currency?: string;
  locale?: string;
  paymentMethod?: string;
  /** Shown under the track after a successful payment. */
  confirmation?: string;
  bookingReference?: string;
  /** Shown under the track when the payment fails. */
  errorMessage?: string;
  refundNote?: string;
  labels?: Partial<FareSlideLabels>;
  /** How far the thumb must travel, from 0 to 1, before a release pays. */
  threshold?: number;
  /** How far one arrow key press moves the thumb, from 0 to 1. */
  keyboardStep?: number;
  /** How much of the release velocity (in seconds of travel) counts toward the threshold. */
  velocityProjection?: number;
  spring?: { stiffness: number; damping: number };
  /** Cross-fade length used instead of springs when the user prefers reduced motion. */
  reducedMotionFadeMs?: number;
  /** Controlled status. Leave unset to let the component run the payment through `onComplete`. */
  status?: FareSlideStatus;
  disabled?: boolean;
  disabledLabel?: string;
  disabledReason?: string;
  /** Renders the mid-drag look on demand, for previews and docs. */
  forceState?: "active";
  /** Called with progress from 0 to 1 while the thumb moves. */
  onChange?: (progress: number) => void;
  /** Called when the gesture completes. Return a promise to show loading, then success or error. */
  onComplete?: () => void | Promise<void>;
  className?: string;
};

const DEFAULT_LINES: FareLine[] = [
  { label: "Standard fare, 1 adult", amount: 31.4 },
  { label: "Seat reservation", amount: 4.5 },
  { label: "Bike space", amount: 5 },
];

const DEFAULT_LABELS: FareSlideLabels = {
  idle: "Slide to pay",
  retry: "Slide to try again",
  loading: "Confirming with your bank",
  success: "Paid",
  hint: "Slide past the line, or focus the handle and press Enter.",
};

const THUMB = 56;
const PAD = 4;

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function FareSlideToPay({
  operator = "Brisa Rail",
  service = "Alfa 128",
  date = "Thu 12 Mar 2026",
  duration = "2h 49m",
  from = { station: "Lisboa Santa Apolónia", time: "08:39" },
  to = { station: "Porto Campanhã", time: "11:28" },
  seat = "Coach 4, seat 62, window",
  passengers = "1 adult",
  lines = DEFAULT_LINES,
  currency = "EUR",
  locale = "en-IE",
  paymentMethod = "Visa ending 4417",
  confirmation = "Ticket sent to ines.duarte@quinta.pt",
  bookingReference = "BR7-K4Q2",
  errorMessage = "Your bank declined the payment. Nothing was charged.",
  refundNote = "Prices include 6% VAT. Free cancellation until 07:39 on the day, refunded to your card.",
  labels: labelOverrides,
  threshold = 0.82,
  keyboardStep = 0.1,
  velocityProjection = 0.18,
  spring = { stiffness: 400, damping: 30 },
  reducedMotionFadeMs = 150,
  status: controlledStatus,
  disabled = false,
  disabledLabel = "Choose a seat to pay",
  disabledReason = "Seats on this train are held for 10 minutes once you pick one.",
  forceState,
  onChange,
  onComplete,
  className = "",
}: FareSlideToPayProps) {
  const labels = { ...DEFAULT_LABELS, ...labelOverrides };
  const reduceMotion = useReducedMotion();
  const total = lines.reduce((sum, line) => sum + line.amount, 0);
  const money = new Intl.NumberFormat(locale, { style: "currency", currency });
  const totalLabel = money.format(total);

  const [internalStatus, setInternalStatus] = useState<FareSlideStatus>(controlledStatus ?? "idle");
  const status = controlledStatus ?? internalStatus;
  const settled = status === "loading" || status === "success";

  const trackRef = useRef<HTMLDivElement>(null);
  const [max, setMax] = useState(0);
  const maxRef = useRef(0);
  const x = useMotionValue(0);
  const [percent, setPercent] = useState(0);
  const [armed, setArmed] = useState(false);
  const [dragging, setDragging] = useState(false);
  const pressed = dragging || forceState === "active";

  const hintId = useId();
  const titleId = useId();

  // Measure the travel distance and keep the thumb where its state says it belongs.
  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const measure = () => {
      const next = Math.max(0, track.clientWidth - PAD * 2 - THUMB);
      maxRef.current = next;
      setMax(next);
      if (settled) x.set(next);
      else if (forceState === "active") x.set(next * 0.56);
      else x.set(Math.min(x.get(), next));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    return () => observer.disconnect();
  }, [forceState, settled, x]);

  useMotionValueEvent(x, "change", (value) => {
    const progress = maxRef.current > 0 ? Math.min(1, Math.max(0, value / maxRef.current)) : 0;
    setPercent(Math.round(progress * 100));
    setArmed(progress >= threshold);
    onChange?.(progress);
  });

  const labelOpacity = useTransform(x, (value) =>
    maxRef.current > 0 ? Math.max(0, 1 - value / (maxRef.current * 0.55)) : 1,
  );
  const fillTransform = useMotionTemplate`translateX(calc(-100% + ${THUMB}px + ${x}px))`;

  const moveTo = useCallback(
    (target: number, velocity = 0) => {
      if (reduceMotion) {
        x.set(target);
        return;
      }
      animate(x, target, { type: "spring", stiffness: spring.stiffness, damping: spring.damping, velocity });
    },
    [reduceMotion, spring.damping, spring.stiffness, x],
  );

  const complete = useCallback(
    (velocity = 0) => {
      if (disabled || settled) return;
      moveTo(maxRef.current, velocity);
      const result = onComplete?.();
      if (result && typeof (result as Promise<void>).then === "function") {
        setInternalStatus("loading");
        (result as Promise<void>).then(
          () => setInternalStatus("success"),
          () => setInternalStatus("error"),
        );
      } else {
        setInternalStatus("success");
      }
    },
    [disabled, moveTo, onComplete, settled],
  );

  // A failed payment sends the thumb home so the gesture can be tried again; a fresh success taps the device once.
  const previousStatus = useRef(status);
  useEffect(() => {
    const previous = previousStatus.current;
    previousStatus.current = status;
    if (previous === status) return;
    if (status === "error") moveTo(0);
    if (status === "success" && typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(12);
  }, [moveTo, status]);

  function handleDragEnd(_: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) {
    setDragging(false);
    const projected = x.get() + info.velocity.x * velocityProjection;
    if (maxRef.current > 0 && projected / maxRef.current >= threshold) complete(info.velocity.x);
    else moveTo(0, info.velocity.x);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (disabled || settled) return;
    const step = maxRef.current * keyboardStep;
    const current = x.get();
    switch (event.key) {
      case "ArrowRight":
      case "ArrowUp": {
        event.preventDefault();
        const target = Math.min(maxRef.current, current + step);
        if (target >= maxRef.current - 0.5) complete();
        else moveTo(target);
        break;
      }
      case "ArrowLeft":
      case "ArrowDown":
        event.preventDefault();
        moveTo(Math.max(0, current - step));
        break;
      case "Home":
      case "Escape":
        event.preventDefault();
        moveTo(0);
        break;
      case "End":
      case "Enter":
      case " ":
        event.preventDefault();
        complete();
        break;
    }
  }

  const idleText = disabled ? disabledLabel : status === "error" ? labels.retry : `${labels.idle} ${totalLabel}`;
  const announcement =
    status === "loading"
      ? `${labels.loading}.`
      : status === "success"
        ? `${labels.success} ${totalLabel}. ${confirmation}. Booking reference ${bookingReference}.`
        : status === "error"
          ? errorMessage
          : "";

  const fade = { duration: reducedMotionFadeMs / 1000 };

  return (
    <MotionConfig
      reducedMotion="user"
      transition={reduceMotion ? fade : { type: "spring", stiffness: spring.stiffness, damping: spring.damping }}
    >
      <section
        aria-labelledby={titleId}
        data-status={status}
        className={cx(
          "w-full rounded-[max(var(--iu-radius),20px)] border border-(--iu-border) bg-(--iu-surface) font-(family-name:--iu-font) text-(--iu-foreground)",
          "shadow-[inset_0_1px_0_color-mix(in_oklab,white_70%,transparent),0_1px_2px_color-mix(in_oklab,black_6%,transparent),0_16px_32px_-16px_color-mix(in_oklab,black_22%,transparent)]",
          "dark:border-(--iu-foreground)/10 dark:shadow-[inset_0_1px_0_color-mix(in_oklab,white_6%,transparent),0_16px_32px_-16px_color-mix(in_oklab,black_70%,transparent)]",
          className,
        )}
      >
        <div className="p-[calc(20px*var(--iu-density))] sm:p-[calc(24px*var(--iu-density))]">
          <header className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span
                aria-hidden="true"
                className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--iu-accent)_12%,var(--iu-surface))] text-(--iu-foreground)"
              >
                <TrainFront size={18} strokeWidth={1.5} />
              </span>
              <div className="min-w-0">
                <h2 id={titleId} className="truncate text-base leading-tight font-semibold">
                  {operator}
                </h2>
                <p className="truncate text-sm text-(--iu-muted)">{service}</p>
              </div>
            </div>
            <p className="shrink-0 text-sm font-medium text-(--iu-muted) tabular-nums">{date}</p>
          </header>

          <div className="mt-6 grid grid-cols-[auto_1fr_auto] items-center gap-x-3">
            <span className="text-[28px] leading-none font-semibold tracking-[-0.03em] tabular-nums">{from.time}</span>
            <span aria-hidden="true" className="relative flex items-center">
              <span className="size-2 rounded-full border-2 border-(--iu-foreground)" />
              <span className="h-px flex-1 bg-(--iu-foreground)/25" />
              <span className="rounded-full bg-(--iu-foreground)/6 px-2 py-0.5 text-xs font-medium whitespace-nowrap text-(--iu-muted) tabular-nums dark:bg-(--iu-foreground)/10">
                {duration}
              </span>
              <span className="h-px flex-1 bg-(--iu-foreground)/25" />
              <span className="size-2 rounded-full bg-(--iu-foreground)" />
            </span>
            <span className="text-[28px] leading-none font-semibold tracking-[-0.03em] tabular-nums">{to.time}</span>
            <span className="mt-2 text-sm text-(--iu-muted)">{from.station}</span>
            <span className="sr-only">
              Departs {from.time}, arrives {to.time}, {duration}
            </span>
            <span className="col-start-3 mt-2 text-right text-sm text-(--iu-muted)">{to.station}</span>
          </div>

          <div className="mt-6 rounded-[max(var(--iu-radius),14px)] bg-[color-mix(in_oklab,var(--iu-foreground)_4%,var(--iu-surface))] p-[calc(16px*var(--iu-density))] dark:bg-[color-mix(in_oklab,var(--iu-foreground)_5%,var(--iu-surface))]">
            <p className="text-sm font-medium">
              {seat}
              <span className="text-(--iu-muted)"> · {passengers}</span>
            </p>
            <dl className="mt-3 space-y-2 text-sm">
              {lines.map((line) => (
                <div key={line.label} className="flex items-baseline justify-between gap-4">
                  <dt className="text-(--iu-muted)">{line.label}</dt>
                  <dd className="tabular-nums">{money.format(line.amount)}</dd>
                </div>
              ))}
              <div className="flex items-baseline justify-between gap-4 border-t border-(--iu-foreground)/10 pt-3">
                <dt className="font-medium">Total</dt>
                <dd className="text-xl font-semibold tracking-[-0.02em] tabular-nums">{totalLabel}</dd>
              </div>
            </dl>
          </div>

          <p className="mt-5 flex items-center justify-between gap-3 text-sm">
            <span className="text-(--iu-muted)">Pay with</span>
            <span className="font-medium">{paymentMethod}</span>
          </p>

          {/* The slider. */}
          <div
            ref={trackRef}
            data-armed={armed || settled ? "" : undefined}
            className={cx(
              "relative mt-3 h-16 overflow-hidden rounded-full p-1 select-none",
              "shadow-[inset_0_1px_3px_color-mix(in_oklab,black_12%,transparent)] dark:shadow-[inset_0_1px_3px_color-mix(in_oklab,black_60%,transparent)]",
              disabled
                ? "bg-[color-mix(in_oklab,var(--iu-foreground)_6%,var(--iu-surface))] dark:bg-[color-mix(in_oklab,var(--iu-foreground)_6%,var(--iu-background))]"
                : "bg-[color-mix(in_oklab,var(--iu-accent)_9%,var(--iu-surface))] dark:bg-[color-mix(in_oklab,var(--iu-accent)_10%,var(--iu-background))]",
            )}
          >
            {/* The fill follows the thumb's leading edge and turns solid once a release would pay. */}
            <motion.span
              aria-hidden="true"
              hidden={disabled}
              style={{ transform: fillTransform }}
              className="absolute inset-y-1 left-1 w-[calc(100%-8px)] overflow-hidden rounded-full bg-[color-mix(in_oklab,var(--iu-accent)_38%,var(--iu-surface))] dark:bg-[color-mix(in_oklab,var(--iu-accent)_45%,var(--iu-background))]"
            >
              <span
                className={cx(
                  "absolute inset-0 bg-(--iu-accent) transition-opacity duration-200 ease-out motion-reduce:duration-150",
                  armed || settled ? "opacity-100" : "opacity-0",
                )}
              />
            </motion.span>

            {/* Threshold line. */}
            {!settled && !disabled ? (
              <span
                aria-hidden="true"
                style={{ left: `calc(${PAD + THUMB}px + (100% - ${PAD * 2 + THUMB}px) * ${threshold})` }}
                className="absolute inset-y-4 w-0.5 rounded-full bg-(--iu-foreground)/20"
              />
            ) : null}

            <AnimatePresence initial={false} mode="popLayout">
              {settled ? (
                <motion.span
                  key={status}
                  aria-hidden="true"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="absolute inset-y-0 left-0 flex w-[calc(100%-64px)] items-center justify-center gap-2 pl-4 text-[15px] font-semibold text-(--iu-accent-foreground) tabular-nums"
                >
                  {status === "success" ? `${labels.success} ${totalLabel}` : labels.loading}
                </motion.span>
              ) : (
                <motion.span
                  key={status === "error" ? "retry" : "idle"}
                  aria-hidden="true"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center pr-4 pl-[68px]"
                >
                  <motion.span
                    style={{ opacity: labelOpacity }}
                    className={cx(
                      "flex items-center gap-1.5 truncate text-[15px] font-semibold tabular-nums",
                      disabled ? "text-(--iu-muted)" : "text-(--iu-foreground)",
                    )}
                  >
                    {idleText}
                    {!disabled ? (
                      <ChevronsRight size={16} strokeWidth={1.5} className="shrink-0 text-(--iu-muted)" />
                    ) : null}
                  </motion.span>
                </motion.span>
              )}
            </AnimatePresence>

            <motion.div
              role="slider"
              tabIndex={0}
              aria-label={idleText}
              aria-describedby={hintId}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={settled ? 100 : percent}
              aria-valuetext={
                status === "success"
                  ? `${labels.success} ${totalLabel}`
                  : status === "loading"
                    ? labels.loading
                    : `${percent}%`
              }
              aria-disabled={disabled || settled || undefined}
              data-force-state={forceState}
              drag={disabled || settled ? false : "x"}
              dragConstraints={{ left: 0, right: max }}
              dragElastic={0.04}
              dragMomentum={false}
              onDragStart={() => setDragging(true)}
              onDragEnd={handleDragEnd}
              onKeyDown={handleKeyDown}
              onBlur={() => {
                if (!settled && !disabled) moveTo(0);
              }}
              whileTap={disabled || settled ? undefined : { scale: 0.97 }}
              style={{ x }}
              className={cx(
                "relative z-10 flex size-14 touch-none items-center justify-center rounded-full bg-(--iu-surface) text-(--iu-foreground)",
                "shadow-[inset_0_1px_0_color-mix(in_oklab,white_80%,transparent),0_1px_2px_color-mix(in_oklab,black_10%,transparent),0_6px_14px_-4px_color-mix(in_oklab,black_22%,transparent)]",
                "dark:bg-[color-mix(in_oklab,var(--iu-foreground)_14%,var(--iu-surface))] dark:shadow-[inset_0_1px_0_color-mix(in_oklab,white_10%,transparent),0_6px_14px_-4px_color-mix(in_oklab,black_70%,transparent)]",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--iu-accent)",
                pressed &&
                  "shadow-[inset_0_1px_0_color-mix(in_oklab,white_80%,transparent),0_1px_2px_color-mix(in_oklab,black_14%,transparent),0_10px_22px_-6px_color-mix(in_oklab,black_30%,transparent)]",
                disabled
                  ? "cursor-not-allowed text-(--iu-muted)"
                  : settled
                    ? "cursor-default"
                    : "cursor-grab active:cursor-grabbing",
              )}
            >
              <AnimatePresence initial={false} mode="popLayout">
                <motion.span
                  key={
                    status === "loading"
                      ? "loading"
                      : status === "success"
                        ? "success"
                        : status === "error"
                          ? "error"
                          : "idle"
                  }
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: forceState === "active" ? 0.97 : 1 }}
                  exit={{ opacity: 0, scale: 0.6 }}
                  className="flex"
                >
                  {status === "loading" ? (
                    <LoaderCircle
                      size={22}
                      strokeWidth={1.75}
                      aria-hidden="true"
                      className="animate-spin motion-reduce:animate-none"
                    />
                  ) : status === "success" ? (
                    <Check size={24} strokeWidth={2} aria-hidden="true" />
                  ) : status === "error" ? (
                    <RotateCcw size={20} strokeWidth={1.75} aria-hidden="true" />
                  ) : (
                    <ArrowRight size={22} strokeWidth={1.75} aria-hidden="true" />
                  )}
                </motion.span>
              </AnimatePresence>
            </motion.div>
          </div>

          {/* One fixed-height line under the track, so changing state never moves the layout. */}
          <div className="relative mt-3 min-h-10 text-sm">
            <AnimatePresence initial={false} mode="popLayout">
              <motion.p
                key={disabled ? "disabled" : status}
                id={hintId}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className={cx(
                  "flex items-start gap-2 text-pretty",
                  status === "error" ? "text-red-700 dark:text-red-300" : "text-(--iu-muted)",
                )}
              >
                {status === "success" ? (
                  <>
                    <Check
                      size={16}
                      strokeWidth={1.5}
                      aria-hidden="true"
                      className="mt-0.5 shrink-0 text-emerald-700 dark:text-emerald-400"
                    />
                    <span>
                      <span className="text-(--iu-foreground)">{confirmation}.</span> Booking reference{" "}
                      <span className="font-mono text-[13px] text-(--iu-foreground)">{bookingReference}</span>
                    </span>
                  </>
                ) : status === "error" ? (
                  <>
                    <CircleAlert size={16} strokeWidth={1.5} aria-hidden="true" className="mt-0.5 shrink-0" />
                    <span>{errorMessage}</span>
                  </>
                ) : status === "loading" ? (
                  <span>Keep this page open. This usually takes a few seconds.</span>
                ) : disabled ? (
                  <span>{disabledReason}</span>
                ) : (
                  <span>{labels.hint}</span>
                )}
              </motion.p>
            </AnimatePresence>
          </div>

          <p className="mt-3 border-t border-(--iu-border) pt-4 text-xs leading-relaxed text-pretty text-(--iu-muted)">
            {refundNote}
          </p>

          <div aria-live="polite" className="sr-only">
            {announcement}
          </div>
        </div>
      </section>
    </MotionConfig>
  );
}

export default FareSlideToPay;
