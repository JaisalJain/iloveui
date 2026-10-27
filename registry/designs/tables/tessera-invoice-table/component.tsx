"use client";

import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import {
  AnimatePresence,
  MotionConfig,
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  CircleCheck,
  Clock,
  Download,
  FileText,
  Mail,
  Plus,
  RotateCw,
  Search,
  X,
} from "lucide-react";

export type TesseraInvoice = {
  id: string;
  customer: string;
  /** ISO dates (YYYY-MM-DD). */
  issued: string;
  due: string;
  /** Amounts in minor units (cents). */
  amount: number;
  paid: number;
  draft?: boolean;
};

export type TesseraStatus = "draft" | "open" | "overdue" | "paid";
export type TesseraSortKey = "id" | "customer" | "due" | "amount";
export type TesseraSort = { key: TesseraSortKey; direction: "asc" | "desc" };

export type TesseraInvoiceTableProps = {
  title?: string;
  invoices?: TesseraInvoice[];
  /** The date "overdue" and "due in" are measured against. */
  today?: string;
  currency?: string;
  locale?: string;
  pageSize?: number;
  defaultSort?: TesseraSort;
  defaultSelected?: string[];
  status?: "ready" | "loading" | "error";
  onCreateInvoice?: () => void;
  onOpenInvoice?: (id: string) => void;
  onSendReminders?: (ids: string[]) => void;
  onMarkPaid?: (ids: string[]) => void;
  onExport?: (ids: string[]) => void;
  onRetry?: () => void;
  className?: string;
};

const DEFAULT_INVOICES: TesseraInvoice[] = [
  {
    id: "TS-2504",
    customer: "Alder Robotics",
    issued: "2026-10-24",
    due: "2026-11-23",
    amount: 642750,
    paid: 0,
    draft: true,
  },
  { id: "TS-2503", customer: "Fieldnote Press", issued: "2026-10-22", due: "2026-11-21", amount: 128400, paid: 0 },
  { id: "TS-2502", customer: "Juniper Health", issued: "2026-10-20", due: "2026-11-19", amount: 1896000, paid: 948000 },
  { id: "TS-2501", customer: "Saltmarsh Coffee", issued: "2026-10-18", due: "2026-11-02", amount: 86520, paid: 86520 },
  { id: "TS-2499", customer: "Kestrel Freight", issued: "2026-09-14", due: "2026-10-14", amount: 561275, paid: 0 },
  { id: "TS-2498", customer: "Oakhaven Dental", issued: "2026-09-28", due: "2026-10-28", amount: 214900, paid: 0 },
  { id: "TS-2496", customer: "Marlow & Finch", issued: "2026-09-02", due: "2026-10-02", amount: 280975, paid: 0 },
  {
    id: "TS-2495",
    customer: "Copperline Studio",
    issued: "2026-10-01",
    due: "2026-10-31",
    amount: 395000,
    paid: 395000,
  },
  {
    id: "TS-2493",
    customer: "Norvale Logistics",
    issued: "2026-09-30",
    due: "2026-10-30",
    amount: 1172460,
    paid: 500000,
  },
  { id: "TS-2491", customer: "Lumen Analytics", issued: "2026-09-25", due: "2026-10-25", amount: 74900, paid: 74900 },
  { id: "TS-2490", customer: "Harbor & Vine", issued: "2026-09-20", due: "2026-10-20", amount: 312340, paid: 0 },
  { id: "TS-2488", customer: "Quarry Climbing", issued: "2026-09-18", due: "2026-10-18", amount: 49800, paid: 49800 },
  { id: "TS-2487", customer: "Pinecrest Realty", issued: "2026-09-15", due: "2026-11-14", amount: 758000, paid: 0 },
  { id: "TS-2485", customer: "Tamarind Foods", issued: "2026-09-10", due: "2026-10-10", amount: 166215, paid: 166215 },
  { id: "TS-2484", customer: "Vantage Rowing Club", issued: "2026-09-08", due: "2026-11-07", amount: 38400, paid: 0 },
  {
    id: "TS-2482",
    customer: "Brightwater Labs",
    issued: "2026-09-05",
    due: "2026-10-05",
    amount: 920000,
    paid: 920000,
  },
  {
    id: "TS-2481",
    customer: "Wrenfield Clinics",
    issued: "2026-09-03",
    due: "2026-10-03",
    amount: 433180,
    paid: 200000,
  },
  { id: "TS-2479", customer: "Ostra Seafood", issued: "2026-08-29", due: "2026-09-28", amount: 127560, paid: 127560 },
  { id: "TS-2478", customer: "Greyline Architects", issued: "2026-08-27", due: "2026-11-25", amount: 1540000, paid: 0 },
  { id: "TS-2476", customer: "Pollen Studio", issued: "2026-08-24", due: "2026-09-23", amount: 58240, paid: 58240 },
  { id: "TS-2475", customer: "Riverbend Vets", issued: "2026-08-20", due: "2026-10-19", amount: 96300, paid: 0 },
  {
    id: "TS-2473",
    customer: "Hollis Mercantile",
    issued: "2026-08-18",
    due: "2026-09-17",
    amount: 247815,
    paid: 247815,
  },
  { id: "TS-2471", customer: "Sundial Solar", issued: "2026-08-15", due: "2026-11-13", amount: 2084000, paid: 1042000 },
  { id: "TS-2470", customer: "Ember Bakehouse", issued: "2026-08-12", due: "2026-09-11", amount: 31275, paid: 31275 },
];

const FILTERS: { id: "all" | TesseraStatus; label: string }[] = [
  { id: "all", label: "All" },
  { id: "overdue", label: "Overdue" },
  { id: "open", label: "Open" },
  { id: "paid", label: "Paid" },
  { id: "draft", label: "Draft" },
];

const SORT_LABELS: Record<TesseraSortKey, string> = {
  id: "Invoice",
  customer: "Customer",
  due: "Due date",
  amount: "Amount",
};

const DAY = 86_400_000;

function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

function daysBetween(from: string, to: string) {
  return Math.round((Date.parse(to) - Date.parse(from)) / DAY);
}

export function invoiceStatus(invoice: TesseraInvoice, today: string): TesseraStatus {
  if (invoice.draft) return "draft";
  if (invoice.paid >= invoice.amount) return "paid";
  return daysBetween(invoice.due, today) > 0 ? "overdue" : "open";
}

function initials(name: string) {
  return name
    .replace(/&/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--iu-accent)";
const ghostButton = cx(
  "inline-flex h-8 items-center gap-1.5 rounded-[min(var(--iu-radius),6px)] px-2.5 text-[13px] font-medium text-(--iu-foreground) transition-colors duration-100 disabled:cursor-not-allowed disabled:text-(--iu-muted) motion-reduce:transition-none pointer-coarse:h-10 pointer-fine:hover:bg-(--iu-foreground)/6",
  focusRing,
);

function StatusBadge({ status, lateDays, dueIn }: { status: TesseraStatus; lateDays: number; dueIn: number }) {
  if (status === "paid") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[13px] whitespace-nowrap text-emerald-700 dark:text-emerald-400">
        <CircleCheck size={14} strokeWidth={1.75} aria-hidden="true" />
        Paid
      </span>
    );
  }
  if (status === "overdue") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[13px] whitespace-nowrap text-red-700 dark:text-red-400">
        <AlertTriangle size={14} strokeWidth={1.75} aria-hidden="true" />
        <span>
          Overdue <span className="font-mono text-[12px] tabular-nums">{lateDays}d</span>
        </span>
      </span>
    );
  }
  if (status === "draft") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[13px] whitespace-nowrap text-(--iu-muted)">
        <FileText size={14} strokeWidth={1.5} aria-hidden="true" />
        Draft
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-[13px] whitespace-nowrap text-(--iu-foreground)">
      <Clock size={14} strokeWidth={1.5} aria-hidden="true" className="text-(--iu-muted)" />
      <span>
        Open{" "}
        <span className="font-mono text-[12px] text-(--iu-muted) tabular-nums">
          {dueIn === 0 ? "today" : `${dueIn}d`}
        </span>
      </span>
    </span>
  );
}

function Monogram({ name }: { name: string }) {
  return (
    <span
      aria-hidden="true"
      className="inline-flex size-7 shrink-0 items-center justify-center rounded-[min(var(--iu-radius),6px)] border border-(--iu-border) bg-(--iu-background) font-mono text-[10px] font-medium text-(--iu-muted)"
    >
      {initials(name)}
    </span>
  );
}

/** A native checkbox with a 24px (40px on touch) hit area; supports the mixed state for "select page". */
function SelectBox({
  checked,
  indeterminate = false,
  label,
  onToggle,
}: {
  checked: boolean;
  indeterminate?: boolean;
  label: string;
  onToggle: (shiftKey: boolean) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);
  return (
    <label className="relative inline-flex size-6 cursor-pointer items-center justify-center pointer-coarse:size-10">
      <input
        ref={ref}
        type="checkbox"
        aria-label={label}
        checked={checked}
        onChange={() => undefined}
        onClick={(event) => onToggle(event.shiftKey)}
        className={cx("size-4 cursor-pointer accent-(--iu-accent)", focusRing)}
      />
    </label>
  );
}

/** The outstanding total of the selection, rolled to its new value in 140ms. */
function RollingAmount({ value, format }: { value: number; format: (minor: number) => string }) {
  const reduceMotion = useReducedMotion();
  const motionValue = useMotionValue(value);
  const text = useTransform(motionValue, (latest) => format(Math.round(latest)));
  useEffect(() => {
    const controls = animate(motionValue, value, { duration: reduceMotion ? 0 : 0.14, ease: "linear" });
    return () => controls.stop();
  }, [motionValue, reduceMotion, value]);
  return <motion.span className="font-mono tabular-nums">{text}</motion.span>;
}

/** A button whose label swaps to a confirmation without changing width: both labels share one grid cell. */
function ConfirmButton({
  icon,
  label,
  done,
  doneLabel,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  done: boolean;
  doneLabel: string;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className={ghostButton}>
      <span className="grid">
        <span
          className={cx(
            "col-start-1 row-start-1 inline-flex items-center gap-1.5 transition-opacity duration-100 motion-reduce:transition-none",
            done && "opacity-0",
          )}
        >
          {icon}
          <span className="sr-only @xl:not-sr-only">{label}</span>
        </span>
        <span
          aria-hidden={!done}
          className={cx(
            "col-start-1 row-start-1 inline-flex items-center gap-1.5 transition-opacity duration-100 motion-reduce:transition-none",
            !done && "opacity-0",
          )}
        >
          <Check size={16} strokeWidth={1.75} aria-hidden="true" />
          <span className="sr-only @xl:not-sr-only">{doneLabel}</span>
        </span>
      </span>
    </button>
  );
}

function SkeletonBar({ className }: { className: string }) {
  return <span aria-hidden="true" className={cx("block h-3 rounded-sm bg-(--iu-foreground)/8", className)} />;
}

const SKELETON_WIDTHS = ["w-28", "w-36", "w-24", "w-32", "w-40", "w-28", "w-24", "w-36"];

export function TesseraInvoiceTable({
  title = "Invoices",
  invoices = DEFAULT_INVOICES,
  today = "2026-10-27",
  currency = "USD",
  locale = "en-US",
  pageSize = 8,
  defaultSort = { key: "id", direction: "desc" },
  defaultSelected = [],
  status = "ready",
  onCreateInvoice,
  onOpenInvoice,
  onSendReminders,
  onMarkPaid,
  onExport,
  onRetry,
  className = "",
}: TesseraInvoiceTableProps) {
  const reduceMotion = useReducedMotion();
  const titleId = useId();
  const searchId = useId();
  const [rows, setRows] = useState(invoices);
  const [filter, setFilter] = useState<"all" | TesseraStatus>("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<TesseraSort>(defaultSort);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(() => new Set(defaultSelected));
  const [anchor, setAnchor] = useState<string | null>(null);
  const [flash, setFlash] = useState<Set<string>>(() => new Set());
  const [confirmed, setConfirmed] = useState<"remind" | "export" | null>(null);
  const [announcement, setAnnouncement] = useState("");

  // Adopt a new invoices prop (after a refetch) during render, the React-recommended way to reset derived state.
  const [source, setSource] = useState(invoices);
  if (source !== invoices) {
    setSource(invoices);
    setRows(invoices);
  }

  useEffect(() => {
    if (!confirmed) return;
    const timer = setTimeout(() => setConfirmed(null), 1600);
    return () => clearTimeout(timer);
  }, [confirmed]);

  useEffect(() => {
    if (flash.size === 0) return;
    const timer = setTimeout(() => setFlash(new Set()), 1200);
    return () => clearTimeout(timer);
  }, [flash]);

  const money = useMemo(() => new Intl.NumberFormat(locale, { style: "currency", currency }), [locale, currency]);
  const format = (minor: number) => money.format(minor / 100);
  const shortDate = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", timeZone: "UTC" }),
    [locale],
  );
  const formatDate = (iso: string) => shortDate.format(new Date(`${iso}T00:00:00Z`));

  const withStatus = useMemo(
    () => rows.map((invoice) => ({ invoice, status: invoiceStatus(invoice, today) })),
    [rows, today],
  );
  const counts = useMemo(() => {
    const result: Record<"all" | TesseraStatus, number> = { all: 0, draft: 0, open: 0, overdue: 0, paid: 0 };
    for (const row of withStatus) {
      result.all += 1;
      result[row.status] += 1;
    }
    return result;
  }, [withStatus]);
  const totals = useMemo(() => {
    let outstanding = 0;
    let overdue = 0;
    for (const { invoice, status: rowStatus } of withStatus) {
      if (rowStatus === "draft") continue;
      outstanding += invoice.amount - invoice.paid;
      if (rowStatus === "overdue") overdue += invoice.amount - invoice.paid;
    }
    return { outstanding, overdue };
  }, [withStatus]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = withStatus.filter(
      ({ invoice, status: rowStatus }) =>
        (filter === "all" || rowStatus === filter) &&
        (!needle || invoice.customer.toLowerCase().includes(needle) || invoice.id.toLowerCase().includes(needle)),
    );
    const factor = sort.direction === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const x = a.invoice;
      const y = b.invoice;
      if (sort.key === "amount") return (x.amount - y.amount) * factor;
      if (sort.key === "due") return (Date.parse(x.due) - Date.parse(y.due)) * factor;
      if (sort.key === "customer") return x.customer.localeCompare(y.customer) * factor;
      return x.id.localeCompare(y.id, undefined, { numeric: true }) * factor;
    });
  }, [withStatus, filter, query, sort]);

  const pageCount = Math.max(1, Math.ceil(visible.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageRows = visible.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const pageIds = pageRows.map((row) => row.invoice.id);
  const pageSelected = pageIds.filter((id) => selected.has(id)).length;

  const selectedRows = withStatus.filter((row) => selected.has(row.invoice.id));
  const selectedOutstanding = selectedRows.reduce(
    (sum, row) => sum + (row.status === "draft" ? 0 : row.invoice.amount - row.invoice.paid),
    0,
  );
  const unpaidSelected = selectedRows.filter((row) => row.status === "open" || row.status === "overdue");

  function toggle(id: string, shiftKey: boolean) {
    setSelected((previous) => {
      const next = new Set(previous);
      const turnOn = !previous.has(id);
      const from = anchor ? pageIds.indexOf(anchor) : -1;
      const to = pageIds.indexOf(id);
      if (shiftKey && from !== -1 && to !== -1) {
        const [start, end] = from < to ? [from, to] : [to, from];
        for (const rangeId of pageIds.slice(start, end + 1)) {
          if (turnOn) next.add(rangeId);
          else next.delete(rangeId);
        }
      } else if (turnOn) next.add(id);
      else next.delete(id);
      return next;
    });
    setAnchor(id);
  }

  function togglePage() {
    setSelected((previous) => {
      const next = new Set(previous);
      const allOn = pageIds.every((id) => previous.has(id));
      for (const id of pageIds) {
        if (allOn) next.delete(id);
        else next.add(id);
      }
      return next;
    });
  }

  function sortBy(key: TesseraSortKey) {
    setSort((previous) =>
      previous.key === key
        ? { key, direction: previous.direction === "asc" ? "desc" : "asc" }
        : { key, direction: key === "customer" || key === "due" ? "asc" : "desc" },
    );
    setPage(1);
  }

  function clearFilters() {
    setFilter("all");
    setQuery("");
    setPage(1);
  }

  function markPaid() {
    const ids = unpaidSelected.map((row) => row.invoice.id);
    if (ids.length === 0) return;
    setRows((previous) =>
      previous.map((invoice) => (ids.includes(invoice.id) ? { ...invoice, paid: invoice.amount } : invoice)),
    );
    setFlash(new Set(ids));
    setSelected(new Set());
    setAnnouncement(`${ids.length} ${ids.length === 1 ? "invoice" : "invoices"} marked paid`);
    onMarkPaid?.(ids);
  }

  function sendReminders() {
    const ids = unpaidSelected.map((row) => row.invoice.id);
    if (ids.length === 0) return;
    setConfirmed("remind");
    setAnnouncement(`Reminders sent for ${ids.length} ${ids.length === 1 ? "invoice" : "invoices"}`);
    onSendReminders?.(ids);
  }

  function exportSelected() {
    const ids = selectedRows.map((row) => row.invoice.id);
    setConfirmed("export");
    setAnnouncement(`${ids.length} ${ids.length === 1 ? "invoice" : "invoices"} exported as CSV`);
    onExport?.(ids);
  }

  const sortIcon = (key: TesseraSortKey) => {
    if (sort.key !== key)
      return <ChevronsUpDown size={12} strokeWidth={1.75} aria-hidden="true" className="opacity-60" />;
    return sort.direction === "asc" ? (
      <ArrowUp size={12} strokeWidth={2} aria-hidden="true" className="text-(--iu-foreground)" />
    ) : (
      <ArrowDown size={12} strokeWidth={2} aria-hidden="true" className="text-(--iu-foreground)" />
    );
  };

  const header = (key: TesseraSortKey, align: "left" | "right" = "left") => (
    <button
      type="button"
      onClick={() => sortBy(key)}
      className={cx(
        "-mx-1.5 inline-flex h-6 items-center gap-1 rounded-[min(var(--iu-radius),4px)] px-1.5 tracking-[0.06em] uppercase transition-colors duration-100 motion-reduce:transition-none pointer-coarse:h-10 pointer-fine:hover:bg-(--iu-foreground)/6 pointer-fine:hover:text-(--iu-foreground)",
        sort.key === key && "text-(--iu-foreground)",
        align === "right" && "flex-row-reverse",
        focusRing,
      )}
    >
      {SORT_LABELS[key]}
      {sortIcon(key)}
    </button>
  );
  const ariaSort = (key: TesseraSortKey) =>
    sort.key === key ? (sort.direction === "asc" ? "ascending" : "descending") : undefined;

  const loading = status === "loading";
  const failed = status === "error";
  const noData = !loading && !failed && rows.length === 0;
  const showRows = !loading && !failed && visible.length > 0;
  const firstShown = visible.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastShown = Math.min(currentPage * pageSize, visible.length);
  const thClass =
    "sticky top-0 z-10 border-b border-(--iu-border) bg-(--iu-surface) px-3 py-2 text-left text-[11px] font-medium text-(--iu-muted)";
  const cell = "px-3 py-[calc(10px*var(--iu-density))] align-middle";

  return (
    <MotionConfig
      reducedMotion="user"
      transition={reduceMotion ? { duration: 0 } : { duration: 0.14, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <section
        aria-labelledby={titleId}
        className={cx(
          "@container overflow-hidden rounded-[min(var(--iu-radius),8px)] border border-(--iu-border) bg-(--iu-surface) font-(family-name:--iu-font) text-(--iu-foreground) shadow-xs dark:shadow-none",
          className,
        )}
      >
        {/* Title and totals */}
        <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 px-4 pt-4 pb-3 @2xl:px-5">
          <div className="min-w-0">
            <h2 id={titleId} className="text-[15px] font-semibold tracking-[-0.01em]">
              {title}
            </h2>
            <dl className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-(--iu-muted)">
              <div className="flex gap-1.5">
                <dt>Outstanding</dt>
                <dd className="font-mono text-(--iu-foreground) tabular-nums">
                  {loading || failed ? "—" : format(totals.outstanding)}
                </dd>
              </div>
              <div className="flex gap-1.5">
                <dt>Overdue</dt>
                <dd
                  className={cx(
                    "font-mono tabular-nums",
                    totals.overdue > 0 && !loading && !failed
                      ? "text-red-700 dark:text-red-400"
                      : "text-(--iu-foreground)",
                  )}
                >
                  {loading || failed ? "—" : format(totals.overdue)}
                </dd>
              </div>
            </dl>
          </div>
          <button
            type="button"
            onClick={onCreateInvoice}
            className={cx(
              "inline-flex h-8 items-center gap-1.5 rounded-[min(var(--iu-radius),6px)] bg-(--iu-accent) px-3 text-[13px] font-medium text-(--iu-accent-foreground) transition-[filter] duration-100 active:brightness-90 motion-reduce:transition-none pointer-coarse:h-10 pointer-fine:hover:brightness-95",
              focusRing,
            )}
          >
            <Plus size={16} strokeWidth={1.75} aria-hidden="true" />
            New invoice
          </button>
        </header>

        {/* Filters and search */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-(--iu-border) px-4 py-2.5 @2xl:px-5">
          <div role="group" aria-label="Filter by status" className="-mx-1 flex flex-wrap gap-1">
            {FILTERS.map((option) => {
              const active = filter === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={active}
                  disabled={loading || failed}
                  onClick={() => {
                    setFilter(option.id);
                    setPage(1);
                  }}
                  className={cx(
                    "inline-flex h-7 items-center gap-1.5 rounded-[min(var(--iu-radius),6px)] border px-2 text-[12px] font-medium transition-colors duration-100 disabled:cursor-not-allowed motion-reduce:transition-none pointer-coarse:h-10",
                    active
                      ? "border-(--iu-accent) bg-[color-mix(in_oklab,var(--iu-accent)_10%,var(--iu-surface))] text-(--iu-foreground)"
                      : "border-transparent text-(--iu-muted) pointer-fine:hover:bg-(--iu-foreground)/6 pointer-fine:hover:text-(--iu-foreground)",
                    focusRing,
                  )}
                >
                  {option.label}
                  <span className="font-mono text-[11px] tabular-nums opacity-80">
                    {loading || failed ? "–" : counts[option.id]}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="relative ml-auto w-full @xl:w-56">
            <label htmlFor={searchId} className="sr-only">
              Search invoices
            </label>
            <Search
              size={14}
              strokeWidth={1.75}
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-(--iu-muted)"
            />
            <input
              id={searchId}
              type="search"
              value={query}
              disabled={loading || failed}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder="Customer or invoice"
              className={cx(
                "h-8 w-full rounded-[min(var(--iu-radius),6px)] border border-(--iu-foreground)/35 bg-(--iu-background) pr-2 pl-8 text-[13px] text-(--iu-foreground) placeholder:text-(--iu-muted) disabled:cursor-not-allowed disabled:opacity-60 pointer-coarse:h-10",
                focusRing,
              )}
            />
          </div>
        </div>

        {/* Selection strip: a quiet status line that becomes the bulk action bar */}
        <div
          className={cx(
            "relative flex min-h-11 items-center border-t border-(--iu-border) px-4 transition-colors duration-100 motion-reduce:transition-none @2xl:px-5",
            selected.size > 0 && "bg-[color-mix(in_oklab,var(--iu-accent)_7%,var(--iu-surface))]",
          )}
        >
          <AnimatePresence initial={false} mode="popLayout">
            {selected.size > 0 ? (
              <motion.div
                key="bulk"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 py-1.5"
              >
                <p className="mr-auto text-[13px]">
                  <span className="font-mono font-medium tabular-nums">{selected.size}</span> selected
                  <span className="text-(--iu-muted)"> · </span>
                  <RollingAmount value={selectedOutstanding} format={format} />
                  <span className="text-(--iu-muted)"> outstanding</span>
                </p>
                <div className="-mr-2 flex items-center gap-0.5">
                  <ConfirmButton
                    icon={<Mail size={16} strokeWidth={1.5} aria-hidden="true" />}
                    label="Send reminder"
                    done={confirmed === "remind"}
                    doneLabel="Reminded"
                    onClick={sendReminders}
                  />
                  <button
                    type="button"
                    onClick={markPaid}
                    disabled={unpaidSelected.length === 0}
                    className={ghostButton}
                  >
                    <CircleCheck size={16} strokeWidth={1.5} aria-hidden="true" />
                    <span className="sr-only @xl:not-sr-only">Mark paid</span>
                  </button>
                  <ConfirmButton
                    icon={<Download size={16} strokeWidth={1.5} aria-hidden="true" />}
                    label="Export CSV"
                    done={confirmed === "export"}
                    doneLabel="Exported"
                    onClick={exportSelected}
                  />
                  <span aria-hidden="true" className="mx-1 h-4 w-px bg-(--iu-border)" />
                  <button
                    type="button"
                    aria-label="Clear selection"
                    onClick={() => setSelected(new Set())}
                    className={cx(ghostButton, "w-8 justify-center px-0 pointer-coarse:w-10")}
                  >
                    <X size={16} strokeWidth={1.5} aria-hidden="true" />
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.p
                key="hint"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="text-[12px] text-(--iu-muted)"
              >
                {loading
                  ? "Loading invoices"
                  : failed
                    ? "Invoices unavailable"
                    : noData
                      ? "Nothing billed yet"
                      : `${visible.length} ${visible.length === 1 ? "invoice" : "invoices"} · sorted by ${SORT_LABELS[sort.key].toLowerCase()}, ${sort.direction === "asc" ? "ascending" : "descending"}`}
                {showRows && <span className="hidden @2xl:inline"> · shift-click to select a range</span>}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
        <p aria-live="polite" className="sr-only">
          {announcement}
        </p>

        {/* Wide containers: a table with a sticky header */}
        <div
          className="hidden max-h-[392px] [scrollbar-gutter:stable] overflow-y-auto border-t border-(--iu-border) @2xl:block"
          aria-busy={loading || undefined}
        >
          <table className="w-full table-fixed border-separate border-spacing-0 text-left">
            <caption className="sr-only">
              {title}, {SORT_LABELS[sort.key]} {sort.direction === "asc" ? "ascending" : "descending"}
            </caption>
            <thead>
              <tr>
                <th scope="col" className={cx(thClass, "w-12 pr-0 pl-4")}>
                  {showRows ? (
                    <SelectBox
                      checked={pageSelected > 0 && pageSelected === pageIds.length}
                      indeterminate={pageSelected > 0 && pageSelected < pageIds.length}
                      label="Select all invoices on this page"
                      onToggle={togglePage}
                    />
                  ) : (
                    <span className="sr-only">Select</span>
                  )}
                </th>
                <th scope="col" aria-sort={ariaSort("customer")} className={cx(thClass, "w-auto")}>
                  {header("customer")}
                </th>
                <th scope="col" className={cx(thClass, "w-[136px] tracking-[0.06em] uppercase")}>
                  Status
                </th>
                <th scope="col" aria-sort={ariaSort("id")} className={cx(thClass, "hidden w-[96px] @4xl:table-cell")}>
                  {header("id")}
                </th>
                <th scope="col" aria-sort={ariaSort("due")} className={cx(thClass, "w-[104px]")}>
                  {header("due")}
                </th>
                <th scope="col" aria-sort={ariaSort("amount")} className={cx(thClass, "w-[124px] text-right")}>
                  {header("amount", "right")}
                </th>
                <th
                  scope="col"
                  className={cx(thClass, "hidden w-[128px] pr-5 tracking-[0.06em] uppercase @3xl:table-cell")}
                >
                  Collected
                </th>
              </tr>
            </thead>
            <tbody className="text-[13px]">
              {loading &&
                SKELETON_WIDTHS.map((width, index) => (
                  <tr key={index}>
                    <td className={cx(cell, "border-b border-(--iu-border) pr-0 pl-4")}>
                      <span aria-hidden="true" className="block size-4 rounded-[3px] bg-(--iu-foreground)/8" />
                    </td>
                    <td className={cx(cell, "border-b border-(--iu-border)")}>
                      <span className="flex items-center gap-2.5">
                        <span
                          aria-hidden="true"
                          className="size-7 rounded-[min(var(--iu-radius),6px)] bg-(--iu-foreground)/8"
                        />
                        <SkeletonBar className={width} />
                      </span>
                    </td>
                    <td className={cx(cell, "border-b border-(--iu-border)")}>
                      <SkeletonBar className="w-20" />
                    </td>
                    <td className={cx(cell, "hidden border-b border-(--iu-border) @4xl:table-cell")}>
                      <SkeletonBar className="w-14" />
                    </td>
                    <td className={cx(cell, "border-b border-(--iu-border)")}>
                      <SkeletonBar className="w-12" />
                    </td>
                    <td className={cx(cell, "border-b border-(--iu-border)")}>
                      <SkeletonBar className="ml-auto w-20" />
                    </td>
                    <td className={cx(cell, "hidden border-b border-(--iu-border) pr-5 @3xl:table-cell")}>
                      <SkeletonBar className="w-full" />
                    </td>
                  </tr>
                ))}
              {showRows &&
                pageRows.map(({ invoice, status: rowStatus }) => {
                  const isSelected = selected.has(invoice.id);
                  const collected = invoice.amount === 0 ? 0 : invoice.paid / invoice.amount;
                  const lateDays = daysBetween(invoice.due, today);
                  return (
                    <tr
                      key={invoice.id}
                      data-selected={isSelected || undefined}
                      className={cx(
                        "transition-colors duration-150 even:bg-(--iu-foreground)/[0.025] motion-reduce:transition-none pointer-fine:hover:bg-(--iu-foreground)/5",
                        isSelected &&
                          "bg-[color-mix(in_oklab,var(--iu-accent)_9%,var(--iu-surface))] even:bg-[color-mix(in_oklab,var(--iu-accent)_9%,var(--iu-surface))] pointer-fine:hover:bg-[color-mix(in_oklab,var(--iu-accent)_12%,var(--iu-surface))]",
                        flash.has(invoice.id) &&
                          "bg-emerald-500/12 even:bg-emerald-500/12 dark:bg-emerald-400/12 dark:even:bg-emerald-400/12",
                      )}
                    >
                      <td
                        className={cx(
                          cell,
                          "relative border-b border-(--iu-border) pr-0 pl-4",
                          isSelected && "shadow-[inset_2px_0_0_var(--iu-accent)]",
                        )}
                      >
                        <SelectBox
                          checked={isSelected}
                          label={`Select ${invoice.id}, ${invoice.customer}`}
                          onToggle={(shiftKey) => toggle(invoice.id, shiftKey)}
                        />
                      </td>
                      <td className={cx(cell, "border-b border-(--iu-border)")}>
                        <span className="flex min-w-0 items-center gap-2.5">
                          <Monogram name={invoice.customer} />
                          <span className="min-w-0">
                            <a
                              href={`#${invoice.id}`}
                              onClick={(event) => {
                                if (!onOpenInvoice) return;
                                event.preventDefault();
                                onOpenInvoice(invoice.id);
                              }}
                              className={cx(
                                "block truncate rounded-sm font-medium text-(--iu-foreground) underline-offset-2 pointer-fine:hover:underline",
                                focusRing,
                              )}
                            >
                              {invoice.customer}
                            </a>
                            <span className="block font-mono text-[11px] text-(--iu-muted) tabular-nums @4xl:hidden">
                              {invoice.id}
                            </span>
                          </span>
                        </span>
                      </td>
                      <td className={cx(cell, "border-b border-(--iu-border)")}>
                        <StatusBadge status={rowStatus} lateDays={lateDays} dueIn={-lateDays} />
                      </td>
                      <td
                        className={cx(
                          cell,
                          "hidden border-b border-(--iu-border) font-mono text-[12px] text-(--iu-muted) tabular-nums @4xl:table-cell",
                        )}
                      >
                        {invoice.id}
                      </td>
                      <td className={cx(cell, "border-b border-(--iu-border) whitespace-nowrap tabular-nums")}>
                        <span className={rowStatus === "overdue" ? "text-(--iu-foreground)" : "text-(--iu-muted)"}>
                          {formatDate(invoice.due)}
                        </span>
                      </td>
                      <td
                        className={cx(
                          cell,
                          "border-b border-(--iu-border) text-right font-mono text-[13px] whitespace-nowrap tabular-nums",
                        )}
                      >
                        {format(invoice.amount)}
                      </td>
                      <td className={cx(cell, "hidden border-b border-(--iu-border) pr-5 @3xl:table-cell")}>
                        <span className="flex items-center gap-2">
                          <span
                            aria-hidden="true"
                            className="h-1.5 flex-1 overflow-hidden rounded-full bg-(--iu-foreground)/10"
                          >
                            <motion.span
                              className={cx(
                                "block h-full origin-left rounded-full",
                                collected >= 1 ? "bg-(--iu-foreground)/55" : "bg-(--iu-accent)",
                              )}
                              initial={false}
                              animate={{ scaleX: collected }}
                            />
                          </span>
                          <span className="w-9 text-right font-mono text-[11px] text-(--iu-muted) tabular-nums">
                            {Math.round(collected * 100)}%
                          </span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
          {!loading && !failed && !showRows && (
            <EmptyPanel noData={noData} query={query} onClear={clearFilters} onCreate={onCreateInvoice} />
          )}
          {failed && <ErrorPanel onRetry={onRetry} />}
        </div>

        {/* Narrow containers: stacked cards with the same selection and a sort menu */}
        <div className="border-t border-(--iu-border) @2xl:hidden" aria-busy={loading || undefined}>
          {showRows && (
            <div className="flex items-center justify-between gap-3 border-b border-(--iu-border) px-4 py-2">
              <div className="inline-flex items-center gap-2 text-[12px] text-(--iu-muted)">
                <SelectBox
                  checked={pageSelected > 0 && pageSelected === pageIds.length}
                  indeterminate={pageSelected > 0 && pageSelected < pageIds.length}
                  label="Select all invoices on this page"
                  onToggle={togglePage}
                />
                <span aria-hidden="true">Select page</span>
              </div>
              <label className="inline-flex items-center gap-2 text-[12px] text-(--iu-muted)">
                Sort
                <select
                  value={`${sort.key}:${sort.direction}`}
                  onChange={(event) => {
                    const [key, direction] = event.target.value.split(":") as [TesseraSortKey, "asc" | "desc"];
                    setSort({ key, direction });
                    setPage(1);
                  }}
                  className={cx(
                    "h-8 rounded-[min(var(--iu-radius),6px)] border border-(--iu-foreground)/35 bg-(--iu-background) px-2 text-[13px] text-(--iu-foreground) pointer-coarse:h-10",
                    focusRing,
                  )}
                >
                  <option value="id:desc">Newest first</option>
                  <option value="due:asc">Due soonest</option>
                  <option value="amount:desc">Largest amount</option>
                  <option value="customer:asc">Customer A–Z</option>
                </select>
              </label>
            </div>
          )}
          <ul className="divide-y divide-(--iu-border)">
            {loading &&
              SKELETON_WIDTHS.slice(0, 5).map((width, index) => (
                <li key={index} className="flex gap-3 px-4 py-3">
                  <span aria-hidden="true" className="mt-1 size-4 rounded-[3px] bg-(--iu-foreground)/8" />
                  <span className="flex flex-1 flex-col gap-2">
                    <span className="flex justify-between gap-3">
                      <SkeletonBar className={width} />
                      <SkeletonBar className="w-16" />
                    </span>
                    <SkeletonBar className="w-24" />
                  </span>
                </li>
              ))}
            {showRows &&
              pageRows.map(({ invoice, status: rowStatus }) => {
                const isSelected = selected.has(invoice.id);
                const lateDays = daysBetween(invoice.due, today);
                return (
                  <li
                    key={invoice.id}
                    className={cx(
                      "flex gap-2 py-[calc(12px*var(--iu-density))] pr-4 pl-3 transition-colors duration-150 motion-reduce:transition-none",
                      isSelected &&
                        "bg-[color-mix(in_oklab,var(--iu-accent)_9%,var(--iu-surface))] shadow-[inset_2px_0_0_var(--iu-accent)]",
                      flash.has(invoice.id) && "bg-emerald-500/12 dark:bg-emerald-400/12",
                    )}
                  >
                    <SelectBox
                      checked={isSelected}
                      label={`Select ${invoice.id}, ${invoice.customer}`}
                      onToggle={(shiftKey) => toggle(invoice.id, shiftKey)}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-3">
                        <a
                          href={`#${invoice.id}`}
                          onClick={(event) => {
                            if (!onOpenInvoice) return;
                            event.preventDefault();
                            onOpenInvoice(invoice.id);
                          }}
                          className={cx("truncate rounded-sm text-[14px] font-medium", focusRing)}
                        >
                          {invoice.customer}
                        </a>
                        <span className="font-mono text-[13px] whitespace-nowrap tabular-nums">
                          {format(invoice.amount)}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between gap-3">
                        <span className="font-mono text-[11px] text-(--iu-muted) tabular-nums">
                          {invoice.id} · due {formatDate(invoice.due)}
                        </span>
                        <StatusBadge status={rowStatus} lateDays={lateDays} dueIn={-lateDays} />
                      </div>
                    </div>
                  </li>
                );
              })}
          </ul>
          {!loading && !failed && !showRows && (
            <EmptyPanel noData={noData} query={query} onClear={clearFilters} onCreate={onCreateInvoice} />
          )}
          {failed && <ErrorPanel onRetry={onRetry} />}
        </div>

        {/* Pagination */}
        <nav
          aria-label="Invoice pages"
          className="flex flex-wrap items-center justify-between gap-3 border-t border-(--iu-border) px-4 py-2.5 @2xl:px-5"
        >
          <p className="font-mono text-[12px] text-(--iu-muted) tabular-nums">
            {loading || failed
              ? "—"
              : visible.length === 0
                ? "0 invoices"
                : `${firstShown}–${lastShown} of ${visible.length}`}
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Previous page"
              disabled={currentPage <= 1 || !showRows}
              onClick={() => setPage(currentPage - 1)}
              className={cx(ghostButton, "w-8 justify-center px-0 pointer-coarse:w-10")}
            >
              <ChevronLeft size={16} strokeWidth={1.5} aria-hidden="true" />
            </button>
            {Array.from({ length: showRows ? pageCount : 1 }, (_, index) => index + 1).map((number) => (
              <button
                key={number}
                type="button"
                aria-label={`Page ${number}`}
                aria-current={number === currentPage ? "page" : undefined}
                disabled={!showRows}
                onClick={() => setPage(number)}
                className={cx(
                  ghostButton,
                  "w-8 justify-center px-0 font-mono text-[12px] tabular-nums pointer-coarse:w-10",
                  number === currentPage &&
                    "bg-(--iu-foreground)/8 text-(--iu-foreground) shadow-[inset_0_-2px_0_var(--iu-accent)]",
                )}
              >
                {number}
              </button>
            ))}
            <button
              type="button"
              aria-label="Next page"
              disabled={currentPage >= pageCount || !showRows}
              onClick={() => setPage(currentPage + 1)}
              className={cx(ghostButton, "w-8 justify-center px-0 pointer-coarse:w-10")}
            >
              <ChevronRight size={16} strokeWidth={1.5} aria-hidden="true" />
            </button>
          </div>
        </nav>
      </section>
    </MotionConfig>
  );
}

function EmptyPanel({
  noData,
  query,
  onClear,
  onCreate,
}: {
  noData: boolean;
  query: string;
  onClear: () => void;
  onCreate?: () => void;
}) {
  return (
    <div className="flex flex-col items-start gap-3 px-4 py-12 @2xl:items-center @2xl:px-5 @2xl:text-center">
      <svg aria-hidden="true" width="56" height="44" viewBox="0 0 56 44" fill="none" className="text-(--iu-muted)">
        <rect x="8.5" y="4.5" width="34" height="35" rx="3" stroke="currentColor" strokeOpacity="0.5" />
        <rect x="13.5" y="8.5" width="34" height="35" rx="3" className="fill-(--iu-surface)" stroke="currentColor" />
        <path d="M19 17h16M19 23h22M19 29h12" stroke="currentColor" strokeLinecap="round" strokeOpacity="0.6" />
      </svg>
      <div>
        <p className="text-[14px] font-medium">{noData ? "No invoices yet" : "No invoices match"}</p>
        <p className="mt-1 max-w-sm text-[13px] text-pretty text-(--iu-muted)">
          {noData
            ? "Invoices you create or import from your billing provider show up here with their payment status."
            : query
              ? `Nothing matches “${query}” with this status filter.`
              : "Nothing has this status right now."}
        </p>
      </div>
      <button
        type="button"
        onClick={noData ? onCreate : onClear}
        className={cx(
          "inline-flex h-8 items-center gap-1.5 rounded-[min(var(--iu-radius),6px)] border border-(--iu-foreground)/35 px-3 text-[13px] font-medium transition-colors duration-100 motion-reduce:transition-none pointer-coarse:h-10 pointer-fine:hover:bg-(--iu-foreground)/6",
          focusRing,
        )}
      >
        {noData ? (
          <>
            <Plus size={16} strokeWidth={1.5} aria-hidden="true" />
            Create first invoice
          </>
        ) : (
          <>
            <X size={16} strokeWidth={1.5} aria-hidden="true" />
            Clear filters
          </>
        )}
      </button>
    </div>
  );
}

function ErrorPanel({ onRetry }: { onRetry?: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-3 px-4 py-12 @2xl:items-center @2xl:px-5 @2xl:text-center"
    >
      <span className="inline-flex size-9 items-center justify-center rounded-full bg-red-600/10 text-red-700 dark:bg-red-400/12 dark:text-red-400">
        <AlertTriangle size={18} strokeWidth={1.5} aria-hidden="true" />
      </span>
      <div>
        <p className="text-[14px] font-medium">Invoices didn’t load</p>
        <p className="mt-1 max-w-sm text-[13px] text-pretty text-(--iu-muted)">
          The billing service timed out after 30 seconds. Your invoices are safe; this is a display problem.
        </p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className={cx(
          "inline-flex h-8 items-center gap-1.5 rounded-[min(var(--iu-radius),6px)] border border-(--iu-foreground)/35 px-3 text-[13px] font-medium transition-colors duration-100 motion-reduce:transition-none pointer-coarse:h-10 pointer-fine:hover:bg-(--iu-foreground)/6",
          focusRing,
        )}
      >
        <RotateCw size={16} strokeWidth={1.5} aria-hidden="true" />
        Try again
      </button>
    </div>
  );
}

export default TesseraInvoiceTable;
