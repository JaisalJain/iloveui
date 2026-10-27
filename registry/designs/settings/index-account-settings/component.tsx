"use client";

import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "motion/react";
import { Check, LoaderCircle, TriangleAlert } from "lucide-react";

export type IndexNotifyChannel = "email" | "push";

export type IndexAccountValues = {
  name: string;
  username: string;
  email: string;
  title: string;
  timezone: string;
  twoStep: boolean;
  /** Keys are `${eventId}.${channel}`. */
  notify: Record<string, boolean>;
};

export type IndexSession = {
  id: string;
  device: string;
  location: string;
  lastActive: string;
  current?: boolean;
};

export type IndexAccountSettingsProps = {
  product?: string;
  values?: IndexAccountValues;
  timezones?: { value: string; label: string }[];
  notifyEvents?: { id: string; label: string; detail: string }[];
  sessions?: IndexSession[];
  passwordChanged?: string;
  /** "loading" shows skeletons; "error" and "success" show the result of the last save. */
  status?: "idle" | "loading" | "error" | "success";
  errorMessage?: string;
  /** Field the error belongs to, marked inline. */
  errorField?: keyof IndexAccountValues;
  lastSaved?: string;
  /** Edits already made when the page renders, for example after a failed save. */
  pendingValues?: Partial<IndexAccountValues>;
  onSave?: (values: IndexAccountValues) => Promise<void> | void;
  onChangePassword?: () => void;
  onSignOutSession?: (sessionId: string) => void;
  onSignOutOthers?: () => void;
  onDeleteAccount?: () => Promise<void> | void;
  className?: string;
};

const DEFAULT_VALUES: IndexAccountValues = {
  name: "Ilse Vandermeer",
  username: "ilse",
  email: "ilse@isobar.app",
  title: "Forecast designer",
  timezone: "Europe/Amsterdam",
  twoStep: true,
  notify: {
    "mentions.email": true,
    "mentions.push": true,
    "comments.email": false,
    "comments.push": true,
    "digest.email": true,
    "digest.push": false,
    "billing.email": true,
    "billing.push": false,
  },
};

const DEFAULT_TIMEZONES = [
  { value: "Europe/London", label: "London (GMT+0)" },
  { value: "Europe/Amsterdam", label: "Amsterdam (GMT+1)" },
  { value: "America/New_York", label: "New York (GMT−5)" },
  { value: "Asia/Kolkata", label: "Kolkata (GMT+5:30)" },
  { value: "Asia/Tokyo", label: "Tokyo (GMT+9)" },
];

const DEFAULT_EVENTS = [
  { id: "mentions", label: "Mentions", detail: "Someone tags you on a map" },
  { id: "comments", label: "Comments", detail: "Replies on maps you own" },
  { id: "digest", label: "Weekly digest", detail: "Mondays, 08:00 your time" },
  { id: "billing", label: "Billing", detail: "Invoices and failed payments" },
];

const DEFAULT_SESSIONS: IndexSession[] = [
  { id: "s1", device: "Safari on macOS", location: "Utrecht, NL", lastActive: "Now", current: true },
  { id: "s2", device: "Isobar for iOS", location: "Utrecht, NL", lastActive: "2 hours ago" },
  { id: "s3", device: "Firefox on Windows", location: "Rotterdam, NL", lastActive: "Mon 26 Oct" },
];

const SECTIONS = [
  { id: "profile", label: "Profile" },
  { id: "signin", label: "Sign-in" },
  { id: "notifications", label: "Notifications" },
  { id: "sessions", label: "Sessions" },
  { id: "delete", label: "Delete account" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

const FIELD_SECTION: Record<string, SectionId> = {
  name: "profile",
  username: "profile",
  email: "profile",
  title: "profile",
  timezone: "profile",
  twoStep: "signin",
};

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--iu-accent)";
const R = "rounded-[min(var(--iu-radius),6px)]";
const CAPTION = "text-[11px] font-medium tracking-[0.08em] text-(--iu-muted) uppercase";
const INPUT = `h-10 w-full border border-(--iu-foreground)/35 bg-(--iu-surface) px-3 text-[14px] text-(--iu-foreground) outline-none transition-[border-color] duration-150 placeholder:text-(--iu-muted) focus:border-(--iu-foreground) aria-invalid:border-red-700 motion-reduce:transition-none dark:aria-invalid:border-red-400 ${R} ${FOCUS}`;
const BUTTON = `inline-flex h-9 cursor-pointer items-center justify-center gap-2 border border-(--iu-foreground)/35 px-3.5 text-[13px] font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none pointer-coarse:h-10 pointer-fine:hover:not-disabled:border-(--iu-foreground) ${R} ${FOCUS}`;

function cx(...values: (string | false | null | undefined)[]) {
  return values.filter(Boolean).join(" ");
}

function changedKeys(a: IndexAccountValues, b: IndexAccountValues) {
  const keys: string[] = [];
  for (const key of ["name", "username", "email", "title", "timezone", "twoStep"] as const) {
    if (a[key] !== b[key]) keys.push(key);
  }
  for (const key of Object.keys({ ...a.notify, ...b.notify })) {
    if (Boolean(a.notify[key]) !== Boolean(b.notify[key])) keys.push(`notify.${key}`);
  }
  return keys;
}

function sectionOf(key: string): SectionId {
  return key.startsWith("notify.") ? "notifications" : (FIELD_SECTION[key] ?? "profile");
}

function nowTime() {
  const date = new Date();
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

/** A field row: label column, control column, and a hairline marker in the margin when edited. */
function Row({
  label,
  htmlFor,
  hint,
  dirty,
  error,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  dirty: boolean;
  error?: string;
  children: ReactNode;
}) {
  const hintId = `${htmlFor ?? label}-hint`;
  return (
    <div className="relative grid grid-cols-1 gap-x-6 gap-y-2 py-[calc(16px*var(--iu-density))] @2xl:grid-cols-[180px_minmax(0,1fr)]">
      <span
        aria-hidden="true"
        className={cx(
          "absolute top-[calc(16px*var(--iu-density))] bottom-[calc(16px*var(--iu-density))] -left-3 w-0.5 bg-(--iu-accent) transition-opacity duration-150 motion-reduce:transition-none",
          dirty ? "opacity-100" : "opacity-0",
        )}
      />
      <div className="pt-2.5">
        {htmlFor ? (
          <label htmlFor={htmlFor} className="text-[13px] font-medium">
            {label}
          </label>
        ) : (
          <span className="text-[13px] font-medium">{label}</span>
        )}
        {dirty && <span className="sr-only"> (edited)</span>}
      </div>
      <div className="min-w-0">
        {children}
        {error ? (
          <p id={hintId} className="mt-1.5 flex items-center gap-1.5 text-[12px] text-red-700 dark:text-red-400">
            <TriangleAlert size={14} strokeWidth={1.5} aria-hidden="true" />
            {error}
          </p>
        ) : (
          hint && (
            <p id={hintId} className="mt-1.5 text-[12px] text-(--iu-muted)">
              {hint}
            </p>
          )
        )}
      </div>
    </div>
  );
}

function SectionHead({ index, title, detail, count }: { index: number; title: string; detail: string; count: number }) {
  return (
    <div className="flex items-baseline gap-4 border-b border-(--iu-foreground) pb-3">
      <span className="font-mono text-[12px] text-(--iu-muted) tabular-nums">{String(index).padStart(2, "0")}</span>
      <div className="min-w-0 flex-1">
        <h3 className="text-[20px] leading-tight font-semibold tracking-[-0.02em]">{title}</h3>
        <p className="mt-1 text-[13px] text-pretty text-(--iu-muted)">{detail}</p>
      </div>
      {count > 0 && <span className="shrink-0 text-[12px] text-(--iu-muted) tabular-nums">{count} edited</span>}
    </div>
  );
}

export function IndexAccountSettings({
  product = "Isobar",
  values: savedInitial = DEFAULT_VALUES,
  timezones = DEFAULT_TIMEZONES,
  notifyEvents = DEFAULT_EVENTS,
  sessions: initialSessions = DEFAULT_SESSIONS,
  passwordChanged = "Changed 3 Feb 2026",
  status: initialStatus = "idle",
  errorMessage = "Couldn't save. The username ilse.v is taken; pick another and save again.",
  errorField,
  lastSaved = "09:12",
  pendingValues,
  onSave,
  onChangePassword,
  onSignOutSession,
  onSignOutOthers,
  onDeleteAccount,
  className = "",
}: IndexAccountSettingsProps) {
  const reduceMotion = useReducedMotion();
  const ids = useId();
  const [saved, setSaved] = useState(savedInitial);
  const [values, setValues] = useState<IndexAccountValues>(() => ({
    ...savedInitial,
    ...pendingValues,
    notify: { ...savedInitial.notify, ...pendingValues?.notify },
  }));
  const [status, setStatus] = useState<"idle" | "loading" | "saving" | "error" | "success">(initialStatus);
  const [error, setError] = useState(initialStatus === "error" ? errorMessage : "");
  const [fieldError, setFieldError] = useState<keyof IndexAccountValues | undefined>(
    initialStatus === "error" ? errorField : undefined,
  );
  const [savedAt, setSavedAt] = useState(lastSaved);
  const sessions = initialSessions;
  const [signedOut, setSignedOut] = useState<string[]>([]);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [active, setActive] = useState<SectionId>("profile");
  const formRef = useRef<HTMLFormElement>(null);

  const changes = useMemo(() => changedKeys(values, saved), [values, saved]);
  const perSection = useMemo(() => {
    const counts: Record<SectionId, number> = { profile: 0, signin: 0, notifications: 0, sessions: 0, delete: 0 };
    for (const key of changes) counts[sectionOf(key)] += 1;
    return counts;
  }, [changes]);
  const dirty = (key: string) => changes.includes(key);
  const loading = status === "loading";
  const saving = status === "saving";

  const set = <K extends keyof IndexAccountValues>(key: K, value: IndexAccountValues[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
    if (fieldError === key) setFieldError(undefined);
    if (status === "success" || status === "error") setStatus("idle");
  };

  const save = async () => {
    if (changes.length === 0 || saving || loading) return;
    setStatus("saving");
    setError("");
    try {
      await onSave?.(values);
      setSaved(values);
      setSavedAt(nowTime());
      setStatus("success");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Couldn't save. Try again in a moment.");
      setStatus("error");
    }
  };

  const discard = () => {
    setValues(saved);
    setFieldError(undefined);
    setError("");
    setStatus("idle");
  };

  // Cmd/Ctrl+S saves from anywhere in the form.
  useEffect(() => {
    const form = formRef.current;
    if (!form) return;
    const onKey = (event: globalThis.KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        formRef.current?.requestSubmit();
      }
    };
    form.addEventListener("keydown", onKey);
    return () => form.removeEventListener("keydown", onKey);
  }, []);

  const confirmTarget = saved.username;
  const matched = (() => {
    let count = 0;
    while (count < confirmText.length && count < confirmTarget.length && confirmText[count] === confirmTarget[count])
      count++;
    return count;
  })();
  const confirmed = confirmText === confirmTarget;

  const statusLine = saving
    ? {
        key: "saving",
        icon: (
          <LoaderCircle
            size={14}
            strokeWidth={1.5}
            aria-hidden="true"
            className="animate-spin motion-reduce:animate-none"
          />
        ),
        text: "Saving",
      }
    : status === "error"
      ? {
          key: "error",
          icon: (
            <TriangleAlert size={14} strokeWidth={1.5} aria-hidden="true" className="text-red-700 dark:text-red-400" />
          ),
          text: "Not saved",
        }
      : changes.length > 0
        ? {
            key: `dirty-${changes.length}`,
            icon: null,
            text: `${changes.length} unsaved ${changes.length === 1 ? "change" : "changes"}`,
          }
        : status === "success"
          ? {
              key: `saved-${savedAt}`,
              icon: <Check size={14} strokeWidth={1.75} aria-hidden="true" />,
              text: `Saved at ${savedAt}`,
            }
          : { key: "clean", icon: null, text: `All changes saved · ${savedAt}` };

  const skeleton = (width: string) => (
    <span aria-hidden="true" className={cx("block h-10 bg-(--iu-foreground)/6", R, width)} />
  );

  return (
    <MotionConfig
      reducedMotion="user"
      transition={reduceMotion ? { duration: 0 } : { duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <section
        aria-label={`${product} account settings`}
        className={cx(
          "@container w-full bg-(--iu-background) font-(family-name:--iu-font) text-(--iu-foreground)",
          className,
        )}
      >
        <form
          ref={formRef}
          noValidate
          aria-busy={loading || saving}
          onSubmit={(event) => {
            event.preventDefault();
            void save();
          }}
          className="mx-auto max-w-[1200px] px-5 @2xl:px-10"
        >
          {/* Title row and save state */}
          <div className="sticky top-0 z-20 -mx-5 flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-(--iu-border) bg-(--iu-background) px-5 py-4 @2xl:-mx-10 @2xl:px-10">
            <div className="min-w-0 flex-1">
              <p className={CAPTION}>{product} · Settings</p>
              <h2 className="mt-1 text-[28px] leading-none font-semibold tracking-[-0.035em] @2xl:text-[40px]">
                Account
              </h2>
            </div>
            <p aria-live="polite" className="flex h-9 min-w-0 items-center text-[13px] text-(--iu-muted) tabular-nums">
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={statusLine.key}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className={cx(
                    "inline-flex items-center gap-1.5",
                    changes.length > 0 && !saving && status !== "error" && "text-(--iu-foreground)",
                  )}
                >
                  {statusLine.icon}
                  {statusLine.text}
                </motion.span>
              </AnimatePresence>
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={discard}
                disabled={changes.length === 0 || saving || loading}
                className={BUTTON}
              >
                Discard
              </button>
              <button
                type="submit"
                disabled={changes.length === 0 || saving || loading}
                className={cx(
                  "inline-flex h-9 min-w-[92px] cursor-pointer items-center justify-center gap-2 bg-(--iu-accent) px-4 text-[13px] font-semibold text-(--iu-accent-foreground) transition-opacity duration-150 disabled:cursor-not-allowed disabled:bg-(--iu-foreground)/10 disabled:text-(--iu-muted) motion-reduce:transition-none pointer-coarse:h-10",
                  R,
                  FOCUS,
                )}
              >
                {saving ? (
                  <LoaderCircle
                    size={14}
                    strokeWidth={1.75}
                    aria-hidden="true"
                    className="animate-spin motion-reduce:animate-none"
                  />
                ) : null}
                {saving ? "Saving" : "Save"}
                <kbd className="hidden font-mono text-[11px] font-normal @2xl:inline">⌘S</kbd>
              </button>
            </div>
          </div>

          {status === "error" && error && (
            <div
              role="alert"
              className="mt-6 flex items-start gap-3 border-l-2 border-red-700 py-1 pl-4 dark:border-red-400"
            >
              <TriangleAlert
                size={16}
                strokeWidth={1.5}
                aria-hidden="true"
                className="mt-0.5 shrink-0 text-red-700 dark:text-red-400"
              />
              <p className="text-[14px] text-pretty">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-12 gap-x-6 pt-10 pb-16">
            {/* Index */}
            <nav aria-label="Settings sections" className="col-span-3 hidden @4xl:block">
              <ol className="sticky top-28 border-t border-(--iu-border)">
                {SECTIONS.map((section, index) => (
                  <li key={section.id} className="border-b border-(--iu-border)">
                    <a
                      href={`#${ids}-${section.id}`}
                      aria-current={active === section.id ? "true" : undefined}
                      onClick={() => setActive(section.id)}
                      className={cx(
                        "group flex h-10 items-center gap-3 text-[13px] transition-colors duration-150 motion-reduce:transition-none",
                        active === section.id
                          ? "text-(--iu-foreground)"
                          : "text-(--iu-muted) pointer-fine:hover:text-(--iu-foreground)",
                        FOCUS,
                      )}
                    >
                      <span className="w-6 font-mono text-[11px] tabular-nums">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className={cx("flex-1", active === section.id && "font-medium")}>{section.label}</span>
                      {perSection[section.id] > 0 && (
                        <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-(--iu-foreground) tabular-nums">
                          <span aria-hidden="true" className="size-1.5 rounded-full bg-(--iu-accent)" />
                          {perSection[section.id]}
                          <span className="sr-only"> edited</span>
                        </span>
                      )}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>

            <div className="col-span-12 flex flex-col gap-16 @4xl:col-span-9">
              {/* 01 Profile */}
              <section id={`${ids}-profile`} aria-labelledby={`${ids}-profile-title`} className="scroll-mt-28">
                <div id={`${ids}-profile-title`}>
                  <SectionHead
                    index={1}
                    title="Profile"
                    detail="How you appear on shared maps and in comments."
                    count={perSection.profile}
                  />
                </div>
                <div className="divide-y divide-(--iu-border)">
                  <Row label="Name" htmlFor={`${ids}-name`} dirty={dirty("name")}>
                    {loading ? (
                      skeleton("w-full max-w-[420px]")
                    ) : (
                      <input
                        id={`${ids}-name`}
                        value={values.name}
                        autoComplete="name"
                        onChange={(e) => set("name", e.target.value)}
                        className={cx(INPUT, "max-w-[420px]")}
                      />
                    )}
                  </Row>
                  <Row
                    label="Username"
                    htmlFor={`${ids}-username`}
                    hint="Your profile lives at isobar.app/@username."
                    error={fieldError === "username" ? "This username is taken." : undefined}
                    dirty={dirty("username")}
                  >
                    {loading ? (
                      skeleton("w-full max-w-[420px]")
                    ) : (
                      <div className="flex max-w-[420px] items-stretch">
                        <span
                          className={cx(
                            "inline-flex items-center border border-r-0 border-(--iu-foreground)/35 px-3 font-mono text-[13px] text-(--iu-muted)",
                            "rounded-l-[min(var(--iu-radius),6px)]",
                          )}
                        >
                          isobar.app/@
                        </span>
                        <input
                          id={`${ids}-username`}
                          value={values.username}
                          autoComplete="username"
                          spellCheck={false}
                          aria-invalid={fieldError === "username" || undefined}
                          aria-describedby={`${ids}-username-hint`}
                          onChange={(e) => set("username", e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ""))}
                          className={cx(INPUT, "rounded-l-none font-mono")}
                        />
                      </div>
                    )}
                  </Row>
                  <Row
                    label="Email"
                    htmlFor={`${ids}-email`}
                    hint="Verified 12 Jan 2026. Changing it sends a new link."
                    dirty={dirty("email")}
                  >
                    {loading ? (
                      skeleton("w-full max-w-[420px]")
                    ) : (
                      <input
                        id={`${ids}-email`}
                        type="email"
                        value={values.email}
                        autoComplete="email"
                        aria-describedby={`${ids}-email-hint`}
                        onChange={(e) => set("email", e.target.value)}
                        className={cx(INPUT, "max-w-[420px]")}
                      />
                    )}
                  </Row>
                  <Row label="Title" htmlFor={`${ids}-title`} dirty={dirty("title")}>
                    {loading ? (
                      skeleton("w-full max-w-[420px]")
                    ) : (
                      <input
                        id={`${ids}-title`}
                        value={values.title}
                        onChange={(e) => set("title", e.target.value)}
                        className={cx(INPUT, "max-w-[420px]")}
                      />
                    )}
                  </Row>
                  <Row
                    label="Time zone"
                    htmlFor={`${ids}-tz`}
                    hint="Digests and quiet hours follow this zone."
                    dirty={dirty("timezone")}
                  >
                    {loading ? (
                      skeleton("w-full max-w-[280px]")
                    ) : (
                      <select
                        id={`${ids}-tz`}
                        value={values.timezone}
                        aria-describedby={`${ids}-tz-hint`}
                        onChange={(e) => set("timezone", e.target.value)}
                        className={cx(INPUT, "max-w-[280px] cursor-pointer")}
                      >
                        {timezones.map((zone) => (
                          <option key={zone.value} value={zone.value}>
                            {zone.label}
                          </option>
                        ))}
                      </select>
                    )}
                  </Row>
                </div>
              </section>

              {/* 02 Sign-in */}
              <section id={`${ids}-signin`} aria-labelledby={`${ids}-signin-title`} className="scroll-mt-28">
                <div id={`${ids}-signin-title`}>
                  <SectionHead
                    index={2}
                    title="Sign-in"
                    detail="Password and the second step we ask for on new devices."
                    count={perSection.signin}
                  />
                </div>
                <div className="divide-y divide-(--iu-border)">
                  <Row label="Password" dirty={false}>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1.5">
                      <span className="font-mono text-[13px] tracking-[0.2em]">
                        <span aria-hidden="true">••••••••••••</span>
                        <span className="sr-only">Password set</span>
                      </span>
                      <span className="text-[12px] text-(--iu-muted)">{passwordChanged}</span>
                      <button type="button" onClick={onChangePassword} className={cx(BUTTON, "ml-auto")}>
                        Change password
                      </button>
                    </div>
                  </Row>
                  <Row label="Two-step" dirty={dirty("twoStep")}>
                    <div className="flex items-start gap-3 pt-1.5">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={values.twoStep}
                        aria-labelledby={`${ids}-2fa-label`}
                        disabled={loading}
                        onClick={() => set("twoStep", !values.twoStep)}
                        className={cx(
                          "relative mt-0.5 inline-flex h-6 w-10 shrink-0 cursor-pointer items-center border transition-colors duration-150 motion-reduce:transition-none",
                          "rounded-[min(var(--iu-radius),6px)]",
                          values.twoStep
                            ? "border-(--iu-foreground) bg-(--iu-foreground)"
                            : "border-(--iu-foreground)/35 bg-(--iu-surface)",
                          FOCUS,
                        )}
                      >
                        <span
                          aria-hidden="true"
                          className={cx(
                            "absolute top-0.5 size-[18px] transition-transform duration-150 motion-reduce:transition-none",
                            "rounded-[min(var(--iu-radius),4px)]",
                            values.twoStep
                              ? "translate-x-[18px] bg-(--iu-background)"
                              : "translate-x-0.5 bg-(--iu-foreground)/45",
                          )}
                        />
                      </button>
                      <span>
                        <span id={`${ids}-2fa-label`} className="block text-[14px]">
                          Ask for a code from an authenticator app
                        </span>
                        <span className="mt-0.5 block text-[12px] text-(--iu-muted)">
                          {values.twoStep ? "On · 8 backup codes left" : "Off · anyone with your password can sign in"}
                        </span>
                      </span>
                    </div>
                  </Row>
                </div>
              </section>

              {/* 03 Notifications */}
              <section
                id={`${ids}-notifications`}
                aria-labelledby={`${ids}-notifications-title`}
                className="scroll-mt-28"
              >
                <div id={`${ids}-notifications-title`}>
                  <SectionHead
                    index={3}
                    title="Notifications"
                    detail="Choose where each kind of update reaches you."
                    count={perSection.notifications}
                  />
                </div>
                <table className="w-full table-fixed border-collapse text-left">
                  <caption className="sr-only">Notification channels per event</caption>
                  <thead>
                    <tr className={CAPTION}>
                      <th scope="col" className="py-3 font-medium">
                        Event
                      </th>
                      {(["email", "push"] as const).map((channel) => (
                        <th key={channel} scope="col" className="w-20 py-3 text-center font-medium @2xl:w-28">
                          {channel === "email" ? "Email" : "Push"}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {notifyEvents.map((event) => (
                      <tr key={event.id} className="border-t border-(--iu-border)">
                        <th scope="row" className="py-[calc(12px*var(--iu-density))] pr-4 font-normal">
                          <span className="block text-[14px]">{event.label}</span>
                          <span className="block text-[12px] text-(--iu-muted)">{event.detail}</span>
                        </th>
                        {(["email", "push"] as const).map((channel) => {
                          const key = `${event.id}.${channel}`;
                          const edited = dirty(`notify.${key}`);
                          return (
                            <td key={channel} className="relative text-center">
                              <span className="relative inline-grid size-5 place-items-center align-middle pointer-coarse:size-6">
                                <input
                                  type="checkbox"
                                  checked={Boolean(values.notify[key])}
                                  disabled={loading}
                                  aria-label={`${event.label} by ${channel}`}
                                  onChange={(e) => set("notify", { ...values.notify, [key]: e.target.checked })}
                                  className={cx(
                                    "peer col-start-1 row-start-1 size-full cursor-pointer appearance-none border border-(--iu-foreground)/45 bg-(--iu-surface) transition-colors duration-150 checked:border-(--iu-foreground) checked:bg-(--iu-foreground) motion-reduce:transition-none",
                                    "rounded-[min(var(--iu-radius),4px)]",
                                    FOCUS,
                                  )}
                                />
                                <Check
                                  size={14}
                                  strokeWidth={2.25}
                                  aria-hidden="true"
                                  className="pointer-events-none col-start-1 row-start-1 text-(--iu-background) opacity-0 peer-checked:opacity-100"
                                />
                              </span>
                              <span
                                aria-hidden="true"
                                className={cx(
                                  "absolute bottom-1.5 left-1/2 h-0.5 w-5 -translate-x-1/2 bg-(--iu-accent) transition-opacity duration-150 motion-reduce:transition-none",
                                  edited ? "opacity-100" : "opacity-0",
                                )}
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>

              {/* 04 Sessions */}
              <section id={`${ids}-sessions`} aria-labelledby={`${ids}-sessions-title`} className="scroll-mt-28">
                <div id={`${ids}-sessions-title`}>
                  <SectionHead
                    index={4}
                    title="Sessions"
                    detail="Devices signed in to your account right now."
                    count={0}
                  />
                </div>
                <ul>
                  {sessions.map((session) => {
                    const out = signedOut.includes(session.id);
                    return (
                      <li
                        key={session.id}
                        className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-(--iu-border) py-[calc(12px*var(--iu-density))]"
                      >
                        <span className="min-w-0 flex-1">
                          <span className={cx("block text-[14px]", out && "text-(--iu-muted) line-through")}>
                            {session.device}
                          </span>
                          <span className="block text-[12px] text-(--iu-muted) tabular-nums">
                            {session.location} · {session.lastActive}
                          </span>
                        </span>
                        {session.current ? (
                          <span className={CAPTION}>This device</span>
                        ) : out ? (
                          <span className="inline-flex items-center gap-1.5 text-[12px] text-(--iu-muted)">
                            <Check size={14} strokeWidth={1.5} aria-hidden="true" />
                            Signed out
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setSignedOut((list) => [...list, session.id]);
                              onSignOutSession?.(session.id);
                            }}
                            className={BUTTON}
                          >
                            Sign out
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
                <button
                  type="button"
                  disabled={sessions.every((s) => s.current || signedOut.includes(s.id))}
                  onClick={() => {
                    setSignedOut(sessions.filter((s) => !s.current).map((s) => s.id));
                    onSignOutOthers?.();
                  }}
                  className={cx(BUTTON, "mt-4")}
                >
                  Sign out of all other sessions
                </button>
              </section>

              {/* 05 Delete account */}
              <section id={`${ids}-delete`} aria-labelledby={`${ids}-delete-title`} className="scroll-mt-28">
                <div id={`${ids}-delete-title`}>
                  <SectionHead
                    index={5}
                    title="Delete account"
                    detail="Removes your maps, comments and API keys after 14 days. Shared maps move to their workspace owner."
                    count={0}
                  />
                </div>
                <div className="grid grid-cols-1 gap-x-6 gap-y-3 py-5 @2xl:grid-cols-[180px_minmax(0,1fr)]">
                  <label htmlFor={`${ids}-confirm`} className="pt-2.5 text-[13px] font-medium">
                    Confirm
                  </label>
                  <div>
                    <p className="text-[13px] text-(--iu-muted)">
                      Type your username{" "}
                      <span aria-hidden="true" className="font-mono text-[13px]">
                        <span className="text-(--iu-foreground)">{confirmTarget.slice(0, matched)}</span>
                        <span className="text-(--iu-muted) underline decoration-dotted underline-offset-4">
                          {confirmTarget.slice(matched)}
                        </span>
                      </span>
                      <span className="sr-only">{confirmTarget}</span> to confirm.
                    </p>
                    <div className="mt-3 flex max-w-[520px] flex-col gap-2 @md:flex-row">
                      <input
                        id={`${ids}-confirm`}
                        value={confirmText}
                        autoComplete="off"
                        spellCheck={false}
                        disabled={loading || deleting}
                        onChange={(e) => setConfirmText(e.target.value)}
                        className={cx(INPUT, "font-mono")}
                      />
                      <button
                        type="button"
                        disabled={!confirmed || deleting}
                        aria-describedby={`${ids}-delete-note`}
                        onClick={async () => {
                          setDeleting(true);
                          try {
                            await onDeleteAccount?.();
                          } finally {
                            setDeleting(false);
                          }
                        }}
                        className={cx(
                          "inline-flex h-10 shrink-0 cursor-pointer items-center justify-center gap-2 px-4 text-[13px] font-semibold text-white transition-colors duration-150 disabled:cursor-not-allowed disabled:bg-(--iu-foreground)/10 disabled:text-(--iu-muted) motion-reduce:transition-none",
                          "bg-red-700 dark:bg-red-600",
                          R,
                          FOCUS,
                        )}
                      >
                        {deleting && (
                          <LoaderCircle
                            size={14}
                            strokeWidth={1.75}
                            aria-hidden="true"
                            className="animate-spin motion-reduce:animate-none"
                          />
                        )}
                        {deleting ? "Deleting" : "Delete account"}
                      </button>
                    </div>
                    <p id={`${ids}-delete-note`} className="mt-2 text-[12px] text-(--iu-muted)">
                      {confirmed
                        ? "Ready. You can cancel within 14 days from the email we send."
                        : `${matched} of ${confirmTarget.length} characters match.`}
                    </p>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </form>
      </section>
    </MotionConfig>
  );
}

export default IndexAccountSettings;
