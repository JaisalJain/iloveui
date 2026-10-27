"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowRight, CircleAlert, Eye, EyeOff, LoaderCircle } from "lucide-react";

export type LonghandTopic = "essays" | "science" | "history" | "design" | "fiction" | "economics" | "cities" | "food";
export type LonghandAnswers = {
  topics: LonghandTopic[];
  time: "morning" | "commute" | "lunch" | "evening" | "";
  length: "5" | "15" | "30" | "60" | "";
  challenge: "light" | "stretch" | "work" | "";
};
export type LonghandAccount = { email: string; password: string };

export type LonghandReadingOnboardingProps = {
  brand?: string;
  /** 0 to 3 are the questions, 4 is the plan and save step. */
  defaultStep?: 0 | 1 | 2 | 3 | 4;
  defaultAnswers?: Partial<LonghandAnswers>;
  defaultEmail?: string;
  /** Controlled status of the save step; leave at "idle" to track the promise returned by onSave. */
  status?: "idle" | "loading" | "error" | "success";
  errorMessage?: string;
  onSave?: (answers: LonghandAnswers, account: LonghandAccount) => void | Promise<void>;
  onSocial?: (provider: "google" | "apple", answers: LonghandAnswers) => void;
  onStepChange?: (step: number) => void;
  onOpenIssue?: () => void;
  className?: string;
};

const TOPICS: Array<{ value: LonghandTopic; label: string }> = [
  { value: "essays", label: "Essays" },
  { value: "science", label: "Science" },
  { value: "history", label: "History" },
  { value: "design", label: "Design" },
  { value: "fiction", label: "Short fiction" },
  { value: "economics", label: "Economics" },
  { value: "cities", label: "Cities" },
  { value: "food", label: "Food" },
];

const TIMES = [
  { value: "morning", label: "Early, before the house wakes", hint: "6:30 am", deliver: "Monday at 6:30 am" },
  { value: "commute", label: "On the commute", hint: "8:00 am", deliver: "Monday at 8:00 am" },
  { value: "lunch", label: "Over lunch", hint: "12:30 pm", deliver: "Monday at 12:30 pm" },
  { value: "evening", label: "Late, with the lamp on", hint: "9:00 pm", deliver: "Sunday at 9:00 pm" },
] as const;

const LENGTHS = [
  { value: "5", label: "Five minutes, between things", hint: "~1,000 words" },
  { value: "15", label: "Fifteen, with a coffee", hint: "~3,000 words" },
  { value: "30", label: "Half an hour, uninterrupted", hint: "~6,000 words" },
  { value: "60", label: "An hour or more, the long read", hint: "12,000+ words" },
] as const;

const CHALLENGES = [
  { value: "light", label: "Keep it light", hint: "Clear prose, no prerequisites" },
  { value: "stretch", label: "Stretch me a little", hint: "One harder piece a week, marked" },
  { value: "work", label: "Make me work for it", hint: "Dense, footnoted, rewarding" },
] as const;

const READS: Record<LonghandTopic, { title: string; author: string; source: string; minutes: number }> = {
  essays: {
    title: "On keeping a commonplace book",
    author: "Imogen Thrale",
    source: "The Lantern Review",
    minutes: 14,
  },
  science: {
    title: "The slow arithmetic of glaciers",
    author: "Dr. Ravi Menon",
    source: "Field & Fathom",
    minutes: 18,
  },
  history: { title: "Ledgers of the salt road", author: "Beatriz Ordóñez", source: "Quarterly Antiquary", minutes: 22 },
  design: {
    title: "Why railway clocks look the way they do",
    author: "Henrik Saar",
    source: "Margin Notes",
    minutes: 11,
  },
  fiction: {
    title: "The ferryman's daughter keeps time",
    author: "Adaeze Nwosu",
    source: "Short Story Weekly",
    minutes: 16,
  },
  economics: {
    title: "The price of a pint, 1890 to now",
    author: "Tobias Wren",
    source: "The Counting House",
    minutes: 13,
  },
  cities: { title: "A city learns to walk again", author: "Lena Kovač", source: "Common Ground", minutes: 19 },
  food: { title: "Notes from a forty-year sourdough", author: "Marguerite Ellery", source: "Table Talk", minutes: 12 },
};

const CHAPTERS = ["Interests", "Hours", "Length", "Challenge", "Your plan"] as const;
const NUMERALS = ["I", "II", "III", "IV", "V"] as const;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--iu-accent)";
const KICKER = "text-[11px] font-medium tracking-[0.14em] text-(--iu-muted) uppercase";
const SQUARE = "rounded-[min(var(--iu-radius),2px)]";

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function list(items: string[]) {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

function GoogleMark() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.19-1.79 4.13-1.15 1.15-2.93 2.4-6.05 2.4-4.83 0-8.6-3.89-8.6-8.72s3.77-8.72 8.6-8.72c2.6 0 4.51 1.03 5.91 2.35l2.31-2.31C18.75 1.44 16.13 0 12.48 0 5.87 0 .31 5.39.31 12s5.56 12 12.17 12c3.57 0 6.27-1.17 8.37-3.36 2.16-2.16 2.84-5.21 2.84-7.67 0-.76-.05-1.47-.17-2.05H12.48z" />
    </svg>
  );
}

function AppleMark() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.15 6.9c-.95 0-2.42-1.08-3.96-1.04-2.04.03-3.91 1.18-4.96 3.01-2.12 3.68-.55 9.1 1.52 12.09 1.01 1.45 2.2 3.09 3.79 3.04 1.52-.07 2.09-.99 3.94-.99 1.83 0 2.35.99 3.96.95 1.64-.03 2.67-1.48 3.68-2.95 1.15-1.69 1.63-3.33 1.66-3.42-.04-.01-3.18-1.22-3.22-4.86-.03-3.04 2.48-4.49 2.6-4.56-1.43-2.09-3.63-2.32-4.39-2.38-2-.16-3.68 1.09-4.62 1.09zm3.38-3.07c.84-1.01 1.4-2.43 1.25-3.83-1.21.05-2.66.8-3.53 1.82-.78.9-1.46 2.34-1.27 3.71 1.34.1 2.71-.69 3.55-1.7" />
    </svg>
  );
}

/** One answer line: a native input behind serif type, with an accent rule that draws under the chosen line. */
function Choice({
  type,
  name,
  letter,
  label,
  hint,
  checked,
  onChange,
  disabled,
}: {
  type: "radio" | "checkbox";
  name: string;
  letter: string;
  label: string;
  hint?: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <label className="group relative block cursor-pointer">
      <input
        type={type}
        name={name}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="peer sr-only"
      />
      <span
        className={cx(
          "relative flex items-baseline gap-4 border-b border-(--iu-border) py-[calc(14px*var(--iu-density))] transition-colors duration-300 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-(--iu-accent) motion-reduce:transition-none",
          SQUARE,
          checked ? "text-(--iu-foreground)" : "text-(--iu-muted) pointer-fine:group-hover:text-(--iu-foreground)",
        )}
      >
        <span aria-hidden="true" className="w-6 shrink-0 font-mono text-[11px] tabular-nums">
          {letter}
        </span>
        <span className="min-w-0 flex-1 font-serif text-[22px] leading-snug text-pretty @md:text-[26px]">{label}</span>
        {hint ? <span className="hidden shrink-0 font-mono text-[11px] tabular-nums @md:block">{hint}</span> : null}
        <motion.span
          aria-hidden="true"
          initial={false}
          animate={{ scaleX: checked ? 1 : 0 }}
          transition={{ duration: 0.32, ease: [0.2, 0.8, 0.2, 1] }}
          className="absolute inset-x-0 -bottom-px h-0.5 origin-left bg-(--iu-accent)"
        />
      </span>
    </label>
  );
}

export function LonghandReadingOnboarding({
  brand = "Longhand",
  defaultStep = 0,
  defaultAnswers,
  defaultEmail = "",
  status: statusProp = "idle",
  errorMessage,
  onSave,
  onSocial,
  onStepChange,
  onOpenIssue,
  className = "",
}: LonghandReadingOnboardingProps) {
  const reduceMotion = useReducedMotion();
  const uid = useId();
  const [step, setStep] = useState<number>(statusProp === "success" ? 4 : defaultStep);
  const [answers, setAnswers] = useState<LonghandAnswers>({
    topics: [],
    time: "",
    length: "",
    challenge: "",
    ...defaultAnswers,
  });
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [notice, setNotice] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [internal, setInternal] = useState<{ status: "idle" | "loading" | "error" | "success"; message?: string }>({
    status: "idle",
  });
  const [moved, setMoved] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const status = statusProp !== "idle" ? statusProp : internal.status;
  const busy = status === "loading";
  const saved = status === "success";
  const message =
    statusProp === "error"
      ? (errorMessage ?? "We couldn't save your plan just now. Your answers are safe on this page; try again.")
      : (internal.message ?? "We couldn't save your plan just now. Your answers are safe on this page; try again.");

  useEffect(() => {
    if (moved) headingRef.current?.focus();
  }, [step, moved, saved]);

  function go(next: number) {
    if (next < 0 || next > 4 || busy) return;
    setNotice("");
    setMoved(true);
    setStep(next);
    onStepChange?.(next);
  }

  function toggleTopic(topic: LonghandTopic) {
    if (answers.topics.includes(topic)) {
      setNotice("");
      setAnswers((prev) => ({ ...prev, topics: prev.topics.filter((item) => item !== topic) }));
      return;
    }
    if (answers.topics.length >= 3) {
      setNotice("Three is the limit for now. Set one down to pick this up.");
      return;
    }
    setNotice("");
    setAnswers((prev) => ({ ...prev, topics: [...prev.topics, topic] }));
  }

  function next() {
    const missing = [
      answers.topics.length === 0 ? "Choose at least one subject to begin." : "",
      answers.time ? "" : "Choose the hour that sounds most like you.",
      answers.length ? "" : "Choose a length; you can change it later.",
      answers.challenge ? "" : "Choose how hard you'd like to be pushed.",
    ][step];
    if (missing) {
      setNotice(missing);
      return;
    }
    go(step + 1);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const found = {
      email: !email.trim()
        ? "Your email is where the plan arrives."
        : EMAIL.test(email.trim())
          ? ""
          : "That address seems to be missing a part.",
      password: password.length >= 8 ? "" : "At least eight characters, please.",
    };
    setErrors(found);
    if (found.email) return document.getElementById(`${uid}-email`)?.focus();
    if (found.password) return document.getElementById(`${uid}-password`)?.focus();
    const result = onSave?.(answers, { email: email.trim(), password });
    if (!result || typeof (result as Promise<void>).then !== "function") {
      setMoved(true);
      setInternal({ status: "success" });
      return;
    }
    setInternal({ status: "loading" });
    try {
      await result;
      setMoved(true);
      setInternal({ status: "success" });
    } catch (error) {
      setInternal({ status: "error", message: error instanceof Error ? error.message : undefined });
    }
  }

  const topicLabels = (
    answers.topics.length ? answers.topics : (["essays", "science", "cities"] as LonghandTopic[])
  ).map((topic) => TOPICS.find((item) => item.value === topic)?.label.toLowerCase() ?? topic);
  const time = TIMES.find((item) => item.value === answers.time) ?? TIMES[3];
  const length = LENGTHS.find((item) => item.value === answers.length) ?? LENGTHS[1];
  const challenge = CHALLENGES.find((item) => item.value === answers.challenge) ?? CHALLENGES[1];
  const picks = (answers.topics.length ? answers.topics : (["essays", "science", "cities"] as LonghandTopic[]))
    .slice(0, 3)
    .map((topic) => ({ topic, ...READS[topic] }));
  const totalMinutes = picks.reduce((sum, item) => sum + item.minutes, 0);

  const questions = [
    { kicker: "Chapter I · Interests", title: "What would you like to read more of?", aside: "Choose up to three." },
    { kicker: "Chapter II · Hours", title: "When does reading happen for you?", aside: "We'll deliver to match." },
    {
      kicker: "Chapter III · Length",
      title: "How long can you stay with one piece?",
      aside: "Roughly, on a good day.",
    },
    { kicker: "Chapter IV · Challenge", title: "How would you like to be challenged?", aside: "Nothing is graded." },
    {
      kicker: saved ? "Issue No. 1 · Saved" : "Chapter V · Your plan",
      title: saved
        ? "Your first issue is set."
        : `A plan for ${time.value === "evening" ? "evening" : time.value === "morning" ? "early" : time.value === "lunch" ? "midday" : "commuting"} readers.`,
      aside: "",
    },
  ];
  const q = questions[step] ?? questions[0]!;
  const fade = reduceMotion
    ? {}
    : { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -4 } };

  const input = cx(
    "h-11 w-full border-0 border-b bg-transparent px-0 text-base text-(--iu-foreground) placeholder:text-(--iu-muted) disabled:opacity-60",
    FOCUS,
  );

  return (
    <MotionConfig
      reducedMotion="user"
      transition={reduceMotion ? { duration: 0 } : { duration: 0.32, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <div
        className={cx("@container w-full font-(family-name:--iu-font) text-(--iu-foreground) antialiased", className)}
      >
        <div className={cx("border border-(--iu-border) bg-(--iu-surface)", SQUARE)}>
          <header className="flex items-baseline justify-between gap-4 px-5 pt-5 @lg:px-10 @lg:pt-8">
            <span className="font-serif text-2xl italic">{brand}</span>
            <span className={cx(KICKER, "tabular-nums")}>Reader&apos;s survey · 2026</span>
          </header>
          <div
            aria-hidden="true"
            className="mx-5 mt-4 border-t-[3px] border-double border-(--iu-foreground) @lg:mx-10"
          />

          <div className="grid @3xl:grid-cols-[15rem_minmax(0,1fr)]">
            <nav
              aria-label="Survey contents"
              className="px-5 pt-5 @lg:px-10 @3xl:border-r @3xl:border-(--iu-border) @3xl:py-10 @3xl:pr-6"
            >
              <p className={cx(KICKER, "hidden @3xl:block")}>Contents</p>
              <ol className="hidden @3xl:mt-4 @3xl:block">
                {CHAPTERS.map((chapter, index) => {
                  const active = index === step;
                  const done = index < step || saved;
                  return (
                    <li key={chapter} aria-current={active ? "step" : undefined} className="relative">
                      <button
                        type="button"
                        onClick={() => go(index)}
                        disabled={!done || busy || saved || active}
                        className={cx(
                          "flex w-full items-baseline gap-3 py-2 text-left text-sm disabled:cursor-default",
                          SQUARE,
                          FOCUS,
                          active
                            ? "text-(--iu-foreground)"
                            : done
                              ? "text-(--iu-foreground) pointer-fine:hover:underline"
                              : "text-(--iu-muted)",
                        )}
                      >
                        <span aria-hidden="true" className="w-7 font-serif text-base italic">
                          {NUMERALS[index]}
                        </span>
                        <span className="flex-1 whitespace-nowrap">
                          {chapter}
                          <span className="sr-only">{done ? ", answered" : active ? ", current" : ""}</span>
                        </span>
                        <span aria-hidden="true" className="font-mono text-[11px] whitespace-nowrap tabular-nums">
                          {`p. ${String(index * 4 + 1).padStart(2, "0")}`}
                        </span>
                      </button>
                      {active ? (
                        <motion.span
                          layoutId={`${uid}-chapter`}
                          aria-hidden="true"
                          className="absolute top-2 bottom-2 -left-3 w-0.5 bg-(--iu-accent)"
                        />
                      ) : null}
                    </li>
                  );
                })}
              </ol>
              <div className="@3xl:hidden">
                <p className="sr-only">
                  Chapter {NUMERALS[step]} of V, {CHAPTERS[step]}
                </p>
                <div aria-hidden="true" className="grid grid-cols-5 gap-1">
                  {CHAPTERS.map((chapter, index) => (
                    <span
                      key={chapter}
                      className={cx(
                        "h-0.5",
                        index === step && !saved
                          ? "bg-(--iu-accent)"
                          : index < step || saved
                            ? "bg-(--iu-foreground)"
                            : "bg-(--iu-border)",
                      )}
                    />
                  ))}
                </div>
              </div>
              <p className="mt-8 hidden text-[13px] leading-relaxed text-pretty text-(--iu-muted) @3xl:block">
                Four questions, about a minute. Change any answer later from Settings.
              </p>
            </nav>

            <div className="min-w-0 px-5 pt-6 pb-[calc(32px*var(--iu-density))] @lg:px-10 @lg:pt-10 @lg:pb-[calc(48px*var(--iu-density))]">
              <AnimatePresence initial={false} mode="wait">
                <motion.div key={`${step}-${saved}`} {...fade}>
                  <p className={KICKER}>{q.kicker}</p>
                  <h2
                    ref={headingRef}
                    id={`${uid}-title`}
                    tabIndex={-1}
                    className="mt-3 max-w-[22ch] font-serif text-[40px] leading-[1.02] tracking-[-0.01em] text-balance outline-none @lg:text-[56px]"
                  >
                    {q.title}
                  </h2>
                  {q.aside ? <p className="mt-3 text-[15px] text-(--iu-muted) italic">{q.aside}</p> : null}

                  {step < 4 ? (
                    <fieldset className="mt-8" aria-describedby={notice ? `${uid}-notice` : undefined}>
                      <legend className="sr-only">{q.title}</legend>
                      {step === 0 ? (
                        <div className="grid gap-x-10 @xl:grid-cols-2">
                          {TOPICS.map((topic, index) => (
                            <Choice
                              key={topic.value}
                              type="checkbox"
                              name={`${uid}-topics`}
                              letter={String.fromCharCode(97 + index)}
                              label={topic.label}
                              checked={answers.topics.includes(topic.value)}
                              onChange={() => toggleTopic(topic.value)}
                            />
                          ))}
                        </div>
                      ) : null}
                      {step === 1
                        ? TIMES.map((item, index) => (
                            <Choice
                              key={item.value}
                              type="radio"
                              name={`${uid}-time`}
                              letter={String.fromCharCode(97 + index)}
                              label={item.label}
                              hint={item.hint}
                              checked={answers.time === item.value}
                              onChange={() => {
                                setNotice("");
                                setAnswers((prev) => ({ ...prev, time: item.value }));
                              }}
                            />
                          ))
                        : null}
                      {step === 2
                        ? LENGTHS.map((item, index) => (
                            <Choice
                              key={item.value}
                              type="radio"
                              name={`${uid}-length`}
                              letter={String.fromCharCode(97 + index)}
                              label={item.label}
                              hint={item.hint}
                              checked={answers.length === item.value}
                              onChange={() => {
                                setNotice("");
                                setAnswers((prev) => ({ ...prev, length: item.value }));
                              }}
                            />
                          ))
                        : null}
                      {step === 3
                        ? CHALLENGES.map((item, index) => (
                            <Choice
                              key={item.value}
                              type="radio"
                              name={`${uid}-challenge`}
                              letter={String.fromCharCode(97 + index)}
                              label={item.label}
                              hint={item.hint}
                              checked={answers.challenge === item.value}
                              onChange={() => {
                                setNotice("");
                                setAnswers((prev) => ({ ...prev, challenge: item.value }));
                              }}
                            />
                          ))
                        : null}
                    </fieldset>
                  ) : null}

                  {step < 4 ? (
                    <>
                      <p
                        id={`${uid}-notice`}
                        aria-live="polite"
                        className="mt-4 min-h-5 text-[13px] text-(--iu-muted) italic"
                      >
                        {notice ? (
                          <span className="inline-flex items-center gap-1.5 text-red-700 not-italic dark:text-red-300">
                            <CircleAlert size={14} strokeWidth={1.5} aria-hidden="true" />
                            {notice}
                          </span>
                        ) : step === 0 ? (
                          `${answers.topics.length} of 3 chosen`
                        ) : (
                          ""
                        )}
                      </p>
                      <div className="mt-6 flex items-center justify-between gap-4 border-t border-(--iu-border) pt-5">
                        {step > 0 ? (
                          <button
                            type="button"
                            onClick={() => go(step - 1)}
                            className={cx(
                              "inline-flex h-10 items-center gap-2 text-sm text-(--iu-muted) pointer-fine:hover:text-(--iu-foreground)",
                              SQUARE,
                              FOCUS,
                            )}
                          >
                            <ArrowLeft size={16} strokeWidth={1.5} aria-hidden="true" />
                            Previous
                          </button>
                        ) : (
                          <span className="font-mono text-[11px] text-(--iu-muted) tabular-nums">p. 01</span>
                        )}
                        <button
                          type="button"
                          onClick={next}
                          className={cx(
                            "group inline-flex h-11 items-center gap-2 rounded-full bg-(--iu-foreground) px-6 text-sm font-medium text-(--iu-background) transition-colors duration-300 motion-reduce:transition-none pointer-fine:hover:bg-[color-mix(in_oklab,var(--iu-foreground)_86%,var(--iu-background))]",
                            FOCUS,
                          )}
                        >
                          {step === 3 ? "See my plan" : "Next chapter"}
                          <ArrowRight
                            size={16}
                            strokeWidth={1.5}
                            aria-hidden="true"
                            className="transition-transform duration-300 motion-reduce:transition-none pointer-fine:group-hover:translate-x-0.5"
                          />
                        </button>
                      </div>
                    </>
                  ) : null}

                  {step === 4 ? (
                    <div className="mt-8 grid gap-10 @3xl:grid-cols-[minmax(0,1fr)_17rem]">
                      <article>
                        {saved ? (
                          <p className="text-[17px] leading-[1.65] text-pretty">
                            <span className="float-left mt-1 mr-2 font-serif text-[64px] leading-[0.8] text-(--iu-accent)">
                              Y
                            </span>
                            our first issue of {brand} arrives <strong className="font-semibold">{time.deliver}</strong>{" "}
                            at <span className="break-all">{email.trim() || "your inbox"}</span>: three pieces,{" "}
                            {totalMinutes} minutes of reading, chosen by an editor and not a feed. Reply to any issue to
                            tell us what landed.
                          </p>
                        ) : (
                          <p className="text-[17px] leading-[1.65] text-pretty">
                            <span className="float-left mt-1 mr-2 font-serif text-[64px] leading-[0.8] text-(--iu-accent)">
                              Y
                            </span>
                            ou asked for {list(topicLabels)}, read {time.label.toLowerCase()} in pieces of about{" "}
                            {length.value} minutes. We&apos;ll{" "}
                            {challenge.value === "light"
                              ? "keep it clear and unhurried"
                              : challenge.value === "work"
                                ? "send the dense, footnoted ones"
                                : "stretch you a little, one longer piece a week"}
                            , and deliver every {time.deliver}.
                          </p>
                        )}
                        <h3 className={cx(KICKER, "mt-8 border-b border-(--iu-foreground) pb-2")}>
                          {saved ? "In Issue No. 1" : "First reads"} · {totalMinutes} min
                        </h3>
                        <ol>
                          {picks.map((pick, index) => (
                            <li
                              key={pick.topic}
                              className="grid grid-cols-[2rem_minmax(0,1fr)_auto] items-baseline gap-x-3 border-b border-(--iu-border) py-3"
                            >
                              <span aria-hidden="true" className="font-serif text-lg text-(--iu-muted) italic">
                                {index + 1}.
                              </span>
                              <span className="min-w-0">
                                <span className="block font-serif text-xl leading-snug text-pretty">{pick.title}</span>
                                <span className="mt-1 block text-[13px] text-(--iu-muted)">
                                  {pick.author}, <span className="italic">{pick.source}</span>
                                </span>
                              </span>
                              <span className="font-mono text-[11px] text-(--iu-muted) tabular-nums">
                                {pick.minutes} min
                              </span>
                            </li>
                          ))}
                        </ol>
                      </article>

                      {saved ? (
                        <aside
                          aria-labelledby={`${uid}-issue`}
                          role="status"
                          className="self-start border-y-[3px] border-double border-(--iu-foreground) py-5 text-center"
                        >
                          <p className={KICKER}>Issue No. 1</p>
                          <p id={`${uid}-issue`} className="mt-2 font-serif text-4xl italic">
                            {brand}
                          </p>
                          <p className="mt-2 font-mono text-[11px] text-(--iu-muted) tabular-nums">
                            3 pieces · {totalMinutes} min · {time.hint}
                          </p>
                          <button
                            type="button"
                            onClick={onOpenIssue}
                            className={cx(
                              "mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-(--iu-foreground) px-6 text-sm font-medium text-(--iu-background)",
                              FOCUS,
                            )}
                          >
                            Read a preview
                            <ArrowRight size={16} strokeWidth={1.5} aria-hidden="true" />
                          </button>
                        </aside>
                      ) : (
                        <form noValidate onSubmit={save} aria-labelledby={`${uid}-save`} className="self-start">
                          <h3 id={`${uid}-save`} className="font-serif text-2xl leading-tight italic">
                            Keep this plan
                          </h3>
                          <p className="mt-1 text-[13px] text-(--iu-muted)">Free for 30 days, then $6 a month.</p>
                          <fieldset disabled={busy} className="mt-4 grid gap-[calc(16px*var(--iu-density))]">
                            <legend className="sr-only">Create an account</legend>
                            <div className="grid grid-cols-2 gap-2">
                              {(
                                [
                                  ["google", "Google", GoogleMark],
                                  ["apple", "Apple", AppleMark],
                                ] as const
                              ).map(([provider, name, Mark]) => (
                                <button
                                  key={provider}
                                  type="button"
                                  onClick={() => onSocial?.(provider, answers)}
                                  className={cx(
                                    "inline-flex h-10 items-center justify-center gap-2 rounded-full border border-(--iu-foreground)/35 text-sm disabled:opacity-60 pointer-fine:hover:border-(--iu-foreground)",
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
                            <p aria-hidden="true" className="text-center text-[13px] text-(--iu-muted) italic">
                              or with email
                            </p>
                            <div>
                              <label htmlFor={`${uid}-email`} className={KICKER}>
                                Email
                              </label>
                              <input
                                id={`${uid}-email`}
                                type="email"
                                inputMode="email"
                                autoComplete="email"
                                placeholder="nadia.farouk@fastmail.com"
                                value={email}
                                onChange={(event) => {
                                  setEmail(event.target.value);
                                  if (errors.email) setErrors((prev) => ({ ...prev, email: "" }));
                                }}
                                onBlur={() =>
                                  email &&
                                  setErrors((prev) => ({
                                    ...prev,
                                    email: EMAIL.test(email.trim()) ? "" : "That address seems to be missing a part.",
                                  }))
                                }
                                aria-invalid={errors.email ? true : undefined}
                                aria-describedby={errors.email ? `${uid}-email-error` : undefined}
                                className={cx(
                                  input,
                                  errors.email ? "border-red-600 dark:border-red-400" : "border-(--iu-foreground)/40",
                                )}
                              />
                              {errors.email ? (
                                <p
                                  id={`${uid}-email-error`}
                                  className="mt-1.5 text-[13px] text-red-700 italic dark:text-red-300"
                                >
                                  {errors.email}
                                </p>
                              ) : null}
                            </div>
                            <div>
                              <label htmlFor={`${uid}-password`} className={KICKER}>
                                Password
                              </label>
                              <div className="relative">
                                <input
                                  id={`${uid}-password`}
                                  type={showPassword ? "text" : "password"}
                                  autoComplete="new-password"
                                  value={password}
                                  onChange={(event) => {
                                    setPassword(event.target.value);
                                    if (errors.password && event.target.value.length >= 8)
                                      setErrors((prev) => ({ ...prev, password: "" }));
                                  }}
                                  aria-invalid={errors.password ? true : undefined}
                                  aria-describedby={errors.password ? `${uid}-password-error` : undefined}
                                  className={cx(
                                    input,
                                    "pr-10",
                                    errors.password
                                      ? "border-red-600 dark:border-red-400"
                                      : "border-(--iu-foreground)/40",
                                  )}
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPassword((value) => !value)}
                                  aria-label={showPassword ? "Hide password" : "Show password"}
                                  aria-pressed={showPassword}
                                  aria-controls={`${uid}-password`}
                                  className={cx(
                                    "absolute top-1/2 right-0 inline-flex size-9 -translate-y-1/2 items-center justify-center text-(--iu-muted) pointer-coarse:size-10 pointer-fine:hover:text-(--iu-foreground)",
                                    SQUARE,
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
                              {errors.password ? (
                                <p
                                  id={`${uid}-password-error`}
                                  className="mt-1.5 text-[13px] text-red-700 italic dark:text-red-300"
                                >
                                  {errors.password}
                                </p>
                              ) : null}
                            </div>
                            {status === "error" ? (
                              <p
                                role="alert"
                                className="flex items-start gap-2 border-l-2 border-red-600 pl-3 text-[13px] leading-relaxed text-red-800 dark:border-red-400 dark:text-red-200"
                              >
                                <CircleAlert
                                  size={14}
                                  strokeWidth={1.5}
                                  aria-hidden="true"
                                  className="mt-0.5 shrink-0"
                                />
                                {message}
                              </p>
                            ) : null}
                            <button
                              type="submit"
                              aria-busy={busy || undefined}
                              className={cx(
                                "inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-(--iu-foreground) px-6 text-sm font-medium text-(--iu-background) transition-colors duration-300 disabled:cursor-progress motion-reduce:transition-none pointer-fine:hover:bg-[color-mix(in_oklab,var(--iu-foreground)_86%,var(--iu-background))]",
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
                                  Saving your plan
                                </>
                              ) : status === "error" ? (
                                "Try again"
                              ) : (
                                "Save my plan"
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => go(3)}
                              className={cx(
                                "justify-self-center text-[13px] text-(--iu-muted) underline underline-offset-4 pointer-fine:hover:text-(--iu-foreground)",
                                SQUARE,
                                FOCUS,
                              )}
                            >
                              Change my answers
                            </button>
                          </fieldset>
                          <p aria-live="polite" className="sr-only">
                            {busy ? "Saving your plan" : ""}
                          </p>
                        </form>
                      )}
                    </div>
                  ) : null}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </MotionConfig>
  );
}

export default LonghandReadingOnboarding;
