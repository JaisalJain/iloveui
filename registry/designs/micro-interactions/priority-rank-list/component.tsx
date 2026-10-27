"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import {
  AnimatePresence,
  MotionConfig,
  Reorder,
  motion,
  useDragControls,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  useVelocity,
} from "motion/react";
import { GripVertical, LoaderCircle, Lock, Plus, RotateCcw, TriangleAlert } from "lucide-react";

export type RankItem = {
  id: string;
  title: string;
  /** Full name, shown as a monogram. */
  owner: string;
  /** Estimate in weeks; the top items fill the capacity meter. */
  weeks: number;
};

export type PriorityRankListProps = {
  items?: RankItem[];
  eyebrow?: string;
  title?: string;
  /** How many items from the top ship this cycle. */
  cutoff?: number;
  /** Weeks of team capacity the items above the cutoff share. */
  capacityWeeks?: number;
  cycleLabel?: string;
  /** How long the saved confirmation stays, in ms. */
  savedDuration?: number;
  haptics?: boolean;
  disabled?: boolean;
  disabledReason?: string;
  emptyActionLabel?: string;
  /** Renders a frozen state for previews and tests. */
  forceState?: "active" | "loading" | "error" | "success";
  /** Fires after every committed move; return a promise to show saving, reject to restore the previous order. */
  onChange?: (items: RankItem[]) => void | Promise<void>;
  /** Fires once a new order is saved. */
  onComplete?: (items: RankItem[]) => void;
  onEmptyAction?: () => void;
  className?: string;
};

const DEFAULT_ITEMS: RankItem[] = [
  { id: "offline", title: "Offline mode for field notes", owner: "Inês Duarte", weeks: 5 },
  { id: "folders", title: "Shared folders", owner: "Kwame Mensah", weeks: 3 },
  { id: "search", title: "Faster search on Android", owner: "Hana Sato", weeks: 2 },
  { id: "calendar", title: "Calendar sync", owner: "Ravi Kulkarni", weeks: 4 },
  { id: "handwriting", title: "Handwriting to text", owner: "Lena Vogt", weeks: 6 },
  { id: "widgets", title: "Home screen widgets", owner: "Theo Marsh", weeks: 1 },
];

type SaveStatus = "idle" | "saving" | "saved" | "error";

const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--iu-accent) focus-visible:outline-solid";
const SPRING = { type: "spring" as const, stiffness: 400, damping: 22 };

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function buzz(enabled: boolean, pattern: number) {
  if (enabled && typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
    navigator.vibrate(pattern);
  }
}

function move<T>(list: T[], from: number, to: number) {
  const next = [...list];
  const [item] = next.splice(from, 1);
  if (item !== undefined) next.splice(to, 0, item);
  return next;
}

/** A number that rolls up or down when it changes. */
function RollingNumber({ value, className = "" }: { value: number; className?: string }) {
  const [previous, setPrevious] = useState(value);
  const [direction, setDirection] = useState(1);
  if (value !== previous) {
    setDirection(value > previous ? 1 : -1);
    setPrevious(value);
  }
  return (
    <span className={`relative inline-flex overflow-hidden tabular-nums ${className}`}>
      <AnimatePresence initial={false} mode="popLayout" custom={direction}>
        <motion.span
          key={value}
          custom={direction}
          variants={{
            enter: (d: number) => ({ y: `${d * 70}%`, opacity: 0 }),
            center: { y: "0%", opacity: 1 },
            exit: (d: number) => ({ y: `${d * -70}%`, opacity: 0 }),
          }}
          initial="enter"
          animate="center"
          exit="exit"
          className="inline-block"
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

type RowProps = {
  item: RankItem;
  rank: number;
  total: number;
  shipping: boolean;
  grabbed: boolean;
  locked: boolean;
  showLock: boolean;
  instructionsId: string;
  registerHandle: (id: string, node: HTMLButtonElement | null) => void;
  onHandleKey: (event: KeyboardEvent<HTMLButtonElement>, item: RankItem) => void;
  onHandleBlur: (item: RankItem) => void;
  onPointerDragStart: (item: RankItem) => void;
  onPointerDragEnd: (item: RankItem) => void;
};

function RankRow({
  item,
  rank,
  total,
  shipping,
  grabbed,
  locked,
  showLock,
  instructionsId,
  registerHandle,
  onHandleKey,
  onHandleBlur,
  onPointerDragStart,
  onPointerDragEnd,
}: RowProps) {
  const reduceMotion = useReducedMotion();
  const controls = useDragControls();
  const y = useMotionValue(0);
  // The card leans into the direction it is thrown, then settles: a tilt from the drag velocity.
  const velocity = useVelocity(y);
  const lean = useTransform(velocity, [-1400, 0, 1400], [-4, 0, 4], { clamp: true });
  const rotate = useSpring(lean, { stiffness: 400, damping: 18 });
  const [dragging, setDragging] = useState(false);
  const lifted = grabbed || dragging;

  function startDrag(event: PointerEvent<HTMLButtonElement>) {
    if (locked) return;
    controls.start(event);
  }

  return (
    <Reorder.Item
      as="li"
      value={item.id}
      dragListener={false}
      dragControls={controls}
      tabIndex={-1}
      style={{ y, rotate: reduceMotion ? 0 : rotate }}
      animate={{ scale: lifted ? 1.03 : 1 }}
      transition={reduceMotion ? { duration: 0 } : SPRING}
      onDragStart={() => {
        setDragging(true);
        onPointerDragStart(item);
      }}
      onDragEnd={() => {
        setDragging(false);
        onPointerDragEnd(item);
      }}
      data-lifted={lifted || undefined}
      className="relative list-none outline-none data-lifted:z-10"
    >
      <div
        className={`relative flex items-center gap-3 rounded-[max(var(--iu-radius),16px)] border-2 border-(--iu-foreground) bg-(--iu-surface) py-[calc(12px*var(--iu-density))] pr-2 pl-3 transition-shadow duration-150 motion-reduce:transition-none sm:gap-4 sm:pl-4 ${
          lifted
            ? "shadow-[6px_8px_0_0_color-mix(in_oklab,var(--iu-accent)_55%,transparent)]"
            : "shadow-[3px_3px_0_0_var(--iu-foreground)]"
        }`}
      >
        <span
          aria-hidden="true"
          className={`inline-flex size-11 shrink-0 items-center justify-center rounded-full border-2 border-(--iu-foreground) text-lg font-extrabold tracking-[-0.03em] ${
            shipping ? "bg-(--iu-accent) text-(--iu-accent-foreground)" : "bg-(--iu-background) text-(--iu-foreground)"
          }`}
        >
          <RollingNumber value={rank} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] leading-snug font-bold tracking-[-0.01em]">{item.title}</span>
          <span className="mt-1 flex items-center gap-2 text-[13px] text-(--iu-muted)">
            <span className="inline-flex size-5 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--iu-accent)_22%,var(--iu-surface))] text-[9px] font-bold text-(--iu-foreground)">
              {initials(item.owner)}
            </span>
            <span className="truncate">{item.owner}</span>
            <span aria-hidden="true">·</span>
            <span className="shrink-0 font-semibold text-(--iu-foreground) tabular-nums">{item.weeks} wk</span>
          </span>
        </span>
        <AnimatePresence initial={false}>
          {shipping && (
            <motion.span
              key="ships"
              initial={{ scale: 0.6, rotate: -14, opacity: 0 }}
              animate={{ scale: 1, rotate: -6, opacity: 1 }}
              exit={{ scale: 0.6, rotate: 4, opacity: 0 }}
              transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 400, damping: 16 }}
              className="pointer-events-none absolute -top-3 right-14 rounded-full border-2 border-(--iu-foreground) bg-[color-mix(in_oklab,var(--iu-accent)_22%,var(--iu-surface))] px-2 py-0.5 text-[10px] font-extrabold tracking-[0.06em] text-(--iu-foreground) uppercase"
            >
              Ships
            </motion.span>
          )}
        </AnimatePresence>
        <button
          ref={(node) => registerHandle(item.id, node)}
          type="button"
          disabled={showLock}
          aria-disabled={locked || undefined}
          aria-label={`Move ${item.title}, rank ${rank} of ${total}`}
          aria-describedby={instructionsId}
          aria-pressed={grabbed}
          onPointerDown={startDrag}
          onKeyDown={(event) => onHandleKey(event, item)}
          onBlur={() => onHandleBlur(item)}
          style={{ touchAction: "none" }}
          className={`inline-flex size-10 shrink-0 items-center justify-center rounded-full text-(--iu-muted) disabled:cursor-not-allowed disabled:opacity-60 aria-disabled:cursor-not-allowed aria-pressed:bg-(--iu-foreground) aria-pressed:text-(--iu-background) ${
            locked ? "" : "cursor-grab active:cursor-grabbing pointer-fine:hover:bg-(--iu-foreground)/8"
          } ${FOCUS}`}
        >
          {showLock ? (
            <Lock size={18} strokeWidth={1.75} aria-hidden="true" />
          ) : (
            <GripVertical size={20} strokeWidth={2} aria-hidden="true" />
          )}
        </button>
      </div>
    </Reorder.Item>
  );
}

export function PriorityRankList({
  items = DEFAULT_ITEMS,
  eyebrow = "Sprout · Q1 2026",
  title = "Rank what ships first",
  cutoff = 3,
  capacityWeeks = 10,
  cycleLabel = "this quarter",
  savedDuration = 2400,
  haptics = true,
  disabled = false,
  disabledReason = "Ranking is locked while sprint 14 runs. It reopens on 9 Feb.",
  emptyActionLabel = "Add a priority",
  forceState,
  onChange,
  onComplete,
  onEmptyAction,
  className = "",
}: PriorityRankListProps) {
  const reduceMotion = useReducedMotion();
  const titleId = useId();
  const instructionsId = useId();
  const byId = new Map(items.map((item) => [item.id, item]));

  const [order, setOrder] = useState<string[]>(() => items.map((item) => item.id));
  const [grabbedId, setGrabbedId] = useState<string | null>(() =>
    forceState === "active" ? (items[1]?.id ?? null) : null,
  );
  const [status, setStatus] = useState<SaveStatus>(() =>
    forceState === "loading"
      ? "saving"
      : forceState === "success"
        ? "saved"
        : forceState === "error"
          ? "error"
          : "idle",
  );
  const [failedOrder, setFailedOrder] = useState<string[] | null>(null);
  const [announcement, setAnnouncement] = useState("");

  const grabStart = useRef<{ id: string; order: string[] } | null>(null);
  const handles = useRef(new Map<string, HTMLButtonElement>());
  const saveRun = useRef(0);
  const latestOrder = useRef(order);

  useEffect(() => {
    latestOrder.current = order;
  }, [order]);

  useEffect(() => {
    if (status !== "saved" || forceState) return;
    const timer = window.setTimeout(() => setStatus("idle"), savedDuration);
    return () => window.clearTimeout(timer);
  }, [status, savedDuration, forceState]);

  const ordered = order.flatMap((id) => {
    const item = byId.get(id);
    return item ? [item] : [];
  });
  const total = ordered.length;
  const locked = disabled || status === "saving" || Boolean(forceState && forceState !== "active");
  const used = ordered.slice(0, cutoff).reduce((sum, item) => sum + item.weeks, 0);
  const over = used - capacityWeeks;

  const label = (id: string) => byId.get(id)?.title ?? "Item";
  const rankOf = (list: string[], id: string) => list.indexOf(id) + 1;

  async function persist(next: string[], previous: string[]) {
    const run = ++saveRun.current;
    const nextItems = next.flatMap((id) => {
      const item = byId.get(id);
      return item ? [item] : [];
    });
    setFailedOrder(null);
    const result = onChange?.(nextItems);
    if (!result || typeof (result as Promise<void>).then !== "function") {
      setStatus("saved");
      onComplete?.(nextItems);
      buzz(haptics, 12);
      return;
    }
    setStatus("saving");
    try {
      await result;
      if (run !== saveRun.current) return;
      setStatus("saved");
      setAnnouncement("New order saved.");
      buzz(haptics, 12);
      onComplete?.(nextItems);
    } catch {
      if (run !== saveRun.current) return;
      setOrder(previous);
      setFailedOrder(next);
      setStatus("error");
      setAnnouncement("Couldn't save the new order. The previous order is back.");
    }
  }

  function commitIfChanged(id: string, from: string[], to: string[]) {
    if (from.join() === to.join()) {
      setAnnouncement(`${label(id)} dropped. Rank ${rankOf(to, id)} unchanged.`);
      return;
    }
    setAnnouncement(`${label(id)} dropped at rank ${rankOf(to, id)} of ${to.length}.`);
    void persist(to, from);
  }

  function handleKey(event: KeyboardEvent<HTMLButtonElement>, item: RankItem) {
    if (locked) return;
    const grabbed = grabbedId === item.id;
    const index = order.indexOf(item.id);
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      if (event.repeat) return;
      if (!grabbed) {
        grabStart.current = { id: item.id, order };
        setGrabbedId(item.id);
        buzz(haptics, 6);
        setAnnouncement(
          `${item.title} picked up, rank ${index + 1} of ${total}. Use the arrow keys to move, Space to drop, Escape to cancel.`,
        );
      } else {
        const start = grabStart.current;
        grabStart.current = null;
        setGrabbedId(null);
        commitIfChanged(item.id, start?.order ?? order, order);
      }
      return;
    }
    if (!grabbed) return;
    let to = index;
    if (event.key === "ArrowUp" || event.key === "ArrowLeft") to = index - 1;
    else if (event.key === "ArrowDown" || event.key === "ArrowRight") to = index + 1;
    else if (event.key === "Home") to = 0;
    else if (event.key === "End") to = order.length - 1;
    else if (event.key === "Escape") {
      event.preventDefault();
      const start = grabStart.current;
      grabStart.current = null;
      setGrabbedId(null);
      if (start) setOrder(start.order);
      setAnnouncement(`Move cancelled. ${item.title} is back at rank ${rankOf(start?.order ?? order, item.id)}.`);
      return;
    } else return;
    event.preventDefault();
    to = Math.max(0, Math.min(order.length - 1, to));
    if (to === index) return;
    const next = move(order, index, to);
    setOrder(next);
    const crossed = index < cutoff !== to < cutoff;
    setAnnouncement(
      `${item.title}, rank ${to + 1} of ${total}.${crossed ? (to < cutoff ? ` Now ships ${cycleLabel}.` : " Now below the line.") : ""}`,
    );
  }

  function handleBlur(item: RankItem) {
    if (grabbedId !== item.id || forceState) return;
    const start = grabStart.current;
    grabStart.current = null;
    setGrabbedId(null);
    commitIfChanged(item.id, start?.order ?? order, order);
  }

  // Keep focus on the handle after the list re-renders in its new order.
  useEffect(() => {
    if (!grabbedId || forceState) return;
    const handle = handles.current.get(grabbedId);
    if (handle && document.activeElement !== handle) handle.focus();
  }, [order, grabbedId, forceState]);

  const transition = reduceMotion ? { duration: 0 } : SPRING;
  const meter = Math.min(1, used / Math.max(1, capacityWeeks));

  return (
    <MotionConfig reducedMotion="user" transition={transition}>
      <section
        aria-labelledby={titleId}
        className={`w-full font-(family-name:--iu-font) text-(--iu-foreground) ${className}`}
      >
        <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
          <div className="min-w-0">
            <span className="inline-block -rotate-3 rounded-full border-2 border-(--iu-foreground) bg-(--iu-accent) px-3 py-1 text-[11px] font-extrabold tracking-[0.06em] text-(--iu-accent-foreground) uppercase">
              {eyebrow}
            </span>
            <h2
              id={titleId}
              className="mt-3 text-[28px] leading-[1.05] font-extrabold tracking-[-0.035em] text-balance"
            >
              {title}
            </h2>
          </div>
          <div className="w-full sm:w-56">
            <div className="flex items-baseline justify-between gap-3 text-[13px]">
              <span className="font-semibold">Top {cutoff} capacity</span>
              <span className="font-bold tabular-nums">
                <RollingNumber value={used} /> / {capacityWeeks} wk
              </span>
            </div>
            <div
              role="meter"
              aria-label={`Top ${cutoff} capacity`}
              aria-valuemin={0}
              aria-valuemax={capacityWeeks}
              aria-valuenow={Math.min(used, capacityWeeks)}
              aria-valuetext={`${used} of ${capacityWeeks} weeks${over > 0 ? `, over by ${over}` : ""}`}
              className="mt-2 h-3 overflow-hidden rounded-full border-2 border-(--iu-foreground) bg-(--iu-background)"
            >
              <motion.div
                initial={false}
                animate={{ scaleX: meter }}
                className={`h-full origin-left ${over > 0 ? "bg-amber-400 dark:bg-amber-300" : "bg-(--iu-accent)"}`}
              />
            </div>
            <p className="mt-1.5 flex min-h-5 items-center gap-1.5 text-xs text-(--iu-muted)">
              {over > 0 ? (
                <>
                  <TriangleAlert
                    size={14}
                    strokeWidth={2}
                    aria-hidden="true"
                    className="shrink-0 text-amber-700 dark:text-amber-300"
                  />
                  <span className="font-semibold text-amber-800 dark:text-amber-200">Over by {over} wk.</span> Move
                  something down.
                </>
              ) : (
                <>
                  {capacityWeeks - used === 0 ? "Exactly full." : `${capacityWeeks - used} wk free.`} Drag to re-rank.
                </>
              )}
            </p>
          </div>
        </header>

        {disabled && (
          <p className="mt-6 flex items-center gap-2 rounded-full border-2 border-dashed border-(--iu-foreground)/40 px-4 py-2 text-sm text-(--iu-muted)">
            <Lock size={16} strokeWidth={1.75} aria-hidden="true" className="shrink-0" />
            {disabledReason}
          </p>
        )}

        {total === 0 ? (
          <div className="mt-6 flex flex-col items-center rounded-[max(var(--iu-radius),16px)] border-2 border-dashed border-(--iu-foreground)/40 px-6 py-10 text-center">
            <svg aria-hidden="true" width="132" height="72" viewBox="0 0 132 72" fill="none">
              <rect
                x="10"
                y="44"
                width="112"
                height="20"
                rx="10"
                className="fill-(--iu-surface) stroke-(--iu-foreground)"
                strokeWidth="2"
              />
              <rect
                x="26"
                y="22"
                width="80"
                height="18"
                rx="9"
                transform="rotate(-4 66 31)"
                className="fill-[color-mix(in_oklab,var(--iu-accent)_22%,var(--iu-surface))] stroke-(--iu-foreground)"
                strokeWidth="2"
              />
              <circle cx="66" cy="11" r="8" className="fill-(--iu-accent) stroke-(--iu-foreground)" strokeWidth="2" />
            </svg>
            <p className="mt-4 text-lg font-extrabold tracking-[-0.02em]">Nothing to rank yet</p>
            <p className="mt-1 max-w-[32ch] text-sm text-pretty text-(--iu-muted)">
              Add the bets your team is weighing, then drag them into order.
            </p>
            <button
              type="button"
              onClick={onEmptyAction}
              className={`mt-5 inline-flex h-11 items-center gap-2 rounded-full border-2 border-(--iu-foreground) bg-(--iu-accent) px-5 text-sm font-extrabold text-(--iu-accent-foreground) shadow-[3px_3px_0_0_var(--iu-foreground)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none ${FOCUS}`}
            >
              <Plus size={18} strokeWidth={2.25} aria-hidden="true" />
              {emptyActionLabel}
            </button>
          </div>
        ) : (
          <Reorder.Group
            axis="y"
            values={order}
            onReorder={setOrder}
            aria-labelledby={titleId}
            className="mt-6 flex flex-col gap-[calc(14px*var(--iu-density))]"
          >
            {ordered.map((item, index) => (
              <RankRow
                key={item.id}
                item={item}
                rank={index + 1}
                total={total}
                shipping={index < cutoff}
                grabbed={grabbedId === item.id}
                locked={locked}
                showLock={disabled}
                instructionsId={instructionsId}
                registerHandle={(id, node) => {
                  if (node) handles.current.set(id, node);
                  else handles.current.delete(id);
                }}
                onHandleKey={handleKey}
                onHandleBlur={handleBlur}
                onPointerDragStart={(row) => {
                  grabStart.current = { id: row.id, order };
                  buzz(haptics, 6);
                }}
                onPointerDragEnd={(row) => {
                  const start = grabStart.current;
                  grabStart.current = null;
                  // onDragEnd runs a frame after release; read the final order once it has rendered.
                  window.setTimeout(() => {
                    const current = latestOrder.current;
                    commitIfChanged(row.id, start?.order ?? current, current);
                  }, 0);
                }}
              />
            ))}
          </Reorder.Group>
        )}

        <div className="mt-5 flex min-h-11 flex-wrap items-center justify-between gap-3">
          <p id={instructionsId} className="text-xs text-(--iu-muted)">
            {disabled
              ? "View only."
              : grabbedId
                ? `Moving ${label(grabbedId)}: arrow keys to move, Space to drop, Escape to cancel.`
                : total === 0
                  ? "Ranked items save as soon as you drop them."
                  : "Drag a handle, or focus it and press Space, then the arrow keys."}
          </p>
          <AnimatePresence initial={false} mode="wait">
            {status === "saving" && (
              <motion.span
                key="saving"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="inline-flex items-center gap-2 rounded-full border-2 border-(--iu-foreground) px-3 py-1 text-xs font-bold"
              >
                <LoaderCircle
                  size={14}
                  strokeWidth={2.25}
                  aria-hidden="true"
                  className="animate-spin motion-reduce:animate-none"
                />
                Saving order…
              </motion.span>
            )}
            {status === "saved" && (
              <motion.span
                key="saved"
                initial={{ opacity: 0, y: 4, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4 }}
                transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 400, damping: 15 }}
                className="inline-flex items-center gap-2 rounded-full border-2 border-(--iu-foreground) bg-[color-mix(in_oklab,var(--iu-accent)_22%,var(--iu-surface))] px-3 py-1 text-xs font-bold"
              >
                <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <motion.path
                    d="M4 12.5 9.5 18 20 6"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={forceState ? false : { pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={reduceMotion ? { duration: 0 } : { duration: 0.32, delay: 0.08 }}
                  />
                </svg>
                Order saved
              </motion.span>
            )}
            {status === "error" && (
              <motion.span
                key="error"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="inline-flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-red-700 dark:text-red-300"
              >
                <span className="inline-flex items-center gap-1.5">
                  <TriangleAlert size={14} strokeWidth={2} aria-hidden="true" />
                  Couldn&apos;t save. Previous order restored.
                </span>
                <button
                  type="button"
                  disabled={!failedOrder && !forceState}
                  onClick={() => {
                    if (!failedOrder) return;
                    const previous = order;
                    setOrder(failedOrder);
                    void persist(failedOrder, previous);
                  }}
                  className={`inline-flex h-8 items-center gap-1.5 rounded-full border-2 border-current px-3 font-bold pointer-coarse:h-10 ${FOCUS}`}
                >
                  <RotateCcw size={14} strokeWidth={2} aria-hidden="true" />
                  Try again
                </button>
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <p aria-live="polite" className="sr-only">
          {announcement}
        </p>
      </section>
    </MotionConfig>
  );
}

export default PriorityRankList;
