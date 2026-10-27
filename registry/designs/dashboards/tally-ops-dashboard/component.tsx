"use client";

import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
} from "react";
import {
  MotionConfig,
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type MotionValue,
} from "motion/react";
import {
  ArrowDownRight,
  ArrowLeftRight,
  ArrowRight,
  ArrowUpRight,
  CalendarClock,
  CalendarRange,
  ChartNoAxesColumn,
  Check,
  ChevronsUpDown,
  CircleAlert,
  Landmark,
  LayoutDashboard,
  Menu,
  Minus,
  PanelLeftClose,
  PanelLeftOpen,
  Pause,
  Settings,
  ShieldAlert,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";

export type TallyMetric = {
  id: string;
  label: string;
  format: "currency" | "count" | "percent";
  /** Which direction is good news. It decides whether a delta reads as better or worse. */
  better: "up" | "down";
};

export type TallyFigure = {
  value: number;
  /** Change against the previous period: percent for currency and count, percentage points for percent. */
  delta: number;
  /** One value per bucket, oldest first. Drawn as the sparkline. */
  series: number[];
};

export type TallyRange = {
  id: string;
  /** Segment label, e.g. "30D". */
  short: string;
  /** Full name, e.g. "Last 30 days". */
  label: string;
  /** Dates covered, e.g. "Sep 27 – Oct 26, 2026". */
  period: string;
  /** Dates of the comparison period. */
  previous: string;
  /** Shown after each delta: "vs prior 30 days". */
  comparison: string;
  /** Size of one series bucket, e.g. "day". */
  bucket: string;
  /** Payouts created in the range. */
  payoutCount: number;
  /** Figures keyed by metric id. */
  figures: Record<string, TallyFigure>;
};

export type TallyPayoutStatus = "paid" | "in-transit" | "scheduled" | "on-hold" | "failed";

export type TallyPayout = {
  id: string;
  recipient: string;
  status: TallyPayoutStatus;
  /** Masked bank account, e.g. "•••• 4821". */
  destination: string;
  /** Arrival date, or null while the payout is held or after it failed. */
  arrival: string | null;
  amount: number;
};

export type TallyNavItem = { id: string; label: string; href: string; icon: LucideIcon; badge?: number };
export type TallyNavGroup = { label: string; items: TallyNavItem[] };
export type TallyBreadcrumb = { label: string; href: string };

export type TallyOpsDashboardProps = {
  account?: { name: string; detail: string };
  user?: { name: string; role: string };
  navigation?: TallyNavGroup[];
  secondaryNavigation?: TallyNavItem[];
  currentNavId?: string;
  /** The trail to the current page; the last item is the current page. */
  breadcrumbs?: TallyBreadcrumb[];
  metrics?: TallyMetric[];
  ranges?: TallyRange[];
  /** Controlled range id. Leave undefined to let the component manage it. */
  range?: string;
  defaultRange?: string;
  onRangeChange?: (rangeId: string) => void;
  payouts?: TallyPayout[];
  currency?: string;
  locale?: string;
  /** "empty" means no data in the selected range. */
  status?: "ready" | "loading" | "empty";
  /** The wider range the empty state offers to switch to. */
  emptyActionRange?: string;
  onSelectPayout?: (payout: TallyPayout) => void;
  viewAllHref?: string;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  onNavigate?: (item: TallyNavItem, event: MouseEvent<HTMLAnchorElement>) => void;
  onAccountClick?: () => void;
  className?: string;
};

const DEFAULT_NAVIGATION: TallyNavGroup[] = [
  {
    label: "Payments",
    items: [
      { id: "overview", label: "Overview", href: "#overview", icon: LayoutDashboard },
      { id: "transactions", label: "Transactions", href: "#transactions", icon: ArrowLeftRight },
      { id: "payouts", label: "Payouts", href: "#payouts", icon: Landmark },
      { id: "disputes", label: "Disputes", href: "#disputes", icon: ShieldAlert, badge: 3 },
    ],
  },
  {
    label: "Business",
    items: [
      { id: "customers", label: "Customers", href: "#customers", icon: Users },
      { id: "reports", label: "Reports", href: "#reports", icon: ChartNoAxesColumn },
    ],
  },
];

const DEFAULT_SECONDARY: TallyNavItem[] = [{ id: "settings", label: "Settings", href: "#settings", icon: Settings }];

const DEFAULT_BREADCRUMBS: TallyBreadcrumb[] = [
  { label: "Payments", href: "#payments" },
  { label: "Overview", href: "#overview" },
];

const DEFAULT_METRICS: TallyMetric[] = [
  { id: "gross", label: "Gross volume", format: "currency", better: "up" },
  { id: "net", label: "Net revenue", format: "currency", better: "up" },
  { id: "failed", label: "Failed charges", format: "count", better: "down" },
  { id: "dispute", label: "Dispute rate", format: "percent", better: "down" },
];

// One simulated ledger, aggregated per range, so every range agrees with the others.
const DEFAULT_RANGES: TallyRange[] = [
  {
    id: "7d",
    short: "7D",
    label: "Last 7 days",
    period: "Oct 20 – 26, 2026",
    previous: "Oct 13 – 19, 2026",
    comparison: "prior 7 days",
    bucket: "6 hours",
    payoutCount: 41,
    figures: {
      gross: {
        value: 316280.53,
        delta: 4,
        series: [
          3936, 12128, 18246, 13766, 3870, 12485, 16796, 12131, 3884, 12124, 17007, 11511, 3618, 13383, 17512, 12225,
          3404, 11537, 16634, 12046, 3587, 12716, 14456, 11312, 3814, 12169, 17898, 12086,
        ],
      },
      net: {
        value: 23493.49,
        delta: 3,
        series: [
          318, 979, 1473, 1111, 205, 662, 891, 644, 291, 910, 1276, 864, 285, 1055, 1381, 964, 264, 894, 1289, 933, 291,
          1032, 1173, 918, 281, 898, 1321, 892,
        ],
      },
      failed: {
        value: 92,
        delta: 10.8,
        series: [1, 4, 5, 4, 1, 3, 4, 3, 1, 4, 5, 4, 1, 4, 5, 3, 1, 3, 5, 3, 1, 4, 4, 3, 1, 4, 6, 5],
      },
      dispute: {
        value: 0.42,
        delta: -0.06,
        series: [
          0.45, 0.55, 0.47, 0.52, 0.46, 0.54, 0.39, 0.44, 0.39, 0.39, 0.4, 0.43, 0.35, 0.33, 0.37, 0.37, 0.36, 0.43,
          0.4, 0.33, 0.35, 0.49, 0.38, 0.43, 0.52, 0.5, 0.42, 0.41,
        ],
      },
    },
  },
  {
    id: "30d",
    short: "30D",
    label: "Last 30 days",
    period: "Sep 27 – Oct 26, 2026",
    previous: "Aug 28 – Sep 26, 2026",
    comparison: "prior 30 days",
    bucket: "day",
    payoutCount: 168,
    figures: {
      gross: {
        value: 1309137.16,
        delta: 9.3,
        series: [
          37052, 43984, 40564, 42672, 48613, 42860, 40287, 37912, 46300, 45272, 48981, 46655, 44705, 38709, 37388,
          46792, 44549, 45641, 46675, 44804, 39073, 39299, 44071, 48076, 45282, 44525, 46738, 43622, 42071, 45967,
        ],
      },
      net: {
        value: 97451.48,
        delta: 8.8,
        series: [
          2738, 3292, 2936, 3020, 3856, 3210, 2799, 2894, 3364, 3328, 3739, 3510, 3089, 2948, 2791, 3627, 3141, 3433,
          3271, 3477, 2897, 3127, 3470, 3880, 2402, 3340, 3685, 3380, 3413, 3392,
        ],
      },
      failed: {
        value: 341,
        delta: -3.4,
        series: [
          10, 11, 7, 8, 12, 8, 9, 10, 16, 12, 8, 9, 13, 13, 9, 11, 14, 11, 15, 11, 9, 9, 14, 14, 11, 14, 13, 12, 12, 16,
        ],
      },
      dispute: {
        value: 0.44,
        delta: 0.06,
        series: [
          0.38, 0.4, 0.38, 0.35, 0.5, 0.49, 0.37, 0.44, 0.5, 0.43, 0.42, 0.37, 0.52, 0.39, 0.48, 0.42, 0.44, 0.51, 0.39,
          0.55, 0.51, 0.47, 0.49, 0.48, 0.47, 0.4, 0.35, 0.4, 0.4, 0.44,
        ],
      },
    },
  },
  {
    id: "90d",
    short: "90D",
    label: "Last 90 days",
    period: "Jul 29 – Oct 26, 2026",
    previous: "Apr 30 – Jul 28, 2026",
    comparison: "prior 90 days",
    bucket: "5 days",
    payoutCount: 497,
    figures: {
      gross: {
        value: 3667370.81,
        delta: 10.1,
        series: [
          191925, 204845, 187548, 188222, 191712, 195961, 187813, 195340, 205802, 203493, 200871, 204702, 212885,
          212631, 216438, 228460, 215802, 222923,
        ],
      },
      net: {
        value: 271850.01,
        delta: 9.8,
        series: [
          12656, 15808, 14056, 14135, 13811, 14386, 14061, 14711, 15521, 14997, 14986, 15270, 15842, 15595, 16076,
          16950, 15777, 17211,
        ],
      },
      failed: {
        value: 1069,
        delta: 20,
        series: [59, 57, 66, 63, 68, 62, 68, 58, 62, 54, 58, 53, 48, 55, 52, 62, 57, 67],
      },
      dispute: {
        value: 0.42,
        delta: -0.02,
        series: [
          0.42, 0.44, 0.48, 0.41, 0.45, 0.47, 0.42, 0.35, 0.39, 0.35, 0.37, 0.38, 0.41, 0.44, 0.44, 0.46, 0.49, 0.4,
        ],
      },
    },
  },
  {
    id: "12m",
    short: "12M",
    label: "Last 12 months",
    period: "Oct 27, 2025 – Oct 26, 2026",
    previous: "Oct 27, 2024 – Oct 26, 2025",
    comparison: "prior 12 months",
    bucket: "month",
    payoutCount: 1862,
    figures: {
      gross: {
        value: 13229446.33,
        delta: 36.9,
        series: [
          975348, 1098600, 917946, 1032195, 1042909, 1089026, 1108407, 1105438, 1151891, 1162340, 1236209, 1309137,
        ],
      },
      net: {
        value: 971368.86,
        delta: 37.5,
        series: [71896, 79669, 61586, 74469, 77613, 81055, 82285, 81936, 86142, 85065, 92202, 97451],
      },
      failed: { value: 3599, delta: 20.9, series: [249, 303, 246, 262, 275, 290, 284, 302, 309, 369, 369, 341] },
      dispute: {
        value: 0.46,
        delta: 0.08,
        series: [0.44, 0.46, 0.55, 0.54, 0.48, 0.46, 0.46, 0.44, 0.43, 0.44, 0.38, 0.44],
      },
    },
  },
];

const DEFAULT_PAYOUTS: TallyPayout[] = [
  {
    id: "po_8KwR2mTq",
    recipient: "Halvorsen Ceramics",
    status: "in-transit",
    destination: "•••• 4821",
    arrival: "Oct 27",
    amount: 12486.4,
  },
  {
    id: "po_8KwQ7nVd",
    recipient: "Adeyemi & Lin Studio",
    status: "scheduled",
    destination: "•••• 0937",
    arrival: "Oct 28",
    amount: 8912.75,
  },
  {
    id: "po_8KvZ6kDx",
    recipient: "Brightwater Bikes",
    status: "paid",
    destination: "•••• 5520",
    arrival: "Oct 26",
    amount: 24107.32,
  },
  {
    id: "po_8KvY2hSe",
    recipient: "Marisol Tea Co.",
    status: "failed",
    destination: "•••• 7714",
    arrival: null,
    amount: 3264.9,
  },
  {
    id: "po_8KvX9cLa",
    recipient: "Ilse Varga Design",
    status: "on-hold",
    destination: "•••• 3391",
    arrival: null,
    amount: 41209.88,
  },
  {
    id: "po_8KvW4bFr",
    recipient: "Northpine Outfitters",
    status: "paid",
    destination: "•••• 2208",
    arrival: "Oct 25",
    amount: 17550.18,
  },
  {
    id: "po_8KvV7aJo",
    recipient: "Kettle & Crane Bakery",
    status: "paid",
    destination: "•••• 6045",
    arrival: "Oct 24",
    amount: 2918.06,
  },
];

const EASE = [0.2, 0.8, 0.2, 1] as const;
/** The redraw: every sparkline and figure lands together. */
const DRAW_SECONDS = 0.4;
const SPARK_HEIGHT = 48;
const SPARK_TOP = 8;
const SPARK_BOTTOM = 6;

const STATUS: Record<TallyPayoutStatus, { label: string; icon: LucideIcon; className: string }> = {
  paid: {
    label: "Paid",
    icon: Check,
    className: "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300",
  },
  "in-transit": {
    label: "In transit",
    icon: ArrowRight,
    className: "bg-(--iu-foreground)/6 text-(--iu-foreground) dark:bg-(--iu-foreground)/10",
  },
  scheduled: {
    label: "Scheduled",
    icon: CalendarClock,
    className: "text-(--iu-muted) ring-1 ring-(--iu-border) ring-inset",
  },
  "on-hold": {
    label: "On hold",
    icon: Pause,
    className: "bg-amber-500/12 text-amber-800 dark:bg-amber-400/10 dark:text-amber-300",
  },
  failed: {
    label: "Failed",
    icon: CircleAlert,
    className: "bg-red-500/10 text-red-700 dark:bg-red-400/10 dark:text-red-300",
  },
};

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--iu-accent)";
const RADIUS = "rounded-[min(var(--iu-radius),6px)]";
// Every tile draws its top and left hairline; the grid sits 1px outside the frame so the outer ones hide under it.
const KPI_GRID =
  "-mx-px -mt-px grid grid-cols-1 @xl/main:grid-cols-2 @4xl/main:grid-cols-[repeat(var(--tally-columns),minmax(0,1fr))]";

/** Name widths of the skeleton rows, so the loading table has the ragged edge of real data. */
const SKELETON_WIDTHS = [58, 72, 50, 64, 46, 68];

const PAYOUT_NOTE: Record<TallyPayoutStatus, string> = {
  paid: "Arrived",
  "in-transit": "Arrives",
  scheduled: "Arrives",
  "on-hold": "Held for review",
  failed: "Returned to balance",
};

function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter((part) => /^[A-Za-z]/.test(part))
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

type Formatters = {
  money: Intl.NumberFormat;
  wholeMoney: Intl.NumberFormat;
  count: Intl.NumberFormat;
  decimal: Intl.NumberFormat;
};

function makeFormatters(locale: string, currency: string): Formatters {
  return {
    money: new Intl.NumberFormat(locale, { style: "currency", currency, minimumFractionDigits: 2 }),
    wholeMoney: new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 }),
    count: new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }),
    decimal: new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  };
}

/** A figure split into its loud part and its quiet tail: "$1,257,483" + ".45", "0.44" + "%". */
function splitFigure(value: number, format: TallyMetric["format"], f: Formatters) {
  if (format === "count") return { main: f.count.format(value), tail: "" };
  if (format === "percent") return { main: f.decimal.format(value), tail: "%" };
  const parts = f.money.formatToParts(value);
  const at = parts.findIndex((part) => part.type === "decimal");
  if (at < 0) return { main: f.money.format(value), tail: "" };
  return {
    main: parts
      .slice(0, at)
      .map((part) => part.value)
      .join(""),
    tail: parts
      .slice(at)
      .map((part) => part.value)
      .join(""),
  };
}

function formatPoint(value: number, format: TallyMetric["format"], f: Formatters) {
  if (format === "currency") return f.wholeMoney.format(value);
  if (format === "count") return f.count.format(value);
  return `${f.decimal.format(value)}%`;
}

function formatDelta(delta: number, format: TallyMetric["format"]) {
  const sign = delta > 0 ? "+" : delta < 0 ? "−" : "";
  const size = Math.abs(delta);
  return format === "percent" ? `${sign}${size.toFixed(2)} pts` : `${sign}${size.toFixed(1)}%`;
}

type SparkGeometry = { y: number[]; m: number[]; step: number };

/** Plots a series into the sparkline box: x runs from 0 to 100, y is in pixels with the highest value on top. */
function sparkGeometry(series: number[]): SparkGeometry {
  const values = series.length > 1 ? series : [series[0] ?? 0, series[0] ?? 0];
  const max = Math.max(...values);
  // Headroom below the lowest value keeps day-to-day noise from filling the box; the wash sits underneath.
  const min = Math.min(...values) - (max - Math.min(...values)) * 0.45;
  const usable = SPARK_HEIGHT - SPARK_TOP - SPARK_BOTTOM;
  const y = values.map((value) =>
    max === min ? SPARK_HEIGHT - SPARK_BOTTOM : SPARK_TOP + (1 - (value - min) / (max - min)) * usable,
  );
  const step = 100 / (y.length - 1);
  // Monotone tangents (Steffen): the curve passes through every point and never overshoots between two of them.
  const slopes = y.slice(1).map((value, index) => (value - (y[index] ?? value)) / step);
  const m = y.map((_, index) => {
    const before = slopes[index - 1];
    const after = slopes[index];
    if (before === undefined) return after ?? 0;
    if (after === undefined) return before;
    if (before * after <= 0) return 0;
    return Math.sign(before) * 2 * Math.min(Math.abs(before), Math.abs(after), Math.abs(before + after) / 4);
  });
  return { y, m, step };
}

function linePath({ y, m, step }: SparkGeometry) {
  let path = `M0 ${(y[0] ?? 0).toFixed(2)}`;
  for (let index = 0; index < y.length - 1; index++) {
    const x0 = index * step;
    const y0 = y[index] ?? 0;
    const y1 = y[index + 1] ?? y0;
    const c1 = `${(x0 + step / 3).toFixed(2)} ${(y0 + ((m[index] ?? 0) * step) / 3).toFixed(2)}`;
    const c2 = `${(x0 + (2 * step) / 3).toFixed(2)} ${(y1 - ((m[index + 1] ?? 0) * step) / 3).toFixed(2)}`;
    path += `C${c1} ${c2} ${(x0 + step).toFixed(2)} ${y1.toFixed(2)}`;
  }
  return path;
}

/** Height of the curve at a point along the range (0 to 1), so the marker can ride the tip while it draws. */
function heightAt({ y, m, step }: SparkGeometry, progress: number) {
  const position = Math.min(1, Math.max(0, progress)) * (y.length - 1);
  const index = Math.min(y.length - 2, Math.floor(position));
  const t = position - index;
  const y0 = y[index] ?? 0;
  const y1 = y[index + 1] ?? y0;
  const m0 = (m[index] ?? 0) * step;
  const m1 = (m[index + 1] ?? 0) * step;
  const t2 = t * t;
  const t3 = t2 * t;
  return (2 * t3 - 3 * t2 + 1) * y0 + (t3 - 2 * t2 + t) * m0 + (3 * t2 - 2 * t3) * y1 + (t3 - t2) * m1;
}

/** Five-bar gate: four strokes in ink, the fifth in the accent. */
function TallyMark() {
  return (
    <span
      aria-hidden="true"
      className="inline-flex size-6 shrink-0 items-center justify-center rounded-[min(var(--iu-radius),6px)] bg-(--iu-foreground) text-(--iu-background)"
    >
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" strokeWidth="1.6" strokeLinecap="round">
        <path d="M4 3.5v9M6.67 3.5v9M9.33 3.5v9M12 3.5v9" stroke="currentColor" />
        <path d="M2.5 10.75 13.5 5.25" className="stroke-(--iu-accent)" />
      </svg>
    </span>
  );
}

function Monogram({ name, className = "size-6 text-[10px]" }: { name: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-[min(var(--iu-radius),6px)] bg-(--iu-foreground)/7 font-semibold tracking-wide text-(--iu-foreground) dark:bg-(--iu-foreground)/12 ${className}`}
    >
      {initials(name)}
    </span>
  );
}

function StatusPill({ status }: { status: TallyPayoutStatus }) {
  const { label, icon: Icon, className } = STATUS[status];
  return (
    <span
      className={`inline-flex h-5 items-center gap-1 rounded-[min(var(--iu-radius),4px)] px-2 text-xs font-medium whitespace-nowrap ${className}`}
    >
      <Icon size={12} strokeWidth={2} aria-hidden="true" />
      {label}
    </span>
  );
}

function NavLink({
  item,
  current,
  onNavigate,
}: {
  item: TallyNavItem;
  current: boolean;
  onNavigate?: TallyOpsDashboardProps["onNavigate"];
}) {
  const Icon = item.icon;
  return (
    <a
      href={item.href}
      aria-current={current ? "page" : undefined}
      onClick={(event) => onNavigate?.(item, event)}
      className={cx(
        "group/link relative flex h-8 items-center gap-3 rounded-[min(var(--iu-radius),6px)] px-3 text-[13px] font-medium transition-colors duration-100 motion-reduce:transition-none pointer-coarse:h-10",
        "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-(--iu-accent)",
        current
          ? "bg-(--iu-foreground)/6 text-(--iu-foreground) before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-(--iu-accent) dark:bg-(--iu-foreground)/10"
          : "text-(--iu-muted) pointer-fine:hover:bg-(--iu-foreground)/4 pointer-fine:hover:text-(--iu-foreground)",
      )}
    >
      <Icon size={16} strokeWidth={1.5} aria-hidden="true" className="shrink-0" />
      <span className="min-w-0 flex-1 truncate group-data-[collapsed=true]/sidebar:sr-only">{item.label}</span>
      {item.badge ? (
        <>
          <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-(--iu-foreground)/7 px-1 font-mono text-[11px] text-(--iu-foreground) tabular-nums group-data-[collapsed=true]/sidebar:sr-only dark:bg-(--iu-foreground)/12">
            <span className="sr-only">, </span>
            {item.badge}
            <span className="sr-only"> open</span>
          </span>
          <span
            aria-hidden="true"
            className="absolute top-1 left-6 hidden size-1.5 rounded-full bg-(--iu-foreground) ring-2 ring-(--iu-background) group-data-[collapsed=true]/sidebar:block"
          />
        </>
      ) : null}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-full z-40 ml-3 hidden -translate-y-1/2 rounded-[min(var(--iu-radius),6px)] bg-(--iu-foreground) px-2 py-1 text-xs font-medium whitespace-nowrap text-(--iu-background) opacity-0 shadow-md transition-opacity duration-100 group-focus-visible/link:opacity-100 group-data-[collapsed=true]/sidebar:block motion-reduce:transition-none pointer-fine:group-hover/link:opacity-100 pointer-fine:group-hover/link:delay-300"
      >
        {item.label}
      </span>
    </a>
  );
}

function NavBody({
  navigation,
  secondary,
  currentNavId,
  user,
  idPrefix,
  onNavigate,
}: {
  navigation: TallyNavGroup[];
  secondary: TallyNavItem[];
  currentNavId: string;
  user: { name: string; role: string };
  idPrefix: string;
  onNavigate?: TallyOpsDashboardProps["onNavigate"];
}) {
  return (
    <>
      <nav aria-label="Main" className="flex-1 px-2 py-3">
        {navigation.map((group, index) => {
          const labelId = `${idPrefix}-group-${index}`;
          return (
            <div key={group.label} className={index > 0 ? "mt-4" : undefined}>
              <div className="flex h-7 items-center px-3">
                <p
                  id={labelId}
                  className="text-[11px] font-medium tracking-[0.08em] text-(--iu-muted) uppercase group-data-[collapsed=true]/sidebar:sr-only"
                >
                  {group.label}
                </p>
                <span
                  aria-hidden="true"
                  className="mx-auto hidden h-px w-4 bg-(--iu-border) group-data-[collapsed=true]/sidebar:block"
                />
              </div>
              <ul aria-labelledby={labelId} className="flex flex-col gap-1">
                {group.items.map((item) => (
                  <li key={item.id}>
                    <NavLink item={item} current={item.id === currentNavId} onNavigate={onNavigate} />
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </nav>
      <div className="border-t border-(--iu-border) px-2 py-2">
        <ul className="flex flex-col gap-1">
          {secondary.map((item) => (
            <li key={item.id}>
              <NavLink item={item} current={item.id === currentNavId} onNavigate={onNavigate} />
            </li>
          ))}
        </ul>
        <div className="mt-2 flex h-11 items-center gap-2 px-2">
          <Monogram name={user.name} className="size-6 text-[10px]" />
          <span className="min-w-0 flex-1 overflow-hidden leading-tight whitespace-nowrap group-data-[collapsed=true]/sidebar:sr-only">
            <span className="block truncate text-[13px] font-medium">{user.name}</span>
            <span className="block truncate text-xs text-(--iu-muted)">{user.role}</span>
          </span>
        </div>
      </div>
    </>
  );
}

function AccountButton({ account, onClick }: { account: { name: string; detail: string }; onClick?: () => void }) {
  return (
    <button
      type="button"
      data-tally-account
      onClick={onClick}
      className={`flex h-10 w-full min-w-0 items-center gap-2 rounded-[min(var(--iu-radius),6px)] px-2 text-left transition-colors duration-100 motion-reduce:transition-none pointer-fine:hover:bg-(--iu-foreground)/4 ${FOCUS}`}
    >
      <TallyMark />
      <span className="min-w-0 flex-1 overflow-hidden leading-tight whitespace-nowrap group-data-[collapsed=true]/sidebar:sr-only">
        <span className="block truncate text-[13px] font-semibold">{account.name}</span>
        <span className="block truncate text-xs text-(--iu-muted)">{account.detail}</span>
      </span>
      <ChevronsUpDown
        size={14}
        strokeWidth={1.5}
        aria-hidden="true"
        className="shrink-0 text-(--iu-muted) group-data-[collapsed=true]/sidebar:hidden"
      />
    </button>
  );
}

function Sparkline({
  series,
  progress,
  gradientId,
  label,
  empty,
}: {
  series: number[];
  progress: MotionValue<number>;
  gradientId: string;
  label: string;
  empty: boolean;
}) {
  const geometry = sparkGeometry(empty ? series.map(() => 0) : series);
  const clipPath = useTransform(progress, (value) => `inset(0 ${(100 - value * 100).toFixed(2)}% 0 0)`);
  const left = useTransform(progress, (value) => `${(value * 100).toFixed(2)}%`);
  const top = useTransform(progress, (value) => `${heightAt(geometry, value).toFixed(2)}px`);
  const line = linePath(geometry);
  return (
    <div role="img" aria-label={label} className="relative h-12 w-full">
      <motion.div data-tally-clip className="absolute inset-0" style={{ clipPath }}>
        <svg
          aria-hidden="true"
          viewBox={`0 0 100 ${SPARK_HEIGHT}`}
          preserveAspectRatio="none"
          className="block size-full overflow-visible text-(--iu-foreground)"
        >
          <defs>
            <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="currentColor" className="[stop-opacity:0.12] dark:[stop-opacity:0.2]" />
              <stop offset="1" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>
          </defs>
          {empty ? null : (
            <path data-tally-area d={`${line}L100 ${SPARK_HEIGHT}L0 ${SPARK_HEIGHT}Z`} fill={`url(#${gradientId})`} />
          )}
          <path
            data-tally-line
            d={line}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            className={empty ? "opacity-25" : "opacity-80"}
          />
        </svg>
      </motion.div>
      {empty ? null : (
        <motion.span
          data-tally-dot
          aria-hidden="true"
          className="absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-(--iu-accent) ring-2 ring-(--iu-surface)"
          style={{ left, top }}
        />
      )}
    </div>
  );
}

function MetricTile({
  metric,
  figure,
  range,
  progress,
  empty,
  formatters,
  gradientId,
  revealKey,
}: {
  metric: TallyMetric;
  figure: TallyFigure;
  range: TallyRange;
  progress: MotionValue<number>;
  empty: boolean;
  formatters: Formatters;
  gradientId: string;
  revealKey: number;
}) {
  const reduceMotion = useReducedMotion();
  const target = empty ? 0 : figure.value;
  const value = useMotionValue(target);
  const main = useTransform(value, (latest) => splitFigure(latest, metric.format, formatters).main);
  const tail = useTransform(value, (latest) => splitFigure(latest, metric.format, formatters).tail);

  // The figure counts from what is on screen to the new value, in step with the line.
  useLayoutEffect(() => {
    if (value.get() === target) return;
    if (reduceMotion) {
      value.set(target);
      return;
    }
    const controls = animate(value, target, { duration: DRAW_SECONDS, ease: EASE });
    return () => controls.stop();
  }, [target, reduceMotion, value]);

  const direction = figure.delta > 0 ? "up" : figure.delta < 0 ? "down" : "flat";
  const tone = empty || direction === "flat" ? "flat" : direction === metric.better ? "good" : "bad";
  const DeltaIcon = empty || direction === "flat" ? Minus : direction === "up" ? ArrowUpRight : ArrowDownRight;
  const values = figure.series;
  const sparkLabel = empty
    ? `${metric.label}, ${range.label.toLowerCase()}: no activity`
    : `${metric.label} per ${range.bucket}, ${range.label.toLowerCase()}: low ${formatPoint(Math.min(...values), metric.format, formatters)}, high ${formatPoint(Math.max(...values), metric.format, formatters)}`;

  // One <dt>/<dd> group per tile. Below the two-column width the sparkline moves beside the figures.
  return (
    <div data-tally-metric={metric.id} className={TILE}>
      <dt className="col-start-1 text-[13px] leading-5 font-medium text-(--iu-muted)">{metric.label}</dt>
      <dd className="col-start-1 mt-1 text-[22px] leading-8 font-semibold tracking-[-0.025em] whitespace-nowrap tabular-nums @xl/main:text-[26px]">
        {empty && metric.format === "percent" ? (
          <>
            <span aria-hidden="true">—</span>
            <span className="sr-only">No data</span>
          </>
        ) : (
          <>
            <motion.span data-tally-main>{main}</motion.span>
            <motion.span
              data-tally-tail
              className="ml-px text-[0.62em] leading-none font-medium tracking-normal text-(--iu-muted)"
            >
              {tail}
            </motion.span>
          </>
        )}
      </dd>
      <dd className="col-start-1 mt-1 text-xs leading-5">
        <motion.span
          key={`${range.id}:${empty}`}
          data-tally-delta
          data-tone={tone}
          initial={revealKey > 0 ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          className="group/delta flex flex-wrap items-center gap-x-1.5"
        >
          <span className="inline-flex items-center gap-1 font-medium whitespace-nowrap tabular-nums group-data-[tone=bad]/delta:text-red-700 group-data-[tone=flat]/delta:text-(--iu-muted) group-data-[tone=good]/delta:text-emerald-700 dark:group-data-[tone=bad]/delta:text-red-400 dark:group-data-[tone=good]/delta:text-emerald-400">
            <DeltaIcon size={14} strokeWidth={2} aria-hidden="true" />
            <span data-tally-delta-value>{empty ? "No activity" : formatDelta(figure.delta, metric.format)}</span>
          </span>
          {empty ? null : (
            <span className="whitespace-nowrap text-(--iu-muted)">
              vs <span data-tally-compare>{range.comparison}</span>
              <span data-tally-verdict className="sr-only">
                {tone === "good" ? ", an improvement" : tone === "bad" ? ", a deterioration" : ""}
              </span>
            </span>
          )}
        </motion.span>
      </dd>
      <dd className="col-start-2 row-span-3 row-start-1 min-w-0 self-end @xl/main:mt-auto @xl/main:self-stretch @xl/main:pt-3">
        <Sparkline series={values} progress={progress} gradientId={gradientId} label={sparkLabel} empty={empty} />
      </dd>
    </div>
  );
}

const TILE =
  "grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,40%)] gap-x-4 border-t border-l border-(--iu-border) bg-(--iu-surface) px-[calc(16px*var(--iu-density))] pt-[calc(16px*var(--iu-density))] pb-[calc(12px*var(--iu-density))] @xl/main:flex @xl/main:flex-col";

function TileSkeleton() {
  return (
    <div aria-hidden="true" className={TILE}>
      <div className="col-start-1 flex h-5 items-center">
        <span className="block h-2.5 w-24 rounded-full bg-(--iu-foreground)/7 dark:bg-(--iu-foreground)/10" />
      </div>
      <div className="col-start-1 mt-1 flex h-8 items-center">
        <span className="block h-5 w-32 max-w-full rounded-[min(var(--iu-radius),4px)] bg-(--iu-foreground)/7 dark:bg-(--iu-foreground)/10" />
      </div>
      <div className="col-start-1 mt-1 flex h-5 items-center">
        <span className="block h-2.5 w-28 max-w-full rounded-full bg-(--iu-foreground)/5 dark:bg-(--iu-foreground)/8" />
      </div>
      <div className="col-start-2 row-span-3 row-start-1 h-12 self-end @xl/main:mt-auto @xl/main:box-content @xl/main:self-stretch @xl/main:pt-3">
        <span className="block h-full rounded-[min(var(--iu-radius),4px)] bg-(--iu-foreground)/4 dark:bg-(--iu-foreground)/6" />
      </div>
    </div>
  );
}

export function TallyOpsDashboard({
  account = { name: "Larkspur Market", detail: "Fivebar · Live" },
  user = { name: "Noor Haddad", role: "Payments ops" },
  navigation = DEFAULT_NAVIGATION,
  secondaryNavigation = DEFAULT_SECONDARY,
  currentNavId = "overview",
  breadcrumbs = DEFAULT_BREADCRUMBS,
  metrics = DEFAULT_METRICS,
  ranges = DEFAULT_RANGES,
  range,
  defaultRange = "30d",
  onRangeChange,
  payouts = DEFAULT_PAYOUTS,
  currency = "USD",
  locale = "en-US",
  status = "ready",
  emptyActionRange = "90d",
  onSelectPayout,
  viewAllHref = "#payouts",
  defaultCollapsed = false,
  onCollapsedChange,
  onNavigate,
  onAccountClick,
  className = "",
}: TallyOpsDashboardProps) {
  const reduceMotion = useReducedMotion();
  const uid = `tally${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const formatters = useMemo(() => makeFormatters(locale, currency), [locale, currency]);
  const [internalRange, setInternalRange] = useState(defaultRange);
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [menuOpen, setMenuOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const progress = useMotionValue(1);

  const activeId = range ?? internalRange;
  const active = ranges.find((candidate) => candidate.id === activeId) ?? ranges[0];
  const emptyAction = ranges.find((candidate) => candidate.id === emptyActionRange);
  const current = breadcrumbs[breadcrumbs.length - 1];
  const activeIndex = Math.max(0, ranges.indexOf(active as TallyRange));

  // Count every change of range or data state; the first one switches the redraw on.
  const signature = `${active?.id}:${status}`;
  const [seenSignature, setSeenSignature] = useState(signature);
  const [redraws, setRedraws] = useState(0);
  if (signature !== seenSignature) {
    setSeenSignature(signature);
    setRedraws((count) => count + 1);
  }

  // The redraw: every line wipes in from the left over 400ms while its marker rides the tip.
  useLayoutEffect(() => {
    if (redraws === 0) return;
    if (reduceMotion || status !== "ready") {
      progress.set(1);
      return;
    }
    progress.set(0);
    const controls = animate(progress, 1, { duration: DRAW_SECONDS, ease: EASE });
    return () => controls.stop();
  }, [redraws, reduceMotion, status, progress]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (menuOpen && !dialog.open) {
      dialog.showModal();
      // Land on the current page, so the drawer opens where the reader already is.
      dialog.querySelector<HTMLElement>('[aria-current="page"]')?.focus();
    }
    if (!menuOpen && dialog.open) dialog.close();
  }, [menuOpen]);

  // The drawer belongs to small screens: close it if the window grows into the sidebar layout.
  useEffect(() => {
    const query = window.matchMedia("(min-width: 64rem)");
    const onChange = () => {
      if (query.matches) setMenuOpen(false);
    };
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  if (!active) return null;

  const selectRange = (id: string) => {
    if (id === activeId) return;
    setInternalRange(id);
    onRangeChange?.(id);
  };

  const toggleSidebar = () => {
    const next = !collapsed;
    setCollapsed(next);
    onCollapsedChange?.(next);
  };

  const navigate: TallyOpsDashboardProps["onNavigate"] = (item, event) => {
    setMenuOpen(false);
    onNavigate?.(item, event);
  };

  const loading = status === "loading";
  const empty = status === "empty";
  const navProps = {
    navigation,
    secondary: secondaryNavigation,
    currentNavId,
    user,
    onNavigate: navigate,
  };

  return (
    <MotionConfig reducedMotion="user" transition={reduceMotion ? { duration: 0 } : { duration: 0.15, ease: EASE }}>
      <div
        data-tally-dashboard
        className={cx(
          "flex min-h-dvh flex-col bg-(--iu-background) font-(family-name:--iu-font) text-[13px] leading-[1.4] text-(--iu-foreground) lg:flex-row",
          className,
        )}
      >
        {/* Sidebar: full width or an icon rail. Styles key off data-collapsed so both widths share one markup. */}
        <div
          id={`${uid}-sidebar`}
          data-collapsed={collapsed ? "true" : "false"}
          className="group/sidebar sticky top-0 z-30 hidden h-dvh w-60 shrink-0 flex-col border-r border-(--iu-border) bg-(--iu-background) transition-[width] duration-150 ease-out data-[collapsed=true]:w-14 motion-reduce:transition-none lg:flex"
        >
          <div className="flex h-14 shrink-0 items-center border-b border-(--iu-border) px-2">
            <AccountButton account={account} onClick={onAccountClick} />
          </div>
          <NavBody {...navProps} idPrefix={`${uid}-side`} />
        </div>

        {/* Small screens: a top bar with the account and a drawer for the navigation. */}
        <div className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-1 border-b border-(--iu-border) bg-(--iu-background) px-2 lg:hidden">
          <button
            ref={menuButtonRef}
            type="button"
            aria-label="Open navigation"
            aria-haspopup="dialog"
            aria-expanded={menuOpen}
            aria-controls={`${uid}-drawer`}
            onClick={() => setMenuOpen(true)}
            className={`inline-flex size-10 items-center justify-center rounded-[min(var(--iu-radius),6px)] text-(--iu-foreground) transition-colors duration-100 motion-reduce:transition-none pointer-fine:hover:bg-(--iu-foreground)/5 ${FOCUS}`}
          >
            <Menu size={18} strokeWidth={1.5} aria-hidden="true" />
          </button>
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <TallyMark />
            <span className="min-w-0 truncate text-[13px] leading-tight">
              <span className="block truncate font-semibold">{account.name}</span>
              <span className="block truncate text-xs text-(--iu-muted)">{account.detail}</span>
            </span>
          </div>
          <span className="pr-2">
            <Monogram name={user.name} className="size-7 text-[11px]" />
            <span className="sr-only">Signed in as {user.name}</span>
          </span>
        </div>

        <dialog
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
          className="fixed inset-y-0 right-auto left-0 m-0 h-dvh max-h-none w-72 max-w-[calc(100vw-3rem)] -translate-x-full border-r border-(--iu-border) bg-(--iu-surface) p-0 text-(--iu-foreground) shadow-xl transition-[translate,display,overlay] transition-discrete duration-200 ease-out backdrop:bg-black/40 open:translate-x-0 motion-reduce:transition-none lg:hidden dark:backdrop:bg-black/60 starting:open:-translate-x-full"
        >
          <div
            data-collapsed="false"
            className="group/sidebar flex h-full flex-col font-(family-name:--iu-font) text-[13px] leading-[1.4]"
          >
            <div className="flex h-14 shrink-0 items-center gap-1 border-b border-(--iu-border) px-2">
              <div className="min-w-0 flex-1">
                <AccountButton account={account} onClick={onAccountClick} />
              </div>
              <button
                type="button"
                aria-label="Close navigation"
                onClick={() => setMenuOpen(false)}
                className={`inline-flex size-10 shrink-0 items-center justify-center rounded-[min(var(--iu-radius),6px)] text-(--iu-muted) transition-colors duration-100 motion-reduce:transition-none pointer-fine:hover:bg-(--iu-foreground)/5 pointer-fine:hover:text-(--iu-foreground) ${FOCUS}`}
              >
                <X size={18} strokeWidth={1.5} aria-hidden="true" />
              </button>
            </div>
            <NavBody {...navProps} idPrefix={`${uid}-drawer`} />
          </div>
        </dialog>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-14 shrink-0 items-center gap-3 border-b border-(--iu-border) bg-(--iu-background) px-4 lg:sticky lg:top-0 lg:z-20 lg:px-6">
            <button
              type="button"
              aria-label="Sidebar"
              aria-expanded={!collapsed}
              aria-controls={`${uid}-sidebar`}
              onClick={toggleSidebar}
              className={`-ml-2 hidden size-8 shrink-0 items-center justify-center rounded-[min(var(--iu-radius),6px)] text-(--iu-muted) transition-colors duration-100 motion-reduce:transition-none lg:inline-flex pointer-coarse:size-10 pointer-fine:hover:bg-(--iu-foreground)/5 pointer-fine:hover:text-(--iu-foreground) ${FOCUS}`}
            >
              {collapsed ? (
                <PanelLeftOpen size={16} strokeWidth={1.5} aria-hidden="true" />
              ) : (
                <PanelLeftClose size={16} strokeWidth={1.5} aria-hidden="true" />
              )}
            </button>
            <span aria-hidden="true" className="hidden h-4 w-px bg-(--iu-border) lg:block" />
            <nav aria-label="Breadcrumb" className="min-w-0">
              <ol className="flex min-w-0 items-center gap-2 text-[13px]">
                {breadcrumbs.map((crumb, index) => {
                  const last = index === breadcrumbs.length - 1;
                  return (
                    <li key={crumb.href} className="flex min-w-0 items-center gap-2">
                      {index > 0 ? (
                        <svg
                          aria-hidden="true"
                          width="8"
                          height="14"
                          viewBox="0 0 8 14"
                          className="shrink-0 text-(--iu-muted) opacity-50"
                        >
                          <path d="M6.5 1.5 1.5 12.5" stroke="currentColor" strokeLinecap="round" />
                        </svg>
                      ) : null}
                      <a
                        href={crumb.href}
                        aria-current={last ? "page" : undefined}
                        className={cx(
                          "inline-flex h-6 min-w-0 items-center truncate rounded-[min(var(--iu-radius),4px)] transition-colors duration-100 motion-reduce:transition-none",
                          FOCUS,
                          last
                            ? "font-medium text-(--iu-foreground)"
                            : "text-(--iu-muted) pointer-fine:hover:text-(--iu-foreground)",
                        )}
                      >
                        {crumb.label}
                      </a>
                    </li>
                  );
                })}
              </ol>
            </nav>
            <fieldset className="relative ml-auto flex shrink-0 rounded-[min(var(--iu-radius),6px)] bg-(--iu-foreground)/5 p-0.5 dark:bg-(--iu-foreground)/7">
              <legend className="sr-only">Date range</legend>
              <span
                aria-hidden="true"
                data-tally-thumb
                className="absolute inset-y-0.5 left-0.5 w-11 rounded-[min(var(--iu-radius),4px)] bg-(--iu-foreground) transition-transform duration-150 ease-out motion-reduce:transition-none"
                style={{ transform: `translateX(${activeIndex * 100}%)` }}
              />
              {ranges.map((option) => (
                <label
                  key={option.id}
                  className="relative flex h-7 w-11 cursor-pointer items-center justify-center rounded-[min(var(--iu-radius),4px)] text-xs font-medium text-(--iu-muted) tabular-nums transition-colors duration-100 has-checked:text-(--iu-background) has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-(--iu-accent) motion-reduce:transition-none pointer-coarse:h-10 pointer-fine:[&:not(:has(:checked))]:hover:text-(--iu-foreground)"
                >
                  <input
                    type="radio"
                    name={`${uid}-range`}
                    value={option.id}
                    checked={option.id === active.id}
                    onChange={() => selectRange(option.id)}
                    className="sr-only"
                  />
                  {option.short}
                  <span className="sr-only"> ({option.label.toLowerCase()})</span>
                </label>
              ))}
            </fieldset>
          </header>

          <main aria-busy={loading || undefined} className="@container/main flex-1 px-4 py-5 lg:px-6 lg:py-6">
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
              <h1 className="text-xl leading-7 font-semibold tracking-[-0.02em] text-balance">{current?.label}</h1>
              <motion.p
                key={active.id}
                data-tally-period
                initial={redraws > 0 ? { opacity: 0 } : false}
                animate={{ opacity: 1 }}
                className="text-[13px] text-(--iu-muted) tabular-nums"
              >
                <span className="text-(--iu-foreground)">{active.period}</span>
                <span className="hidden sm:inline"> · compared with {active.previous}</span>
              </motion.p>
            </div>
            <p data-tally-announce aria-live="polite" className="sr-only">
              {loading ? "Loading payments" : redraws > 0 ? `Showing ${active.label.toLowerCase()}` : ""}
            </p>

            <section
              aria-labelledby={`${uid}-kpi-title`}
              className={`mt-4 overflow-hidden border border-(--iu-border) bg-(--iu-surface) ${RADIUS}`}
              style={{ "--tally-columns": Math.min(Math.max(metrics.length, 1), 4) } as CSSProperties}
            >
              <h2 id={`${uid}-kpi-title`} className="sr-only">
                Key metrics, {active.label.toLowerCase()}
              </h2>
              {loading ? (
                <div className={KPI_GRID}>
                  {metrics.map((metric) => (
                    <TileSkeleton key={metric.id} />
                  ))}
                </div>
              ) : (
                <dl className={KPI_GRID}>
                  {metrics.map((metric) => {
                    const figure = active.figures[metric.id];
                    if (!figure) return null;
                    return (
                      <MetricTile
                        key={metric.id}
                        metric={metric}
                        figure={figure}
                        range={active}
                        progress={progress}
                        empty={empty}
                        formatters={formatters}
                        gradientId={`${uid}-spark-${metric.id}`}
                        revealKey={redraws}
                      />
                    );
                  })}
                </dl>
              )}
            </section>

            <section
              aria-labelledby={`${uid}-payouts-title`}
              className={`mt-5 overflow-hidden border border-(--iu-border) bg-(--iu-surface) ${RADIUS}`}
            >
              <div className="flex min-h-12 items-center justify-between gap-4 border-b border-(--iu-border) px-4 py-2">
                <div className="flex min-w-0 flex-col @md/main:flex-row @md/main:items-baseline @md/main:gap-2">
                  <h2 id={`${uid}-payouts-title`} className="text-sm font-semibold whitespace-nowrap">
                    Recent payouts
                  </h2>
                  {loading ? (
                    <span aria-hidden="true" className="flex h-4 items-center @md/main:self-center">
                      <span className="block h-2.5 w-20 rounded-full bg-(--iu-foreground)/7 dark:bg-(--iu-foreground)/10" />
                    </span>
                  ) : (
                    <p data-tally-payout-count className="truncate text-xs text-(--iu-muted) tabular-nums">
                      {empty ? 0 : formatters.count.format(active.payoutCount)} in the {active.label.toLowerCase()}
                    </p>
                  )}
                </div>
                <a
                  href={viewAllHref}
                  className={`group/all -mr-2 inline-flex h-8 shrink-0 items-center gap-1 rounded-[min(var(--iu-radius),6px)] px-2 text-[13px] font-medium text-(--iu-foreground) transition-colors duration-100 motion-reduce:transition-none pointer-coarse:h-10 pointer-fine:hover:bg-(--iu-foreground)/5 ${FOCUS}`}
                >
                  View all
                  <span className="sr-only"> payouts</span>
                  <ArrowRight
                    size={14}
                    strokeWidth={1.5}
                    aria-hidden="true"
                    className="text-(--iu-muted) transition-transform duration-100 motion-reduce:transition-none pointer-fine:group-hover/all:translate-x-0.5"
                  />
                </a>
              </div>

              {empty ? (
                <div className="flex flex-col items-center px-6 py-12 text-center">
                  <span className="inline-flex size-10 items-center justify-center rounded-[min(var(--iu-radius),6px)] border border-(--iu-border) text-(--iu-muted)">
                    <CalendarRange size={18} strokeWidth={1.5} aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 text-sm font-semibold text-balance">
                    No payouts in the {active.label.toLowerCase()}
                  </h3>
                  <p className="mt-2 max-w-sm text-[13px] text-pretty text-(--iu-muted)">
                    No charges were captured from {active.period}, so there is nothing to settle or pay out. Earlier
                    activity is still on record.
                  </p>
                  {emptyAction && emptyAction.id !== active.id ? (
                    <button
                      type="button"
                      onClick={() => selectRange(emptyAction.id)}
                      className={`mt-5 inline-flex h-9 items-center gap-2 rounded-[min(var(--iu-radius),6px)] bg-(--iu-foreground) px-4 text-[13px] font-medium text-(--iu-background) transition-colors duration-100 motion-reduce:transition-none pointer-coarse:h-10 pointer-fine:hover:bg-[color-mix(in_oklab,var(--iu-foreground)_86%,var(--iu-background))] ${FOCUS}`}
                    >
                      Show {emptyAction.label.toLowerCase()}
                    </button>
                  ) : null}
                </div>
              ) : payouts.length === 0 && !loading ? (
                <p className="px-4 py-10 text-center text-[13px] text-pretty text-(--iu-muted)">
                  No payouts yet in the {active.label.toLowerCase()}. New payouts appear here as charges settle.
                </p>
              ) : (
                <>
                  <table className="hidden w-full table-fixed text-left text-[13px] @2xl/main:table">
                    <caption className="sr-only">Recent payouts, newest first</caption>
                    <thead>
                      <tr className="border-b border-(--iu-border) text-[11px] font-medium tracking-[0.06em] text-(--iu-muted) uppercase">
                        <th scope="col" className="w-[34%] px-4 py-2 font-medium @4xl/main:w-[28%]">
                          Recipient
                        </th>
                        <th scope="col" className="w-[22%] px-3 py-2 font-medium @4xl/main:w-[15%]">
                          Status
                        </th>
                        <th scope="col" className="w-[18%] px-3 py-2 font-medium @4xl/main:w-[12%]">
                          Arrival
                        </th>
                        <th scope="col" className="hidden w-[14%] px-3 py-2 font-medium @4xl/main:table-cell">
                          Destination
                        </th>
                        <th scope="col" className="hidden w-[15%] px-3 py-2 font-medium @4xl/main:table-cell">
                          Payout
                        </th>
                        <th scope="col" className="w-[26%] px-4 py-2 text-right font-medium @4xl/main:w-[16%]">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-(--iu-border)">
                      {loading
                        ? SKELETON_WIDTHS.map((width) => (
                            <tr key={width} aria-hidden="true">
                              <td className="px-4 py-[calc(8px*var(--iu-density))]">
                                <span className="flex h-6 items-center gap-3">
                                  <span className="size-6 shrink-0 rounded-[min(var(--iu-radius),6px)] bg-(--iu-foreground)/7 dark:bg-(--iu-foreground)/10" />
                                  <span
                                    className="block h-2.5 rounded-full bg-(--iu-foreground)/7 dark:bg-(--iu-foreground)/10"
                                    style={{ width: `${width}%` }}
                                  />
                                </span>
                              </td>
                              <td className="px-3 py-[calc(8px*var(--iu-density))]">
                                <span className="block h-5 w-16 rounded-[min(var(--iu-radius),4px)] bg-(--iu-foreground)/5 dark:bg-(--iu-foreground)/8" />
                              </td>
                              <td className="px-3 py-[calc(8px*var(--iu-density))]">
                                <span className="block h-2.5 w-12 rounded-full bg-(--iu-foreground)/5 dark:bg-(--iu-foreground)/8" />
                              </td>
                              <td className="hidden px-3 py-[calc(8px*var(--iu-density))] @4xl/main:table-cell">
                                <span className="block h-2.5 w-12 rounded-full bg-(--iu-foreground)/5 dark:bg-(--iu-foreground)/8" />
                              </td>
                              <td className="hidden px-3 py-[calc(8px*var(--iu-density))] @4xl/main:table-cell">
                                <span className="block h-2.5 w-20 rounded-full bg-(--iu-foreground)/5 dark:bg-(--iu-foreground)/8" />
                              </td>
                              <td className="px-4 py-[calc(8px*var(--iu-density))]">
                                <span className="ml-auto block h-2.5 w-16 rounded-full bg-(--iu-foreground)/7 dark:bg-(--iu-foreground)/10" />
                              </td>
                            </tr>
                          ))
                        : payouts.map((payout) => (
                            <tr
                              key={payout.id}
                              className="relative transition-colors duration-100 motion-reduce:transition-none pointer-fine:hover:bg-(--iu-foreground)/2.5 dark:pointer-fine:hover:bg-(--iu-foreground)/4"
                            >
                              <td className="px-4 py-[calc(8px*var(--iu-density))]">
                                <span className="flex min-w-0 items-center gap-3">
                                  <Monogram name={payout.recipient} />
                                  <button
                                    type="button"
                                    data-tally-payout={payout.id}
                                    onClick={() => onSelectPayout?.(payout)}
                                    className="min-h-6 min-w-0 truncate text-left font-medium text-(--iu-foreground) outline-none after:absolute after:inset-0 focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-(--iu-accent)"
                                  >
                                    {payout.recipient}
                                  </button>
                                </span>
                              </td>
                              <td className="px-3 py-[calc(8px*var(--iu-density))]">
                                <StatusPill status={payout.status} />
                              </td>
                              <td className="px-3 py-[calc(8px*var(--iu-density))] whitespace-nowrap text-(--iu-muted) tabular-nums">
                                {payout.arrival ?? (
                                  <>
                                    <span aria-hidden="true">—</span>
                                    <span className="sr-only">{PAYOUT_NOTE[payout.status]}</span>
                                  </>
                                )}
                              </td>
                              <td className="hidden px-3 py-[calc(8px*var(--iu-density))] font-mono text-xs whitespace-nowrap text-(--iu-muted) @4xl/main:table-cell">
                                {payout.destination}
                              </td>
                              <td className="hidden truncate px-3 py-[calc(8px*var(--iu-density))] font-mono text-xs text-(--iu-muted) @4xl/main:table-cell">
                                {payout.id}
                              </td>
                              <td className="px-4 py-[calc(8px*var(--iu-density))] text-right font-mono whitespace-nowrap text-(--iu-foreground) tabular-nums">
                                {formatters.money.format(payout.amount)}
                              </td>
                            </tr>
                          ))}
                    </tbody>
                  </table>

                  <ul className="divide-y divide-(--iu-border) @2xl/main:hidden">
                    {loading
                      ? SKELETON_WIDTHS.slice(0, 5).map((width) => (
                          <li
                            key={width}
                            aria-hidden="true"
                            className="flex items-center gap-3 px-4 py-[calc(12px*var(--iu-density))]"
                          >
                            <span className="size-8 shrink-0 rounded-[min(var(--iu-radius),6px)] bg-(--iu-foreground)/7 dark:bg-(--iu-foreground)/10" />
                            <span className="min-w-0 flex-1">
                              <span className="flex h-5 items-center justify-between gap-3">
                                <span
                                  className="block h-2.5 rounded-full bg-(--iu-foreground)/7 dark:bg-(--iu-foreground)/10"
                                  style={{ width: `${width - 2}%` }}
                                />
                                <span className="block h-2.5 w-16 rounded-full bg-(--iu-foreground)/7 dark:bg-(--iu-foreground)/10" />
                              </span>
                              <span className="mt-1 flex h-5 items-center justify-between gap-3">
                                <span className="block h-2 w-24 rounded-full bg-(--iu-foreground)/5 dark:bg-(--iu-foreground)/8" />
                                <span className="block h-4 w-14 rounded-[min(var(--iu-radius),4px)] bg-(--iu-foreground)/5 dark:bg-(--iu-foreground)/8" />
                              </span>
                            </span>
                          </li>
                        ))
                      : payouts.map((payout) => (
                          <li
                            key={payout.id}
                            className="relative flex items-center gap-3 px-4 py-[calc(12px*var(--iu-density))] transition-colors duration-100 motion-reduce:transition-none pointer-fine:hover:bg-(--iu-foreground)/2.5"
                          >
                            <Monogram name={payout.recipient} className="size-8 text-[11px]" />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-baseline justify-between gap-3">
                                <button
                                  type="button"
                                  data-tally-payout={payout.id}
                                  onClick={() => onSelectPayout?.(payout)}
                                  className="min-h-6 min-w-0 truncate text-left text-[13px] font-medium outline-none after:absolute after:inset-0 focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-(--iu-accent)"
                                >
                                  {payout.recipient}
                                </button>
                                <span className="shrink-0 font-mono text-[13px] tabular-nums">
                                  {formatters.money.format(payout.amount)}
                                </span>
                              </div>
                              <div className="mt-1 flex items-center justify-between gap-3">
                                <span className="min-w-0 truncate text-xs text-(--iu-muted) tabular-nums">
                                  {payout.arrival
                                    ? `${PAYOUT_NOTE[payout.status]} ${payout.arrival}`
                                    : PAYOUT_NOTE[payout.status]}{" "}
                                  · <span className="font-mono">{payout.destination}</span>
                                </span>
                                <StatusPill status={payout.status} />
                              </div>
                            </div>
                          </li>
                        ))}
                  </ul>
                </>
              )}
            </section>
          </main>
        </div>
      </div>
    </MotionConfig>
  );
}

export default TallyOpsDashboard;
