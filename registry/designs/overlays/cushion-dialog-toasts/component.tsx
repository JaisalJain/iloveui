"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";
import {
  AnimatePresence,
  MotionConfig,
  animate,
  motion,
  useDragControls,
  useMotionValue,
  useReducedMotion,
  type MotionValue,
  type PanInfo,
} from "motion/react";
import { CalendarClock, CircleAlert, CircleCheck, Globe, LoaderCircle, Undo2, X } from "lucide-react";

export type CushionIssue = {
  id: string;
  number: number;
  title: string;
  words: number;
  edited: string;
};

export type CushionDay = { id: string; label: string; date: string; long: string; isToday?: boolean };

export type CushionSlot = {
  time: string;
  /** Predicted open rate, 0 to 100. */
  opens: number;
  /** Disabled on the "today" option once the time has passed. */
  passedToday?: boolean;
};

export type CushionSchedule = { issueId: string; dayId: string; time: string; readerTimeZone: boolean };

export type CushionToast = {
  id: string;
  title: string;
  description?: string;
  tone?: "success" | "info";
  actionLabel?: string;
  /** Milliseconds before it leaves on its own; null keeps it until dismissed. */
  duration?: number | null;
};

export type CushionDialogToastsProps = {
  brand?: string;
  author?: string;
  audience?: number;
  homeTimeZone?: string;
  issues?: CushionIssue[];
  days?: CushionDay[];
  slots?: CushionSlot[];
  defaultDayId?: string;
  defaultTime?: string;
  /** Opens the dialog for this issue on first render (focus is moved in only when a person opens it). */
  defaultOpenIssueId?: string | null;
  /** Issues that already have a send slot. */
  defaultScheduled?: CushionSchedule[];
  initialToasts?: CushionToast[];
  /** Keeps the toast stack fanned out and paused, as in a notification center or a screenshot. */
  stackExpanded?: boolean;
  /** Forces the dialog's request state, for loading and error screens. */
  status?: "idle" | "loading" | "error";
  errorMessage?: string;
  /** Called on Schedule; return a promise to show the loading state, reject it to show the error. */
  onSchedule?: (schedule: CushionSchedule) => void | Promise<void>;
  onUndo?: (issueId: string) => void;
  onOpenChange?: (open: boolean) => void;
  className?: string;
};

const DEFAULT_ISSUES: CushionIssue[] = [
  { id: "48", number: 48, title: "The slow web, part two", words: 1284, edited: "Edited 12 min ago" },
  { id: "49", number: 49, title: "Notes from a 4 kB homepage", words: 932, edited: "Edited yesterday" },
  { id: "50", number: 50, title: "What we cut from the editor", words: 2106, edited: "Edited 21 Oct" },
];

const DEFAULT_DAYS: CushionDay[] = [
  { id: "tue", label: "Today", date: "Tue 27", long: "Tue 27 Oct", isToday: true },
  { id: "wed", label: "Tomorrow", date: "Wed 28", long: "Wed 28 Oct" },
  { id: "thu", label: "Thursday", date: "Thu 29", long: "Thu 29 Oct" },
];

const DEFAULT_SLOTS: CushionSlot[] = [
  { time: "07:30", opens: 38, passedToday: true },
  { time: "09:00", opens: 46, passedToday: true },
  { time: "12:15", opens: 31 },
  { time: "17:45", opens: 27 },
];

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])';
const TOAST_HEIGHT = 76;
const TOAST_GAP = 10;
const PEEK = 14;

/* The cushion material: same-hue tints, a 3:1 control line, layered soft depth and pressed insets, for both modes. */
const MATERIAL = [
  "[--cd-line:color-mix(in_oklab,var(--iu-foreground)_42%,transparent)]",
  "[--cd-well:color-mix(in_oklab,var(--iu-accent)_4%,color-mix(in_oklab,var(--iu-foreground)_3%,var(--iu-surface)))]",
  "[--cd-tint:color-mix(in_oklab,var(--iu-accent)_10%,var(--iu-surface))]",
  "[--cd-raised:var(--iu-surface)]",
  "[--cd-sh-card:0_1px_1px_color-mix(in_oklab,black_4%,transparent),0_8px_20px_-10px_color-mix(in_oklab,black_14%,transparent)]",
  "[--cd-sh-panel:inset_0_1px_0_color-mix(in_oklab,white_70%,transparent),0_2px_4px_color-mix(in_oklab,black_5%,transparent),0_32px_72px_-24px_color-mix(in_oklab,black_32%,transparent)]",
  "[--cd-sh-thumb:0_1px_2px_color-mix(in_oklab,black_10%,transparent),0_4px_10px_-3px_color-mix(in_oklab,black_14%,transparent)]",
  "[--cd-sh-well:inset_0_1px_3px_color-mix(in_oklab,black_8%,transparent)]",
  "[--cd-sh-btn:inset_0_1px_0_color-mix(in_oklab,white_32%,transparent),inset_0_-2px_0_color-mix(in_oklab,black_10%,transparent),0_1px_2px_color-mix(in_oklab,black_12%,transparent),0_10px_20px_-10px_color-mix(in_oklab,var(--iu-accent)_70%,transparent)]",
  "[--cd-sh-pressed:inset_0_2px_5px_color-mix(in_oklab,black_28%,transparent),inset_0_1px_1px_color-mix(in_oklab,black_16%,transparent),0_0_0_0_transparent,0_0_0_0_transparent]",
  "[--cd-sh-toast:0_1px_2px_color-mix(in_oklab,black_6%,transparent),0_14px_32px_-12px_color-mix(in_oklab,black_26%,transparent)]",
  "dark:[--cd-line:color-mix(in_oklab,var(--iu-foreground)_38%,transparent)]",
  "dark:[--cd-well:color-mix(in_oklab,var(--iu-accent)_3%,color-mix(in_oklab,var(--iu-background)_55%,var(--iu-surface)))]",
  "dark:[--cd-tint:color-mix(in_oklab,var(--iu-accent)_16%,var(--iu-surface))]",
  "dark:[--cd-raised:color-mix(in_oklab,var(--iu-foreground)_5%,var(--iu-surface))]",
  "dark:[--cd-sh-card:inset_0_1px_0_color-mix(in_oklab,white_4%,transparent),0_12px_28px_-16px_color-mix(in_oklab,black_70%,transparent)]",
  "dark:[--cd-sh-panel:inset_0_1px_0_color-mix(in_oklab,white_7%,transparent),0_32px_72px_-24px_color-mix(in_oklab,black_80%,transparent)]",
  "dark:[--cd-sh-thumb:inset_0_1px_0_color-mix(in_oklab,white_9%,transparent),0_1px_2px_color-mix(in_oklab,black_45%,transparent),0_4px_10px_-3px_color-mix(in_oklab,black_50%,transparent)]",
  "dark:[--cd-sh-well:inset_0_1px_2px_color-mix(in_oklab,black_45%,transparent)]",
  "dark:[--cd-sh-btn:inset_0_1px_0_color-mix(in_oklab,white_26%,transparent),inset_0_-2px_0_color-mix(in_oklab,black_14%,transparent),0_1px_2px_color-mix(in_oklab,black_40%,transparent),0_10px_20px_-10px_color-mix(in_oklab,var(--iu-accent)_35%,transparent)]",
  "dark:[--cd-sh-pressed:inset_0_2px_6px_color-mix(in_oklab,black_45%,transparent),inset_0_1px_1px_color-mix(in_oklab,black_30%,transparent),0_0_0_0_transparent,0_0_0_0_transparent]",
  "dark:[--cd-sh-toast:inset_0_1px_0_color-mix(in_oklab,white_6%,transparent),0_16px_36px_-12px_color-mix(in_oklab,black_80%,transparent)]",
].join(" ");

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--iu-accent)";

const PRIMARY = [
  "relative inline-grid h-11 items-center rounded-full bg-(--iu-accent) px-5 text-sm font-semibold text-(--iu-accent-foreground) shadow-(--cd-sh-btn)",
  "transition-[translate,scale,box-shadow,filter] duration-200 ease-out motion-reduce:transition-none",
  "pointer-fine:hover:-translate-y-px pointer-fine:hover:brightness-105 active:translate-y-0 active:scale-[0.97] active:shadow-(--cd-sh-pressed)",
  "disabled:cursor-progress disabled:active:scale-100",
  FOCUS,
].join(" ");

const QUIET = [
  "inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-medium text-(--iu-foreground)",
  "transition-[background-color,scale] duration-200 ease-out motion-reduce:transition-none",
  "pointer-fine:hover:bg-(--iu-foreground)/6 active:scale-[0.97] disabled:opacity-50",
  FOCUS,
].join(" ");

const OUTLINE = [
  "inline-flex h-10 items-center justify-center gap-2 rounded-full border border-(--cd-line) bg-(--cd-raised) px-4 text-sm font-medium text-(--iu-foreground) shadow-(--cd-sh-card)",
  "transition-[translate,scale,box-shadow,background-color] duration-200 ease-out motion-reduce:transition-none",
  "pointer-fine:hover:-translate-y-px active:translate-y-0 active:scale-[0.97] active:shadow-(--cd-sh-pressed)",
  FOCUS,
].join(" ");

const SLOT = [
  "group/slot relative flex cursor-pointer flex-col gap-2 rounded-[max(var(--iu-radius),16px)] border border-(--iu-border) bg-(--iu-surface) p-3 transition-[translate,box-shadow,border-color,background-color] duration-200 ease-out motion-reduce:transition-none dark:border-(--iu-foreground)/12 dark:bg-transparent",
  "has-checked:border-(--iu-foreground)/60 has-checked:bg-(--cd-tint) has-checked:shadow-(--cd-sh-card) dark:has-checked:border-(--iu-foreground)/50 dark:has-checked:bg-(--cd-tint)",
  "has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-(--iu-accent)",
  "pointer-fine:hover:-translate-y-px data-passed:cursor-not-allowed data-passed:border-dashed data-passed:bg-transparent pointer-fine:data-passed:hover:translate-y-0",
].join(" ");

const SWITCH = [
  "group/switch relative h-8 w-[52px] shrink-0 rounded-full border border-(--cd-line) bg-(--cd-well) shadow-(--cd-sh-well)",
  "transition-colors duration-200 motion-reduce:transition-none pointer-coarse:h-10 pointer-coarse:w-16",
  "data-on:border-transparent data-on:bg-(--iu-accent) data-on:shadow-none disabled:opacity-60",
  FOCUS,
].join(" ");

const KNOB = [
  "absolute top-[3px] left-[3px] size-6 rounded-full bg-(--iu-surface) shadow-(--cd-sh-thumb)",
  "transition-transform duration-300 ease-[cubic-bezier(0.3,1.35,0.5,1)] motion-reduce:transition-none",
  "group-data-on/switch:translate-x-5 pointer-coarse:top-[5px] pointer-coarse:left-[5px] pointer-coarse:size-7 pointer-coarse:group-data-on/switch:translate-x-6",
].join(" ");

function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

function formatCount(value: number) {
  return value.toLocaleString("en-US");
}

function useSmallScreen() {
  const [small, setSmall] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 639px)");
    const update = () => setSmall(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return small;
}

function PaperlaneMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-7">
      <rect width="24" height="24" rx="8" className="fill-(--iu-accent)" />
      <path
        d="M6.5 11.6 17.2 7l-3.4 10.4-2.6-4.1-4.7-1.7Z"
        className="fill-(--iu-accent-foreground)"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ---------------------------------------------------------------- toasts */

function ToastCard({
  toast,
  index,
  count,
  expanded,
  paused,
  onDismiss,
  onAction,
}: {
  toast: CushionToast;
  index: number;
  count: number;
  expanded: boolean;
  paused: boolean;
  onDismiss: (id: string) => void;
  onAction: (toast: CushionToast) => void;
}) {
  const progress = useMotionValue(1);
  const duration = toast.duration === undefined ? 6000 : toast.duration;

  useEffect(() => {
    if (duration === null || paused) return;
    const controls = animate(progress, 0, {
      duration: (progress.get() * duration) / 1000,
      ease: "linear",
      onComplete: () => onDismiss(toast.id),
    });
    return () => controls.stop();
  }, [duration, paused, progress, onDismiss, toast.id]);

  const behind = !expanded && index > 0;
  const y = expanded ? -index * (TOAST_HEIGHT + TOAST_GAP) : -index * PEEK;
  const Icon = toast.tone === "info" ? Undo2 : CircleCheck;

  return (
    <motion.li
      initial={{ opacity: 0, y: 32, scale: 0.94 }}
      animate={{ opacity: index > 2 && !expanded ? 0 : 1, y, scale: expanded ? 1 : 1 - index * 0.05 }}
      exit={{ opacity: 0, y: y + 12, scale: 0.94, transition: { duration: 0.16 } }}
      style={{ zIndex: count - index }}
      className="absolute inset-x-0 bottom-0 origin-bottom"
    >
      <div
        className={cx(
          "flex h-[76px] items-center gap-3 rounded-[max(var(--iu-radius),18px)] border border-(--iu-border) bg-(--cd-raised) py-3 pr-3 pl-3.5 shadow-(--cd-sh-toast) dark:border-(--iu-foreground)/10",
          behind && "[&>*]:opacity-0",
        )}
      >
        <span
          aria-hidden="true"
          className={cx(
            "grid size-9 shrink-0 place-items-center rounded-full",
            toast.tone === "info"
              ? "bg-(--iu-foreground)/8 text-(--iu-foreground)"
              : "bg-emerald-600/12 text-emerald-700 dark:bg-emerald-400/14 dark:text-emerald-300",
          )}
        >
          <Icon size={18} strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm/5 font-semibold">{toast.title}</p>
          {toast.description ? <p className="truncate text-[13px]/5 text-(--iu-muted)">{toast.description}</p> : null}
        </div>
        {toast.actionLabel ? (
          <button
            type="button"
            onClick={() => onAction(toast)}
            className={cx(
              "h-8 shrink-0 rounded-full bg-(--iu-foreground)/7 px-3 text-[13px] font-semibold transition-[background-color,scale] duration-150 active:scale-[0.96] motion-reduce:transition-none pointer-coarse:h-10 pointer-fine:hover:bg-(--iu-foreground)/12",
              FOCUS,
            )}
          >
            {toast.actionLabel}
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => onDismiss(toast.id)}
          aria-label={`Dismiss: ${toast.title}`}
          className={cx(
            "relative grid size-8 shrink-0 place-items-center rounded-full text-(--iu-muted) transition-colors duration-150 motion-reduce:transition-none pointer-coarse:size-10 pointer-fine:hover:text-(--iu-foreground)",
            FOCUS,
          )}
        >
          {duration !== null ? <CountdownRing progress={progress} /> : null}
          <X size={14} strokeWidth={1.75} aria-hidden="true" />
        </button>
      </div>
    </motion.li>
  );
}

function CountdownRing({ progress }: { progress: MotionValue<number> }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 32 32" className="absolute inset-0 size-full -rotate-90">
      <circle cx="16" cy="16" r="14" fill="none" strokeWidth="2" className="stroke-(--iu-foreground)/10" />
      <motion.circle
        cx="16"
        cy="16"
        r="14"
        fill="none"
        strokeWidth="2"
        strokeLinecap="round"
        className="stroke-(--iu-accent)"
        style={{ pathLength: progress }}
      />
    </svg>
  );
}

function ToastStack({
  toasts,
  pinned,
  inert,
  listRef,
  onDismiss,
  onAction,
  onClear,
}: {
  toasts: CushionToast[];
  pinned: boolean;
  inert: boolean;
  listRef: RefObject<HTMLOListElement | null>;
  onDismiss: (id: string) => void;
  onAction: (toast: CushionToast) => void;
  onClear: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(false);
  const expanded = (pinned || hovered || focused) && toasts.length > 0;
  const paused = expanded || hidden;

  useEffect(() => {
    const update = () => setHidden(document.visibilityState === "hidden");
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  // When the last toast leaves, forget the hover and focus so the next one arrives collapsed.
  const [count, setCount] = useState(toasts.length);
  if (count !== toasts.length) {
    setCount(toasts.length);
    if (toasts.length === 0) {
      setHovered(false);
      setFocused(false);
    }
  }

  const height = expanded
    ? toasts.length * (TOAST_HEIGHT + TOAST_GAP) - TOAST_GAP
    : toasts.length === 0
      ? 0
      : TOAST_HEIGHT + Math.min(toasts.length - 1, 2) * PEEK;

  return (
    <section
      aria-label="Notifications"
      inert={inert}
      className="pointer-events-none fixed inset-x-4 bottom-4 z-[60] sm:right-6 sm:bottom-6 sm:left-auto sm:w-[384px]"
    >
      <AnimatePresence initial={false}>
        {expanded && toasts.length > 1 ? (
          <motion.div
            key="bar"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.16 }}
            style={{ bottom: height + 8 }}
            className="pointer-events-auto absolute inset-x-0 flex h-10 items-center justify-between rounded-full border border-(--iu-border) bg-(--cd-raised) pr-1 pl-4 shadow-(--cd-sh-toast) dark:border-(--iu-foreground)/10"
            onPointerEnter={() => setHovered(true)}
            onPointerLeave={() => setHovered(false)}
          >
            <span className="inline-flex items-center gap-2 font-mono text-[11px] font-medium tracking-[0.06em] text-(--iu-muted) uppercase">
              <span aria-hidden="true" className="flex gap-0.5">
                <span className="h-2.5 w-[3px] rounded-full bg-(--iu-muted)" />
                <span className="h-2.5 w-[3px] rounded-full bg-(--iu-muted)" />
              </span>
              Paused · {toasts.length} notifications
            </span>
            <button
              type="button"
              onClick={onClear}
              className={cx(
                "h-8 rounded-full px-3 text-[12px] font-semibold text-(--iu-foreground) transition-colors duration-150 motion-reduce:transition-none pointer-coarse:h-10 pointer-fine:hover:bg-(--iu-foreground)/8",
                FOCUS,
              )}
            >
              Clear all
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
      <ol
        ref={listRef}
        tabIndex={-1}
        aria-label="Notifications, F8 to focus"
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        onFocus={() => setFocused(true)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false);
        }}
        style={{ height }}
        className={cx(
          "relative rounded-[max(var(--iu-radius),18px)] outline-none",
          toasts.length > 0 && "pointer-events-auto",
        )}
      >
        <AnimatePresence initial={false}>
          {toasts.map((toast, index) => (
            <ToastCard
              key={toast.id}
              toast={toast}
              index={index}
              count={toasts.length}
              expanded={expanded}
              paused={paused}
              onDismiss={onDismiss}
              onAction={onAction}
            />
          ))}
        </AnimatePresence>
      </ol>
    </section>
  );
}

/* ---------------------------------------------------------------- component */

export function CushionDialogToasts({
  brand = "Paperlane",
  author = "Mara Lindgren",
  audience = 12847,
  homeTimeZone = "Lisbon time (WET)",
  issues = DEFAULT_ISSUES,
  days = DEFAULT_DAYS,
  slots = DEFAULT_SLOTS,
  defaultDayId = "wed",
  defaultTime = "09:00",
  defaultOpenIssueId = null,
  defaultScheduled = [],
  initialToasts = [],
  stackExpanded = false,
  status,
  errorMessage = "We couldn’t reach the send queue. Your draft is safe; try again in a moment.",
  onSchedule,
  onUndo,
  onOpenChange,
  className = "",
}: CushionDialogToastsProps) {
  const reduceMotion = useReducedMotion();
  const small = useSmallScreen();
  const dragControls = useDragControls();
  const titleId = useId();
  const descriptionId = useId();
  const statusId = useId();

  const [openId, setOpenId] = useState<string | null>(defaultOpenIssueId);
  const [dayId, setDayId] = useState(defaultDayId);
  const [time, setTime] = useState(defaultTime);
  const [readerZone, setReaderZone] = useState(true);
  const [phase, setPhase] = useState<"idle" | "loading" | "error">(status ?? "idle");
  const [scheduled, setScheduled] = useState<CushionSchedule[]>(defaultScheduled);
  const [toasts, setToasts] = useState<CushionToast[]>(initialToasts);
  const [announcement, setAnnouncement] = useState("");

  const dialogRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLInputElement | null>(null);
  const toastListRef = useRef<HTMLOListElement>(null);
  const triggers = useRef<Record<string, HTMLButtonElement | null>>({});
  const returnTo = useRef<HTMLElement | null>(null);
  const movedIn = useRef(false);

  const [syncedStatus, setSyncedStatus] = useState(status);
  if (syncedStatus !== status) {
    setSyncedStatus(status);
    setPhase(status ?? "idle");
  }

  const issue = issues.find((candidate) => candidate.id === openId) ?? null;
  const day = days.find((candidate) => candidate.id === dayId) ?? days[0];
  const open = issue !== null;

  const openDialog = (issueId: string, trigger: HTMLElement) => {
    returnTo.current = trigger;
    movedIn.current = true;
    setPhase("idle");
    setOpenId(issueId);
    onOpenChange?.(true);
  };

  const closeDialog = useCallback(() => {
    const target = returnTo.current ?? (openId ? triggers.current[openId] : null);
    setOpenId(null);
    onOpenChange?.(false);
    returnTo.current = null;
    requestAnimationFrame(() => target?.focus());
  }, [onOpenChange, openId]);

  // Focus moves in only when a person opened the dialog, so a dialog that is open on page load never steals focus.
  useEffect(() => {
    if (!open || !movedIn.current) return;
    movedIn.current = false;
    const frame = requestAnimationFrame(() => firstFieldRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [open]);

  // Escape closes; Tab and Shift+Tab stay inside the dialog; F8 jumps to the notifications.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "F8" && !open) {
        event.preventDefault();
        toastListRef.current?.focus();
        return;
      }
      const dialog = dialogRef.current;
      if (!open || !dialog) return;
      if (event.key === "Escape") {
        event.preventDefault();
        if (phase !== "loading") closeDialog();
        return;
      }
      if (event.key !== "Tab") return;
      const nodes = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (node) => !(node instanceof HTMLInputElement && node.type === "radio" && !node.checked),
      );
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (!first || !last) return;
      const active = document.activeElement;
      if (!dialog.contains(active)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, phase, closeDialog]);

  // Lock page scroll without a layout shift while the dialog is open.
  useEffect(() => {
    if (!open) return;
    const { body, documentElement } = document;
    const gap = window.innerWidth - documentElement.clientWidth;
    const previous = { overflow: body.style.overflow, paddingRight: body.style.paddingRight };
    body.style.overflow = "hidden";
    if (gap > 0) body.style.paddingRight = `${gap}px`;
    return () => {
      body.style.overflow = previous.overflow;
      body.style.paddingRight = previous.paddingRight;
    };
  }, [open]);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = (toast: CushionToast) => {
    setToasts((current) => [toast, ...current].slice(0, 5));
    setAnnouncement(`${toast.title}. ${toast.description ?? ""}`);
  };

  const selectDay = (next: CushionDay) => {
    setDayId(next.id);
    const slot = slots.find((candidate) => candidate.time === time);
    if (next.isToday && slot?.passedToday) {
      const firstOpen = slots.find((candidate) => !candidate.passedToday);
      if (firstOpen) {
        setTime(firstOpen.time);
        setAnnouncement(`${slot.time} has passed today. Moved to ${firstOpen.time}.`);
      }
    }
  };

  const describeWhen = (schedule: CushionSchedule) => {
    const scheduledDay = days.find((candidate) => candidate.id === schedule.dayId);
    return `${scheduledDay?.long ?? ""}, ${schedule.time}`;
  };

  const submit = async () => {
    if (!issue || !day || phase === "loading") return;
    const schedule: CushionSchedule = { issueId: issue.id, dayId: day.id, time, readerTimeZone: readerZone };
    try {
      const result = onSchedule?.(schedule);
      if (result instanceof Promise) {
        setPhase("loading");
        await result;
      }
      setPhase("idle");
      setScheduled((current) => [...current.filter((item) => item.issueId !== issue.id), schedule]);
      closeDialog();
      pushToast({
        id: `scheduled-${issue.id}-${Date.now()}`,
        title: `Issue #${issue.number} scheduled`,
        description: `${describeWhen(schedule)} · ${readerZone ? "each reader’s time zone" : homeTimeZone}`,
        tone: "success",
        actionLabel: "Undo",
      });
    } catch {
      setPhase("error");
    }
  };

  const handleToastAction = (toast: CushionToast) => {
    const issueId = /^scheduled-([^-]+)-/.exec(toast.id)?.[1];
    dismissToast(toast.id);
    if (!issueId) return;
    const undone = issues.find((candidate) => candidate.id === issueId);
    setScheduled((current) => current.filter((item) => item.issueId !== issueId));
    onUndo?.(issueId);
    pushToast({
      id: `undo-${issueId}-${Date.now()}`,
      title: `Issue #${undone?.number ?? issueId} is back in drafts`,
      description: "Its send slot is free again.",
      tone: "info",
      duration: 4000,
    });
  };

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 120 || info.velocity.y > 600) {
      if (phase !== "loading") closeDialog();
    }
  };

  const startDrag = (event: ReactPointerEvent) => {
    if (small) dragControls.start(event);
  };

  const summaryWhen = `${day?.long ?? ""} at ${time}`;
  const summaryWho = `${formatCount(audience)} readers · ${readerZone ? "in their own time zone" : homeTimeZone}`;
  const maxOpens = Math.max(...slots.map((slot) => slot.opens));

  return (
    <MotionConfig
      reducedMotion="user"
      transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 400, damping: 30 }}
    >
      <div
        className={cx(
          "relative min-h-dvh bg-(--iu-background) font-(family-name:--iu-font) text-(--iu-foreground)",
          MATERIAL,
          className,
        )}
      >
        <div inert={open} className="mx-auto max-w-[880px] px-4 pt-6 pb-40 sm:px-8 sm:pt-10">
          <header className="flex items-center justify-between gap-4">
            <span className="inline-flex items-center gap-2.5 text-[15px] font-semibold tracking-[-0.01em]">
              <PaperlaneMark />
              {brand}
            </span>
            <span className="inline-flex items-center gap-2 text-sm text-(--iu-muted)">
              <span className="hidden sm:inline">{author}</span>
              <span
                aria-hidden="true"
                className="grid size-8 place-items-center rounded-full bg-(--cd-tint) text-[11px] font-semibold text-(--iu-foreground)"
              >
                {author
                  .split(/\s+/)
                  .map((part) => part[0] ?? "")
                  .join("")
                  .slice(0, 2)}
              </span>
            </span>
          </header>

          <div className="mt-10 flex flex-wrap items-end justify-between gap-4 sm:mt-14">
            <div>
              <h1 className="text-[32px]/[1.1] font-semibold tracking-[-0.03em] text-balance sm:text-[40px]/[1.05]">
                Drafts
              </h1>
              <p className="mt-2 text-[15px] text-pretty text-(--iu-muted)">
                {issues.length} issues ready for a send slot · {formatCount(audience)} subscribers
              </p>
            </div>
          </div>

          <ul className="mt-8 flex flex-col gap-[calc(12px*var(--iu-density))]">
            {issues.map((item) => {
              const slot = scheduled.find((entry) => entry.issueId === item.id);
              return (
                <li
                  key={item.id}
                  className="flex flex-col gap-4 rounded-[max(var(--iu-radius),20px)] border border-(--iu-border) bg-(--iu-surface) p-[calc(16px*var(--iu-density))] shadow-(--cd-sh-card) sm:flex-row sm:items-center sm:p-[calc(20px*var(--iu-density))] dark:border-(--iu-foreground)/8"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-4">
                    <span
                      aria-hidden="true"
                      className="grid size-12 shrink-0 place-items-center rounded-[max(var(--iu-radius),14px)] bg-(--cd-well) font-mono text-sm font-semibold tabular-nums shadow-(--cd-sh-well)"
                    >
                      #{item.number}
                    </span>
                    <div className="min-w-0">
                      <h2 className="truncate text-base font-semibold tracking-[-0.01em]">
                        <span className="sr-only">Issue #{item.number}: </span>
                        {item.title}
                      </h2>
                      <p className="mt-0.5 text-[13px] text-(--iu-muted) tabular-nums">
                        {formatCount(item.words)} words · {item.edited}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                    {slot ? (
                      <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-(--cd-tint) px-3 text-[13px] font-medium tabular-nums">
                        <CalendarClock size={14} strokeWidth={1.75} aria-hidden="true" />
                        {describeWhen(slot)}
                      </span>
                    ) : (
                      <span className="inline-flex h-8 items-center rounded-full px-3 text-[13px] font-medium text-(--iu-muted) ring-1 ring-(--iu-border) ring-inset">
                        Draft
                      </span>
                    )}
                    <button
                      ref={(node) => {
                        triggers.current[item.id] = node;
                      }}
                      type="button"
                      aria-haspopup="dialog"
                      onClick={(event) => openDialog(item.id, event.currentTarget)}
                      className={OUTLINE}
                    >
                      {slot ? "Reschedule" : "Schedule"}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <AnimatePresence initial={false}>
          {issue ? (
            <div key="dialog" className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
              <motion.div
                aria-hidden="true"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.2 }}
                onClick={() => phase !== "loading" && closeDialog()}
                className="absolute inset-0 bg-black/35 dark:bg-black/65"
              />
              <motion.div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                aria-describedby={descriptionId}
                initial={small ? { y: "100%" } : { opacity: 0, y: 12, scale: 0.97 }}
                animate={small ? { y: 0 } : { opacity: 1, y: 0, scale: 1 }}
                exit={small ? { y: "100%" } : { opacity: 0, y: 8, scale: 0.98, transition: { duration: 0.14 } }}
                drag={small ? "y" : false}
                dragListener={false}
                dragControls={dragControls}
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0.04, bottom: 0.8 }}
                onDragEnd={onDragEnd}
                className="relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[max(var(--iu-radius),28px)] border border-(--iu-border) bg-(--iu-surface) shadow-(--cd-sh-panel) sm:max-h-[min(88dvh,760px)] sm:max-w-[480px] sm:rounded-[max(var(--iu-radius),28px)] dark:border-(--iu-foreground)/10 dark:bg-(--cd-raised)"
              >
                <div onPointerDown={startDrag} className="flex touch-none justify-center pt-3 pb-1 sm:hidden">
                  <span aria-hidden="true" className="h-1.5 w-10 rounded-full bg-(--iu-foreground)/20" />
                </div>
                <div onPointerDown={startDrag} className="flex items-start gap-4 px-5 pt-3 pb-5 sm:px-7 sm:pt-7">
                  <span
                    aria-hidden="true"
                    className="grid size-11 shrink-0 place-items-center rounded-[max(var(--iu-radius),14px)] bg-(--cd-tint) text-(--iu-foreground)"
                  >
                    <CalendarClock size={20} strokeWidth={1.5} />
                  </span>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <h2 id={titleId} className="text-lg/6 font-semibold tracking-[-0.02em] text-balance">
                      Schedule issue #{issue.number}
                    </h2>
                    <p id={descriptionId} className="mt-1 text-sm text-pretty text-(--iu-muted)">
                      “{issue.title}” goes to {formatCount(audience)} subscribers.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={closeDialog}
                    disabled={phase === "loading"}
                    aria-label="Close"
                    className={cx(
                      "-mt-1 -mr-2 grid size-10 shrink-0 place-items-center rounded-full text-(--iu-muted) transition-colors duration-150 motion-reduce:transition-none pointer-fine:hover:bg-(--iu-foreground)/6 pointer-fine:hover:text-(--iu-foreground)",
                      FOCUS,
                    )}
                  >
                    <X size={18} strokeWidth={1.5} aria-hidden="true" />
                  </button>
                </div>

                <div className="flex [scrollbar-gutter:stable] flex-col gap-[calc(20px*var(--iu-density))] overflow-y-auto px-5 pb-2 sm:px-7">
                  <fieldset disabled={phase === "loading"}>
                    <legend className="mb-2 text-[13px] font-semibold">Day</legend>
                    <div className="grid grid-cols-3 gap-1 rounded-full bg-(--cd-well) p-1 shadow-(--cd-sh-well)">
                      {days.map((option) => {
                        const selected = option.id === dayId;
                        return (
                          <label
                            key={option.id}
                            className="relative flex h-12 cursor-pointer flex-col items-center justify-center rounded-full text-center has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-(--iu-accent)"
                          >
                            <input
                              ref={selected ? firstFieldRef : undefined}
                              type="radio"
                              name={`${titleId}-day`}
                              value={option.id}
                              checked={selected}
                              onChange={() => selectDay(option)}
                              className="sr-only"
                            />
                            {selected ? (
                              <motion.span
                                layoutId={`${titleId}-thumb`}
                                aria-hidden="true"
                                className="absolute inset-0 rounded-full bg-(--cd-raised) shadow-(--cd-sh-thumb) dark:bg-(--iu-foreground)/12"
                              />
                            ) : null}
                            <span className="relative text-[13px]/4 font-semibold">{option.label}</span>
                            <span className="relative text-[12px]/4 text-(--iu-muted) tabular-nums">{option.date}</span>
                          </label>
                        );
                      })}
                    </div>
                  </fieldset>

                  <fieldset disabled={phase === "loading"}>
                    <legend className="mb-2 flex w-full items-baseline justify-between gap-3 text-[13px] font-semibold">
                      Send time
                      <span className="text-[12px] font-normal text-(--iu-muted)">Predicted opens</span>
                    </legend>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {slots.map((slot) => {
                        const passed = Boolean(day?.isToday && slot.passedToday);
                        const best = slot.opens === maxOpens;
                        return (
                          <label key={slot.time} data-passed={passed ? "" : undefined} className={SLOT}>
                            <input
                              type="radio"
                              name={`${titleId}-time`}
                              value={slot.time}
                              checked={slot.time === time}
                              disabled={passed}
                              onChange={() => setTime(slot.time)}
                              className="sr-only"
                            />
                            <span className="flex items-center justify-between gap-2">
                              <span
                                className={cx(
                                  "text-lg/6 font-semibold tracking-[-0.02em] tabular-nums",
                                  passed && "text-(--iu-muted) line-through decoration-1",
                                )}
                              >
                                {slot.time}
                              </span>
                              {best && !passed ? (
                                <span className="rounded-full bg-(--iu-accent) px-1.5 py-px text-[11px] font-semibold text-(--iu-accent-foreground)">
                                  Best
                                </span>
                              ) : null}
                            </span>
                            {passed ? (
                              <span className="text-[12px]/4 text-(--iu-muted)">Passed today</span>
                            ) : (
                              <span className="flex items-center gap-2">
                                <span aria-hidden="true" className="h-1.5 flex-1 rounded-full bg-(--iu-foreground)/10">
                                  <span
                                    className="block h-full rounded-full bg-(--iu-foreground)/55 group-has-checked/slot:bg-(--iu-accent)"
                                    style={{ width: `${(slot.opens / maxOpens) * 100}%` }}
                                  />
                                </span>
                                <span className="text-[12px]/4 text-(--iu-muted) tabular-nums">
                                  <span className="sr-only">Predicted opens </span>
                                  {slot.opens}%
                                </span>
                              </span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </fieldset>

                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p id={`${statusId}-zone`} className="flex items-center gap-2 text-sm font-semibold">
                        <Globe size={16} strokeWidth={1.5} aria-hidden="true" />
                        Deliver in each reader’s time zone
                      </p>
                      <p className="mt-0.5 text-[13px] text-pretty text-(--iu-muted)">
                        {time} in Lisbon, Toronto and Pune alike.
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={readerZone}
                      aria-labelledby={`${statusId}-zone`}
                      disabled={phase === "loading"}
                      onClick={() => setReaderZone((value) => !value)}
                      data-on={readerZone ? "" : undefined}
                      className={SWITCH}
                    >
                      <span aria-hidden="true" className={KNOB} />
                    </button>
                  </div>

                  <div className="relative overflow-hidden rounded-[max(var(--iu-radius),18px)] bg-(--cd-well) px-4 py-3.5 shadow-(--cd-sh-well)">
                    <AnimatePresence initial={false} mode="popLayout">
                      <motion.div
                        key={`${summaryWhen}-${readerZone}`}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: reduceMotion ? 0 : 0.18 }}
                      >
                        <p className="text-[15px] font-semibold tabular-nums">{summaryWhen}</p>
                        <p className="mt-0.5 text-[13px] text-(--iu-muted) tabular-nums">{summaryWho}</p>
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  {phase === "error" ? (
                    <div
                      role="alert"
                      className="flex items-start gap-3 rounded-[max(var(--iu-radius),16px)] border border-red-600/30 bg-red-600/6 p-3.5 text-[13px]/5 text-red-800 dark:border-red-400/30 dark:bg-red-400/8 dark:text-red-200"
                    >
                      <CircleAlert size={16} strokeWidth={1.75} aria-hidden="true" className="mt-0.5 shrink-0" />
                      <span className="text-pretty">{errorMessage}</span>
                    </div>
                  ) : null}
                </div>

                <div className="mt-2 flex flex-col-reverse gap-2 border-t border-(--iu-border) px-5 pt-4 pb-[max(20px,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end sm:px-7 sm:pb-6 dark:border-(--iu-foreground)/8">
                  <button type="button" onClick={closeDialog} disabled={phase === "loading"} className={QUIET}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={submit}
                    disabled={phase === "loading"}
                    aria-describedby={phase === "error" ? undefined : statusId}
                    className={PRIMARY}
                  >
                    <span
                      aria-hidden={phase === "loading"}
                      className={cx(
                        "col-start-1 row-start-1 transition-opacity duration-150 motion-reduce:transition-none",
                        phase === "loading" && "opacity-0",
                      )}
                    >
                      {phase === "error" ? "Try again" : "Schedule issue"}
                    </span>
                    <span
                      aria-hidden={phase !== "loading"}
                      className={cx(
                        "col-start-1 row-start-1 inline-flex items-center justify-center gap-2 transition-opacity duration-150 motion-reduce:transition-none",
                        phase !== "loading" && "opacity-0",
                      )}
                    >
                      <LoaderCircle
                        size={16}
                        strokeWidth={2}
                        aria-hidden="true"
                        className="animate-spin motion-reduce:animate-none"
                      />
                      Scheduling
                    </span>
                  </button>
                  <span id={statusId} className="sr-only">
                    {summaryWhen}, {summaryWho}
                  </span>
                </div>
              </motion.div>
            </div>
          ) : null}
        </AnimatePresence>

        <ToastStack
          toasts={toasts}
          pinned={stackExpanded}
          inert={open}
          listRef={toastListRef}
          onDismiss={dismissToast}
          onAction={handleToastAction}
          onClear={() => setToasts([])}
        />
        <p role="status" className="sr-only">
          {announcement}
        </p>
      </div>
    </MotionConfig>
  );
}

export default CushionDialogToasts;
