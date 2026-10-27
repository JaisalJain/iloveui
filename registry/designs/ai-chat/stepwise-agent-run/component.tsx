"use client";

import { Fragment, useEffect, useId, useRef, useState, type ChangeEvent, type KeyboardEvent } from "react";
import { MotionConfig, motion, useReducedMotion } from "motion/react";
import {
  ArrowUp,
  Ban,
  Check,
  ChevronDown,
  ChevronRight,
  Circle,
  Copy,
  Cpu,
  LoaderCircle,
  Paperclip,
  RotateCcw,
  Square,
  TriangleAlert,
  Wrench,
  X,
} from "lucide-react";

export type StepwiseStep = {
  id: string;
  kind: "llm" | "tool";
  name: string;
  /** Seconds from the start of the run. */
  start: number;
  end: number;
  tokensIn: number;
  tokensOut: number;
  costUsd: number;
  input: string;
  output: string;
  /** A step that failed: shown with its error instead of an output. */
  error?: string;
};

export type StepwiseAttachment = { id: string; name: string; size: string };
export type StepwiseModel = { id: string; name: string; detail: string };

export type StepwiseAgentRunProps = {
  agent?: string;
  runId?: string;
  task?: string;
  requestedBy?: string;
  steps?: StepwiseStep[];
  answer?: string;
  /** The step whose output streams into the answer. */
  answerStepId?: string;
  /** "running" plays the run from `runFrom`; "error" fails the step with an `error`. */
  status?: "idle" | "running" | "error";
  /** Seconds into the run where playback starts (or where the run failed). */
  runFrom?: number;
  budgetUsd?: number;
  models?: StepwiseModel[];
  defaultModelId?: string;
  attachments?: StepwiseAttachment[];
  defaultExpandedStepId?: string | null;
  onSend?: (message: { text: string; attachments: StepwiseAttachment[]; modelId: string }) => void;
  onStop?: (atSeconds: number) => void;
  onRetry?: (stepId: string | null) => void;
  onCopy?: (text: string) => void;
  onModelChange?: (modelId: string) => void;
  onAttach?: (files: File[]) => void;
  onRunEnd?: () => void;
  className?: string;
};

export const STEPWISE_STEPS: StepwiseStep[] = [
  {
    id: "s1",
    kind: "llm",
    name: "plan",
    start: 0,
    end: 1.18,
    tokensIn: 2104,
    tokensOut: 312,
    costUsd: 0.0061,
    input: "system + task · 2,104 tokens\nTools: stripe.*, ledger.*, fx.rate, slack.post",
    output:
      "1. Pull October payouts from Stripe\n2. Pull payout entries from the ledger\n3. Match by payout id, then amount\n4. Explain any gap, post to #finance-close",
  },
  {
    id: "s2",
    kind: "tool",
    name: "stripe.list_payouts",
    start: 1.18,
    end: 2.64,
    tokensIn: 0,
    tokensOut: 0,
    costUsd: 0,
    input: '{\n  "created_gte": "2026-10-01",\n  "created_lt": "2026-11-01",\n  "limit": 100\n}',
    output: '{\n  "count": 43,\n  "total": "€182,406.12",\n  "currency": "eur"\n}',
  },
  {
    id: "s3",
    kind: "tool",
    name: "ledger.query",
    start: 1.24,
    end: 3.92,
    tokensIn: 0,
    tokensOut: 0,
    costUsd: 0,
    input: "select payout_id, amount, booked_at\nfrom journal\nwhere account = '1210'\n  and booked_at >= '2026-10-01'",
    output: '{\n  "rows": 44,\n  "total": "€182,393.80",\n  "scanned": "1.8 MB"\n}',
  },
  {
    id: "s4",
    kind: "llm",
    name: "compare",
    start: 3.92,
    end: 6.81,
    tokensIn: 6880,
    tokensOut: 904,
    costUsd: 0.0188,
    input: "43 payouts + 44 ledger rows · 6,880 tokens",
    output: "42 match exactly. po_1Q8xR2 differs by €12.32. One ledger row (manual fee) has no payout.",
  },
  {
    id: "s5",
    kind: "tool",
    name: "stripe.get_payout",
    start: 6.86,
    end: 7.41,
    tokensIn: 0,
    tokensOut: 0,
    costUsd: 0,
    input: '{ "id": "po_1Q8xR2" }',
    output: '{\n  "amount": "€1,204.50",\n  "arrival_date": "2026-10-14",\n  "fee": "€0.00"\n}',
  },
  {
    id: "s6",
    kind: "tool",
    name: "ledger.get_entry",
    start: 6.88,
    end: 8.07,
    tokensIn: 0,
    tokensOut: 0,
    costUsd: 0,
    input: '{ "payout_id": "po_1Q8xR2" }',
    output: '{\n  "amount": "€1,192.18",\n  "booked_at": "2026-10-13",\n  "fx_source": "USD"\n}',
  },
  {
    id: "s7",
    kind: "tool",
    name: "fx.rate",
    start: 8.07,
    end: 8.39,
    tokensIn: 0,
    tokensOut: 0,
    costUsd: 0,
    input: '{ "pair": "EUR/USD", "dates": ["2026-10-13", "2026-10-14"] }',
    output: '{ "2026-10-13": 1.0751, "2026-10-14": 1.0862 }',
  },
  {
    id: "s8",
    kind: "llm",
    name: "draft_report",
    start: 8.39,
    end: 12.86,
    tokensIn: 5214,
    tokensOut: 1402,
    costUsd: 0.0337,
    input: "findings + fx rates · 5,214 tokens",
    output: "Report drafted: 1 mismatch explained, 1 manual fee flagged.",
  },
  {
    id: "s9",
    kind: "tool",
    name: "slack.post",
    start: 12.9,
    end: 14.21,
    tokensIn: 0,
    tokensOut: 0,
    costUsd: 0,
    input: '{ "channel": "#finance-close", "blocks": 4 }',
    output: '{ "ok": true, "ts": "1792055821.004" }',
  },
];

export const STEPWISE_ANSWER =
  "43 of 44 payouts reconcile. One mismatch: po_1Q8xR2 on 14 Oct is €1,204.50 in Stripe but €1,192.18 in the ledger, a €12.32 gap that matches booking it at the 13 Oct EUR/USD rate (1.0751) instead of 14 Oct (1.0862). The extra ledger row is a manual €40.00 bank fee with no payout. I posted the summary to #finance-close.";

export const STEPWISE_MODELS: StepwiseModel[] = [
  { id: "reason-2", name: "Reason 2", detail: "$3 / $15 per M" },
  { id: "fast-2", name: "Fast 2", detail: "$0.25 / $1.25 per M" },
  { id: "reason-2-long", name: "Reason 2 · 1M ctx", detail: "$6 / $22.50 per M" },
];

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--iu-accent)";
const R = "rounded-[min(var(--iu-radius),6px)]";
const LABEL = "text-[11px] font-medium tracking-[0.06em] text-(--iu-muted) uppercase";
const ICON_BUTTON = `inline-flex h-7 cursor-pointer items-center gap-1.5 px-2 text-[12px] text-(--iu-muted) transition-colors duration-100 motion-reduce:transition-none pointer-coarse:h-10 pointer-fine:hover:bg-(--iu-foreground)/6 pointer-fine:hover:text-(--iu-foreground) ${R} ${FOCUS}`;
const SPEED = 1.6;
const TICK_MS = 50;

type StepState = "queued" | "running" | "done" | "failed" | "cancelled";

function cx(...values: (string | false | null | undefined)[]) {
  return values.filter(Boolean).join(" ");
}

function usd(value: number) {
  return `$${value.toFixed(4)}`;
}

function seconds(value: number) {
  return `${value.toFixed(2)} s`;
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  }
}

function stepState(step: StepwiseStep, t: number, phase: "running" | "done" | "stopped" | "failed"): StepState {
  if (phase === "failed" && step.error) return "failed";
  if (t >= step.end) return "done";
  if (phase === "running") return t >= step.start ? "running" : "queued";
  if (phase === "done") return "done";
  return "cancelled";
}

function fraction(step: StepwiseStep, t: number) {
  if (t <= step.start) return 0;
  if (t >= step.end) return 1;
  return (t - step.start) / (step.end - step.start);
}

function StateIcon({ state }: { state: StepState }) {
  if (state === "done")
    return <Check size={14} strokeWidth={2} aria-hidden="true" className="text-(--iu-foreground)" />;
  if (state === "running")
    return (
      <LoaderCircle
        size={14}
        strokeWidth={2}
        aria-hidden="true"
        className="animate-spin text-(--iu-accent) motion-reduce:animate-none"
      />
    );
  if (state === "failed")
    return <TriangleAlert size={14} strokeWidth={2} aria-hidden="true" className="text-red-700 dark:text-red-400" />;
  if (state === "cancelled")
    return <Ban size={14} strokeWidth={1.75} aria-hidden="true" className="text-(--iu-muted)" />;
  return <Circle size={12} strokeWidth={1.75} aria-hidden="true" className="text-(--iu-muted)" />;
}

const STATE_LABEL: Record<StepState, string> = {
  queued: "Queued",
  running: "Running",
  done: "Done",
  failed: "Failed",
  cancelled: "Cancelled",
};

function ModelSelect({
  models,
  value,
  onChange,
  disabled,
}: {
  models: StepwiseModel[];
  value: string;
  onChange: (id: string) => void;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const selected = models.find((model) => model.id === value) ?? models[0];

  useEffect(() => {
    if (!open) return;
    listRef.current?.focus();
    const onPointer = (event: PointerEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open]);

  const openList = () => {
    setActive(
      Math.max(
        0,
        models.findIndex((model) => model.id === value),
      ),
    );
    setOpen(true);
  };
  const choose = (index: number) => {
    const model = models[index];
    if (model) onChange(model.id);
    setOpen(false);
    buttonRef.current?.focus();
  };
  const onKey = (event: KeyboardEvent<HTMLUListElement>) => {
    if (event.key === "ArrowDown") setActive((index) => Math.min(models.length - 1, index + 1));
    else if (event.key === "ArrowUp") setActive((index) => Math.max(0, index - 1));
    else if (event.key === "Home") setActive(0);
    else if (event.key === "End") setActive(models.length - 1);
    else if (event.key === "Enter" || event.key === " ") choose(active);
    else if (event.key === "Escape") {
      setOpen(false);
      buttonRef.current?.focus();
    } else if (event.key === "Tab") {
      choose(active);
      return;
    } else return;
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <div ref={wrapRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            openList();
          }
        }}
        className={cx(
          "inline-flex h-7 cursor-pointer items-center gap-1 border border-(--iu-foreground)/25 px-2 font-mono text-[11px] disabled:cursor-not-allowed disabled:opacity-60 pointer-coarse:h-10",
          R,
          FOCUS,
        )}
      >
        {selected?.name}
        <ChevronDown size={12} strokeWidth={1.75} aria-hidden="true" className="text-(--iu-muted)" />
      </button>
      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          tabIndex={-1}
          aria-label="Model"
          aria-activedescendant={`${listId}-${active}`}
          onKeyDown={onKey}
          className={cx(
            "absolute bottom-full left-0 z-30 mb-1 w-[min(260px,calc(100vw-48px))] border border-(--iu-border) bg-(--iu-surface) p-1 shadow-[0_8px_24px_color-mix(in_oklab,black_14%,transparent)] outline-none dark:border-(--iu-foreground)/15",
            R,
          )}
        >
          {models.map((model, index) => (
            <li
              key={model.id}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={model.id === value}
              onPointerEnter={() => setActive(index)}
              onClick={() => choose(index)}
              className={cx(
                "flex cursor-pointer items-center gap-2 px-2 py-1.5 text-[12px]",
                R,
                index === active && "bg-(--iu-foreground)/6",
              )}
            >
              <Check
                size={12}
                strokeWidth={2}
                aria-hidden="true"
                className={cx("shrink-0", model.id === value ? "opacity-100" : "opacity-0")}
              />
              <span className="flex-1 font-mono">{model.name}</span>
              <span className="font-mono text-[11px] text-(--iu-muted) tabular-nums">{model.detail}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function StepwiseAgentRun({
  agent = "payout-reconciler",
  runId = "run_7Kq2Vx91",
  task = "Reconcile October Stripe payouts against the ledger and flag anything that does not match.",
  requestedBy = "Dalia Brenner",
  steps = STEPWISE_STEPS,
  answer = STEPWISE_ANSWER,
  answerStepId = "s8",
  status = "idle",
  runFrom = 0,
  budgetUsd = 0.25,
  models = STEPWISE_MODELS,
  defaultModelId = "reason-2",
  attachments: initialAttachments = [{ id: "a1", name: "oct-close-checklist.md", size: "3 KB" }],
  defaultExpandedStepId = "s7",
  onSend,
  onStop,
  onRetry,
  onCopy,
  onModelChange,
  onAttach,
  onRunEnd,
  className = "",
}: StepwiseAgentRunProps) {
  const reduceMotion = useReducedMotion();
  const ids = useId();
  const rootRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const visibleRef = useRef(true);
  const endedRef = useRef(false);

  const duration = steps.reduce((max, step) => Math.max(max, step.end), 0);
  const runKey = `${status}-${runFrom}-${duration}`;
  const [clock, setClock] = useState<{ key: string; t: number } | null>(null);
  const [stoppedAt, setStoppedAt] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<string | null>(defaultExpandedStepId);
  // Rows opened by the reader fade in; the row open at first render is visible without JavaScript.
  const [toggled, setToggled] = useState(false);
  const [draft, setDraft] = useState("");
  const [attachments, setAttachments] = useState(initialAttachments);
  const [modelId, setModelId] = useState(defaultModelId);
  const [copied, setCopied] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  const running = status === "running" && stoppedAt === null;
  const t = running
    ? clock?.key === runKey
      ? clock.t
      : reduceMotion && runFrom === 0
        ? duration
        : runFrom
    : status === "error"
      ? runFrom
      : (stoppedAt ?? duration);
  const live = running && t < duration;
  const phase: "running" | "done" | "stopped" | "failed" =
    status === "error" ? "failed" : stoppedAt !== null && stoppedAt < duration ? "stopped" : live ? "running" : "done";

  useEffect(() => {
    const node = rootRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver((entries) => {
      visibleRef.current = entries[0]?.isIntersecting ?? true;
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!running || reduceMotion) return;
    endedRef.current = false;
    const timer = window.setInterval(() => {
      if (!visibleRef.current) return;
      setClock((current) => ({
        key: runKey,
        t: Math.min(duration, (current?.key === runKey ? current.t : runFrom) + (TICK_MS / 1000) * SPEED),
      }));
    }, TICK_MS);
    return () => window.clearInterval(timer);
  }, [running, reduceMotion, runKey, duration, runFrom]);

  useEffect(() => {
    if (!running || t < duration || endedRef.current) return;
    endedRef.current = true;
    onRunEnd?.();
  }, [running, t, duration, onRunEnd]);

  const failedStep = phase === "failed" ? steps.find((step) => step.error) : undefined;
  const states = steps.map((step) => stepState(step, t, phase));
  const tokensIn = steps.reduce((sum, step) => sum + Math.round(step.tokensIn * fraction(step, t)), 0);
  const tokensOut = steps.reduce((sum, step) => sum + Math.round(step.tokensOut * fraction(step, t)), 0);
  const cost = steps.reduce((sum, step) => sum + step.costUsd * fraction(step, t), 0);
  const doneCount = states.filter((state) => state === "done").length;
  const answerStep = steps.find((step) => step.id === answerStepId);
  const answerShown = answerStep ? Math.round(answer.length * fraction(answerStep, t)) : answer.length;
  const answerText = answer.slice(0, answerShown);
  const finished = phase === "done";

  const stop = () => {
    if (!live) return;
    setStoppedAt(t);
    setAnnouncement(`Run stopped at ${seconds(t)}`);
    onStop?.(t);
    inputRef.current?.focus();
  };

  const retry = (stepId: string | null) => {
    setStoppedAt(null);
    setClock(null);
    onRetry?.(stepId);
  };

  const send = () => {
    const text = draft.trim();
    if (!text || live) return;
    onSend?.({ text, attachments, modelId });
    setDraft("");
    setAttachments([]);
    setStoppedAt(null);
    setClock(null);
  };

  const onFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;
    setAttachments((list) => [
      ...list,
      ...files.map((file, index) => ({
        id: `${file.name}-${list.length + index}`,
        name: file.name,
        size: formatBytes(file.size),
      })),
    ]);
    setAnnouncement(`Attached ${files.map((file) => file.name).join(", ")}`);
    onAttach?.(files);
    event.target.value = "";
  };

  const copy = async () => {
    if (!(await copyText(answerText))) return;
    setCopied(true);
    setAnnouncement("Answer copied");
    onCopy?.(answerText);
    window.setTimeout(() => setCopied(false), 1500);
  };

  const statusPill =
    phase === "running"
      ? {
          label: "Running",
          icon: (
            <LoaderCircle
              size={12}
              strokeWidth={2}
              aria-hidden="true"
              className="animate-spin motion-reduce:animate-none"
            />
          ),
          tone: "border-(--iu-accent) text-(--iu-foreground)",
        }
      : phase === "failed"
        ? {
            label: "Failed",
            icon: <TriangleAlert size={12} strokeWidth={2} aria-hidden="true" />,
            tone: "border-red-700/50 text-red-700 dark:border-red-400/50 dark:text-red-400",
          }
        : phase === "stopped"
          ? {
              label: "Stopped",
              icon: <Square size={10} strokeWidth={2} aria-hidden="true" className="fill-current" />,
              tone: "border-(--iu-foreground)/30 text-(--iu-muted)",
            }
          : {
              label: "Succeeded",
              icon: <Check size={12} strokeWidth={2} aria-hidden="true" />,
              tone: "border-emerald-700/40 text-emerald-800 dark:border-emerald-400/40 dark:text-emerald-300",
            };

  const ticks = Array.from({ length: Math.floor(duration / 2) + 1 }, (_, index) => index * 2);

  return (
    <MotionConfig
      reducedMotion="user"
      transition={reduceMotion ? { duration: 0 } : { duration: 0.12, ease: "easeOut" }}
    >
      <section
        ref={rootRef}
        aria-label={`Agent run ${runId}`}
        onKeyDown={(event) => {
          if (event.key === "Escape" && live) stop();
        }}
        className={cx(
          "@container w-full overflow-hidden border border-(--iu-border) bg-(--iu-surface) font-(family-name:--iu-font) text-[13px] leading-[1.4] text-(--iu-foreground) dark:border-(--iu-foreground)/12",
          R,
          className,
        )}
      >
        {/* Run header: identity, status and totals */}
        <header className="border-b border-(--iu-border) dark:border-(--iu-foreground)/10">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5">
            <span className="font-mono text-[12px] font-medium">{agent}</span>
            <span className="font-mono text-[11px] text-(--iu-muted)">{runId}</span>
            <span
              className={cx(
                "inline-flex h-6 items-center gap-1.5 border px-2 text-[11px] font-medium",
                R,
                statusPill.tone,
              )}
            >
              {statusPill.icon}
              {statusPill.label}
            </span>
            <span className="ml-auto text-[11px] text-(--iu-muted)">Started by {requestedBy} · 27 Oct 2026, 16:04</span>
          </div>
          <dl className="grid grid-cols-2 border-t border-(--iu-border) @lg:grid-cols-5 dark:border-(--iu-foreground)/8">
            {[
              { label: "Elapsed", value: seconds(t), sub: `of ${seconds(duration)}` },
              {
                label: "Steps",
                value: `${doneCount} / ${steps.length}`,
                sub: `${steps.filter((s) => s.kind === "tool").length} tool calls`,
              },
              { label: "Tokens in", value: tokensIn.toLocaleString("en-US"), sub: "prompt + context" },
              { label: "Tokens out", value: tokensOut.toLocaleString("en-US"), sub: "completion" },
            ].map((item, index) => (
              <div
                key={item.label}
                className={cx(
                  "border-(--iu-border) px-4 py-[calc(10px*var(--iu-density))] dark:border-(--iu-foreground)/8",
                  index % 2 === 1 && "border-l",
                  index >= 2 && "border-t @lg:border-t-0",
                  index > 0 && "@lg:border-l",
                )}
              >
                <dt className={LABEL}>{item.label}</dt>
                <dd className="mt-1 font-mono text-[18px] leading-none font-medium tabular-nums">{item.value}</dd>
                <dd className="mt-1 text-[11px] text-(--iu-muted) tabular-nums">{item.sub}</dd>
              </div>
            ))}
            <div className="col-span-2 border-t border-(--iu-border) px-4 py-[calc(10px*var(--iu-density))] @lg:col-span-1 @lg:border-t-0 @lg:border-l dark:border-(--iu-foreground)/8">
              <dt className={LABEL}>Cost</dt>
              <dd className="mt-1 font-mono text-[18px] leading-none font-medium tabular-nums">{usd(cost)}</dd>
              <dd className="mt-2">
                <div
                  role="meter"
                  aria-label="Run budget"
                  aria-valuemin={0}
                  aria-valuemax={budgetUsd}
                  aria-valuenow={Number(cost.toFixed(4))}
                  aria-valuetext={`${usd(cost)} of ${usd(budgetUsd)} budget`}
                  className="flex items-center gap-2"
                >
                  <span
                    aria-hidden="true"
                    className="block h-1 flex-1 overflow-hidden rounded-full bg-(--iu-foreground)/10"
                  >
                    <span
                      className="block h-full bg-(--iu-accent)"
                      style={{ width: `${Math.min(100, (cost / budgetUsd) * 100)}%` }}
                    />
                  </span>
                  <span className="font-mono text-[11px] text-(--iu-muted) tabular-nums">
                    {Math.round((cost / budgetUsd) * 100)}% of ${budgetUsd.toFixed(2)}
                  </span>
                </div>
              </dd>
            </div>
          </dl>
        </header>

        <div className="grid grid-cols-1 @4xl:grid-cols-[340px_minmax(0,1fr)]">
          {/* Conversation */}
          <div className="flex min-w-0 flex-col border-b border-(--iu-border) @4xl:border-r @4xl:border-b-0 dark:border-(--iu-foreground)/10">
            <div className="flex flex-1 flex-col gap-4 p-4">
              <div>
                <p className={LABEL}>Task · {requestedBy}</p>
                <p className="mt-1.5 text-[14px] leading-[1.5] text-pretty">{task}</p>
              </div>
              <div aria-busy={live} className="border-t border-(--iu-border) pt-4 dark:border-(--iu-foreground)/8">
                <p className={LABEL}>Answer · {agent}</p>
                {answerShown === 0 && phase === "running" ? (
                  <div aria-hidden="true" className="mt-2 space-y-2">
                    <span className={cx("block h-3 w-full bg-(--iu-foreground)/8", R)} />
                    <span className={cx("block h-3 w-11/12 bg-(--iu-foreground)/8", R)} />
                    <span className={cx("block h-3 w-2/3 bg-(--iu-foreground)/8", R)} />
                  </div>
                ) : answerShown === 0 ? (
                  <p className="mt-1.5 text-[13px] text-(--iu-muted)">No answer was written before the run ended.</p>
                ) : (
                  <p className="mt-1.5 text-[14px] leading-[1.55] text-pretty">
                    {answerText}
                    {live && answerShown < answer.length && (
                      <span
                        aria-hidden="true"
                        className="ml-0.5 inline-block h-[1em] w-1.5 translate-y-[0.15em] bg-(--iu-accent)"
                      />
                    )}
                  </p>
                )}
                {phase === "failed" && failedStep && (
                  <div
                    role="alert"
                    className={cx(
                      "mt-3 border border-red-700/30 bg-red-700/5 p-3 dark:border-red-400/30 dark:bg-red-400/8",
                      R,
                    )}
                  >
                    <p className="flex items-center gap-1.5 text-[12px] font-medium text-red-800 dark:text-red-300">
                      <TriangleAlert size={14} strokeWidth={2} aria-hidden="true" />
                      {failedStep.name} failed
                    </p>
                    <p className="mt-1 text-[12px] leading-[1.45] text-pretty">{failedStep.error}</p>
                    <button
                      type="button"
                      onClick={() => retry(failedStep.id)}
                      className={cx(
                        "mt-2 inline-flex h-7 cursor-pointer items-center gap-1.5 border border-(--iu-foreground)/30 bg-(--iu-surface) px-2.5 text-[12px] font-medium pointer-coarse:h-10 pointer-fine:hover:border-(--iu-foreground)",
                        R,
                        FOCUS,
                      )}
                    >
                      <RotateCcw size={12} strokeWidth={2} aria-hidden="true" />
                      Retry from {failedStep.name}
                    </button>
                  </div>
                )}
                {(finished || phase === "stopped") && answerShown > 0 && (
                  <div className="mt-2 -ml-2 flex items-center gap-1">
                    <button type="button" onClick={copy} className={ICON_BUTTON}>
                      {copied ? (
                        <Check size={14} strokeWidth={2} aria-hidden="true" />
                      ) : (
                        <Copy size={14} strokeWidth={1.75} aria-hidden="true" />
                      )}
                      {copied ? "Copied" : "Copy"}
                    </button>
                    <button type="button" onClick={() => retry(null)} className={ICON_BUTTON}>
                      <RotateCcw size={14} strokeWidth={1.75} aria-hidden="true" />
                      Retry run
                    </button>
                  </div>
                )}
              </div>
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                send();
              }}
              className="border-t border-(--iu-border) p-3 dark:border-(--iu-foreground)/10"
            >
              <div
                className={cx(
                  "border border-(--iu-foreground)/30 bg-(--iu-background) focus-within:border-(--iu-accent)",
                  R,
                )}
              >
                {attachments.length > 0 && (
                  <ul aria-label="Attachments" className="flex flex-wrap gap-1 px-2 pt-2">
                    {attachments.map((file) => (
                      <li
                        key={file.id}
                        className={cx(
                          "inline-flex h-6 items-center gap-1 border border-(--iu-border) bg-(--iu-surface) pl-2 font-mono text-[11px] dark:border-(--iu-foreground)/12",
                          R,
                        )}
                      >
                        {file.name}
                        <span className="text-(--iu-muted)">{file.size}</span>
                        <button
                          type="button"
                          aria-label={`Remove ${file.name}`}
                          onClick={() => {
                            setAttachments((list) => list.filter((item) => item.id !== file.id));
                            setAnnouncement(`Removed ${file.name}`);
                            inputRef.current?.focus();
                          }}
                          className={cx(
                            "inline-flex size-6 cursor-pointer items-center justify-center text-(--iu-muted) pointer-coarse:size-10 pointer-fine:hover:text-(--iu-foreground)",
                            R,
                            FOCUS,
                          )}
                        >
                          <X size={12} strokeWidth={2} aria-hidden="true" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <label htmlFor={`${ids}-draft`} className="sr-only">
                  Message {agent}
                </label>
                <textarea
                  ref={inputRef}
                  id={`${ids}-draft`}
                  rows={2}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                      event.preventDefault();
                      send();
                    }
                  }}
                  placeholder="Follow up or give the agent a new task"
                  className="block w-full resize-none bg-transparent px-2.5 py-2 text-[13px] text-(--iu-foreground) outline-none placeholder:text-(--iu-muted)"
                />
                <div className="flex items-center gap-1.5 px-2 pb-2">
                  <input
                    ref={fileRef}
                    type="file"
                    multiple
                    aria-label="Attach files"
                    tabIndex={-1}
                    className="sr-only"
                    onChange={onFiles}
                  />
                  <button
                    type="button"
                    aria-label="Attach files"
                    onClick={() => fileRef.current?.click()}
                    className={cx(
                      "inline-flex size-7 cursor-pointer items-center justify-center text-(--iu-muted) pointer-coarse:size-10 pointer-fine:hover:bg-(--iu-foreground)/6 pointer-fine:hover:text-(--iu-foreground)",
                      R,
                      FOCUS,
                    )}
                  >
                    <Paperclip size={14} strokeWidth={1.75} aria-hidden="true" />
                  </button>
                  <ModelSelect
                    models={models}
                    value={modelId}
                    disabled={live}
                    onChange={(id) => {
                      setModelId(id);
                      onModelChange?.(id);
                    }}
                  />
                  <span className="ml-auto hidden font-mono text-[11px] text-(--iu-muted) @sm:inline">
                    {live ? "Esc stops" : "⌘ Enter runs"}
                  </span>
                  {live ? (
                    <button
                      type="button"
                      onClick={stop}
                      className={cx(
                        "ml-auto inline-flex h-7 cursor-pointer items-center gap-1.5 border border-(--iu-foreground)/40 px-2.5 text-[12px] font-medium @sm:ml-0 pointer-coarse:h-10",
                        R,
                        FOCUS,
                      )}
                    >
                      <Square size={10} strokeWidth={2} aria-hidden="true" className="fill-current" />
                      Stop run
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={draft.trim().length === 0}
                      className={cx(
                        "ml-auto inline-flex h-7 cursor-pointer items-center gap-1.5 bg-(--iu-accent) px-2.5 text-[12px] font-medium text-(--iu-accent-foreground) disabled:cursor-not-allowed disabled:bg-(--iu-foreground)/10 disabled:text-(--iu-muted) @sm:ml-0 pointer-coarse:h-10",
                        R,
                        FOCUS,
                      )}
                    >
                      Run
                      <ArrowUp size={12} strokeWidth={2} aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>

          {/* Timeline */}
          <div className="min-w-0">
            <div className="flex items-center justify-between gap-3 border-b border-(--iu-border) px-4 py-2 dark:border-(--iu-foreground)/10">
              <h3 className={LABEL}>Trace</h3>
              <span className="font-mono text-[11px] text-(--iu-muted) tabular-nums">
                {steps.filter((s) => s.kind === "llm").length} model calls ·{" "}
                {steps.filter((s) => s.kind === "tool").length} tool calls
              </span>
            </div>
            <div className="[scrollbar-gutter:stable] overflow-x-auto">
              <table className="w-full min-w-0 table-fixed border-collapse text-left">
                <caption className="sr-only">Steps of run {runId} with timing, tokens and cost</caption>
                <colgroup>
                  <col className="w-[44%] @2xl:w-[180px]" />
                  <col />
                  <col className="w-[60px]" />
                  <col className="w-0 @2xl:w-[68px]" />
                  <col className="w-0 @2xl:w-[72px]" />
                </colgroup>
                <thead className="sticky top-0 z-10 bg-(--iu-surface)">
                  <tr className={cx(LABEL, "border-b border-(--iu-border) dark:border-(--iu-foreground)/10")}>
                    <th scope="col" className="px-3 py-2 font-medium">
                      Step
                    </th>
                    <th scope="col" className="px-3 py-2 font-medium">
                      <span className="sr-only">Timeline</span>
                      <span
                        aria-hidden="true"
                        className="block font-mono text-[10px] font-normal tracking-normal normal-case tabular-nums @md:hidden"
                      >
                        0 – {duration.toFixed(1)} s
                      </span>
                      <span aria-hidden="true" className="relative hidden h-3 @md:block">
                        {ticks.map((tick) => (
                          <span
                            key={tick}
                            className="absolute top-0 -translate-x-1/2 font-mono text-[10px] font-normal tracking-normal normal-case tabular-nums first:translate-x-0"
                            style={{ left: `${(tick / duration) * 100}%` }}
                          >
                            {tick}s
                          </span>
                        ))}
                      </span>
                    </th>
                    <th scope="col" className="px-3 py-2 text-right font-medium">
                      Time
                    </th>
                    <th scope="col" className="hidden px-2 py-2 text-right font-medium @2xl:table-cell @2xl:w-[68px]">
                      Tokens
                    </th>
                    <th scope="col" className="hidden px-3 py-2 text-right font-medium @2xl:table-cell @2xl:w-[72px]">
                      Cost
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {steps.map((step, index) => {
                    const state = states[index] ?? "queued";
                    const open = expanded === step.id;
                    const f = fraction(step, t);
                    const panelId = `${ids}-${step.id}`;
                    const shownEnd = state === "running" || state === "failed" ? Math.min(t, step.end) : step.end;
                    return (
                      <Fragment key={step.id}>
                        <tr
                          className={cx(
                            "border-b border-(--iu-border) dark:border-(--iu-foreground)/8",
                            index % 2 === 1 && "bg-(--iu-foreground)/[0.025]",
                            open && "bg-(--iu-foreground)/5 shadow-[inset_2px_0_0_var(--iu-accent)]",
                            state === "failed" && "bg-red-700/5 dark:bg-red-400/8",
                          )}
                        >
                          <th scope="row" className="px-1 py-0 font-normal">
                            <button
                              type="button"
                              aria-expanded={open}
                              aria-controls={panelId}
                              onClick={() => {
                                setToggled(true);
                                setExpanded(open ? null : step.id);
                              }}
                              className={cx(
                                "flex min-h-[calc(32px*var(--iu-density))] w-full cursor-pointer items-center gap-1.5 px-2 text-left pointer-coarse:min-h-10",
                                R,
                                FOCUS,
                              )}
                            >
                              <ChevronRight
                                size={12}
                                strokeWidth={2}
                                aria-hidden="true"
                                className={cx(
                                  "shrink-0 text-(--iu-muted) transition-transform duration-100 motion-reduce:transition-none",
                                  open && "rotate-90",
                                )}
                              />
                              <StateIcon state={state} />
                              <span className="sr-only">{STATE_LABEL[state]}: </span>
                              {step.kind === "llm" ? (
                                <Cpu
                                  size={12}
                                  strokeWidth={1.75}
                                  aria-hidden="true"
                                  className="hidden shrink-0 text-(--iu-muted) @md:block"
                                />
                              ) : (
                                <Wrench
                                  size={12}
                                  strokeWidth={1.75}
                                  aria-hidden="true"
                                  className="hidden shrink-0 text-(--iu-muted) @md:block"
                                />
                              )}
                              <span
                                className={cx(
                                  "truncate font-mono text-[12px]",
                                  state === "queued" && "text-(--iu-muted)",
                                )}
                              >
                                {step.name}
                              </span>
                            </button>
                          </th>
                          <td className="px-3 py-1.5">
                            <span aria-hidden="true" className="relative block h-3.5">
                              {ticks.slice(1).map((tick) => (
                                <span
                                  key={tick}
                                  className="absolute inset-y-0 w-px bg-(--iu-foreground)/6"
                                  style={{ left: `${(tick / duration) * 100}%` }}
                                />
                              ))}
                              <span
                                className={cx(
                                  "absolute inset-y-0.5 block",
                                  R,
                                  state === "failed"
                                    ? "bg-red-600 dark:bg-red-400"
                                    : state === "running"
                                      ? "bg-(--iu-accent)"
                                      : state === "cancelled" || state === "queued"
                                        ? "border border-dashed border-(--iu-foreground)/40"
                                        : step.kind === "llm"
                                          ? "bg-(--iu-foreground)/70"
                                          : "bg-(--iu-foreground)/30",
                                )}
                                style={{
                                  left: `${(step.start / duration) * 100}%`,
                                  width: `max(2px, ${((state === "cancelled" ? step.end - step.start : Math.max(0, shownEnd - step.start)) / duration) * 100}%)`,
                                }}
                              />
                              {live && (
                                <span
                                  className="absolute -inset-y-1.5 w-px bg-(--iu-accent)"
                                  style={{ left: `${(t / duration) * 100}%` }}
                                />
                              )}
                            </span>
                          </td>
                          <td className="px-3 py-1.5 text-right font-mono text-[12px] tabular-nums">
                            {state === "queued" ? (
                              <span className="text-(--iu-muted)">–</span>
                            ) : (
                              (shownEnd - step.start).toFixed(2)
                            )}
                          </td>
                          <td className="hidden px-2 py-1.5 text-right font-mono text-[12px] text-(--iu-muted) tabular-nums @2xl:table-cell">
                            {step.kind === "llm"
                              ? Math.round((step.tokensIn + step.tokensOut) * f).toLocaleString("en-US")
                              : "–"}
                          </td>
                          <td className="hidden px-3 py-1.5 text-right font-mono text-[12px] tabular-nums @2xl:table-cell">
                            {step.costUsd > 0 ? usd(step.costUsd * f) : <span className="text-(--iu-muted)">–</span>}
                          </td>
                        </tr>
                        {open && (
                          <tr
                            id={panelId}
                            className="border-b border-(--iu-border) bg-(--iu-background) dark:border-(--iu-foreground)/8"
                          >
                            <td colSpan={5} className="p-0">
                              <motion.div
                                initial={toggled ? { opacity: 0 } : false}
                                animate={{ opacity: 1 }}
                                className="grid grid-cols-1 gap-px bg-(--iu-border) @2xl:grid-cols-2 dark:bg-(--iu-foreground)/8"
                              >
                                <div className="bg-(--iu-background) p-3">
                                  <p className={LABEL}>Input · {step.kind === "llm" ? "prompt" : "arguments"}</p>
                                  <pre className="mt-1.5 overflow-x-auto font-mono text-[11px] leading-[1.5] whitespace-pre-wrap">
                                    {step.input}
                                  </pre>
                                </div>
                                <div className="bg-(--iu-background) p-3">
                                  <p className={LABEL}>
                                    {step.error ? "Error" : "Output"} · {seconds(step.start)} → {seconds(step.end)}
                                  </p>
                                  {state === "failed" ? (
                                    <pre className="mt-1.5 font-mono text-[11px] leading-[1.5] whitespace-pre-wrap text-red-800 dark:text-red-300">
                                      {step.error}
                                    </pre>
                                  ) : state === "done" ? (
                                    <pre className="mt-1.5 overflow-x-auto font-mono text-[11px] leading-[1.5] whitespace-pre-wrap">
                                      {step.output}
                                    </pre>
                                  ) : (
                                    <p className="mt-1.5 font-mono text-[11px] text-(--iu-muted)">
                                      {state === "running"
                                        ? "Waiting for output…"
                                        : state === "cancelled"
                                          ? "Cancelled before it returned."
                                          : "Not started."}
                                    </p>
                                  )}
                                </div>
                              </motion.div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2.5 text-[11px] text-(--iu-muted)">
              <span className="inline-flex items-center gap-1.5">
                <span aria-hidden="true" className={cx("inline-block h-2 w-4 bg-(--iu-foreground)/70", R)} />
                Model call
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span aria-hidden="true" className={cx("inline-block h-2 w-4 bg-(--iu-foreground)/30", R)} />
                Tool call
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span aria-hidden="true" className={cx("inline-block h-2 w-4 bg-(--iu-accent)", R)} />
                Running
              </span>
              <span className="ml-auto font-mono tabular-nums">Parallel calls overlap on the same seconds.</span>
            </p>
          </div>
        </div>

        <p aria-live="polite" className="sr-only">
          {live ? `Running ${steps.find((_, index) => states[index] === "running")?.name ?? ""}` : announcement}
        </p>
      </section>
    </MotionConfig>
  );
}

export default StepwiseAgentRun;
