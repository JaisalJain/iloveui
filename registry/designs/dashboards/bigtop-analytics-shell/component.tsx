"use client";

import { useEffect, useId, useRef, useState, type MouseEvent } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Check,
  ChevronsLeft,
  ChevronsRight,
  Copy,
  Download,
  FileText,
  Flag,
  Globe,
  Menu,
  MousePointerClick,
  RotateCw,
  Settings,
  TrendingUp,
  TriangleAlert,
  X,
  type LucideIcon,
} from "lucide-react";

export type BigtopSource = { id: string; label: string; daily: number[] };

export type BigtopKpi = {
  id: string;
  label: string;
  value: string;
  /** Change against the previous period, in percent or points. */
  change: number;
  unit: "%" | "pts";
  /** Whether a rising figure is good news (false for bounce rate). */
  higherIsBetter: boolean;
  series: number[];
};

export type BigtopPage = { path: string; visitors: number };

export type BigtopNavItem = { id: string; label: string; icon: LucideIcon; href: string };

export type BigtopAnalyticsShellProps = {
  site?: string;
  breadcrumbs?: string[];
  navigation?: BigtopNavItem[];
  currentNavId?: string;
  kpis?: BigtopKpi[];
  sources?: BigtopSource[];
  /** ISO date of the first day in every source series. */
  startDate?: string;
  pages?: BigtopPage[];
  status?: "ready" | "loading" | "empty" | "error";
  errorMessage?: string;
  snippet?: string;
  defaultSourceId?: string | null;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  onSourceChange?: (sourceId: string | null) => void;
  onNavigate?: (item: BigtopNavItem, event: MouseEvent<HTMLAnchorElement>) => void;
  onExport?: () => void;
  onRetry?: () => void;
  onCopySnippet?: (snippet: string) => void;
  className?: string;
};

const DEFAULT_SOURCES: BigtopSource[] = [
  { id: "search", label: "Search", daily: [814, 828, 858, 593, 612, 791, 842, 917, 894, 834, 677, 597, 832, 899] },
  { id: "direct", label: "Direct", daily: [520, 557, 540, 428, 413, 592, 521, 575, 522, 546, 422, 414, 599, 581] },
  { id: "hn", label: "Hacker News", daily: [32, 39, 26, 23, 39, 28, 55, 1684, 612, 188, 52, 58, 47, 54] },
  { id: "newsletter", label: "Newsletter", daily: [62, 438, 75, 69, 69, 83, 81, 73, 458, 92, 77, 93, 98, 77] },
  { id: "mastodon", label: "Mastodon", daily: [133, 104, 119, 127, 105, 126, 95, 297, 137, 137, 103, 108, 117, 136] },
];

const TOTALS = [1561, 1966, 1618, 1240, 1238, 1620, 1594, 3546, 2623, 1797, 1331, 1270, 1693, 1747];
const PER_VISIT = [2.5, 2.6, 2.4, 2.3, 2.4, 2.5, 2.6, 1.9, 2.1, 2.5, 2.6, 2.6, 2.7, 2.6];

const DEFAULT_KPIS: BigtopKpi[] = [
  { id: "visitors", label: "Visitors", value: "24,844", change: 16.6, unit: "%", higherIsBetter: true, series: TOTALS },
  {
    id: "pageviews",
    label: "Pageviews",
    value: "61,377",
    change: 13.4,
    unit: "%",
    higherIsBetter: true,
    series: TOTALS.map((visitors, index) => Math.round(visitors * (PER_VISIT[index] ?? 2.5))),
  },
  {
    id: "bounce",
    label: "Bounce rate",
    value: "41.2%",
    change: -2.8,
    unit: "pts",
    higherIsBetter: false,
    series: [43.1, 40.2, 42, 44.8, 45.1, 41.9, 41, 47.3, 44.6, 40.8, 39.9, 40.7, 38.9, 39.4],
  },
  {
    id: "duration",
    label: "Avg. visit",
    value: "2m 48s",
    change: 11.3,
    unit: "%",
    higherIsBetter: true,
    series: [161, 182, 170, 152, 149, 172, 175, 128, 149, 176, 181, 178, 186, 183],
  },
];

const DEFAULT_PAGES: BigtopPage[] = [
  { path: "/posts/sqlite-is-enough", visitors: 6214 },
  { path: "/", visitors: 4982 },
  { path: "/posts/tiny-cron", visitors: 2307 },
  { path: "/now", visitors: 1148 },
  { path: "/posts/a-parser-by-hand", visitors: 986 },
];

const DEFAULT_NAV: BigtopNavItem[] = [
  { id: "traffic", label: "Traffic", icon: TrendingUp, href: "#traffic" },
  { id: "pages", label: "Pages", icon: FileText, href: "#pages" },
  { id: "sources", label: "Sources", icon: Globe, href: "#sources" },
  { id: "events", label: "Events", icon: MousePointerClick, href: "#events" },
  { id: "goals", label: "Goals", icon: Flag, href: "#goals" },
  { id: "settings", label: "Settings", icon: Settings, href: "#settings" },
];

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--iu-accent)";
// Hard offset shadows read from --bt-ink, which dark mode softens so white outlines do not double up.
const INK =
  "[--bt-ink:var(--iu-foreground)] dark:[--bt-ink:color-mix(in_oklab,var(--iu-foreground)_38%,var(--iu-background))]";
const BOX =
  "rounded-[min(var(--iu-radius),4px)] border-2 border-(--iu-foreground) bg-(--iu-surface) shadow-[4px_4px_0_var(--bt-ink)]";
const PRESS =
  "transition-[translate,box-shadow] duration-100 ease-linear motion-reduce:transition-none active:translate-x-[3px] active:translate-y-[3px] active:shadow-none";
const LABEL = "font-mono text-[11px] font-semibold tracking-[0.06em] uppercase";

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

const number = (value: number) => new Intl.NumberFormat("en-US").format(value);

function dayLabel(iso: string, offset: number, options: Intl.DateTimeFormatOptions) {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + offset);
  return new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" }).format(date);
}

function BigtopMark() {
  return (
    <span
      aria-hidden="true"
      className="inline-flex size-10 shrink-0 items-center justify-center rounded-[min(var(--iu-radius),4px)] border-2 border-(--iu-foreground) bg-(--iu-accent) text-(--iu-accent-foreground)"
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25">
        <path d="M3 20 12 4l9 16Z" strokeLinejoin="miter" />
        <path d="M12 4v16M9 20l3-6 3 6" strokeLinejoin="miter" />
      </svg>
    </span>
  );
}

/** A stepped sparkline: square corners suit the family better than a smooth curve. */
function StepSpark({ series }: { series: number[] }) {
  const min = Math.min(...series);
  const max = Math.max(...series);
  const step = 100 / series.length;
  let d = "";
  series.forEach((value, index) => {
    const y = 4 + (1 - (value - min) / (max - min || 1)) * 32;
    d += index === 0 ? `M0,${y.toFixed(1)}` : ` V${y.toFixed(1)}`;
    d += ` H${((index + 1) * step).toFixed(1)}`;
  });
  return (
    <svg aria-hidden="true" viewBox="0 0 100 40" preserveAspectRatio="none" className="h-10 w-full">
      <path
        d={d}
        fill="none"
        vectorEffect="non-scaling-stroke"
        strokeWidth="2"
        strokeLinejoin="miter"
        className="stroke-(--iu-foreground)"
      />
    </svg>
  );
}

function DeltaSticker({ kpi }: { kpi: BigtopKpi }) {
  const up = kpi.change >= 0;
  const good = up === kpi.higherIsBetter;
  const Arrow = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cx(
        "inline-flex h-7 -rotate-2 items-center gap-1 rounded-[min(var(--iu-radius),3px)] border-2 border-(--iu-foreground) px-1.5 font-mono text-xs font-bold tabular-nums",
        good
          ? "bg-emerald-200 text-emerald-950 dark:bg-emerald-300 dark:text-emerald-950"
          : "bg-rose-200 text-rose-950 dark:bg-rose-300 dark:text-rose-950",
      )}
    >
      <Arrow size={14} strokeWidth={2.25} aria-hidden="true" />
      {up ? "+" : "−"}
      {Math.abs(kpi.change).toFixed(1)}
      {kpi.unit === "%" ? "%" : " pts"}
      <span className="sr-only"> vs previous 14 days, {good ? "an improvement" : "a decline"}</span>
    </span>
  );
}

function NavList({
  items,
  currentNavId,
  onNavigate,
  collapsible,
}: {
  items: BigtopNavItem[];
  currentNavId: string;
  onNavigate: BigtopAnalyticsShellProps["onNavigate"];
  collapsible: boolean;
}) {
  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => {
        const current = item.id === currentNavId;
        const Icon = item.icon;
        return (
          <li key={item.id}>
            <a
              href={item.href}
              aria-current={current ? "page" : undefined}
              onClick={(event) => onNavigate?.(item, event)}
              className={cx(
                "group/link relative flex h-11 items-center gap-3 rounded-[min(var(--iu-radius),4px)] border-2 px-3 text-sm font-bold uppercase transition-colors duration-100 ease-linear motion-reduce:transition-none",
                current
                  ? "border-(--iu-foreground) bg-(--iu-foreground) text-(--iu-background)"
                  : "border-transparent text-(--iu-foreground) pointer-fine:hover:border-(--iu-foreground)",
                FOCUS,
              )}
            >
              <Icon size={18} strokeWidth={2} aria-hidden="true" className="shrink-0" />
              <span className={cx("truncate", collapsible && "group-data-[collapsed=true]/side:sr-only")}>
                {item.label}
              </span>
              {collapsible ? (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 left-full z-10 ml-4 hidden -translate-y-1/2 rounded-[min(var(--iu-radius),3px)] border-2 border-(--iu-foreground) bg-(--iu-surface) px-2 py-1 font-mono text-xs whitespace-nowrap text-(--iu-foreground) opacity-0 shadow-[3px_3px_0_var(--bt-ink)] group-focus-visible/link:opacity-100 group-data-[collapsed=true]/side:block pointer-fine:group-hover/link:opacity-100"
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

function Block({ className }: { className: string }) {
  return <span aria-hidden="true" className={cx("block bg-(--iu-foreground)/12", className)} />;
}

export function BigtopAnalyticsShell({
  site = "lowtide.dev",
  breadcrumbs = ["Sites", "lowtide.dev", "Traffic"],
  navigation = DEFAULT_NAV,
  currentNavId = "traffic",
  kpis = DEFAULT_KPIS,
  sources = DEFAULT_SOURCES,
  startDate = "2026-10-14",
  pages = DEFAULT_PAGES,
  status = "ready",
  errorMessage = "The stats API timed out after 10 seconds. Your visits are still being recorded.",
  snippet = '<script defer data-site="lowtide.dev" src="/bigtop.js"></script>',
  defaultSourceId = null,
  defaultCollapsed = false,
  onCollapsedChange,
  onSourceChange,
  onNavigate,
  onExport,
  onRetry,
  onCopySnippet,
  className = "",
}: BigtopAnalyticsShellProps) {
  const uid = `bt${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [menuOpen, setMenuOpen] = useState(false);
  const [sourceId, setSourceId] = useState<string | null>(defaultSourceId);
  const [copied, setCopied] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

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

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const loading = status === "loading";
  const empty = status === "empty";
  const failed = status === "error";
  const ready = status === "ready";

  const days = sources[0]?.daily.length ?? 0;
  const totals = Array.from({ length: days }, (_, day) =>
    sources.reduce((sum, source) => sum + (source.daily[day] ?? 0), 0),
  );
  const grandTotal = totals.reduce((sum, value) => sum + value, 0);
  const scaleMax = Math.max(1000, Math.ceil(Math.max(...totals, 0) / 1000) * 1000);
  const active = sources.find((source) => source.id === sourceId) ?? null;
  const shown = active ? active.daily : totals;
  const shownTotal = shown.reduce((sum, value) => sum + value, 0);
  const peakIndex = shown.reduce((best, value, index) => (value > (shown[best] ?? 0) ? index : best), 0);
  const peakValue = shown[peakIndex] ?? 0;
  const firstDay = dayLabel(startDate, 0, { month: "short", day: "numeric" });
  const lastDay = dayLabel(startDate, days - 1, { month: "short", day: "numeric" });
  const peakDay = dayLabel(startDate, peakIndex, { month: "short", day: "numeric" });
  const peakShare = active ? Math.round((peakValue / (totals[peakIndex] || 1)) * 100) : 100;
  const chartLabel = active
    ? `${active.label} visitors per day, ${firstDay} to ${lastDay}: ${number(shownTotal)} in total, peaking at ${number(peakValue)} on ${peakDay}, ${peakShare}% of that day's visitors.`
    : `Visitors per day, ${firstDay} to ${lastDay}: ${number(shownTotal)} in total, peaking at ${number(peakValue)} on ${peakDay}.`;
  const maxPage = Math.max(...pages.map((page) => page.visitors), 1);

  const pick = (id: string | null) => {
    const next = id === sourceId ? null : id;
    setSourceId(next);
    onSourceChange?.(next);
  };

  const toggleSidebar = () => {
    const next = !collapsed;
    setCollapsed(next);
    onCollapsedChange?.(next);
  };

  const navigate: BigtopAnalyticsShellProps["onNavigate"] = (item, event) => {
    setMenuOpen(false);
    onNavigate?.(item, event);
  };

  const copySnippet = () => {
    void navigator.clipboard?.writeText(snippet).catch(() => undefined);
    setCopied(true);
    onCopySnippet?.(snippet);
  };

  return (
    <div
      data-bigtop-shell
      className={cx(
        "flex min-h-dvh flex-col bg-(--iu-background) font-(family-name:--iu-font) text-(--iu-foreground) lg:flex-row",
        INK,
        className,
      )}
    >
      {/* Sidebar: a full column or a 76px strip of icons. */}
      <div
        data-bt-side
        data-collapsed={collapsed ? "true" : "false"}
        className="group/side hidden w-60 shrink-0 border-r-2 border-(--iu-foreground) bg-(--iu-surface) transition-[width] duration-100 ease-linear data-[collapsed=true]:w-[76px] motion-reduce:transition-none lg:block"
      >
        <div className="sticky top-0 flex h-dvh flex-col p-3">
          <div className="flex items-center gap-3 pb-5 group-data-[collapsed=true]/side:flex-col">
            <BigtopMark />
            <span className="min-w-0 flex-1 truncate text-lg font-extrabold tracking-[-0.03em] uppercase group-data-[collapsed=true]/side:sr-only">
              Bigtop
            </span>
            <button
              type="button"
              data-bt-toggle
              onClick={toggleSidebar}
              aria-expanded={!collapsed}
              aria-controls={`${uid}-nav`}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className={cx(
                "inline-flex size-10 shrink-0 items-center justify-center rounded-[min(var(--iu-radius),4px)] border-2 border-(--iu-foreground) bg-(--iu-surface) shadow-[3px_3px_0_var(--bt-ink)]",
                PRESS,
                FOCUS,
              )}
            >
              {collapsed ? (
                <ChevronsRight size={18} strokeWidth={2} aria-hidden="true" />
              ) : (
                <ChevronsLeft size={18} strokeWidth={2} aria-hidden="true" />
              )}
            </button>
          </div>
          <nav id={`${uid}-nav`} aria-label="Main" className="flex-1">
            <NavList items={navigation} currentNavId={currentNavId} onNavigate={navigate} collapsible />
          </nav>
          <div className="mt-4 border-t-2 border-(--iu-foreground) pt-3">
            <p className="flex items-center gap-2 px-1 group-data-[collapsed=true]/side:justify-center">
              <span
                aria-hidden="true"
                className="size-3 shrink-0 border-2 border-(--iu-foreground) bg-emerald-400 dark:bg-emerald-300"
              />
              <span className="min-w-0 group-data-[collapsed=true]/side:sr-only">
                <span className="block truncate font-mono text-xs font-bold">{site}</span>
                <span className="block truncate text-xs text-(--iu-muted)">Tracking · script v3.2</span>
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Small screens: a top bar and a drawer that drops from the top. */}
      <div className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b-2 border-(--iu-foreground) bg-(--iu-surface) px-3 lg:hidden">
        <button
          ref={menuButtonRef}
          data-bt-menu
          type="button"
          aria-label="Open navigation"
          aria-haspopup="dialog"
          aria-expanded={menuOpen}
          aria-controls={`${uid}-drawer`}
          onClick={() => setMenuOpen(true)}
          className={cx(
            "inline-flex size-10 items-center justify-center rounded-[min(var(--iu-radius),4px)] border-2 border-(--iu-foreground) bg-(--iu-surface) shadow-[3px_3px_0_var(--bt-ink)]",
            PRESS,
            FOCUS,
          )}
        >
          <Menu size={18} strokeWidth={2} aria-hidden="true" />
        </button>
        <BigtopMark />
        <span className="text-lg font-extrabold tracking-[-0.03em] uppercase">Bigtop</span>
        <span className="ml-auto truncate font-mono text-xs font-bold">{site}</span>
      </div>

      <dialog
        ref={dialogRef}
        data-bt-drawer
        id={`${uid}-drawer`}
        aria-label="Navigation"
        onClose={() => {
          setMenuOpen(false);
          menuButtonRef.current?.focus();
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) setMenuOpen(false);
        }}
        className="fixed inset-x-0 top-0 bottom-auto m-0 w-full max-w-none -translate-y-full border-b-2 border-(--iu-foreground) bg-(--iu-surface) p-0 text-(--iu-foreground) shadow-[0_6px_0_var(--bt-ink)] transition-[translate,display,overlay] transition-discrete duration-150 ease-linear backdrop:bg-black/40 open:translate-y-0 motion-reduce:transition-none lg:hidden dark:backdrop:bg-black/70 starting:open:-translate-y-full"
      >
        <div className="p-3 font-(family-name:--iu-font)">
          <div className="flex items-center gap-3 pb-4">
            <BigtopMark />
            <span className="flex-1 text-lg font-extrabold tracking-[-0.03em] uppercase">Bigtop</span>
            <button
              type="button"
              data-bt-close
              aria-label="Close navigation"
              onClick={() => setMenuOpen(false)}
              className={cx(
                "inline-flex size-10 items-center justify-center rounded-[min(var(--iu-radius),4px)] border-2 border-(--iu-foreground) bg-(--iu-surface) shadow-[3px_3px_0_var(--bt-ink)]",
                PRESS,
                FOCUS,
              )}
            >
              <X size={18} strokeWidth={2} aria-hidden="true" />
            </button>
          </div>
          <nav aria-label="Main">
            <NavList items={navigation} currentNavId={currentNavId} onNavigate={navigate} collapsible={false} />
          </nav>
        </div>
      </dialog>

      <main
        aria-busy={loading || undefined}
        className="@container min-w-0 flex-1 px-4 pt-6 pb-14 sm:px-6 lg:px-8 lg:pt-8"
      >
        <div className="mx-auto max-w-[1200px]">
          <nav aria-label="Breadcrumb">
            <ol className={cx("flex flex-wrap items-center gap-2 text-(--iu-muted)", LABEL)}>
              {breadcrumbs.map((crumb, index) => {
                const last = index === breadcrumbs.length - 1;
                return (
                  <li key={crumb} className="flex items-center gap-2">
                    {last ? (
                      <span aria-current="page" className="text-(--iu-foreground)">
                        {crumb}
                      </span>
                    ) : (
                      <>
                        <a
                          href={`#${crumb.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                          className={cx(
                            "underline decoration-2 underline-offset-4 pointer-fine:hover:text-(--iu-foreground)",
                            FOCUS,
                          )}
                        >
                          {crumb}
                        </a>
                        <span aria-hidden="true">/</span>
                      </>
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>

          <header className="mt-3 flex flex-col gap-4 @2xl:flex-row @2xl:items-end @2xl:justify-between">
            <h1 className="text-[44px] leading-[0.9] font-extrabold tracking-[-0.04em] uppercase @2xl:text-[64px]">
              Traffic
            </h1>
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={cx(
                  "inline-flex h-10 items-center rounded-[min(var(--iu-radius),4px)] border-2 border-dashed border-(--iu-foreground) px-3 tabular-nums",
                  LABEL,
                )}
              >
                {firstDay} – {lastDay}
              </span>
              <button
                type="button"
                onClick={onExport}
                disabled={!ready}
                className={cx(
                  "inline-flex h-10 items-center gap-2 rounded-[min(var(--iu-radius),4px)] border-2 border-(--iu-foreground) bg-(--iu-surface) px-4 text-sm font-bold uppercase shadow-[3px_3px_0_var(--bt-ink)] disabled:cursor-not-allowed disabled:border-(--iu-foreground)/40 disabled:text-(--iu-muted) disabled:shadow-none",
                  PRESS,
                  FOCUS,
                )}
              >
                <Download size={16} strokeWidth={2} aria-hidden="true" />
                Export CSV
              </button>
            </div>
          </header>

          {loading ? <p className="sr-only">Loading traffic for {site}</p> : null}

          {/* KPI blocks */}
          <ul className="mt-8 grid grid-cols-2 gap-4 @4xl:grid-cols-4 @4xl:gap-5">
            {kpis.map((kpi) => (
              <li key={kpi.id} className={cx(BOX, "flex min-w-0 flex-col p-[calc(14px*var(--iu-density))]")}>
                <span className={cx(LABEL, "text-(--iu-muted)")}>{kpi.label}</span>
                {loading ? (
                  <>
                    <Block className="mt-3 h-8 w-3/4" />
                    <Block className="mt-3 h-6 w-16" />
                    <Block className="mt-3 h-10 w-full" />
                  </>
                ) : (
                  <>
                    <span className="mt-2 text-[28px] leading-none font-extrabold tracking-[-0.03em] tabular-nums @md:text-[36px]">
                      {ready ? kpi.value : failed ? "—" : kpi.unit === "pts" ? "0%" : "0"}
                      {failed ? <span className="sr-only"> unavailable</span> : null}
                    </span>
                    <span className="mt-3 flex min-h-7 items-center">
                      {ready ? (
                        <DeltaSticker kpi={kpi} />
                      ) : (
                        <span className="font-mono text-xs text-(--iu-muted)">
                          {failed ? "Not loaded" : "No visits yet"}
                        </span>
                      )}
                    </span>
                    <span className="mt-3 block">
                      {ready ? (
                        <StepSpark series={kpi.series} />
                      ) : (
                        <span aria-hidden="true" className="flex h-10 items-end">
                          <span className="block h-0 w-full border-t-2 border-dashed border-(--iu-foreground)/40" />
                        </span>
                      )}
                    </span>
                  </>
                )}
              </li>
            ))}
          </ul>

          <div className="mt-6 grid gap-6 @5xl:grid-cols-12">
            {/* The bar chart */}
            <section
              aria-labelledby={`${uid}-chart-title`}
              className={cx(
                BOX,
                "flex min-w-0 flex-col p-[calc(16px*var(--iu-density))] @2xl:p-[calc(24px*var(--iu-density))] @5xl:col-span-8",
              )}
            >
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 id={`${uid}-chart-title`} className={cx(LABEL, "text-(--iu-muted)")}>
                    <span data-bt-chart-title>{active ? `${active.label} visitors by day` : "Visitors by day"}</span>
                  </h2>
                  {ready ? (
                    <p
                      data-bt-total
                      className="mt-1 text-[40px] leading-none font-extrabold tracking-[-0.04em] tabular-nums"
                    >
                      {number(shownTotal)}
                    </p>
                  ) : null}
                </div>
                {ready ? (
                  <p
                    data-bt-share
                    className={cx(
                      "inline-flex h-8 items-center rounded-[min(var(--iu-radius),3px)] border-2 border-(--iu-foreground) px-2 tabular-nums",
                      LABEL,
                      active ? "bg-(--iu-accent) text-(--iu-accent-foreground)" : "bg-(--iu-surface)",
                    )}
                  >
                    {active ? `${Math.round((shownTotal / (grandTotal || 1)) * 100)}% of visitors` : "All sources"}
                  </p>
                ) : null}
              </div>

              {loading ? (
                <div
                  aria-hidden="true"
                  className="mt-8 flex h-64 items-end gap-1.5 border-b-2 border-(--iu-foreground) @2xl:gap-2"
                >
                  {[38, 52, 41, 30, 30, 44, 40, 86, 66, 47, 34, 33, 43, 45].map((height, index) => (
                    <span
                      key={index}
                      className="block flex-1 bg-(--iu-foreground)/12"
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>
              ) : failed ? (
                <div
                  role="alert"
                  className="mt-6 flex flex-col items-start gap-4 border-2 border-dashed border-(--iu-foreground) p-5"
                >
                  <span className="inline-flex items-center gap-2 rounded-[min(var(--iu-radius),3px)] border-2 border-(--iu-foreground) bg-rose-200 px-2 py-1 font-mono text-xs font-bold text-rose-950 uppercase dark:bg-rose-300">
                    <TriangleAlert size={14} strokeWidth={2.25} aria-hidden="true" />
                    Error 504
                  </span>
                  <p className="text-xl font-extrabold tracking-[-0.02em] uppercase">Traffic didn&apos;t load</p>
                  <p className="max-w-[52ch] text-base text-pretty text-(--iu-muted)">{errorMessage}</p>
                  <button
                    type="button"
                    onClick={onRetry}
                    className={cx(
                      "inline-flex h-11 items-center gap-2 rounded-[min(var(--iu-radius),4px)] border-2 border-(--iu-foreground) bg-(--iu-accent) px-5 text-sm font-extrabold text-(--iu-accent-foreground) uppercase shadow-[4px_4px_0_var(--bt-ink)]",
                      PRESS,
                      FOCUS,
                    )}
                  >
                    <RotateCw size={16} strokeWidth={2.25} aria-hidden="true" />
                    Try again
                  </button>
                </div>
              ) : empty ? (
                <div className="mt-6 flex flex-col items-start gap-4 border-2 border-dashed border-(--iu-foreground) p-5">
                  <p className="text-xl font-extrabold tracking-[-0.02em] uppercase">No visits yet</p>
                  <p className="max-w-[52ch] text-base text-pretty text-(--iu-muted)">
                    Paste this tag into the{" "}
                    <code className="font-mono text-sm text-(--iu-foreground)">&lt;head&gt;</code> of {site}. The first
                    visit shows up here within a minute.
                  </p>
                  <pre className="w-full overflow-x-auto rounded-[min(var(--iu-radius),4px)] border-2 border-(--iu-foreground) bg-(--iu-background) p-3 font-mono text-[13px] break-all whitespace-pre-wrap">
                    <code>{snippet}</code>
                  </pre>
                  <button
                    type="button"
                    data-bt-copy
                    onClick={copySnippet}
                    className={cx(
                      "inline-flex h-11 min-w-44 items-center justify-center gap-2 rounded-[min(var(--iu-radius),4px)] border-2 border-(--iu-foreground) bg-(--iu-accent) px-5 text-sm font-extrabold text-(--iu-accent-foreground) uppercase shadow-[4px_4px_0_var(--bt-ink)]",
                      PRESS,
                      FOCUS,
                    )}
                  >
                    {copied ? (
                      <Check size={16} strokeWidth={2.5} aria-hidden="true" />
                    ) : (
                      <Copy size={16} strokeWidth={2} aria-hidden="true" />
                    )}
                    <span data-bt-copy-label>{copied ? "Copied" : "Copy snippet"}</span>
                  </button>
                  <p aria-live="polite" className="sr-only">
                    {copied ? "Snippet copied to the clipboard" : ""}
                  </p>
                </div>
              ) : (
                <figure className="mt-6 flex flex-1 flex-col">
                  <div className="relative flex flex-1 flex-col">
                    {[1, 0.5].map((fraction) => (
                      <div
                        key={fraction}
                        aria-hidden="true"
                        className="absolute inset-x-0 flex items-center gap-2"
                        style={{ bottom: `calc(${fraction * 100}% - 1px)` }}
                      >
                        <span className="w-8 shrink-0 font-mono text-[11px] font-bold text-(--iu-muted) tabular-nums">
                          {number((scaleMax * fraction) / 1000)}K
                        </span>
                        <span className="h-0 flex-1 border-t-2 border-dashed border-(--iu-foreground)/20" />
                      </div>
                    ))}
                    <div
                      data-bt-chart
                      role="img"
                      aria-label={chartLabel}
                      className="relative ml-10 flex h-56 items-end gap-1 border-b-2 border-(--iu-foreground) @2xl:h-64 @2xl:gap-2 @5xl:h-auto @5xl:min-h-64 @5xl:flex-1"
                    >
                      {totals.map((total, day) => {
                        const part = active ? (active.daily[day] ?? 0) : total;
                        return (
                          <div
                            key={day}
                            data-bt-bar
                            className={cx(
                              "relative flex-1 overflow-hidden rounded-t-[min(var(--iu-radius),3px)] border-2 border-b-0 border-(--iu-foreground) transition-colors duration-100 ease-linear motion-reduce:transition-none",
                              active ? "bg-(--iu-surface)" : "bg-(--iu-foreground)",
                            )}
                            style={{ height: `${(total / scaleMax) * 100}%` }}
                          >
                            <span
                              data-bt-part
                              className="absolute inset-x-0 bottom-0 block border-t-2 border-(--iu-foreground) bg-(--iu-accent) transition-[height] duration-100 ease-[steps(4,end)] motion-reduce:transition-none"
                              style={{
                                height: active ? `${(part / (total || 1)) * 100}%` : "0%",
                                borderTopWidth: active ? undefined : 0,
                                transitionDelay: `${day * 18}ms`,
                              }}
                            />
                          </div>
                        );
                      })}
                      <span
                        data-bt-peak
                        aria-hidden="true"
                        className="absolute bottom-full z-10 mb-2 -translate-x-1/2 -rotate-3 rounded-[min(var(--iu-radius),3px)] border-2 border-(--iu-foreground) bg-(--iu-surface) px-1.5 py-0.5 font-mono text-[11px] font-bold whitespace-nowrap tabular-nums shadow-[2px_2px_0_var(--bt-ink)]"
                        style={{
                          left: `clamp(48px, ${((peakIndex + 0.5) / (days || 1)) * 100}%, calc(100% - 48px))`,
                          bottom: `calc(${(peakValue / scaleMax) * 100}% + 8px)`,
                        }}
                      >
                        Peak {number(peakValue)}
                      </span>
                    </div>
                  </div>
                  <figcaption className="mt-2 ml-10 flex gap-1 @2xl:gap-2" aria-hidden="true">
                    {totals.map((_, day) => (
                      <span
                        key={day}
                        className={cx(
                          "flex-1 text-center font-mono text-[10px] font-bold tabular-nums @2xl:text-[11px]",
                          day === peakIndex ? "text-(--iu-foreground)" : "text-(--iu-muted)",
                        )}
                      >
                        {dayLabel(startDate, day, { day: "numeric" })}
                      </span>
                    ))}
                  </figcaption>
                </figure>
              )}
            </section>

            <div className="grid min-w-0 content-start gap-6 @3xl:grid-cols-2 @5xl:col-span-4 @5xl:grid-cols-1">
              {/* Sources: each row isolates its share of the bars. */}
              <section aria-labelledby={`${uid}-sources`} className={cx(BOX, "p-[calc(16px*var(--iu-density))]")}>
                <h2 id={`${uid}-sources`} className={cx(LABEL, "text-(--iu-muted)")}>
                  Sources · press to isolate
                </h2>
                {ready ? (
                  <ul className="mt-3 flex flex-col gap-2">
                    {sources.map((source) => {
                      const total = source.daily.reduce((sum, value) => sum + value, 0);
                      const pressed = source.id === sourceId;
                      return (
                        <li key={source.id}>
                          <button
                            type="button"
                            data-bt-source={source.id}
                            aria-pressed={pressed}
                            onClick={() => pick(source.id)}
                            className={cx(
                              "relative flex h-11 w-full items-center gap-3 overflow-hidden rounded-[min(var(--iu-radius),4px)] border-2 border-(--iu-foreground) px-3 text-left text-sm font-bold transition-[translate,box-shadow,background-color] duration-100 ease-linear motion-reduce:transition-none",
                              pressed
                                ? "translate-x-[3px] translate-y-[3px] bg-(--iu-accent) text-(--iu-accent-foreground) shadow-none"
                                : "bg-(--iu-surface) shadow-[3px_3px_0_var(--bt-ink)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none",
                              FOCUS,
                            )}
                          >
                            <span
                              aria-hidden="true"
                              className={cx(
                                "absolute inset-y-0 left-0 transition-opacity duration-100 motion-reduce:transition-none",
                                pressed ? "opacity-0" : "bg-(--iu-foreground)/10",
                              )}
                              style={{ width: `${(total / (grandTotal || 1)) * 100}%` }}
                            />
                            <span className="relative flex-1 truncate uppercase">{source.label}</span>
                            <span className="relative font-mono text-xs tabular-nums">{number(total)}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : loading ? (
                  <ul aria-hidden="true" className="mt-3 flex flex-col gap-2">
                    {[0, 1, 2, 3, 4].map((row) => (
                      <li key={row}>
                        <Block className="h-11 w-full" />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 font-mono text-xs text-(--iu-muted)">
                    {failed ? "Sources load with the chart." : "Sources appear after the first visit."}
                  </p>
                )}
                <p data-bt-live aria-live="polite" className="sr-only">
                  {ready ? (active ? `Showing ${active.label} only` : "Showing all sources") : ""}
                </p>
              </section>

              {/* Top pages */}
              <section aria-labelledby={`${uid}-pages`} className={cx(BOX, "p-[calc(16px*var(--iu-density))]")}>
                <h2 id={`${uid}-pages`} className={cx(LABEL, "text-(--iu-muted)")}>
                  Top pages
                </h2>
                {ready ? (
                  <table className="mt-2 w-full table-fixed text-left text-sm">
                    <caption className="sr-only">Top pages by visitors</caption>
                    <colgroup>
                      <col />
                      <col className="w-20" />
                    </colgroup>
                    <tbody>
                      {pages.map((page) => (
                        <tr key={page.path} className="border-b-2 border-(--iu-foreground)/15 last:border-b-0">
                          <td className="py-[calc(8px*var(--iu-density))] pr-3">
                            <span className="block truncate font-mono text-[13px] font-semibold">{page.path}</span>
                            <span aria-hidden="true" className="mt-1.5 block h-2 border-2 border-(--iu-foreground)">
                              <span
                                className="block h-full bg-(--iu-foreground)"
                                style={{ width: `${(page.visitors / maxPage) * 100}%` }}
                              />
                            </span>
                          </td>
                          <td className="py-[calc(8px*var(--iu-density))] text-right align-top font-mono text-[13px] font-bold tabular-nums">
                            {number(page.visitors)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : loading ? (
                  <div aria-hidden="true" className="mt-3 flex flex-col gap-4">
                    {[0, 1, 2, 3].map((row) => (
                      <Block key={row} className="h-6 w-full" />
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 font-mono text-xs text-(--iu-muted)">
                    {failed ? "Pages load with the chart." : "Your busiest pages land here."}
                  </p>
                )}
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default BigtopAnalyticsShell;
