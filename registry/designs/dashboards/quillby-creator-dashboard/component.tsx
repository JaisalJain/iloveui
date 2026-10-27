"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type MouseEvent } from "react";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "motion/react";
import {
  ArrowDownRight,
  ArrowUpRight,
  ChartNoAxesColumn,
  Home,
  Mail,
  MailOpen,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  PenLine,
  Settings,
  Users,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";

export type QuillbyMetric = {
  id: string;
  label: string;
  icon: LucideIcon;
  format: "count" | "percent" | "currency";
  /** The figure today. */
  value: number;
  /** The figure at the start of the period, for the delta. */
  previous: number;
  /** One value per day, oldest first. Every metric needs the same number of points. */
  series: number[];
  /** Says what the chart shows, read after the label: "Subscribers, total at the end of each day". */
  description: string;
};

export type QuillbyIssue = {
  id: string;
  number: number;
  title: string;
  sentOn: string;
  openRate: number;
  clicks: number;
};

export type QuillbyNavItem = { id: string; label: string; icon: LucideIcon; href: string; count?: number };

export type QuillbyGoal = { target: number; label: string; byDate: string };

export type QuillbyCreatorDashboardProps = {
  product?: string;
  publication?: { name: string; detail: string };
  author?: string;
  greeting?: string;
  summary?: string;
  navigation?: QuillbyNavItem[];
  currentNavId?: string;
  breadcrumbs?: string[];
  metrics?: QuillbyMetric[];
  defaultMetricId?: string;
  /** ISO date of the first point in every series. */
  startDate?: string;
  goal?: QuillbyGoal;
  issues?: QuillbyIssue[];
  status?: "ready" | "loading" | "empty";
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  onMetricChange?: (metricId: string) => void;
  onNavigate?: (item: QuillbyNavItem, event: MouseEvent<HTMLAnchorElement>) => void;
  onWriteIssue?: () => void;
  onOpenIssue?: (issue: QuillbyIssue) => void;
  className?: string;
};

const SUBSCRIBERS = [
  4294, 4298, 4308, 4325, 4347, 4353, 4362, 4370, 4378, 4385, 4409, 4428, 4430, 4438, 4443, 4450, 4458, 4483, 4501,
  4511, 4519, 4527, 4535, 4544, 4566, 4588, 4595, 4600, 4606, 4612,
];
const OPEN_RATE = [
  55.7, 56.8, 56.2, 61.2, 60, 57, 56.1, 56.6, 56.6, 56.5, 60.8, 60.5, 57.5, 56.7, 56.7, 57.3, 57.8, 61.8, 59.8, 58.6,
  57.1, 57.3, 57.4, 57.3, 62.3, 61, 58.8, 58.5, 57.9, 58.3,
];
const PAID = [
  229, 229, 229, 229, 230, 231, 232, 233, 233, 233, 234, 235, 236, 237, 237, 237, 237, 237, 237, 238, 239, 240, 240,
  241, 242, 242, 241, 241, 241, 241,
];

const DEFAULT_METRICS: QuillbyMetric[] = [
  {
    id: "subscribers",
    label: "Subscribers",
    icon: Users,
    format: "count",
    value: 4612,
    previous: 4294,
    series: SUBSCRIBERS,
    description: "total at the end of each day",
  },
  {
    id: "open-rate",
    label: "Open rate",
    icon: MailOpen,
    format: "percent",
    value: 58.3,
    previous: 56.2,
    series: OPEN_RATE,
    description: "share of readers who opened within 48 hours",
  },
  {
    id: "paid",
    label: "Paid members",
    icon: Wallet,
    format: "count",
    value: 241,
    previous: 229,
    series: PAID,
    description: "members on a paid plan",
  },
  {
    id: "revenue",
    label: "Revenue",
    icon: ChartNoAxesColumn,
    format: "currency",
    value: 1687,
    previous: 1603,
    series: PAID.map((members) => members * 7),
    description: "recurring revenue at $7 a member",
  },
];

const DEFAULT_ISSUES: QuillbyIssue[] = [
  { id: "87", number: 87, title: "Notes from a cold-brew winter", sentOn: "2026-10-22", openRate: 62.3, clicks: 418 },
  { id: "86", number: 86, title: "The case for slow mornings", sentOn: "2026-10-15", openRate: 61.8, clicks: 377 },
  { id: "85", number: 85, title: "What a 1960s grinder taught me", sentOn: "2026-10-08", openRate: 60.8, clicks: 352 },
];

const DEFAULT_NAV: QuillbyNavItem[] = [
  { id: "home", label: "Home", icon: Home, href: "#home" },
  { id: "issues", label: "Issues", icon: Mail, href: "#issues", count: 2 },
  { id: "subscribers", label: "Subscribers", icon: Users, href: "#subscribers" },
  { id: "growth", label: "Growth", icon: ChartNoAxesColumn, href: "#growth" },
  { id: "earnings", label: "Earnings", icon: Wallet, href: "#earnings" },
  { id: "settings", label: "Settings", icon: Settings, href: "#settings" },
];

const EASE = [0.2, 0.8, 0.2, 1] as const;
const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--iu-accent)";

// Soft depth lives in three custom properties so light and dark can each define their own material.
const MATERIAL = [
  "[--qb-sh-card:0_1px_2px_color-mix(in_oklab,black_5%,transparent),0_12px_28px_-14px_color-mix(in_oklab,black_16%,transparent),inset_0_1px_0_color-mix(in_oklab,white_80%,transparent)]",
  "[--qb-sh-lift:0_1px_2px_color-mix(in_oklab,black_6%,transparent),0_8px_18px_-10px_color-mix(in_oklab,black_20%,transparent),inset_0_1px_0_color-mix(in_oklab,white_80%,transparent)]",
  "[--qb-sh-pressed:inset_0_2px_6px_color-mix(in_oklab,black_10%,transparent),inset_0_1px_1px_color-mix(in_oklab,black_8%,transparent),0_0_0_0_transparent]",
  "dark:[--qb-sh-card:inset_0_1px_0_color-mix(in_oklab,white_5%,transparent),0_16px_32px_-18px_color-mix(in_oklab,black_70%,transparent),0_0_0_0_transparent]",
  "dark:[--qb-sh-lift:inset_0_1px_0_color-mix(in_oklab,white_6%,transparent),0_10px_20px_-12px_color-mix(in_oklab,black_70%,transparent),0_0_0_0_transparent]",
  "dark:[--qb-sh-pressed:inset_0_2px_6px_color-mix(in_oklab,black_45%,transparent),inset_0_1px_1px_color-mix(in_oklab,black_30%,transparent),0_0_0_0_transparent]",
].join(" ");

const CARD =
  "rounded-[max(var(--iu-radius),20px)] border border-(--iu-border) bg-(--iu-surface) shadow-(--qb-sh-card) dark:border-(--iu-foreground)/10";

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function formatValue(value: number, format: QuillbyMetric["format"]) {
  if (format === "percent") return `${value.toFixed(1)}%`;
  const whole = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Math.round(value));
  return format === "currency" ? `$${whole}` : whole;
}

function formatDate(iso: string, offsetDays = 0) {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + offsetDays);
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(date);
}

function delta(metric: QuillbyMetric) {
  if (metric.format === "percent") {
    const points = metric.value - metric.previous;
    return { up: points >= 0, text: `${points >= 0 ? "+" : "−"}${Math.abs(points).toFixed(1)} pts` };
  }
  const change = metric.previous === 0 ? 0 : ((metric.value - metric.previous) / metric.previous) * 100;
  return { up: change >= 0, text: `${change >= 0 ? "+" : "−"}${Math.abs(change).toFixed(1)}%` };
}

/** Rounds a domain out to tidy tick values so the gridlines read as real numbers. */
function niceDomain(values: number[]) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(max - min, 1);
  const raw = span / 3;
  const power = 10 ** Math.floor(Math.log10(raw));
  const step = ([1, 1.5, 2, 2.5, 5, 10].find((factor) => factor * power >= raw) ?? 10) * power;
  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let tick = lo; tick <= hi + step / 2; tick += step) ticks.push(tick);
  return { lo, hi: Math.max(hi, lo + step), ticks };
}

/** A smooth curve through every point (Catmull-Rom as cubic Béziers) in a 0-100 box. */
function curve(points: Array<[number, number]>) {
  if (points.length === 0) return "";
  const [first] = points;
  let d = `M${first![0].toFixed(2)},${first![1].toFixed(2)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i]!;
    const p1 = points[i]!;
    const p2 = points[i + 1]!;
    const p3 = points[i + 2] ?? p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C${c1x.toFixed(2)},${c1y.toFixed(2)} ${c2x.toFixed(2)},${c2y.toFixed(2)} ${p2[0].toFixed(2)},${p2[1].toFixed(2)}`;
  }
  return d;
}

function project(series: number[], lo: number, hi: number, inset = 0) {
  const last = Math.max(series.length - 1, 1);
  return series.map((value, index): [number, number] => [
    (index / last) * 100,
    inset + (1 - (value - lo) / (hi - lo || 1)) * (100 - inset * 2),
  ]);
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function QuillbyMark() {
  return (
    <span
      aria-hidden="true"
      className="inline-flex size-9 shrink-0 items-center justify-center rounded-[max(calc(var(--iu-radius)+2px),12px)] bg-(--iu-accent) text-(--iu-accent-foreground) shadow-(--qb-sh-lift)"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M5 19c4-1 8-5 11-9l3-5-5 3c-4 3-8 7-9 11Z" strokeLinejoin="round" />
        <path d="M5 19 12 12" strokeLinecap="round" />
      </svg>
    </span>
  );
}

function DeltaChip({ metric }: { metric: QuillbyMetric }) {
  const { up, text } = delta(metric);
  const Arrow = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cx(
        "inline-flex h-6 items-center gap-1 rounded-full px-2 text-xs font-medium whitespace-nowrap tabular-nums",
        up
          ? "bg-emerald-600/10 text-emerald-800 dark:bg-emerald-400/12 dark:text-emerald-300"
          : "bg-rose-600/10 text-rose-800 dark:bg-rose-400/12 dark:text-rose-300",
      )}
    >
      <Arrow size={14} strokeWidth={1.75} aria-hidden="true" />
      {text}
      <span className="sr-only">
        {" "}
        in 30 days, {up ? "up" : "down"} from {formatValue(metric.previous, metric.format)}
      </span>
    </span>
  );
}

function Sparkline({ series, selected }: { series: number[]; selected: boolean }) {
  const { lo, hi } = niceDomain(series);
  return (
    <svg aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="none" className="h-8 w-20 overflow-visible">
      <path
        d={curve(project(series, lo, hi, 8))}
        fill="none"
        vectorEffect="non-scaling-stroke"
        strokeWidth="1.75"
        strokeLinecap="round"
        className={cx(
          "transition-[stroke] duration-200 motion-reduce:transition-none",
          selected ? "stroke-(--iu-accent)" : "stroke-(--iu-foreground)/40",
        )}
      />
    </svg>
  );
}

function NavList({
  items,
  currentNavId,
  onNavigate,
  collapsible,
}: {
  items: QuillbyNavItem[];
  currentNavId: string;
  onNavigate: QuillbyCreatorDashboardProps["onNavigate"];
  collapsible: boolean;
}) {
  return (
    <ul className="flex flex-col gap-1">
      {items.map((item) => {
        const current = item.id === currentNavId;
        const Icon = item.icon;
        return (
          <li key={item.id} className="relative">
            <a
              href={item.href}
              aria-current={current ? "page" : undefined}
              onClick={(event) => onNavigate?.(item, event)}
              className={cx(
                "group/link relative flex h-11 items-center gap-3 rounded-full px-3 text-sm font-medium transition-[background-color,color,box-shadow] duration-200 motion-reduce:transition-none",
                current
                  ? "bg-[color-mix(in_oklab,var(--iu-accent)_10%,var(--iu-surface))] text-(--iu-foreground) shadow-(--qb-sh-pressed)"
                  : "text-(--iu-muted) pointer-fine:hover:bg-(--iu-foreground)/5 pointer-fine:hover:text-(--iu-foreground)",
                FOCUS,
              )}
            >
              <Icon
                size={18}
                strokeWidth={1.5}
                aria-hidden="true"
                className={cx("shrink-0", current && "text-(--iu-accent)")}
              />
              <span
                className={cx("min-w-0 flex-1 truncate", collapsible && "group-data-[collapsed=true]/side:sr-only")}
              >
                {item.label}
              </span>
              {item.count ? (
                <span
                  className={cx(
                    "inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-(--iu-foreground)/8 px-1.5 text-[11px] text-(--iu-foreground) tabular-nums",
                    collapsible && "group-data-[collapsed=true]/side:hidden",
                  )}
                >
                  {item.count}
                  <span className="sr-only"> drafts</span>
                </span>
              ) : null}
              {collapsible ? (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 left-full z-10 ml-3 hidden -translate-y-1/2 rounded-full bg-(--iu-foreground) px-3 py-1 text-xs whitespace-nowrap text-(--iu-background) opacity-0 transition-opacity duration-150 group-focus-visible/link:opacity-100 group-data-[collapsed=true]/side:block motion-reduce:transition-none pointer-fine:group-hover/link:opacity-100"
                >
                  {item.label}
                </span>
              ) : null}
            </a>
          </li>
        );
      })}
    </ul>
  );
}

function SkeletonBlock({ className }: { className: string }) {
  return <span aria-hidden="true" className={cx("block rounded-full bg-(--iu-foreground)/8", className)} />;
}

export function QuillbyCreatorDashboard({
  product = "Quillby",
  publication = { name: "Slow Kettle", detail: "Weekly · Thursdays 7:00" },
  author = "Noor Haddad",
  greeting = "Good morning, Noor",
  summary = "Issue #88 goes out Thursday at 7:00. Last week, 62.3% of your readers opened it.",
  navigation = DEFAULT_NAV,
  currentNavId = "home",
  breadcrumbs = ["Slow Kettle", "Overview"],
  metrics = DEFAULT_METRICS,
  defaultMetricId,
  startDate = "2026-09-28",
  goal = { target: 5000, label: "Subscribers by New Year", byDate: "Dec 3" },
  issues = DEFAULT_ISSUES,
  status = "ready",
  defaultCollapsed = false,
  onCollapsedChange,
  onMetricChange,
  onNavigate,
  onWriteIssue,
  onOpenIssue,
  className = "",
}: QuillbyCreatorDashboardProps) {
  const reduceMotion = useReducedMotion();
  const uid = `qb${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [menuOpen, setMenuOpen] = useState(false);
  const [metricId, setMetricId] = useState(defaultMetricId ?? metrics[0]?.id ?? "");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (menuOpen && !dialog.open) {
      dialog.showModal();
      dialog.querySelector<HTMLElement>('[aria-current="page"]')?.focus();
    }
    if (!menuOpen && dialog.open) dialog.close();
  }, [menuOpen]);

  useEffect(() => {
    const query = window.matchMedia("(min-width: 64rem)");
    const onChange = () => {
      if (query.matches) setMenuOpen(false);
    };
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  const loading = status === "loading";
  const empty = status === "empty";
  const activeIndex = Math.max(
    0,
    metrics.findIndex((metric) => metric.id === metricId),
  );
  const active = metrics[activeIndex];
  const subscribers = metrics.find((metric) => metric.id === "subscribers") ?? metrics[0];
  const goalValue = subscribers?.value ?? 0;
  const goalShare = Math.min(1, goalValue / goal.target);
  const points = active?.series.length ?? 0;

  const select = (index: number, focus: boolean) => {
    const next = metrics[(index + metrics.length) % metrics.length];
    if (!next) return;
    if (next.id !== metricId) {
      setMetricId(next.id);
      onMetricChange?.(next.id);
    }
    if (focus) tabRefs.current[(index + metrics.length) % metrics.length]?.focus();
  };

  const onTabKey = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const moves: Record<string, number> = {
      ArrowRight: index + 1,
      ArrowDown: index + 1,
      ArrowLeft: index - 1,
      ArrowUp: index - 1,
      Home: 0,
      End: metrics.length - 1,
    };
    const target = moves[event.key];
    if (target === undefined) return;
    event.preventDefault();
    select(target, true);
  };

  const toggleSidebar = () => {
    const next = !collapsed;
    setCollapsed(next);
    onCollapsedChange?.(next);
  };

  const navigate: QuillbyCreatorDashboardProps["onNavigate"] = (item, event) => {
    setMenuOpen(false);
    onNavigate?.(item, event);
  };

  const domain = active ? niceDomain(active.series) : { lo: 0, hi: 1, ticks: [0, 1] };
  const projected = active ? project(active.series, domain.lo, domain.hi) : [];
  const line = curve(projected);
  const area = projected.length ? `${line} L100,100 L0,100 Z` : "";
  const end = projected[projected.length - 1] ?? [100, 50];
  const xLabels = points > 1 ? [0, 7, 14, 21, points - 1].filter((index) => index < points) : [];
  const writeButton = (
    <motion.button
      type="button"
      onClick={onWriteIssue}
      whileTap={{ scale: 0.97 }}
      className={cx(
        "inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-(--iu-accent) px-5 text-sm font-semibold text-(--iu-accent-foreground) shadow-(--qb-sh-lift) transition-[translate,box-shadow] duration-200 active:shadow-(--qb-sh-pressed) motion-reduce:transition-none pointer-fine:hover:-translate-y-px",
        FOCUS,
      )}
    >
      <PenLine size={16} strokeWidth={1.5} aria-hidden="true" />
      {empty ? "Write your first issue" : "Write issue"}
    </motion.button>
  );

  return (
    <MotionConfig
      reducedMotion="user"
      transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 30 }}
    >
      <div
        data-quillby-dashboard
        className={cx(
          "flex min-h-dvh flex-col bg-(--iu-background) font-(family-name:--iu-font) text-(--iu-foreground) lg:flex-row lg:gap-2 lg:p-3",
          MATERIAL,
          className,
        )}
      >
        {/* Sidebar: a floating panel that folds down to an icon dock. */}
        <div
          data-qb-side
          data-collapsed={collapsed ? "true" : "false"}
          className={cx(
            "group/side sticky top-3 hidden h-[calc(100dvh-24px)] w-64 shrink-0 flex-col p-3 transition-[width] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] data-[collapsed=true]:w-[76px] motion-reduce:transition-none lg:flex",
            CARD,
          )}
        >
          <div className="flex items-center gap-3 px-1 pb-4 group-data-[collapsed=true]/side:flex-col">
            <QuillbyMark />
            <span className="min-w-0 flex-1 truncate text-base font-semibold tracking-[-0.01em] group-data-[collapsed=true]/side:sr-only">
              {product}
            </span>
            <button
              type="button"
              data-qb-toggle
              onClick={toggleSidebar}
              aria-expanded={!collapsed}
              aria-controls={`${uid}-nav`}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className={cx(
                "inline-flex size-10 shrink-0 items-center justify-center rounded-full text-(--iu-muted) transition-colors duration-150 motion-reduce:transition-none pointer-fine:hover:bg-(--iu-foreground)/6 pointer-fine:hover:text-(--iu-foreground)",
                FOCUS,
              )}
            >
              {collapsed ? (
                <PanelLeftOpen size={18} strokeWidth={1.5} aria-hidden="true" />
              ) : (
                <PanelLeftClose size={18} strokeWidth={1.5} aria-hidden="true" />
              )}
            </button>
          </div>
          <nav id={`${uid}-nav`} aria-label="Main" className="flex-1">
            <NavList items={navigation} currentNavId={currentNavId} onNavigate={navigate} collapsible />
          </nav>
          <div className="mt-4 flex items-center gap-3 rounded-[max(var(--iu-radius),16px)] bg-(--iu-foreground)/4 p-2 group-data-[collapsed=true]/side:justify-center group-data-[collapsed=true]/side:bg-transparent group-data-[collapsed=true]/side:p-0">
            <span
              aria-hidden="true"
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--iu-accent)_16%,var(--iu-surface))] text-xs font-semibold text-(--iu-foreground)"
            >
              {initials(author)}
            </span>
            <span className="min-w-0 flex-1 text-sm leading-tight group-data-[collapsed=true]/side:sr-only">
              <span className="block truncate font-medium">{publication.name}</span>
              <span className="block truncate text-xs text-(--iu-muted)">{publication.detail}</span>
            </span>
          </div>
        </div>

        {/* Small screens: a top bar and a drawer. */}
        <div className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-(--iu-border) bg-(--iu-background) px-3 lg:hidden">
          <button
            data-qb-menu
            ref={menuButtonRef}
            type="button"
            aria-label="Open navigation"
            aria-haspopup="dialog"
            aria-expanded={menuOpen}
            aria-controls={`${uid}-drawer`}
            onClick={() => setMenuOpen(true)}
            className={cx(
              "inline-flex size-10 items-center justify-center rounded-full border border-(--iu-border) bg-(--iu-surface) shadow-(--qb-sh-lift) active:shadow-(--qb-sh-pressed)",
              FOCUS,
            )}
          >
            <Menu size={18} strokeWidth={1.5} aria-hidden="true" />
          </button>
          <QuillbyMark />
          <span className="min-w-0 flex-1 truncate text-base font-semibold">{product}</span>
          <span
            aria-hidden="true"
            className="inline-flex size-9 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--iu-accent)_16%,var(--iu-surface))] text-xs font-semibold"
          >
            {initials(author)}
          </span>
          <span className="sr-only">Signed in as {author}</span>
        </div>

        <dialog
          data-qb-drawer
          ref={dialogRef}
          id={`${uid}-drawer`}
          aria-label="Navigation"
          onClose={() => {
            setMenuOpen(false);
            menuButtonRef.current?.focus();
          }}
          onClick={(event) => {
            if (event.target === event.currentTarget) setMenuOpen(false);
          }}
          className="fixed inset-y-3 right-auto left-3 m-0 h-auto max-h-none w-72 max-w-[calc(100vw-3rem)] -translate-x-[110%] rounded-[max(var(--iu-radius),20px)] border border-(--iu-border) bg-(--iu-surface) p-0 text-(--iu-foreground) shadow-(--qb-sh-card) transition-[translate,display,overlay] transition-discrete duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] backdrop:bg-black/30 open:translate-x-0 motion-reduce:transition-none lg:hidden dark:border-(--iu-foreground)/10 dark:backdrop:bg-black/60 starting:open:-translate-x-[110%]"
        >
          <div className="flex h-full flex-col p-3 font-(family-name:--iu-font)">
            <div className="flex items-center gap-3 px-1 pb-4">
              <QuillbyMark />
              <span className="flex-1 text-base font-semibold">{product}</span>
              <button
                type="button"
                data-qb-close
                aria-label="Close navigation"
                onClick={() => setMenuOpen(false)}
                className={cx(
                  "inline-flex size-10 items-center justify-center rounded-full text-(--iu-muted) pointer-fine:hover:bg-(--iu-foreground)/6",
                  FOCUS,
                )}
              >
                <X size={18} strokeWidth={1.5} aria-hidden="true" />
              </button>
            </div>
            <nav aria-label="Main">
              <NavList items={navigation} currentNavId={currentNavId} onNavigate={navigate} collapsible={false} />
            </nav>
          </div>
        </dialog>

        <main
          aria-busy={loading || undefined}
          className="@container min-w-0 flex-1 px-4 pt-6 pb-12 sm:px-6 lg:px-6 lg:pt-4"
        >
          <div className="mx-auto max-w-[1180px]">
            <nav aria-label="Breadcrumb">
              <ol className="flex flex-wrap items-center gap-2 text-sm text-(--iu-muted)">
                {breadcrumbs.map((crumb, index) => {
                  const last = index === breadcrumbs.length - 1;
                  return (
                    <li key={crumb} className="flex items-center gap-2">
                      {last ? (
                        <span aria-current="page" className="font-medium text-(--iu-foreground)">
                          {crumb}
                        </span>
                      ) : (
                        <>
                          <a
                            href="#publication"
                            className={cx(
                              "rounded-full transition-colors duration-150 motion-reduce:transition-none pointer-fine:hover:text-(--iu-foreground)",
                              FOCUS,
                            )}
                          >
                            {crumb}
                          </a>
                          <span aria-hidden="true" className="text-(--iu-foreground)/30">
                            /
                          </span>
                        </>
                      )}
                    </li>
                  );
                })}
              </ol>
            </nav>

            <header className="mt-4 flex flex-col gap-5 @2xl:flex-row @2xl:items-end @2xl:justify-between">
              <div className="min-w-0">
                <h1 className="text-[28px] leading-tight font-semibold tracking-[-0.025em] text-balance @2xl:text-[34px]">
                  {empty ? `Welcome to ${product}, ${author.split(" ")[0]}` : greeting}
                </h1>
                <p className="mt-2 max-w-[56ch] text-base leading-relaxed text-pretty text-(--iu-muted)">
                  {loading
                    ? "Gathering last night's opens and sign-ups."
                    : empty
                      ? "Your dashboard fills in the morning after your first issue goes out."
                      : summary}
                </p>
              </div>
              {loading || empty ? null : writeButton}
            </header>

            {loading ? <span className="sr-only">Loading your dashboard</span> : null}

            {/* KPI cards are tabs: pressing one selects the metric the big chart shows. */}
            <div
              role={empty ? undefined : "tablist"}
              aria-label={empty ? undefined : "Metric shown in the chart"}
              className="mt-8 grid grid-cols-2 gap-3 @3xl:grid-cols-4 @3xl:gap-4"
            >
              {metrics.map((metric, index) => {
                const selected = index === activeIndex;
                const Icon = metric.icon;
                if (empty) {
                  return (
                    <div key={metric.id} className={cx(CARD, "flex flex-col p-[calc(16px*var(--iu-density))]")}>
                      <span className="flex min-w-0 items-center gap-2 text-sm font-medium text-(--iu-muted)">
                        <span
                          aria-hidden="true"
                          className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-(--iu-foreground)/6 text-(--iu-foreground)"
                        >
                          <Icon size={16} strokeWidth={1.5} />
                        </span>
                        <span className="truncate">{metric.label}</span>
                      </span>
                      <span className="mt-4 block text-[26px] leading-none font-semibold tracking-[-0.02em] text-(--iu-muted) tabular-nums @md:text-[30px]">
                        {metric.format === "percent" ? (
                          <>
                            <span aria-hidden="true">—</span>
                            <span className="sr-only">No data yet</span>
                          </>
                        ) : (
                          formatValue(0, metric.format)
                        )}
                      </span>
                      <span className="mt-3 flex min-h-8 items-center text-xs text-(--iu-muted)">
                        No issues sent yet
                      </span>
                    </div>
                  );
                }
                if (loading) {
                  return (
                    <div
                      key={metric.id}
                      className={cx(CARD, "p-[calc(16px*var(--iu-density))] shadow-none")}
                      aria-hidden="true"
                    >
                      <span className="flex items-center gap-2">
                        <SkeletonBlock className="size-8" />
                        <SkeletonBlock className="h-3 w-20" />
                      </span>
                      <SkeletonBlock className="mt-4 h-7 w-24" />
                      <span className="mt-3 flex items-center justify-between">
                        <SkeletonBlock className="h-6 w-16" />
                        <SkeletonBlock className="hidden h-6 w-20 @sm:block" />
                      </span>
                    </div>
                  );
                }
                return (
                  <motion.button
                    key={metric.id}
                    ref={(node) => {
                      tabRefs.current[index] = node;
                    }}
                    type="button"
                    role="tab"
                    id={`${uid}-tab-${metric.id}`}
                    aria-selected={selected}
                    aria-controls={`${uid}-panel`}
                    tabIndex={selected ? 0 : -1}
                    onClick={() => select(index, false)}
                    onKeyDown={(event) => onTabKey(event, index)}
                    whileTap={{ scale: 0.97 }}
                    className={cx(
                      "group/card flex min-w-0 flex-col rounded-[max(var(--iu-radius),20px)] border p-[calc(16px*var(--iu-density))] text-left transition-[background-color,border-color,box-shadow,translate] duration-200 motion-reduce:transition-none",
                      selected
                        ? "border-[color-mix(in_oklab,var(--iu-accent)_40%,var(--iu-border))] bg-[color-mix(in_oklab,var(--iu-accent)_8%,var(--iu-surface))] shadow-(--qb-sh-pressed)"
                        : "border-(--iu-border) bg-(--iu-surface) shadow-(--qb-sh-lift) dark:border-(--iu-foreground)/10 pointer-fine:hover:-translate-y-0.5",
                      FOCUS,
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-2 text-sm font-medium text-(--iu-muted)">
                      <span
                        aria-hidden="true"
                        className={cx(
                          "inline-flex size-8 shrink-0 items-center justify-center rounded-full transition-colors duration-200 motion-reduce:transition-none",
                          selected
                            ? "bg-(--iu-accent) text-(--iu-accent-foreground)"
                            : "bg-(--iu-foreground)/6 text-(--iu-foreground)",
                        )}
                      >
                        <Icon size={16} strokeWidth={1.5} />
                      </span>
                      <span className="truncate">{metric.label}</span>
                    </span>
                    <span className="mt-4 block text-[26px] leading-none font-semibold tracking-[-0.02em] tabular-nums @md:text-[30px]">
                      {formatValue(metric.value, metric.format)}
                    </span>
                    <span className="mt-3 flex min-h-8 flex-wrap items-center justify-between gap-2">
                      <DeltaChip metric={metric} />
                      <span className="hidden @sm:block">
                        <Sparkline series={metric.series} selected={selected} />
                      </span>
                    </span>
                  </motion.button>
                );
              })}
            </div>

            <div className="mt-4 grid gap-4 @5xl:grid-cols-12">
              {/* The chart for the selected metric. */}
              <section
                role={loading || empty ? undefined : "tabpanel"}
                id={`${uid}-panel`}
                aria-labelledby={loading || empty ? undefined : `${uid}-tab-${active?.id}`}
                className={cx(
                  CARD,
                  "min-w-0 p-[calc(20px*var(--iu-density))] @2xl:p-[calc(24px*var(--iu-density))] @5xl:col-span-8",
                )}
              >
                {loading ? (
                  <div aria-hidden="true">
                    <SkeletonBlock className="h-3 w-40" />
                    <SkeletonBlock className="mt-4 h-9 w-32" />
                    <span className="mt-6 block h-56 rounded-[max(var(--iu-radius),16px)] bg-(--iu-foreground)/5 @2xl:h-64" />
                    <span className="mt-3 flex justify-between">
                      {[0, 1, 2, 3, 4].map((tick) => (
                        <SkeletonBlock key={tick} className="h-3 w-10" />
                      ))}
                    </span>
                  </div>
                ) : empty ? (
                  <div className="flex flex-col items-start gap-6 py-4 @2xl:flex-row @2xl:items-center @2xl:gap-10 @2xl:py-10">
                    <svg aria-hidden="true" viewBox="0 0 160 120" className="h-28 w-36 shrink-0 @2xl:h-36 @2xl:w-48">
                      <rect x="18" y="34" width="124" height="74" rx="14" className="fill-(--iu-foreground)/6" />
                      <path
                        d="M18 48l62 36 62-36"
                        fill="none"
                        strokeWidth="2"
                        strokeLinejoin="round"
                        className="stroke-(--iu-foreground)/25"
                      />
                      <rect
                        x="40"
                        y="12"
                        width="80"
                        height="60"
                        rx="10"
                        className="fill-(--iu-surface) stroke-(--iu-foreground)/25"
                        strokeWidth="2"
                      />
                      <rect x="52" y="26" width="40" height="6" rx="3" className="fill-(--iu-accent)" />
                      <rect x="52" y="40" width="56" height="5" rx="2.5" className="fill-(--iu-foreground)/15" />
                      <rect x="52" y="51" width="46" height="5" rx="2.5" className="fill-(--iu-foreground)/15" />
                      <circle cx="132" cy="22" r="10" className="fill-(--iu-accent)" />
                      <path
                        d="M127 22l3.5 3.5L137 19"
                        fill="none"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="stroke-(--iu-accent-foreground)"
                      />
                    </svg>
                    <div className="max-w-[44ch]">
                      <h2 className="text-xl font-semibold tracking-[-0.015em] text-balance">
                        Your chart starts with issue #1
                      </h2>
                      <p className="mt-2 text-base leading-relaxed text-pretty text-(--iu-muted)">
                        Send your first issue and {product} charts subscribers, opens and earnings here every morning.
                      </p>
                      <div className="mt-5">{writeButton}</div>
                    </div>
                  </div>
                ) : active ? (
                  <>
                    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
                      <div className="min-w-0">
                        <h2 data-qb-title className="text-sm font-medium text-(--iu-muted)">
                          {active.label} · last 30 days
                        </h2>
                        <AnimatePresence initial={false} mode="popLayout">
                          <motion.p
                            key={active.id}
                            data-qb-value
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            className="mt-2 text-[36px] leading-none font-semibold tracking-[-0.03em] tabular-nums @2xl:text-[44px]"
                          >
                            {formatValue(active.value, active.format)}
                          </motion.p>
                        </AnimatePresence>
                      </div>
                      <span data-qb-delta>
                        <DeltaChip metric={active} />
                      </span>
                    </div>

                    <figure className="mt-6">
                      <div className="relative h-56 pr-12 @2xl:h-64">
                        <div data-qb-ticks aria-hidden="true" className="absolute inset-y-0 right-0 left-0">
                          {domain.ticks.map((tick) => {
                            const top = (1 - (tick - domain.lo) / (domain.hi - domain.lo || 1)) * 100;
                            return (
                              <div
                                key={tick}
                                className="absolute inset-x-0 flex -translate-y-1/2 items-center gap-2"
                                style={{ top: `${top}%` }}
                              >
                                <span className="h-px flex-1 border-t border-dashed border-(--iu-foreground)/12" />
                                <span className="w-10 -translate-y-px text-right font-mono text-[11px] text-(--iu-muted) tabular-nums">
                                  {active.format === "currency"
                                    ? `$${Math.round(tick).toLocaleString("en-US")}`
                                    : active.format === "percent"
                                      ? `${Number.isInteger(tick) ? tick : tick.toFixed(1)}%`
                                      : Math.round(tick).toLocaleString("en-US")}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                        <div className="absolute inset-y-0 right-12 left-0">
                          <svg
                            data-qb-chart
                            role="img"
                            aria-label={`${active.label}, ${active.description}, from ${formatDate(startDate)} to ${formatDate(startDate, points - 1)}: from ${formatValue(active.series[0] ?? 0, active.format)} to ${formatValue(active.series[points - 1] ?? 0, active.format)}.`}
                            viewBox="0 0 100 100"
                            preserveAspectRatio="none"
                            className="size-full overflow-visible"
                          >
                            <defs>
                              <linearGradient id={`${uid}-fill`} x1="0" x2="0" y1="0" y2="1">
                                <stop offset="0%" stopColor="var(--iu-accent)" stopOpacity="0.22" />
                                <stop offset="100%" stopColor="var(--iu-accent)" stopOpacity="0" />
                              </linearGradient>
                            </defs>
                            <motion.path
                              initial={false}
                              data-qb-area
                              animate={{ d: area }}
                              transition={reduceMotion ? { duration: 0 } : { duration: 0.55, ease: EASE }}
                              fill={`url(#${uid}-fill)`}
                            />
                            <motion.path
                              initial={false}
                              data-qb-line
                              animate={{ d: line }}
                              transition={reduceMotion ? { duration: 0 } : { duration: 0.55, ease: EASE }}
                              fill="none"
                              vectorEffect="non-scaling-stroke"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="stroke-(--iu-accent)"
                            />
                          </svg>
                          <motion.span
                            aria-hidden="true"
                            initial={false}
                            data-qb-marker
                            animate={{ top: `${end[1]}%` }}
                            transition={reduceMotion ? { duration: 0 } : { duration: 0.55, ease: EASE }}
                            className="absolute left-full size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-(--iu-surface) bg-(--iu-accent) shadow-(--qb-sh-lift)"
                            style={{ top: `${end[1]}%` }}
                          />
                        </div>
                      </div>
                      <figcaption className="mt-3 flex justify-between pr-12 font-mono text-[11px] text-(--iu-muted) tabular-nums">
                        {xLabels.map((index) => (
                          <span key={index}>{formatDate(startDate, index)}</span>
                        ))}
                      </figcaption>
                    </figure>
                  </>
                ) : null}
                {empty ? (
                  <svg aria-hidden="true" viewBox="0 0 100 10" preserveAspectRatio="none" className="mt-2 h-3 w-full">
                    <path
                      d="M0,5 L100,5"
                      fill="none"
                      vectorEffect="non-scaling-stroke"
                      strokeWidth="2"
                      strokeDasharray="4 6"
                      strokeLinecap="round"
                      className="stroke-(--iu-foreground)/20"
                    />
                  </svg>
                ) : null}
              </section>

              <div className="grid min-w-0 gap-4 @3xl:grid-cols-2 @5xl:col-span-4 @5xl:grid-cols-1 @5xl:content-start">
                {/* Goal ring */}
                <section aria-labelledby={`${uid}-goal`} className={cx(CARD, "p-[calc(20px*var(--iu-density))]")}>
                  <h2 id={`${uid}-goal`} className="text-sm font-medium text-(--iu-muted)">
                    {goal.label}
                  </h2>
                  {loading ? (
                    <div aria-hidden="true" className="mt-4 flex items-center gap-5">
                      <span className="block size-24 shrink-0 rounded-full border-[10px] border-(--iu-foreground)/8" />
                      <span className="flex-1">
                        <SkeletonBlock className="h-6 w-24" />
                        <SkeletonBlock className="mt-3 h-3 w-full" />
                      </span>
                    </div>
                  ) : (
                    <div className="mt-4 flex items-center gap-5">
                      <div className="relative size-24 shrink-0">
                        <svg viewBox="0 0 100 100" className="size-full -rotate-90" aria-hidden="true">
                          <circle
                            cx="50"
                            cy="50"
                            r="42"
                            fill="none"
                            strokeWidth="10"
                            className="stroke-(--iu-foreground)/8"
                          />
                          {empty ? null : (
                            <circle
                              cx="50"
                              cy="50"
                              r="42"
                              fill="none"
                              strokeWidth="10"
                              strokeLinecap="round"
                              pathLength={100}
                              strokeDasharray={`${goalShare * 100} 100`}
                              className="stroke-(--iu-accent)"
                            />
                          )}
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-lg font-semibold tabular-nums">
                          {empty ? "0%" : `${Math.floor(goalShare * 100)}%`}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-2xl font-semibold tracking-[-0.02em] tabular-nums">
                          {formatValue(empty ? 0 : goalValue, "count")}
                          <span className="text-base font-medium text-(--iu-muted)">
                            {" "}
                            / {formatValue(goal.target, "count")}
                          </span>
                        </p>
                        <p className="mt-1 text-sm leading-snug text-pretty text-(--iu-muted)">
                          {empty
                            ? "Your goal ring fills as readers sign up."
                            : `${formatValue(Math.max(0, goal.target - goalValue), "count")} to go. At this pace you get there around ${goal.byDate}.`}
                        </p>
                      </div>
                    </div>
                  )}
                </section>

                {/* Recent issues */}
                <section aria-labelledby={`${uid}-issues`} className={cx(CARD, "p-[calc(20px*var(--iu-density))]")}>
                  <h2 id={`${uid}-issues`} className="text-sm font-medium text-(--iu-muted)">
                    Recent issues
                  </h2>
                  {loading ? (
                    <ul aria-hidden="true" className="mt-3 flex flex-col gap-4">
                      {[0, 1, 2].map((row) => (
                        <li key={row} className="flex items-center gap-3">
                          <SkeletonBlock className="size-9 shrink-0" />
                          <span className="flex-1">
                            <SkeletonBlock className="h-3 w-3/4" />
                            <SkeletonBlock className="mt-2 h-2 w-full" />
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : empty || issues.length === 0 ? (
                    <p className="mt-3 rounded-[max(var(--iu-radius),14px)] border border-dashed border-(--iu-foreground)/20 px-4 py-5 text-sm text-pretty text-(--iu-muted)">
                      Sent issues land here with their open rate and clicks.
                    </p>
                  ) : (
                    <ul className="-mx-2 mt-2 flex flex-col">
                      {issues.map((issue) => (
                        <li key={issue.id}>
                          <button
                            type="button"
                            onClick={() => onOpenIssue?.(issue)}
                            className={cx(
                              "flex w-full items-center gap-3 rounded-[max(var(--iu-radius),14px)] px-2 py-[calc(10px*var(--iu-density))] text-left transition-[background-color,translate] duration-200 active:translate-y-px motion-reduce:transition-none pointer-fine:hover:bg-(--iu-foreground)/4",
                              FOCUS,
                            )}
                          >
                            <span
                              aria-hidden="true"
                              className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-(--iu-foreground)/6 text-xs font-semibold tabular-nums"
                            >
                              {issue.number}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium">
                                <span className="sr-only">Issue {issue.number}: </span>
                                {issue.title}
                              </span>
                              <span className="mt-1.5 flex items-center gap-2">
                                <span
                                  aria-hidden="true"
                                  className="h-1.5 flex-1 overflow-hidden rounded-full bg-(--iu-foreground)/8"
                                >
                                  <span
                                    className="block h-full rounded-full bg-(--iu-accent)"
                                    style={{ width: `${issue.openRate}%` }}
                                  />
                                </span>
                                <span className="text-xs text-(--iu-muted) tabular-nums">
                                  {issue.openRate.toFixed(1)}% opened · {formatDate(issue.sentOn)}
                                </span>
                              </span>
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </div>
            </div>
            {empty ? null : (
              <p data-qb-live className="sr-only" aria-live="polite">
                {active ? `Chart shows ${active.label}` : ""}
              </p>
            )}
          </div>
        </main>
      </div>
    </MotionConfig>
  );
}

export default QuillbyCreatorDashboard;
