"use client";

import { useEffect, useId, useRef, useState, type ClipboardEvent, type KeyboardEvent } from "react";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "motion/react";
import { Check, LoaderCircle } from "lucide-react";

export type OndineOtpInputProps = {
  /** Number of digits in the code. */
  length?: number;
  eyebrow?: string;
  title?: string;
  /** The emphasised word in the title, set in italic. */
  titleEmphasis?: string;
  /** Where the code went, already masked. */
  destination?: string;
  expiresInMinutes?: number;
  /** Seconds before the code can be sent again. */
  resendSeconds?: number;
  successMessage?: string;
  errorMessage?: string;
  haptics?: boolean;
  disabled?: boolean;
  disabledReason?: string;
  /** Renders a frozen state for previews and tests. */
  forceState?: "active" | "loading" | "error" | "success";
  /** Called with the full code. Resolve (or return true) to accept; return false or throw to reject. */
  onComplete?: (code: string) => void | boolean | Promise<void | boolean>;
  /** Called on every change with the digits entered so far. */
  onChange?: (code: string) => void;
  onResend?: () => void;
  className?: string;
};

type Status = "idle" | "verifying" | "error" | "success";

const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--iu-accent) focus-visible:outline-solid";
const EASE = [0.2, 0.8, 0.2, 1] as const;
const DEMO = "481902";

function buzz(enabled: boolean, pattern: number | number[]) {
  if (enabled && typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
    navigator.vibrate(pattern);
  }
}

function clock(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export function OndineOtpInput({
  length = 6,
  eyebrow = "Ondine · Private client",
  title = "Confirm it's",
  titleEmphasis = "you",
  destination = "+44 ••••• ••0821",
  expiresInMinutes = 10,
  resendSeconds = 45,
  successMessage = "Verified. Welcome back, Margaux.",
  errorMessage = "That code doesn't match. Check the latest message and try again.",
  haptics = true,
  disabled = false,
  disabledReason = "Too many attempts. Try again at 14:20, or call your client adviser.",
  forceState,
  onComplete,
  onChange,
  onResend,
  className = "",
}: OndineOtpInputProps) {
  const reduceMotion = useReducedMotion();
  const titleId = useId();
  const statusId = useId();
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const [digits, setDigits] = useState<string[]>(() => {
    const seed =
      forceState === "active" ? DEMO.slice(0, 3) : forceState === "loading" || forceState === "success" ? DEMO : "";
    return Array.from({ length }, (_, index) => seed[index] ?? "");
  });
  const [status, setStatus] = useState<Status>(() =>
    forceState === "loading"
      ? "verifying"
      : forceState === "error"
        ? "error"
        : forceState === "success"
          ? "success"
          : "idle",
  );
  const [message, setMessage] = useState(forceState === "error" ? errorMessage : "");
  const [focusIndex, setFocusIndex] = useState<number | null>(forceState === "active" ? 3 : null);
  const [remaining, setRemaining] = useState(forceState ? Math.round(resendSeconds * 0.6) : resendSeconds);
  const [nudge, setNudge] = useState(0);
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    if (remaining <= 0 || forceState || disabled) return;
    const timer = window.setTimeout(() => setRemaining((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [remaining, forceState, disabled]);

  // After a rejected code the row remounts with its nudge; put the caret back in the first box.
  useEffect(() => {
    if (nudge > 0) inputs.current[0]?.focus();
  }, [nudge]);

  const locked = disabled || status === "verifying" || status === "success" || Boolean(forceState);
  const complete = digits.every(Boolean);

  function focusAt(index: number) {
    const target = inputs.current[Math.max(0, Math.min(length - 1, index))];
    target?.focus();
    target?.select();
  }

  async function submit(code: string) {
    setStatus("verifying");
    setMessage("");
    setAnnouncement(`Code ${code.split("").join(" ")} entered. Verifying.`);
    let accepted = true;
    let reason = errorMessage;
    try {
      const result = await onComplete?.(code);
      if (result === false) accepted = false;
    } catch (error) {
      accepted = false;
      if (error instanceof Error && error.message) reason = error.message;
    }
    if (accepted) {
      setStatus("success");
      setAnnouncement(successMessage);
      buzz(haptics, 16);
      return;
    }
    setStatus("error");
    setMessage(reason);
    setNudge((value) => value + 1);
    setDigits(Array.from({ length }, () => ""));
    setAnnouncement(reason);
    buzz(haptics, [10, 60, 10]);
  }

  function fill(index: number, text: string) {
    const chars = text.replace(/\D/g, "").split("");
    if (chars.length === 0) return;
    const start = chars.length >= length ? 0 : index;
    const next = [...digits];
    chars.slice(0, length - start).forEach((char, offset) => {
      next[start + offset] = char;
    });
    setDigits(next);
    if (status === "error") {
      setStatus("idle");
      setMessage("");
    }
    const code = next.join("");
    onChange?.(code);
    if (next.every(Boolean)) {
      inputs.current[Math.min(length - 1, start + chars.length - 1)]?.focus();
      void submit(code);
    } else {
      const empty = next.findIndex((digit, position) => position >= start && !digit);
      focusAt(empty === -1 ? Math.min(length - 1, start + chars.length) : empty);
    }
  }

  function clearAt(index: number) {
    const next = [...digits];
    next[index] = "";
    setDigits(next);
    onChange?.(next.join(""));
  }

  function handleInput(index: number, value: string) {
    if (locked) return;
    const cleaned = value.replace(/\D/g, "");
    if (!value) {
      clearAt(index);
      return;
    }
    if (!cleaned) return;
    const current = digits[index] ?? "";
    // Typing over a filled box: keep only the new digit.
    const typed = cleaned.length === 2 && current && cleaned.includes(current) ? cleaned.replace(current, "") : cleaned;
    fill(index, typed || cleaned.slice(-1));
  }

  function handlePaste(index: number, event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    if (locked) return;
    fill(index, event.clipboardData.getData("text"));
  }

  function handleKey(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (locked) return;
    if (event.key === "Backspace") {
      event.preventDefault();
      if (digits[index]) clearAt(index);
      else if (index > 0) {
        clearAt(index - 1);
        focusAt(index - 1);
      }
    } else if (event.key === "Delete") {
      event.preventDefault();
      clearAt(index);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      focusAt(index - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      focusAt(index + 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      focusAt(0);
    } else if (event.key === "End") {
      event.preventDefault();
      focusAt(length - 1);
    }
  }

  function resend() {
    if (remaining > 0 || disabled || forceState) return;
    onResend?.();
    setRemaining(resendSeconds);
    setDigits(Array.from({ length }, () => ""));
    setStatus("idle");
    setMessage("");
    setAnnouncement(`A new code is on its way to ${destination}.`);
    focusAt(0);
  }

  const half = Math.ceil(length / 2);
  const slow = reduceMotion ? { duration: 0 } : { duration: 0.42, ease: EASE };

  return (
    <MotionConfig reducedMotion="user" transition={reduceMotion ? { duration: 0 } : { duration: 0.32, ease: EASE }}>
      <section
        aria-labelledby={titleId}
        className={`mx-auto w-full max-w-md font-(family-name:--iu-font) text-(--iu-foreground) ${className}`}
      >
        <div className="rounded-[min(var(--iu-radius),2px)] border border-(--iu-border) bg-(--iu-surface) p-1.5 dark:border-(--iu-foreground)/15">
          <div className="rounded-[min(var(--iu-radius),2px)] border border-(--iu-border) px-5 pt-[calc(40px*var(--iu-density))] pb-[calc(32px*var(--iu-density))] text-center sm:px-10 dark:border-(--iu-foreground)/10">
            <p className="text-[11px] font-medium tracking-[0.2em] text-(--iu-muted) uppercase">{eyebrow}</p>
            <span aria-hidden="true" className="mx-auto mt-5 block h-px w-8 bg-(--iu-accent)" />
            <h2
              id={titleId}
              className="mt-5 font-serif text-[40px] leading-[1.05] font-normal tracking-[-0.02em] text-balance"
            >
              {title} <em className="italic">{titleEmphasis}</em>
            </h2>
            <p className="mx-auto mt-4 max-w-[30ch] text-sm leading-relaxed text-pretty text-(--iu-muted)">
              Enter the {length}-digit code sent to{" "}
              <span className="whitespace-nowrap text-(--iu-foreground) tabular-nums">{destination}</span>. It expires
              in {expiresInMinutes} minutes.
            </p>

            <fieldset
              disabled={disabled}
              aria-describedby={statusId}
              className="mt-10 min-w-0 border-0 p-0"
              onFocus={(event) => {
                const index = inputs.current.findIndex(
                  (node) => node !== null && node === (event.target as EventTarget),
                );
                if (index >= 0) setFocusIndex(index);
              }}
              onBlur={() => setFocusIndex(forceState === "active" ? 3 : null)}
            >
              <legend className="sr-only">Verification code</legend>
              <motion.div
                key={nudge}
                initial={nudge > 0 && !reduceMotion ? { x: -6 } : false}
                animate={{ x: 0 }}
                transition={
                  reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 400, damping: 30, velocity: 260 }
                }
                className="relative flex justify-center gap-1.5 sm:gap-2.5"
              >
                {digits.map((digit, index) => {
                  const active = focusIndex === index && !locked;
                  const shownActive = active || (forceState === "active" && index === 3);
                  const lineTone =
                    status === "error"
                      ? "bg-red-600 dark:bg-red-400"
                      : shownActive
                        ? "bg-(--iu-accent)"
                        : digit
                          ? "bg-(--iu-foreground)"
                          : "bg-(--iu-foreground)/45";
                  return (
                    <div
                      key={index}
                      className={`relative h-16 w-10 sm:h-[4.5rem] sm:w-12 ${index === half ? "sm:ml-4" : ""}`}
                    >
                      <input
                        ref={(node) => {
                          inputs.current[index] = node;
                        }}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        autoComplete={index === 0 ? "one-time-code" : "off"}
                        aria-label={`Digit ${index + 1} of ${length}`}
                        aria-invalid={status === "error" || undefined}
                        readOnly={locked && !disabled}
                        value={digit}
                        onChange={(event) => handleInput(index, event.target.value)}
                        onPaste={(event) => handlePaste(index, event)}
                        onKeyDown={(event) => handleKey(index, event)}
                        onFocus={(event) => event.target.select()}
                        className={`absolute inset-0 h-full w-full rounded-[min(var(--iu-radius),2px)] bg-transparent text-center font-serif text-[40px] text-transparent caret-transparent selection:bg-transparent disabled:cursor-not-allowed ${FOCUS}`}
                      />
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden font-serif text-[40px] leading-none tabular-nums"
                      >
                        <AnimatePresence initial={false}>
                          {digit ? (
                            <motion.span
                              key={`${digit}-${index}`}
                              initial={{ opacity: 0, y: 6, scale: 0.98 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -4 }}
                              transition={
                                reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 400, damping: 30 }
                              }
                              className={`absolute ${disabled ? "text-(--iu-muted)" : ""}`}
                            >
                              {digit}
                            </motion.span>
                          ) : shownActive ? (
                            <span
                              key="caret"
                              className="absolute h-9 w-px animate-pulse bg-(--iu-foreground) motion-reduce:animate-none"
                            />
                          ) : null}
                        </AnimatePresence>
                      </span>
                      <motion.span
                        aria-hidden="true"
                        initial={false}
                        animate={{ scaleX: status === "success" ? 0 : shownActive ? 1 : 0.86 }}
                        transition={slow}
                        className={`pointer-events-none absolute inset-x-0 bottom-0 h-px origin-center ${lineTone}`}
                      />
                    </div>
                  );
                })}
                {/* On success the separate lines join into one rule. */}
                <motion.span
                  aria-hidden="true"
                  initial={false}
                  animate={{ scaleX: status === "success" ? 1 : 0 }}
                  transition={reduceMotion ? { duration: 0 } : { duration: 0.5, ease: EASE, delay: 0.08 }}
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-px origin-center bg-(--iu-accent)"
                />
              </motion.div>
            </fieldset>

            <div id={statusId} className="mt-6 flex min-h-12 items-start justify-center text-sm">
              <AnimatePresence initial={false} mode="wait">
                {disabled ? (
                  <motion.p key="disabled" className="max-w-[34ch] text-pretty text-(--iu-muted)">
                    {disabledReason}
                  </motion.p>
                ) : status === "verifying" ? (
                  <motion.p
                    key="verifying"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="inline-flex items-center gap-2 text-(--iu-muted)"
                  >
                    <LoaderCircle
                      size={14}
                      strokeWidth={1.25}
                      aria-hidden="true"
                      className="animate-spin motion-reduce:animate-none"
                    />
                    <span className="text-[11px] font-medium tracking-[0.2em] uppercase">Verifying</span>
                  </motion.p>
                ) : status === "success" ? (
                  <motion.p
                    key="success"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={slow}
                    className="inline-flex items-center gap-2 font-serif text-lg text-(--iu-foreground) italic"
                  >
                    <span className="inline-flex size-5 items-center justify-center rounded-full bg-(--iu-accent) text-(--iu-accent-foreground)">
                      <Check size={12} strokeWidth={2} aria-hidden="true" />
                    </span>
                    {successMessage}
                  </motion.p>
                ) : status === "error" ? (
                  <motion.p
                    key="error"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="max-w-[34ch] text-pretty text-red-700 dark:text-red-300"
                  >
                    {message}
                  </motion.p>
                ) : (
                  <motion.p
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-(--iu-muted) tabular-nums"
                  >
                    {complete ? "" : `${digits.filter(Boolean).length} of ${length}`}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            <div className="mt-6 flex flex-col items-center gap-3 border-t border-(--iu-border) pt-6 dark:border-(--iu-foreground)/10">
              <p className="text-[11px] font-medium tracking-[0.2em] text-(--iu-muted) uppercase">
                Didn&apos;t receive it?
              </p>
              <button
                type="button"
                onClick={resend}
                disabled={remaining > 0 || disabled || status === "success"}
                className={`inline-flex h-10 min-w-44 items-center justify-center rounded-full border border-(--iu-foreground)/45 px-6 text-sm transition-colors duration-300 disabled:cursor-not-allowed disabled:border-(--iu-border) disabled:text-(--iu-muted) motion-reduce:transition-none pointer-fine:hover:enabled:bg-(--iu-foreground) pointer-fine:hover:enabled:text-(--iu-surface) ${FOCUS}`}
              >
                {remaining > 0 ? (
                  <span>
                    Resend in <span className="tabular-nums">{clock(remaining)}</span>
                  </span>
                ) : (
                  "Send a new code"
                )}
              </button>
            </div>
          </div>
        </div>
        <p aria-live="polite" className="sr-only">
          {announcement}
        </p>
      </section>
    </MotionConfig>
  );
}

export default OndineOtpInput;
