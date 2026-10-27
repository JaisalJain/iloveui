"use client";

import { useId, useMemo, useState } from "react";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "motion/react";
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, ChevronsRight, Plus, Printer, RotateCw, X } from "lucide-react";

export const GRISTMILL_STAGES = ["pending", "roasting", "packed", "shipped"] as const;
export type GristmillStage = (typeof GRISTMILL_STAGES)[number];

export type GristmillOrder = {
  id: string;
  customer: string;
  city: string;
  /** Short line describing the bags, e.g. "12 × 1kg Guji". */
  items: string;
  bags: number;
  /** Total in minor units (pence). */
  total: number;
  stage: GristmillStage;
};

export type GristmillSortKey = "id" | "customer" | "total" | "stage";

export type GristmillOrderBoardProps = {
  title?: string;
  orders?: GristmillOrder[];
  currency?: string;
  locale?: string;
  pageSize?: number;
  defaultSelected?: string[];
  status?: "ready" | "loading" | "error";
  onStageChange?: (id: string, stage: GristmillStage) => void;
  onAdvance?: (ids: string[]) => void;
  onPrintLabels?: (ids: string[]) => void;
  onNewOrder?: () => void;
  onRetry?: () => void;
  className?: string;
};

const DEFAULT_ORDERS: GristmillOrder[] = [
  {
    id: "GM-1058",
    customer: "Corner Bloom Café",
    city: "Leeds",
    items: "12 × 1kg Guji, 4 × 1kg Decaf",
    bags: 16,
    total: 41300,
    stage: "pending",
  },
  {
    id: "GM-1057",
    customer: "Haverford Bakery",
    city: "York",
    items: "6 × 1kg House Espresso",
    bags: 6,
    total: 13700,
    stage: "roasting",
  },
  {
    id: "GM-1056",
    customer: "Slow Lane Cycles",
    city: "Hebden Bridge",
    items: "3 × 250g Huila, 3 × 250g Guji",
    bags: 6,
    total: 5000,
    stage: "packed",
  },
  {
    id: "GM-1055",
    customer: "The Reading Room",
    city: "Harrogate",
    items: "20 × 1kg House Espresso",
    bags: 20,
    total: 45800,
    stage: "shipped",
  },
  {
    id: "GM-1054",
    customer: "Pell & Daughters",
    city: "Sheffield",
    items: "8 × 1kg Cerrado",
    bags: 8,
    total: 17900,
    stage: "roasting",
  },
  {
    id: "GM-1053",
    customer: "Tinker Street Deli",
    city: "Manchester",
    items: "4 × 1kg Decaf",
    bags: 4,
    total: 10000,
    stage: "pending",
  },
  {
    id: "GM-1052",
    customer: "Northgate Climbing",
    city: "Leeds",
    items: "10 × 1kg House Espresso",
    bags: 10,
    total: 22900,
    stage: "packed",
  },
  {
    id: "GM-1051",
    customer: "Fold Studio",
    city: "Bradford",
    items: "2 × 1kg Guji, 2 × 1kg Huila",
    bags: 4,
    total: 11200,
    stage: "shipped",
  },
  {
    id: "GM-1050",
    customer: "Marram Hotel",
    city: "Whitby",
    items: "24 × 1kg House Espresso",
    bags: 24,
    total: 55000,
    stage: "shipped",
  },
  {
    id: "GM-1049",
    customer: "Kiln & Kettle",
    city: "Halifax",
    items: "6 × 1kg Cerrado, 2 × 1kg Decaf",
    bags: 8,
    total: 18400,
    stage: "pending",
  },
  {
    id: "GM-1048",
    customer: "Uptown Laundrette",
    city: "Leeds",
    items: "2 × 1kg House Espresso",
    bags: 2,
    total: 4600,
    stage: "packed",
  },
  {
    id: "GM-1047",
    customer: "Wold Farm Shop",
    city: "Malton",
    items: "15 × 250g Guji",
    bags: 15,
    total: 12400,
    stage: "roasting",
  },
];

const STAGE_LABEL: Record<GristmillStage, string> = {
  pending: "Pending",
  roasting: "Roasting",
  packed: "Packed",
  shipped: "Shipped",
};

const SORT_LABEL: Record<GristmillSortKey, string> = {
  id: "Order",
  customer: "Customer",
  total: "Total",
  stage: "Stage",
};

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--iu-accent)";
const press =
  "shadow-[3px_3px_0_var(--iu-foreground)] transition-[translate,box-shadow] duration-100 ease-linear motion-reduce:transition-none active:translate-x-[3px] active:translate-y-[3px] active:shadow-none";
const block =
  "inline-flex items-center justify-center gap-2 rounded-[min(var(--iu-radius),4px)] border-2 border-(--iu-foreground) font-bold tracking-[0.04em] uppercase";

function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

/** Four chunky segments that are also the control: a radio group per order. */
function StageRail({ order, onChange }: { order: GristmillOrder; onChange: (stage: GristmillStage) => void }) {
  const name = useId();
  const current = GRISTMILL_STAGES.indexOf(order.stage);
  return (
    <fieldset className="min-w-0">
      <legend className="sr-only">
        Stage for {order.id}, {order.customer}
      </legend>
      <div className="flex items-center gap-1">
        {GRISTMILL_STAGES.map((stage, index) => {
          const filled = index <= current;
          return (
            <label key={stage} className="relative block cursor-pointer" title={STAGE_LABEL[stage]}>
              <input
                type="radio"
                name={name}
                value={stage}
                checked={order.stage === stage}
                onChange={() => onChange(stage)}
                className="peer sr-only"
              />
              <span className="sr-only">{STAGE_LABEL[stage]}</span>
              <span
                aria-hidden="true"
                className="relative block h-6 w-6 overflow-hidden border-2 border-(--iu-foreground) bg-(--iu-surface) peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-(--iu-accent) @4xl:w-7 pointer-coarse:h-10 pointer-coarse:w-8 pointer-fine:peer-hover:bg-(--iu-foreground)/15"
              >
                <motion.span
                  className="absolute inset-0 origin-left bg-(--iu-foreground)"
                  initial={false}
                  animate={{ scaleX: filled ? 1 : 0 }}
                  transition={{ duration: 0.1, ease: "linear", delay: filled ? index * 0.04 : 0 }}
                />
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function Sticker({ stage }: { stage: GristmillStage }) {
  return (
    <AnimatePresence initial={false} mode="popLayout">
      <motion.span
        key={stage}
        initial={{ scale: 1.25, rotate: -8, opacity: 0 }}
        animate={{ scale: 1, rotate: stage === "shipped" ? -3 : 0, opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.12, ease: "linear" }}
        className={cx(
          "inline-flex h-6 items-center border-2 border-(--iu-foreground) px-1.5 font-mono text-[11px] font-bold tracking-[0.06em] uppercase",
          stage === "shipped" && "bg-(--iu-foreground) text-(--iu-surface)",
          stage === "pending" && "border-dashed text-(--iu-foreground)",
          (stage === "roasting" || stage === "packed") && "bg-(--iu-surface) text-(--iu-foreground)",
        )}
      >
        {STAGE_LABEL[stage]}
      </motion.span>
    </AnimatePresence>
  );
}

function Check({
  checked,
  indeterminate = false,
  label,
  onChange,
}: {
  checked: boolean;
  indeterminate?: boolean;
  label: string;
  onChange: () => void;
}) {
  return (
    <label className="relative inline-flex size-6 cursor-pointer items-center justify-center pointer-coarse:size-10">
      <input type="checkbox" checked={checked} onChange={onChange} aria-label={label} className="peer sr-only" />
      <span
        aria-hidden="true"
        className={cx(
          "flex size-5 items-center justify-center border-2 border-(--iu-foreground) peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-(--iu-accent)",
          checked || indeterminate ? "bg-(--iu-foreground) text-(--iu-surface)" : "bg-(--iu-surface)",
        )}
      >
        {checked ? (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M2 6.5 4.8 9 10 3" stroke="currentColor" strokeWidth="2.25" strokeLinecap="square" />
          </svg>
        ) : indeterminate ? (
          <span className="h-0.5 w-2.5 bg-current" />
        ) : null}
      </span>
    </label>
  );
}

export function GristmillOrderBoard({
  title = "Orders",
  orders = DEFAULT_ORDERS,
  currency = "GBP",
  locale = "en-GB",
  pageSize = 6,
  defaultSelected = [],
  status = "ready",
  onStageChange,
  onAdvance,
  onPrintLabels,
  onNewOrder,
  onRetry,
  className = "",
}: GristmillOrderBoardProps) {
  const reduceMotion = useReducedMotion();
  const titleId = useId();
  const [rows, setRows] = useState(orders);
  const [source, setSource] = useState(orders);
  if (source !== orders) {
    setSource(orders);
    setRows(orders);
  }
  const [sort, setSort] = useState<{ key: GristmillSortKey; direction: "asc" | "desc" }>({
    key: "id",
    direction: "desc",
  });
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(() => new Set(defaultSelected));
  const [announcement, setAnnouncement] = useState("");

  const money = useMemo(
    () => new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 }),
    [locale, currency],
  );
  const format = (minor: number) => money.format(minor / 100);

  const sorted = useMemo(() => {
    const factor = sort.direction === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      if (sort.key === "total") return (a.total - b.total) * factor;
      if (sort.key === "customer") return a.customer.localeCompare(b.customer) * factor;
      if (sort.key === "stage") return (GRISTMILL_STAGES.indexOf(a.stage) - GRISTMILL_STAGES.indexOf(b.stage)) * factor;
      return a.id.localeCompare(b.id, undefined, { numeric: true }) * factor;
    });
  }, [rows, sort]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageRows = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const pageIds = pageRows.map((row) => row.id);
  const onPage = pageIds.filter((id) => selected.has(id)).length;
  const chosen = rows.filter((row) => selected.has(row.id));
  const advanceable = chosen.filter((row) => row.stage !== "shipped");

  const loading = status === "loading";
  const failed = status === "error";
  const empty = !loading && !failed && rows.length === 0;
  const showRows = !loading && !failed && rows.length > 0;
  const open = rows.filter((row) => row.stage !== "shipped");
  const toShip = rows.filter((row) => row.stage === "packed").length;
  const openValue = open.reduce((sum, row) => sum + row.total, 0);
  const openBags = open.reduce((sum, row) => sum + row.bags, 0);

  function setStage(id: string, stage: GristmillStage) {
    setRows((previous) => previous.map((row) => (row.id === id ? { ...row, stage } : row)));
    setAnnouncement(`${id} moved to ${STAGE_LABEL[stage]}`);
    onStageChange?.(id, stage);
  }

  function toggle(id: string) {
    setSelected((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
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

  function advance() {
    const ids = advanceable.map((row) => row.id);
    if (ids.length === 0) return;
    setRows((previous) =>
      previous.map((row) =>
        ids.includes(row.id)
          ? { ...row, stage: GRISTMILL_STAGES[Math.min(3, GRISTMILL_STAGES.indexOf(row.stage) + 1)] ?? row.stage }
          : row,
      ),
    );
    setAnnouncement(`${ids.length} ${ids.length === 1 ? "order" : "orders"} moved one stage forward`);
    onAdvance?.(ids);
  }

  function sortBy(key: GristmillSortKey) {
    setSort((previous) =>
      previous.key === key
        ? { key, direction: previous.direction === "asc" ? "desc" : "asc" }
        : { key, direction: key === "customer" ? "asc" : "desc" },
    );
    setPage(1);
  }

  const sortButton = (key: GristmillSortKey) => (
    <button
      type="button"
      onClick={() => sortBy(key)}
      className={cx(
        "-mx-1 inline-flex h-7 items-center gap-1 px-1 font-bold tracking-[0.08em] uppercase pointer-coarse:h-10 pointer-fine:hover:bg-(--iu-foreground) pointer-fine:hover:text-(--iu-background)",
        focusRing,
      )}
    >
      {SORT_LABEL[key]}
      {sort.key === key &&
        (sort.direction === "asc" ? (
          <ArrowUp size={14} strokeWidth={2.5} aria-hidden="true" />
        ) : (
          <ArrowDown size={14} strokeWidth={2.5} aria-hidden="true" />
        ))}
    </button>
  );
  const ariaSort = (key: GristmillSortKey) =>
    sort.key === key ? (sort.direction === "asc" ? "ascending" : "descending") : undefined;
  const th =
    "sticky top-0 z-10 border-b-2 border-(--iu-foreground) bg-(--iu-background) px-3 py-2 text-left font-mono text-[11px] text-(--iu-foreground)";
  const td = "border-b-2 border-(--iu-foreground)/15 px-3 py-[calc(12px*var(--iu-density))] align-middle";

  const stats = [
    { label: "Open orders", value: loading || failed ? "—" : String(open.length) },
    { label: "Bags to roast", value: loading || failed ? "—" : String(openBags) },
    { label: "Ready to ship", value: loading || failed ? "—" : String(toShip) },
    { label: "Open value", value: loading || failed ? "—" : format(openValue) },
  ];

  return (
    <MotionConfig reducedMotion="user" transition={reduceMotion ? { duration: 0 } : { duration: 0.1, ease: "linear" }}>
      <section
        aria-labelledby={titleId}
        className={cx(
          "@container rounded-[min(var(--iu-radius),4px)] border-2 border-(--iu-foreground) bg-(--iu-surface) font-(family-name:--iu-font) text-(--iu-foreground) shadow-[6px_6px_0_var(--iu-foreground)]",
          className,
        )}
      >
        <header className="flex flex-wrap items-end justify-between gap-4 border-b-2 border-(--iu-foreground) p-4 @2xl:p-6">
          <div>
            <p className="font-mono text-[11px] font-bold tracking-[0.12em] uppercase">
              Gristmill Roasters · Wholesale
            </p>
            <h2
              id={titleId}
              className="mt-1 text-[40px] leading-none font-extrabold tracking-[-0.04em] uppercase @2xl:text-[56px]"
            >
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onNewOrder}
            className={cx(
              block,
              press,
              "h-11 bg-(--iu-accent) px-4 text-[13px] text-(--iu-accent-foreground)",
              focusRing,
            )}
          >
            <Plus size={18} strokeWidth={2.5} aria-hidden="true" />
            New order
          </button>
        </header>

        <dl className="grid grid-cols-2 border-b-2 border-(--iu-foreground) @2xl:grid-cols-4">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className={cx(
                "flex flex-col gap-1 px-4 py-3 @2xl:px-6",
                index % 2 === 1 && "border-l-2 border-(--iu-foreground)",
                index >= 2 && "border-t-2 border-(--iu-foreground) @2xl:border-t-0",
                index === 2 && "@2xl:border-l-2",
              )}
            >
              <dt className="font-mono text-[11px] font-bold tracking-[0.1em] uppercase">{stat.label}</dt>
              <dd className="text-[28px] leading-none font-extrabold tracking-[-0.03em] tabular-nums">{stat.value}</dd>
            </div>
          ))}
        </dl>

        <p aria-live="polite" className="sr-only">
          {announcement}
        </p>

        {/* Wide: table with sticky header */}
        <div
          className="hidden max-h-[452px] [scrollbar-gutter:stable] overflow-y-auto @3xl:block"
          aria-busy={loading || undefined}
        >
          <table className="w-full table-fixed border-separate border-spacing-0 text-left">
            <caption className="sr-only">
              Wholesale orders, sorted by {SORT_LABEL[sort.key]} {sort.direction === "asc" ? "ascending" : "descending"}
            </caption>
            <thead>
              <tr>
                <th scope="col" className={cx(th, "w-14 pl-5")}>
                  {showRows ? (
                    <Check
                      checked={onPage > 0 && onPage === pageIds.length}
                      indeterminate={onPage > 0 && onPage < pageIds.length}
                      label="Select every order on this page"
                      onChange={togglePage}
                    />
                  ) : (
                    <span className="sr-only">Select</span>
                  )}
                </th>
                <th scope="col" aria-sort={ariaSort("id")} className={cx(th, "w-[112px]")}>
                  {sortButton("id")}
                </th>
                <th scope="col" aria-sort={ariaSort("customer")} className={th}>
                  {sortButton("customer")}
                </th>
                <th scope="col" aria-sort={ariaSort("total")} className={cx(th, "w-[104px] text-right")}>
                  {sortButton("total")}
                </th>
                <th scope="col" aria-sort={ariaSort("stage")} className={cx(th, "w-[264px] pr-5")}>
                  {sortButton("stage")}
                </th>
              </tr>
            </thead>
            <tbody>
              {loading &&
                [0, 1, 2, 3, 4].map((index) => (
                  <tr key={index}>
                    <td className={cx(td, "pl-5")}>
                      <span aria-hidden="true" className="block size-5 border-2 border-(--iu-foreground)/25" />
                    </td>
                    <td className={td}>
                      <span aria-hidden="true" className="block h-4 w-16 bg-(--iu-foreground)/15" />
                    </td>
                    <td className={td}>
                      <span aria-hidden="true" className="block h-4 w-40 bg-(--iu-foreground)/15" />
                      <span aria-hidden="true" className="mt-2 block h-3 w-56 bg-(--iu-foreground)/10" />
                    </td>
                    <td className={td}>
                      <span aria-hidden="true" className="ml-auto block h-4 w-14 bg-(--iu-foreground)/15" />
                    </td>
                    <td className={cx(td, "pr-5")}>
                      <span aria-hidden="true" className="flex gap-1">
                        {[0, 1, 2, 3].map((segment) => (
                          <span key={segment} className="block size-6 border-2 border-(--iu-foreground)/25 @4xl:w-7" />
                        ))}
                      </span>
                    </td>
                  </tr>
                ))}
              {showRows &&
                pageRows.map((order) => {
                  const isSelected = selected.has(order.id);
                  return (
                    <tr key={order.id} className={cx(isSelected && "bg-(--iu-foreground)/8")}>
                      <td
                        className={cx(td, "relative pl-5", isSelected && "shadow-[inset_6px_0_0_var(--iu-foreground)]")}
                      >
                        <Check
                          checked={isSelected}
                          label={`Select ${order.id}, ${order.customer}`}
                          onChange={() => toggle(order.id)}
                        />
                      </td>
                      <td className={cx(td, "font-mono text-[13px] font-bold tabular-nums")}>{order.id}</td>
                      <td className={td}>
                        <span className="block truncate text-[15px] font-bold">
                          {order.customer}
                          <span className="font-normal text-(--iu-muted)"> · {order.city}</span>
                        </span>
                        <span className="mt-0.5 block truncate font-mono text-[12px] text-(--iu-muted)">
                          {order.items}
                        </span>
                      </td>
                      <td className={cx(td, "text-right text-[15px] font-bold tabular-nums")}>{format(order.total)}</td>
                      <td className={cx(td, "pr-5")}>
                        <span className="flex items-center gap-3">
                          <StageRail order={order} onChange={(stage) => setStage(order.id, stage)} />
                          <Sticker stage={order.stage} />
                        </span>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
          {empty && <EmptyBlock onNewOrder={onNewOrder} />}
          {failed && <ErrorBlock onRetry={onRetry} />}
        </div>

        {/* Narrow: stacked tickets */}
        <div className="@3xl:hidden" aria-busy={loading || undefined}>
          {showRows && (
            <div className="flex items-center gap-2 border-b-2 border-(--iu-foreground) bg-(--iu-background) px-4 py-2 font-mono text-[11px] font-bold tracking-[0.08em] uppercase">
              <Check
                checked={onPage > 0 && onPage === pageIds.length}
                indeterminate={onPage > 0 && onPage < pageIds.length}
                label="Select every order on this page"
                onChange={togglePage}
              />
              <span aria-hidden="true" className="mr-auto">
                Page
              </span>
              <span>Sort</span>
              {(["id", "total", "stage"] as GristmillSortKey[]).map((key) => (
                <span key={key}>{sortButton(key)}</span>
              ))}
            </div>
          )}
          <ul>
            {loading &&
              [0, 1, 2].map((index) => (
                <li key={index} className="flex flex-col gap-3 border-b-2 border-(--iu-foreground)/15 p-4">
                  <span aria-hidden="true" className="block h-4 w-32 bg-(--iu-foreground)/15" />
                  <span aria-hidden="true" className="block h-3 w-52 bg-(--iu-foreground)/10" />
                  <span aria-hidden="true" className="flex gap-1">
                    {[0, 1, 2, 3].map((segment) => (
                      <span key={segment} className="block size-6 border-2 border-(--iu-foreground)/25" />
                    ))}
                  </span>
                </li>
              ))}
            {showRows &&
              pageRows.map((order) => {
                const isSelected = selected.has(order.id);
                return (
                  <li
                    key={order.id}
                    className={cx(
                      "border-b-2 border-(--iu-foreground)/15 p-4",
                      isSelected && "bg-(--iu-foreground)/8 shadow-[inset_6px_0_0_var(--iu-foreground)]",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <Check
                        checked={isSelected}
                        label={`Select ${order.id}, ${order.customer}`}
                        onChange={() => toggle(order.id)}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="font-mono text-[12px] font-bold tabular-nums">{order.id}</span>
                          <span className="text-[15px] font-bold tabular-nums">{format(order.total)}</span>
                        </div>
                        <p className="mt-1 text-[15px] font-bold">
                          {order.customer}
                          <span className="font-normal text-(--iu-muted)"> · {order.city}</span>
                        </p>
                        <p className="mt-0.5 font-mono text-[12px] text-(--iu-muted)">{order.items}</p>
                        <div className="mt-3 flex items-center gap-3">
                          <StageRail order={order} onChange={(stage) => setStage(order.id, stage)} />
                          <Sticker stage={order.stage} />
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
          </ul>
          {empty && <EmptyBlock onNewOrder={onNewOrder} />}
          {failed && <ErrorBlock onRetry={onRetry} />}
        </div>

        {/* Bulk slab */}
        <AnimatePresence initial={false}>
          {chosen.length > 0 && showRows && (
            <motion.div
              key="bulk"
              initial={{ height: 0 }}
              animate={{ height: "auto" }}
              exit={{ height: 0 }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap items-center gap-3 border-t-2 border-(--iu-foreground) bg-(--iu-foreground) px-4 py-3 text-(--iu-background) @2xl:px-6">
                <p className="mr-auto font-mono text-[12px] font-bold tracking-[0.08em] uppercase">
                  <span className="text-[20px] tabular-nums">{chosen.length}</span>{" "}
                  {chosen.length === 1 ? "order" : "orders"} ·{" "}
                  <span className="tabular-nums">{format(chosen.reduce((sum, row) => sum + row.total, 0))}</span>
                </p>
                <button
                  type="button"
                  onClick={advance}
                  disabled={advanceable.length === 0}
                  className={cx(
                    block,
                    "h-10 border-(--iu-background) bg-(--iu-background) px-3 text-[12px] text-(--iu-foreground) shadow-[3px_3px_0_var(--iu-accent)] transition-[translate,box-shadow] duration-100 ease-linear active:translate-x-[3px] active:translate-y-[3px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none",
                    focusRing,
                  )}
                >
                  <ChevronsRight size={16} strokeWidth={2.5} aria-hidden="true" />
                  Advance stage
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAnnouncement(`Labels sent to the printer for ${chosen.length} orders`);
                    onPrintLabels?.(chosen.map((row) => row.id));
                  }}
                  className={cx(
                    block,
                    "h-10 border-(--iu-background) px-3 text-[12px] text-(--iu-background) pointer-fine:hover:bg-(--iu-background)/15",
                    focusRing,
                  )}
                >
                  <Printer size={16} strokeWidth={2} aria-hidden="true" />
                  Labels
                </button>
                <button
                  type="button"
                  aria-label="Clear selection"
                  onClick={() => setSelected(new Set())}
                  className={cx(
                    block,
                    "size-10 border-(--iu-background) text-(--iu-background) pointer-fine:hover:bg-(--iu-background)/15",
                    focusRing,
                  )}
                >
                  <X size={18} strokeWidth={2.5} aria-hidden="true" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pagination */}
        <nav
          aria-label="Order pages"
          className="flex items-center justify-between gap-3 border-t-2 border-(--iu-foreground) px-4 py-3 @2xl:px-6"
        >
          <p className="font-mono text-[12px] font-bold tracking-[0.06em] uppercase tabular-nums">
            {showRows
              ? `${(currentPage - 1) * pageSize + 1}–${Math.min(currentPage * pageSize, sorted.length)} / ${sorted.length}`
              : "0 / 0"}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Previous page"
              disabled={!showRows || currentPage <= 1}
              onClick={() => setPage(currentPage - 1)}
              className={cx(
                block,
                "size-9 disabled:cursor-not-allowed disabled:border-(--iu-foreground)/30 disabled:text-(--iu-muted) pointer-coarse:size-10",
                focusRing,
              )}
            >
              <ChevronLeft size={18} strokeWidth={2.5} aria-hidden="true" />
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
                  block,
                  "size-9 font-mono text-[14px] disabled:cursor-not-allowed pointer-coarse:size-10",
                  number === currentPage
                    ? "bg-(--iu-foreground) text-(--iu-background)"
                    : "pointer-fine:hover:bg-(--iu-foreground)/10",
                  focusRing,
                )}
              >
                {number}
              </button>
            ))}
            <button
              type="button"
              aria-label="Next page"
              disabled={!showRows || currentPage >= pageCount}
              onClick={() => setPage(currentPage + 1)}
              className={cx(
                block,
                "size-9 disabled:cursor-not-allowed disabled:border-(--iu-foreground)/30 disabled:text-(--iu-muted) pointer-coarse:size-10",
                focusRing,
              )}
            >
              <ChevronRight size={18} strokeWidth={2.5} aria-hidden="true" />
            </button>
          </div>
        </nav>
      </section>
    </MotionConfig>
  );
}

function EmptyBlock({ onNewOrder }: { onNewOrder?: () => void }) {
  return (
    <div className="flex flex-col items-start gap-4 p-6 @2xl:flex-row @2xl:items-center @2xl:gap-8 @2xl:p-10">
      <svg
        aria-hidden="true"
        width="96"
        height="72"
        viewBox="0 0 96 72"
        fill="none"
        className="shrink-0 text-(--iu-foreground)"
      >
        <path d="M8 26h80v40H8z" stroke="currentColor" strokeWidth="3" />
        <path d="M8 26 20 8h56l12 18" stroke="currentColor" strokeWidth="3" />
        <path d="M36 40h24" stroke="currentColor" strokeWidth="3" />
        <path d="M8 26h80" stroke="currentColor" strokeWidth="3" strokeDasharray="6 5" />
      </svg>
      <div className="flex-1">
        <p className="text-[24px] leading-tight font-extrabold tracking-[-0.02em] uppercase">No orders on the board</p>
        <p className="mt-1 max-w-md text-[14px] text-pretty text-(--iu-muted)">
          Wholesale orders from your cafés land here the moment they are placed. Add one by hand to get started.
        </p>
      </div>
      <button
        type="button"
        onClick={onNewOrder}
        className={cx(block, press, "h-11 bg-(--iu-surface) px-4 text-[13px]", focusRing)}
      >
        <Plus size={18} strokeWidth={2.5} aria-hidden="true" />
        Add first order
      </button>
    </div>
  );
}

function ErrorBlock({ onRetry }: { onRetry?: () => void }) {
  return (
    <div
      role="alert"
      className="m-4 border-2 border-red-700 bg-red-50 p-5 @2xl:m-6 dark:border-red-400 dark:bg-red-950/40"
    >
      <p className="font-mono text-[11px] font-bold tracking-[0.1em] text-red-800 uppercase dark:text-red-300">
        Error 502
      </p>
      <p className="mt-1 text-[20px] leading-tight font-extrabold uppercase">Orders didn’t load</p>
      <p className="mt-1 max-w-md text-[14px] text-pretty text-(--iu-foreground)">
        The roastery system did not answer in time. Nothing was changed; try again in a moment.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className={cx(block, press, "mt-4 h-10 bg-(--iu-surface) px-4 text-[12px]", focusRing)}
      >
        <RotateCw size={16} strokeWidth={2.5} aria-hidden="true" />
        Try again
      </button>
    </div>
  );
}

export default GristmillOrderBoard;
