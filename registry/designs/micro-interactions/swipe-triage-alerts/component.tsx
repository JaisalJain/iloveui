"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import {
  AnimatePresence,
  MotionConfig,
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useTransform,
  type MotionValue,
  type PanInfo,
} from "motion/react";
import { Archive, BellCheck, CircleAlert, LoaderCircle, Lock, Trash, Undo2 } from "lucide-react";

export type SwipeAlertSeverity = "critical" | "warning" | "info";

export type SwipeAlert = {
  id: string;
  severity: SwipeAlertSeverity;
  /** Service name, shown in mono. */
  service: string;
  region?: string;
  title: string;
  /** The measured value that tripped the alert, shown in mono. */
  reading: string;
  /** Short age such as "4m" or "2h". */
  age: string;
};

export type SwipeAction = "archive" | "delete";

export type SwipeTriageAlertsProps = {
  items?: SwipeAlert[];
  eyebrow?: string;
  title?: string;
  environment?: string;
  archiveLabel?: string;
  deleteLabel?: string;
  /** Fraction of the row width a slow release must pass to commit (0 to 1). */
  commitThreshold?: number;
  /** Release speed in px/s that commits a shorter swipe in the same direction. */
  velocityThreshold?: number;
  /** How far a row stays open to show its action button, in px. */
  revealWidth?: number;
  /** How long the undo bar stays, in ms. */
  undoDuration?: number;
  /** Calls navigator.vibrate on threshold and success where supported. */
  haptics?: boolean;
  /** View-only mode: rows can be read but not triaged. */
  disabled?: boolean;
  disabledReason?: string;
  emptyActionLabel?: string;
  /** Renders a frozen moment of the gesture for previews and tests. */
  forceState?: "active" | "loading" | "error" | "success";
  /** Runs on commit; return a promise to show the loading state, reject to show the error. */
  onArchive?: (item: SwipeAlert) => void | Promise<void>;
  onDelete?: (item: SwipeAlert) => void | Promise<void>;
  onUndo?: (item: SwipeAlert, action: SwipeAction) => void;
  /** Fires when the undo window closes and the action is final. */
  onComplete?: (item: SwipeAlert, action: SwipeAction) => void;
  onChange?: (items: SwipeAlert[]) => void;
  onEmptyAction?: () => void;
  className?: string;
};

const DEFAULT_ITEMS: SwipeAlert[] = [
  {
    id: "al-4821",
    severity: "critical",
    service: "checkout-api",
    region: "fra1",
    title: "p95 latency above 900 ms",
    reading: "p95 1,284 ms · limit 900 ms",
    age: "4m",
  },
  {
    id: "al-4817",
    severity: "critical",
    service: "ledger-worker",
    region: "iad2",
    title: "Job queue backing up",
    reading: "queue 18,402 · consumers 3 of 8",
    age: "17m",
  },
  {
    id: "al-4809",
    severity: "warning",
    service: "pg-replica-2",
    region: "fra1",
    title: "Replication lag climbing",
    reading: "lag 41.6 s · limit 30 s",
    age: "26m",
  },
  {
    id: "al-4796",
    severity: "warning",
    service: "edge-gw",
    region: "sin1",
    title: "TLS certificate renewal failed",
    reading: "expires 2 Nov 2026 · 6 days left",
    age: "1h",
  },
  {
    id: "al-4788",
    severity: "info",
    service: "search-indexer",
    title: "Reindex finished with skips",
    reading: "skipped 214 of 96,881 docs",
    age: "2h",
  },
];

const SEVERITY: Record<SwipeAlertSeverity, { label: string; text: string; mark: string }> = {
  critical: {
    label: "Crit",
    text: "text-red-700 dark:text-red-400",
    mark: "bg-red-600 dark:bg-red-500",
  },
  warning: {
    label: "Warn",
    text: "text-amber-700 dark:text-amber-300",
    mark: "bg-amber-500 dark:bg-amber-400",
  },
  info: {
    label: "Info",
    text: "text-(--iu-muted)",
    mark: "bg-(--iu-muted)",
  },
};

type Pending = { id: string; action: SwipeAction; phase: "loading" | "error"; message?: string };
type UndoEntry = { item: SwipeAlert; index: number; action: SwipeAction };
type Target = "rest" | "archive-open" | "delete-open" | "commit-archive" | "commit-delete";

const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--iu-accent) focus-visible:outline-solid";
const PAST_WORD: Record<SwipeAction, string> = { archive: "Archived", delete: "Deleted" };

function buzz(enabled: boolean, pattern: number) {
  if (enabled && typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
    navigator.vibrate(pattern);
  }
}

function Kbd({ children }: { children: string }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded-[min(var(--iu-radius),4px)] border border-(--iu-border) bg-(--iu-background) px-1 font-mono text-[10px] text-(--iu-foreground)">
      {children}
    </kbd>
  );
}

/** The fill that tracks how close a drag is to its commit point. */
function ThresholdGauge({ x, threshold, side }: { x: MotionValue<number>; threshold: number; side: SwipeAction }) {
  const fill = useTransform(x, side === "delete" ? [0, -threshold] : [0, threshold], [0, 1], { clamp: true });
  return (
    <span aria-hidden="true" className="relative block h-0.5 w-12 overflow-hidden bg-current/30">
      <motion.span
        className={`absolute inset-0 bg-current ${side === "delete" ? "origin-right" : "origin-left"}`}
        style={{ scaleX: fill }}
      />
    </span>
  );
}

type RowProps = {
  item: SwipeAlert;
  target: Target;
  phase: Pending["phase"] | null;
  pendingAction: SwipeAction | null;
  errorMessage?: string;
  rowWidth: number;
  revealWidth: number;
  commitThreshold: number;
  velocityThreshold: number;
  haptics: boolean;
  disabled: boolean;
  busy: boolean;
  focusable: boolean;
  frozenX?: number;
  archiveLabel: string;
  deleteLabel: string;
  hintId: string;
  registerRow: (id: string, node: HTMLLIElement | null) => void;
  onFocusRow: (id: string) => void;
  onKey: (event: KeyboardEvent<HTMLLIElement>, item: SwipeAlert) => void;
  onSettle: (item: SwipeAlert, target: Target) => void;
  onCommit: (action: SwipeAction, row: SwipeAlert) => void;
};

function SwipeRow({
  item,
  target,
  phase,
  pendingAction,
  errorMessage,
  rowWidth,
  revealWidth,
  commitThreshold,
  velocityThreshold,
  haptics,
  disabled,
  busy,
  focusable,
  frozenX,
  archiveLabel,
  deleteLabel,
  hintId,
  registerRow,
  onFocusRow,
  onKey,
  onSettle,
  onCommit,
}: RowProps) {
  const reduceMotion = useReducedMotion();
  const x = useMotionValue(frozenX ?? (target === "commit-delete" ? -2000 : target === "commit-archive" ? 2000 : 0));
  const releaseVelocity = useRef(0);
  const dragged = useRef(false);
  const [dragging, setDragging] = useState(frozenX !== undefined);
  const thresholdPx = Math.max(revealWidth + 24, rowWidth * commitThreshold);
  const initialArmed: SwipeAction | null =
    frozenX === undefined ? null : frozenX <= -thresholdPx ? "delete" : frozenX >= thresholdPx ? "archive" : null;
  const [armed, setArmed] = useState<SwipeAction | null>(initialArmed);
  const initialX = x.get();
  const [side, setSide] = useState<SwipeAction | null>(initialX > 0 ? "archive" : initialX < 0 ? "delete" : null);
  const severity = SEVERITY[item.severity];

  useMotionValueEvent(x, "change", (value) => {
    const nextSide: SwipeAction | null = value > 0.5 ? "archive" : value < -0.5 ? "delete" : null;
    if (nextSide !== side) setSide(nextSide);
    const next: SwipeAction | null = value <= -thresholdPx ? "delete" : value >= thresholdPx ? "archive" : null;
    if (next !== armed) {
      setArmed(next);
      if (next && dragging) buzz(haptics, 8);
    }
  });

  useEffect(() => {
    if (frozenX !== undefined) return;
    const destination =
      target === "archive-open"
        ? revealWidth
        : target === "delete-open"
          ? -revealWidth
          : target === "commit-archive"
            ? rowWidth + 24
            : target === "commit-delete"
              ? -rowWidth - 24
              : 0;
    const velocity = releaseVelocity.current;
    releaseVelocity.current = 0;
    const controls = animate(
      x,
      destination,
      reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 38, velocity },
    );
    return () => controls.stop();
  }, [target, rowWidth, revealWidth, x, reduceMotion, frozenX]);

  function handleDragEnd(_event: unknown, info: PanInfo) {
    setDragging(false);
    const position = x.get();
    const velocity = info.velocity.x;
    const side: SwipeAction = position < 0 ? "delete" : "archive";
    const sign = position < 0 ? -1 : 1;
    const flung = Math.abs(velocity) > velocityThreshold && Math.sign(velocity) === sign && Math.abs(position) > 24;
    const projected = position + velocity * 0.18;
    releaseVelocity.current = velocity;
    let decision: Target = "rest";
    if (Math.abs(position) >= thresholdPx || flung) decision = side === "delete" ? "commit-delete" : "commit-archive";
    else if (Math.sign(projected) === sign && Math.abs(projected) > revealWidth * 0.6)
      decision = side === "delete" ? "delete-open" : "archive-open";

    if (decision === "commit-delete" || decision === "commit-archive") {
      onCommit(side, item);
      return;
    }
    if (decision === target) {
      const destination = decision === "rest" ? 0 : sign * revealWidth;
      animate(
        x,
        destination,
        reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 38, velocity },
      );
      releaseVelocity.current = 0;
    }
    onSettle(item, decision);
  }

  const open = target === "archive-open" ? "archive" : target === "delete-open" ? "delete" : null;
  const loading = phase === "loading";
  const busyLabel = pendingAction === "archive" ? "Archiving" : "Deleting";

  return (
    <motion.li
      ref={(node) => registerRow(item.id, node)}
      layout="position"
      exit={{ opacity: 0 }}
      transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 400, damping: 34 }}
      tabIndex={focusable ? 0 : -1}
      aria-describedby={hintId}
      aria-busy={loading || undefined}
      onFocus={(event) => {
        if (event.target === event.currentTarget) onFocusRow(item.id);
      }}
      onKeyDown={(event) => onKey(event, item)}
      className="relative overflow-hidden border-b border-dashed border-(--iu-border) outline-offset-[-2px] last:border-b-0 focus-visible:outline-2 focus-visible:outline-(--iu-accent) focus-visible:outline-solid"
    >
      {/* Archive sits behind the left edge, delete behind the right. */}
      <div
        hidden={side !== "archive"}
        aria-hidden={open !== "archive" && pendingAction !== "archive"}
        className="absolute inset-0 flex items-center bg-(--iu-accent) text-(--iu-accent-foreground)"
      >
        <button
          type="button"
          tabIndex={open === "archive" ? 0 : -1}
          disabled={disabled || loading}
          onClick={() => onCommit("archive", item)}
          style={{ width: Math.max(revealWidth, 72) }}
          className={`flex h-full flex-col items-start justify-center gap-1.5 pl-4 text-left font-mono text-[11px] font-medium tracking-[0.08em] uppercase outline-offset-[-4px] focus-visible:outline-2 focus-visible:outline-(--iu-accent-foreground) focus-visible:outline-solid`}
        >
          <span className="flex items-center gap-2 whitespace-nowrap">
            {loading && pendingAction === "archive" ? (
              <LoaderCircle
                size={16}
                strokeWidth={1.5}
                aria-hidden="true"
                className="animate-spin motion-reduce:animate-none"
              />
            ) : (
              <motion.span animate={{ scale: armed === "archive" ? 1.15 : 1 }} className="inline-flex">
                <Archive size={16} strokeWidth={1.5} aria-hidden="true" />
              </motion.span>
            )}
            {loading && pendingAction === "archive"
              ? `${busyLabel}…`
              : armed === "archive"
                ? `Release to ${archiveLabel.toLowerCase()}`
                : archiveLabel}
          </span>
          {!loading && <ThresholdGauge x={x} threshold={thresholdPx} side="archive" />}
        </button>
      </div>
      <div
        hidden={side !== "delete"}
        aria-hidden={open !== "delete" && pendingAction !== "delete"}
        className="absolute inset-0 flex items-center justify-end bg-red-600 text-white dark:bg-red-700"
      >
        <button
          type="button"
          tabIndex={open === "delete" ? 0 : -1}
          disabled={disabled || loading}
          onClick={() => onCommit("delete", item)}
          style={{ width: Math.max(revealWidth, 72) }}
          className="flex h-full flex-col items-end justify-center gap-1.5 pr-4 text-right font-mono text-[11px] font-medium tracking-[0.08em] uppercase outline-offset-[-4px] focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-solid"
        >
          <span className="flex items-center gap-2 whitespace-nowrap">
            {loading && pendingAction === "delete"
              ? `${busyLabel}…`
              : armed === "delete"
                ? `Release to ${deleteLabel.toLowerCase()}`
                : deleteLabel}
            {loading && pendingAction === "delete" ? (
              <LoaderCircle
                size={16}
                strokeWidth={1.5}
                aria-hidden="true"
                className="animate-spin motion-reduce:animate-none"
              />
            ) : (
              <motion.span animate={{ scale: armed === "delete" ? 1.15 : 1 }} className="inline-flex">
                <Trash size={16} strokeWidth={1.5} aria-hidden="true" />
              </motion.span>
            )}
          </span>
          {!loading && <ThresholdGauge x={x} threshold={thresholdPx} side="delete" />}
        </button>
      </div>

      <motion.div
        drag={disabled || busy ? false : "x"}
        dragDirectionLock
        dragMomentum={false}
        style={{ x, touchAction: "pan-y" }}
        onPointerDown={() => {
          dragged.current = false;
        }}
        onDragStart={() => {
          dragged.current = true;
          setDragging(true);
        }}
        onDragEnd={handleDragEnd}
        onClick={() => {
          if (dragged.current) return;
          if (open) onSettle(item, "rest");
        }}
        data-dragging={dragging || undefined}
        className={`relative bg-(--iu-surface) ${disabled ? "" : "cursor-grab active:cursor-grabbing"} data-dragging:bg-[color-mix(in_oklab,var(--iu-foreground)_4%,var(--iu-surface))] data-dragging:ring-1 data-dragging:ring-(--iu-foreground)/20 data-dragging:ring-inset`}
      >
        <div className="grid grid-cols-[3rem_minmax(0,1fr)_auto] items-start gap-3 px-4 py-[calc(14px*var(--iu-density))] select-none">
          <span
            className={`mt-0.5 inline-flex items-center gap-1.5 font-mono text-[10px] font-semibold tracking-[0.08em] uppercase ${severity.text}`}
          >
            <span aria-hidden="true" className={`size-1.5 rounded-[1px] ${severity.mark}`} />
            {severity.label}
          </span>
          <span className="min-w-0">
            <span className="block truncate font-mono text-[11px] text-(--iu-muted)">
              {item.service}
              {item.region ? <span> · {item.region}</span> : null}
            </span>
            <span className="mt-1 block truncate text-sm font-medium text-(--iu-foreground)">{item.title}</span>
            <span className="mt-1 block truncate font-mono text-[11px] text-(--iu-muted) tabular-nums">
              {item.reading}
            </span>
          </span>
          <span className="mt-0.5 font-mono text-[11px] text-(--iu-muted) tabular-nums">{item.age}</span>
        </div>
        {phase === "error" && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-dashed border-red-600/40 px-4 py-2 pl-[4.75rem] text-xs text-red-700 dark:border-red-400/40 dark:text-red-300">
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <CircleAlert size={14} strokeWidth={1.5} aria-hidden="true" className="shrink-0" />
              <span className="text-pretty">{errorMessage}</span>
            </span>
            <button
              type="button"
              onClick={() => onCommit(pendingAction ?? "delete", item)}
              className={`-my-1 inline-flex h-7 items-center rounded-[min(var(--iu-radius),4px)] px-1.5 font-medium underline underline-offset-2 pointer-coarse:h-10 ${FOCUS}`}
            >
              Retry
            </button>
          </div>
        )}
      </motion.div>
    </motion.li>
  );
}

export function SwipeTriageAlerts({
  items = DEFAULT_ITEMS,
  eyebrow = "Nightjar on-call",
  title = "Open alerts",
  environment = "production",
  archiveLabel = "Archive",
  deleteLabel = "Delete",
  commitThreshold = 0.45,
  velocityThreshold = 650,
  revealWidth = 96,
  undoDuration = 5000,
  haptics = true,
  disabled = false,
  disabledReason = "View only. Ask an on-call lead for triage access.",
  emptyActionLabel = "View archived alerts",
  forceState,
  onArchive,
  onDelete,
  onUndo,
  onComplete,
  onChange,
  onEmptyAction,
  className = "",
}: SwipeTriageAlertsProps) {
  const reduceMotion = useReducedMotion();
  const titleId = useId();
  const hintId = useId();
  const forcedIndex = Math.min(1, Math.max(0, items.length - 1));
  const forcedItem = items[forcedIndex];

  const [list, setList] = useState<SwipeAlert[]>(() =>
    forceState === "success" ? items.filter((_, index) => index !== forcedIndex) : items,
  );
  const [pending, setPending] = useState<Pending | null>(() =>
    forcedItem && (forceState === "loading" || forceState === "error")
      ? {
          id: forcedItem.id,
          action: "delete",
          phase: forceState,
          message: `Couldn't delete: ${forcedItem.service} is linked to open incident INC-2291.`,
        }
      : null,
  );
  const [undo, setUndo] = useState<UndoEntry | null>(() =>
    forceState === "success" && forcedItem ? { item: forcedItem, index: forcedIndex, action: "delete" } : null,
  );
  const [remaining, setRemaining] = useState(() => (forceState === "success" ? undoDuration * 0.62 : undoDuration));
  const [paused, setPaused] = useState(false);
  const [revealed, setRevealed] = useState<{ id: string; side: SwipeAction } | null>(null);
  const [activeId, setActiveId] = useState<string | null>(items[0]?.id ?? null);
  const [announcement, setAnnouncement] = useState("");
  const [rowWidth, setRowWidth] = useState(560);

  const isEmpty = list.length === 0;
  const listRef = useRef<HTMLUListElement>(null);
  const rows = useRef(new Map<string, HTMLLIElement>());
  const focusNext = useRef<string | null>(null);
  const latest = useRef({ list, pending, undo });

  useEffect(() => {
    latest.current = { list, pending, undo };
  });

  useEffect(() => {
    const node = listRef.current;
    if (!node || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width) setRowWidth(width);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [isEmpty]);

  // Move focus after a row leaves or comes back, once the list has rendered.
  useEffect(() => {
    const id = focusNext.current;
    if (!id) return;
    focusNext.current = null;
    rows.current.get(id)?.focus();
  }, [list]);

  // The undo window: counts down in 100ms steps, pauses while hovered or focused.
  useEffect(() => {
    if (!undo || paused || forceState) return;
    const timer = window.setInterval(() => setRemaining((value) => value - 100), 100);
    return () => window.clearInterval(timer);
  }, [undo, paused, forceState]);

  useEffect(() => {
    if (!undo || remaining > 0) return;
    const entry = undo;
    const timer = window.setTimeout(() => {
      setUndo((current) => (current === entry ? null : current));
      onComplete?.(entry.item, entry.action);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [remaining, undo, onComplete]);

  function finalizeUndo() {
    const entry = latest.current.undo;
    if (!entry) return;
    setUndo(null);
    onComplete?.(entry.item, entry.action);
  }

  async function commit(action: SwipeAction, item: SwipeAlert) {
    if (disabled || forceState) return;
    if (latest.current.pending?.phase === "loading") return;
    finalizeUndo();
    setRevealed(null);
    setPending({ id: item.id, action, phase: "loading" });
    setAnnouncement(`${action === "delete" ? "Deleting" : "Archiving"} ${item.title}`);
    const handler = action === "delete" ? onDelete : onArchive;
    try {
      await Promise.all([
        handler?.(item),
        new Promise((resolve) => window.setTimeout(resolve, reduceMotion ? 0 : 220)),
      ]);
    } catch (error) {
      const reason =
        error instanceof Error && error.message ? error.message : `Couldn't ${action} this alert. Try again.`;
      setPending({ id: item.id, action, phase: "error", message: reason });
      setAnnouncement(`${reason} ${item.title} is back in the list.`);
      return;
    }
    const current = latest.current.list;
    const index = current.findIndex((candidate) => candidate.id === item.id);
    const next = current.filter((candidate) => candidate.id !== item.id);
    const hadFocus = typeof document !== "undefined" && rows.current.get(item.id)?.contains(document.activeElement);
    const neighbour = next[Math.min(Math.max(index, 0), next.length - 1)];
    if (neighbour) {
      setActiveId(neighbour.id);
      if (hadFocus) focusNext.current = neighbour.id;
    }
    setPending(null);
    setList(next);
    setUndo({ item, index, action });
    setRemaining(undoDuration);
    setAnnouncement(`${PAST_WORD[action]} ${item.title}. Press Z to undo.`);
    buzz(haptics, 14);
    onChange?.(next);
  }

  function restore() {
    const entry = latest.current.undo;
    if (!entry) return;
    const current = latest.current.list;
    const next = [...current];
    next.splice(Math.min(entry.index, next.length), 0, entry.item);
    setUndo(null);
    setList(next);
    setActiveId(entry.item.id);
    focusNext.current = entry.item.id;
    setAnnouncement(`Restored ${entry.item.title}.`);
    onUndo?.(entry.item, entry.action);
    onChange?.(next);
  }

  function settle(item: SwipeAlert, target: Target) {
    if (target === "archive-open") setRevealed({ id: item.id, side: "archive" });
    else if (target === "delete-open") setRevealed({ id: item.id, side: "delete" });
    else setRevealed((current) => (current?.id === item.id ? null : current));
    if (pending?.id === item.id && pending.phase === "error") setPending(null);
  }

  function handleRowKey(event: KeyboardEvent<HTMLLIElement>, item: SwipeAlert) {
    const onRow = event.target === event.currentTarget;
    const index = list.findIndex((candidate) => candidate.id === item.id);
    const side = revealed?.id === item.id ? revealed.side : null;
    const move = (to: number) => {
      const next = list[Math.max(0, Math.min(list.length - 1, to))];
      if (!next) return;
      event.preventDefault();
      setRevealed(null);
      setActiveId(next.id);
      rows.current.get(next.id)?.focus();
    };
    switch (event.key) {
      case "ArrowDown":
        return move(index + 1);
      case "ArrowUp":
        return move(index - 1);
      case "Home":
        return move(0);
      case "End":
        return move(list.length - 1);
      case "Escape":
        if (side) {
          event.preventDefault();
          setRevealed(null);
          rows.current.get(item.id)?.focus();
        }
        return;
    }
    if (disabled || forceState) return;
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      const toward: SwipeAction = event.key === "ArrowLeft" ? "delete" : "archive";
      if (side === toward) void commit(toward, item);
      else if (side) setRevealed(null);
      else setRevealed({ id: item.id, side: toward });
      return;
    }
    if (!onRow) return;
    if (event.key === "Enter" && side) {
      event.preventDefault();
      void commit(side, item);
    } else if (event.key === "e" || event.key === "E") {
      event.preventDefault();
      void commit("archive", item);
    } else if (event.key === "Delete" || event.key === "Backspace") {
      event.preventDefault();
      void commit("delete", item);
    }
  }

  function handleListKey(event: KeyboardEvent<HTMLElement>) {
    const undoKey = (event.key === "z" || event.key === "Z") && !event.altKey && !event.shiftKey;
    if (undoKey && latest.current.undo) {
      event.preventDefault();
      restore();
    }
  }

  function targetFor(item: SwipeAlert): Target {
    if (pending?.id === item.id && pending.phase === "loading") {
      return pending.action === "delete" ? "commit-delete" : "commit-archive";
    }
    if (revealed?.id === item.id) return revealed.side === "delete" ? "delete-open" : "archive-open";
    return "rest";
  }

  const transition = reduceMotion ? { duration: 0 } : { type: "spring" as const, stiffness: 400, damping: 30 };
  const focusId = list.some((item) => item.id === activeId) ? activeId : (list[0]?.id ?? null);
  const seconds = Math.max(0, Math.ceil(remaining / 1000));

  return (
    <MotionConfig reducedMotion="user" transition={transition}>
      <section
        aria-labelledby={titleId}
        onKeyDown={handleListKey}
        className={`relative w-full font-(family-name:--iu-font) text-(--iu-foreground) ${className}`}
      >
        <div className="relative overflow-hidden rounded-[min(var(--iu-radius),8px)] border border-(--iu-border) bg-(--iu-surface) dark:border-(--iu-foreground)/14">
          <header className="flex items-end justify-between gap-4 border-b border-(--iu-border) px-4 pt-4 pb-3">
            <div className="min-w-0">
              <p className="font-mono text-[10px] font-medium tracking-[0.08em] text-(--iu-muted) uppercase">
                {eyebrow}
              </p>
              <h2 id={titleId} className="mt-1 text-lg font-semibold tracking-[-0.02em] text-balance">
                {title}
              </h2>
            </div>
            <p className="shrink-0 font-mono text-[11px] text-(--iu-muted) tabular-nums">
              <span className="text-(--iu-foreground)">{list.length}</span> open · {environment}
            </p>
          </header>

          {disabled && (
            <p className="flex items-center gap-2 border-b border-dashed border-(--iu-border) bg-(--iu-background) px-4 py-2.5 text-xs text-(--iu-muted)">
              <Lock size={14} strokeWidth={1.5} aria-hidden="true" className="shrink-0" />
              {disabledReason}
            </p>
          )}

          {list.length === 0 ? (
            <div className="flex flex-col items-start gap-4 px-4 py-10 sm:px-6">
              <svg
                aria-hidden="true"
                width="120"
                height="56"
                viewBox="0 0 120 56"
                fill="none"
                className="text-(--iu-muted)"
              >
                <path d="M1 44h22l6-14 8 24 8-40 7 30h68" stroke="currentColor" strokeWidth="1.25" opacity="0.5" />
                <path d="M1 44h118" stroke="currentColor" strokeDasharray="2 4" strokeWidth="1" opacity="0.4" />
                <rect x="78" y="22" width="22" height="22" rx="2" className="fill-(--iu-accent)" />
                <path d="m84 33 4 4 7-8" className="stroke-(--iu-accent-foreground)" strokeWidth="1.75" />
              </svg>
              <div>
                <p className="text-base font-semibold tracking-[-0.01em]">Nothing is paging {environment}.</p>
                <p className="mt-1 max-w-[36ch] text-sm text-pretty text-(--iu-muted)">
                  Every alert is triaged. New ones land here as they fire.
                </p>
              </div>
              <button
                type="button"
                onClick={onEmptyAction}
                className={`inline-flex h-9 items-center gap-2 rounded-[min(var(--iu-radius),6px)] border border-(--iu-foreground)/35 px-3 text-sm font-medium pointer-coarse:h-10 pointer-fine:hover:bg-(--iu-foreground)/6 ${FOCUS}`}
              >
                <BellCheck size={16} strokeWidth={1.5} aria-hidden="true" />
                {emptyActionLabel}
              </button>
            </div>
          ) : (
            <ul ref={listRef} aria-labelledby={titleId} className="relative">
              <AnimatePresence initial={false}>
                {list.map((item, index) => {
                  const isPending = pending?.id === item.id;
                  return (
                    <SwipeRow
                      key={item.id}
                      item={item}
                      target={targetFor(item)}
                      phase={isPending ? pending.phase : null}
                      pendingAction={isPending ? pending.action : null}
                      errorMessage={isPending ? pending.message : undefined}
                      rowWidth={rowWidth}
                      revealWidth={revealWidth}
                      commitThreshold={commitThreshold}
                      velocityThreshold={velocityThreshold}
                      haptics={haptics}
                      disabled={disabled}
                      busy={Boolean(forceState) || pending?.phase === "loading"}
                      focusable={item.id === focusId}
                      frozenX={
                        forceState === "active" && index === forcedIndex ? -Math.round(revealWidth * 1.7) : undefined
                      }
                      archiveLabel={archiveLabel}
                      deleteLabel={deleteLabel}
                      hintId={hintId}
                      registerRow={(id, node) => {
                        if (node) rows.current.set(id, node);
                        else rows.current.delete(id);
                      }}
                      onFocusRow={setActiveId}
                      onKey={handleRowKey}
                      onSettle={settle}
                      onCommit={(action, row) => void commit(action, row)}
                    />
                  );
                })}
              </AnimatePresence>
            </ul>
          )}

          <AnimatePresence initial={false}>
            {undo && (
              <motion.div
                key={undo.item.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={reduceMotion ? { duration: 0 } : { duration: 0.16, ease: [0.2, 0.8, 0.2, 1] }}
                onPointerEnter={() => setPaused(true)}
                onPointerLeave={() => setPaused(false)}
                onFocus={() => setPaused(true)}
                onBlur={() => setPaused(false)}
                className="relative flex items-center justify-between gap-3 border-t border-(--iu-border) bg-(--iu-background) px-4 py-2.5"
              >
                <span aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-(--iu-foreground)/10">
                  <span
                    className="block h-px origin-left bg-(--iu-accent) transition-transform duration-100 ease-linear motion-reduce:transition-none"
                    style={{ transform: `scaleX(${Math.max(0, remaining / undoDuration)})` }}
                  />
                </span>
                <span className="flex min-w-0 items-center gap-2 text-sm">
                  {undo.action === "delete" ? (
                    <Trash size={16} strokeWidth={1.5} aria-hidden="true" className="shrink-0 text-(--iu-muted)" />
                  ) : (
                    <Archive size={16} strokeWidth={1.5} aria-hidden="true" className="shrink-0 text-(--iu-muted)" />
                  )}
                  <span className="shrink-0 font-medium">{PAST_WORD[undo.action]}</span>
                  <span className="truncate font-mono text-[11px] text-(--iu-muted)">{undo.item.service}</span>
                </span>
                <span className="flex shrink-0 items-center gap-3">
                  <span className="font-mono text-[11px] text-(--iu-muted) tabular-nums">{seconds}s</span>
                  <button
                    type="button"
                    onClick={restore}
                    aria-keyshortcuts="Z"
                    className={`inline-flex h-8 items-center gap-2 rounded-[min(var(--iu-radius),6px)] border border-(--iu-foreground)/35 bg-(--iu-surface) pr-1.5 pl-2.5 text-sm font-medium pointer-coarse:h-10 pointer-fine:hover:bg-[color-mix(in_oklab,var(--iu-foreground)_6%,var(--iu-surface))] ${FOCUS}`}
                  >
                    <Undo2 size={16} strokeWidth={1.5} aria-hidden="true" />
                    Undo
                    <Kbd>Z</Kbd>
                  </button>
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p id={hintId} className="sr-only">
          {disabled
            ? "View only."
            : `Swipe left to ${deleteLabel.toLowerCase()}, right to ${archiveLabel.toLowerCase()}. Or press the left or right arrow twice, E to ${archiveLabel.toLowerCase()}, Delete to ${deleteLabel.toLowerCase()}, Z to undo.`}
        </p>
        <div
          aria-hidden="true"
          hidden={disabled || isEmpty}
          className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 px-1 font-mono text-[10px] tracking-[0.04em] text-(--iu-muted) uppercase"
        >
          <span className="inline-flex items-center gap-1.5">
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd> Move
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Kbd>←</Kbd>
            <Kbd>→</Kbd> Reveal, again to commit
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Kbd>E</Kbd> {archiveLabel}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Kbd>⌫</Kbd> {deleteLabel}
          </span>
        </div>

        <p aria-live="polite" className="sr-only">
          {announcement}
        </p>
      </section>
    </MotionConfig>
  );
}

export default SwipeTriageAlerts;
