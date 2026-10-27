"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type MouseEvent, type PointerEvent } from "react";
import {
  ArrowDownToLine,
  BookOpen,
  ChevronsLeft,
  ChevronsRight,
  FileText,
  LayoutGrid,
  Link2,
  Menu,
  ScrollText,
  Settings,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";

export type AldermoorAssetClass = {
  id: string;
  label: string;
  /** Target weight in percent. */
  target: number;
  /** Market value at the end of each week, oldest first. Every class needs the same number of points. */
  values: number[];
};

export type AldermoorActivity = { id: string; date: string; title: string; detail: string; amount: number };

export type AldermoorNavItem = { id: string; label: string; icon: LucideIcon; href: string };

export type AldermoorWealthDashboardProps = {
  firm?: string;
  client?: string;
  breadcrumbs?: string[];
  navigation?: AldermoorNavItem[];
  currentNavId?: string;
  advisor?: { name: string; role: string };
  /** ISO date of the first weekly point. */
  startDate?: string;
  assetClasses?: AldermoorAssetClass[];
  activity?: AldermoorActivity[];
  nextReview?: string;
  currency?: string;
  status?: "ready" | "loading" | "empty";
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  onNavigate?: (item: AldermoorNavItem, event: MouseEvent<HTMLAnchorElement>) => void;
  onDownloadStatement?: () => void;
  onLinkAccount?: () => void;
  onScrub?: (date: string, total: number) => void;
  className?: string;
};

const DEFAULT_CLASSES: AldermoorAssetClass[] = [
  {
    id: "equities",
    label: "Public equities",
    target: 45,
    values: [
      18400000, 18249210, 18465940, 18497440, 18494000, 18627000, 18524070, 18412110, 18484070, 18520920, 18417560,
      18309920, 18192140, 18258620, 18376820, 18252000, 18262670, 18358460, 18347810, 18337230, 18485430, 18400600,
      17827090, 17384820, 16882900, 16346950, 16651480, 16900200, 17188330, 17478830, 17776850, 17685330, 17594830,
      17644370, 17681710, 17712720, 17698380, 17800730, 18032750, 17986750, 17853880, 18009370, 18211670, 18416890,
      18482020, 18494660, 18361900, 18441430, 18359790, 18442700, 18680390, 18714580,
    ],
  },
  {
    id: "fixed-income",
    label: "Fixed income",
    target: 25,
    values: [
      9120000, 9132580, 9135790, 9139900, 9150170, 9149830, 9148690, 9146450, 9150780, 9152570, 9167460, 9181970,
      9197720, 9200590, 9216030, 9219890, 9219500, 9224130, 9231400, 9246370, 9255060, 9261890, 9276130, 9285990,
      9287910, 9303650, 9303350, 9315100, 9330890, 9334630, 9341350, 9348740, 9347070, 9351510, 9354560, 9353800,
      9351580, 9357850, 9358870, 9363090, 9379180, 9391140, 9392160, 9392490, 9407990, 9420880, 9429490, 9433340,
      9439620, 9442350, 9449420, 9460390,
    ],
  },
  {
    id: "private",
    label: "Private markets",
    target: 22,
    values: [
      7800000, 7800000, 7800000, 7800000, 7800000, 7800000, 7800000, 7800000, 7800000, 7800000, 7800000, 7800000,
      7800000, 8041800, 8041800, 8041800, 8041800, 8041800, 8491800, 8491800, 8491800, 8491800, 8491800, 8491800,
      8491800, 8491800, 8755050, 8755050, 8755050, 8755050, 8755050, 8755050, 8755050, 8755050, 8755050, 8755050,
      8755050, 8755050, 8755050, 9026450, 9406450, 9406450, 9406450, 9406450, 9406450, 9406450, 9406450, 9406450,
      9406450, 9406450, 9406450, 9406450,
    ],
  },
  {
    id: "cash",
    label: "Cash and equivalents",
    target: 8,
    values: [
      2210000, 2211770, 2213540, 2215310, 2238080, 2239870, 2241660, 2243460, 2266250, 2268060, 2269880, 2271690,
      2294510, 2296350, 2298180, 2300020, 2322860, 2324720, 1876580, 1878080, 1900580, 1902110, 1903630, 1905150,
      1927670, 1929220, 1930760, 1932300, 1954850, 1956410, 1957980, 1959550, 1982110, 1983700, 1985290, 1986870,
      2009460, 2011070, 2012680, 2014290, 1656900, 1658230, 1659550, 1660880, 1683210, 1684560, 1685900, 1687250,
      1709600, 1710970, 1712340, 1713710,
    ],
  },
];

const DEFAULT_ACTIVITY: AldermoorActivity[] = [
  { id: "a1", date: "2026-10-21", title: "Dividend received", detail: "Public equities", amount: 48120 },
  { id: "a2", date: "2026-08-06", title: "Capital call", detail: "Larchmont Growth Fund IV", amount: -380000 },
  { id: "a3", date: "2026-08-02", title: "Valuation mark", detail: "Private markets, Q2", amount: 271400 },
  { id: "a4", date: "2026-03-05", title: "Capital call", detail: "Halvard Infrastructure II", amount: -450000 },
];

const DEFAULT_NAV: AldermoorNavItem[] = [
  { id: "overview", label: "Overview", icon: LayoutGrid, href: "#overview" },
  { id: "holdings", label: "Holdings", icon: Wallet, href: "#holdings" },
  { id: "activity", label: "Activity", icon: ScrollText, href: "#activity" },
  { id: "documents", label: "Documents", icon: FileText, href: "#documents" },
  { id: "reports", label: "Reports", icon: BookOpen, href: "#reports" },
  { id: "settings", label: "Settings", icon: Settings, href: "#settings" },
];

// Weights of ink for the four allocation segments, from the largest holding down.
const SHADES = [
  "bg-(--iu-foreground)",
  "bg-(--iu-foreground)/60",
  "bg-(--iu-foreground)/35",
  "bg-(--iu-foreground)/15",
];
const FOCUS = "focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-(--iu-accent)";
const KICKER = "text-[11px] font-medium tracking-[0.2em] uppercase";

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function dateAt(iso: string, weeks: number) {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + weeks * 7);
  return date;
}

function longDate(date: Date) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(
    date,
  );
}

function shortDate(iso: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${iso}T00:00:00Z`),
  );
}

export function AldermoorWealthDashboard({
  firm = "Aldermoor",
  client = "Ishikawa Family Trust",
  breadcrumbs = ["Clients", "Ishikawa Family Trust", "Overview"],
  navigation = DEFAULT_NAV,
  currentNavId = "overview",
  advisor = { name: "Elena Marchetti", role: "Senior partner" },
  startDate = "2025-11-02",
  assetClasses = DEFAULT_CLASSES,
  activity = DEFAULT_ACTIVITY,
  nextReview = "Thursday 12 November, 10:00",
  currency = "USD",
  status = "ready",
  defaultCollapsed = false,
  onCollapsedChange,
  onNavigate,
  onDownloadStatement,
  onLinkAccount,
  onScrub,
  className = "",
}: AldermoorWealthDashboardProps) {
  const uid = `am${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrubIndex, setScrubIndex] = useState<number | null>(null);
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

  const money = (value: number, signed = false) => {
    const text = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(Math.abs(value));
    if (!signed) return value < 0 ? `−${text}` : text;
    return `${value < 0 ? "−" : "+"}${text}`;
  };

  const loading = status === "loading";
  const empty = status === "empty";
  const ready = status === "ready";
  const weeks = assetClasses[0]?.values.length ?? 0;
  const totals = Array.from({ length: weeks }, (_, week) =>
    assetClasses.reduce((sum, asset) => sum + (asset.values[week] ?? 0), 0),
  );
  const last = Math.max(weeks - 1, 0);
  const index = scrubIndex ?? last;
  const total = totals[index] ?? 0;
  const opening = totals[0] ?? 0;
  const change = total - opening;
  const changePct = opening ? (change / opening) * 100 : 0;
  const atDate = dateAt(startDate, index);
  const scrubbing = scrubIndex !== null && scrubIndex !== last;

  const lo = Math.floor((Math.min(...totals) * 0.99) / 1_000_000) * 1_000_000;
  const hi = Math.ceil((Math.max(...totals) * 1.005) / 1_000_000) * 1_000_000;
  const y = (value: number) => (1 - (value - lo) / (hi - lo || 1)) * 100;
  const x = (week: number) => (week / (last || 1)) * 100;
  const line = totals
    .map((value, week) => `${week === 0 ? "M" : "L"}${x(week).toFixed(2)},${y(value).toFixed(2)}`)
    .join(" ");
  const gridValues = [lo, (lo + hi) / 2, hi];
  const months = totals
    .map((_, week) => ({ week, date: dateAt(startDate, week) }))
    .filter(({ week, date }) => week === 0 || date.getUTCMonth() !== dateAt(startDate, week - 1).getUTCMonth());

  const allocation = assetClasses
    .map((asset) => ({ ...asset, value: asset.values[index] ?? 0 }))
    .map((asset) => ({ ...asset, weight: total ? (asset.value / total) * 100 : 0 }));

  const scrubTo = (next: number | null) => {
    const clamped = next === null ? null : Math.max(0, Math.min(last, next));
    setScrubIndex(clamped);
    if (clamped !== null) onScrub?.(dateAt(startDate, clamped).toISOString().slice(0, 10), totals[clamped] ?? 0);
  };

  const fromPointer = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / (rect.width || 1);
    scrubTo(Math.round(ratio * last));
  };

  const onChartKey = (event: KeyboardEvent<HTMLDivElement>) => {
    const moves: Record<string, number | null> = {
      ArrowLeft: index - 1,
      ArrowDown: index - 1,
      ArrowRight: index + 1,
      ArrowUp: index + 1,
      PageDown: index - 4,
      PageUp: index + 4,
      Home: 0,
      End: last,
      Escape: null,
    };
    if (!(event.key in moves)) return;
    event.preventDefault();
    scrubTo(moves[event.key] ?? null);
  };

  const toggleSidebar = () => {
    const next = !collapsed;
    setCollapsed(next);
    onCollapsedChange?.(next);
  };

  const navigate: AldermoorWealthDashboardProps["onNavigate"] = (item, event) => {
    setMenuOpen(false);
    onNavigate?.(item, event);
  };

  const navList = (collapsible: boolean) => (
    <ul className="flex flex-col gap-1">
      {navigation.map((item) => {
        const current = item.id === currentNavId;
        const Icon = item.icon;
        return (
          <li key={item.id}>
            <a
              href={item.href}
              aria-current={current ? "page" : undefined}
              onClick={(event) => navigate(item, event)}
              className={cx(
                "group/link relative flex h-11 items-center gap-4 pr-3 pl-5 transition-colors duration-300 motion-reduce:transition-none",
                KICKER,
                current ? "text-(--iu-foreground)" : "text-(--iu-muted) pointer-fine:hover:text-(--iu-foreground)",
                FOCUS,
              )}
            >
              <span
                aria-hidden="true"
                className={cx(
                  "absolute top-1/2 left-0 h-5 w-px -translate-y-1/2 transition-colors duration-300 motion-reduce:transition-none",
                  current ? "bg-(--iu-accent)" : "bg-transparent",
                )}
              />
              <Icon size={16} strokeWidth={1.25} aria-hidden="true" className="shrink-0" />
              <span className={cx("truncate", collapsible && "group-data-[collapsed=true]/side:sr-only")}>
                {item.label}
              </span>
              {collapsible ? (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 left-full z-10 ml-3 hidden -translate-y-1/2 border border-(--iu-border) bg-(--iu-surface) px-3 py-1.5 text-[11px] tracking-[0.2em] whitespace-nowrap text-(--iu-foreground) opacity-0 transition-opacity duration-300 group-focus-visible/link:opacity-100 group-data-[collapsed=true]/side:block motion-reduce:transition-none pointer-fine:group-hover/link:opacity-100"
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

  return (
    <div
      data-aldermoor-dashboard
      className={cx(
        "flex min-h-dvh flex-col bg-(--iu-background) font-(family-name:--iu-font) text-(--iu-foreground) lg:flex-row",
        className,
      )}
    >
      {/* Sidebar: a quiet column that folds to a rail of icons. */}
      <div
        data-am-side
        data-collapsed={collapsed ? "true" : "false"}
        className="group/side hidden w-64 shrink-0 border-r border-(--iu-border) bg-(--iu-surface) transition-[width] duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] data-[collapsed=true]:w-[72px] motion-reduce:transition-none lg:block"
      >
        <div className="sticky top-0 flex h-dvh flex-col py-8">
          <div className="flex items-start justify-between gap-2 px-5 pb-12 group-data-[collapsed=true]/side:flex-col group-data-[collapsed=true]/side:items-center group-data-[collapsed=true]/side:px-0">
            <span className="group-data-[collapsed=true]/side:sr-only">
              <span className="block font-serif text-2xl leading-none">{firm}</span>
              <span className={cx("mt-2 block text-(--iu-muted)", KICKER, "text-[10px]")}>Private office</span>
            </span>
            <span
              aria-hidden="true"
              className="hidden size-9 items-center justify-center rounded-full border border-(--iu-foreground)/40 font-serif text-lg group-data-[collapsed=true]/side:inline-flex"
            >
              {firm.charAt(0)}
            </span>
            <button
              type="button"
              data-am-toggle
              onClick={toggleSidebar}
              aria-expanded={!collapsed}
              aria-controls={`${uid}-nav`}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className={cx(
                "inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-(--iu-foreground)/30 text-(--iu-muted) transition-colors duration-300 motion-reduce:transition-none pointer-fine:hover:text-(--iu-foreground)",
                FOCUS,
              )}
            >
              {collapsed ? (
                <ChevronsRight size={16} strokeWidth={1.25} aria-hidden="true" />
              ) : (
                <ChevronsLeft size={16} strokeWidth={1.25} aria-hidden="true" />
              )}
            </button>
          </div>
          <nav id={`${uid}-nav`} aria-label="Main" className="flex-1">
            {navList(true)}
          </nav>
          <div className="mx-5 border-t border-(--iu-border) pt-5 group-data-[collapsed=true]/side:mx-0 group-data-[collapsed=true]/side:flex group-data-[collapsed=true]/side:justify-center">
            <span
              aria-hidden="true"
              className="hidden size-9 items-center justify-center rounded-full border border-(--iu-border) text-[11px] tracking-[0.1em] group-data-[collapsed=true]/side:inline-flex"
            >
              {advisor.name
                .split(" ")
                .map((part) => part[0])
                .join("")}
            </span>
            <p className="group-data-[collapsed=true]/side:sr-only">
              <span className={cx("block text-(--iu-muted)", KICKER, "text-[10px]")}>Your advisor</span>
              <span className="mt-2 block text-sm">{advisor.name}</span>
              <span className="block text-xs text-(--iu-muted)">{advisor.role}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Small screens: a slim top bar and a full-height drawer. */}
      <div className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-4 border-b border-(--iu-border) bg-(--iu-surface) px-4 lg:hidden">
        <button
          ref={menuButtonRef}
          data-am-menu
          type="button"
          aria-label="Open navigation"
          aria-haspopup="dialog"
          aria-expanded={menuOpen}
          aria-controls={`${uid}-drawer`}
          onClick={() => setMenuOpen(true)}
          className={cx(
            "inline-flex size-10 items-center justify-center rounded-full border border-(--iu-foreground)/30",
            FOCUS,
          )}
        >
          <Menu size={16} strokeWidth={1.25} aria-hidden="true" />
        </button>
        <span className="font-serif text-xl leading-none">{firm}</span>
        <span className={cx("ml-auto truncate text-(--iu-muted)", KICKER, "text-[10px]")}>Private office</span>
      </div>

      <dialog
        ref={dialogRef}
        data-am-drawer
        id={`${uid}-drawer`}
        aria-label="Navigation"
        onClose={() => {
          setMenuOpen(false);
          menuButtonRef.current?.focus();
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) setMenuOpen(false);
        }}
        className="fixed inset-y-0 right-auto left-0 m-0 h-dvh max-h-none w-80 max-w-[calc(100vw-3rem)] border-r border-(--iu-border) bg-(--iu-surface) p-0 text-(--iu-foreground) opacity-0 transition-[opacity,display,overlay] transition-discrete duration-300 backdrop:bg-black/50 open:opacity-100 motion-reduce:transition-none lg:hidden dark:backdrop:bg-black/70 starting:open:opacity-0"
      >
        <div className="flex h-full flex-col py-6 font-(family-name:--iu-font)">
          <div className="flex items-start justify-between px-5 pb-10">
            <span>
              <span className="block font-serif text-2xl leading-none">{firm}</span>
              <span className={cx("mt-2 block text-(--iu-muted)", KICKER, "text-[10px]")}>Private office</span>
            </span>
            <button
              type="button"
              data-am-close
              aria-label="Close navigation"
              onClick={() => setMenuOpen(false)}
              className={cx(
                "inline-flex size-10 items-center justify-center rounded-full border border-(--iu-foreground)/30",
                FOCUS,
              )}
            >
              <X size={16} strokeWidth={1.25} aria-hidden="true" />
            </button>
          </div>
          <nav aria-label="Main">{navList(false)}</nav>
        </div>
      </dialog>

      <main
        aria-busy={loading || undefined}
        className="@container min-w-0 flex-1 px-5 pt-8 pb-16 sm:px-8 lg:px-12 lg:pt-10"
      >
        <div className="mx-auto max-w-[1160px]">
          <div className="flex flex-col gap-6 @2xl:flex-row @2xl:items-center @2xl:justify-between">
            <nav aria-label="Breadcrumb">
              <ol className={cx("flex flex-wrap items-center gap-x-3 gap-y-1 text-(--iu-muted)", KICKER)}>
                {breadcrumbs.map((crumb, position) => {
                  const final = position === breadcrumbs.length - 1;
                  return (
                    <li key={crumb} className="flex items-center gap-3">
                      {final ? (
                        <span aria-current="page" className="text-(--iu-foreground)">
                          {crumb}
                        </span>
                      ) : (
                        <>
                          <a
                            href={`#${crumb.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                            className={cx(
                              "transition-colors duration-300 motion-reduce:transition-none pointer-fine:hover:text-(--iu-foreground)",
                              FOCUS,
                            )}
                          >
                            {crumb}
                          </a>
                          <span aria-hidden="true" className="h-px w-4 bg-(--iu-foreground)/30" />
                        </>
                      )}
                    </li>
                  );
                })}
              </ol>
            </nav>
            <button
              type="button"
              onClick={onDownloadStatement}
              disabled={!ready}
              className={cx(
                "inline-flex h-10 items-center gap-3 self-start rounded-full border border-(--iu-foreground)/40 px-5 text-[11px] font-medium tracking-[0.2em] uppercase transition-colors duration-300 disabled:cursor-not-allowed disabled:border-(--iu-foreground)/15 disabled:text-(--iu-muted) motion-reduce:transition-none @2xl:self-auto pointer-fine:hover:border-(--iu-foreground)",
                FOCUS,
              )}
            >
              <ArrowDownToLine size={14} strokeWidth={1.25} aria-hidden="true" />
              October statement
            </button>
          </div>

          {/* Net worth: the subject of the page. */}
          <section aria-labelledby={`${uid}-worth`} className="mt-14 @3xl:mt-20">
            <h1 id={`${uid}-worth`} className={cx("text-(--iu-muted)", KICKER)}>
              {client} · Net worth
              {ready ? (
                <span className="text-(--iu-foreground)">
                  {" "}
                  · <span data-am-date>{longDate(atDate)}</span>
                </span>
              ) : null}
            </h1>
            {loading ? (
              <div aria-hidden="true">
                <span className="mt-6 block h-16 w-3/4 max-w-[560px] bg-(--iu-foreground)/6 @3xl:h-24" />
                <span className="mt-5 block h-4 w-64 bg-(--iu-foreground)/6" />
              </div>
            ) : empty ? (
              <div className="mt-6 max-w-[40ch]">
                <p className="font-serif text-[44px] leading-[1.05] tracking-[-0.01em] text-balance @3xl:text-[64px]">
                  Your accounts, gathered in one quiet place.
                </p>
                <p className="mt-6 text-base leading-relaxed text-pretty text-(--iu-muted)">
                  Link the custodians that hold the trust&apos;s assets. Positions arrive overnight and your first
                  statement follows at month end.
                </p>
                <button
                  type="button"
                  onClick={onLinkAccount}
                  className={cx(
                    "mt-8 inline-flex h-12 items-center gap-3 rounded-full bg-(--iu-foreground) px-7 text-[11px] font-medium tracking-[0.2em] text-(--iu-background) uppercase transition-opacity duration-300 motion-reduce:transition-none pointer-fine:hover:opacity-90",
                    FOCUS,
                  )}
                >
                  <Link2 size={14} strokeWidth={1.25} aria-hidden="true" />
                  Link a custodian
                </button>
              </div>
            ) : (
              <>
                <p
                  data-am-total
                  className="mt-5 font-serif text-[clamp(2.75rem,1.4rem+5.6vw,6rem)] leading-none tracking-[-0.02em] tabular-nums"
                >
                  {money(total)}
                </p>
                <p className="mt-5 text-sm text-(--iu-muted) tabular-nums">
                  <span data-am-change className="text-(--iu-foreground)">
                    {index === 0
                      ? "Opening value"
                      : `${money(change, true)} · ${change >= 0 ? "+" : "−"}${Math.abs(changePct).toFixed(2)}%`}
                  </span>{" "}
                  <span data-am-since>
                    {index === 0 ? "for the period" : `since ${longDate(dateAt(startDate, 0))}`}
                  </span>
                </p>
              </>
            )}
          </section>

          {/* The hairline chart: scrub with a pointer, or focus it and use the arrow keys. */}
          <section aria-label="Net worth, last twelve months" className="mt-12">
            {loading ? (
              <span
                aria-hidden="true"
                className="block h-64 border-b border-(--iu-border) bg-(--iu-foreground)/4 @3xl:h-80"
              />
            ) : empty ? (
              <div aria-hidden="true" className="relative h-40 @3xl:h-56">
                <span className="absolute inset-x-0 top-1/2 border-t border-dashed border-(--iu-foreground)/25" />
              </div>
            ) : (
              <div className="flex gap-4">
                <div className="relative min-w-0 flex-1">
                  {gridValues.map((value) => (
                    <span
                      key={value}
                      aria-hidden="true"
                      className="absolute inset-x-0 border-t border-(--iu-border)"
                      style={{ top: `${y(value)}%` }}
                    />
                  ))}
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 border-t border-dotted border-(--iu-foreground)/40"
                    style={{ top: `${y(opening)}%` }}
                  />
                  <div
                    data-am-chart
                    role="slider"
                    tabIndex={0}
                    aria-label="Net worth by week"
                    aria-valuemin={0}
                    aria-valuemax={last}
                    aria-valuenow={index}
                    aria-valuetext={`${longDate(atDate)}: ${money(total)}`}
                    onPointerMove={fromPointer}
                    onPointerDown={fromPointer}
                    onPointerLeave={(event) => {
                      if (event.pointerType === "mouse") scrubTo(null);
                    }}
                    onKeyDown={onChartKey}
                    onBlur={() => scrubTo(null)}
                    className={cx("relative h-64 cursor-crosshair touch-pan-y @3xl:h-80", FOCUS)}
                  >
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 100 100"
                      preserveAspectRatio="none"
                      className="size-full overflow-visible"
                    >
                      <path
                        d={line}
                        fill="none"
                        vectorEffect="non-scaling-stroke"
                        strokeWidth="1.25"
                        strokeLinejoin="round"
                        className="stroke-(--iu-foreground)"
                      />
                    </svg>
                    <span
                      data-am-cross
                      aria-hidden="true"
                      className={cx(
                        "pointer-events-none absolute inset-y-0 w-px bg-(--iu-accent) transition-opacity duration-300 motion-reduce:transition-none",
                        scrubbing ? "opacity-100" : "opacity-0",
                      )}
                      style={{ left: `${x(index)}%` }}
                    />
                    <span
                      data-am-dot
                      aria-hidden="true"
                      className="pointer-events-none absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-(--iu-background) bg-(--iu-accent)"
                      style={{ left: `${x(index)}%`, top: `${y(total)}%` }}
                    />
                  </div>
                  <div aria-hidden="true" className="mt-4 flex justify-between">
                    {months.map(({ week, date }, position) => (
                      <span
                        key={week}
                        className={cx(
                          "text-[10px] tracking-[0.2em] text-(--iu-muted) uppercase",
                          position % 2 === 1 && "hidden @2xl:inline",
                        )}
                      >
                        {new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: "UTC" }).format(date)}
                      </span>
                    ))}
                  </div>
                </div>
                <div aria-hidden="true" className="relative h-64 w-12 shrink-0 @3xl:h-80">
                  {gridValues.map((value) => (
                    <span
                      key={value}
                      className="absolute right-0 -translate-y-1/2 text-[11px] text-(--iu-muted) tabular-nums"
                      style={{ top: `${y(value)}%` }}
                    >
                      ${Number.isInteger(value / 1_000_000) ? value / 1_000_000 : (value / 1_000_000).toFixed(1)}M
                    </span>
                  ))}
                </div>
              </div>
            )}
            {ready ? (
              <p className="mt-6 text-xs text-(--iu-muted)">
                Dotted line: value on {longDate(dateAt(startDate, 0))}. Move across the chart, or focus it and use the
                arrow keys, to read any week.
              </p>
            ) : null}
          </section>

          <div className="mt-16 grid gap-14 @4xl:grid-cols-12 @4xl:gap-12">
            {/* Allocation for the week on screen. */}
            <section aria-labelledby={`${uid}-alloc`} className="@4xl:col-span-7">
              <div className="flex items-baseline justify-between gap-4 border-b border-(--iu-foreground)/60 pb-4">
                <h2 id={`${uid}-alloc`} className={KICKER}>
                  Allocation
                </h2>
                <span className={cx("text-(--iu-muted)", KICKER, "text-[10px]")}>
                  {ready ? (
                    <>
                      As of <span data-am-asof>{shortDate(atDate.toISOString().slice(0, 10))}</span>
                    </>
                  ) : (
                    "Weight and target"
                  )}
                </span>
              </div>
              {ready ? (
                <>
                  <div aria-hidden="true" className="mt-6 flex h-1.5 gap-0.5">
                    {allocation.map((asset, position) => (
                      <span
                        key={asset.id}
                        data-am-seg
                        className={cx(
                          "block h-full transition-[width] duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none",
                          SHADES[position] ?? SHADES[3],
                        )}
                        style={{ width: `${asset.weight}%` }}
                      />
                    ))}
                  </div>
                  <table className="mt-4 w-full text-left text-sm">
                    <caption className="sr-only">Allocation on {longDate(atDate)}</caption>
                    <thead>
                      <tr className={cx("text-(--iu-muted)", KICKER, "text-[10px]")}>
                        <th scope="col" className="py-3 font-medium">
                          Asset class
                        </th>
                        <th scope="col" className="py-3 text-right font-medium">
                          Value
                        </th>
                        <th scope="col" className="py-3 pl-4 text-right font-medium">
                          Weight
                        </th>
                        <th scope="col" className="hidden py-3 pl-4 text-right font-medium @lg:table-cell">
                          Target
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {allocation.map((asset, position) => {
                        const drift = asset.weight - asset.target;
                        return (
                          <tr key={asset.id} data-am-row={asset.id} className="border-t border-(--iu-border)">
                            <th scope="row" className="py-[calc(14px*var(--iu-density))] pr-3 font-normal">
                              <span className="flex items-center gap-3">
                                <span
                                  aria-hidden="true"
                                  className={cx("size-2 shrink-0 rounded-full", SHADES[position] ?? SHADES[3])}
                                />
                                {asset.label}
                              </span>
                            </th>
                            <td data-am-value className="py-[calc(14px*var(--iu-density))] text-right tabular-nums">
                              {money(asset.value)}
                            </td>
                            <td className="py-[calc(14px*var(--iu-density))] pl-4 text-right tabular-nums">
                              <span data-am-weight>{asset.weight.toFixed(1)}%</span>
                              <span data-am-drift className="block text-xs text-(--iu-muted)">
                                {drift >= 0 ? "+" : "−"}
                                {Math.abs(drift).toFixed(1)} vs target
                              </span>
                            </td>
                            <td className="hidden py-[calc(14px*var(--iu-density))] pl-4 text-right text-(--iu-muted) tabular-nums @lg:table-cell">
                              {asset.target}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </>
              ) : loading ? (
                <div aria-hidden="true" className="mt-6 flex flex-col gap-5">
                  <span className="block h-1.5 bg-(--iu-foreground)/6" />
                  {[0, 1, 2, 3].map((row) => (
                    <span key={row} className="block h-5 bg-(--iu-foreground)/6" />
                  ))}
                </div>
              ) : (
                <p className="mt-6 text-sm text-pretty text-(--iu-muted)">
                  Your allocation and its targets appear once positions arrive.
                </p>
              )}
            </section>

            {/* Activity and the next review */}
            <section aria-labelledby={`${uid}-activity`} className="@4xl:col-span-5">
              <div className="border-b border-(--iu-foreground)/60 pb-4">
                <h2 id={`${uid}-activity`} className={KICKER}>
                  Recent activity
                </h2>
              </div>
              {ready ? (
                <ol className="mt-2">
                  {activity.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-baseline gap-4 border-b border-(--iu-border) py-[calc(14px*var(--iu-density))]"
                    >
                      <span className="w-24 shrink-0 text-xs text-(--iu-muted) tabular-nums">
                        {shortDate(item.date)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm">{item.title}</span>
                        <span className="block truncate text-xs text-(--iu-muted)">{item.detail}</span>
                      </span>
                      <span className="text-sm whitespace-nowrap tabular-nums">{money(item.amount, true)}</span>
                    </li>
                  ))}
                </ol>
              ) : loading ? (
                <div aria-hidden="true" className="mt-6 flex flex-col gap-5">
                  {[0, 1, 2, 3].map((row) => (
                    <span key={row} className="block h-5 bg-(--iu-foreground)/6" />
                  ))}
                </div>
              ) : (
                <p className="mt-6 text-sm text-pretty text-(--iu-muted)">
                  Dividends, capital calls and transfers are recorded here.
                </p>
              )}
              <div className="mt-10 rounded-[min(var(--iu-radius),2px)] border border-(--iu-border) p-[calc(20px*var(--iu-density))]">
                <p className={cx("text-(--iu-muted)", KICKER, "text-[10px]")}>Next review</p>
                <p className="mt-3 font-serif text-2xl leading-tight">{nextReview}</p>
                <p className="mt-2 text-sm text-(--iu-muted)">
                  With {advisor.name}, {advisor.role.toLowerCase()}
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AldermoorWealthDashboard;
