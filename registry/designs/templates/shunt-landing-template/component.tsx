"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from "react";
import {
  AnimatePresence,
  MotionConfig,
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useTransform,
  type AnimationPlaybackControls,
} from "motion/react";
import { ArrowRight, Check, CornerDownLeft, Menu, Plus, RotateCcw, Search, TriangleAlert, X } from "lucide-react";

/* ------------------------------------------------------------------------------------------------------------------
 * Types
 * ---------------------------------------------------------------------------------------------------------------- */

export type ShuntStage = "queued" | "claimed" | "running" | "done";
export type ShuntBilling = "monthly" | "yearly";
export type ShuntStatus = "idle" | "loading" | "error" | "success";

export type ShuntLink = { label: string; href: string };

export type ShuntJob = {
  id: string;
  /** The job type, as your code enqueues it ("invoice.render"). */
  name: string;
  queue: string;
  stage: ShuntStage;
  /** Short monospace detail on the right: a duration, a wait, a worker. */
  meta: string;
  /** Marks the job failed at its current stage; it gets a Retry button. */
  failed?: { attempt: string; reason: string };
};

export type ShuntProof = {
  metric: string;
  before: string;
  after: string;
  quote: string;
  name: string;
  role: string;
  company: string;
  /** Where the number comes from ("Migration write-up · Aug 2026"). */
  source: string;
};

export type ShuntPlan = {
  id: string;
  name: string;
  tagline: string;
  /** Price per month in whole dollars, for each billing period. */
  price: Record<ShuntBilling, number>;
  quota: string;
  overage: string;
  /** Replaces the line under the price ("Free forever"). */
  note?: string;
  highlights: string[];
  ctaLabel: string;
  highlighted?: boolean;
  badge?: string;
};

export type ShuntFaq = { question: string; answer: string };
export type ShuntFooterColumn = { title: string; links: ShuntLink[] };

export type ShuntLandingTemplateProps = {
  brand?: string;
  /** Prefix for the section anchors the navigation links to (`<prefix>-product`, `-pricing`, `-faq`). */
  anchorPrefix?: string;
  nav?: ShuntLink[];
  signInHref?: string;
  announcement?: string;
  headline?: string;
  /** The words of the headline that get the accent underline. */
  headlineMark?: string;
  subline?: string;
  ctaLabel?: string;
  ctaHref?: string;
  ctaNote?: string;
  jobs?: ShuntJob[];
  doneToday?: number;
  proofs?: ShuntProof[];
  plans?: ShuntPlan[];
  savingLabel?: string;
  faqs?: ShuntFaq[];
  footerColumns?: ShuntFooterColumn[];
  /** Controls the checkout state. Leave it unset and return a promise from onCheckout to let the page track it. */
  checkoutStatus?: ShuntStatus;
  onCheckout?: (planId: string, billing: ShuntBilling) => void | Promise<unknown>;
  /** Controls the sign-up form. Leave it unset and return a promise from onSignup to let the page track it. */
  signupStatus?: ShuntStatus;
  defaultEmail?: string;
  onSignup?: (email: string) => void | Promise<unknown>;
  onRetryJob?: (jobId: string) => void;
  onPurge?: () => void;
  className?: string;
};

/* ------------------------------------------------------------------------------------------------------------------
 * Content
 * ---------------------------------------------------------------------------------------------------------------- */

const DEFAULT_NAV: ShuntLink[] = [
  { label: "Product", href: "#shunt-product" },
  { label: "Customers", href: "#shunt-proof" },
  { label: "Pricing", href: "#shunt-pricing" },
  { label: "FAQ", href: "#shunt-faq" },
  { label: "Docs", href: "#docs" },
];

const DEFAULT_JOBS: ShuntJob[] = [
  { id: "job_8F2KQ", name: "invoice.render", queue: "billing", stage: "running", meta: "2.1 s" },
  {
    id: "job_8F2JX",
    name: "webhook.deliver",
    queue: "hooks",
    stage: "running",
    meta: "attempt 3",
    failed: { attempt: "Attempt 3 of 5", reason: "502 from partner endpoint" },
  },
  { id: "job_8F2JV", name: "email.digest", queue: "mail", stage: "done", meta: "412 ms" },
  { id: "job_8F2JR", name: "export.csv", queue: "reports", stage: "claimed", meta: "worker 07" },
  { id: "job_8F2JM", name: "pdf.thumbnail", queue: "media", stage: "queued", meta: "in 4 s" },
];

const DEFAULT_PROOFS: ShuntProof[] = [
  {
    metric: "p95 pickup",
    before: "4.1s",
    after: "210ms",
    quote:
      "We deleted our cron table the week we moved. Pickup latency was the number we watched, and it stopped moving.",
    name: "Dalia Ferraro",
    role: "Staff engineer",
    company: "Copperline Freight",
    source: "Migration write-up · Aug 2026",
  },
  {
    metric: "Duplicate payslips",
    before: "37",
    after: "0",
    quote: "Idempotency keys checked at claim time ended the double runs. Finance noticed before we told them.",
    name: "Kwame Asante",
    role: "CTO",
    company: "Tidyroll Payroll",
    source: "Q3 2026 incident review",
  },
  {
    metric: "Job pages a month",
    before: "22",
    after: "3",
    quote: "The board shows the failed attempt and its stack trace. Most pages now end with one press of Retry.",
    name: "Sun-hee Park",
    role: "Platform lead",
    company: "Marrowbook",
    source: "On-call report · Sep 2026",
  },
];

const DEFAULT_PLANS: ShuntPlan[] = [
  {
    id: "hobby",
    name: "Hobby",
    tagline: "For side projects and first workers.",
    price: { monthly: 0, yearly: 0 },
    quota: "50K jobs / mo",
    overage: "pauses at the limit",
    note: "Free forever, no card",
    highlights: ["3 queues", "3-day run history", "Retries with backoff", "Email alerts"],
    ctaLabel: "Start on Hobby",
  },
  {
    id: "team",
    name: "Team",
    tagline: "For products running jobs in production.",
    price: { monthly: 49, yearly: 39 },
    quota: "2M jobs / mo",
    overage: "then $0.60 per 100K",
    highlights: ["Unlimited queues", "30-day history with replay", "Cron schedules", "Slack and webhook alerts"],
    ctaLabel: "Choose Team",
    highlighted: true,
    badge: "Most teams",
  },
  {
    id: "scale",
    name: "Scale",
    tagline: "For platforms with millions of jobs a day.",
    price: { monthly: 219, yearly: 175 },
    quota: "20M jobs / mo",
    overage: "then $0.35 per 100K",
    highlights: ["Priority lanes", "90-day history with replay", "SAML SSO and audit log", "99.99% uptime SLA"],
    ctaLabel: "Choose Scale",
  },
];

const DEFAULT_FAQS: ShuntFaq[] = [
  {
    question: "What counts as a job?",
    answer:
      "Each enqueue counts once. Retries of the same job are free, so a flaky endpoint never costs you more than the first attempt.",
  },
  {
    question: "Does Shunt run my code?",
    answer:
      "No. Your workers pull jobs through the SDK or the HTTP API. Shunt stores, schedules and tracks them; your code and secrets stay on your servers.",
  },
  {
    question: "What happens when I go over my plan?",
    answer:
      "On Team and Scale, jobs keep running and the extra volume is billed per 100K at your plan’s rate. We email you at 80% so nothing is a surprise.",
  },
  {
    question: "Which languages have an SDK?",
    answer:
      "TypeScript, Python, Go and Ruby, each under 400 lines and open source. Anything else talks to the same HTTP API the SDKs use.",
  },
  {
    question: "Where is my data stored?",
    answer:
      "Payloads and run history live in the region you pick when you create a workspace: Frankfurt, Virginia or Singapore. Scale can pin a dedicated cluster.",
  },
  {
    question: "Can I get a refund?",
    answer:
      "Yes. Every charge is refundable in full within 14 days, no questions asked. Write to billing@shunt.dev from the account’s email.",
  },
];

const DEFAULT_FOOTER: ShuntFooterColumn[] = [
  {
    title: "Product",
    links: [
      { label: "Queue board", href: "#board" },
      { label: "Cron schedules", href: "#cron" },
      { label: "Pricing", href: "#shunt-pricing" },
      { label: "Changelog", href: "#changelog" },
    ],
  },
  {
    title: "Developers",
    links: [
      { label: "Docs", href: "#docs" },
      { label: "API reference", href: "#api" },
      { label: "SDKs", href: "#sdks" },
      { label: "Status", href: "#status" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#about" },
      { label: "Blog", href: "#blog" },
      { label: "Careers", href: "#careers" },
      { label: "Contact", href: "#contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms", href: "#terms" },
      { label: "Privacy", href: "#privacy" },
      { label: "DPA", href: "#dpa" },
      { label: "Security", href: "#security" },
    ],
  },
];

const STAGES: ShuntStage[] = ["queued", "claimed", "running", "done"];
const STAGE_LABEL: Record<ShuntStage, string> = {
  queued: "Queued",
  claimed: "Claimed",
  running: "Running",
  done: "Done",
};

/** Retry backoff: the wait before each attempt, and how it went. */
const BACKOFF = [
  { attempt: 1, wait: "0s", width: 4, result: "fail" },
  { attempt: 2, wait: "4s", width: 12, result: "fail" },
  { attempt: 3, wait: "16s", width: 30, result: "fail" },
  { attempt: 4, wait: "1m 04s", width: 62, result: "done" },
  { attempt: 5, wait: "4m 16s", width: 100, result: "skip" },
] as const;

/** Jobs finished per hour over the last day; the second figure is how many of them needed a retry. */
const THROUGHPUT: [number, number][] = [
  [1240, 88],
  [1102, 64],
  [986, 41],
  [912, 37],
  [948, 52],
  [1187, 70],
  [1690, 112],
  [2240, 164],
  [2874, 230],
  [3215, 296],
  [3398, 251],
  [3512, 288],
  [3640, 302],
  [3741, 279],
  [3912, 344],
  [3688, 310],
  [3402, 266],
  [3105, 214],
  [2780, 198],
  [2431, 160],
  [2102, 131],
  [1844, 102],
  [1610, 95],
  [1398, 79],
];

const SNIPPET_COMMENT = "// after the order is saved";
const SNIPPET = `await shunt.enqueue("invoice.render", {
  orderId: order.id,
}, { retries: 5 });`;

const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

/* ------------------------------------------------------------------------------------------------------------------
 * Shared pieces
 * ---------------------------------------------------------------------------------------------------------------- */

function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function isPromise(value: unknown): value is PromiseLike<unknown> {
  return typeof value === "object" && value !== null && typeof (value as { then?: unknown }).then === "function";
}

const number = new Intl.NumberFormat("en-US");

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--iu-accent)";
/** Hard-shadow press: lift on hover, drop into the shadow on press. */
const PRESS =
  "transition-[translate,box-shadow] duration-100 ease-linear active:translate-x-1 active:translate-y-1 active:shadow-none motion-reduce:transition-none pointer-fine:hover:not-active:not-aria-disabled:-translate-x-0.5 pointer-fine:hover:not-active:not-aria-disabled:-translate-y-0.5 pointer-fine:hover:not-active:not-aria-disabled:shadow-[6px_6px_0_var(--sh-ink)]";
/** Shape, press and focus of every button; size, display and shadow are added per use so classes never conflict. */
const BUTTON = cx(
  "group/btn relative grid-cols-1 place-items-center rounded-[min(var(--iu-radius),4px)] border-2 border-(--iu-foreground) font-extrabold uppercase select-none aria-disabled:translate-x-1 aria-disabled:translate-y-1 aria-disabled:cursor-progress aria-disabled:shadow-none",
  PRESS,
  FOCUS,
);
const MD = "inline-grid h-12 px-5 text-sm tracking-[0.06em] shadow-[4px_4px_0_var(--sh-ink)]";
const PRIMARY = "bg-(--iu-accent) text-(--iu-accent-foreground)";
const SECONDARY = "bg-(--iu-surface) text-(--iu-foreground)";
const BOX = "rounded-[min(var(--iu-radius),4px)] border-2 border-(--iu-foreground) bg-(--iu-surface)";
const LABEL = "font-mono text-xs font-bold tracking-[0.08em] uppercase";
const WRAP = "mx-auto max-w-[1200px] px-4 sm:px-8 lg:px-10";

function Arrow() {
  return (
    <ArrowRight
      size={16}
      strokeWidth={2.5}
      aria-hidden="true"
      className="transition-transform duration-100 ease-linear motion-reduce:transition-none pointer-fine:group-hover/btn:translate-x-0.5"
    />
  );
}

function ShuntMark() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true" className="shrink-0">
      <rect x="1" y="1" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" />
      <rect x="5" y="13" width="9" height="10" fill="currentColor" />
      <rect x="14" y="5" width="9" height="10" className="fill-(--iu-accent)" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function SectionLabel({ index, children }: { index: string; children: ReactNode }) {
  return (
    <p className={cx(LABEL, "flex items-center gap-3")}>
      <span className="inline-flex h-7 items-center bg-(--iu-foreground) px-2 text-(--iu-background) tabular-nums">
        {index}
      </span>
      {children}
    </p>
  );
}

/** Three blocks that step while something is working; stops offscreen and under reduced motion. */
function WorkingBlocks({ running }: { running: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const node = ref.current;
    if (!running || !node || prefersReducedMotion()) return;
    let timer: number | undefined;
    const stop = () => {
      window.clearInterval(timer);
      timer = undefined;
    };
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) stop();
      else if (timer === undefined) timer = window.setInterval(() => setFrame((current) => (current + 1) % 3), 180);
    });
    observer.observe(node);
    return () => {
      observer.disconnect();
      stop();
    };
  }, [running]);

  return (
    <span ref={ref} aria-hidden="true" data-sh-blocks className="flex gap-1">
      {[0, 1, 2].map((block) => (
        <span
          key={block}
          className={cx("size-2 rounded-[1px] border-2 border-current", running && block === frame && "bg-current")}
        />
      ))}
    </span>
  );
}

/* ------------------------------------------------------------------------------------------------------------------
 * Header and mobile menu
 * ---------------------------------------------------------------------------------------------------------------- */

function SiteHeader({
  topHref,
  brand,
  nav,
  signInHref,
  ctaLabel,
  ctaHref,
}: {
  topHref: string;
  brand: string;
  nav: ShuntLink[];
  signInHref: string;
  ctaLabel: string;
  ctaHref: string;
}) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      dialog.querySelector<HTMLElement>("a")?.focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    const query = window.matchMedia("(min-width: 64rem)");
    const onChange = () => {
      if (query.matches) setOpen(false);
    };
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b-2 border-(--iu-foreground) bg-(--iu-background)">
      <div className={cx(WRAP, "flex h-16 items-center gap-6")}>
        <a href={topHref} className={cx("flex items-center gap-2.5 rounded-[2px]", FOCUS)}>
          <ShuntMark />
          <span className="text-xl font-extrabold tracking-[-0.03em] uppercase">{brand}</span>
        </a>
        <nav aria-label="Main" className="hidden lg:block">
          <ul role="list" className="flex items-center gap-1">
            {nav.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className={cx(
                    "inline-flex h-10 items-center rounded-[2px] px-3 text-sm font-bold decoration-2 underline-offset-[6px] pointer-fine:hover:underline",
                    FOCUS,
                  )}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <a
            href={signInHref}
            className={cx(
              "hidden h-10 items-center rounded-[2px] px-2 text-sm font-bold decoration-2 underline-offset-[6px] sm:inline-flex pointer-fine:hover:underline",
              FOCUS,
            )}
          >
            Sign in
          </a>
          <a
            href={ctaHref}
            className={cx(
              BUTTON,
              PRIMARY,
              "hidden h-10 px-4 text-[13px] tracking-[0.06em] shadow-[3px_3px_0_var(--sh-ink)] sm:inline-grid",
            )}
          >
            <span className="inline-flex items-center gap-2">{ctaLabel}</span>
          </a>
          <button
            ref={buttonRef}
            data-sh-menu
            type="button"
            aria-label="Open menu"
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-controls={menuId}
            onClick={() => setOpen(true)}
            className={cx(
              "inline-flex size-10 items-center justify-center rounded-[min(var(--iu-radius),4px)] border-2 border-(--iu-foreground) bg-(--iu-surface) shadow-[3px_3px_0_var(--sh-ink)] lg:hidden",
              PRESS,
              FOCUS,
            )}
          >
            <Menu size={18} strokeWidth={2.5} aria-hidden="true" />
          </button>
        </div>
      </div>

      <dialog
        ref={dialogRef}
        data-sh-drawer
        id={menuId}
        aria-label="Menu"
        onClose={() => {
          setOpen(false);
          buttonRef.current?.focus();
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) setOpen(false);
        }}
        className="fixed inset-x-0 top-0 bottom-auto m-0 max-h-dvh w-full max-w-none -translate-y-full overflow-y-auto border-b-2 border-(--iu-foreground) bg-(--iu-background) p-0 text-(--iu-foreground) shadow-[0_8px_0_var(--sh-ink)] transition-[translate,display,overlay] transition-discrete duration-150 ease-linear backdrop:bg-black/50 open:translate-y-0 motion-reduce:transition-none lg:hidden dark:backdrop:bg-black/70 starting:open:-translate-y-full"
      >
        <div className="px-4 pb-6 font-(family-name:--iu-font) sm:px-8">
          <div className="flex h-16 items-center gap-2.5 border-b-2 border-(--iu-foreground)">
            <ShuntMark />
            <span className="flex-1 text-xl font-extrabold tracking-[-0.03em] uppercase">{brand}</span>
            <button
              type="button"
              data-sh-close
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              className={cx(
                "inline-flex size-10 items-center justify-center rounded-[min(var(--iu-radius),4px)] border-2 border-(--iu-foreground) bg-(--iu-surface) shadow-[3px_3px_0_var(--sh-ink)]",
                PRESS,
                FOCUS,
              )}
            >
              <X size={18} strokeWidth={2.5} aria-hidden="true" />
            </button>
          </div>
          <nav aria-label="Menu links">
            <ul role="list">
              {nav.map((link, index) => (
                <li key={link.href} className="border-b-2 border-(--iu-foreground)">
                  <a
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={cx(
                      "flex min-h-16 items-center gap-4 text-[28px] leading-none font-extrabold tracking-[-0.03em] uppercase",
                      "outline-offset-[-4px] focus-visible:outline-2 focus-visible:outline-(--iu-accent)",
                    )}
                  >
                    <span className="w-8 font-mono text-xs tracking-normal text-(--iu-muted) tabular-nums">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="flex-1">{link.label}</span>
                    <ArrowRight size={22} strokeWidth={2.5} aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="mt-6 grid grid-cols-2 gap-4">
            <a href={signInHref} onClick={() => setOpen(false)} className={cx(BUTTON, MD, SECONDARY)}>
              Sign in
            </a>
            <a href={ctaHref} onClick={() => setOpen(false)} className={cx(BUTTON, MD, PRIMARY)}>
              {ctaLabel}
            </a>
          </div>
        </div>
      </dialog>
    </header>
  );
}

/* ------------------------------------------------------------------------------------------------------------------
 * Hero queue board
 * ---------------------------------------------------------------------------------------------------------------- */

function Rail({ job }: { job: ShuntJob }) {
  const current = STAGES.indexOf(job.stage);
  return (
    <span aria-hidden="true" data-sh-rail className="flex gap-1">
      {STAGES.map((stage, index) => {
        const filled = index <= current;
        const failing = Boolean(job.failed) && index === current;
        const live = !job.failed && stage === "running" && job.stage === "running";
        return (
          <span
            key={stage}
            className="relative block h-6 w-6 overflow-hidden border-2 border-(--iu-foreground) bg-(--iu-surface) @xl:w-8"
          >
            <motion.span
              data-sh-fill
              className={cx(
                "absolute inset-0 origin-left",
                failing ? "bg-red-600 dark:bg-red-500" : live ? "bg-(--iu-accent)" : "bg-(--iu-foreground)",
              )}
              initial={false}
              animate={{ scaleX: filled ? 1 : 0 }}
              transition={{ duration: 0.1, ease: "linear", delay: filled ? index * 0.04 : 0 }}
            />
          </span>
        );
      })}
    </span>
  );
}

function JobSticker({ job }: { job: ShuntJob }) {
  const key = job.failed ? "failed" : job.stage;
  return (
    <AnimatePresence initial={false} mode="popLayout">
      <motion.span
        key={key}
        initial={{ scale: 1.3, rotate: -8, opacity: 0 }}
        animate={{ scale: 1, rotate: key === "done" ? -3 : 0, opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.12, ease: "linear" }}
        className={cx(
          "inline-flex h-7 items-center gap-1 border-2 px-1.5 font-mono text-[11px] font-bold tracking-[0.06em] whitespace-nowrap uppercase",
          key === "failed" && "border-red-700 bg-(--iu-surface) text-red-700 dark:border-red-400 dark:text-red-400",
          key === "done" && "border-(--iu-foreground) bg-(--iu-foreground) text-(--iu-surface)",
          key === "queued" && "border-dashed border-(--iu-foreground) bg-(--iu-surface)",
          (key === "claimed" || key === "running") && "border-(--iu-foreground) bg-(--iu-surface)",
        )}
      >
        {key === "failed" ? <X size={12} strokeWidth={3} aria-hidden="true" /> : null}
        {key === "failed" ? "Failed" : STAGE_LABEL[job.stage]}
      </motion.span>
    </AnimatePresence>
  );
}

function QueueBoard({
  initialJobs,
  doneToday,
  onRetryJob,
}: {
  initialJobs: ShuntJob[];
  doneToday: number;
  onRetryJob?: (jobId: string) => void;
}) {
  const [jobs, setJobs] = useState(initialJobs);
  const [done, setDone] = useState(doneToday);
  const [message, setMessage] = useState("");
  // Jobs between a Retry press and Done: the button stays, pressed into its shadow, so focus has somewhere to be.
  const [retrying, setRetrying] = useState<Set<string>>(() => new Set());
  const figureRef = useRef<HTMLElement>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((timer) => window.clearTimeout(timer));
  }, []);

  function update(id: string, patch: Partial<ShuntJob>) {
    setJobs((current) => current.map((job) => (job.id === id ? { ...job, ...patch } : job)));
  }

  // The first healthy running job finishes once, shortly after the board scrolls into view.
  useEffect(() => {
    const node = figureRef.current;
    const running = initialJobs.find((job) => job.stage === "running" && !job.failed);
    if (!node || !running || prefersReducedMotion()) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return;
      observer.disconnect();
      timers.current.push(
        window.setTimeout(() => {
          setJobs((current) =>
            current.map((job) => (job.id === running.id ? { ...job, stage: "done", meta: "2.4 s" } : job)),
          );
          setDone((value) => value + 1);
        }, 1400),
      );
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [initialJobs]);

  function retry(job: ShuntJob) {
    if (retrying.has(job.id)) return;
    onRetryJob?.(job.id);
    setRetrying((current) => new Set(current).add(job.id));
    update(job.id, { failed: undefined, stage: "queued", meta: "retrying" });
    setMessage(`${job.name} queued for another attempt.`);
    const finish = () => {
      const row = figureRef.current?.querySelector<HTMLElement>(`[data-job="${job.id}"]`);
      const hadFocus = Boolean(row?.contains(document.activeElement));
      update(job.id, { stage: "done", meta: "1.3 s" });
      setRetrying((current) => {
        const next = new Set(current);
        next.delete(job.id);
        return next;
      });
      setDone((value) => value + 1);
      setMessage(`${job.name} finished on attempt 4.`);
      // The Retry button leaves with the failure; keep focus in the row it belonged to.
      if (hadFocus) row?.focus();
    };
    if (prefersReducedMotion()) {
      finish();
      return;
    }
    timers.current.push(
      window.setTimeout(() => update(job.id, { stage: "claimed", meta: "worker 03" }), 420),
      window.setTimeout(() => update(job.id, { stage: "running", meta: "0.6 s" }), 840),
      window.setTimeout(finish, 1500),
    );
  }

  return (
    <figure
      ref={figureRef}
      data-sh-board
      className={cx(
        BOX,
        "@container relative min-w-0 shadow-[8px_8px_0_var(--sh-ink)] sm:shadow-[12px_12px_0_var(--sh-ink)]",
      )}
    >
      <figcaption className="flex items-center justify-between gap-4 border-b-2 border-(--iu-foreground) px-4 py-3">
        <span className="min-w-0">
          <span className="block text-sm font-extrabold tracking-[0.04em] uppercase">Queue board</span>
          <span className="block truncate font-mono text-[11px] text-(--iu-muted) uppercase">
            production · {jobs.length} live jobs
          </span>
        </span>
        <span className="text-right">
          <span className="block font-mono text-[11px] text-(--iu-muted) uppercase">Done today</span>
          <span data-sh-done className="block text-2xl leading-none font-extrabold tracking-[-0.03em] tabular-nums">
            {number.format(done)}
          </span>
        </span>
      </figcaption>
      <div
        aria-hidden="true"
        className="hidden grid-cols-[minmax(0,1fr)_auto_7rem_6rem] gap-x-5 px-4 py-2 font-mono text-[11px] font-bold tracking-[0.06em] text-(--iu-muted) uppercase @xl:grid"
      >
        <span>Job</span>
        <span className="flex gap-1">
          {STAGES.map((stage) => (
            <span key={stage} className="w-8 text-center">
              {stage.slice(0, 1)}
            </span>
          ))}
        </span>
        <span>Stage</span>
        <span className="text-right">Detail</span>
      </div>
      <ul role="list" aria-label="Jobs on the board">
        {jobs.map((job) => (
          <li
            key={job.id}
            data-job={job.id}
            tabIndex={-1}
            className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-3 border-t-2 border-(--iu-foreground) px-4 py-[calc(14px*var(--iu-density))] outline-none @xl:grid-cols-[minmax(0,1fr)_auto_7rem_6rem] @xl:gap-x-5"
          >
            <div className="min-w-0">
              <p className="truncate font-mono text-sm font-bold">{job.name}</p>
              <p className="mt-1 truncate font-mono text-[11px] text-(--iu-muted) uppercase">
                {job.id} · {job.queue}
              </p>
              {job.failed ? (
                <p data-sh-reason className="mt-1 truncate text-xs font-medium text-red-700 dark:text-red-400">
                  {job.failed.attempt} · {job.failed.reason}
                </p>
              ) : null}
            </div>
            <div className="col-start-1 row-start-2 @xl:col-auto @xl:row-auto">
              <Rail job={job} />
            </div>
            <div
              data-sh-sticker
              className="col-start-2 row-start-1 justify-self-end @xl:col-auto @xl:row-auto @xl:justify-self-start"
            >
              <JobSticker job={job} />
            </div>
            <div data-sh-action className="col-start-2 row-start-2 justify-self-end @xl:col-auto @xl:row-auto">
              {job.failed || retrying.has(job.id) ? (
                <button
                  type="button"
                  data-sh-retry
                  aria-label={retrying.has(job.id) ? `Retrying ${job.name}` : `Retry ${job.name}, ${job.id}`}
                  aria-disabled={retrying.has(job.id) || undefined}
                  onClick={() => retry(job)}
                  className={cx(
                    "inline-flex h-8 items-center gap-1.5 rounded-[min(var(--iu-radius),4px)] border-2 border-(--iu-foreground) bg-(--iu-accent) px-2.5 text-xs font-extrabold tracking-[0.06em] text-(--iu-accent-foreground) uppercase shadow-[3px_3px_0_var(--sh-ink)] aria-disabled:translate-x-[3px] aria-disabled:translate-y-[3px] aria-disabled:cursor-progress aria-disabled:shadow-none pointer-coarse:h-10",
                    PRESS,
                    FOCUS,
                  )}
                >
                  <RotateCcw size={14} strokeWidth={2.5} aria-hidden="true" />
                  Retry
                </button>
              ) : (
                <span className="font-mono text-xs whitespace-nowrap text-(--iu-muted) tabular-nums">{job.meta}</span>
              )}
            </div>
          </li>
        ))}
      </ul>
      <p data-sh-board-live aria-live="polite" className="sr-only">
        {message}
      </p>
    </figure>
  );
}

/* ------------------------------------------------------------------------------------------------------------------
 * Product features
 * ---------------------------------------------------------------------------------------------------------------- */

function FeatureCell({
  index,
  title,
  body,
  className = "",
  children,
}: {
  index: string;
  title: string;
  body: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <li className={cx(BOX, "flex min-w-0 flex-col shadow-[6px_6px_0_var(--sh-ink)]", className)}>
      <div className="flex items-center justify-between border-b-2 border-(--iu-foreground) px-[calc(20px*var(--iu-density))] py-2">
        <span className={LABEL}>{title}</span>
        <span aria-hidden="true" className="font-mono text-xs font-bold text-(--iu-muted) tabular-nums">
          {index}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-6 p-[calc(20px*var(--iu-density))]">
        <p className="max-w-[44ch] text-[15px] leading-relaxed text-pretty text-(--iu-muted)">{body}</p>
        <div className="mt-auto">{children}</div>
      </div>
    </li>
  );
}

function PaletteMini() {
  const rows = [
    { group: "Actions", label: "Retry job_8F2JX", meta: "webhook.deliver", active: true },
    { group: "Actions", label: "Move to dead letters", meta: "after 5 attempts" },
    { group: "Jobs", label: "job_8F2JX", meta: "hooks · failed 2m ago" },
    { group: "Jobs", label: "job_8F2J4", meta: "hooks · done 11m ago" },
  ];
  return (
    <figure className="m-0">
      <figcaption className="sr-only">
        The command palette with the query “retry job_8F2” and the action Retry job_8F2JX selected.
      </figcaption>
      <div aria-hidden="true" className="border-2 border-(--iu-foreground) bg-(--iu-background)">
        <div className="flex h-12 items-center gap-2 border-b-2 border-(--iu-foreground) px-3">
          <Search size={16} strokeWidth={2.5} />
          <span className="border-2 border-(--iu-foreground) bg-(--iu-foreground) px-1.5 py-0.5 font-mono text-[11px] leading-none font-bold text-(--iu-background) uppercase">
            &gt; Actions
          </span>
          <span className="min-w-0 truncate font-mono text-sm font-bold">retry job_8F2</span>
          <span className="h-5 w-0.5 shrink-0 bg-(--iu-foreground)" />
          <span className="ml-auto hidden font-mono text-[11px] text-(--iu-muted) sm:block">4 results</span>
        </div>
        <div className="p-2">
          {rows.map((row, index) => (
            <div key={row.label}>
              {index === 0 || rows[index - 1]?.group !== row.group ? (
                <p className="px-2 pt-2 pb-1 font-mono text-[11px] font-bold tracking-[0.06em] text-(--iu-muted) uppercase">
                  {row.group}
                </p>
              ) : null}
              <div
                className={cx(
                  "flex h-10 items-center gap-3 border-2 px-2",
                  row.active
                    ? "border-(--iu-foreground) bg-(--iu-surface) shadow-[3px_3px_0_var(--sh-ink)]"
                    : "border-transparent",
                )}
              >
                <span className="min-w-0 truncate text-sm font-bold">{row.label}</span>
                <span className="ml-auto hidden truncate font-mono text-[11px] text-(--iu-muted) sm:block">
                  {row.meta}
                </span>
                {row.active ? (
                  <span className="grid size-6 shrink-0 place-items-center border-2 border-(--iu-foreground)">
                    <CornerDownLeft size={12} strokeWidth={2.5} />
                  </span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </figure>
  );
}

function BackoffMini() {
  return (
    <figure className="m-0">
      <figcaption className="sr-only">
        Retry schedule: attempts 1 to 3 failed after waits of 0 seconds, 4 seconds and 16 seconds; attempt 4 succeeded
        after 1 minute 4 seconds, so attempt 5 was never needed.
      </figcaption>
      <p aria-hidden="true" className="mb-5 flex items-baseline gap-3">
        <span className="text-[64px] leading-[0.85] font-extrabold tracking-[-0.05em] tabular-nums">4×</span>
        <span className="font-mono text-[11px] font-bold tracking-[0.06em] text-(--iu-muted) uppercase">
          Longer wait each attempt
        </span>
      </p>
      <ol aria-hidden="true" className="grid gap-2">
        {BACKOFF.map((step) => (
          <li key={step.attempt} className="grid grid-cols-[2rem_minmax(0,1fr)_4.5rem] items-center gap-3">
            <span className="font-mono text-xs font-bold tabular-nums">#{step.attempt}</span>
            <span className="relative h-6 border-2 border-(--iu-foreground) bg-(--iu-background)">
              <span
                className={cx(
                  "absolute inset-y-0 left-0",
                  step.result === "fail" && "bg-(--iu-foreground)",
                  step.result === "done" && "bg-(--iu-accent)",
                  step.result === "skip" &&
                    "border-r-2 border-dashed border-(--iu-foreground) bg-[repeating-linear-gradient(135deg,var(--iu-foreground)_0_2px,transparent_2px_8px)]",
                )}
                style={{ width: `${step.width}%` }}
              />
            </span>
            <span className="flex items-center justify-end gap-1 font-mono text-xs whitespace-nowrap tabular-nums">
              {step.result === "fail" ? (
                <X size={12} strokeWidth={3} className="text-red-700 dark:text-red-400" />
              ) : step.result === "done" ? (
                <Check size={12} strokeWidth={3} />
              ) : null}
              {step.wait}
            </span>
          </li>
        ))}
      </ol>
    </figure>
  );
}

function ThroughputMini() {
  const peak = Math.max(...THROUGHPUT.map(([total]) => total));
  const peakHour = THROUGHPUT.findIndex(([total]) => total === peak);
  const total = THROUGHPUT.reduce((sum, [value]) => sum + value, 0);
  const retried = THROUGHPUT.reduce((sum, [, value]) => sum + value, 0);
  return (
    <figure className="m-0">
      <figcaption className="sr-only">
        Jobs finished per hour over the last 24 hours: {number.format(total)} in total, {number.format(retried)} of them
        after a retry, peaking at {number.format(peak)} at {String(peakHour).padStart(2, "0")}:00.
      </figcaption>
      <div aria-hidden="true">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <span className="text-[40px] leading-none font-extrabold tracking-[-0.04em] tabular-nums">
            {number.format(total)}
          </span>
          <span className="flex items-center gap-3 font-mono text-[11px] font-bold uppercase">
            <span className="flex items-center gap-1.5">
              <span className="size-3 bg-(--iu-foreground)" />
              First try
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-3 border-2 border-(--iu-foreground) bg-(--iu-surface)" />
              Retried
            </span>
          </span>
        </div>
        <div className="relative mt-10 flex h-36 items-end gap-[3px] border-b-2 border-(--iu-foreground) sm:gap-1">
          {THROUGHPUT.map(([value, retry], hour) => (
            <span key={hour} className="relative flex h-full flex-1 flex-col justify-end">
              {hour === peakHour ? (
                <span className="absolute right-0 bottom-full mb-1 border-2 border-(--iu-foreground) bg-(--iu-surface) px-1 font-mono text-[10px] leading-4 font-bold whitespace-nowrap tabular-nums">
                  {number.format(peak)}
                </span>
              ) : null}
              <span
                className="border-2 border-b-0 border-(--iu-foreground) bg-(--iu-surface)"
                style={{ height: `${(retry / peak) * 100}%` }}
              />
              <span className="bg-(--iu-foreground)" style={{ height: `${((value - retry) / peak) * 100}%` }} />
            </span>
          ))}
        </div>
        <div className="mt-2 flex justify-between font-mono text-[11px] text-(--iu-muted) tabular-nums">
          <span>00:00</span>
          <span>06:00</span>
          <span>12:00</span>
          <span>18:00</span>
          <span>24:00</span>
        </div>
      </div>
    </figure>
  );
}

/** Hold the slab to purge dead letters; let go early and it drains back. */
function HoldToPurge({ count, onPurge }: { count: number; onPurge?: () => void }) {
  const reduceMotion = useReducedMotion();
  const progress = useMotionValue(0);
  const fillX = useTransform(progress, (value) => `${(value - 1) * 100}%`);
  const labelX = useTransform(progress, (value) => `${(1 - value) * 100}%`);
  const controls = useRef<AnimationPlaybackControls | null>(null);
  const holdingRef = useRef(false);
  const gesture = useRef(false);
  const [holding, setHolding] = useState(false);
  const [remaining, setRemaining] = useState(1200);
  const [purged, setPurged] = useState(false);
  const hintId = useId();
  const HOLD_MS = 1200;

  useMotionValueEvent(progress, "change", (value) => {
    setRemaining(Math.round(((1 - Math.min(1, Math.max(0, value))) * HOLD_MS) / 100) * 100);
  });

  useEffect(() => () => controls.current?.stop(), []);

  function finish() {
    holdingRef.current = false;
    setHolding(false);
    setPurged(true);
    onPurge?.();
  }

  function start() {
    if (purged || holdingRef.current) return;
    controls.current?.stop();
    holdingRef.current = true;
    setHolding(true);
    const from = progress.get();
    controls.current = animate(progress, 1, {
      duration: ((1 - from) * HOLD_MS) / 1000,
      ease: "linear",
      onComplete: finish,
    });
  }

  function release() {
    if (!holdingRef.current) return;
    holdingRef.current = false;
    setHolding(false);
    if (progress.get() >= 1) return;
    controls.current?.stop();
    if (reduceMotion) {
      progress.set(0);
      return;
    }
    controls.current = animate(progress, 0, { duration: 0.12, ease: "linear" });
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "Escape") {
      release();
      return;
    }
    if (event.key !== " " && event.key !== "Enter") return;
    event.preventDefault();
    gesture.current = true;
    if (!event.repeat) start();
  }

  function onKeyUp(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== " " && event.key !== "Enter") return;
    event.preventDefault();
    release();
  }

  const label = purged
    ? "Dead letters purged"
    : holding
      ? `Keep holding · ${(remaining / 1000).toFixed(1)}s`
      : `Hold to purge ${count}`;

  return (
    <div>
      <div data-sh-dead-row className="mb-4 flex items-end justify-between gap-4">
        <p className="leading-none">
          <span
            data-sh-dead
            className="block text-[64px] leading-[0.85] font-extrabold tracking-[-0.05em] tabular-nums"
          >
            {purged ? 0 : count}
          </span>
          <span className="mt-2 block font-mono text-[11px] font-bold tracking-[0.06em] text-(--iu-muted) uppercase">
            Dead letters in hooks
          </span>
        </p>
        <AnimatePresence initial={false}>
          {purged ? (
            <motion.span
              initial={{ scale: 1.3, rotate: -12, opacity: 0 }}
              animate={{ scale: 1, rotate: -6, opacity: 1 }}
              transition={{ duration: 0.12, ease: "linear" }}
              className="mb-2 inline-flex h-7 items-center gap-1 border-2 border-(--iu-foreground) bg-(--iu-foreground) px-2 font-mono text-[11px] font-bold tracking-[0.06em] text-(--iu-surface) uppercase"
            >
              <Check size={12} strokeWidth={3} aria-hidden="true" />
              Purged {count}
            </motion.span>
          ) : null}
        </AnimatePresence>
      </div>
      <button
        type="button"
        data-sh-hold
        aria-describedby={hintId}
        aria-disabled={purged || undefined}
        data-holding={holding ? "" : undefined}
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          gesture.current = true;
          start();
        }}
        onPointerUp={release}
        onPointerCancel={release}
        onContextMenu={(event) => event.preventDefault()}
        onKeyDown={onKeyDown}
        onKeyUp={onKeyUp}
        onBlur={release}
        onClick={() => {
          if (gesture.current) {
            gesture.current = false;
            return;
          }
          start();
        }}
        className={cx(
          "relative block h-14 w-full touch-none overflow-hidden rounded-[min(var(--iu-radius),4px)] border-2 border-(--iu-foreground) bg-(--iu-surface) text-sm font-extrabold tracking-[0.06em] uppercase shadow-[4px_4px_0_var(--sh-ink)] select-none [-webkit-touch-callout:none] aria-disabled:cursor-default aria-disabled:shadow-none data-holding:translate-x-1 data-holding:translate-y-1 data-holding:shadow-none",
          "transition-[translate,box-shadow] duration-100 ease-linear motion-reduce:transition-none",
          FOCUS,
        )}
      >
        <span className="absolute inset-0 flex items-center justify-center gap-2">
          <span className="size-3 border-2 border-current" aria-hidden="true" />
          <span data-sh-hold-label>{label}</span>
        </span>
        <motion.span
          aria-hidden="true"
          data-sh-hold-fill
          style={{ x: fillX }}
          className="absolute inset-0 overflow-hidden bg-(--iu-foreground) text-(--iu-background)"
        >
          <motion.span
            data-sh-hold-fill-label
            style={{ x: labelX }}
            className="absolute inset-0 flex items-center justify-center gap-2"
          >
            <span className="size-3 bg-current" />
            <span data-sh-hold-label>{label}</span>
          </motion.span>
        </motion.span>
      </button>
      <p id={hintId} data-sh-hold-hint aria-live="polite" className="mt-3 font-mono text-[11px] text-(--iu-muted)">
        {purged
          ? `${count} payloads removed from hooks and logged to the audit trail.`
          : "Hold Space, Enter or the pointer for 1.2 seconds."}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------------------------------------------------------
 * Promise statement (redaction reveal)
 * ---------------------------------------------------------------------------------------------------------------- */

type PromisePart = { text: string; redact?: boolean };

const PROMISE: PromisePart[] = [
  { text: "Once you enqueue a job, we never " },
  { text: "drop it quietly", redact: true },
  { text: ", never " },
  { text: "run it twice", redact: true },
  { text: " and never " },
  { text: "forget what happened", redact: true },
  { text: "." },
];

/** Each part with the running index of its redacted phrase (-1 for plain text). */
const PROMISE_PARTS = PROMISE.reduce<{ part: PromisePart; redactIndex: number }[]>((parts, part) => {
  const previous = parts.filter((entry) => entry.redactIndex >= 0).length;
  parts.push({ part, redactIndex: part.redact ? previous : -1 });
  return parts;
}, []);

const RECEIPTS = [
  { value: "0", label: "Jobs dropped", detail: "written to disk before the 202" },
  { value: "1×", label: "Runs per job", detail: "idempotency key checked at claim" },
  { value: "30d", label: "History kept", detail: "payloads, logs and every attempt" },
];

function PromiseStatement({ titleId, children }: { titleId: string; children: ReactNode }) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const endRef = useRef<HTMLUListElement>(null);
  // Indexes still covered. Empty on the server, so the statement is readable without JavaScript.
  const [covered, setCovered] = useState<Set<number>>(() => new Set());

  useEffect(() => {
    const heading = headingRef.current;
    if (!heading || prefersReducedMotion()) return;
    const targets = Array.from(heading.querySelectorAll<HTMLElement>("[data-redaction]"));
    // Phrases already scrolled past stay uncovered: the effect never hides what someone has read.
    const pending = new Set<number>();
    for (const target of targets) {
      if (target.getBoundingClientRect().bottom > 0) pending.add(Number(target.dataset.redaction));
    }
    if (pending.size === 0) return;
    const timers: number[] = [];
    let batch: number[] = [];
    let frame = 0;
    const flush = () => {
      frame = 0;
      const lifting = batch.sort((a, b) => a - b);
      batch = [];
      lifting.forEach((index, order) => {
        timers.push(
          window.setTimeout(
            () =>
              setCovered((current) => {
                const next = new Set(current);
                next.delete(index);
                return next;
              }),
            320 + order * 260,
          ),
        );
      });
    };
    const queue = (index: number) => {
      if (pending.has(index) && !batch.includes(index)) batch.push(index);
      pending.delete(index);
      if (frame === 0) frame = window.requestAnimationFrame(flush);
    };
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          observer.unobserve(entry.target);
          queue(Number((entry.target as HTMLElement).dataset.redaction));
        }
      },
      { rootMargin: "0px 0px -20% 0px", threshold: 1 },
    );
    // Once the receipts are on screen, lift whatever is still covered.
    const endObserver = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      endObserver.disconnect();
      for (const target of targets) {
        observer.unobserve(target);
        queue(Number(target.dataset.redaction));
      }
    });
    let watch = 0;
    const startFrame = window.requestAnimationFrame(() => {
      setCovered(new Set(pending));
      watch = window.requestAnimationFrame(() => {
        for (const target of targets) observer.observe(target);
        if (endRef.current) endObserver.observe(endRef.current);
      });
    });
    return () => {
      window.cancelAnimationFrame(startFrame);
      window.cancelAnimationFrame(watch);
      if (frame) window.cancelAnimationFrame(frame);
      observer.disconnect();
      endObserver.disconnect();
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  return (
    <>
      <h2
        id={titleId}
        ref={headingRef}
        data-sh-promise
        className="max-w-[18ch] text-[clamp(2.25rem,1rem+5vw,5.5rem)] leading-[1.02] font-extrabold tracking-[-0.045em] text-balance"
      >
        {PROMISE_PARTS.map(({ part, redactIndex }, partIndex) => {
          if (!part.redact) return <span key={partIndex}>{part.text}</span>;
          const isCovered = covered.has(redactIndex);
          const words = part.text.split(" ");
          return (
            <span
              key={partIndex}
              data-redaction={redactIndex}
              className="underline decoration-(--iu-accent) [text-decoration-thickness:0.09em] underline-offset-[0.1em] [text-decoration-skip-ink:none]"
            >
              {words.map((word, wordIndex) => (
                <span key={wordIndex}>
                  <span className="relative inline-block">
                    {word}
                    <span
                      aria-hidden="true"
                      data-bar
                      data-delay={wordIndex * 70}
                      data-covered={isCovered ? "" : undefined}
                      style={{ transitionDelay: isCovered ? "0ms" : `${wordIndex * 70}ms` }}
                      className={cx(
                        "absolute top-[0.12em] -bottom-[0.04em] origin-bottom scale-y-0 bg-(--iu-foreground) transition-transform duration-[160ms] ease-[steps(4,end)] data-covered:scale-y-100 motion-reduce:hidden motion-reduce:transition-none",
                        wordIndex === words.length - 1 ? "inset-x-[-0.04em]" : "-right-[0.3em] -left-[0.04em]",
                      )}
                    />
                  </span>
                  {wordIndex < words.length - 1 ? " " : null}
                </span>
              ))}
            </span>
          );
        })}
      </h2>
      <div className="mt-14 grid gap-x-6 gap-y-10 sm:mt-20 lg:grid-cols-12">
        <div className="lg:col-span-5">{children}</div>
        <ul ref={endRef} data-sh-receipts role="list" className="grid gap-4 sm:grid-cols-3 lg:col-span-7">
          {RECEIPTS.map((receipt, index) => (
            <li key={receipt.label} className={cx(BOX, "flex flex-col shadow-[4px_4px_0_var(--sh-ink)]")}>
              <div className="flex items-center justify-between border-b-2 border-(--iu-foreground) px-[calc(16px*var(--iu-density))] py-2 font-mono text-xs font-bold tracking-[0.08em] uppercase">
                <span>{receipt.label}</span>
                <span aria-hidden="true" className="text-(--iu-muted) tabular-nums">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
              <div className="flex flex-1 flex-col gap-3 px-[calc(16px*var(--iu-density))] pt-[calc(12px*var(--iu-density))] pb-[calc(16px*var(--iu-density))]">
                <span className="text-[56px] leading-none font-extrabold tracking-[-0.04em] tabular-nums">
                  {receipt.value}
                </span>
                <span className="mt-auto font-mono text-xs leading-snug text-(--iu-muted)">{receipt.detail}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------------------------------------------------------
 * Pricing (slab pricing)
 * ---------------------------------------------------------------------------------------------------------------- */

function RollingFigure({ value, from, delay }: { value: string; from: string; delay: number }) {
  const chars = value.split("");
  const offset = from.length - value.length;
  return (
    <span aria-hidden="true" data-sh-figure className="flex">
      {chars.map((char, index) => {
        const slot = chars.length - index;
        const digit = DIGITS.indexOf(char);
        if (digit < 0) {
          return (
            <span key={`sep-${slot}`} className="block h-[1em] leading-none">
              {char}
            </span>
          );
        }
        const previous = DIGITS.indexOf(from[index + offset] ?? "");
        const distance = previous < 0 ? 0 : Math.abs(previous - digit);
        const style: CSSProperties = {
          transform: `translateY(${digit * -10}%)`,
          transitionDuration: `${90 + distance * 18}ms`,
          transitionDelay: `${delay + index * 50}ms`,
        };
        return (
          <span key={`digit-${slot}`} className="block h-[1em] overflow-hidden">
            <span
              data-sh-strip
              className="flex flex-col transition-transform ease-linear motion-reduce:transition-none"
              style={style}
            >
              {DIGITS.map((option) => (
                <span key={option} className="block h-[1em] leading-none">
                  {option}
                </span>
              ))}
            </span>
          </span>
        );
      })}
    </span>
  );
}

function BillingSwitch({
  billing,
  savingLabel,
  onSelect,
}: {
  billing: ShuntBilling;
  savingLabel: string;
  onSelect: (billing: ShuntBilling) => void;
}) {
  const name = useId();
  return (
    <fieldset data-sh-billing className="relative w-72 max-w-full min-w-0 sm:w-80">
      <legend className="sr-only">Billing period</legend>
      <div className="relative grid h-14 grid-cols-2 overflow-hidden rounded-[min(var(--iu-radius),4px)] border-2 border-(--iu-foreground) bg-(--iu-surface) shadow-[4px_4px_0_var(--sh-ink)] has-focus-visible:outline-2 has-focus-visible:outline-offset-4 has-focus-visible:outline-(--iu-accent)">
        <span
          aria-hidden="true"
          data-sh-thumb
          className={cx(
            "absolute inset-y-0 left-0 w-1/2 bg-(--iu-foreground) transition-transform duration-100 ease-linear motion-reduce:transition-none",
            billing === "yearly" && "translate-x-full",
          )}
        />
        {(["monthly", "yearly"] as const).map((option) => (
          <label
            key={option}
            className={cx(
              "relative flex cursor-pointer items-center justify-center text-sm font-extrabold tracking-[0.08em] uppercase transition-colors duration-100 ease-linear select-none has-checked:text-(--iu-background) motion-reduce:transition-none pointer-fine:hover:not-has-checked:bg-[color-mix(in_oklab,var(--iu-foreground)_8%,var(--iu-surface))]",
              option === "yearly" && "border-l-2 border-(--iu-foreground)",
            )}
          >
            <input
              type="radio"
              name={name}
              value={option}
              checked={billing === option}
              onChange={() => onSelect(option)}
              className="sr-only"
            />
            {option === "monthly" ? "Monthly" : "Yearly"}
            {option === "yearly" ? <span className="sr-only">, {savingLabel}</span> : null}
          </label>
        ))}
      </div>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-4 -right-3 rotate-[7deg] rounded-[min(var(--iu-radius),2px)] bg-(--iu-foreground) px-3 py-2 font-mono text-xs leading-none font-bold tracking-[0.06em] text-(--iu-background) uppercase ring-2 ring-(--iu-background)"
      >
        {savingLabel}
      </span>
    </fieldset>
  );
}

const SLAB_PAD = "px-6 md:px-4 lg:px-6";

function slabButton(primary: boolean) {
  return cx(
    BUTTON,
    "inline-grid h-12 w-full px-4 text-[13px] tracking-[0.08em] shadow-[4px_4px_0_var(--sh-ink)] md:px-3 lg:px-4",
    primary ? PRIMARY : SECONDARY,
  );
}

function PlanSlab({
  plan,
  index,
  billing,
  status,
  headingRef,
  onCheckout,
}: {
  plan: ShuntPlan;
  index: number;
  billing: ShuntBilling;
  status: ShuntStatus;
  headingRef: RefObject<HTMLHeadingElement | null>;
  onCheckout: (planId: string) => void;
}) {
  const errorId = useId();
  const loading = status === "loading";
  const failed = status === "error";
  const other: ShuntBilling = billing === "yearly" ? "monthly" : "yearly";
  const figure = number.format(plan.price[billing]);
  const previous = number.format(plan.price[other]);
  const yearly = plan.price.yearly * 12;
  const saving = (plan.price.monthly - plan.price.yearly) * 12;
  const note =
    plan.note ??
    (billing === "yearly"
      ? `$${number.format(yearly)} billed yearly${saving > 0 ? `, save $${number.format(saving)}` : ""}`
      : "Billed monthly, cancel anytime");
  const spoken =
    plan.price[billing] === 0
      ? "Free"
      : billing === "yearly"
        ? `$${plan.price.yearly} per month, billed yearly at $${number.format(yearly)}`
        : `$${plan.price.monthly} per month, billed monthly`;

  return (
    <li
      data-plan={plan.id}
      data-name={plan.name}
      data-monthly={plan.price.monthly}
      data-yearly={plan.price.yearly}
      data-note={plan.note}
      data-highlighted={plan.highlighted ? "" : undefined}
      className={cx(
        BOX,
        "grid overflow-hidden transition-[translate,box-shadow] duration-100 ease-linear data-snap:shadow-none motion-reduce:transition-none md:row-span-4 md:grid-rows-subgrid",
        plan.highlighted
          ? "shadow-[12px_12px_0_var(--sh-ink)] data-snap:translate-x-3 data-snap:translate-y-3"
          : "shadow-[8px_8px_0_var(--sh-ink)] data-snap:translate-x-2 data-snap:translate-y-2",
      )}
    >
      <div
        className={cx(
          "border-b-2 border-(--iu-foreground) py-[calc(20px*var(--iu-density))]",
          SLAB_PAD,
          plan.highlighted && "bg-(--iu-accent) text-(--iu-accent-foreground)",
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-xl leading-none font-extrabold uppercase">{plan.name}</h3>
          {plan.badge ? (
            <span className="shrink-0 rounded-[min(var(--iu-radius),2px)] border-2 border-current px-2 py-1 font-mono text-[11px] leading-none font-bold tracking-[0.06em] uppercase">
              {plan.badge}
            </span>
          ) : null}
        </div>
        <p className={cx("mt-3 text-sm leading-snug text-pretty", !plan.highlighted && "text-(--iu-muted)")}>
          {plan.tagline}
        </p>
      </div>

      {status === "success" ? (
        <Confirmation plan={plan} billing={billing} headingRef={headingRef} />
      ) : (
        <>
          <div data-sh-plan-body className={cx("pt-6 pb-6", SLAB_PAD)}>
            <p className="flex items-start text-7xl leading-none font-extrabold tracking-[-0.04em] tabular-nums md:text-5xl lg:text-[72px]">
              <span aria-hidden="true" className="mt-[0.08em] mr-[0.06em] text-[0.42em] leading-none tracking-normal">
                $
              </span>
              <RollingFigure value={figure} from={previous} delay={index * 60 + 40} />
              <span
                aria-hidden="true"
                className="mt-auto mb-[0.1em] ml-2 font-mono text-sm leading-none font-medium tracking-normal text-(--iu-muted)"
              >
                /mo
              </span>
              <span data-sh-spoken className="sr-only">
                {spoken}
              </span>
            </p>
            <p
              data-sh-note
              className="mt-3 font-mono text-[11px] font-medium tracking-[0.04em] text-(--iu-muted) uppercase"
            >
              {note}
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2">
              <span className="rounded-[min(var(--iu-radius),2px)] border-2 border-(--iu-foreground) px-2 py-1 font-mono text-xs leading-none font-bold uppercase">
                {plan.quota}
              </span>
              <span className="font-mono text-xs text-(--iu-muted)">{plan.overage}</span>
            </div>
          </div>

          <div data-sh-plan-body className={cx("border-t-2 border-(--iu-foreground) py-6", SLAB_PAD)}>
            <ul role="list" className="grid gap-3">
              {plan.highlights.map((item) => (
                <li key={item} className="flex items-start gap-3 text-[15px] leading-5">
                  <span
                    aria-hidden="true"
                    className="grid size-5 shrink-0 place-items-center rounded-[min(var(--iu-radius),2px)] bg-(--iu-foreground) text-(--iu-surface)"
                  >
                    <Check size={14} strokeWidth={3} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div data-sh-plan-body className="flex flex-col justify-end px-6 pb-6 md:px-4 lg:px-6">
            {failed ? (
              <div
                id={errorId}
                role="alert"
                className="mb-4 flex overflow-hidden rounded-[min(var(--iu-radius),4px)] border-2 border-(--iu-foreground) bg-(--iu-surface) text-left"
              >
                <span
                  aria-hidden="true"
                  className="flex w-10 shrink-0 justify-center border-r-2 border-(--iu-foreground) bg-red-600 pt-3 text-white dark:bg-red-500"
                >
                  <TriangleAlert size={18} strokeWidth={2.25} />
                </span>
                <div className="min-w-0 px-3 py-3">
                  <p className="text-sm leading-tight font-extrabold">Checkout didn’t open</p>
                  <p className="mt-1 text-[13px] leading-snug text-pretty text-(--iu-muted)">
                    The payment page timed out after 10 seconds. Nothing was charged.
                  </p>
                  <p className="mt-2 font-mono text-[11px] tracking-[0.04em] text-(--iu-muted) uppercase">
                    Error 504 · ref SH-4Q7M
                  </p>
                </div>
              </div>
            ) : null}
            <button
              type="button"
              data-sh-checkout
              aria-disabled={loading || undefined}
              aria-describedby={failed ? errorId : undefined}
              onClick={() => onCheckout(plan.id)}
              className={slabButton(Boolean(plan.highlighted))}
            >
              <span
                data-sh-checkout-label
                className={cx(
                  "col-start-1 row-start-1 inline-flex items-center gap-2 whitespace-nowrap",
                  loading && "invisible",
                )}
              >
                {failed ? <RotateCcw size={16} strokeWidth={2.5} aria-hidden="true" /> : null}
                {failed ? "Retry checkout" : plan.ctaLabel}
                {failed ? null : <Arrow />}
              </span>
              <span
                data-sh-checkout-busy
                aria-hidden={!loading}
                className={cx(
                  "col-start-1 row-start-1 inline-flex items-center gap-2 whitespace-nowrap",
                  !loading && "invisible",
                )}
              >
                <WorkingBlocks running={loading} />
                Opening checkout
              </span>
            </button>
          </div>
        </>
      )}
    </li>
  );
}

function Confirmation({
  plan,
  billing,
  headingRef,
}: {
  plan: ShuntPlan;
  billing: ShuntBilling;
  headingRef: RefObject<HTMLHeadingElement | null>;
}) {
  const months = billing === "yearly" ? 12 : 1;
  const subtotal = plan.price[billing] * months;
  const tax = Math.round(subtotal * 0.19 * 100) / 100;
  const money = (amount: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
  return (
    <div data-sh-confirmation className="flex flex-col px-6 py-6 md:row-span-3 md:px-4 lg:px-6">
      <div className="flex items-start justify-between gap-4">
        <p className="font-mono text-[11px] leading-snug font-bold tracking-[0.06em] text-(--iu-muted) uppercase">
          Order SH-30418
          <span className="block">Oct 27, 2026</span>
        </p>
        <span
          aria-hidden="true"
          className="shrink-0 rotate-[-8deg] rounded-[min(var(--iu-radius),2px)] border-2 border-(--iu-foreground) px-2 py-1 font-mono text-xs leading-none font-bold tracking-[0.12em] uppercase"
        >
          Paid
        </span>
      </div>
      <h3
        ref={headingRef}
        data-sh-c-heading
        tabIndex={-1}
        className="mt-4 text-[32px] leading-none font-extrabold tracking-[-0.04em] text-balance outline-none"
      >
        You’re on {plan.name}.
      </h3>
      <dl className="mt-6 border-t-2 border-(--iu-foreground) font-mono text-[13px] tabular-nums">
        <div className="flex items-start justify-between gap-4 border-b-2 border-dashed border-(--iu-foreground) py-3">
          <dt>
            <span data-sh-c-line>
              {plan.name}, {billing}
            </span>
            <span data-sh-c-unit className="mt-1 block text-(--iu-muted)">
              {months} × {money(plan.price[billing])}
            </span>
          </dt>
          <dd data-sh-c-subtotal>{money(subtotal)}</dd>
        </div>
        <div className="flex items-start justify-between gap-4 border-b-2 border-dashed border-(--iu-foreground) py-3">
          <dt>VAT 19%</dt>
          <dd data-sh-c-tax>{money(tax)}</dd>
        </div>
        <div className="flex items-start justify-between gap-4 border-b-2 border-(--iu-foreground) py-3 text-sm font-bold">
          <dt>Total charged</dt>
          <dd data-sh-c-total>{money(subtotal + tax)}</dd>
        </div>
      </dl>
      <p className="mt-4 text-sm leading-snug text-pretty text-(--iu-muted)">
        Card ending 6021. Renews <span data-sh-c-renews>{billing === "yearly" ? "Oct 27, 2027" : "Nov 27, 2026"}</span>.
        The receipt is in your inbox.
      </p>
      <div className="mt-auto pt-6">
        <a href="#board" data-sh-c-cta className={slabButton(Boolean(plan.highlighted))}>
          <span className="inline-flex items-center gap-2 whitespace-nowrap">
            Open the board
            <Arrow />
          </span>
        </a>
      </div>
    </div>
  );
}

function Pricing({
  plans,
  savingLabel,
  statusProp,
  onCheckout,
}: {
  plans: ShuntPlan[];
  savingLabel: string;
  statusProp?: ShuntStatus;
  onCheckout?: (planId: string, billing: ShuntBilling) => void | Promise<unknown>;
}) {
  const [billing, setBilling] = useState<ShuntBilling>("monthly");
  const [own, setOwn] = useState<{ status: ShuntStatus; planId?: string }>({ status: "idle" });
  const [message, setMessage] = useState("");
  const listRef = useRef<HTMLUListElement>(null);
  const confirmationRef = useRef<HTMLHeadingElement>(null);
  const timers = useRef<number[]>([]);
  const pressed = useRef(false);
  const status = statusProp ?? own.status;
  const highlightedId = (plans.find((plan) => plan.highlighted) ?? plans[0])?.id;
  const activeId = own.planId ?? highlightedId;
  const activePlan = plans.find((plan) => plan.id === activeId);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((timer) => window.clearTimeout(timer));
  }, []);

  useEffect(() => {
    if (status === "success" && pressed.current) confirmationRef.current?.focus();
  }, [status]);

  function selectBilling(next: ShuntBilling) {
    if (next === billing) return;
    setBilling(next);
    setMessage(
      next === "yearly"
        ? `Yearly billing selected. ${savingLabel}. Prices are per month, billed once a year.`
        : "Monthly billing selected.",
    );
    // The slabs stamp into their shadows one after another while the digits roll.
    const slabs = Array.from(listRef.current?.querySelectorAll<HTMLElement>("[data-plan]") ?? []);
    timers.current.splice(0).forEach((timer) => window.clearTimeout(timer));
    slabs.forEach((slab) => slab.removeAttribute("data-snap"));
    if (prefersReducedMotion()) return;
    slabs.forEach((slab, index) => {
      timers.current.push(
        window.setTimeout(() => slab.setAttribute("data-snap", ""), index * 60),
        window.setTimeout(() => slab.removeAttribute("data-snap"), index * 60 + 170),
      );
    });
  }

  function checkout(planId: string) {
    if (status === "loading") return;
    pressed.current = true;
    const result = onCheckout?.(planId, billing);
    if (statusProp !== undefined || !isPromise(result)) return;
    setOwn({ status: "loading", planId });
    result.then(
      () => setOwn({ status: "success", planId }),
      () => setOwn({ status: "error", planId }),
    );
  }

  const announcement = !activePlan
    ? ""
    : status === "loading"
      ? `Opening checkout for ${activePlan.name}.`
      : status === "success"
        ? `Payment confirmed. You’re on ${activePlan.name}.`
        : "";

  return (
    <>
      <div className="mt-12 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <BillingSwitch billing={billing} savingLabel={savingLabel} onSelect={selectBilling} />
        <p className="max-w-[40ch] font-mono text-xs leading-relaxed text-(--iu-muted)">
          Prices in US dollars. Tax is added at checkout from your billing address. Full refund within 14 days of any
          charge.
        </p>
      </div>
      <ul
        ref={listRef}
        role="list"
        className="mt-12 grid gap-10 md:grid-cols-3 md:grid-rows-[auto_auto_1fr_auto] md:gap-x-5 md:gap-y-0 lg:gap-x-8"
      >
        {plans.map((plan, index) => (
          <PlanSlab
            key={plan.id}
            plan={plan}
            index={index}
            billing={billing}
            status={plan.id === activeId ? status : "idle"}
            headingRef={confirmationRef}
            onCheckout={checkout}
          />
        ))}
      </ul>
      <p data-sh-pricing-live aria-live="polite" className="sr-only">
        {message} {announcement}
      </p>
    </>
  );
}

/* ------------------------------------------------------------------------------------------------------------------
 * Final call to action
 * ---------------------------------------------------------------------------------------------------------------- */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function SignupForm({
  statusProp,
  defaultEmail,
  onSignup,
}: {
  statusProp?: ShuntStatus;
  defaultEmail: string;
  onSignup?: (email: string) => void | Promise<unknown>;
}) {
  const [email, setEmail] = useState(defaultEmail);
  const [own, setOwn] = useState<ShuntStatus>("idle");
  const [invalid, setInvalid] = useState(false);
  const inputId = useId();
  const helpId = useId();
  const errorId = useId();
  const successRef = useRef<HTMLParagraphElement>(null);
  const status = statusProp ?? own;
  const showError = invalid || status === "error";

  useEffect(() => {
    if (own === "success") successRef.current?.focus();
  }, [own]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "loading") return;
    if (!EMAIL.test(email.trim())) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    const result = onSignup?.(email.trim());
    if (statusProp !== undefined) return;
    if (!isPromise(result)) {
      setOwn("success");
      return;
    }
    setOwn("loading");
    result.then(
      () => setOwn("success"),
      () => setOwn("error"),
    );
  }

  if (status === "success") {
    return (
      <div data-sh-signup-success className="flex items-start gap-4">
        <span
          aria-hidden="true"
          className="grid size-10 shrink-0 place-items-center border-2 border-(--iu-foreground) bg-(--iu-foreground) text-(--iu-background)"
        >
          <Check size={20} strokeWidth={3} />
        </span>
        <div className="min-w-0">
          <p ref={successRef} tabIndex={-1} role="status" className="text-lg font-extrabold outline-none">
            Check your inbox.
          </p>
          <p className="mt-1 text-sm leading-relaxed text-pretty break-words text-(--iu-muted)">
            We sent a sign-in link to{" "}
            <span data-sh-signup-email className="font-mono text-(--iu-foreground)">
              {email}
            </span>
            . It works for 15 minutes.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form noValidate data-sh-signup onSubmit={submit} className="w-full">
      <label htmlFor={inputId} className={cx(LABEL, "block")}>
        Work email
      </label>
      <div className="mt-2 flex flex-col gap-4 sm:flex-row">
        <input
          id={inputId}
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          placeholder="dana@copperline.co"
          value={email}
          aria-invalid={showError || undefined}
          aria-describedby={showError ? errorId : helpId}
          onChange={(event) => {
            setEmail(event.target.value);
            if (invalid) setInvalid(false);
          }}
          className={cx(
            "h-12 w-full min-w-0 rounded-[min(var(--iu-radius),4px)] border-2 bg-(--iu-surface) px-4 font-mono text-sm text-(--iu-foreground) shadow-[4px_4px_0_var(--sh-ink)] outline-none placeholder:text-(--iu-muted) focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--iu-accent) sm:flex-1",
            showError ? "border-red-700 dark:border-red-400" : "border-(--iu-foreground)",
          )}
        />
        <button
          type="submit"
          data-sh-signup-submit
          aria-disabled={status === "loading" || undefined}
          className={cx(BUTTON, MD, PRIMARY, "shrink-0")}
        >
          <span
            data-sh-signup-label
            className={cx(
              "col-start-1 row-start-1 inline-flex items-center gap-2",
              status === "loading" && "invisible",
            )}
          >
            Create workspace
            <Arrow />
          </span>
          <span
            data-sh-signup-busy
            aria-hidden={status !== "loading"}
            className={cx(
              "col-start-1 row-start-1 inline-flex items-center gap-2",
              status !== "loading" && "invisible",
            )}
          >
            <WorkingBlocks running={status === "loading"} />
            Creating
          </span>
        </button>
      </div>
      {showError ? (
        <p
          id={errorId}
          role="alert"
          data-sh-signup-error
          className="mt-3 flex items-start gap-2 text-sm font-medium text-red-700 dark:text-red-400"
        >
          <TriangleAlert size={16} strokeWidth={2.25} aria-hidden="true" className="mt-0.5 shrink-0" />
          {status === "error" && !invalid
            ? "That address bounced. Check the spelling, or use another work email."
            : "Enter an email with an @ and a domain, like dana@copperline.co."}
        </p>
      ) : (
        <p id={helpId} data-sh-signup-help className="mt-3 font-mono text-xs text-(--iu-muted)">
          Free up to 50K jobs a month. No card, no sales call.
        </p>
      )}
      <p data-sh-signup-live aria-live="polite" className="sr-only">
        {status === "loading" ? "Creating your workspace." : ""}
      </p>
    </form>
  );
}

/* ------------------------------------------------------------------------------------------------------------------
 * Page
 * ---------------------------------------------------------------------------------------------------------------- */

export function ShuntLandingTemplate({
  brand = "Shunt",
  anchorPrefix = "shunt",
  nav = DEFAULT_NAV,
  signInHref = "#sign-in",
  announcement = "New · Cron lanes in v3.2",
  headline = "Every background job, out in the open.",
  headlineMark = "out in the open",
  subline = "Shunt is a job queue with a board you can read. Watch each job move from queued to done, retry the ones that fail, and never wonder where one went.",
  ctaLabel = "Start free",
  ctaHref = "#shunt-start",
  ctaNote = "Free up to 50K jobs a month. No card.",
  jobs = DEFAULT_JOBS,
  doneToday = 48213,
  proofs = DEFAULT_PROOFS,
  plans = DEFAULT_PLANS,
  savingLabel = "Save 20%",
  faqs = DEFAULT_FAQS,
  footerColumns = DEFAULT_FOOTER,
  checkoutStatus,
  onCheckout,
  signupStatus,
  defaultEmail = "",
  onSignup,
  onRetryJob,
  onPurge,
  className = "",
}: ShuntLandingTemplateProps) {
  const reduceMotion = useReducedMotion();
  const uid = useId();
  const ids = {
    hero: `${uid}-hero`,
    product: `${uid}-product-title`,
    promise: `${uid}-promise`,
    proof: `${uid}-proof-title`,
    pricing: `${uid}-pricing-title`,
    faq: `${uid}-faq-title`,
    cta: `${uid}-cta`,
  };
  const markAt = headline.indexOf(headlineMark);
  const headlineParts =
    headlineMark && markAt >= 0
      ? [headline.slice(0, markAt), headlineMark, headline.slice(markAt + headlineMark.length)]
      : [headline, "", ""];

  return (
    <MotionConfig
      reducedMotion="user"
      transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 400, damping: 30 }}
    >
      <div
        id={`${anchorPrefix}-top`}
        className={cx(
          "min-h-dvh bg-(--iu-background) font-(family-name:--iu-font) text-(--iu-foreground) [--sh-ink:var(--iu-foreground)] dark:[--sh-ink:color-mix(in_oklab,var(--iu-foreground)_40%,var(--iu-background))]",
          className,
        )}
      >
        <SiteHeader
          topHref={`#${anchorPrefix}-top`}
          brand={brand}
          nav={nav}
          signInHref={signInHref}
          ctaLabel={ctaLabel}
          ctaHref={ctaHref}
        />

        <main>
          {/* Hero */}
          <section aria-labelledby={ids.hero} className="overflow-hidden">
            <div className={cx(WRAP, "pt-10 pb-20 sm:pt-16 sm:pb-28")}>
              <p className="inline-block -rotate-2 rounded-[min(var(--iu-radius),4px)] border-2 border-(--iu-foreground) bg-(--iu-surface) px-3 py-1.5 font-mono text-xs font-bold tracking-[0.06em] uppercase shadow-[3px_3px_0_var(--sh-ink)]">
                {announcement}
              </p>
              <h1
                id={ids.hero}
                className="mt-8 max-w-[15ch] text-[clamp(2.75rem,1.2rem+6.4vw,7rem)] leading-[0.94] font-extrabold tracking-[-0.05em] text-balance"
              >
                {headlineParts[0]}
                {headlineParts[1] ? (
                  <span className="underline decoration-(--iu-accent) [text-decoration-thickness:0.1em] underline-offset-[0.08em] [text-decoration-skip-ink:none]">
                    {headlineParts[1]}
                  </span>
                ) : null}
                {headlineParts[2]}
              </h1>
              <div className="mt-12 grid gap-x-8 gap-y-14 sm:mt-16 lg:grid-cols-12">
                <div className="flex flex-col lg:col-span-4">
                  <p className="max-w-[40ch] text-base leading-relaxed text-pretty text-(--iu-muted) sm:text-lg">
                    {subline}
                  </p>
                  <div className="mt-8 flex flex-col items-start gap-4">
                    <a
                      href={ctaHref}
                      className={cx(
                        BUTTON,
                        PRIMARY,
                        "inline-grid h-14 px-6 text-base tracking-[0.06em] shadow-[4px_4px_0_var(--sh-ink)]",
                      )}
                    >
                      <span className="inline-flex items-center gap-2">
                        {ctaLabel}
                        <Arrow />
                      </span>
                    </a>
                    <span className="font-mono text-xs text-(--iu-muted)">{ctaNote}</span>
                  </div>
                  <figure className={cx(BOX, "mt-12 hidden shadow-[4px_4px_0_var(--sh-ink)] lg:mt-auto lg:block")}>
                    <figcaption className="flex items-center justify-between border-b-2 border-(--iu-foreground) px-4 py-2 font-mono text-[11px] font-bold tracking-[0.06em] uppercase">
                      <span>checkout.ts</span>
                      <span className="text-(--iu-muted)">Node SDK</span>
                    </figcaption>
                    <pre className="overflow-x-auto p-4 font-mono text-[12px] leading-relaxed">
                      <code>
                        <span className="text-(--iu-muted)">{SNIPPET_COMMENT}</span>
                        {"\n"}
                        {SNIPPET}
                      </code>
                    </pre>
                  </figure>
                </div>
                <div className="min-w-0 lg:col-span-8">
                  <QueueBoard initialJobs={jobs} doneToday={doneToday} onRetryJob={onRetryJob} />
                </div>
              </div>
            </div>
          </section>

          {/* Product */}
          <section
            id={`${anchorPrefix}-product`}
            aria-labelledby={ids.product}
            className="scroll-mt-16 border-t-2 border-(--iu-foreground)"
          >
            <div className={cx(WRAP, "py-20 sm:py-28")}>
              <SectionLabel index="01">The product</SectionLabel>
              <h2
                id={ids.product}
                className="mt-6 max-w-[16ch] text-[clamp(2.25rem,1.2rem+3.6vw,4.5rem)] leading-[0.98] font-extrabold tracking-[-0.045em] text-balance"
              >
                Built for the queue at 3 a.m.
              </h2>
              <ul role="list" className="mt-14 grid gap-6 lg:grid-cols-12 lg:gap-8">
                <FeatureCell
                  index="A"
                  title="Find any job"
                  body="Paste an ID, a job type or an error. The palette jumps to the job and puts its actions under Enter."
                  className="lg:col-span-7"
                >
                  <PaletteMini />
                </FeatureCell>
                <FeatureCell
                  index="B"
                  title="Backoff, built in"
                  body="Each retry waits four times longer than the last, so a flaky partner gets room to recover."
                  className="lg:col-span-5"
                >
                  <BackoffMini />
                </FeatureCell>
                <FeatureCell
                  index="C"
                  title="Purge on purpose"
                  body="Clearing dead letters takes a held press, not a stray click, and lands in the audit log."
                  className="lg:col-span-5"
                >
                  <HoldToPurge count={312} onPurge={onPurge} />
                </FeatureCell>
                <FeatureCell
                  index="D"
                  title="Throughput by the hour"
                  body="See what finished first time and what needed a retry, hour by hour, before anyone asks."
                  className="lg:col-span-7"
                >
                  <ThroughputMini />
                </FeatureCell>
              </ul>
            </div>
          </section>

          {/* Promise */}
          <section aria-labelledby={ids.promise} className="border-t-2 border-(--iu-foreground)">
            <div className={cx(WRAP, "py-20 sm:py-28")}>
              <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
                <SectionLabel index="02">The guarantee</SectionLabel>
                <span className="rotate-3 rounded-[min(var(--iu-radius),4px)] border-2 border-(--iu-foreground) bg-(--iu-surface) px-3 py-1.5 font-mono text-xs font-bold tracking-[0.08em] uppercase shadow-[3px_3px_0_var(--sh-ink)]">
                  In the terms since v1
                </span>
              </div>
              <PromiseStatement titleId={ids.promise}>
                <p className="max-w-[36rem] text-base leading-relaxed text-pretty text-(--iu-muted) sm:text-lg">
                  Every enqueue is written to two disks before the API answers. Workers claim jobs with a lease and an
                  idempotency key, and every attempt keeps its logs for 30 days.
                </p>
              </PromiseStatement>
            </div>
          </section>

          {/* Proof */}
          <section
            id={`${anchorPrefix}-proof`}
            aria-labelledby={ids.proof}
            className="scroll-mt-16 border-t-2 border-(--iu-foreground)"
          >
            <div className={cx(WRAP, "py-20 sm:py-28")}>
              <SectionLabel index="03">Customers</SectionLabel>
              <h2
                id={ids.proof}
                className="mt-6 max-w-[16ch] text-[clamp(2.25rem,1.2rem+3.6vw,4.5rem)] leading-[0.98] font-extrabold tracking-[-0.045em] text-balance"
              >
                Receipts, not ratings.
              </h2>
              <ul role="list" className="mt-14 grid gap-6 md:grid-cols-3 lg:gap-8">
                {proofs.map((proof) => (
                  <li key={proof.name} className={cx(BOX, "flex flex-col shadow-[6px_6px_0_var(--sh-ink)]")}>
                    <figure className="m-0 flex flex-1 flex-col">
                      <div className="border-b-2 border-(--iu-foreground) p-[calc(20px*var(--iu-density))]">
                        <p className={LABEL}>{proof.metric}</p>
                        <p className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1 font-extrabold tabular-nums">
                          <span
                            aria-hidden="true"
                            className="text-2xl tracking-[-0.03em] text-(--iu-muted) line-through decoration-2"
                          >
                            {proof.before}
                          </span>
                          <ArrowRight size={20} strokeWidth={2.5} aria-hidden="true" className="self-center" />
                          <span aria-hidden="true" className="text-[56px] leading-none tracking-[-0.05em]">
                            {proof.after}
                          </span>
                          <span className="sr-only">
                            {proof.metric} went from {proof.before} to {proof.after}.
                          </span>
                        </p>
                      </div>
                      <blockquote className="flex-1 p-[calc(20px*var(--iu-density))] text-[15px] leading-relaxed text-pretty">
                        “{proof.quote}”
                      </blockquote>
                      <figcaption className="flex items-center gap-3 border-t-2 border-(--iu-foreground) p-[calc(16px*var(--iu-density))]">
                        <span
                          aria-hidden="true"
                          className="grid size-10 shrink-0 place-items-center border-2 border-(--iu-foreground) bg-(--iu-foreground) text-sm font-extrabold text-(--iu-background)"
                        >
                          {proof.name
                            .split(" ")
                            .map((part) => part[0] ?? "")
                            .join("")
                            .slice(0, 2)}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-extrabold">{proof.name}</span>
                          <span className="block text-xs text-(--iu-muted)">
                            {proof.role}, {proof.company}
                          </span>
                          <span className="mt-1 block font-mono text-[11px] text-(--iu-muted) uppercase">
                            {proof.source}
                          </span>
                        </span>
                      </figcaption>
                    </figure>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Pricing */}
          <section
            id={`${anchorPrefix}-pricing`}
            aria-labelledby={ids.pricing}
            className="scroll-mt-16 border-t-2 border-(--iu-foreground)"
          >
            <div className={cx(WRAP, "py-20 sm:py-28")}>
              <SectionLabel index="04">Pricing</SectionLabel>
              <h2
                id={ids.pricing}
                className="mt-6 max-w-[16ch] text-[clamp(2.25rem,1.2rem+3.6vw,4.5rem)] leading-[0.98] font-extrabold tracking-[-0.045em] text-balance"
              >
                Pay for jobs, not retries.
              </h2>
              <Pricing plans={plans} savingLabel={savingLabel} statusProp={checkoutStatus} onCheckout={onCheckout} />
            </div>
          </section>

          {/* FAQ */}
          <section
            id={`${anchorPrefix}-faq`}
            aria-labelledby={ids.faq}
            className="scroll-mt-16 border-t-2 border-(--iu-foreground)"
          >
            <div className={cx(WRAP, "grid gap-x-8 gap-y-12 py-20 sm:py-28 lg:grid-cols-12")}>
              <div className="lg:col-span-4">
                <SectionLabel index="05">FAQ</SectionLabel>
                <h2
                  id={ids.faq}
                  className="mt-6 text-[clamp(2.25rem,1.2rem+3.6vw,4.5rem)] leading-[0.98] font-extrabold tracking-[-0.045em] text-balance"
                >
                  Asked this week.
                </h2>
              </div>
              <div className={cx(BOX, "shadow-[6px_6px_0_var(--sh-ink)] lg:col-span-8")}>
                {faqs.map((faq, index) => (
                  <details
                    key={faq.question}
                    open={index === 0}
                    className="group border-(--iu-foreground) not-first:border-t-2"
                  >
                    <summary
                      className={cx(
                        "flex min-h-16 cursor-pointer list-none items-center gap-4 px-[calc(20px*var(--iu-density))] py-3 text-base font-extrabold sm:text-lg pointer-fine:hover:bg-[color-mix(in_oklab,var(--iu-foreground)_6%,var(--iu-surface))] [&::-webkit-details-marker]:hidden",
                        "outline-offset-[-6px] focus-visible:outline-2 focus-visible:outline-(--iu-accent)",
                      )}
                    >
                      <span className="w-6 shrink-0 font-mono text-xs text-(--iu-muted) tabular-nums">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="flex-1">{faq.question}</span>
                      <span
                        aria-hidden="true"
                        className="grid size-8 shrink-0 place-items-center border-2 border-(--iu-foreground) group-open:bg-(--iu-foreground) group-open:text-(--iu-background)"
                      >
                        <Plus
                          size={16}
                          strokeWidth={3}
                          className="transition-transform duration-100 ease-linear group-open:rotate-45 motion-reduce:transition-none"
                        />
                      </span>
                    </summary>
                    <p className="max-w-[60ch] pr-[calc(20px*var(--iu-density))] pb-6 pl-[calc(20px*var(--iu-density)_+_40px)] text-[15px] leading-relaxed text-pretty text-(--iu-muted)">
                      {faq.answer}
                    </p>
                  </details>
                ))}
              </div>
            </div>
          </section>

          {/* Final CTA */}
          <section
            id={`${anchorPrefix}-start`}
            aria-labelledby={ids.cta}
            className="scroll-mt-16 border-t-2 border-(--iu-foreground)"
          >
            <div className={cx(WRAP, "py-20 sm:py-28")}>
              <div className="relative overflow-hidden rounded-[min(var(--iu-radius),4px)] border-2 border-(--iu-foreground) bg-(--iu-surface) shadow-[8px_8px_0_var(--sh-ink)] sm:shadow-[12px_12px_0_var(--sh-ink)]">
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-[linear-gradient(var(--iu-border)_2px,transparent_2px),linear-gradient(90deg,var(--iu-border)_2px,transparent_2px)] bg-size-[40px_40px]"
                />
                <div className="relative grid gap-x-8 gap-y-10 p-6 sm:p-10 lg:grid-cols-12 lg:p-14">
                  <div className="lg:col-span-6">
                    <h2
                      id={ids.cta}
                      className="max-w-[14ch] text-[clamp(2.5rem,1.2rem+4.6vw,5rem)] leading-[0.95] font-extrabold tracking-[-0.05em] text-balance"
                    >
                      Put your next job on the board.
                    </h2>
                  </div>
                  <div className="self-end lg:col-span-6">
                    <div data-sh-signup-box className="border-2 border-(--iu-foreground) bg-(--iu-surface) p-5 sm:p-6">
                      <SignupForm statusProp={signupStatus} defaultEmail={defaultEmail} onSignup={onSignup} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>

        <footer className="border-t-2 border-(--iu-foreground)">
          <div className={cx(WRAP, "pt-16 pb-8")}>
            <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-6">
              <div className="col-span-2">
                <a
                  href={`#${anchorPrefix}-top`}
                  className={cx("inline-flex items-center gap-2.5 rounded-[2px]", FOCUS)}
                >
                  <ShuntMark />
                  <span className="text-xl font-extrabold tracking-[-0.03em] uppercase">{brand}</span>
                </a>
                <p className="mt-4 max-w-[30ch] text-sm leading-relaxed text-pretty text-(--iu-muted)">
                  The job queue with a board you can read. Made in Lisbon and Toronto.
                </p>
              </div>
              {footerColumns.map((column) => (
                <nav key={column.title} aria-label={column.title}>
                  <p className={LABEL}>{column.title}</p>
                  <ul role="list" className="mt-4 grid gap-1">
                    {column.links.map((link) => (
                      <li key={link.label}>
                        <a
                          href={link.href}
                          className={cx(
                            "inline-flex min-h-8 items-center rounded-[2px] text-sm decoration-2 underline-offset-4 pointer-coarse:min-h-10 pointer-fine:hover:underline",
                            FOCUS,
                          )}
                        >
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              ))}
            </div>
            <p
              aria-hidden="true"
              className="mt-16 overflow-hidden text-[clamp(5rem,29vw,22.5rem)] leading-[0.78] font-extrabold tracking-[-0.07em] uppercase select-none"
            >
              {brand}
            </p>
            <div className="mt-6 flex flex-col gap-4 border-t-2 border-(--iu-foreground) pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="font-mono text-xs text-(--iu-muted)">© 2026 Shunt Labs, Inc.</p>
              <a
                href="#status"
                className={cx(
                  "inline-flex h-10 items-center gap-2 self-start rounded-[min(var(--iu-radius),4px)] border-2 border-(--iu-foreground) px-3 font-mono text-xs font-bold uppercase sm:self-auto",
                  FOCUS,
                )}
              >
                <span aria-hidden="true" className="size-2.5 bg-emerald-600 dark:bg-emerald-400" />
                All queues running
              </a>
            </div>
          </div>
        </footer>
      </div>
    </MotionConfig>
  );
}

export default ShuntLandingTemplate;
