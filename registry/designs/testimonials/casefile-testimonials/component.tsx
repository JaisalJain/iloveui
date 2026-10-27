"use client";

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  AnimatePresence,
  MotionConfig,
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";
import { ArrowDownRight, ArrowUpRight, FilterX } from "lucide-react";

export type CasefileSize = "small" | "mid" | "large";
export type CasefileMetric = "response" | "csat" | "deflection";

export type CasefileStory = {
  id: string;
  name: string;
  role: string;
  company: string;
  industry: string;
  size: CasefileSize;
  quote: string;
  /** The metric this customer leads with; it gets the chart. */
  headline: CasefileMetric;
  /** Median first response in minutes, before and after rollout. */
  response: [number, number];
  /** CSAT in percent, before and after rollout. */
  csat: [number, number];
  /** Share of tickets resolved without an agent after rollout, in percent. */
  deflection: number;
  rolledOut: string;
  agents: number;
};

export type CasefileTestimonialsProps = {
  product?: string;
  kicker?: string;
  headline?: string;
  subline?: string;
  stories?: CasefileStory[];
  industries?: string[];
  defaultIndustry?: string;
  defaultSize?: CasefileSize | "all";
  /** Weeks charted per story; rollout happens at `liveWeek`. */
  weeks?: number;
  liveWeek?: number;
  status?: "ready" | "loading";
  onOpenStory?: (id: string) => void;
  className?: string;
};

const SIZES: { id: CasefileSize | "all"; label: string; spoken: string }[] = [
  { id: "all", label: "Any size", spoken: "Any size" },
  { id: "small", label: "1–200", spoken: "1 to 200 people" },
  { id: "mid", label: "201–1k", spoken: "201 to 1,000 people" },
  { id: "large", label: "1k+", spoken: "more than 1,000 people" },
];

const DEFAULT_STORIES: CasefileStory[] = [
  {
    id: "quillpay",
    name: "Priya Natarajan",
    role: "Head of Support",
    company: "Quillpay",
    industry: "Fintech",
    size: "mid",
    quote:
      "Card disputes used to sit overnight. Sorrel routes them to the two people who can close them, with the ledger already attached.",
    headline: "response",
    response: [252, 38],
    csat: [81, 93],
    deflection: 34,
    rolledOut: "Mar 2026",
    agents: 22,
  },
  {
    id: "brightcart",
    name: "Tomasz Wierzbicki",
    role: "Support Operations Lead",
    company: "Brightcart",
    industry: "Retail",
    size: "large",
    quote:
      "Where is my order is now answered before anyone opens a ticket. Our agents spend the day on returns that need judgement.",
    headline: "deflection",
    response: [190, 55],
    csat: [78, 88],
    deflection: 41,
    rolledOut: "Nov 2025",
    agents: 140,
  },
  {
    id: "carewell",
    name: "Adaeze Okonkwo",
    role: "VP Patient Experience",
    company: "Carewell Clinics",
    industry: "Health",
    size: "large",
    quote:
      "Patients get a person who can see their booking history. Satisfaction moved more in one quarter than in the previous two years.",
    headline: "csat",
    response: [300, 72],
    csat: [74, 91],
    deflection: 22,
    rolledOut: "Jan 2026",
    agents: 96,
  },
  {
    id: "routekit",
    name: "Lukas Brenner",
    role: "Co-founder",
    company: "Routekit",
    industry: "Logistics",
    size: "small",
    quote:
      "Three of us answered tickets between deliveries. Now the driver ETA goes out on its own and we only see the real problems.",
    headline: "response",
    response: [610, 45],
    csat: [85, 94],
    deflection: 29,
    rolledOut: "Feb 2026",
    agents: 3,
  },
  {
    id: "stackmint",
    name: "Mei Lin Ho",
    role: "Support Lead",
    company: "Stackmint",
    industry: "SaaS",
    size: "small",
    quote:
      "Half our questions were answered in the docs already. Sorrel finds the right page and the customer closes the loop themselves.",
    headline: "deflection",
    response: [95, 21],
    csat: [88, 95],
    deflection: 47,
    rolledOut: "Apr 2026",
    agents: 6,
  },
  {
    id: "harborfleet",
    name: "Rafael Duarte",
    role: "Director of Support",
    company: "Harborfleet",
    industry: "Logistics",
    size: "mid",
    quote:
      "Customs holds are stressful for customers. Agents now reply with the exact document missing, and the scores show it.",
    headline: "csat",
    response: [240, 64],
    csat: [79, 90],
    deflection: 26,
    rolledOut: "Dec 2025",
    agents: 31,
  },
  {
    id: "kindred",
    name: "Sanna Virtanen",
    role: "Head of Member Services",
    company: "Kindred Health",
    industry: "Health",
    size: "mid",
    quote:
      "Claims questions arrive with the member's plan beside them. Our first reply is the right reply far more often.",
    headline: "response",
    response: [380, 52],
    csat: [80, 89],
    deflection: 19,
    rolledOut: "May 2026",
    agents: 48,
  },
  {
    id: "tillwise",
    name: "Omar Haddad",
    role: "CX Manager",
    company: "Tillwise",
    industry: "Fintech",
    size: "large",
    quote:
      "Merchants reset their own payout schedules now. That single flow removed more tickets than any hire we made last year.",
    headline: "deflection",
    response: [175, 49],
    csat: [82, 90],
    deflection: 38,
    rolledOut: "Oct 2025",
    agents: 120,
  },
  {
    id: "patchwork",
    name: "Grace Whitfield",
    role: "Support Engineer",
    company: "Patchwork CI",
    industry: "SaaS",
    size: "mid",
    quote:
      "Build failures come in with the log excerpt and the failing step. I answer engineers like an engineer, and they notice.",
    headline: "csat",
    response: [120, 33],
    csat: [83, 96],
    deflection: 31,
    rolledOut: "Jun 2026",
    agents: 12,
  },
];

const METRIC_LABEL: Record<CasefileMetric, string> = {
  response: "First response",
  csat: "CSAT",
  deflection: "Resolved without an agent",
};

// Fixed week-to-week noise so the series look measured, not drawn with a ruler.
const NOISE = [0.04, -0.03, 0.06, -0.01, 0.05, -0.04, 0.02, 0.03, -0.02, 0.04, -0.03, 0.01, 0.02, -0.01];

function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function minutes(value: number) {
  if (value < 60) return `${value}m`;
  const h = Math.floor(value / 60);
  const m = value % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

/** Self-serve resolution before rollout: the help centre alone. */
function deflectionBase(story: CasefileStory) {
  return Math.max(3, Math.round(story.deflection * 0.12));
}

function median(values: number[]) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

/** Weekly values: flat with noise before rollout, then easing toward the new level. */
function series(story: CasefileStory, weeks: number, liveWeek: number) {
  const [before, after] =
    story.headline === "response"
      ? story.response
      : story.headline === "csat"
        ? story.csat
        : [deflectionBase(story), story.deflection];
  const seed = story.id.length;
  return Array.from({ length: weeks }, (_, week) => {
    const noise = NOISE[(week + seed) % NOISE.length]!;
    if (week < liveWeek) return before * (1 + noise * (story.headline === "csat" ? 0.3 : 1));
    const t = Math.min(1, (week - liveWeek + 1) / 4);
    const eased = 1 - Math.pow(1 - t, 2);
    const value = before + (after - before) * eased;
    return value * (1 + noise * (story.headline === "csat" ? 0.15 : 0.5));
  });
}

function Delta({ value, unit, better }: { value: number; unit: string; better: boolean }) {
  const up = value > 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cx(
        "inline-flex items-center gap-0.5 font-mono text-[12px] font-medium whitespace-nowrap tabular-nums",
        better ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400",
      )}
    >
      <Icon size={14} strokeWidth={1.75} aria-hidden="true" />
      {up ? "+" : "−"}
      {Math.abs(value)}
      {unit}
      <span className="sr-only">{better ? ", an improvement" : ", a decline"}</span>
    </span>
  );
}

/** Sparkline with a rollout marker. It draws once when it first comes into view; under reduced motion it is static. */
function Chart({
  story,
  weeks,
  liveWeek,
  label,
}: {
  story: CasefileStory;
  weeks: number;
  liveWeek: number;
  label: string;
}) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<SVGSVGElement>(null);
  const draw = useMotionValue(1);
  const values = series(story, weeks, liveWeek);
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const W = 240;
  const H = 56;
  const x = (i: number) => (i / (weeks - 1)) * W;
  const y = (v: number) => 4 + (1 - (v - lo) / (hi - lo || 1)) * (H - 8);
  const points = values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`);
  const beforePath = `M${points.slice(0, liveWeek + 1).join("L")}`;
  const afterPath = `M${points.slice(liveWeek).join("L")}`;
  const area = `${afterPath}L${W},${H}L${x(liveWeek).toFixed(1)},${H}Z`;
  const lineX = x(liveWeek);
  // Revealed by a clip from left to right, which keeps the hairline strokes crisp at any width.
  const revealWidth = useTransform(draw, (v) => v * (W + 4));
  const clipId = useId();

  useLayoutEffect(() => {
    const node = ref.current;
    if (reduceMotion || !node || typeof IntersectionObserver === "undefined") return;
    let controls: ReturnType<typeof animate> | undefined;
    const run = () => {
      draw.set(0);
      controls = animate(draw, 1, { duration: 0.9, ease: [0.2, 0.8, 0.2, 1] });
    };
    const rect = node.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      run();
      return () => controls?.stop();
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) {
        observer.disconnect();
        run();
      }
    });
    observer.observe(node);
    return () => {
      observer.disconnect();
      controls?.stop();
    };
  }, [draw, reduceMotion]);

  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={label}
      className="block h-14 w-full overflow-visible"
    >
      <line x1="0" x2={W} y1={H} y2={H} stroke="var(--iu-border)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      <line
        x1={lineX}
        x2={lineX}
        y1="0"
        y2={H}
        stroke="var(--iu-muted)"
        strokeWidth="1"
        strokeDasharray="2 3"
        vectorEffect="non-scaling-stroke"
      />
      <defs>
        <clipPath id={clipId}>
          <motion.rect x="-2" y="-4" height={H + 8} width={revealWidth} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <path d={area} fill="var(--iu-accent)" opacity="0.1" />
        <path
          d={beforePath}
          fill="none"
          stroke="var(--iu-muted)"
          strokeWidth="1.5"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d={afterPath}
          fill="none"
          stroke="var(--iu-accent)"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </g>
    </svg>
  );
}

/** A KPI value that steps to its new figure when the filter changes. */
function Ticker({ value, format }: { value: number | null; format: (v: number) => string }) {
  const reduceMotion = useReducedMotion();
  const mv = useMotionValue(value ?? 0);
  const text = useTransform(mv, (v) => format(Math.round(v)));
  useEffect(() => {
    if (value === null) return;
    const controls = animate(mv, value, reduceMotion ? { duration: 0 } : { duration: 0.4, ease: "easeOut" });
    return () => controls.stop();
  }, [mv, reduceMotion, value]);
  if (value === null) return <span className="text-(--iu-muted)">–</span>;
  return (
    <>
      <motion.span aria-hidden="true">{text}</motion.span>
      <span className="sr-only">{format(value)}</span>
    </>
  );
}

function StoryCard({
  story,
  weeks,
  liveWeek,
  onOpen,
}: {
  story: CasefileStory;
  weeks: number;
  liveWeek: number;
  onOpen?: (id: string) => void;
}) {
  const titleId = useId();
  const size = SIZES.find((s) => s.id === story.size)!;
  const [respBefore, respAfter] = story.response;
  const [csatBefore, csatAfter] = story.csat;
  const respChange = Math.round(((respAfter - respBefore) / respBefore) * 100);
  const head =
    story.headline === "response"
      ? { from: minutes(respBefore), to: minutes(respAfter), delta: respChange, unit: "%", better: respChange < 0 }
      : story.headline === "csat"
        ? { from: `${csatBefore}%`, to: `${csatAfter}%`, delta: csatAfter - csatBefore, unit: " pts", better: true }
        : {
            from: `${deflectionBase(story)}%`,
            to: `${story.deflection}%`,
            delta: story.deflection - deflectionBase(story),
            unit: " pts",
            better: true,
          };
  const chartLabel = `${METRIC_LABEL[story.headline]} for ${story.company} over ${weeks} weeks, before and after rollout in week ${liveWeek + 1}: ${head.from ? `${head.from} to ${head.to}` : head.to}.`;

  return (
    <article
      aria-labelledby={titleId}
      className="flex h-full flex-col rounded-[min(var(--iu-radius),6px)] border border-(--iu-border) bg-(--iu-surface) text-[13px] leading-[1.4] dark:border-(--iu-foreground)/10"
    >
      <header className="flex items-start gap-3 p-[calc(16px*var(--iu-density))] pb-0">
        <span
          aria-hidden="true"
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-[min(var(--iu-radius),6px)] bg-(--iu-foreground)/8 text-[12px] font-semibold tracking-wide dark:bg-(--iu-foreground)/12"
        >
          {initials(story.name)}
        </span>
        <div className="min-w-0 flex-1">
          <h3 id={titleId} className="truncate text-[14px] font-semibold">
            {story.name}
          </h3>
          <p className="truncate text-(--iu-muted)">
            {story.role}, {story.company}
          </p>
        </div>
        <p className="shrink-0 text-right font-mono text-[11px] leading-[1.5] text-(--iu-muted)">
          {story.industry}
          <span className="block tabular-nums">
            <span aria-hidden="true">{size.label}</span>
            <span className="sr-only">{size.spoken}</span>
          </span>
        </p>
      </header>

      <blockquote className="px-[calc(16px*var(--iu-density))] pt-3 text-pretty">
        <p>{story.quote}</p>
      </blockquote>

      <figure className="mt-auto pt-4">
        <div className="mx-[calc(16px*var(--iu-density))] border-t border-(--iu-border) pt-3 dark:border-(--iu-foreground)/10">
          <figcaption className="flex items-baseline justify-between gap-3">
            <span className="text-[11px] font-medium tracking-[0.06em] text-(--iu-muted) uppercase">
              {METRIC_LABEL[story.headline]}
            </span>
            <Delta value={head.delta} unit={head.unit} better={head.better} />
          </figcaption>
          <p className="mt-1 font-mono text-[18px] font-medium tracking-[-0.02em] tabular-nums">
            {head.from ? (
              <>
                <span className="text-(--iu-muted)">{head.from}</span>
                <span aria-hidden="true" className="px-1.5 text-(--iu-muted)">
                  →
                </span>
                <span className="sr-only"> to </span>
              </>
            ) : null}
            {head.to}
          </p>
          <div className="mt-2">
            <Chart story={story} weeks={weeks} liveWeek={liveWeek} label={chartLabel} />
            <div
              aria-hidden="true"
              className="relative mt-1 flex justify-between font-mono text-[10px] text-(--iu-muted) tabular-nums"
            >
              <span>wk 1</span>
              <span
                className="absolute top-0 -translate-x-1/2 whitespace-nowrap"
                style={{ left: `${(liveWeek / (weeks - 1)) * 100}%` }}
              >
                live {story.rolledOut}
              </span>
              <span>wk {weeks}</span>
            </div>
          </div>
        </div>
        <dl className="mt-3 grid grid-cols-3 border-t border-(--iu-border) font-mono text-[11px] tabular-nums dark:border-(--iu-foreground)/10">
          {(
            [
              ["Reply", minutes(respAfter)],
              ["CSAT", `${csatAfter}%`],
              ["Agents", String(story.agents)],
            ] as const
          ).map(([label, value], index) => (
            <div
              key={label}
              className={cx(
                "px-[calc(16px*var(--iu-density))] py-[calc(10px*var(--iu-density))]",
                index > 0 && "border-l border-(--iu-border) dark:border-(--iu-foreground)/10",
              )}
            >
              <dt className="text-(--iu-muted)">{label}</dt>
              <dd className="mt-0.5 text-[13px] text-(--iu-foreground)">{value}</dd>
            </div>
          ))}
        </dl>
        {onOpen ? (
          <button
            type="button"
            onClick={() => onOpen(story.id)}
            className="flex h-10 w-full items-center justify-center border-t border-(--iu-border) text-[12px] font-medium transition-colors duration-100 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-(--iu-accent) motion-reduce:transition-none dark:border-(--iu-foreground)/10 pointer-fine:hover:bg-(--iu-foreground)/[0.04]"
          >
            Read the {story.company} story
          </button>
        ) : null}
      </figure>
    </article>
  );
}

function Chip({
  pressed,
  onClick,
  children,
  count,
}: {
  pressed: boolean;
  onClick: () => void;
  children: ReactNode;
  count: number;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      data-chip
      className={cx(
        "inline-flex h-8 items-center gap-1.5 rounded-[min(var(--iu-radius),6px)] border px-2.5 text-[12px] font-medium whitespace-nowrap transition-colors duration-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--iu-accent) motion-reduce:transition-none pointer-coarse:h-10",
        pressed
          ? "border-(--iu-accent) bg-[color-mix(in_oklab,var(--iu-accent)_12%,var(--iu-surface))] text-(--iu-foreground)"
          : "border-(--iu-foreground)/20 text-(--iu-foreground) pointer-fine:hover:border-(--iu-foreground)/45",
      )}
    >
      {children}
      <span data-count className="font-mono text-[11px] text-(--iu-muted) tabular-nums">
        {count}
      </span>
    </button>
  );
}

function Skeleton() {
  return (
    <div
      aria-hidden="true"
      className="flex h-full flex-col rounded-[min(var(--iu-radius),6px)] border border-(--iu-border) bg-(--iu-surface) p-4 dark:border-(--iu-foreground)/10"
    >
      <div className="flex items-start gap-3">
        <span className="size-9 rounded-[min(var(--iu-radius),6px)] bg-(--iu-foreground)/8" />
        <div className="flex-1 space-y-2 pt-0.5">
          <span className="block h-3 w-28 rounded-sm bg-(--iu-foreground)/10" />
          <span className="block h-3 w-40 rounded-sm bg-(--iu-foreground)/6" />
        </div>
      </div>
      <span className="mt-4 block h-3 w-full rounded-sm bg-(--iu-foreground)/6" />
      <span className="mt-2 block h-3 w-11/12 rounded-sm bg-(--iu-foreground)/6" />
      <span className="mt-2 block h-3 w-2/3 rounded-sm bg-(--iu-foreground)/6" />
      <span className="mt-6 block h-3 w-24 rounded-sm bg-(--iu-foreground)/8" />
      <span className="mt-3 block h-14 w-full rounded-sm bg-(--iu-foreground)/5" />
      <span className="mt-4 block h-8 w-full rounded-sm bg-(--iu-foreground)/5" />
    </div>
  );
}

export function CasefileTestimonials({
  product = "Sorrel",
  kicker = "Customer evidence",
  headline = "Proof, measured before and after.",
  subline = "Nine support teams, their numbers twelve weeks around rollout, and what changed in their words.",
  stories = DEFAULT_STORIES,
  industries,
  defaultIndustry = "all",
  defaultSize = "all",
  weeks = 12,
  liveWeek = 4,
  status = "ready",
  onOpenStory,
  className = "",
}: CasefileTestimonialsProps) {
  const reduceMotion = useReducedMotion();
  const titleId = useId();
  const [industry, setIndustry] = useState(defaultIndustry);
  const [size, setSize] = useState<CasefileSize | "all">(defaultSize);
  const allIndustries = useMemo(
    () => industries ?? [...new Set(stories.map((story) => story.industry))].sort(),
    [industries, stories],
  );
  const matches = (story: CasefileStory, ind: string, sz: CasefileSize | "all") =>
    (ind === "all" || story.industry === ind) && (sz === "all" || story.size === sz);
  const visible = stories.filter((story) => matches(story, industry, size));
  const loading = status === "loading";

  const respChange = median(visible.map((s) => Math.round(((s.response[1] - s.response[0]) / s.response[0]) * 100)));
  const csatChange = median(visible.map((s) => s.csat[1] - s.csat[0]));
  const deflection = median(visible.map((s) => s.deflection));
  const kpis = [
    { label: "Stories", value: visible.length, format: (v: number) => String(v), note: "matching filters" },
    {
      label: "Median first response",
      value: respChange === null ? null : Math.round(respChange),
      format: (v: number) => `${v > 0 ? "+" : "−"}${Math.abs(v)}%`,
      note: "change after rollout",
    },
    {
      label: "Median CSAT",
      value: csatChange === null ? null : Math.round(csatChange),
      format: (v: number) => `+${v} pts`,
      note: "change after rollout",
    },
    {
      label: "Resolved without an agent",
      value: deflection === null ? null : Math.round(deflection),
      format: (v: number) => `${v}%`,
      note: "median share of tickets",
    },
  ];
  const filterSummary = [
    industry === "all" ? null : industry,
    size === "all" ? null : SIZES.find((s) => s.id === size)?.spoken,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <MotionConfig
      reducedMotion="user"
      transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 400, damping: 30 }}
    >
      <section
        aria-labelledby={titleId}
        aria-busy={loading || undefined}
        className={`@container bg-(--iu-background) font-(family-name:--iu-font) text-(--iu-foreground) ${className}`}
      >
        <div className="mx-auto max-w-[1240px] px-4 py-12 sm:px-8 sm:py-16">
          <div className="grid gap-6 @4xl:grid-cols-[minmax(0,1fr)_auto] @4xl:items-end">
            <div>
              <p className="font-mono text-[11px] tracking-[0.08em] text-(--iu-muted) uppercase">
                {product} · {kicker}
              </p>
              <h2
                id={titleId}
                className="mt-3 text-[clamp(1.75rem,1.4rem+1.4vw,2.5rem)] leading-[1.1] font-semibold tracking-[-0.03em] text-balance"
              >
                {headline}
              </h2>
              <p className="mt-3 max-w-[38rem] text-[14px] leading-relaxed text-pretty text-(--iu-muted)">{subline}</p>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 border-y border-(--iu-border) py-3 @3xl:flex-row @3xl:items-center @3xl:justify-between">
            <div role="group" aria-label="Industry" data-group="industry" className="flex flex-wrap gap-1.5">
              <Chip
                pressed={industry === "all"}
                onClick={() => setIndustry("all")}
                count={stories.filter((s) => matches(s, "all", size)).length}
              >
                All industries
              </Chip>
              {allIndustries.map((name) => (
                <Chip
                  key={name}
                  pressed={industry === name}
                  onClick={() => setIndustry(name)}
                  count={stories.filter((s) => matches(s, name, size)).length}
                >
                  {name}
                </Chip>
              ))}
            </div>
            <div role="group" aria-label="Company size" data-group="size" className="flex flex-wrap gap-1.5">
              {SIZES.map((option) => (
                <Chip
                  key={option.id}
                  pressed={size === option.id}
                  onClick={() => setSize(option.id)}
                  count={stories.filter((s) => matches(s, industry, option.id)).length}
                >
                  <span aria-hidden="true">{option.label}</span>
                  <span className="sr-only">{option.spoken}</span>
                </Chip>
              ))}
            </div>
          </div>

          <dl className="mt-6 grid grid-cols-2 overflow-hidden rounded-[min(var(--iu-radius),6px)] border border-(--iu-border) bg-(--iu-surface) @3xl:grid-cols-4 dark:border-(--iu-foreground)/10">
            {kpis.map((kpi, index) => (
              <div
                key={kpi.label}
                className={cx(
                  "px-4 py-[calc(14px*var(--iu-density))]",
                  index % 2 === 1 && "border-l border-(--iu-border) dark:border-(--iu-foreground)/10",
                  index >= 2 &&
                    "border-t border-(--iu-border) @3xl:border-t-0 @3xl:border-l dark:border-(--iu-foreground)/10",
                )}
              >
                <dt className="text-[11px] leading-tight font-medium tracking-[0.06em] text-(--iu-muted) uppercase">
                  {kpi.label}
                </dt>
                <dd
                  data-kpi={index}
                  className="mt-2 font-mono text-[24px] leading-none font-medium tracking-[-0.03em] tabular-nums"
                >
                  {loading ? (
                    <span aria-hidden="true" className="block h-6 w-16 rounded-sm bg-(--iu-foreground)/8" />
                  ) : (
                    <Ticker value={kpi.value} format={kpi.format} />
                  )}
                </dd>
                <dd className="mt-1.5 text-[12px] text-(--iu-muted)">{kpi.note}</dd>
              </div>
            ))}
          </dl>

          <p aria-live="polite" data-announce className="sr-only">
            {loading
              ? "Loading customer stories"
              : `${visible.length} ${visible.length === 1 ? "story" : "stories"}${filterSummary ? ` for ${filterSummary}` : ""}`}
          </p>

          {loading ? (
            <ul aria-label="Loading stories" className="mt-6 grid grid-cols-1 gap-4 @2xl:grid-cols-2 @5xl:grid-cols-3">
              {Array.from({ length: 6 }, (_, i) => (
                <li key={i}>
                  <Skeleton />
                </li>
              ))}
            </ul>
          ) : visible.length === 0 ? (
            <div
              data-empty
              className="mt-6 flex flex-col items-center rounded-[min(var(--iu-radius),6px)] border border-dashed border-(--iu-foreground)/25 px-6 py-14 text-center"
            >
              <svg
                width="96"
                height="56"
                viewBox="0 0 96 56"
                fill="none"
                aria-hidden="true"
                className="text-(--iu-muted)"
              >
                <rect x="0.5" y="0.5" width="95" height="55" rx="3" stroke="currentColor" opacity="0.4" />
                <path d="M8 42 L24 38 L36 40 L48 30" stroke="currentColor" strokeWidth="1.5" opacity="0.7" />
                <path d="M48 30 L88 30" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 4" opacity="0.5" />
                <line x1="48" x2="48" y1="8" y2="48" stroke="var(--iu-accent)" strokeDasharray="2 3" />
              </svg>
              <p data-empty-title className="mt-5 text-[14px] font-semibold">
                No stories for {filterSummary || "these filters"} yet
              </p>
              <p className="mt-1 max-w-[30rem] text-[13px] text-pretty text-(--iu-muted)">
                We only publish numbers customers have signed off. Widen the filters to see teams with a similar setup.
              </p>
              <button
                type="button"
                onClick={() => {
                  setIndustry("all");
                  setSize("all");
                }}
                className="mt-5 inline-flex h-9 items-center gap-2 rounded-[min(var(--iu-radius),6px)] border border-(--iu-foreground)/35 px-3 text-[13px] font-medium transition-colors duration-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--iu-accent) motion-reduce:transition-none pointer-coarse:h-10 pointer-fine:hover:border-(--iu-foreground)"
              >
                <FilterX size={16} strokeWidth={1.5} aria-hidden="true" />
                Clear filters
              </button>
            </div>
          ) : (
            <ul
              aria-label="Customer stories"
              data-stories
              className="mt-6 grid grid-cols-1 gap-4 @2xl:grid-cols-2 @5xl:grid-cols-3"
            >
              <AnimatePresence initial={false} mode="popLayout">
                {visible.map((story) => (
                  <motion.li
                    key={story.id}
                    data-story={story.id}
                    data-industry={story.industry}
                    data-size={story.size}
                    data-response={Math.round(((story.response[1] - story.response[0]) / story.response[0]) * 100)}
                    data-csat={story.csat[1] - story.csat[0]}
                    data-deflection={story.deflection}
                    layout
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98, transition: { duration: reduceMotion ? 0 : 0.12 } }}
                  >
                    <StoryCard story={story} weeks={weeks} liveWeek={liveWeek} onOpen={onOpenStory} />
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
          <p className="mt-6 font-mono text-[11px] leading-relaxed text-(--iu-muted)">
            Medians of weekly figures from each customer&apos;s {product} workspace, 4 weeks before and 8 weeks after
            rollout. Published with written approval.
          </p>
        </div>
      </section>
    </MotionConfig>
  );
}

export default CasefileTestimonials;
