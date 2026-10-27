"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ClipboardEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import { MotionConfig, motion, useReducedMotion } from "motion/react";
import { ArrowRight, Check, CircleAlert, Copy, Download, Eye, EyeOff, LoaderCircle, ShieldCheck } from "lucide-react";

export type VaultlineStep = 0 | 1 | 2 | 3;
export type VaultlineAccount = { email: string; password: string };
export type VaultlineLogLine = { time: string; scope: string; text: string };

export type VaultlineTwoFactorProps = {
  brand?: string;
  /** 0 Account, 1 Scan, 2 Verify, 3 Recovery. */
  defaultStep?: VaultlineStep;
  defaultEmail?: string;
  /** Base32 secret shown for manual entry and used to draw the QR. */
  secret?: string;
  backupCodes?: string[];
  /** Pre-filled code, for resuming the verify step. */
  defaultCode?: string;
  /** Controlled status of the verify step; "success" shows the finished recovery step. */
  status?: "idle" | "loading" | "error" | "success";
  errorMessage?: string;
  /** Seconds left in the current 30-second TOTP window on first render. */
  windowSeconds?: number;
  log?: VaultlineLogLine[];
  onCreateAccount?: (account: VaultlineAccount) => void | Promise<void>;
  onSocial?: (provider: "github" | "google") => void;
  /** Resolve to accept the code, reject (or resolve false) to show the error state. */
  onVerify?: (code: string) => void | boolean | Promise<void | boolean>;
  onCopy?: (what: "secret" | "codes", value: string) => void;
  onDownloadCodes?: (codes: string[]) => void;
  onFinish?: () => void;
  className?: string;
};

const DEFAULT_CODES = [
  "7KQ2-9MXD",
  "H4TN-2WVA",
  "PZ8C-L3RE",
  "Q6JM-YB7F",
  "3RXW-KD9N",
  "M2VE-8HTQ",
  "C9LF-4PZS",
  "W7BA-N6GU",
  "E5YK-R2CJ",
  "T8DH-X3MV",
];

const DEFAULT_LOG: VaultlineLogLine[] = [
  { time: "09:41:02", scope: "auth", text: "account created · sol@brightline.dev" },
  { time: "09:41:03", scope: "totp", text: "secret issued · SHA1 · 6 digits · 30s" },
  { time: "09:42:18", scope: "totp", text: "device verified · window 1 of 1" },
  { time: "09:42:19", scope: "recovery", text: "10 one-time codes generated" },
];

const STEPS = ["account", "scan", "verify", "recovery"] as const;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--iu-accent)";
const MICRO = "font-mono text-[11px] tracking-[0.08em] uppercase";
const RADIUS = "rounded-[min(var(--iu-radius),8px)]";

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function clock() {
  const now = new Date();
  return [now.getHours(), now.getMinutes(), now.getSeconds()].map((part) => String(part).padStart(2, "0")).join(":");
}

/** A deterministic 25×25 QR-style matrix with the three finder patterns, seeded from the secret. */
function qrPath(seed: string) {
  const size = 25;
  let state = 0;
  for (const char of seed) state = (state * 31 + char.charCodeAt(0)) >>> 0;
  const random = () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
  const inFinder = (x: number, y: number) => (x < 8 && y < 8) || (x > size - 9 && y < 8) || (x < 8 && y > size - 9);
  let d = "";
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (inFinder(x, y)) continue;
      const timing = (x === 6 || y === 6) && (x + y) % 2 === 0;
      if (timing || random() > 0.52) d += `M${x} ${y}h1v1h-1z`;
    }
  }
  for (const [ox, oy] of [
    [0, 0],
    [size - 7, 0],
    [0, size - 7],
  ] as const) {
    d += `M${ox} ${oy}h7v7h-7zM${ox + 1} ${oy + 1}v5h5v-5zM${ox + 2} ${oy + 2}h3v3h-3z`;
  }
  return d;
}

function GitHubMark() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 .3a12 12 0 0 0-3.8 23.38c.6.12.83-.26.83-.57l-.02-2.04c-3.34.72-4.04-1.61-4.04-1.61-.55-1.39-1.33-1.76-1.33-1.76-1.09-.74.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.83 2.8 1.3 3.49 1 .1-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.14-.3-.54-1.52.1-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.28-1.55 3.29-1.23 3.29-1.23.64 1.66.24 2.88.12 3.18a4.65 4.65 0 0 1 1.23 3.22c0 4.61-2.8 5.63-5.48 5.92.43.37.82 1.1.82 2.22l-.01 3.29c0 .32.21.69.82.57A12 12 0 0 0 12 .3" />
    </svg>
  );
}

function GoogleMark() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.19-1.79 4.13-1.15 1.15-2.93 2.4-6.05 2.4-4.83 0-8.6-3.89-8.6-8.72s3.77-8.72 8.6-8.72c2.6 0 4.51 1.03 5.91 2.35l2.31-2.31C18.75 1.44 16.13 0 12.48 0 5.87 0 .31 5.39.31 12s5.56 12 12.17 12c3.57 0 6.27-1.17 8.37-3.36 2.16-2.16 2.84-5.21 2.84-7.67 0-.76-.05-1.47-.17-2.05H12.48z" />
    </svg>
  );
}

/** Corner ticks around a frame, the family's signature detail. */
function Ticks() {
  const tick = "pointer-events-none absolute size-2.5 border-(--iu-accent)";
  return (
    <>
      <span aria-hidden="true" className={cx(tick, "-top-px -left-px border-t-2 border-l-2")} />
      <span aria-hidden="true" className={cx(tick, "-top-px -right-px border-t-2 border-r-2")} />
      <span aria-hidden="true" className={cx(tick, "-bottom-px -left-px border-b-2 border-l-2")} />
      <span aria-hidden="true" className={cx(tick, "-right-px -bottom-px border-r-2 border-b-2")} />
    </>
  );
}

function Button({
  children,
  variant = "primary",
  className = "",
  ...rest
}: { children: ReactNode; variant?: "primary" | "ghost" } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className={cx(
        "inline-flex h-10 items-center justify-center gap-2 px-4 text-sm font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none",
        RADIUS,
        FOCUS,
        variant === "primary"
          ? "bg-(--iu-accent) text-(--iu-accent-foreground) pointer-fine:hover:bg-[color-mix(in_oklab,var(--iu-accent)_88%,var(--iu-foreground))]"
          : "border border-(--iu-foreground)/25 text-(--iu-foreground) pointer-fine:hover:bg-(--iu-foreground)/6",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function VaultlineTwoFactor({
  brand = "Vaultline",
  defaultStep = 0,
  defaultEmail = "",
  secret = "JBSW Y3DP EHPK 3PXP KZ7Q 2MRA",
  backupCodes = DEFAULT_CODES,
  defaultCode = "",
  status: statusProp = "idle",
  errorMessage,
  windowSeconds = 30,
  log,
  onCreateAccount,
  onSocial,
  onVerify,
  onCopy,
  onDownloadCodes,
  onFinish,
  className = "",
}: VaultlineTwoFactorProps) {
  const reduceMotion = useReducedMotion();
  const uid = useId();
  const finished = statusProp === "success";
  const [step, setStep] = useState<VaultlineStep>(finished ? 3 : defaultStep);
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [code, setCode] = useState(defaultCode.replace(/\D/g, "").slice(0, 6));
  const [codeFocused, setCodeFocused] = useState(false);
  const [internal, setInternal] = useState<{ status: "idle" | "loading" | "error"; message?: string }>({
    status: "idle",
  });
  const [locked, setLocked] = useState(finished);
  const [acknowledged, setAcknowledged] = useState(false);
  const [copied, setCopied] = useState<"" | "secret" | "codes">("");
  const [remaining, setRemaining] = useState(windowSeconds);
  const [lines, setLines] = useState<VaultlineLogLine[]>(
    () => log ?? DEFAULT_LOG.slice(0, finished ? 4 : [0, 2, 2, 4][defaultStep]),
  );
  const [accountBusy, setAccountBusy] = useState(false);
  const codeRef = useRef<HTMLInputElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const timerRoot = useRef<HTMLDivElement>(null);
  const [moved, setMoved] = useState(false);
  const path = useMemo(() => qrPath(secret), [secret]);

  const status = statusProp !== "idle" && statusProp !== "success" ? statusProp : internal.status;
  const verifying = status === "loading";
  const message =
    statusProp === "error"
      ? (errorMessage ?? "That code didn't match. Codes change every 30 seconds; wait for a fresh one and try again.")
      : (internal.message ??
        "That code didn't match. Codes change every 30 seconds; wait for a fresh one and try again.");

  // The TOTP window: a real countdown, paused while offscreen.
  useEffect(() => {
    if (step !== 2 && step !== 1) return;
    let visible = true;
    const node = timerRoot.current;
    const observer =
      node && typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver((entries) => {
            visible = entries[0]?.isIntersecting ?? true;
          })
        : null;
    if (node) observer?.observe(node);
    const id = window.setInterval(() => {
      if (visible) setRemaining((value) => (value <= 1 ? 30 : value - 1));
    }, 1000);
    return () => {
      window.clearInterval(id);
      observer?.disconnect();
    };
  }, [step]);

  useEffect(() => {
    if (moved) headingRef.current?.focus();
  }, [step, moved]);

  useEffect(() => {
    if (!copied) return;
    const id = window.setTimeout(() => setCopied(""), 1600);
    return () => window.clearTimeout(id);
  }, [copied]);

  function append(scope: string, text: string) {
    setLines((prev) => [...prev, { time: clock(), scope, text }]);
  }

  function go(next: VaultlineStep) {
    setMoved(true);
    setStep(next);
  }

  function checkEmail(value: string) {
    if (!value.trim()) return "Enter the email your team uses.";
    return EMAIL.test(value.trim()) ? "" : "Expected name@domain.tld.";
  }
  function checkPassword(value: string) {
    if (!value) return "Choose a password.";
    return value.length >= 12 ? "" : `Use at least 12 characters (${value.length}/12).`;
  }

  async function submitAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors = { email: checkEmail(email), password: checkPassword(password) };
    setFieldErrors(errors);
    if (errors.email) return document.getElementById(`${uid}-email`)?.focus();
    if (errors.password) return document.getElementById(`${uid}-password`)?.focus();
    const result = onCreateAccount?.({ email: email.trim(), password });
    if (result && typeof (result as Promise<void>).then === "function") {
      setAccountBusy(true);
      try {
        await result;
      } catch (error) {
        setAccountBusy(false);
        setFieldErrors({ email: error instanceof Error ? error.message : "That email already has an account." });
        return;
      }
      setAccountBusy(false);
    }
    append("auth", `account created · ${email.trim()}`);
    append("totp", "secret issued · SHA1 · 6 digits · 30s");
    go(1);
  }

  async function submitCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (verifying || locked) return;
    if (code.length < 6) {
      setInternal({ status: "error", message: `Enter all 6 digits (${code.length}/6).` });
      codeRef.current?.focus();
      return;
    }
    setInternal({ status: "loading" });
    try {
      const result = await onVerify?.(code);
      if (result === false) throw new Error();
    } catch (error) {
      setInternal({
        status: "error",
        message: error instanceof Error && error.message ? error.message : undefined,
      });
      append("totp", "verification failed · code rejected");
      codeRef.current?.select();
      return;
    }
    setInternal({ status: "idle" });
    setLocked(true);
    append("totp", "device verified · window 1 of 1");
    append("recovery", `${backupCodes.length} one-time codes generated`);
    window.setTimeout(() => go(3), reduceMotion ? 0 : 520);
  }

  function copy(what: "secret" | "codes") {
    const value = what === "secret" ? secret.replace(/\s/g, "") : backupCodes.join("\n");
    void navigator.clipboard?.writeText(value).catch(() => undefined);
    onCopy?.(what, value);
    setCopied(what);
  }

  function download() {
    if (onDownloadCodes) return onDownloadCodes(backupCodes);
    const blob = new Blob([`${brand} recovery codes\n\n${backupCodes.join("\n")}\n`], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${brand.toLowerCase()}-recovery-codes.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }

  function onPaste(event: ClipboardEvent<HTMLInputElement>) {
    const digits = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!digits) return;
    event.preventDefault();
    setCode(digits);
    if (internal.status === "error") setInternal({ status: "idle" });
  }

  const showError = status === "error";
  const titles = [
    { title: `Create your ${brand} account`, body: "Secrets for every environment, behind two factors from day one." },
    {
      title: "Scan with your authenticator",
      body: "Use 1Password, Authy, or any TOTP app. The key never leaves this device.",
    },
    { title: "Enter the 6-digit code", body: "Type the code your app shows now. Paste works too." },
    {
      title: locked ? "Two-factor is on" : "Save your recovery codes",
      body: "Each code works once if you lose your device. Store them somewhere other than this laptop.",
    },
  ];
  const current = titles[step]!;
  const inputBase = cx(
    "h-10 w-full border bg-(--iu-background) px-3 text-sm text-(--iu-foreground) placeholder:text-(--iu-muted) disabled:opacity-60",
    RADIUS,
    FOCUS,
  );

  return (
    <MotionConfig
      reducedMotion="user"
      transition={reduceMotion ? { duration: 0 } : { duration: 0.16, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <div
        className={cx("@container w-full font-(family-name:--iu-font) text-(--iu-foreground) antialiased", className)}
      >
        <div className="grid overflow-hidden rounded-[min(var(--iu-radius),8px)] border border-(--iu-border) bg-(--iu-surface) @3xl:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] dark:border-(--iu-foreground)/14">
          <section aria-labelledby={`${uid}-title`} className="min-w-0">
            <header className="flex items-center justify-between gap-4 border-b border-dashed border-(--iu-border) px-5 py-3 dark:border-(--iu-foreground)/14">
              <span className="flex items-center gap-2 text-sm font-semibold">
                <span aria-hidden="true" className="size-2 bg-(--iu-accent)" />
                {brand}
              </span>
              <span className={cx(MICRO, "text-(--iu-muted) tabular-nums")}>setup {Math.min(step + 1, 4)}/4</span>
            </header>

            <nav
              aria-label="Setup steps"
              className="border-b border-dashed border-(--iu-border) px-5 py-3 dark:border-(--iu-foreground)/14"
            >
              <ol className="grid grid-cols-4 gap-2">
                {STEPS.map((name, index) => {
                  const done = index < step || (index === 3 && locked);
                  const active = index === step && !done;
                  return (
                    <li
                      key={name}
                      aria-current={active ? "step" : undefined}
                      className={cx(
                        "flex min-w-0 flex-col gap-2 font-mono text-[11px] tabular-nums",
                        active || done ? "text-(--iu-foreground)" : "text-(--iu-muted)",
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className={cx(
                          "h-0.5 w-full transition-colors duration-150 motion-reduce:transition-none",
                          done ? "bg-(--iu-foreground)" : active ? "bg-(--iu-accent)" : "bg-(--iu-foreground)/15",
                        )}
                      />
                      <span className="flex items-center gap-1.5 truncate">
                        {done ? (
                          <Check size={12} strokeWidth={2} aria-hidden="true" />
                        ) : (
                          <span aria-hidden="true">{`0${index + 1}`}</span>
                        )}
                        <span className="truncate">{name}</span>
                        <span className="sr-only">{done ? ", done" : active ? ", current" : ""}</span>
                      </span>
                    </li>
                  );
                })}
              </ol>
            </nav>

            <div className="px-5 py-[calc(24px*var(--iu-density))] @lg:px-8 @lg:py-[calc(32px*var(--iu-density))]">
              <motion.div key={step} initial={moved ? { opacity: 0, y: 4 } : false} animate={{ opacity: 1, y: 0 }}>
                <h2
                  id={`${uid}-title`}
                  ref={headingRef}
                  tabIndex={-1}
                  className="flex items-center gap-2 text-xl font-semibold tracking-[-0.02em] text-balance outline-none @lg:text-2xl"
                >
                  {step === 3 && locked ? (
                    <ShieldCheck
                      size={22}
                      strokeWidth={1.5}
                      aria-hidden="true"
                      className="shrink-0 text-(--iu-accent)"
                    />
                  ) : null}
                  {current.title}
                </h2>
                <p className="mt-2 max-w-[34rem] text-sm leading-relaxed text-pretty text-(--iu-muted)">
                  {current.body}
                </p>

                {step === 0 ? (
                  <form
                    noValidate
                    onSubmit={submitAccount}
                    className="mt-6 grid max-w-md gap-[calc(16px*var(--iu-density))]"
                  >
                    <div className="grid grid-cols-2 gap-2">
                      {(
                        [
                          ["github", "GitHub", GitHubMark],
                          ["google", "Google", GoogleMark],
                        ] as const
                      ).map(([provider, name, Mark]) => (
                        <Button
                          key={provider}
                          type="button"
                          variant="ghost"
                          onClick={() => onSocial?.(provider)}
                          disabled={accountBusy}
                        >
                          <Mark />
                          <span>
                            <span className="sr-only">Sign up with </span>
                            {name}
                          </span>
                        </Button>
                      ))}
                    </div>
                    <div aria-hidden="true" className={cx(MICRO, "flex items-center gap-3 text-(--iu-muted)")}>
                      <span className="flex-1 border-t border-dashed border-(--iu-foreground)/20" />
                      or
                      <span className="flex-1 border-t border-dashed border-(--iu-foreground)/20" />
                    </div>
                    <div>
                      <label htmlFor={`${uid}-email`} className={cx(MICRO, "mb-2 block text-(--iu-muted)")}>
                        Email
                      </label>
                      <input
                        id={`${uid}-email`}
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        placeholder="sol@brightline.dev"
                        value={email}
                        disabled={accountBusy}
                        onChange={(event) => {
                          setEmail(event.target.value);
                          if (fieldErrors.email && !checkEmail(event.target.value))
                            setFieldErrors((prev) => ({ ...prev, email: "" }));
                        }}
                        onBlur={() => email && setFieldErrors((prev) => ({ ...prev, email: checkEmail(email) }))}
                        aria-invalid={fieldErrors.email ? true : undefined}
                        aria-describedby={fieldErrors.email ? `${uid}-email-error` : undefined}
                        className={cx(
                          inputBase,
                          fieldErrors.email ? "border-red-600 dark:border-red-400" : "border-(--iu-foreground)/35",
                        )}
                      />
                      {fieldErrors.email ? (
                        <p
                          id={`${uid}-email-error`}
                          className="mt-2 flex items-center gap-1.5 font-mono text-xs text-red-700 dark:text-red-300"
                        >
                          <CircleAlert size={12} strokeWidth={2} aria-hidden="true" />
                          {fieldErrors.email}
                        </p>
                      ) : null}
                    </div>
                    <div>
                      <label htmlFor={`${uid}-password`} className={cx(MICRO, "mb-2 block text-(--iu-muted)")}>
                        Password
                      </label>
                      <div className="relative">
                        <input
                          id={`${uid}-password`}
                          type={showPassword ? "text" : "password"}
                          autoComplete="new-password"
                          value={password}
                          disabled={accountBusy}
                          onChange={(event) => {
                            setPassword(event.target.value);
                            if (fieldErrors.password && !checkPassword(event.target.value))
                              setFieldErrors((prev) => ({ ...prev, password: "" }));
                          }}
                          onBlur={() =>
                            password && setFieldErrors((prev) => ({ ...prev, password: checkPassword(password) }))
                          }
                          aria-invalid={fieldErrors.password ? true : undefined}
                          aria-describedby={`${uid}-password-hint`}
                          className={cx(
                            inputBase,
                            "pr-11 font-mono",
                            fieldErrors.password ? "border-red-600 dark:border-red-400" : "border-(--iu-foreground)/35",
                          )}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((value) => !value)}
                          aria-label={showPassword ? "Hide password" : "Show password"}
                          aria-pressed={showPassword}
                          aria-controls={`${uid}-password`}
                          className={cx(
                            "absolute top-1/2 right-1 inline-flex size-8 -translate-y-1/2 items-center justify-center text-(--iu-muted) pointer-coarse:size-10 pointer-fine:hover:text-(--iu-foreground)",
                            RADIUS,
                            FOCUS,
                          )}
                        >
                          {showPassword ? (
                            <EyeOff size={16} strokeWidth={1.5} aria-hidden="true" />
                          ) : (
                            <Eye size={16} strokeWidth={1.5} aria-hidden="true" />
                          )}
                        </button>
                      </div>
                      <p
                        id={`${uid}-password-hint`}
                        className={cx(
                          "mt-2 flex items-center gap-1.5 font-mono text-xs tabular-nums",
                          fieldErrors.password ? "text-red-700 dark:text-red-300" : "text-(--iu-muted)",
                        )}
                      >
                        {fieldErrors.password ? <CircleAlert size={12} strokeWidth={2} aria-hidden="true" /> : null}
                        {fieldErrors.password || `min 12 chars · ${password.length}/12`}
                      </p>
                    </div>
                    <Button
                      type="submit"
                      disabled={accountBusy}
                      aria-busy={accountBusy || undefined}
                      className="mt-1 w-full"
                    >
                      {accountBusy ? (
                        <>
                          <LoaderCircle
                            size={16}
                            strokeWidth={1.5}
                            aria-hidden="true"
                            className="animate-spin motion-reduce:animate-none"
                          />
                          Creating account
                        </>
                      ) : (
                        <>
                          Continue to two-factor
                          <ArrowRight size={16} strokeWidth={1.5} aria-hidden="true" />
                        </>
                      )}
                    </Button>
                  </form>
                ) : null}

                {step === 1 ? (
                  <div className="mt-6 grid gap-6 @lg:grid-cols-[auto_minmax(0,1fr)] @lg:items-start">
                    <figure className="relative w-fit border border-(--iu-foreground)/15 p-3">
                      <Ticks />
                      <svg
                        role="img"
                        aria-label={`QR code for ${brand} two-factor setup`}
                        viewBox="-2 -2 29 29"
                        className="size-44 bg-(--iu-surface) dark:bg-(--iu-foreground)"
                        shapeRendering="crispEdges"
                      >
                        <path
                          d={path}
                          className="fill-(--iu-foreground) dark:fill-(--iu-background)"
                          fillRule="evenodd"
                        />
                      </svg>
                      <figcaption className={cx(MICRO, "mt-2 text-center text-(--iu-muted)")}>
                        otpauth · totp
                      </figcaption>
                    </figure>
                    <div className="min-w-0">
                      <span className={cx(MICRO, "block text-(--iu-muted)")} id={`${uid}-key-label`}>
                        Can&apos;t scan? Enter this key
                      </span>
                      <div
                        className={cx(
                          "mt-2 flex items-center gap-2 border border-(--iu-foreground)/15 bg-(--iu-background) py-1 pr-1 pl-3",
                          RADIUS,
                        )}
                      >
                        <code
                          aria-labelledby={`${uid}-key-label`}
                          className="min-w-0 flex-1 py-1 font-mono text-sm tracking-[0.06em] break-words"
                        >
                          {secret}
                        </code>
                        <button
                          type="button"
                          onClick={() => copy("secret")}
                          aria-label={copied === "secret" ? "Key copied" : "Copy key"}
                          className={cx(
                            "inline-flex size-8 shrink-0 items-center justify-center text-(--iu-muted) pointer-coarse:size-10 pointer-fine:hover:text-(--iu-foreground)",
                            RADIUS,
                            FOCUS,
                          )}
                        >
                          {copied === "secret" ? (
                            <Check size={16} strokeWidth={1.5} aria-hidden="true" />
                          ) : (
                            <Copy size={16} strokeWidth={1.5} aria-hidden="true" />
                          )}
                        </button>
                      </div>
                      <dl className="mt-4 grid grid-cols-3 border-y border-dashed border-(--iu-foreground)/15 font-mono text-xs">
                        {[
                          ["algo", "SHA1"],
                          ["digits", "6"],
                          ["period", "30s"],
                        ].map(([term, value]) => (
                          <div key={term} className="py-2">
                            <dt className="text-[11px] tracking-[0.08em] text-(--iu-muted) uppercase">{term}</dt>
                            <dd className="mt-1 tabular-nums">{value}</dd>
                          </div>
                        ))}
                      </dl>
                      <div className="mt-6 flex flex-wrap gap-2">
                        <Button type="button" onClick={() => go(2)}>
                          I&apos;ve scanned it
                          <ArrowRight size={16} strokeWidth={1.5} aria-hidden="true" />
                        </Button>
                      </div>
                      <p aria-live="polite" className="sr-only">
                        {copied === "secret" ? "Key copied to clipboard" : ""}
                      </p>
                    </div>
                  </div>
                ) : null}

                {step === 2 ? (
                  <form noValidate onSubmit={submitCode} className="mt-6 max-w-md">
                    <label htmlFor={`${uid}-code`} className={cx(MICRO, "mb-2 block text-(--iu-muted)")}>
                      One-time code
                    </label>
                    <div className="relative">
                      <input
                        ref={codeRef}
                        id={`${uid}-code`}
                        value={code}
                        onChange={(event) => {
                          setCode(event.target.value.replace(/\D/g, "").slice(0, 6));
                          if (internal.status === "error") setInternal({ status: "idle" });
                        }}
                        onPaste={onPaste}
                        onFocus={() => setCodeFocused(true)}
                        onBlur={() => setCodeFocused(false)}
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        pattern="[0-9]*"
                        maxLength={6}
                        disabled={verifying || locked}
                        aria-invalid={showError || undefined}
                        aria-describedby={showError ? `${uid}-code-error` : `${uid}-window`}
                        className="peer absolute inset-0 z-10 h-full w-full cursor-text opacity-0"
                      />
                      <div aria-hidden="true" className="grid grid-cols-6 gap-1.5 @sm:gap-2">
                        {Array.from({ length: 6 }, (_, index) => {
                          const char = code[index] ?? "";
                          const active = codeFocused && !locked && index === Math.min(code.length, 5);
                          return (
                            <motion.span
                              key={index}
                              data-active={active}
                              initial={false}
                              animate={locked ? { y: [0, -2, 0] } : { y: 0 }}
                              transition={
                                reduceMotion ? { duration: 0 } : { duration: 0.16, delay: locked ? index * 0.05 : 0 }
                              }
                              className={cx(
                                "relative flex h-14 items-center justify-center border font-mono text-2xl tabular-nums transition-colors duration-150 motion-reduce:transition-none",
                                RADIUS,
                                locked
                                  ? "border-(--iu-accent) bg-[color-mix(in_oklab,var(--iu-accent)_10%,var(--iu-surface))]"
                                  : showError
                                    ? "border-red-600 dark:border-red-400"
                                    : active
                                      ? "border-(--iu-foreground) outline-2 outline-offset-2 outline-(--iu-accent)"
                                      : "border-(--iu-foreground)/30",
                                verifying ? "opacity-60" : "",
                              )}
                            >
                              {char}
                              {active && !char ? <span className="h-6 w-px bg-(--iu-foreground)" /> : null}
                            </motion.span>
                          );
                        })}
                      </div>
                    </div>

                    <div ref={timerRoot} id={`${uid}-window`} className="mt-4">
                      <div className="flex items-baseline justify-between font-mono text-xs text-(--iu-muted) tabular-nums">
                        <span>code window</span>
                        <span className={remaining <= 5 ? "text-(--iu-foreground)" : ""}>
                          {String(remaining).padStart(2, "0")}s left
                        </span>
                      </div>
                      <div aria-hidden="true" className="mt-2 grid grid-cols-[repeat(30,minmax(0,1fr))] gap-px">
                        {Array.from({ length: 30 }, (_, index) => (
                          <span
                            key={index}
                            className={cx(
                              "h-1.5",
                              index < remaining
                                ? remaining <= 5
                                  ? "bg-(--iu-accent)"
                                  : "bg-(--iu-foreground)/70"
                                : "bg-(--iu-foreground)/12",
                            )}
                          />
                        ))}
                      </div>
                    </div>

                    {showError ? (
                      <p
                        id={`${uid}-code-error`}
                        role="alert"
                        className={cx(
                          "mt-4 flex items-start gap-2 border border-red-600/40 bg-red-600/5 px-3 py-2 font-mono text-xs leading-relaxed text-red-800 dark:border-red-400/40 dark:bg-red-400/10 dark:text-red-200",
                          RADIUS,
                        )}
                      >
                        <CircleAlert size={14} strokeWidth={1.5} aria-hidden="true" className="mt-0.5 shrink-0" />
                        <span className="text-pretty">
                          <span className="font-semibold">E_TOTP_MISMATCH</span> · {message}
                        </span>
                      </p>
                    ) : null}

                    <div className="mt-6 flex flex-wrap items-center gap-2">
                      <Button
                        type="submit"
                        disabled={verifying || locked}
                        aria-busy={verifying || undefined}
                        className="min-w-36"
                      >
                        {verifying ? (
                          <>
                            <LoaderCircle
                              size={16}
                              strokeWidth={1.5}
                              aria-hidden="true"
                              className="animate-spin motion-reduce:animate-none"
                            />
                            Verifying
                          </>
                        ) : locked ? (
                          <>
                            <Check size={16} strokeWidth={1.5} aria-hidden="true" />
                            Verified
                          </>
                        ) : (
                          "Verify code"
                        )}
                      </Button>
                      <Button type="button" variant="ghost" onClick={() => go(1)} disabled={verifying || locked}>
                        Show QR again
                      </Button>
                    </div>
                    <p aria-live="polite" className="sr-only">
                      {verifying ? "Verifying code" : locked ? "Code verified" : ""}
                    </p>
                  </form>
                ) : null}

                {step === 3 ? (
                  <div className="mt-6">
                    <div className="relative border border-(--iu-foreground)/15 bg-(--iu-background)">
                      <Ticks />
                      <div className="flex items-center justify-between gap-3 border-b border-dashed border-(--iu-foreground)/15 px-4 py-2">
                        <span className={cx(MICRO, "text-(--iu-muted)")}>recovery-codes.txt</span>
                        <span className="font-mono text-[11px] text-(--iu-muted) tabular-nums">
                          {backupCodes.length} × single use
                        </span>
                      </div>
                      <ol className="grid grid-cols-1 gap-x-6 gap-y-1 px-4 py-3 font-mono text-sm @sm:grid-cols-2">
                        {backupCodes.map((item, index) => (
                          <li key={item} className="flex items-baseline gap-3 tabular-nums">
                            <span aria-hidden="true" className="w-5 text-right text-[11px] text-(--iu-muted)">
                              {String(index + 1).padStart(2, "0")}
                            </span>
                            <span className="tracking-[0.06em]">{item}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button type="button" variant="ghost" onClick={() => copy("codes")}>
                        {copied === "codes" ? (
                          <Check size={16} strokeWidth={1.5} aria-hidden="true" />
                        ) : (
                          <Copy size={16} strokeWidth={1.5} aria-hidden="true" />
                        )}
                        {copied === "codes" ? "Copied" : "Copy all"}
                      </Button>
                      <Button type="button" variant="ghost" onClick={download}>
                        <Download size={16} strokeWidth={1.5} aria-hidden="true" />
                        Download .txt
                      </Button>
                    </div>
                    <p aria-live="polite" className="sr-only">
                      {copied === "codes" ? "Recovery codes copied to clipboard" : ""}
                    </p>
                    <label className="mt-6 flex cursor-pointer items-start gap-3 text-sm">
                      <input
                        type="checkbox"
                        checked={acknowledged}
                        onChange={(event) => setAcknowledged(event.target.checked)}
                        className={cx("mt-0.5 size-4 shrink-0 accent-(--iu-accent)", FOCUS)}
                      />
                      <span className="text-pretty">I saved these codes somewhere other than this device.</span>
                    </label>
                    <Button type="button" onClick={onFinish} disabled={!acknowledged} className="mt-4">
                      Finish setup
                      <ArrowRight size={16} strokeWidth={1.5} aria-hidden="true" />
                    </Button>
                  </div>
                ) : null}
              </motion.div>
            </div>
          </section>

          <aside
            aria-label="Setup log"
            className="min-w-0 border-t border-dashed border-(--iu-border) bg-(--iu-background) @3xl:border-t-0 @3xl:border-l dark:border-(--iu-foreground)/14"
          >
            <div className="flex items-center justify-between border-b border-dashed border-(--iu-border) px-4 py-3 dark:border-(--iu-foreground)/14">
              <span className={cx(MICRO, "text-(--iu-muted)")}>session log</span>
              <span className="flex items-center gap-1.5 font-mono text-[11px] text-(--iu-muted)">
                <span
                  aria-hidden="true"
                  className={cx(
                    "size-1.5 rounded-full",
                    locked ? "bg-emerald-600 dark:bg-emerald-400" : "bg-(--iu-accent)",
                  )}
                />
                {locked ? "2fa enforced" : "2fa pending"}
              </span>
            </div>
            <ol aria-live="polite" className="grid gap-1.5 px-4 py-4 font-mono text-xs leading-relaxed">
              {lines.length === 0 ? <li className="text-(--iu-muted)">$ waiting for account…</li> : null}
              {lines.map((line, index) => (
                <li key={`${line.time}-${index}`} className="grid grid-cols-[auto_4.5rem_minmax(0,1fr)] gap-x-2">
                  <span className="text-(--iu-muted) tabular-nums">{line.time}</span>
                  <span className={line.scope === "totp" ? "text-(--iu-foreground)" : "text-(--iu-muted)"}>
                    {line.scope}
                  </span>
                  <span className="break-words">{line.text}</span>
                </li>
              ))}
              {!locked ? (
                <li aria-hidden="true" className="text-(--iu-muted)">
                  $ <span className="inline-block h-3 w-1.5 translate-y-0.5 bg-(--iu-foreground)/60" />
                </li>
              ) : null}
            </ol>
            <dl className="mx-4 mb-4 grid grid-cols-2 border-t border-dashed border-(--iu-foreground)/15 pt-3 font-mono text-[11px]">
              <div>
                <dt className="tracking-[0.08em] text-(--iu-muted) uppercase">device</dt>
                <dd className="mt-1">macOS · Firefox 131</dd>
              </div>
              <div>
                <dt className="tracking-[0.08em] text-(--iu-muted) uppercase">region</dt>
                <dd className="mt-1">eu-central-1</dd>
              </div>
            </dl>
          </aside>
        </div>
      </div>
    </MotionConfig>
  );
}

export default VaultlineTwoFactor;
