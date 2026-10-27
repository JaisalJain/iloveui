"use client";

import {
  Fragment,
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  type RefObject,
} from "react";
import {
  Bookmark,
  CalendarClock,
  Check,
  ChevronDown,
  Ellipsis,
  Eye,
  Link2,
  Plus,
  Share,
  Trash2,
  Users,
} from "lucide-react";

export type GumdropVariant = "primary" | "secondary" | "ghost" | "destructive";
export type GumdropSize = "sm" | "md";
export type GumdropStatus = "idle" | "loading" | "success";
/** Renders an interaction state on demand, for previews, docs and visual tests. */
export type GumdropForceState = "hover" | "focus" | "active";

const cx = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(" ");

const isThenable = (value: unknown): value is PromiseLike<unknown> =>
  typeof value === "object" && value !== null && typeof (value as PromiseLike<unknown>).then === "function";

function prefersReducedMotion() {
  return typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** One-shot Web Animations for moments that explain a state change. Skipped under reduced motion. */
function play(element: Element | null | undefined, keyframes: Keyframe[], duration: number) {
  if (!element || typeof element.animate !== "function" || prefersReducedMotion()) return;
  element.animate(keyframes, { duration, easing: "cubic-bezier(.2,.8,.2,1)" });
}

// A spring (stiffness 400, damping 18) written as a CSS easing curve: 20% overshoot, settled in about 620ms.
// Plain CSS, so the HTML version moves exactly like the React one.
const SPRING = "[--gd-spring:linear(0,.19,.57,.92,1.13,1.21,1.17,1.1,1.02,.98,.96,.96,.98,.99,1,1.01,1.01,1,1)]";

// Accent at about 30% over a neutral rule: the tinted edge and lip of every light surface.
const LINE =
  "[--gd-line:color-mix(in_oklab,var(--iu-accent)_28%,color-mix(in_oklab,var(--iu-foreground)_18%,var(--iu-surface)))]";
// The darker side of an accent candy.
const CANDY = "[--gd-candy:color-mix(in_oklab,var(--iu-accent)_60%,black)]";
// The hot center of the flame: pale in both modes, so it never reads as a hole on dark surfaces.
const CORE = "[--gd-core:color-mix(in_oklab,var(--iu-accent)_16%,white)]";
// The one tint level the family allows.
const TINT = "[--gd-tint:color-mix(in_oklab,var(--iu-accent)_14%,var(--iu-surface))]";
// Focus rings: the accent, shaded toward the text color in light mode so the ring keeps 3:1 on tinted surfaces too.
const RING =
  "[--gd-ring:color-mix(in_oklab,var(--iu-accent)_76%,var(--iu-foreground))] dark:[--gd-ring:var(--iu-accent)]";

const WIGGLE: Keyframe[] = [
  { rotate: "0deg" },
  { rotate: "-14deg" },
  { rotate: "10deg" },
  { rotate: "-5deg" },
  { rotate: "2deg" },
  { rotate: "0deg" },
];

const DOT_BOUNCE: Keyframe[] = [
  { transform: "translateY(0) scale(1, 1)", easing: "cubic-bezier(.2,.6,.35,1)" },
  { transform: "translateY(-0.45em) scale(.9, 1.1)", offset: 0.32, easing: "cubic-bezier(.6,0,.8,.4)" },
  { transform: "translateY(0) scale(1, 1)", offset: 0.6 },
  { transform: "translateY(0) scale(1.28, .72)", offset: 0.7 },
  { transform: "translateY(0) scale(1, 1)", offset: 0.84 },
  { transform: "translateY(0) scale(1, 1)" },
];

/*
 * Every gumdrop is a pill on a lip (an offset shadow in --gd-edge). Hover feeds --gd-lift and a press feeds
 * --gd-press into one transform and one shadow, so the states never fight: hover rises 2px on a taller lip, a press
 * sinks into the lip and squashes, and letting go springs back past rest before it settles.
 */
const SHELL = cx(
  SPRING,
  RING,
  "group/gd relative isolate inline-flex shrink-0 cursor-pointer touch-manipulation items-center justify-center border-2 border-(--gd-edge) bg-(--gd-face) font-bold whitespace-nowrap text-(--gd-ink) outline-hidden select-none [-webkit-tap-highlight-color:transparent] [word-spacing:0.08em]",
  "[--gd-lift:0] [--gd-press:0]",
  "[transform:translateY(calc(var(--gd-press)*var(--gd-lip)_-_(1_-_var(--gd-press))*var(--gd-lift)*var(--gd-rise)))_scale(calc(1_+_var(--gd-press)*0.045),calc(1_-_var(--gd-press)*0.085))]",
  "[box-shadow:0_calc((1_-_var(--gd-press))*(var(--gd-lip)_+_var(--gd-lift)*var(--gd-rise)))_0_0_var(--gd-edge),inset_0_2px_0_0_var(--gd-gloss)]",
  // A press lands in 90ms; letting go springs back over 620ms.
  "transition-[transform,box-shadow,background-color,border-color,color] duration-[calc(620ms_-_var(--gd-press)*530ms)] ease-(--gd-spring) motion-reduce:transition-none",
  "data-[force-state=hover]:bg-(--gd-face-up) data-[force-state=hover]:[--gd-lift:1] pointer-fine:enabled:hover:bg-(--gd-face-up) pointer-fine:enabled:hover:[--gd-lift:1]",
  "enabled:active:[--gd-press:1] data-pressed:[--gd-press:1] data-[force-state=active]:[--gd-press:1]",
  "after:pointer-events-none after:absolute after:-inset-[5px] after:-bottom-[calc(5px+var(--gd-lip))] after:rounded-[inherit] after:border-2 after:border-(--gd-ring) after:opacity-0 focus-visible:after:opacity-100 data-[force-state=focus]:after:opacity-100",
  "disabled:cursor-not-allowed disabled:border-dashed disabled:[--gd-edge:var(--gd-off-edge,color-mix(in_oklab,var(--iu-foreground)_24%,transparent))] disabled:[--gd-face:var(--gd-off-face,color-mix(in_oklab,var(--iu-foreground)_5%,transparent))] disabled:[--gd-gloss:transparent] disabled:[--gd-ink:var(--iu-muted)] disabled:[--gd-lip:0px]",
);

const VARIANT: Record<GumdropVariant, string> = {
  primary: cx(
    "[--gd-edge:color-mix(in_oklab,var(--iu-accent)_60%,black)] [--gd-face-up:color-mix(in_oklab,var(--iu-accent)_86%,white)] [--gd-face:var(--iu-accent)] [--gd-gloss:color-mix(in_oklab,white_34%,transparent)] [--gd-ink:var(--iu-accent-foreground)] [--gd-rise:2px]",
    "dark:[--gd-gloss:color-mix(in_oklab,white_22%,transparent)]",
  ),
  secondary: cx(
    "[--gd-edge:color-mix(in_oklab,var(--iu-accent)_28%,color-mix(in_oklab,var(--iu-foreground)_18%,var(--iu-surface)))] [--gd-face-up:color-mix(in_oklab,var(--iu-accent)_7%,var(--iu-surface))] [--gd-face:var(--iu-surface)] [--gd-gloss:transparent] [--gd-ink:var(--iu-foreground)] [--gd-rise:2px]",
    "dark:[--gd-face-up:color-mix(in_oklab,var(--iu-foreground)_13%,var(--iu-surface))] dark:[--gd-face:color-mix(in_oklab,var(--iu-foreground)_7%,var(--iu-surface))] dark:[--gd-gloss:color-mix(in_oklab,white_7%,transparent)]",
  ),
  ghost:
    "[--gd-edge:transparent] [--gd-face-up:color-mix(in_oklab,var(--iu-foreground)_8%,transparent)] [--gd-face:transparent] [--gd-gloss:transparent] [--gd-ink:var(--iu-foreground)] [--gd-off-edge:transparent] [--gd-off-face:transparent] [--gd-rise:0px]",
  destructive: cx(
    "[--gd-edge:var(--color-red-300)] [--gd-face-up:var(--color-red-100)] [--gd-face:var(--color-red-50)] [--gd-gloss:transparent] [--gd-ink:var(--color-red-700)] [--gd-rise:2px]",
    "dark:[--gd-edge:color-mix(in_oklab,var(--color-red-400)_55%,var(--iu-surface))] dark:[--gd-face-up:color-mix(in_oklab,var(--color-red-500)_24%,var(--iu-surface))] dark:[--gd-face:color-mix(in_oklab,var(--color-red-500)_15%,var(--iu-surface))] dark:[--gd-ink:var(--color-red-300)]",
  ),
};

type Shape = "pill" | "circle" | "start" | "end";

const SHAPE: Record<Shape, string> = {
  pill: "origin-bottom rounded-full",
  circle: "origin-bottom rounded-full",
  // Split segments squash away from the seam, and their focus rings stay open there: the divider closes them.
  start: "origin-[100%_100%] rounded-l-full after:-right-0.5 after:border-r-0",
  end: "-ml-0.5 origin-[0%_100%] rounded-r-full after:-left-0.5 after:border-l-0",
};

const SIZE: Record<Shape, Record<GumdropSize, string>> = {
  pill: {
    md: "h-12 px-[calc(20px*var(--iu-density))] text-[15px] [--gd-lip:4px]",
    sm: "h-9 px-[calc(16px*var(--iu-density))] text-[13px] [--gd-lip:3px] pointer-coarse:h-10",
  },
  start: {
    md: "h-12 pr-[calc(16px*var(--iu-density))] pl-[calc(20px*var(--iu-density))] text-[15px] [--gd-lip:4px]",
    sm: "h-9 pr-[calc(12px*var(--iu-density))] pl-[calc(16px*var(--iu-density))] text-[13px] [--gd-lip:3px] pointer-coarse:h-10",
  },
  end: { md: "h-12 w-11 [--gd-lip:4px]", sm: "h-9 w-9 [--gd-lip:3px] pointer-coarse:size-10" },
  circle: { md: "size-12 [--gd-lip:4px]", sm: "size-9 [--gd-lip:3px] pointer-coarse:size-10" },
};

// The label shrinks away while the dots or the check take its place; it never leaves the layout, so the width holds.
const LABEL =
  "inline-flex items-center transition-[opacity,scale] duration-200 ease-out group-data-[status=loading]/gd:scale-50 group-data-[status=loading]/gd:opacity-0 group-data-[status=success]/gd:scale-50 group-data-[status=success]/gd:opacity-0 motion-reduce:transition-none";
const LABEL_GAP: Record<GumdropSize, string> = { md: "gap-2", sm: "gap-2" };

type CoreProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> & {
  variant?: GumdropVariant;
  size?: GumdropSize;
  /** Controlled status. Leave it unset and return a promise from onClick to get loading and success for free. */
  status?: GumdropStatus;
  forceState?: GumdropForceState;
  /** Announced to screen readers while loading. */
  loadingText?: string;
  /** Announced to screen readers on success. */
  successText?: string;
  /** How long the check stays before the button returns to idle, in ms; 0 keeps it. Uncontrolled status only. */
  successHold?: number;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => unknown;
};

/** Bounces the three loading dots while `active`, paused whenever the button is scrolled out of view. */
function useBouncingDots(host: RefObject<HTMLElement | null>, active: boolean) {
  useEffect(() => {
    const element = host.current;
    if (!active || !element || typeof element.animate !== "function" || prefersReducedMotion()) return;
    const runs = Array.from(element.querySelectorAll<HTMLElement>("[data-gd-dot]"), (dot, index) =>
      dot.animate(DOT_BOUNCE, { duration: 840, delay: index * 140, iterations: Infinity }),
    );
    const observer =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(([entry]) => {
            for (const run of runs) {
              if (entry?.isIntersecting) run.play();
              else run.pause();
            }
          });
    observer?.observe(element);
    return () => {
      observer?.disconnect();
      for (const run of runs) run.cancel();
    };
  }, [host, active]);
}

/** The three loading dots and the check that draws itself; both sit over the label, which keeps the width. */
function StatusMarks() {
  return (
    <>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex scale-50 items-center justify-center gap-[0.3em] opacity-0 transition-[opacity,scale] duration-200 ease-out group-data-[status=loading]/gd:scale-100 group-data-[status=loading]/gd:opacity-100 motion-reduce:transition-none"
      >
        <span data-gd-dot="" className="size-[0.42em] origin-bottom rounded-full bg-current" />
        <span data-gd-dot="" className="size-[0.42em] origin-bottom rounded-full bg-current" />
        <span data-gd-dot="" className="size-[0.42em] origin-bottom rounded-full bg-current" />
      </span>
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="size-[1.5em] scale-50 opacity-0 [transition:opacity_150ms_ease-out,scale_620ms_var(--gd-spring)] group-data-[status=success]/gd:scale-100 group-data-[status=success]/gd:opacity-100 motion-reduce:[transition:none]"
        >
          <path
            d="M5.5 12.5 10 17l8.5-9.5"
            pathLength={1}
            stroke="currentColor"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-[stroke-dashoffset] delay-100 duration-420 ease-[cubic-bezier(.65,0,.35,1)] [stroke-dasharray:1] [stroke-dashoffset:1] group-data-[status=success]/gd:[stroke-dashoffset:0] motion-reduce:transition-none"
          />
        </svg>
      </span>
    </>
  );
}

function Gumdrop({
  variant = "primary",
  size = "md",
  status: statusProp,
  forceState,
  loadingText = "Working on it",
  successText = "Done",
  successHold = 1600,
  shape,
  wiggle = false,
  disabled,
  type = "button",
  className,
  children,
  onClick,
  onKeyDown,
  onKeyUp,
  onBlur,
  onPointerEnter,
  ...rest
}: CoreProps & { shape: Shape; wiggle?: boolean }) {
  const button = useRef<HTMLButtonElement>(null);
  const [own, setOwn] = useState<GumdropStatus>("idle");
  const [pressed, setPressed] = useState(false);
  const status = statusProp ?? own;
  const busy = status !== "idle";

  useBouncingDots(button, status === "loading");

  useEffect(() => {
    if (own !== "success" || successHold <= 0) return;
    const timer = setTimeout(() => setOwn("idle"), successHold);
    return () => clearTimeout(timer);
  }, [own, successHold]);

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    if (busy) return;
    const result = onClick?.(event);
    if (statusProp !== undefined || !isThenable(result)) return;
    setOwn("loading");
    Promise.resolve(result).then(
      () => setOwn("success"),
      () => setOwn("idle"),
    );
  }

  return (
    <>
      <button
        {...rest}
        ref={button}
        type={type}
        disabled={disabled}
        aria-disabled={busy || rest["aria-disabled"] || undefined}
        data-gd=""
        data-status={status}
        data-force-state={forceState}
        data-pressed={pressed ? "" : undefined}
        data-gd-wiggle={wiggle ? "" : undefined}
        className={cx(SHELL, VARIANT[variant], SIZE[shape][size], SHAPE[shape], className)}
        onClick={handleClick}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if ((event.key === "Enter" || event.key === " ") && !event.repeat) setPressed(true);
        }}
        onKeyUp={(event) => {
          onKeyUp?.(event);
          if (event.key === "Enter" || event.key === " ") setPressed(false);
        }}
        onBlur={(event) => {
          onBlur?.(event);
          setPressed(false);
        }}
        onPointerEnter={(event) => {
          onPointerEnter?.(event);
          if (wiggle && event.pointerType === "mouse") play(button.current?.firstElementChild, WIGGLE, 520);
        }}
      >
        <span data-gd-label="" className={cx(LABEL, LABEL_GAP[size])}>
          {children}
        </span>
        {shape === "end" ? null : <StatusMarks />}
      </button>
      {shape === "end" ? null : (
        <span role="status" className="sr-only">
          {status === "loading" ? loadingText : status === "success" ? successText : ""}
        </span>
      )}
    </>
  );
}

export type GumdropButtonProps = CoreProps & {
  /** Leading icon, for example a lucide icon at 16–18px. */
  icon?: ReactNode;
  children: ReactNode;
};

export function GumdropButton({ icon, children, ...props }: GumdropButtonProps) {
  return (
    <Gumdrop shape="pill" {...props}>
      {icon}
      <span>{children}</span>
    </Gumdrop>
  );
}

export type GumdropIconButtonProps = Omit<CoreProps, "children" | "aria-label" | "aria-pressed"> & {
  /** Accessible name. Icon-only buttons have no visible text, so this is required. */
  label: string;
  icon: ReactNode;
  /** Set to make the button a toggle (aria-pressed); the icon fills with the accent when on. */
  pressed?: boolean;
};

export function GumdropIconButton({ label, icon, pressed, variant = "secondary", ...props }: GumdropIconButtonProps) {
  return (
    <Gumdrop shape="circle" wiggle variant={variant} aria-label={label} aria-pressed={pressed} {...props}>
      {icon}
    </Gumdrop>
  );
}

export type GumdropMenuItem = { id: string; label: string; hint?: string; icon?: ReactNode };

export type GumdropSplitButtonProps = {
  label?: string;
  items?: GumdropMenuItem[];
  /** Accessible name of the menu trigger (the chevron). */
  menuLabel?: string;
  size?: GumdropSize;
  status?: GumdropStatus;
  disabled?: boolean;
  forceState?: GumdropForceState;
  loadingText?: string;
  successText?: string;
  successHold?: number;
  /** The main action. Return a promise to show loading, then success. */
  onClick?: () => unknown;
  /** A menu choice, by item id. Return a promise to show loading, then success. */
  onSelect?: (id: string) => unknown;
  className?: string;
};

const DEFAULT_PUBLISH_OPTIONS: GumdropMenuItem[] = [
  {
    id: "club",
    label: "Publish to club only",
    hint: "Thursday Readers · 14 members",
    icon: <Users size={16} strokeWidth={2} aria-hidden="true" />,
  },
  {
    id: "schedule",
    label: "Schedule for tomorrow",
    hint: "Sat, Oct 31 at 8:00 AM",
    icon: <CalendarClock size={16} strokeWidth={2} aria-hidden="true" />,
  },
  {
    id: "unlisted",
    label: "Publish as unlisted",
    hint: "Only people with the link",
    icon: <Link2 size={16} strokeWidth={2} aria-hidden="true" />,
  },
];

/** A primary action with a menu of variations (WAI-ARIA menu button: arrows, Home/End, Escape, focus return). */
export function GumdropSplitButton({
  label = "Publish",
  items = DEFAULT_PUBLISH_OPTIONS,
  menuLabel = "More publish options",
  size = "md",
  status: statusProp,
  disabled = false,
  forceState,
  loadingText = "Publishing",
  successText = "Published",
  successHold = 1600,
  onClick,
  onSelect,
  className,
}: GumdropSplitButtonProps) {
  const root = useRef<HTMLDivElement>(null);
  const pendingFocus = useRef<number | null>(null);
  const menuId = useId();
  const triggerId = useId();
  const [open, setOpen] = useState(false);
  const [own, setOwn] = useState<GumdropStatus>("idle");
  const status = statusProp ?? own;
  const busy = status !== "idle";

  useEffect(() => {
    if (own !== "success" || successHold <= 0) return;
    const timer = setTimeout(() => setOwn("idle"), successHold);
    return () => clearTimeout(timer);
  }, [own, successHold]);

  useEffect(() => {
    if (!open) return;
    const index = pendingFocus.current;
    pendingFocus.current = null;
    if (index !== null) root.current?.querySelectorAll<HTMLElement>('[role="menuitem"]').item(index)?.focus();
    const closeOutside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [open]);

  function run(result: unknown) {
    if (statusProp !== undefined || !isThenable(result)) return;
    setOwn("loading");
    Promise.resolve(result).then(
      () => setOwn("success"),
      () => setOwn("idle"),
    );
  }

  function openMenu(index: number) {
    pendingFocus.current = index;
    setOpen(true);
  }

  function closeMenu(returnFocus: boolean) {
    setOpen(false);
    if (returnFocus) root.current?.querySelector<HTMLElement>("[data-gd-trigger]")?.focus();
  }

  function onTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!busy) openMenu(event.key === "ArrowDown" ? 0 : items.length - 1);
    } else if (event.key === "Escape" && open) {
      event.preventDefault();
      closeMenu(true);
    }
  }

  function onMenuKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const list = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('[role="menuitem"]'));
    const current = list.indexOf(document.activeElement as HTMLElement);
    const focus = (index: number) => {
      event.preventDefault();
      list[(index + list.length) % list.length]?.focus();
    };
    if (event.key === "ArrowDown") focus(current + 1);
    else if (event.key === "ArrowUp") focus(current - 1);
    else if (event.key === "Home") focus(0);
    else if (event.key === "End") focus(list.length - 1);
    else if (event.key === "Escape") {
      event.preventDefault();
      closeMenu(true);
    } else if (event.key === "Tab") setOpen(false);
    else if (event.key.length === 1 && event.key !== " ") {
      // Type-ahead: jump to the next item whose label starts with the typed character.
      const key = event.key.toLowerCase();
      const order = [...list.slice(current + 1), ...list.slice(0, current + 1)];
      order.find((item) => item.textContent?.trim().toLowerCase().startsWith(key))?.focus();
    }
  }

  return (
    <div
      ref={root}
      data-gd-split=""
      className={cx(SPRING, LINE, TINT, RING, "relative inline-flex shrink-0", className)}
    >
      <Gumdrop
        shape="start"
        data-gd-main=""
        size={size}
        status={status}
        disabled={disabled}
        forceState={forceState}
        loadingText={loadingText}
        successText={successText}
        onClick={() => run(onClick?.())}
      >
        {label}
      </Gumdrop>
      <Gumdrop
        shape="end"
        size={size}
        disabled={disabled}
        forceState={forceState === "focus" ? undefined : forceState}
        id={triggerId}
        data-gd-trigger=""
        aria-label={menuLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-disabled={busy || undefined}
        onClick={() => {
          if (busy) return;
          if (open) closeMenu(false);
          else openMenu(0);
        }}
        onKeyDown={onTriggerKeyDown}
      >
        <ChevronDown
          size={size === "md" ? 18 : 16}
          strokeWidth={2.25}
          aria-hidden="true"
          className="transition-[rotate] duration-620 ease-(--gd-spring) group-aria-expanded/gd:rotate-180 motion-reduce:transition-none"
        />
      </Gumdrop>
      {/* Visibility flips at once when the menu opens (so focus can move in) and waits out the fade when it closes. */}
      <div
        id={menuId}
        role="menu"
        aria-labelledby={triggerId}
        data-gd-menu=""
        data-open={open ? "" : undefined}
        onKeyDown={onMenuKeyDown}
        className="pointer-events-none invisible absolute top-[calc(100%+16px)] left-0 z-30 w-68 max-w-[calc(100vw-2rem)] origin-top-left -translate-y-1.5 scale-95 rounded-[max(calc(var(--iu-radius)+8px),20px)] border-2 border-(--gd-line) bg-(--iu-surface) p-2 opacity-0 shadow-[0_4px_0_0_var(--gd-line)] [transition:opacity_150ms_ease-out,scale_420ms_var(--gd-spring),translate_420ms_var(--gd-spring),visibility_0s_linear_150ms] data-open:pointer-events-auto data-open:visible data-open:translate-y-0 data-open:scale-100 data-open:opacity-100 data-open:[transition-delay:0s] motion-reduce:[transition:none] dark:bg-[color-mix(in_oklab,var(--iu-foreground)_6%,var(--iu-surface))]"
      >
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            role="menuitem"
            data-value={item.id}
            tabIndex={-1}
            onClick={() => {
              closeMenu(true);
              run(onSelect?.(item.id));
            }}
            className="flex w-full items-center gap-3 rounded-[max(var(--iu-radius),10px)] px-2 py-2 text-left text-(--iu-foreground) transition-colors duration-150 focus-visible:bg-(--gd-tint) focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-(--gd-ring) motion-reduce:transition-none pointer-fine:hover:bg-(--gd-tint)"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-[max(var(--iu-radius),12px)] border-2 border-(--gd-line) bg-(--gd-tint) shadow-[0_2px_0_0_var(--gd-line)]">
              {item.icon}
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="text-sm font-bold">{item.label}</span>
              {item.hint ? <span className="text-xs text-(--iu-muted)">{item.hint}</span> : null}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export type StreakDay = {
  /** Short label under the marker, for example "M". */
  label: string;
  /** Full day name, read by screen readers. */
  name: string;
  state: "done" | "today" | "upcoming";
};

export type StreakCardProps = {
  title?: string;
  /** Days in a row before today. Logging today adds one. */
  streak?: number;
  best?: number;
  /** The daily goal, used in the prompt: "<goal> today to make it 13." */
  goal?: string;
  week?: StreakDay[];
  actionLabel?: string;
  /** The button's label once today is logged, shown after the check has drawn. */
  doneLabel?: string;
  /** Controlled: whether today is already logged. */
  loggedToday?: boolean;
  status?: GumdropStatus;
  disabled?: boolean;
  forceState?: GumdropForceState;
  /** Called by the one action. Return a promise to show loading until it settles. */
  onCheckIn?: () => unknown;
  className?: string;
};

// Once today is logged, the check-in settles into a quiet tinted pill: it has nothing left to do, so it stops
// looking like the primary action and no longer lifts on hover.
const DONE =
  "data-done:cursor-default data-done:[--gd-edge:var(--gd-line)] data-done:[--gd-face-up:var(--gd-tint)] data-done:[--gd-face:var(--gd-tint)] data-done:[--gd-gloss:transparent] data-done:[--gd-ink:var(--iu-foreground)] data-done:[--gd-rise:0px]";

const DEFAULT_WEEK: StreakDay[] = [
  { label: "M", name: "Monday", state: "done" },
  { label: "T", name: "Tuesday", state: "done" },
  { label: "W", name: "Wednesday", state: "done" },
  { label: "T", name: "Thursday", state: "done" },
  { label: "F", name: "Friday", state: "today" },
  { label: "S", name: "Saturday", state: "upcoming" },
  { label: "S", name: "Sunday", state: "upcoming" },
];

const DAY_STATE_TEXT: Record<StreakDay["state"], string> = {
  done: "read",
  today: "today, not logged yet",
  upcoming: "coming up",
};

const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

// A gumdrop: a broad dome on a flared, flat base.
const DROP = "M7 35c-3.2 0-4.7-2.6-3.8-5.4L7 18.5C8.8 12 12.9 8 18 8s9.2 4 11 10.5l3.8 11.1c.9 2.8-.6 5.4-3.8 5.4Z";
const FLAME =
  "M30 4c5 10 18 18.5 18 35.5a20 20 0 0 1-40 0c0-7.5 3.4-12.6 7.6-16.4.5 4.3 2.3 7.4 5.2 8.6C19.6 20.5 22.6 10.6 30 4Z";
const FLAME_CORE = "M28 33c3.6 5 8.5 8 8.5 14a8.5 8.5 0 0 1-17 0c0-6 4.9-9 8.5-14Z";

/** Digits on rolling strips: a change rolls the column with the spring instead of swapping the text. */
function RollingNumber({ value }: { value: number }) {
  const digits = String(Math.max(0, Math.round(value))).split("");
  return (
    <span
      aria-hidden="true"
      className="inline-flex h-[1em] [mask-image:linear-gradient(transparent,black_14%,black_86%,transparent)] leading-none [clip-path:inset(0_-0.1em)]"
    >
      {digits.map((digit, index) => (
        <span key={digits.length - index} className="block h-[1em]">
          <span
            data-gd-digit=""
            className="flex flex-col transition-transform duration-620 ease-(--gd-spring) motion-reduce:transition-none"
            style={{ transform: `translateY(-${Number(digit) * 10}%)` }}
          >
            {DIGITS.map((glyph) => (
              <span key={glyph} className="block h-[1em]">
                {glyph}
              </span>
            ))}
          </span>
        </span>
      ))}
    </span>
  );
}

export function StreakCard({
  title = "Reading streak",
  streak = 12,
  best = 16,
  goal = "Read 20 pages",
  week = DEFAULT_WEEK,
  actionLabel = "Log today's pages",
  doneLabel = "Logged today",
  loggedToday,
  status: statusProp,
  disabled = false,
  forceState,
  onCheckIn,
  className,
}: StreakCardProps) {
  const titleId = useId();
  const flame = useRef<HTMLSpanElement>(null);
  const todayMarker = useRef<HTMLSpanElement>(null);
  const [own, setOwn] = useState<GumdropStatus>("idle");
  const [ownDone, setOwnDone] = useState(false);
  // Logging runs idle, loading, success (the check draws), then settles as done, which is also how a day that is
  // already logged renders.
  const done = Boolean(loggedToday) || statusProp === "success" || ownDone;
  const status: GumdropStatus = done ? "idle" : (statusProp ?? own);
  const logged = done || status === "success";
  const count = streak + (logged ? 1 : 0);
  const doneThisWeek = week.filter((day) => day.state === "done").length + (logged ? 1 : 0);
  const toBeat = best + 1 - count;
  const wasLogged = useRef(logged);

  // The streak grew: the flame hops and today's gumdrop pops while its check draws itself.
  useEffect(() => {
    if (logged && !wasLogged.current) {
      play(
        flame.current,
        [
          { transform: "translateY(0) scale(1, 1)" },
          { transform: "translateY(0) scale(1.12, .86)", offset: 0.16 },
          { transform: "translateY(-14px) scale(.92, 1.1)", offset: 0.46 },
          { transform: "translateY(0) scale(1.08, .92)", offset: 0.74 },
          { transform: "translateY(0) scale(1, 1)" },
        ],
        720,
      );
      play(
        todayMarker.current,
        [{ scale: "1" }, { scale: "1.22", offset: 0.35 }, { scale: "0.94", offset: 0.68 }, { scale: "1" }],
        560,
      );
    }
    wasLogged.current = logged;
  }, [logged]);

  useEffect(() => {
    if (own !== "success") return;
    const timer = setTimeout(() => {
      setOwnDone(true);
      setOwn("idle");
    }, 1200);
    return () => clearTimeout(timer);
  }, [own]);

  function checkIn() {
    if (done || status !== "idle") return;
    const result = onCheckIn?.();
    if (!isThenable(result)) {
      setOwn("success");
      return;
    }
    setOwn("loading");
    Promise.resolve(result).then(
      () => setOwn("success"),
      () => setOwn("idle"),
    );
  }

  return (
    <article
      aria-labelledby={titleId}
      data-streak=""
      data-days={streak}
      data-best={best}
      className={cx(
        SPRING,
        LINE,
        TINT,
        CANDY,
        CORE,
        "@container/card relative w-full rounded-[max(calc(var(--iu-radius)+14px),24px)] border-2 border-(--gd-line) bg-(--iu-surface) p-[calc(24px*var(--iu-density))] font-(family-name:--iu-font) text-(--iu-foreground) shadow-[0_6px_0_0_var(--gd-line)]",
        className,
      )}
    >
      <header className="flex items-center gap-2">
        <svg viewBox="0 0 24 24" aria-hidden="true" className="size-6 shrink-0" strokeLinejoin="round">
          <path
            d="M6 3h9l5 5v11.5a1.5 1.5 0 0 1-1.5 1.5h-12A1.5 1.5 0 0 1 5 19.5v-15A1.5 1.5 0 0 1 6.5 3Z"
            strokeWidth={2}
            className="fill-(--iu-accent) stroke-(--gd-candy)"
          />
          <path
            d="M15 3v3.5A1.5 1.5 0 0 0 16.5 8H20Z"
            strokeWidth={2}
            className="fill-(--gd-tint) stroke-(--gd-candy)"
          />
        </svg>
        <h2 id={titleId} className="text-sm font-bold">
          {title}
        </h2>
      </header>
      <p className="absolute -top-4 right-6 rotate-[5deg] rounded-full border-2 border-(--gd-line) bg-(--gd-tint) px-3 py-1 text-xs leading-none font-extrabold shadow-[0_2px_0_0_var(--gd-line)] [word-spacing:0.12em]">
        <span aria-hidden="true" data-streak-badge="">
          {logged && count > best ? "New best" : `Best ${best}`}
        </span>
        <span data-streak-best="" className="sr-only">{`Personal best: ${Math.max(best, count)} days`}</span>
      </p>

      <div className="mt-6 flex items-center justify-between gap-3">
        <p className="flex min-w-0 flex-wrap items-baseline gap-x-2">
          <span data-streak-count="" className="sr-only">{`${count} day streak`}</span>
          <span
            aria-hidden="true"
            className="mt-[-0.13em] mb-[-0.11em] ml-[-0.06em] text-[76px] leading-none font-extrabold tracking-tighter tabular-nums @[19rem]/card:text-[84px]"
          >
            <RollingNumber value={count} />
          </span>
          <span aria-hidden="true" className="text-lg leading-none font-bold">
            day streak
          </span>
        </p>
        <span ref={flame} data-streak-flame="" aria-hidden="true" className="-my-1 block shrink-0 origin-bottom">
          <svg viewBox="0 0 56 68" className="h-18 w-15 overflow-visible" strokeLinejoin="round">
            <path d={FLAME} transform="translate(0 4)" className="fill-(--gd-candy)" />
            <path d={FLAME} strokeWidth={2.5} className="fill-(--iu-accent) stroke-(--gd-candy)" />
            <path d={FLAME_CORE} strokeWidth={2} className="fill-(--gd-core) stroke-(--gd-candy)" />
            <ellipse cx="20" cy="36" rx="2.6" ry="6" transform="rotate(18 20 36)" className="fill-white/45" />
          </svg>
        </span>
      </div>
      <p data-streak-note="" className="mt-3 text-sm text-pretty text-(--iu-muted)">
        {logged
          ? count > best
            ? "That's a new personal best."
            : `${toBeat} more ${toBeat === 1 ? "day" : "days"} to beat your best.`
          : `${goal} today to make it ${streak + 1}.`}
      </p>

      <div className="mt-6">
        <div className="flex items-baseline justify-between gap-3 text-[13px]">
          <h3 className="font-bold">This week</h3>
          <p data-streak-week="" className="text-(--iu-muted) tabular-nums">
            {`${doneThisWeek} of ${week.length} days`}
          </p>
        </div>
        <ol className="mt-3 grid grid-cols-7 gap-2">
          {week.map((day) => {
            const state = day.state === "today" && logged ? "done" : day.state;
            return (
              <li
                key={day.name}
                data-state={state}
                data-today={day.state === "today" ? "" : undefined}
                className="group/day flex flex-col items-center gap-2"
              >
                <span
                  ref={day.state === "today" ? todayMarker : undefined}
                  data-streak-marker=""
                  aria-hidden="true"
                  className="block w-full max-w-9 origin-bottom"
                >
                  <svg viewBox="0 4 36 36" className="block w-full overflow-visible" strokeLinejoin="round">
                    <path
                      d={DROP}
                      transform="translate(0 3)"
                      className="fill-transparent transition-[fill] duration-300 group-data-[state=done]/day:fill-(--gd-candy) motion-reduce:transition-none"
                    />
                    <path
                      d={DROP}
                      strokeWidth={2}
                      className="fill-(--iu-foreground)/7 stroke-transparent transition-[fill,stroke] duration-300 group-data-[state=done]/day:fill-(--iu-accent) group-data-[state=done]/day:stroke-(--gd-candy) group-data-[state=today]/day:fill-(--iu-surface) group-data-[state=today]/day:stroke-(--iu-accent) group-data-[state=today]/day:[stroke-dasharray:3.2_3] motion-reduce:transition-none"
                    />
                    <ellipse
                      cx="12.5"
                      cy="16"
                      rx="1.8"
                      ry="3.6"
                      transform="rotate(32 12.5 16)"
                      className="fill-white/45 opacity-0 group-data-[state=done]/day:opacity-100"
                    />
                    <path
                      d="M12.5 23.5 16.2 27.2 23.8 19.4"
                      pathLength={1}
                      fill="none"
                      strokeWidth={2.75}
                      strokeLinecap="round"
                      className="stroke-(--iu-accent-foreground) transition-[stroke-dashoffset] delay-150 duration-420 ease-out [stroke-dasharray:1] [stroke-dashoffset:1] group-data-[state=done]/day:[stroke-dashoffset:0] motion-reduce:transition-none"
                    />
                  </svg>
                </span>
                <span
                  aria-hidden="true"
                  className="text-xs font-bold text-(--iu-muted) group-data-today/day:text-(--iu-foreground)"
                >
                  {day.label}
                </span>
                <span data-streak-day="" className="sr-only">
                  {`${day.name}: ${day.state === "today" && logged ? "today, logged" : DAY_STATE_TEXT[day.state]}`}
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      <GumdropButton
        className={cx(DONE, "mt-6 w-full")}
        status={status}
        data-done={done ? "" : undefined}
        aria-disabled={done || undefined}
        icon={<Check size={18} strokeWidth={2.5} aria-hidden="true" className="hidden group-data-done/gd:block" />}
        disabled={disabled}
        forceState={forceState}
        loadingText="Logging today's pages"
        successText={`Logged. ${streak + 1} day streak.`}
        data-action="check-in"
        onClick={checkIn}
      >
        {done ? doneLabel : actionLabel}
      </GumdropButton>
    </article>
  );
}

export type GumdropButtonsProps = {
  /** Shows loading or success on the publish buttons and the check-in. Leave unset for live behaviour. */
  status?: GumdropStatus;
  disabled?: boolean;
  /** Renders every button in one interaction state, for previews and visual tests. */
  forceState?: GumdropForceState;
  publishLabel?: string;
  publishOptions?: GumdropMenuItem[];
  /** "now" for the main button, or the id of the menu choice. Return a promise to show loading, then success. */
  onPublish?: (choice: string) => unknown;
  onSaveDraft?: () => unknown;
  onPreview?: () => unknown;
  onDelete?: () => unknown;
  onNewNote?: () => unknown;
  onBookmarkChange?: (saved: boolean) => void;
  onShare?: () => unknown;
  onMore?: () => unknown;
  /** Content of the streak card. */
  streak?: Omit<StreakCardProps, "status" | "disabled" | "forceState" | "onCheckIn" | "className">;
  onCheckIn?: () => unknown;
  className?: string;
};

export function GumdropButtons({
  status,
  disabled = false,
  forceState,
  publishLabel = "Publish",
  publishOptions = DEFAULT_PUBLISH_OPTIONS,
  onPublish,
  onSaveDraft,
  onPreview,
  onDelete,
  onNewNote,
  onBookmarkChange,
  onShare,
  onMore,
  streak,
  onCheckIn,
  className = "",
}: GumdropButtonsProps) {
  const [saved, setSaved] = useState(false);
  const shared = { disabled, forceState };

  return (
    <section
      aria-label="Gumdrop buttons"
      data-gumdrop-buttons=""
      className={cx(
        "@container w-full font-(family-name:--iu-font) text-(--iu-foreground) [--gd-tray:color-mix(in_oklab,var(--iu-accent)_14%,var(--iu-surface))] dark:[--gd-tray:color-mix(in_oklab,var(--iu-accent)_9%,var(--iu-background))]",
        className,
      )}
    >
      <div className="relative mx-auto grid w-full max-w-270 @[44rem]:grid-cols-[minmax(0,1fr)_23rem] @[44rem]:items-center @5xl:grid-cols-[minmax(0,1fr)_23.5rem]">
        <div
          aria-hidden="true"
          className="absolute inset-0 hidden rounded-[max(calc(var(--iu-radius)*3),32px)] bg-(--gd-tray) @[44rem]:block @5xl:top-14 @5xl:bottom-14"
        />
        <div className="relative flex flex-col items-start gap-[calc(28px*var(--iu-density))] rounded-[max(calc(var(--iu-radius)*2.4),24px)] bg-(--gd-tray) px-5 pt-7 pb-20 @md:px-8 @[44rem]:rounded-none @[44rem]:bg-transparent @[44rem]:py-10 @[44rem]:pr-6 @5xl:pr-8 @5xl:pl-14">
          {(["md", "sm"] as const).map((size) => (
            <div
              key={size}
              role="group"
              aria-label={size === "md" ? "Note actions" : "Note actions, compact"}
              className={cx("flex flex-wrap items-center", size === "md" ? "gap-x-3 gap-y-4" : "gap-x-2 gap-y-3")}
            >
              <div className={cx("flex items-center", size === "md" ? "gap-3" : "gap-2")}>
                <GumdropSplitButton
                  size={size}
                  label={publishLabel}
                  items={publishOptions}
                  status={status}
                  onClick={() => onPublish?.("now")}
                  onSelect={(choice) => onPublish?.(choice)}
                  {...shared}
                />
                <GumdropButton
                  variant="secondary"
                  size={size}
                  data-action="save-draft"
                  loadingText="Saving draft"
                  successText="Draft saved"
                  onClick={() => onSaveDraft?.()}
                  {...shared}
                >
                  Save draft
                </GumdropButton>
              </div>
              <div className={cx("flex items-center", size === "md" ? "gap-3" : "gap-2")}>
                <GumdropButton
                  variant="ghost"
                  size={size}
                  data-action="preview"
                  icon={<Eye size={size === "md" ? 18 : 16} strokeWidth={2} aria-hidden="true" />}
                  onClick={() => onPreview?.()}
                  {...shared}
                >
                  Preview
                </GumdropButton>
                <GumdropButton
                  variant="destructive"
                  size={size}
                  icon={<Trash2 size={size === "md" ? 18 : 16} strokeWidth={2} aria-hidden="true" />}
                  data-action="delete"
                  loadingText="Deleting draft"
                  successText="Draft deleted"
                  onClick={() => onDelete?.()}
                  {...shared}
                >
                  Delete
                </GumdropButton>
              </div>
            </div>
          ))}

          <div role="group" aria-label="Note shortcuts" className="flex flex-wrap items-center gap-x-4 gap-y-4">
            {(["md", "sm"] as const).map((size) => {
              const iconSize = size === "md" ? 20 : 16;
              return (
                <Fragment key={size}>
                  {size === "sm" ? (
                    <span
                      aria-hidden="true"
                      className="hidden h-6 w-0.5 rounded-full bg-(--iu-foreground)/12 @lg:block @[44rem]:hidden @5xl:block"
                    />
                  ) : null}
                  <div className={cx("flex items-center", size === "md" ? "gap-3" : "gap-2")}>
                    <GumdropIconButton
                      size={size}
                      variant="primary"
                      label="New note"
                      data-action="new-note"
                      icon={<Plus size={iconSize} strokeWidth={2.5} aria-hidden="true" />}
                      onClick={() => onNewNote?.()}
                      {...shared}
                    />
                    <GumdropIconButton
                      size={size}
                      label="Save to reading list"
                      data-action="bookmark"
                      pressed={saved}
                      icon={
                        <Bookmark
                          size={iconSize}
                          strokeWidth={2}
                          aria-hidden="true"
                          className="transition-[fill] duration-200 group-aria-pressed/gd:fill-(--iu-accent) motion-reduce:transition-none"
                        />
                      }
                      onClick={() => {
                        setSaved(!saved);
                        onBookmarkChange?.(!saved);
                      }}
                      {...shared}
                    />
                    <GumdropIconButton
                      size={size}
                      label="Share note"
                      data-action="share"
                      icon={<Share size={iconSize} strokeWidth={2} aria-hidden="true" />}
                      onClick={() => onShare?.()}
                      {...shared}
                    />
                    <GumdropIconButton
                      size={size}
                      variant="ghost"
                      label="More actions"
                      data-action="more"
                      icon={<Ellipsis size={iconSize} strokeWidth={2.5} aria-hidden="true" />}
                      onClick={() => onMore?.()}
                      {...shared}
                    />
                  </div>
                </Fragment>
              );
            })}
          </div>
        </div>

        <div className="relative z-10 -mt-12 px-3 @[44rem]:mt-0 @[44rem]:mr-8 @[44rem]:px-0 @[44rem]:py-10 @5xl:mr-10 @5xl:py-0">
          <StreakCard {...streak} status={status} onCheckIn={onCheckIn} {...shared} />
        </div>
      </div>
    </section>
  );
}

export default GumdropButtons;
