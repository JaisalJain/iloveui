"use client";

import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "motion/react";
import {
  Check,
  ChevronDown,
  Copy,
  ExternalLink,
  GitBranch,
  Loader,
  RotateCcw,
  RotateCw,
  Rocket,
  ScrollText,
  Undo2,
} from "lucide-react";

export type ForgelineForceState = "hover" | "focus" | "active";
export type ForgelineStatus = "idle" | "loading" | "success";
export type ForgelineTarget = "production" | "preview" | "canary";
export type ForgelineView = "logs" | "metrics" | "traces";

export type ForgelineButtonSystemProps = {
  project?: string;
  branch?: string;
  commit?: string;
  url?: string;
  previousVersion?: string;
  /** Controlled deploy status; omit to follow the promise returned by `onDeploy`. */
  status?: ForgelineStatus;
  /** Real progress from 0 to 1 while deploying; without it the button shows elapsed time. */
  progress?: number;
  step?: string;
  /** Seconds the last deploy took, shown on success. */
  lastDuration?: number;
  disabled?: boolean;
  forceState?: ForgelineForceState;
  defaultView?: ForgelineView;
  onDeploy?: (target: ForgelineTarget) => void | Promise<void>;
  onRollback?: () => void;
  onRedeploy?: () => void;
  onCopyUrl?: () => void;
  onOpen?: () => void;
  onViewChange?: (view: ForgelineView) => void;
  className?: string;
};

const MENU: { id: ForgelineTarget | "rollback"; label: string; hint: string }[] = [
  { id: "production", label: "Deploy to production", hint: "⌘↵" },
  { id: "preview", label: "Deploy to preview", hint: "⌥↵" },
  { id: "canary", label: "Promote canary to 100%", hint: "" },
  { id: "rollback", label: "Roll back", hint: "" },
];

const VIEWS: { id: ForgelineView; label: string }[] = [
  { id: "logs", label: "Logs" },
  { id: "metrics", label: "Metrics" },
  { id: "traces", label: "Traces" },
];

const ring =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--iu-accent) data-[force-state=focus]:outline-2 data-[force-state=focus]:outline-offset-2 data-[force-state=focus]:outline-(--iu-accent)";
const radius = "rounded-[min(var(--iu-radius),8px)]";
const base = `relative inline-flex h-9 items-center justify-center gap-2 text-[13px] font-medium whitespace-nowrap select-none transition-[background-color,border-color,color,translate] duration-150 ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none disabled:cursor-not-allowed pointer-coarse:h-10 ${radius} ${ring}`;
const press = "enabled:active:translate-y-px data-[force-state=active]:translate-y-px";
const variants = {
  primary: `bg-(--iu-accent) text-(--iu-accent-foreground) pointer-fine:enabled:hover:bg-[color-mix(in_oklab,var(--iu-accent)_94%,var(--iu-foreground))] data-[force-state=hover]:bg-[color-mix(in_oklab,var(--iu-accent)_94%,var(--iu-foreground))] enabled:active:bg-[color-mix(in_oklab,var(--iu-accent)_88%,var(--iu-foreground))] data-[force-state=active]:bg-[color-mix(in_oklab,var(--iu-accent)_88%,var(--iu-foreground))] disabled:bg-(--iu-foreground)/10 disabled:text-(--iu-muted)`,
  secondary: `border border-(--iu-foreground)/20 bg-(--iu-foreground)/[0.04] text-(--iu-foreground) pointer-fine:enabled:hover:border-(--iu-foreground)/35 pointer-fine:enabled:hover:bg-(--iu-foreground)/8 data-[force-state=hover]:border-(--iu-foreground)/35 data-[force-state=hover]:bg-(--iu-foreground)/8 enabled:active:bg-(--iu-foreground)/12 data-[force-state=active]:bg-(--iu-foreground)/12 disabled:border-dashed disabled:text-(--iu-muted)`,
  ghost: `text-(--iu-muted) pointer-fine:enabled:hover:bg-(--iu-foreground)/8 pointer-fine:enabled:hover:text-(--iu-foreground) data-[force-state=hover]:bg-(--iu-foreground)/8 data-[force-state=hover]:text-(--iu-foreground) enabled:active:bg-(--iu-foreground)/12 data-[force-state=active]:bg-(--iu-foreground)/12 disabled:opacity-60`,
  danger: `border border-red-700/50 text-red-700 pointer-fine:enabled:hover:bg-red-600/10 data-[force-state=hover]:bg-red-600/10 enabled:active:bg-red-600/15 data-[force-state=active]:bg-red-600/15 disabled:border-dashed disabled:opacity-60 dark:border-red-400/50 dark:text-red-400 dark:pointer-fine:enabled:hover:bg-red-400/10 dark:data-[force-state=hover]:bg-red-400/10`,
};

function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

function Kbd({ children, tone = "muted" }: { children: ReactNode; tone?: "muted" | "onAccent" }) {
  return (
    <kbd
      className={cx(
        "inline-flex h-5 min-w-5 items-center justify-center rounded-[min(var(--iu-radius),4px)] px-1 font-mono text-[11px] leading-none font-medium",
        tone === "onAccent"
          ? "bg-(--iu-accent-foreground)/12 text-(--iu-accent-foreground)"
          : "border border-(--iu-foreground)/15 text-(--iu-muted)",
      )}
    >
      {children}
    </kbd>
  );
}

/** Tooltips: 400ms delay on first open, instant for 500ms after one closes. */
function useTooltips() {
  const [open, setOpen] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastClosed = useRef(0);
  const show = useCallback((id: string) => {
    if (timer.current) clearTimeout(timer.current);
    if (Date.now() - lastClosed.current < 500) setOpen(id);
    else timer.current = setTimeout(() => setOpen(id), 400);
  }, []);
  const hide = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setOpen((current) => {
      if (current) lastClosed.current = Date.now();
      return null;
    });
  }, []);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  return { open, show, hide };
}

function IconButton({
  id,
  label,
  shortcut,
  icon,
  tips,
  disabled,
  forceState,
  size = "md",
  tone = "ghost",
  onClick,
}: {
  id: string;
  label: string;
  shortcut?: string;
  icon: ReactNode;
  tips: ReturnType<typeof useTooltips>;
  disabled?: boolean;
  forceState?: ForgelineForceState;
  size?: "sm" | "md" | "lg";
  tone?: "ghost" | "secondary";
  onClick?: () => void;
}) {
  const tipId = `${id}-tip`;
  const open = tips.open === id;
  return (
    <span className="relative inline-flex">
      <button
        type="button"
        aria-label={label}
        aria-describedby={open ? tipId : undefined}
        aria-keyshortcuts={shortcut}
        disabled={disabled}
        data-force-state={forceState}
        onClick={onClick}
        onPointerEnter={(event) => {
          if (event.pointerType === "mouse") tips.show(id);
        }}
        onPointerLeave={tips.hide}
        onFocus={(event) => {
          if (event.currentTarget.matches(":focus-visible")) tips.show(id);
        }}
        onBlur={tips.hide}
        className={cx(
          base,
          variants[tone],
          press,
          size === "sm" && "size-6 pointer-coarse:size-10",
          size === "md" && "size-8 pointer-coarse:size-10",
          size === "lg" && "size-10",
        )}
      >
        {icon}
      </button>
      {open && (
        <span
          id={tipId}
          role="tooltip"
          className="pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 z-30 flex origin-bottom -translate-x-1/2 items-center gap-2 rounded-[min(var(--iu-radius),6px)] border border-(--iu-foreground)/15 bg-(--iu-surface) px-2 py-1 text-[12px] whitespace-nowrap text-(--iu-foreground) shadow-lg dark:shadow-none"
        >
          {label}
          {shortcut && <Kbd>{shortcut}</Kbd>}
        </span>
      )}
    </span>
  );
}

function formatElapsed(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export function ForgelineButtonSystem({
  project = "atlas-web",
  branch = "main",
  commit = "7f3c2a1",
  url = "atlas-web-7f3c2a1.forgeline.app",
  previousVersion = "v214",
  status,
  progress,
  step = "Building",
  lastDuration = 38,
  disabled = false,
  forceState,
  defaultView = "logs",
  onDeploy,
  onRollback,
  onRedeploy,
  onCopyUrl,
  onOpen,
  onViewChange,
  className = "",
}: ForgelineButtonSystemProps) {
  const reduceMotion = useReducedMotion();
  const id = useId();
  const tips = useTooltips();
  const [internal, setInternal] = useState<ForgelineStatus>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [took, setTook] = useState(lastDuration);
  const [view, setView] = useState<ForgelineView>(defaultView);
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const viewRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const current = status ?? internal;
  const busy = current === "loading";

  // Elapsed seconds while an uncontrolled deploy runs: honest progress when no percentage is known.
  useEffect(() => {
    if (current !== "loading" || progress !== undefined) return;
    const started = Date.now();
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 250);
    return () => {
      clearInterval(timer);
      setElapsed(0);
    };
  }, [current, progress]);

  useEffect(() => {
    if (status !== undefined || internal !== "success") return;
    const timer = setTimeout(() => setInternal("idle"), 2400);
    return () => clearTimeout(timer);
  }, [internal, status]);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1400);
    return () => clearTimeout(timer);
  }, [copied]);

  const deploy = useCallback(
    async (target: ForgelineTarget) => {
      if (disabled || current !== "idle") return;
      setAnnouncement(`Deploying ${project} to ${target}`);
      const started = Date.now();
      const result = onDeploy?.(target);
      if (status !== undefined) return;
      setInternal("loading");
      try {
        await result;
        const seconds = Math.max(1, Math.round((Date.now() - started) / 1000));
        setTook(seconds);
        setInternal("success");
        setAnnouncement(`Deployed to ${target} in ${seconds} seconds`);
      } catch {
        setInternal("idle");
        setAnnouncement("Deploy failed");
      }
    },
    [current, disabled, onDeploy, project, status],
  );

  const copyUrl = useCallback(() => {
    setCopied(true);
    setAnnouncement("Deployment URL copied");
    onCopyUrl?.();
  }, [onCopyUrl]);

  // Shortcuts: ⌘/Ctrl+Enter deploys, ⌥+Enter deploys a preview, C copies the URL, R redeploys.
  useEffect(() => {
    function onKey(event: globalThis.KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable='true']")) return;
      if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        void deploy("production");
      } else if (event.key === "Enter" && event.altKey) {
        event.preventDefault();
        void deploy("preview");
      } else if (!event.metaKey && !event.ctrlKey && !event.altKey && (event.key === "c" || event.key === "C")) {
        if (!disabled) copyUrl();
      } else if (!event.metaKey && !event.ctrlKey && !event.altKey && (event.key === "r" || event.key === "R")) {
        if (!disabled) onRedeploy?.();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [copyUrl, deploy, disabled, onRedeploy]);

  useEffect(() => {
    if (!menuOpen) return;
    function onPointer(event: PointerEvent) {
      const target = event.target as Node;
      if (!menuRef.current?.contains(target) && !triggerRef.current?.contains(target)) setMenuOpen(false);
    }
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [menuOpen]);

  function items() {
    return Array.from(menuRef.current?.querySelectorAll<HTMLButtonElement>("[role=menuitem]") ?? []);
  }

  function openMenu(focus: "first" | "last") {
    setMenuOpen(true);
    requestAnimationFrame(() => {
      const list = items();
      (focus === "first" ? list[0] : list[list.length - 1])?.focus();
    });
  }

  function closeMenu(returnFocus = true) {
    setMenuOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  }

  function onTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openMenu("first");
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      openMenu("last");
    }
  }

  function onMenuKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const list = items();
    const index = list.indexOf(document.activeElement as HTMLButtonElement);
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const next = (index + (event.key === "ArrowDown" ? 1 : -1) + list.length) % list.length;
      list[next]?.focus();
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      (event.key === "Home" ? list[0] : list[list.length - 1])?.focus();
    } else if (event.key === "Escape") {
      event.preventDefault();
      closeMenu();
    } else if (event.key === "Tab") {
      closeMenu(false);
    }
  }

  function choose(item: (typeof MENU)[number]["id"]) {
    closeMenu();
    if (item === "rollback") {
      setAnnouncement(`Rolling back to ${previousVersion}`);
      onRollback?.();
    } else void deploy(item);
  }

  function onViewKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next = index;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (index + 1) % VIEWS.length;
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (index - 1 + VIEWS.length) % VIEWS.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = VIEWS.length - 1;
    else return;
    event.preventDefault();
    const nextView = VIEWS[next];
    if (!nextView) return;
    setView(nextView.id);
    onViewChange?.(nextView.id);
    viewRefs.current[next]?.focus();
  }

  const percent = progress === undefined ? null : Math.round(Math.min(1, Math.max(0, progress)) * 100);
  const deployLabel =
    current === "loading"
      ? percent === null
        ? `${step} ${formatElapsed(elapsed)}`
        : `${step} ${percent}%`
      : current === "success"
        ? `Live in ${took}s`
        : "Deploy";
  const micro = "font-mono text-[10px] tracking-[0.08em] text-(--iu-muted) uppercase";

  return (
    <MotionConfig
      reducedMotion="user"
      transition={reduceMotion ? { duration: 0 } : { duration: 0.16, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <section
        aria-label={`${project} deployment controls`}
        className={cx(
          "@container relative border border-(--iu-foreground)/12 bg-(--iu-surface) font-(family-name:--iu-font) text-(--iu-foreground)",
          radius,
          className,
        )}
      >
        {/* Corner ticks */}
        {[
          "-top-px -left-px border-t border-l",
          "-top-px -right-px border-t border-r",
          "-bottom-px -left-px border-b border-l",
          "-right-px -bottom-px border-r border-b",
        ].map((position) => (
          <span key={position} aria-hidden="true" className={cx("absolute size-2.5 border-(--iu-accent)", position)} />
        ))}

        {/* Deployment header */}
        <header className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-dashed border-(--iu-foreground)/15 px-4 py-3 @2xl:px-5">
          <span className="inline-flex items-center gap-2 text-[13px] font-medium">
            <span
              aria-hidden="true"
              className={cx(
                "size-2 rounded-full",
                busy ? "bg-amber-500 dark:bg-amber-400" : "bg-emerald-600 dark:bg-emerald-400",
              )}
            />
            {busy ? "Deploying" : "Ready"}
          </span>
          <span className="font-mono text-[13px]">{project}</span>
          <span className="inline-flex items-center gap-1.5 font-mono text-[12px] text-(--iu-muted)">
            <GitBranch size={14} strokeWidth={1.5} aria-hidden="true" />
            {branch} @ {commit}
          </span>
          <span className="ml-auto hidden truncate font-mono text-[12px] text-(--iu-muted) @2xl:inline">{url}</span>
        </header>

        {/* The toolbar, as shipped */}
        <div className="flex flex-wrap items-center gap-3 px-4 py-4 @2xl:px-5">
          <div
            role="radiogroup"
            aria-label="Panel"
            className="inline-flex h-9 items-center gap-0.5 rounded-[min(var(--iu-radius),8px)] border border-(--iu-foreground)/12 bg-(--iu-background) p-0.5 pointer-coarse:h-11"
          >
            {VIEWS.map((option, index) => {
              const active = view === option.id;
              return (
                <button
                  key={option.id}
                  ref={(node) => {
                    viewRefs.current[index] = node;
                  }}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  tabIndex={active ? 0 : -1}
                  disabled={disabled}
                  data-force-state={index === 1 ? forceState : undefined}
                  onClick={() => {
                    setView(option.id);
                    onViewChange?.(option.id);
                  }}
                  onKeyDown={(event) => onViewKeyDown(event, index)}
                  className={cx(
                    "relative h-full rounded-[min(var(--iu-radius),6px)] px-3 text-[13px] font-medium transition-colors duration-150 disabled:cursor-not-allowed motion-reduce:transition-none",
                    active
                      ? "text-(--iu-foreground)"
                      : "text-(--iu-muted) data-[force-state=hover]:text-(--iu-foreground) pointer-fine:enabled:hover:text-(--iu-foreground)",
                    ring,
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId={`${id}-view`}
                      aria-hidden="true"
                      className="absolute inset-0 rounded-[min(var(--iu-radius),6px)] border border-(--iu-foreground)/15 bg-(--iu-surface)"
                    />
                  )}
                  <span className="relative">{option.label}</span>
                </button>
              );
            })}
          </div>

          <div role="group" aria-label="Deployment actions" className="inline-flex items-center gap-0.5">
            <IconButton
              id={`${id}-copy`}
              label={copied ? "Copied" : "Copy URL"}
              shortcut="C"
              tips={tips}
              disabled={disabled}
              forceState={forceState}
              onClick={copyUrl}
              icon={
                copied ? (
                  <Check size={16} strokeWidth={1.5} aria-hidden="true" />
                ) : (
                  <Copy size={16} strokeWidth={1.5} aria-hidden="true" />
                )
              }
            />
            <IconButton
              id={`${id}-redeploy`}
              label="Redeploy"
              shortcut="R"
              tips={tips}
              disabled={disabled || busy}
              onClick={onRedeploy}
              icon={<RotateCw size={16} strokeWidth={1.5} aria-hidden="true" />}
            />
            <IconButton
              id={`${id}-open`}
              label="Open deployment"
              tips={tips}
              disabled={disabled}
              onClick={onOpen}
              icon={<ExternalLink size={16} strokeWidth={1.5} aria-hidden="true" />}
            />
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={disabled}
              data-force-state={forceState}
              onClick={() => {
                setView("logs");
                onViewChange?.("logs");
              }}
              className={cx(base, variants.secondary, press, "px-3.5")}
            >
              <ScrollText size={16} strokeWidth={1.5} aria-hidden="true" />
              Build log
            </button>

            {/* Split button: the action and a menu of related targets */}
            <div className="relative inline-flex">
              <button
                type="button"
                disabled={disabled}
                aria-disabled={busy || undefined}
                aria-keyshortcuts="Meta+Enter Control+Enter"
                data-force-state={forceState}
                onClick={() => void deploy("production")}
                className={cx(
                  base,
                  variants.primary,
                  press,
                  "min-w-40 overflow-hidden rounded-r-none pr-3 pl-3.5",
                  busy && "cursor-progress",
                )}
              >
                {percent !== null && busy && (
                  <motion.span
                    aria-hidden="true"
                    className="absolute inset-y-0 left-0 w-full origin-left bg-black/15"
                    initial={false}
                    animate={{ scaleX: percent / 100 }}
                  />
                )}
                <span className="relative grid">
                  <span
                    className={cx(
                      "col-start-1 row-start-1 inline-flex items-center gap-2",
                      current !== "idle" && "invisible",
                    )}
                  >
                    <Rocket size={16} strokeWidth={1.5} aria-hidden="true" />
                    Deploy
                    <Kbd tone="onAccent">⌘↵</Kbd>
                  </span>
                  {current !== "idle" && (
                    <span className="col-start-1 row-start-1 inline-flex items-center justify-center gap-2 font-mono text-[12px] tabular-nums">
                      {current === "loading" ? (
                        <Loader
                          size={14}
                          strokeWidth={1.75}
                          aria-hidden="true"
                          className="animate-spin [animation-duration:1.2s] motion-reduce:animate-none"
                        />
                      ) : (
                        <Check size={14} strokeWidth={2} aria-hidden="true" />
                      )}
                      {deployLabel}
                    </span>
                  )}
                </span>
              </button>
              <button
                ref={triggerRef}
                type="button"
                aria-label="More deploy options"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-controls={`${id}-menu`}
                disabled={disabled || busy}
                data-force-state={forceState}
                onClick={() => (menuOpen ? closeMenu(false) : openMenu("first"))}
                onKeyDown={onTriggerKeyDown}
                className={cx(
                  base,
                  variants.primary,
                  press,
                  "w-9 rounded-l-none border-l border-(--iu-accent-foreground)/20 pointer-coarse:w-10",
                )}
              >
                <ChevronDown
                  size={16}
                  strokeWidth={1.5}
                  aria-hidden="true"
                  className={cx(
                    "transition-transform duration-150 motion-reduce:transition-none",
                    menuOpen && "rotate-180",
                  )}
                />
              </button>
              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    ref={menuRef}
                    id={`${id}-menu`}
                    role="menu"
                    aria-label="Deploy options"
                    onKeyDown={onMenuKeyDown}
                    initial={{ opacity: 0, y: -4, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.98 }}
                    className="absolute top-[calc(100%+6px)] right-0 z-30 w-64 max-w-[calc(100vw-2rem)] origin-top-right rounded-[min(var(--iu-radius),8px)] border border-(--iu-foreground)/15 bg-(--iu-surface) p-1 shadow-lg dark:shadow-none"
                  >
                    {MENU.map((item) => (
                      <div key={item.id}>
                        {item.id === "rollback" && (
                          <div role="separator" className="my-1 border-t border-dashed border-(--iu-foreground)/15" />
                        )}
                        <button
                          type="button"
                          role="menuitem"
                          tabIndex={-1}
                          onClick={() => choose(item.id)}
                          className={cx(
                            "flex h-9 w-full items-center gap-2 rounded-[min(var(--iu-radius),6px)] px-2.5 text-left text-[13px] outline-none focus-visible:bg-(--iu-foreground)/8 pointer-coarse:h-11 pointer-fine:hover:bg-(--iu-foreground)/8",
                            item.id === "rollback" ? "text-red-700 dark:text-red-400" : "text-(--iu-foreground)",
                          )}
                        >
                          {item.id === "rollback" ? (
                            <Undo2 size={16} strokeWidth={1.5} aria-hidden="true" />
                          ) : (
                            <Rocket size={16} strokeWidth={1.5} aria-hidden="true" className="text-(--iu-muted)" />
                          )}
                          <span className="flex-1">
                            {item.id === "rollback" ? `Roll back to ${previousVersion}` : item.label}
                          </span>
                          {item.hint && <Kbd>{item.hint}</Kbd>}
                        </button>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
        <p aria-live="polite" className="sr-only">
          {announcement}
        </p>

        {/* The system, as a specimen sheet */}
        <div className="grid border-t border-dashed border-(--iu-foreground)/15 @xl:grid-cols-2 @4xl:grid-cols-4">
          {[
            {
              name: "Primary",
              spec: "h-9 · accent",
              body: (
                <button
                  type="button"
                  disabled={disabled}
                  data-force-state={forceState}
                  onClick={() => void deploy("canary")}
                  className={cx(base, variants.primary, press, "px-3.5")}
                >
                  Promote
                  <Kbd tone="onAccent">⌘↵</Kbd>
                </button>
              ),
            },
            {
              name: "Secondary",
              spec: "h-9 · 20% line",
              body: (
                <button
                  type="button"
                  disabled={disabled}
                  data-force-state={forceState}
                  onClick={onOpen}
                  className={cx(base, variants.secondary, press, "px-3.5")}
                >
                  <ExternalLink size={16} strokeWidth={1.5} aria-hidden="true" />
                  Visit
                </button>
              ),
            },
            {
              name: "Ghost",
              spec: "h-9 · no fill",
              body: (
                <button
                  type="button"
                  disabled={disabled}
                  data-force-state={forceState}
                  onClick={onRedeploy}
                  className={cx(base, variants.ghost, press, "px-3.5")}
                >
                  <RotateCw size={16} strokeWidth={1.5} aria-hidden="true" />
                  Redeploy
                  <Kbd>R</Kbd>
                </button>
              ),
            },
            {
              name: "Danger",
              spec: "h-9 · semantic",
              body: (
                <button
                  type="button"
                  disabled={disabled}
                  data-force-state={forceState}
                  onClick={onRollback}
                  className={cx(base, variants.danger, press, "px-3.5")}
                >
                  <RotateCcw size={16} strokeWidth={1.5} aria-hidden="true" />
                  Roll back to {previousVersion}
                </button>
              ),
            },
          ].map((specimen, index) => (
            <div
              key={specimen.name}
              className={cx(
                "flex flex-col gap-4 border-(--iu-foreground)/12 px-4 py-[calc(16px*var(--iu-density))] @2xl:px-5",
                index > 0 && "border-t border-dashed",
                index % 2 === 1 && "@xl:border-l @xl:border-solid",
                index === 1 && "@xl:border-t-0",
                index >= 2 && "@4xl:border-t-0 @4xl:border-l @4xl:border-solid",
              )}
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className={micro}>
                  0{index + 1} · {specimen.name}
                </span>
                <span className="font-mono text-[10px] text-(--iu-muted)">{specimen.spec}</span>
              </div>
              <div>{specimen.body}</div>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-dashed border-(--iu-foreground)/15 bg-[linear-gradient(to_right,color-mix(in_oklab,var(--iu-foreground)_5%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_oklab,var(--iu-foreground)_5%,transparent)_1px,transparent_1px)] [background-size:16px_16px] px-4 py-[calc(16px*var(--iu-density))] @2xl:px-5">
          <div className="flex items-center gap-4">
            <span className={micro}>05 · Icon</span>
            <span className="inline-flex items-end gap-2">
              {(["sm", "md", "lg"] as const).map((size) => (
                <span key={size} className="inline-flex flex-col items-center gap-1">
                  <IconButton
                    id={`${id}-size-${size}`}
                    label={`Copy URL, ${size === "sm" ? 24 : size === "md" ? 32 : 40}px`}
                    tips={tips}
                    size={size}
                    tone="secondary"
                    disabled={disabled}
                    forceState={forceState}
                    onClick={copyUrl}
                    icon={
                      <Copy size={size === "lg" ? 18 : size === "md" ? 16 : 14} strokeWidth={1.5} aria-hidden="true" />
                    }
                  />
                  <span aria-hidden="true" className="font-mono text-[10px] text-(--iu-muted) tabular-nums">
                    {size === "sm" ? 24 : size === "md" ? 32 : 40}
                  </span>
                </span>
              ))}
            </span>
          </div>
          <dl className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <dt className={micro}>06 · Keys</dt>
            {[
              ["⌘↵", "Deploy"],
              ["⌥↵", "Preview"],
              ["C", "Copy URL"],
              ["R", "Redeploy"],
            ].map(([keys, action]) => (
              <dd key={action} className="inline-flex items-center gap-2 text-[12px] text-(--iu-muted)">
                <Kbd>{keys}</Kbd>
                {action}
              </dd>
            ))}
          </dl>
        </div>
      </section>
    </MotionConfig>
  );
}

export default ForgelineButtonSystem;
