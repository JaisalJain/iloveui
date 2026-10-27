"use client";

import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent, type RefObject } from "react";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowRight, Check, CircleAlert, Eye, EyeOff, Plus, X } from "lucide-react";

export type HopscotchTeam = "product" | "design" | "engineering" | "agency";
export type HopscotchTemplate = "blank" | "sprint" | "launch";
export type HopscotchValues = {
  name: string;
  email: string;
  password: string;
  workspace: string;
  team: HopscotchTeam | "";
  invites: string[];
  template: HopscotchTemplate;
  mondayDigest: boolean;
};

export type HopscotchOnboardingProps = {
  brand?: string;
  /** 0 Account, 1 Workspace, 2 Team, 3 Preferences. */
  defaultStep?: 0 | 1 | 2 | 3;
  defaultValues?: Partial<HopscotchValues>;
  /** Controlled status for the final submit; leave at "idle" to track the promise returned by onComplete. */
  status?: "idle" | "loading" | "error" | "success";
  errorMessage?: string;
  /** Called on Finish with every answer. Return a promise for loading, error and success states. */
  onComplete?: (values: HopscotchValues) => void | Promise<void>;
  onSocial?: (provider: "google" | "github") => void;
  onStepChange?: (step: number) => void;
  onOpenBoard?: () => void;
  className?: string;
};

const STEPS = [
  { label: "Account", minutes: "about 2 min left" },
  { label: "Workspace", minutes: "about 90 sec left" },
  { label: "Team", minutes: "about 1 min left" },
  { label: "Preferences", minutes: "last one" },
] as const;

const TEAMS: Array<{ value: HopscotchTeam; label: string }> = [
  { value: "product", label: "Product" },
  { value: "design", label: "Design" },
  { value: "engineering", label: "Engineering" },
  { value: "agency", label: "Agency" },
];

const TEMPLATES: Array<{ value: HopscotchTemplate; label: string; hint: string }> = [
  { value: "blank", label: "Blank board", hint: "Start from a clean grid" },
  { value: "sprint", label: "Sprint plan", hint: "Three lanes, two weeks" },
  { value: "launch", label: "Launch checklist", hint: "24 tasks, pre-sorted" },
];

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function slugify(text: string) {
  return (
    text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 32) || "your-team"
  );
}

function initials(text: string) {
  const local = text.split("@")[0] ?? text;
  const parts = local.split(/[._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? parts[0]?.[1] ?? "")).toUpperCase();
}

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--iu-accent)";
const INPUT =
  "h-12 w-full rounded-[max(var(--iu-radius),14px)] border-2 bg-(--iu-surface) px-4 text-[15px] font-medium text-(--iu-foreground) transition-colors duration-150 placeholder:font-normal placeholder:text-(--iu-muted) disabled:opacity-60 motion-reduce:transition-none " +
  FOCUS;
const PRIMARY =
  "inline-flex h-12 min-w-36 items-center justify-center gap-2 rounded-full border-2 border-(--iu-foreground) bg-(--iu-accent) px-6 text-[15px] font-bold text-(--iu-accent-foreground) shadow-[0_4px_0_var(--iu-foreground)] transition-[transform,box-shadow] duration-100 active:translate-y-1 active:shadow-[0_0_0_var(--iu-foreground)] disabled:cursor-progress motion-reduce:transition-none " +
  FOCUS;
const SECONDARY =
  "inline-flex h-12 items-center justify-center gap-2 rounded-full px-4 text-[15px] font-semibold text-(--iu-foreground) transition-colors duration-150 disabled:opacity-50 motion-reduce:transition-none pointer-fine:hover:bg-(--iu-foreground)/6 " +
  FOCUS;

function GoogleMark() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.19-1.79 4.13-1.15 1.15-2.93 2.4-6.05 2.4-4.83 0-8.6-3.89-8.6-8.72s3.77-8.72 8.6-8.72c2.6 0 4.51 1.03 5.91 2.35l2.31-2.31C18.75 1.44 16.13 0 12.48 0 5.87 0 .31 5.39.31 12s5.56 12 12.17 12c3.57 0 6.27-1.17 8.37-3.36 2.16-2.16 2.84-5.21 2.84-7.67 0-.76-.05-1.47-.17-2.05H12.48z" />
    </svg>
  );
}

function GitHubMark() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 .3a12 12 0 0 0-3.8 23.38c.6.12.83-.26.83-.57l-.02-2.04c-3.34.72-4.04-1.61-4.04-1.61-.55-1.39-1.33-1.76-1.33-1.76-1.09-.74.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.83 2.8 1.3 3.49 1 .1-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.14-.3-.54-1.52.1-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.28-1.55 3.29-1.23 3.29-1.23.64 1.66.24 2.88.12 3.18a4.65 4.65 0 0 1 1.23 3.22c0 4.61-2.8 5.63-5.48 5.92.43.37.82 1.1.82 2.22l-.01 3.29c0 .32.21.69.82.57A12 12 0 0 0 12 .3" />
    </svg>
  );
}

function TemplateArt({ kind }: { kind: HopscotchTemplate }) {
  const stroke = "var(--iu-foreground)";
  return (
    <svg aria-hidden="true" viewBox="0 0 96 56" className="h-14 w-full">
      <rect x="1" y="1" width="94" height="54" rx="10" fill="var(--iu-background)" stroke={stroke} strokeWidth="2" />
      {kind === "blank"
        ? Array.from({ length: 4 }, (_, row) =>
            Array.from({ length: 7 }, (_, col) => (
              <circle key={`${row}-${col}`} cx={18 + col * 10} cy={14 + row * 9} r="1.4" fill={stroke} opacity="0.35" />
            )),
          )
        : null}
      {kind === "sprint"
        ? [0, 1, 2].map((lane) => (
            <g key={lane}>
              <rect x={10 + lane * 27} y="10" width="22" height="6" rx="3" fill={stroke} opacity="0.8" />
              {Array.from({ length: 3 - lane }, (_, card) => (
                <rect
                  key={card}
                  x={10 + lane * 27}
                  y={20 + card * 10}
                  width="22"
                  height="7"
                  rx="3"
                  fill={lane === 0 && card === 0 ? "var(--iu-accent)" : stroke}
                  opacity={lane === 0 && card === 0 ? 1 : 0.25}
                />
              ))}
            </g>
          ))
        : null}
      {kind === "launch"
        ? [0, 1, 2].map((row) => (
            <g key={row}>
              <rect
                x="12"
                y={11 + row * 12}
                width="8"
                height="8"
                rx="2.5"
                fill={row === 0 ? "var(--iu-accent)" : "none"}
                stroke={stroke}
                strokeWidth="1.5"
              />
              <rect
                x="26"
                y={13 + row * 12}
                width={row === 1 ? 44 : 56}
                height="4"
                rx="2"
                fill={stroke}
                opacity="0.3"
              />
            </g>
          ))
        : null}
    </svg>
  );
}

export function HopscotchOnboarding({
  brand = "Hopscotch",
  defaultStep = 0,
  defaultValues,
  status: statusProp = "idle",
  errorMessage,
  onComplete,
  onSocial,
  onStepChange,
  onOpenBoard,
  className = "",
}: HopscotchOnboardingProps) {
  const reduceMotion = useReducedMotion();
  const uid = useId();
  const [step, setStep] = useState<number>(defaultStep);
  const [direction, setDirection] = useState(1);
  const [values, setValues] = useState<HopscotchValues>({
    name: "",
    email: "",
    password: "",
    workspace: "",
    team: "",
    invites: [],
    template: "sprint",
    mondayDigest: true,
    ...defaultValues,
  });
  const [errors, setErrors] = useState<
    Partial<Record<"name" | "email" | "password" | "workspace" | "team" | "invite", string>>
  >({});
  const [inviteDraft, setInviteDraft] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [internal, setInternal] = useState<{ status: "idle" | "loading" | "error" | "success"; message?: string }>({
    status: "idle",
  });
  const [hopped, setHopped] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);
  const [successAtMount] = useState(statusProp === "success");

  const status = statusProp !== "idle" ? statusProp : internal.status;
  const busy = status === "loading";
  const done = status === "success";
  const message =
    statusProp === "error"
      ? (errorMessage ?? `We couldn't save ${values.workspace || "your workspace"}. Your answers are kept; try again.`)
      : (internal.message ?? "We couldn't save your workspace. Your answers are kept; try again.");

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [step, done]);

  function set<K extends keyof HopscotchValues>(key: K, value: HopscotchValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (key in errors) setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function check(key: "name" | "email" | "password" | "workspace" | "team") {
    const v = values;
    switch (key) {
      case "name":
        return v.name.trim() ? "" : "What should your teammates call you?";
      case "email":
        return !v.email.trim()
          ? "We need an email to save your progress."
          : EMAIL.test(v.email.trim())
            ? ""
            : "Almost: that email is missing a part. Try dana@studio.com.";
      case "password":
        return v.password.length >= 8
          ? ""
          : `${8 - v.password.length} more character${8 - v.password.length === 1 ? "" : "s"} to go.`;
      case "workspace":
        return v.workspace.trim().length >= 2 ? "" : "Give your workspace a name, two letters or more.";
      case "team":
        return v.team ? "" : "Pick the closest fit; you can change it later.";
    }
  }

  function blur(key: "name" | "email" | "password" | "workspace") {
    if (!values[key]) return;
    setErrors((prev) => ({ ...prev, [key]: check(key) || undefined }));
  }

  function go(next: number) {
    if (next < 0 || next > 3 || busy) return;
    setDirection(next > step ? 1 : -1);
    setHopped(true);
    setStep(next);
    onStepChange?.(next);
  }

  async function advance(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const fields = ([["name", "email", "password"], ["workspace", "team"], [], []] as const)[step] ?? [];
    const found: typeof errors = {};
    for (const key of fields) {
      const problem = check(key);
      if (problem) found[key] = problem;
    }
    setErrors((prev) => ({ ...prev, ...found }));
    const first = fields.find((key) => found[key]);
    if (first) {
      document.getElementById(`${uid}-${first}`)?.focus();
      return;
    }
    if (step < 3) return go(step + 1);
    const result = onComplete?.(values);
    if (!result || typeof (result as Promise<void>).then !== "function") {
      setInternal({ status: "success" });
      return;
    }
    setInternal({ status: "loading" });
    try {
      await result;
      setInternal({ status: "success" });
    } catch (error) {
      setInternal({ status: "error", message: error instanceof Error ? error.message : undefined });
    }
  }

  function addInvite() {
    const email = inviteDraft.trim().toLowerCase();
    if (!email) return;
    if (!EMAIL.test(email)) return setErrors((prev) => ({ ...prev, invite: `"${email}" isn't a full email address.` }));
    if (values.invites.includes(email))
      return setErrors((prev) => ({ ...prev, invite: `${email} is already on the list.` }));
    if (values.invites.length >= 8)
      return setErrors((prev) => ({ ...prev, invite: "Eight at a time; add more later." }));
    set("invites", [...values.invites, email]);
    setInviteDraft("");
    setErrors((prev) => ({ ...prev, invite: undefined }));
  }

  function onInviteKey(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addInvite();
    }
  }

  const errorText = (key: keyof typeof errors) =>
    errors[key] ? (
      <p
        id={`${uid}-${key}-error`}
        className="mt-2 flex items-start gap-1.5 text-[13px] font-medium text-red-700 dark:text-red-300"
      >
        <CircleAlert size={14} strokeWidth={2} aria-hidden="true" className="mt-0.5 shrink-0" />
        {errors[key]}
      </p>
    ) : null;
  const fieldProps = (key: "name" | "email" | "password" | "workspace") => ({
    id: `${uid}-${key}`,
    value: values[key],
    onChange: (event: { target: { value: string } }) => set(key, event.target.value),
    onBlur: () => blur(key),
    "aria-invalid": errors[key] ? true : undefined,
    "aria-describedby": errors[key] ? `${uid}-${key}-error` : undefined,
    className: cx(
      INPUT,
      errors[key]
        ? "border-red-600 dark:border-red-400"
        : "border-(--iu-foreground)/40 pointer-fine:hover:border-(--iu-foreground)/70",
    ),
  });

  const label = "mb-2 block text-sm font-bold";
  const headings = [
    { title: "First, who's hopping in?", body: `Make your ${brand} account. Takes about as long as a coffee order.` },
    {
      title: "Name your workspace.",
      body: "This is where your boards, docs and people live. You can rename it any time.",
    },
    { title: "Bring a few friends.", body: "Boards are better with company. Invites go out when you finish." },
    {
      title: "Make it yours.",
      body: "Pick a first board and how loud we should be. Everything here can change later.",
    },
  ];
  const current = headings[step] ?? headings[0]!;
  const slide = reduceMotion ? 0 : 24;

  return (
    <MotionConfig
      reducedMotion="user"
      transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 400, damping: 30 }}
    >
      <div
        className={cx(
          "@container mx-auto w-full max-w-xl font-(family-name:--iu-font) text-(--iu-foreground)",
          className,
        )}
      >
        <div className="relative rounded-[max(var(--iu-radius),24px)] border-2 border-(--iu-foreground) bg-(--iu-surface) shadow-[8px_8px_0_color-mix(in_oklab,var(--iu-accent)_32%,transparent)] dark:shadow-[8px_8px_0_color-mix(in_oklab,var(--iu-accent)_45%,transparent)]">
          {/* Progress: numbered tiles with a token that hops between them. */}
          <nav
            aria-label="Setup progress"
            className="border-b-2 border-(--iu-foreground) px-5 pt-5 pb-4 @md:px-8 @md:pt-7"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-[15px] font-extrabold tracking-[-0.02em]">{brand}</span>
              <span className="inline-block -rotate-3 rounded-full border-2 border-(--iu-foreground) bg-[color-mix(in_oklab,var(--iu-accent)_18%,var(--iu-surface))] px-3 py-1 text-xs font-bold whitespace-nowrap tabular-nums">
                {done ? "all done" : STEPS[step]?.minutes}
              </span>
            </div>
            <ol className="relative mt-5 grid grid-cols-4">
              <span
                aria-hidden="true"
                className="absolute top-5 right-[12.5%] left-[12.5%] border-t-2 border-dashed border-(--iu-foreground)/35"
              />
              <motion.span
                aria-hidden="true"
                initial={false}
                animate={{ x: `${(done ? 3 : step) * 100}%` }}
                transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 400, damping: 22 }}
                className="pointer-events-none absolute top-0 left-0 flex h-10 w-1/4 justify-center"
              >
                <motion.span
                  key={done ? "done" : step}
                  initial={hopped && !reduceMotion ? { y: -14, scale: 0.9 } : false}
                  animate={{ y: 0, scale: 1 }}
                  transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 400, damping: 15 }}
                  className="size-10 rounded-[max(var(--iu-radius),14px)] border-2 border-(--iu-foreground) bg-(--iu-accent) shadow-[0_3px_0_var(--iu-foreground)]"
                />
              </motion.span>
              {STEPS.map((item, index) => {
                const complete = done || index < step;
                const active = !done && index === step;
                return (
                  <li key={item.label} className="relative flex flex-col items-center gap-2">
                    <button
                      type="button"
                      onClick={() => go(index)}
                      disabled={!complete || busy || done}
                      aria-current={active ? "step" : undefined}
                      aria-label={`Step ${index + 1}, ${item.label}${complete ? ", done" : active ? ", current" : ""}`}
                      className={cx(
                        "relative flex size-10 items-center justify-center rounded-[max(var(--iu-radius),14px)] text-sm font-extrabold tabular-nums transition-colors duration-150 disabled:cursor-default motion-reduce:transition-none",
                        FOCUS,
                        active
                          ? "text-(--iu-accent-foreground)"
                          : complete
                            ? "border-2 border-(--iu-foreground) bg-(--iu-foreground) text-(--iu-background)"
                            : "border-2 border-(--iu-foreground)/35 bg-(--iu-surface) text-(--iu-muted)",
                        complete && !done ? "pointer-fine:hover:-rotate-6" : "",
                      )}
                    >
                      {complete && !active ? <Check size={18} strokeWidth={3} aria-hidden="true" /> : index + 1}
                    </button>
                    <span
                      aria-hidden="true"
                      className={cx(
                        "hidden text-xs font-bold @sm:block",
                        active || complete ? "text-(--iu-foreground)" : "text-(--iu-muted)",
                      )}
                    >
                      {item.label}
                    </span>
                  </li>
                );
              })}
            </ol>
            <p className="mt-3 text-center text-xs font-bold text-(--iu-muted) tabular-nums @sm:sr-only">
              {done ? "Setup complete" : `Step ${step + 1} of 4 · ${STEPS[step]?.label}`}
            </p>
          </nav>

          <div className="overflow-hidden px-5 py-[calc(24px*var(--iu-density))] @md:px-8 @md:py-[calc(32px*var(--iu-density))]">
            <AnimatePresence initial={false} mode="wait" custom={direction}>
              {done ? (
                <Finished
                  key="done"
                  values={values}
                  brand={brand}
                  animate={!successAtMount && !reduceMotion}
                  headingRef={headingRef}
                  onOpenBoard={onOpenBoard}
                  uid={uid}
                />
              ) : (
                <motion.form
                  key={step}
                  noValidate
                  onSubmit={advance}
                  initial={{ x: direction * slide, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -direction * slide, opacity: 0 }}
                  transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 400, damping: 30 }}
                  aria-labelledby={`${uid}-heading`}
                >
                  <h2
                    id={`${uid}-heading`}
                    ref={headingRef}
                    tabIndex={-1}
                    className="text-[28px] leading-[1.1] font-extrabold tracking-[-0.03em] text-balance outline-none @md:text-[32px]"
                  >
                    {current.title}
                  </h2>
                  <p className="mt-2 text-[15px] leading-relaxed text-pretty text-(--iu-muted)">{current.body}</p>

                  <fieldset disabled={busy} className="mt-6 grid gap-[calc(16px*var(--iu-density))]">
                    <legend className="sr-only">{STEPS[step]?.label}</legend>

                    {step === 0 ? (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          {(
                            [
                              ["google", "Google", GoogleMark],
                              ["github", "GitHub", GitHubMark],
                            ] as const
                          ).map(([provider, name, Mark]) => (
                            <button
                              key={provider}
                              type="button"
                              onClick={() => {
                                onSocial?.(provider);
                                go(1);
                              }}
                              className={cx(
                                "inline-flex h-12 items-center justify-center gap-2 rounded-full border-2 border-(--iu-foreground) bg-(--iu-surface) text-[15px] font-bold shadow-[0_3px_0_var(--iu-foreground)] transition-[transform,box-shadow] duration-100 active:translate-y-[3px] active:shadow-[0_0_0_var(--iu-foreground)] motion-reduce:transition-none",
                                FOCUS,
                              )}
                            >
                              <Mark />
                              <span>
                                <span className="sr-only">Continue with </span>
                                {name}
                              </span>
                            </button>
                          ))}
                        </div>
                        <div aria-hidden="true" className="flex items-center gap-3 text-xs font-bold text-(--iu-muted)">
                          <span className="h-0.5 flex-1 rounded-full bg-(--iu-foreground)/15" />
                          or use email
                          <span className="h-0.5 flex-1 rounded-full bg-(--iu-foreground)/15" />
                        </div>
                        <div>
                          <label htmlFor={`${uid}-name`} className={label}>
                            Your name
                          </label>
                          <input {...fieldProps("name")} type="text" autoComplete="name" placeholder="Dana Okoye" />
                          {errorText("name")}
                        </div>
                        <div>
                          <label htmlFor={`${uid}-email`} className={label}>
                            Email
                          </label>
                          <input
                            {...fieldProps("email")}
                            type="email"
                            inputMode="email"
                            autoComplete="email"
                            placeholder="dana@fieldnote.studio"
                          />
                          {errorText("email")}
                        </div>
                        <div>
                          <label htmlFor={`${uid}-password`} className={label}>
                            Password <span className="font-medium text-(--iu-muted)">(8+ characters)</span>
                          </label>
                          <div className="relative">
                            <input
                              {...fieldProps("password")}
                              type={showPassword ? "text" : "password"}
                              autoComplete="new-password"
                              className={cx(fieldProps("password").className, "pr-14")}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword((value) => !value)}
                              aria-label={showPassword ? "Hide password" : "Show password"}
                              aria-pressed={showPassword}
                              aria-controls={`${uid}-password`}
                              className={cx(
                                "absolute top-1/2 right-1.5 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-full text-(--iu-muted) pointer-fine:hover:bg-(--iu-foreground)/6 pointer-fine:hover:text-(--iu-foreground)",
                                FOCUS,
                              )}
                            >
                              {showPassword ? (
                                <EyeOff size={18} strokeWidth={2} aria-hidden="true" />
                              ) : (
                                <Eye size={18} strokeWidth={2} aria-hidden="true" />
                              )}
                            </button>
                          </div>
                          {errorText("password")}
                        </div>
                      </>
                    ) : null}

                    {step === 1 ? (
                      <>
                        <div>
                          <label htmlFor={`${uid}-workspace`} className={label}>
                            Workspace name
                          </label>
                          <input
                            {...fieldProps("workspace")}
                            type="text"
                            autoComplete="organization"
                            placeholder="Fieldnote Studio"
                          />
                          {errorText("workspace") ?? (
                            <p className="mt-2 truncate font-mono text-[13px] text-(--iu-muted)">
                              hopscotch.so/
                              <span className="font-semibold text-(--iu-foreground)">{slugify(values.workspace)}</span>
                            </p>
                          )}
                        </div>
                        <div
                          role="radiogroup"
                          aria-labelledby={`${uid}-team-label`}
                          aria-describedby={errors.team ? `${uid}-team-error` : undefined}
                        >
                          <span id={`${uid}-team-label`} className={label}>
                            What kind of team?
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {TEAMS.map((team, index) => {
                              const checked = values.team === team.value;
                              return (
                                <label key={team.value} className="relative">
                                  <input
                                    id={index === 0 ? `${uid}-team` : undefined}
                                    type="radio"
                                    name={`${uid}-team`}
                                    value={team.value}
                                    checked={checked}
                                    onChange={() => set("team", team.value)}
                                    className="peer sr-only"
                                  />
                                  <span
                                    className={cx(
                                      "inline-flex h-11 cursor-pointer items-center gap-1.5 rounded-full border-2 px-4 text-sm font-bold transition-[transform,background-color] duration-150 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-(--iu-accent) motion-reduce:transition-none",
                                      checked
                                        ? "-rotate-2 border-(--iu-foreground) bg-(--iu-foreground) text-(--iu-background)"
                                        : "border-(--iu-foreground)/40 pointer-fine:hover:border-(--iu-foreground)",
                                    )}
                                  >
                                    {checked ? <Check size={16} strokeWidth={3} aria-hidden="true" /> : null}
                                    {team.label}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                          {errorText("team")}
                        </div>
                      </>
                    ) : null}

                    {step === 2 ? (
                      <>
                        <div>
                          <label htmlFor={`${uid}-invite`} className={label}>
                            Teammate emails
                          </label>
                          <div className="flex gap-2">
                            <input
                              id={`${uid}-invite`}
                              type="email"
                              inputMode="email"
                              value={inviteDraft}
                              onChange={(event) => {
                                setInviteDraft(event.target.value);
                                if (errors.invite) setErrors((prev) => ({ ...prev, invite: undefined }));
                              }}
                              onKeyDown={onInviteKey}
                              placeholder="theo@fieldnote.studio"
                              aria-invalid={errors.invite ? true : undefined}
                              aria-describedby={errors.invite ? `${uid}-invite-error` : `${uid}-invite-hint`}
                              className={cx(
                                INPUT,
                                "min-w-0 flex-1",
                                errors.invite
                                  ? "border-red-600 dark:border-red-400"
                                  : "border-(--iu-foreground)/40 pointer-fine:hover:border-(--iu-foreground)/70",
                              )}
                            />
                            <button
                              type="button"
                              onClick={addInvite}
                              aria-label="Add teammate"
                              className={cx(
                                "inline-flex size-12 shrink-0 items-center justify-center rounded-full border-2 border-(--iu-foreground) bg-(--iu-surface) shadow-[0_3px_0_var(--iu-foreground)] transition-[transform,box-shadow] duration-100 active:translate-y-[3px] active:shadow-[0_0_0_var(--iu-foreground)] motion-reduce:transition-none",
                                FOCUS,
                              )}
                            >
                              <Plus size={20} strokeWidth={2.5} aria-hidden="true" />
                            </button>
                          </div>
                          {errorText("invite") ?? (
                            <p id={`${uid}-invite-hint`} className="mt-2 text-[13px] text-(--iu-muted)">
                              Press Enter or comma to add. Up to eight for now.
                            </p>
                          )}
                        </div>
                        {values.invites.length > 0 ? (
                          <ul aria-label="Invited teammates" className="flex flex-wrap gap-2">
                            <AnimatePresence initial={false}>
                              {values.invites.map((email) => (
                                <motion.li
                                  key={email}
                                  layout
                                  initial={{ scale: 0.6, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  exit={{ scale: 0.6, opacity: 0 }}
                                  transition={
                                    reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 400, damping: 18 }
                                  }
                                  className="inline-flex max-w-full items-center gap-2 rounded-full border-2 border-(--iu-foreground) bg-[color-mix(in_oklab,var(--iu-accent)_14%,var(--iu-surface))] py-1 pr-1 pl-1"
                                >
                                  <span
                                    aria-hidden="true"
                                    className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-(--iu-foreground) text-[11px] font-extrabold text-(--iu-background)"
                                  >
                                    {initials(email)}
                                  </span>
                                  <span className="truncate text-sm font-semibold">{email}</span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      set(
                                        "invites",
                                        values.invites.filter((item) => item !== email),
                                      )
                                    }
                                    aria-label={`Remove ${email}`}
                                    className={cx(
                                      "inline-flex size-7 shrink-0 items-center justify-center rounded-full pointer-coarse:size-10 pointer-fine:hover:bg-(--iu-foreground)/10",
                                      FOCUS,
                                    )}
                                  >
                                    <X size={14} strokeWidth={2.5} aria-hidden="true" />
                                  </button>
                                </motion.li>
                              ))}
                            </AnimatePresence>
                          </ul>
                        ) : (
                          <div className="flex items-center gap-4 rounded-[max(var(--iu-radius),16px)] border-2 border-dashed border-(--iu-foreground)/30 p-4">
                            <svg aria-hidden="true" viewBox="0 0 48 48" className="size-12 shrink-0">
                              <circle
                                cx="18"
                                cy="20"
                                r="9"
                                fill="var(--iu-accent)"
                                stroke="var(--iu-foreground)"
                                strokeWidth="2"
                              />
                              <rect
                                x="24"
                                y="22"
                                width="18"
                                height="18"
                                rx="6"
                                fill="var(--iu-surface)"
                                stroke="var(--iu-foreground)"
                                strokeWidth="2"
                              />
                              <path
                                d="M33 27v8M29 31h8"
                                stroke="var(--iu-foreground)"
                                strokeWidth="2"
                                strokeLinecap="round"
                              />
                            </svg>
                            <p className="text-sm text-pretty text-(--iu-muted)">
                              No one yet. Solo is fine too: skip this and invite people from any board.
                            </p>
                          </div>
                        )}
                        <p aria-live="polite" className="sr-only">
                          {values.invites.length} teammate{values.invites.length === 1 ? "" : "s"} on the list
                        </p>
                      </>
                    ) : null}

                    {step === 3 ? (
                      <>
                        <div role="radiogroup" aria-labelledby={`${uid}-template-label`}>
                          <span id={`${uid}-template-label`} className={label}>
                            Your first board
                          </span>
                          <div className="grid grid-cols-1 gap-3 @sm:grid-cols-3">
                            {TEMPLATES.map((template) => {
                              const checked = values.template === template.value;
                              return (
                                <label key={template.value} className="relative block">
                                  <input
                                    type="radio"
                                    name={`${uid}-template`}
                                    value={template.value}
                                    checked={checked}
                                    onChange={() => set("template", template.value)}
                                    className="peer sr-only"
                                  />
                                  <span
                                    className={cx(
                                      "flex cursor-pointer items-center gap-3 rounded-[max(var(--iu-radius),16px)] border-2 p-3 transition-[transform,box-shadow,border-color] duration-150 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-(--iu-accent) motion-reduce:transition-none @sm:flex-col @sm:items-stretch",
                                      checked
                                        ? "border-(--iu-foreground) shadow-[0_4px_0_var(--iu-foreground)] @sm:-translate-y-1"
                                        : "border-(--iu-foreground)/30 pointer-fine:hover:border-(--iu-foreground)",
                                    )}
                                  >
                                    <span className="block w-24 shrink-0 @sm:w-full">
                                      <TemplateArt kind={template.value} />
                                    </span>
                                    <span className="block">
                                      <span className="flex items-center gap-1.5 text-sm font-bold">
                                        {template.label}
                                        {checked ? <Check size={14} strokeWidth={3} aria-hidden="true" /> : null}
                                      </span>
                                      <span className="mt-0.5 block text-xs text-(--iu-muted)">{template.hint}</span>
                                    </span>
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                        <label className="flex cursor-pointer items-center justify-between gap-4 rounded-[max(var(--iu-radius),16px)] border-2 border-(--iu-foreground)/30 px-4 py-3">
                          <span>
                            <span className="block text-sm font-bold">Monday morning digest</span>
                            <span className="block text-[13px] text-(--iu-muted)">
                              One email with what moved last week.
                            </span>
                          </span>
                          <input
                            type="checkbox"
                            role="switch"
                            checked={values.mondayDigest}
                            onChange={(event) => set("mondayDigest", event.target.checked)}
                            className="peer sr-only"
                          />
                          <span
                            aria-hidden="true"
                            className={cx(
                              "relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border-2 border-(--iu-foreground) transition-colors duration-150 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-(--iu-accent) motion-reduce:transition-none",
                              values.mondayDigest ? "bg-(--iu-accent)" : "bg-(--iu-foreground)/10",
                            )}
                          >
                            <motion.span
                              initial={false}
                              animate={{ x: values.mondayDigest ? 26 : 2 }}
                              transition={
                                reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 400, damping: 18 }
                              }
                              className="size-6 rounded-full border-2 border-(--iu-foreground) bg-(--iu-surface)"
                            />
                          </span>
                        </label>
                        {status === "error" ? (
                          <div
                            role="alert"
                            className="flex items-start gap-3 rounded-[max(var(--iu-radius),16px)] border-2 border-red-700 bg-red-50 px-4 py-3 text-sm font-medium text-red-800 dark:border-red-400 dark:bg-red-950 dark:text-red-200"
                          >
                            <CircleAlert size={18} strokeWidth={2} aria-hidden="true" className="mt-px shrink-0" />
                            <p className="text-pretty">{message}</p>
                          </div>
                        ) : null}
                      </>
                    ) : null}

                    <div className="mt-2 flex items-center justify-between gap-3">
                      {step > 0 ? (
                        <button type="button" onClick={() => go(step - 1)} className={SECONDARY}>
                          <ArrowLeft size={18} strokeWidth={2} aria-hidden="true" />
                          Back
                        </button>
                      ) : (
                        <span className="text-[13px] text-(--iu-muted)">Free for teams of five.</span>
                      )}
                      <div className="flex items-center gap-1">
                        {step === 2 && values.invites.length === 0 ? (
                          <button type="button" onClick={() => go(3)} className={SECONDARY}>
                            Skip
                          </button>
                        ) : null}
                        <button type="submit" aria-busy={busy || undefined} className={PRIMARY}>
                          {busy ? (
                            <>
                              <span className="sr-only">Setting up</span>
                              <span aria-hidden="true" className="flex items-center gap-1.5">
                                {[0, 1, 2].map((dot) => (
                                  <motion.span
                                    key={dot}
                                    animate={reduceMotion ? undefined : { y: [0, -5, 0] }}
                                    transition={{
                                      duration: 0.6,
                                      repeat: Infinity,
                                      delay: dot * 0.12,
                                      ease: "easeInOut",
                                    }}
                                    className="size-2 rounded-full bg-(--iu-accent-foreground)"
                                  />
                                ))}
                              </span>
                            </>
                          ) : step === 3 ? (
                            status === "error" ? (
                              "Try again"
                            ) : (
                              "Finish setup"
                            )
                          ) : (
                            <>
                              {step === 2 && values.invites.length > 0 ? `Invite ${values.invites.length}` : "Continue"}
                              <ArrowRight size={18} strokeWidth={2.5} aria-hidden="true" />
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </fieldset>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </MotionConfig>
  );
}

function Finished({
  values,
  brand,
  animate,
  headingRef,
  onOpenBoard,
  uid,
}: {
  values: HopscotchValues;
  brand: string;
  animate: boolean;
  headingRef: RefObject<HTMLHeadingElement | null>;
  onOpenBoard?: () => void;
  uid: string;
}) {
  const firstName = values.name.trim().split(/\s+/)[0] || "friend";
  const template = TEMPLATES.find((item) => item.value === values.template)?.label ?? "Sprint plan";
  const pieces = [
    { x: -62, y: -30, r: -20, shape: "circle" },
    { x: 64, y: -36, r: 25, shape: "square" },
    { x: -54, y: 34, r: 15, shape: "square" },
    { x: 60, y: 30, r: -30, shape: "circle" },
  ] as const;
  return (
    <motion.div
      initial={animate ? { opacity: 0, scale: 0.96 } : false}
      animate={{ opacity: 1, scale: 1 }}
      role="status"
      aria-labelledby={`${uid}-done`}
      className="flex flex-col items-center py-2 text-center"
    >
      <div className="relative flex size-36 items-center justify-center">
        {pieces.map((piece, index) => (
          <motion.span
            key={index}
            aria-hidden="true"
            initial={animate ? { x: 0, y: 0, scale: 0, rotate: 0 } : false}
            animate={{ x: piece.x, y: piece.y, scale: 1, rotate: piece.r }}
            transition={{ type: "spring", stiffness: 400, damping: 16, delay: animate ? 0.25 + index * 0.04 : 0 }}
            className={cx(
              "absolute size-4 border-2 border-(--iu-foreground)",
              piece.shape === "circle"
                ? "rounded-full bg-(--iu-surface)"
                : "rounded-[4px] bg-[color-mix(in_oklab,var(--iu-accent)_40%,var(--iu-surface))]",
            )}
          />
        ))}
        <svg aria-hidden="true" viewBox="0 0 88 88" className="size-22">
          <circle cx="44" cy="47" r="38" fill="var(--iu-foreground)" />
          <circle cx="44" cy="42" r="38" fill="var(--iu-accent)" stroke="var(--iu-foreground)" strokeWidth="3" />
          <motion.path
            d="M27 43l11 11 23-24"
            fill="none"
            stroke="var(--iu-accent-foreground)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={animate ? { pathLength: 0 } : false}
            animate={{ pathLength: 1 }}
            transition={{ duration: animate ? 0.4 : 0, delay: animate ? 0.15 : 0, ease: [0.2, 0.8, 0.2, 1] }}
          />
        </svg>
      </div>
      <h2
        id={`${uid}-done`}
        ref={headingRef}
        tabIndex={-1}
        className="mt-2 text-[28px] leading-[1.1] font-extrabold tracking-[-0.03em] text-balance outline-none @md:text-[32px]"
      >
        {`You're in, ${firstName}.`}
      </h2>
      <p className="mt-2 max-w-sm text-[15px] leading-relaxed text-pretty text-(--iu-muted)">
        {values.workspace || "Your workspace"} is ready on {brand}.
      </p>
      <ul className="mt-6 flex flex-wrap justify-center gap-2 text-sm font-bold">
        <li className="rounded-full border-2 border-(--iu-foreground) px-3 py-1 tabular-nums">
          {values.invites.length} invite{values.invites.length === 1 ? "" : "s"} sent
        </li>
        <li className="rounded-full border-2 border-(--iu-foreground) px-3 py-1">{template}</li>
        <li className="rounded-full border-2 border-(--iu-foreground) px-3 py-1">
          Digest {values.mondayDigest ? "on" : "off"}
        </li>
      </ul>
      <button type="button" onClick={onOpenBoard} className={cx(PRIMARY, "mt-8")}>
        Open your first board
        <ArrowRight size={18} strokeWidth={2.5} aria-hidden="true" />
      </button>
    </motion.div>
  );
}

export default HopscotchOnboarding;
