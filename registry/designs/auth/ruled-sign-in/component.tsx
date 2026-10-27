"use client";

import { useId, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "motion/react";
import { ArrowRight, Check, CircleAlert, Eye, EyeOff, LoaderCircle, Minus } from "lucide-react";

export type RuledSignInMode = "sign-in" | "sign-up";
export type RuledSignInProvider = "google" | "github";
export type RuledSignInValues = { name: string; email: string; password: string };
export type RuledSignInFact = { label: string; value: string };

export type RuledSignInProps = {
  /** Which tab opens first. */
  defaultMode?: RuledSignInMode;
  defaultValues?: Partial<RuledSignInValues>;
  brand?: string;
  facts?: RuledSignInFact[];
  /** Controlled status; leave at "idle" to let the component track the promise returned by onSubmit. */
  status?: "idle" | "loading" | "error" | "success";
  errorMessage?: string;
  /** Return a promise to get the loading, error and success states for free. Reject with an Error to show its message. */
  onSubmit?: (values: RuledSignInValues, mode: RuledSignInMode) => void | Promise<void>;
  onModeChange?: (mode: RuledSignInMode) => void;
  onSocial?: (provider: RuledSignInProvider, mode: RuledSignInMode) => void;
  onForgotPassword?: (email: string) => void;
  onSso?: () => void;
  onContinue?: () => void;
  onResend?: (email: string) => void;
  className?: string;
};

const DEFAULT_FACTS: RuledSignInFact[] = [
  { label: "Data regions", value: "Frankfurt · Dublin · Virginia" },
  { label: "Uptime, last 90 days", value: "99.98%" },
  { label: "Audited", value: "SOC 2 Type II, March 2026" },
];

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const TARGET_LENGTH = 12;

function rulesFor(password: string) {
  return [
    { label: `${TARGET_LENGTH} or more characters`, met: password.length >= TARGET_LENGTH },
    { label: "At least one number", met: /\d/.test(password) },
    { label: "At least one symbol", met: /[^A-Za-z0-9\s]/.test(password) },
  ];
}

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--iu-accent)";
const LABEL = "text-[11px] font-medium tracking-[0.08em] text-(--iu-muted) uppercase";

function GoogleMark() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.19-1.79 4.13-1.15 1.15-2.93 2.4-6.05 2.4-4.83 0-8.6-3.89-8.6-8.72s3.77-8.72 8.6-8.72c2.6 0 4.51 1.03 5.91 2.35l2.31-2.31C18.75 1.44 16.13 0 12.48 0 5.87 0 .31 5.39.31 12s5.56 12 12.17 12c3.57 0 6.27-1.17 8.37-3.36 2.16-2.16 2.84-5.21 2.84-7.67 0-.76-.05-1.47-.17-2.05H12.48z" />
    </svg>
  );
}

function GitHubMark() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 .3a12 12 0 0 0-3.8 23.38c.6.12.83-.26.83-.57l-.02-2.04c-3.34.72-4.04-1.61-4.04-1.61-.55-1.39-1.33-1.76-1.33-1.76-1.09-.74.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.83 2.8 1.3 3.49 1 .1-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.14-.3-.54-1.52.1-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.28-1.55 3.29-1.23 3.29-1.23.64 1.66.24 2.88.12 3.18a4.65 4.65 0 0 1 1.23 3.22c0 4.61-2.8 5.63-5.48 5.92.43.37.82 1.1.82 2.22l-.01 3.29c0 .32.21.69.82.57A12 12 0 0 0 12 .3" />
    </svg>
  );
}

export function RuledSignIn({
  defaultMode = "sign-in",
  defaultValues,
  brand = "Tessel",
  facts = DEFAULT_FACTS,
  status: statusProp = "idle",
  errorMessage,
  onSubmit,
  onModeChange,
  onSocial,
  onForgotPassword,
  onSso,
  onContinue,
  onResend,
  className = "",
}: RuledSignInProps) {
  const reduceMotion = useReducedMotion();
  const uid = useId();
  const [mode, setMode] = useState<RuledSignInMode>(defaultMode);
  const [values, setValues] = useState<RuledSignInValues>({
    name: defaultValues?.name ?? "",
    email: defaultValues?.email ?? "",
    password: defaultValues?.password ?? "",
  });
  const [touched, setTouched] = useState<Record<keyof RuledSignInValues, boolean>>({
    name: false,
    email: false,
    password: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [internal, setInternal] = useState<{ status: "idle" | "loading" | "error" | "success"; message?: string }>({
    status: "idle",
  });
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  const status = statusProp !== "idle" ? statusProp : internal.status;
  const message =
    statusProp === "error"
      ? (errorMessage ?? "That email and password don't match. Try again or reset your password.")
      : (internal.message ?? errorMessage ?? "Something went wrong on our side. Try again in a moment.");
  const busy = status === "loading";
  const signUp = mode === "sign-up";
  const rules = rulesFor(values.password);
  const metCount = rules.filter((rule) => rule.met).length;
  const filled = Math.min(values.password.length, TARGET_LENGTH);

  const errors = {
    name: signUp && values.name.trim().length === 0 ? "Tell us what to call you." : "",
    email:
      values.email.trim().length === 0
        ? "Enter your work email."
        : EMAIL.test(values.email.trim())
          ? ""
          : "That doesn't look like an email. Try name@company.com.",
    password:
      values.password.length === 0
        ? signUp
          ? "Choose a password."
          : "Enter your password."
        : signUp && metCount < rules.length
          ? "Meet all three rules below to continue."
          : "",
  };
  const shown = (field: keyof RuledSignInValues) => (touched[field] ? errors[field] : "");

  function switchMode(next: RuledSignInMode) {
    if (next === mode || busy) return;
    setMode(next);
    setInternal({ status: "idle" });
    setTouched({ name: false, email: false, password: false });
    onModeChange?.(next);
  }

  function onTabKey(event: KeyboardEvent<HTMLButtonElement>) {
    const order: RuledSignInMode[] = ["sign-in", "sign-up"];
    const index = order.indexOf(mode);
    let next = -1;
    if (event.key === "ArrowRight") next = (index + 1) % 2;
    else if (event.key === "ArrowLeft") next = (index + 1) % 2;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = 1;
    if (next < 0) return;
    event.preventDefault();
    switchMode(order[next]!);
    tabRefs.current[next]?.focus();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setTouched({ name: true, email: true, password: true });
    if (errors.name) return nameRef.current?.focus();
    if (errors.email) return emailRef.current?.focus();
    if (errors.password) return passwordRef.current?.focus();
    const result = onSubmit?.({ ...values, email: values.email.trim() }, mode);
    if (!result || typeof (result as Promise<void>).then !== "function") return;
    setInternal({ status: "loading" });
    try {
      await result;
      setInternal({ status: "success" });
    } catch (error) {
      setInternal({ status: "error", message: error instanceof Error ? error.message : undefined });
    }
  }

  const field = (key: keyof RuledSignInValues) => ({
    id: `${uid}-${key}`,
    value: values[key],
    onChange: (event: { target: { value: string } }) => setValues((prev) => ({ ...prev, [key]: event.target.value })),
    onBlur: () => setTouched((prev) => ({ ...prev, [key]: true })),
    "aria-invalid": shown(key) ? true : undefined,
    "aria-describedby": shown(key) ? `${uid}-${key}-error` : undefined,
  });

  const inputClass = cx(
    "h-11 w-full rounded-[min(var(--iu-radius),6px)] border bg-(--iu-background) px-3 text-[15px] text-(--iu-foreground) transition-colors duration-150 placeholder:text-(--iu-muted) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--iu-accent) disabled:opacity-60 motion-reduce:transition-none dark:bg-(--iu-background)",
  );
  const borderFor = (key: keyof RuledSignInValues) =>
    shown(key)
      ? "border-red-600 dark:border-red-400"
      : "border-(--iu-foreground)/35 pointer-fine:hover:border-(--iu-foreground)/60";

  function fieldError(name: keyof RuledSignInValues) {
    const text = shown(name);
    if (!text) return null;
    return (
      <p
        id={`${uid}-${name}-error`}
        className="mt-2 flex items-start gap-1.5 text-[13px] text-red-700 dark:text-red-300"
      >
        <CircleAlert size={14} strokeWidth={1.5} aria-hidden="true" className="mt-0.5 shrink-0" />
        {text}
      </p>
    );
  }

  const headline = signUp ? `Create your ${brand} account.` : `Sign in to ${brand}.`;
  const subline = signUp
    ? "One account for every workspace you join. Free for teams of up to three."
    : "Pick up where you left off. Your sheets, queries and reviews are waiting.";
  const primaryLabel = signUp ? "Create account" : "Sign in";
  const loadingLabel = signUp ? "Creating account" : "Signing in";

  return (
    <MotionConfig
      reducedMotion="user"
      transition={reduceMotion ? { duration: 0 } : { duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <section
        aria-labelledby={`${uid}-title`}
        className={cx(
          "bg-(--iu-background) font-(family-name:--iu-font) text-(--iu-foreground) antialiased",
          className,
        )}
      >
        <div className="mx-auto max-w-[1200px] px-5 pt-8 pb-14 sm:px-10 sm:pt-12 sm:pb-20">
          <div className={cx("flex items-baseline justify-between border-b border-(--iu-border) pb-3", LABEL)}>
            <span className="text-[13px] font-semibold tracking-[-0.01em] text-(--iu-foreground) normal-case">
              {brand}
            </span>
            <span className="tabular-nums">{signUp ? "02 / New account" : "01 / Account access"}</span>
          </div>

          <div className="mt-10 grid grid-cols-12 gap-x-6 gap-y-10 sm:mt-14">
            <div className="col-span-12 lg:col-span-5">
              <AnimatePresence initial={false} mode="wait">
                <motion.div
                  key={mode}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                >
                  <h1
                    id={`${uid}-title`}
                    className="text-[clamp(2.25rem,1.5rem+3vw,3.75rem)] leading-[1] font-semibold tracking-[-0.035em] text-balance"
                  >
                    {headline}
                  </h1>
                  <p className="mt-5 max-w-[30rem] text-base leading-relaxed text-pretty text-(--iu-muted)">
                    {subline}
                  </p>
                </motion.div>
              </AnimatePresence>
              <dl className="mt-10 hidden border-t border-(--iu-border) lg:block">
                {facts.map((fact, index) => (
                  <div
                    key={fact.label}
                    className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-(--iu-border) py-[calc(12px*var(--iu-density))]"
                  >
                    <dt className={cx("flex items-baseline gap-4", LABEL)}>
                      <span aria-hidden="true" className="w-6 font-mono tabular-nums">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      {fact.label}
                    </dt>
                    <dd className="text-sm tabular-nums">{fact.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="col-span-12 lg:col-span-6 lg:col-start-7">
              <div className="rounded-[min(var(--iu-radius),6px)] border border-(--iu-border) bg-(--iu-surface) dark:border-(--iu-foreground)/12">
                {status === "success" ? (
                  <SuccessPanel
                    signUp={signUp}
                    email={values.email.trim() || "you@company.com"}
                    brand={brand}
                    onContinue={onContinue}
                    onResend={onResend}
                    uid={uid}
                  />
                ) : (
                  <>
                    <div
                      role="tablist"
                      aria-label="Account access"
                      className="grid grid-cols-2 border-b border-(--iu-border)"
                    >
                      {(["sign-in", "sign-up"] as const).map((tab, index) => {
                        const selected = tab === mode;
                        return (
                          <button
                            key={tab}
                            ref={(node) => {
                              tabRefs.current[index] = node;
                            }}
                            type="button"
                            role="tab"
                            id={`${uid}-tab-${tab}`}
                            aria-selected={selected}
                            aria-controls={`${uid}-panel`}
                            tabIndex={selected ? 0 : -1}
                            disabled={busy}
                            onClick={() => switchMode(tab)}
                            onKeyDown={onTabKey}
                            className={cx(
                              "relative flex h-12 items-center gap-3 px-4 text-left text-sm font-medium transition-colors duration-150 motion-reduce:transition-none sm:px-6",
                              FOCUS,
                              "focus-visible:-outline-offset-2",
                              selected
                                ? "text-(--iu-foreground)"
                                : "text-(--iu-muted) pointer-fine:hover:text-(--iu-foreground)",
                            )}
                          >
                            <span className="font-mono text-[11px] tabular-nums">{`0${index + 1}`}</span>
                            {tab === "sign-in" ? "Sign in" : "Create account"}
                            {selected ? (
                              <motion.span
                                layoutId={`${uid}-tab-marker`}
                                aria-hidden="true"
                                className="absolute inset-x-0 -bottom-px h-0.5 bg-(--iu-accent)"
                              />
                            ) : null}
                          </button>
                        );
                      })}
                    </div>

                    <div
                      role="tabpanel"
                      id={`${uid}-panel`}
                      aria-labelledby={`${uid}-tab-${mode}`}
                      className="px-4 py-[calc(24px*var(--iu-density))] sm:px-8 sm:py-[calc(32px*var(--iu-density))]"
                    >
                      <div className="grid grid-cols-2 gap-3">
                        {(
                          [
                            ["google", "Google", GoogleMark],
                            ["github", "GitHub", GitHubMark],
                          ] as const
                        ).map(([provider, label, Mark]) => (
                          <button
                            key={provider}
                            type="button"
                            disabled={busy}
                            onClick={() => onSocial?.(provider, mode)}
                            className={cx(
                              "inline-flex h-11 items-center justify-center gap-2 rounded-[min(var(--iu-radius),6px)] border border-(--iu-foreground)/20 text-sm font-medium transition-colors duration-150 disabled:opacity-60 motion-reduce:transition-none pointer-fine:hover:bg-(--iu-foreground)/5",
                              FOCUS,
                            )}
                          >
                            <Mark />
                            <span>
                              <span className="sr-only">{signUp ? "Sign up with " : "Continue with "}</span>
                              {label}
                            </span>
                          </button>
                        ))}
                      </div>

                      <div className="my-6 flex items-center gap-3" aria-hidden="true">
                        <span className="h-px flex-1 bg-(--iu-border)" />
                        <span className={LABEL}>or with email</span>
                        <span className="h-px flex-1 bg-(--iu-border)" />
                      </div>

                      {status === "error" ? (
                        <div
                          role="alert"
                          className="mb-5 flex items-start gap-3 border-l-2 border-red-600 bg-red-600/5 px-3 py-3 text-sm text-red-800 dark:border-red-400 dark:bg-red-400/10 dark:text-red-200"
                        >
                          <CircleAlert size={16} strokeWidth={1.5} aria-hidden="true" className="mt-0.5 shrink-0" />
                          <p className="text-pretty">{message}</p>
                        </div>
                      ) : null}

                      <form noValidate onSubmit={submit}>
                        <fieldset disabled={busy} className="grid gap-[calc(20px*var(--iu-density))]">
                          <legend className="sr-only">
                            {signUp ? "Create an account with email" : "Sign in with email"}
                          </legend>
                          {signUp ? (
                            <div>
                              <label htmlFor={`${uid}-name`} className="mb-2 block text-sm font-medium">
                                Full name
                              </label>
                              <input
                                ref={nameRef}
                                {...field("name")}
                                type="text"
                                autoComplete="name"
                                placeholder="Ines Carvalho"
                                className={cx(inputClass, borderFor("name"))}
                              />
                              {fieldError("name")}
                            </div>
                          ) : null}

                          <div>
                            <label htmlFor={`${uid}-email`} className="mb-2 block text-sm font-medium">
                              Work email
                            </label>
                            <div className="relative">
                              <input
                                ref={emailRef}
                                {...field("email")}
                                type="email"
                                inputMode="email"
                                autoComplete="email"
                                placeholder="ines@northwind-labs.com"
                                className={cx(inputClass, "pr-10", borderFor("email"))}
                              />
                              {touched.email && !errors.email ? (
                                <Check
                                  size={16}
                                  strokeWidth={1.75}
                                  aria-hidden="true"
                                  className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-(--iu-foreground)"
                                />
                              ) : null}
                            </div>
                            {fieldError("email")}
                          </div>

                          <div>
                            <div className="mb-2 flex items-baseline justify-between gap-4">
                              <label htmlFor={`${uid}-password`} className="block text-sm font-medium">
                                Password
                              </label>
                              {!signUp ? (
                                <button
                                  type="button"
                                  onClick={() => onForgotPassword?.(values.email.trim())}
                                  className={cx(
                                    "-my-1 rounded-[min(var(--iu-radius),6px)] py-1 text-[13px] text-(--iu-muted) underline decoration-(--iu-foreground)/25 underline-offset-4 pointer-fine:hover:text-(--iu-foreground)",
                                    FOCUS,
                                  )}
                                >
                                  Forgot password?
                                </button>
                              ) : null}
                            </div>
                            <div className="relative">
                              <input
                                ref={passwordRef}
                                {...field("password")}
                                aria-describedby={
                                  [shown("password") ? `${uid}-password-error` : "", signUp ? `${uid}-rules` : ""]
                                    .filter(Boolean)
                                    .join(" ") || undefined
                                }
                                type={showPassword ? "text" : "password"}
                                autoComplete={signUp ? "new-password" : "current-password"}
                                className={cx(inputClass, "pr-12 font-mono tracking-wide", borderFor("password"))}
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword((value) => !value)}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                                aria-pressed={showPassword}
                                aria-controls={`${uid}-password`}
                                className={cx(
                                  "absolute top-1/2 right-1 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-[min(var(--iu-radius),6px)] text-(--iu-muted) pointer-fine:hover:text-(--iu-foreground)",
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
                            {fieldError("password")}

                            {signUp ? (
                              <div id={`${uid}-rules`} className="mt-4">
                                <div aria-hidden="true" className="grid grid-cols-12 gap-0.5">
                                  {Array.from({ length: TARGET_LENGTH }, (_, index) => (
                                    <span
                                      key={index}
                                      className={cx(
                                        "h-1.5 transition-colors duration-150 motion-reduce:transition-none",
                                        index < filled ? "bg-(--iu-foreground)" : "bg-(--iu-foreground)/12",
                                      )}
                                    />
                                  ))}
                                </div>
                                <div className="mt-2 flex items-baseline justify-between font-mono text-[11px] text-(--iu-muted) tabular-nums">
                                  <span>
                                    {String(values.password.length).padStart(2, "0")} / {TARGET_LENGTH} characters
                                  </span>
                                  <span aria-live="polite">
                                    {metCount === 3 ? "Strong" : metCount === 2 ? "Fair" : "Weak"} · {metCount}/3
                                  </span>
                                </div>
                                <ul className="mt-3 border-t border-(--iu-border)">
                                  {rules.map((rule, index) => (
                                    <li
                                      key={rule.label}
                                      className={cx(
                                        "grid grid-cols-[2rem_1fr_auto] items-center border-b border-(--iu-border) py-2 text-[13px] transition-colors duration-150 motion-reduce:transition-none",
                                        rule.met ? "text-(--iu-foreground)" : "text-(--iu-muted)",
                                      )}
                                    >
                                      <span aria-hidden="true" className="font-mono text-[11px] tabular-nums">
                                        {`0${index + 1}`}
                                      </span>
                                      <span>{rule.label}</span>
                                      {rule.met ? (
                                        <Check size={14} strokeWidth={1.75} aria-hidden="true" />
                                      ) : (
                                        <Minus size={14} strokeWidth={1.5} aria-hidden="true" />
                                      )}
                                      <span className="sr-only">{rule.met ? ", met" : ", not met yet"}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ) : null}
                          </div>

                          <button
                            type="submit"
                            aria-busy={busy || undefined}
                            className={cx(
                              "group mt-1 inline-flex h-11 w-full items-center justify-center gap-2 rounded-[min(var(--iu-radius),6px)] bg-(--iu-foreground) px-5 text-sm font-medium text-(--iu-background) transition-colors duration-150 disabled:cursor-progress motion-reduce:transition-none pointer-fine:hover:bg-[color-mix(in_oklab,var(--iu-foreground)_84%,var(--iu-background))]",
                              FOCUS,
                            )}
                          >
                            {busy ? (
                              <>
                                <LoaderCircle
                                  size={16}
                                  strokeWidth={1.5}
                                  aria-hidden="true"
                                  className="animate-spin motion-reduce:animate-none"
                                />
                                {loadingLabel}
                              </>
                            ) : (
                              <>
                                {primaryLabel}
                                <ArrowRight
                                  size={16}
                                  strokeWidth={1.5}
                                  aria-hidden="true"
                                  className="transition-transform duration-150 motion-reduce:transition-none pointer-fine:group-hover:translate-x-0.5"
                                />
                              </>
                            )}
                          </button>
                          <span aria-live="polite" className="sr-only">
                            {busy ? `${loadingLabel}…` : ""}
                          </span>
                        </fieldset>
                      </form>

                      <p className="mt-6 text-[13px] leading-relaxed text-pretty text-(--iu-muted)">
                        {signUp
                          ? "By creating an account you agree to the Terms and the Data Processing Addendum. "
                          : "Your company uses SAML? "}
                        <button
                          type="button"
                          onClick={onSso}
                          className={cx(
                            "rounded-[min(var(--iu-radius),6px)] text-(--iu-foreground) underline decoration-(--iu-foreground)/30 underline-offset-4",
                            FOCUS,
                          )}
                        >
                          {signUp ? "Joining an existing team?" : "Use single sign-on"}
                        </button>
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </MotionConfig>
  );
}

function SuccessPanel({
  signUp,
  email,
  brand,
  onContinue,
  onResend,
  uid,
}: {
  signUp: boolean;
  email: string;
  brand: string;
  onContinue?: () => void;
  onResend?: (email: string) => void;
  uid: string;
}) {
  return (
    <div role="status" aria-labelledby={`${uid}-done`} className="px-4 py-10 sm:px-8 sm:py-12">
      <div className={cx("flex items-center justify-between border-b border-(--iu-border) pb-3", LABEL)}>
        <span>{signUp ? "03 / Verify email" : "02 / Signed in"}</span>
        <span className="font-mono tabular-nums">{signUp ? "Link expires in 30 min" : "Session 30 days"}</span>
      </div>
      <span
        className="mt-8 flex size-11 items-center justify-center rounded-[min(var(--iu-radius),6px)] bg-(--iu-accent) text-(--iu-accent-foreground)"
        aria-hidden="true"
      >
        <Check size={20} strokeWidth={2} />
      </span>
      <h2 id={`${uid}-done`} className="mt-6 text-[28px] leading-tight font-semibold tracking-[-0.03em] text-balance">
        {signUp ? "Check your inbox." : `Welcome back to ${brand}.`}
      </h2>
      <p className="mt-3 max-w-[28rem] text-[15px] leading-relaxed text-pretty text-(--iu-muted)">
        {signUp ? (
          <>
            We sent a confirmation link to <span className="font-medium break-all text-(--iu-foreground)">{email}</span>
            . Open it on this device to finish setting up.
          </>
        ) : (
          <>
            Signed in as <span className="font-medium break-all text-(--iu-foreground)">{email}</span>. Your three
            workspaces are ready.
          </>
        )}
      </p>
      <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
        {signUp ? (
          <button
            type="button"
            onClick={() => onResend?.(email)}
            className={cx(
              "inline-flex h-11 items-center gap-2 rounded-[min(var(--iu-radius),6px)] border border-(--iu-foreground)/35 px-5 text-sm font-medium pointer-fine:hover:bg-(--iu-foreground)/5",
              FOCUS,
            )}
          >
            Resend email
          </button>
        ) : (
          <button
            type="button"
            onClick={onContinue}
            className={cx(
              "group inline-flex h-11 items-center gap-2 rounded-[min(var(--iu-radius),6px)] bg-(--iu-foreground) px-5 text-sm font-medium text-(--iu-background)",
              FOCUS,
            )}
          >
            Open workspace
            <ArrowRight size={16} strokeWidth={1.5} aria-hidden="true" />
          </button>
        )}
        <span className="text-[13px] text-(--iu-muted)">
          {signUp ? "Nothing yet? Check spam, then resend." : "Not you? Sign out from Settings."}
        </span>
      </div>
    </div>
  );
}

export default RuledSignIn;
