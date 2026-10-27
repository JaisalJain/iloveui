"use client";

import {
  Fragment,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import {
  ArrowUpRight,
  Ban,
  Check,
  ChevronRight,
  ChevronsUpDown,
  CircleCheck,
  CircleX,
  Copy,
  CornerDownLeft,
  Database,
  FileSpreadsheet,
  FileText,
  Paperclip,
  RotateCcw,
  Square,
  Webhook,
  X,
} from "lucide-react";

export type RelayCell = string | number;

export type RelayColumn = {
  key: string;
  label: string;
  align?: "left" | "right";
  /** Decimal places for numeric cells. */
  decimals?: number;
  /** Draws an inline bar scaled to the column's largest value; bar columns take the spare width. */
  bar?: boolean;
  /** Takes the spare width of the table (text columns that may wrap). */
  grow?: boolean;
  /** Dropped when the tool block is narrow. */
  optional?: boolean;
};

export type RelayResult = {
  columns: RelayColumn[];
  rows: Record<string, RelayCell>[];
  /** Mono note beside the result label, for example "4 rows · 2.1 GB scanned". */
  footnote?: string;
};

export type RelayToolCall = {
  type: "tool";
  id: string;
  /** The tool as the agent calls it, for example "warehouse.query". */
  name: string;
  /** "sql" shows the arguments as a query, "api" as JSON. */
  kind: "sql" | "api";
  summary: string;
  /** Arguments, already formatted. */
  args: string;
  status: "done" | "error" | "running";
  /** How long the call takes when it succeeds. */
  durationMs: number;
  result?: RelayResult;
  error?: { code: string; message: string; afterMs: number };
  /** Expanded when first shown. */
  open?: boolean;
};

export type RelayText = {
  type: "text";
  /** Plain text with **bold** and `code`; a blank line starts a new paragraph. */
  text: string;
};

export type RelayPart = RelayText | RelayToolCall;

export type RelayAttachment = { id: string; name: string; size: number };

export type RelayUserTurn = {
  id: string;
  role: "user";
  time: string;
  text: string;
  attachments?: RelayAttachment[];
};

export type RelayAgentTurn = {
  id: string;
  role: "agent";
  time: string;
  model: string;
  /** Tokens the turn adds to the context, tool results included. */
  tokens: number;
  parts: RelayPart[];
};

export type RelayTurn = RelayUserTurn | RelayAgentTurn;

export type RelayModel = { id: string; description: string; contextWindow: number };

export type RelayToolHealth = { name: string; status: "ready" | "degraded" };

export type RelaySuggestion = { text: string; tool: string };

export type RelaySendPayload = { text: string; attachments: RelayAttachment[]; modelId: string };

export type RelayAgentConsoleProps = {
  agentName?: string;
  title?: string;
  turns?: RelayTurn[];
  /** "streaming" plays the last agent turn as a live run with a Stop button. */
  status?: "idle" | "streaming";
  /** Where the first streaming run starts: a part index and how far into that part, from 0 to 1. */
  streamFrom?: { part: number; progress: number };
  /** true paces the last agent turn from complete data; false renders parts as given while you stream them. */
  simulate?: boolean;
  tokensPerSecond?: number;
  tools?: RelayToolHealth[];
  models?: RelayModel[];
  defaultModelId?: string;
  attachments?: RelayAttachment[];
  defaultDraft?: string;
  /** Tokens in the context window, the last agent turn included. */
  contextUsed?: number;
  suggestions?: RelaySuggestion[];
  onSend?: (message: RelaySendPayload) => void;
  onStop?: () => void;
  onRetry?: (turnId: string) => void;
  onRetryTool?: (turnId: string, callId: string) => void;
  onCopy?: (turnId: string, text: string) => void;
  onModelChange?: (modelId: string) => void;
  onAttach?: (files: File[]) => void;
  onRemoveAttachment?: (attachmentId: string) => void;
  onStreamEnd?: (turnId: string) => void;
  className?: string;
};

const DEFAULT_TURNS: RelayTurn[] = [
  {
    id: "turn-1",
    role: "user",
    time: "09:41",
    text: "Why did EU refunds spike on Saturday afternoon? Check the warehouse and any incidents in that window.",
  },
  {
    id: "turn-2",
    role: "agent",
    time: "09:41",
    model: "vesper-2",
    tokens: 1846,
    parts: [
      {
        type: "text",
        text: "Pulling Saturday's EU refunds by hour first, then I'll check the incident log for the same window.",
      },
      {
        type: "tool",
        id: "call-refunds",
        name: "warehouse.query",
        kind: "sql",
        summary: "payments.refunds · EU · 24 Oct",
        args: [
          "select created_hour as hour,",
          "       count(*) as refunds,",
          "       sum(amount_eur) as eur",
          "from payments.refunds",
          "where region = 'eu'",
          "  and created_day = '2026-10-24'",
          "group by 1",
          "order by refunds desc",
          "limit 4;",
        ].join("\n"),
        status: "done",
        durationMs: 2318,
        open: true,
        result: {
          columns: [
            { key: "hour", label: "hour" },
            { key: "refunds", label: "refunds", align: "right", bar: true },
            { key: "eur", label: "eur", align: "right", decimals: 2 },
          ],
          rows: [
            { hour: "14:00", refunds: 1284, eur: 61940.2 },
            { hour: "15:00", refunds: 977, eur: 47302.85 },
            { hour: "13:00", refunds: 212, eur: 9815.4 },
            { hour: "16:00", refunds: 131, eur: 6048.1 },
          ],
          footnote: "4 rows · 2.1 GB scanned",
        },
      },
      {
        type: "text",
        text: "Refunds jumped at 14:00: 1,284 in one hour against a Saturday median of 96. A spike that sharp usually means failing payments rather than customers changing their minds, so I'm checking the card gateway.",
      },
      {
        type: "tool",
        id: "call-incidents",
        name: "incidents.search",
        kind: "api",
        summary: "card-gateway · eu-west · 13:00–17:00",
        args: [
          "{",
          '  "service": "card-gateway",',
          '  "region": "eu-west",',
          '  "since": "2026-10-24 13:00",',
          '  "until": "2026-10-24 17:00",',
          '  "tz": "Europe/Berlin"',
          "}",
        ].join("\n"),
        status: "done",
        durationMs: 1406,
        result: {
          columns: [
            { key: "id", label: "id" },
            { key: "sev", label: "sev", optional: true },
            { key: "title", label: "title", grow: true },
            { key: "window", label: "window", align: "right" },
          ],
          rows: [
            { id: "INC-4471", sev: "SEV-2", title: "Issuer timeouts on 3-D Secure", window: "13:52–15:38" },
            { id: "INC-4473", sev: "SEV-4", title: "Slow settlement report exports", window: "15:05–15:21" },
          ],
          footnote: "2 incidents · CEST",
        },
      },
      {
        type: "text",
        text: "It's one incident. `INC-4471`, issuer timeouts on 3-D Secure, ran from 13:52 to 15:38 and covers the 2,261 refunds issued between 14:00 and 16:00. Timed-out payments were still captured, so the retry job refunded them automatically: no revenue lost, but **€791** in refund fees.\n\nI'd cap automatic refunds at one per order and add the fee cost to the `INC-4471` postmortem.",
      },
    ],
  },
];

const DEFAULT_TOOLS: RelayToolHealth[] = [
  { name: "warehouse", status: "ready" },
  { name: "incident-log", status: "ready" },
  { name: "deploys", status: "ready" },
];

const DEFAULT_MODELS: RelayModel[] = [
  { id: "vesper-2", description: "Balanced for analysis", contextWindow: 200_000 },
  { id: "vesper-2-mini", description: "Fast lookups, lower cost", contextWindow: 128_000 },
  { id: "vesper-2-long", description: "Long investigations", contextWindow: 1_000_000 },
];

const DEFAULT_ATTACHMENTS: RelayAttachment[] = [
  { id: "att-timeline", name: "INC-4471-timeline.md", size: 6_412 },
  { id: "att-fees", name: "refund-fees-2026.csv", size: 18_240 },
];

const DEFAULT_SUGGESTIONS: RelaySuggestion[] = [
  { text: "Why did EU refunds spike on Saturday afternoon?", tool: "warehouse.query" },
  { text: "Which deploys touched checkout this week?", tool: "deploys.list" },
  { text: "Summarize open SEV-2 incidents and their owners", tool: "incidents.search" },
  { text: "Compare 3-D Secure pass rates by issuer, last 7 days", tool: "warehouse.query" },
];

/** The demo conversation, exported for stories and tests. */
export const RELAY_DEMO_TURNS = DEFAULT_TURNS;

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";
const EASE = "cubic-bezier(0.2, 0.8, 0.2, 1)";

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--iu-accent)";
/** Registration marks around the prompt grid of a new thread. */
const TICKS = [
  "-top-1.5 -left-1.5 border-t border-l",
  "-top-1.5 -right-1.5 border-t border-r",
  "-bottom-1.5 -left-1.5 border-b border-l",
  "-right-1.5 -bottom-1.5 border-r border-b",
];
const MICRO = "font-mono text-[11px] tracking-[0.08em] uppercase";
const TURN_GRID = "grid grid-cols-1 gap-y-2.5 @2xl:grid-cols-[88px_minmax(0,1fr)] @2xl:gap-x-6";
const GHOST =
  "inline-flex h-8 items-center gap-1.5 rounded-[min(var(--iu-radius),6px)] px-2 text-[13px] text-(--iu-muted) transition-colors duration-150 motion-reduce:transition-none pointer-coarse:h-10 pointer-fine:hover:bg-(--iu-foreground)/6 pointer-fine:hover:text-(--iu-foreground)";

function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}
const getReducedMotion = () => window.matchMedia(REDUCED_QUERY).matches;
const getReducedMotionOnServer = () => false;

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia(REDUCED_QUERY).matches;
}

function groupDigits(value: number) {
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function formatNumber(value: number, decimals = 0) {
  const [whole = "0", fraction] = value.toFixed(decimals).split(".");
  return fraction ? `${groupDigits(Number(whole))}.${fraction}` : groupDigits(Number(whole));
}

function formatMs(ms: number) {
  return `${groupDigits(Math.round(ms))} ms`;
}

function formatSeconds(ms: number) {
  return `${(ms / 1000).toFixed(1)} s`;
}

function formatCompact(value: number) {
  if (value >= 1_000_000) return `${Number((value / 1_000_000).toFixed(1))}M`;
  if (value >= 1000) return `${Number((value / 1000).toFixed(value >= 100_000 ? 0 : 1))}k`;
  return String(value);
}

function formatBytes(bytes: number) {
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

/* Streaming text is revealed one token (a word and its trailing space) at a time. */

type Token = { text: string; kind: "plain" | "strong" | "code"; para: number };
type TextRun = { kind: Token["kind"]; text: string };

function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  text.split(/\n{2,}/).forEach((paragraph, para) => {
    for (const segment of paragraph.split(/(\*\*[^*]+\*\*|`[^`]+`)/)) {
      if (!segment) continue;
      if (segment.length > 4 && segment.startsWith("**") && segment.endsWith("**")) {
        for (const word of segment.slice(2, -2).match(/\s*\S+\s*/g) ?? [])
          tokens.push({ text: word, kind: "strong", para });
      } else if (segment.length > 2 && segment.startsWith("`") && segment.endsWith("`")) {
        tokens.push({ text: segment.slice(1, -1), kind: "code", para });
      } else {
        for (const word of segment.match(/\s*\S+\s*|\s+/g) ?? []) tokens.push({ text: word, kind: "plain", para });
      }
    }
  });
  return tokens;
}

function paragraphsOf(tokens: Token[], count: number): TextRun[][] {
  const paragraphs: TextRun[][] = [];
  for (const token of tokens.slice(0, count)) {
    const runs = (paragraphs[token.para] ??= []);
    const last = runs[runs.length - 1];
    if (last && last.kind === token.kind && token.kind !== "code") last.text += token.text;
    else runs.push({ kind: token.kind, text: token.text });
  }
  return paragraphs.filter(Boolean);
}

/* A run plays the last agent turn part by part: text paced by tokens, tool calls by their duration. */

type RunPhase = "idle" | "streaming" | "stopped";

type RunState = {
  turnId: string | null;
  parts: RelayPart[];
  durations: number[];
  phase: RunPhase;
  part: number;
  clock: number;
  /** Failed calls succeed on replay (the user retried them). */
  healed: boolean;
  completed: boolean;
  /** Calls that resolved during this run; their rows animate in once. */
  fresh: string[];
  epoch: number;
};

type RunOptions = {
  streaming: boolean;
  healed: boolean;
  part: number;
  progress: number;
  epoch: number;
  msPerToken: number;
  instant?: boolean;
  fresh?: string[];
};

function partDuration(part: RelayPart, healed: boolean, msPerToken: number) {
  if (part.type === "text") return tokenize(part.text).length * msPerToken;
  if (part.status === "error" && !healed) return part.error?.afterMs ?? part.durationMs;
  return part.durationMs;
}

function createRun(turn: RelayAgentTurn | undefined, options: RunOptions): RunState {
  const parts = turn?.parts ?? [];
  const base = {
    turnId: turn?.id ?? null,
    parts,
    durations: parts.map((part) => partDuration(part, options.healed, options.msPerToken)),
    healed: options.healed,
    fresh: options.fresh ?? [],
    epoch: options.epoch,
    clock: 0,
  };
  if (!turn || !options.streaming) return { ...base, phase: "idle", part: parts.length, completed: false };
  if (options.instant) return { ...base, phase: "idle", part: parts.length, completed: true };
  const part = Math.min(Math.max(0, options.part), Math.max(0, parts.length - 1));
  const progress = Math.min(Math.max(options.progress, 0), 0.999);
  return { ...base, phase: "streaming", part, clock: (base.durations[part] ?? 0) * progress, completed: false };
}

function advanceRun(run: RunState, dt: number): RunState {
  if (run.phase !== "streaming") return run;
  let part = run.part;
  let clock = run.clock + dt;
  let fresh = run.fresh;
  while (part < run.parts.length) {
    const current = run.parts[part];
    const duration = run.durations[part] ?? 0;
    if (!current || clock < duration) break;
    if (current.type === "tool") {
      fresh = [...fresh, current.id];
      // A failed call ends the run here until it is retried.
      if (current.status === "error" && !run.healed) {
        return { ...run, phase: "idle", part: run.parts.length, clock: 0, fresh };
      }
    }
    clock -= duration;
    part += 1;
  }
  if (part >= run.parts.length) return { ...run, phase: "idle", part, clock: 0, fresh, completed: true };
  return { ...run, part, clock, fresh };
}

type ToolState = "running" | "done" | "error" | "cancelled";

type TextView = {
  kind: "text";
  index: number;
  tokens: Token[];
  count: number;
  caret: boolean;
  /** Text that leads into a tool call: set quieter than the answer. */
  narration: boolean;
};
type ToolView = {
  kind: "tool";
  index: number;
  call: RelayToolCall;
  state: ToolState;
  elapsed: number;
  /** When the call started, measured from the start of the run. */
  offset: number;
  fresh: boolean;
};
type PartView = TextView | ToolView;

function viewParts(turn: RelayAgentTurn, run: RunState, simulate: boolean, msPerToken: number): PartView[] {
  const active = run.turnId === turn.id;
  const playing = active && simulate && run.phase !== "idle";
  const views: PartView[] = [];
  let offset = 0;
  for (let index = 0; index < turn.parts.length; index += 1) {
    const part = turn.parts[index];
    if (!part || (playing && index > run.part)) break;
    const partial = playing && index === run.part;
    if (part.type === "text") {
      const tokens = tokenize(part.text);
      const count = partial ? Math.min(tokens.length, Math.floor(run.clock / msPerToken)) : tokens.length;
      const narration = turn.parts.slice(index + 1).some((next) => next.type === "tool");
      views.push({ kind: "text", index, tokens, count, caret: partial && run.phase === "streaming", narration });
      offset += count * msPerToken;
      continue;
    }
    if (partial) {
      const state = run.phase === "streaming" ? "running" : "cancelled";
      views.push({ kind: "tool", index, call: part, state, elapsed: run.clock, offset, fresh: false });
      continue;
    }
    const failed = part.status === "error" && !(active && run.healed);
    const state: ToolState = failed ? "error" : part.status === "running" ? "running" : "done";
    const elapsed = failed ? (part.error?.afterMs ?? part.durationMs) : part.durationMs;
    const fresh = active && run.fresh.includes(part.id);
    views.push({ kind: "tool", index, call: part, state, elapsed, offset, fresh });
    offset += elapsed;
    if (failed && simulate) break;
  }
  const last = views[views.length - 1];
  if (active && !simulate && run.phase === "streaming" && last?.kind === "text") last.caret = true;
  return views;
}

function viewsElapsed(views: PartView[], msPerToken: number) {
  return views.reduce((sum, view) => sum + (view.kind === "text" ? view.count * msPerToken : view.elapsed), 0);
}

function viewsToText(views: PartView[]) {
  return views
    .filter((view): view is TextView => view.kind === "text")
    .map((view) =>
      paragraphsOf(view.tokens, view.count)
        .map((runs) =>
          runs
            .map((run) => run.text)
            .join("")
            .trim(),
        )
        .join("\n\n"),
    )
    .filter(Boolean)
    .join("\n\n");
}

function lastAgentTurn(turns: RelayTurn[]) {
  for (let index = turns.length - 1; index >= 0; index -= 1) {
    const turn = turns[index];
    if (turn?.role === "agent") return turn;
  }
  return undefined;
}

function highlight(source: string, kind: RelayToolCall["kind"]): ReactNode[] {
  const pattern =
    kind === "sql"
      ? /('(?:[^'\\]|\\.)*')|\b(select|from|where|and|or|group by|order by|limit|as|desc|asc|join|on|having)\b/gi
      : /("(?:[^"\\]|\\.)*")(\s*:)?/g;
  const nodes: ReactNode[] = [];
  let last = 0;
  for (const match of source.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > last) nodes.push(<Fragment key={`p${index}`}>{source.slice(last, index)}</Fragment>);
    const isKey = kind === "api" && Boolean(match[2]);
    nodes.push(
      isKey ? (
        <Fragment key={`m${index}`}>{match[0]}</Fragment>
      ) : (
        <span key={`m${index}`} className="text-(--iu-foreground)">
          {match[0]}
        </span>
      ),
    );
    last = index + match[0].length;
  }
  if (last < source.length) nodes.push(<Fragment key="tail">{source.slice(last)}</Fragment>);
  return nodes;
}

async function writeClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Sandboxed frames can block the async clipboard; a selected textarea still copies on a user gesture.
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.top = "-1000px";
    document.body.appendChild(area);
    area.select();
    let copied = false;
    try {
      copied = document.execCommand("copy");
    } catch {
      copied = false;
    }
    area.remove();
    return copied;
  }
}

function RelayMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" width="16" height="16" fill="none" className="shrink-0">
      <rect x="1.75" y="1.75" width="5.5" height="5.5" rx="1.25" stroke="currentColor" strokeWidth="1.5" />
      <rect x="8.75" y="8.75" width="5.5" height="5.5" rx="1.25" className="fill-(--iu-accent)" />
      <path d="M7.25 4.5h2.5a1.5 1.5 0 0 1 1.5 1.5v2.75" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function Caret() {
  return (
    <span
      aria-hidden="true"
      className="ml-0.5 inline-block h-[1.15em] w-[0.5em] translate-y-[0.2em] bg-(--iu-accent)"
    />
  );
}

function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded-[min(var(--iu-radius),4px)] border border-(--rc-line) bg-(--rc-raised) px-1 font-mono text-[11px] text-(--iu-muted)">
      {children}
    </kbd>
  );
}

function TurnLabel({ id, name, time, boxed = false }: { id: string; name: string; time: string; boxed?: boolean }) {
  return (
    <header
      className={cx(
        MICRO,
        "flex items-baseline gap-2 @2xl:flex-col @2xl:gap-1",
        boxed ? "@2xl:pt-[17px]" : "@2xl:pt-[5px]",
      )}
    >
      <span id={id} className="text-(--iu-foreground)">
        {name}
      </span>
      <time className="text-(--iu-muted) tabular-nums">{time}</time>
    </header>
  );
}

function FileGlyph({ name }: { name: string }) {
  const Icon = /\.(csv|tsv|xlsx?)$/i.test(name) ? FileSpreadsheet : FileText;
  return <Icon aria-hidden="true" size={14} strokeWidth={1.5} className="shrink-0 text-(--iu-muted)" />;
}

function Prose({
  tokens,
  count,
  caret,
  narration,
}: {
  tokens: Token[];
  count: number;
  caret: boolean;
  narration: boolean;
}) {
  const paragraphs = paragraphsOf(tokens, count);
  return (
    <div
      className={cx(
        "space-y-3 text-[15px] leading-[1.65] text-pretty",
        narration ? "text-(--iu-muted)" : "text-(--iu-foreground)",
      )}
    >
      {paragraphs.map((runs, index) => (
        <p key={index}>
          {runs.map((run, position) =>
            run.kind === "strong" ? (
              <strong key={position} className="font-semibold">
                {run.text}
              </strong>
            ) : run.kind === "code" ? (
              <code
                key={position}
                className="rounded-[min(var(--iu-radius),4px)] border border-(--rc-line) bg-(--rc-raised) px-1 py-px font-mono text-[13px] whitespace-nowrap"
              >
                {run.text}
              </code>
            ) : (
              <Fragment key={position}>{run.text}</Fragment>
            ),
          )}
          {caret && index === paragraphs.length - 1 ? <Caret /> : null}
        </p>
      ))}
      {caret && paragraphs.length === 0 ? (
        <p>
          <Caret />
        </p>
      ) : null}
    </div>
  );
}

function ToolStatus({ state, animate }: { state: ToolState; animate: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const node = ref.current;
    if (!animate || !node || typeof node.animate !== "function" || prefersReducedMotion()) return;
    const animation = node.animate(
      [
        { opacity: 0, transform: "translateY(2px)" },
        { opacity: 1, transform: "none" },
      ],
      {
        duration: 160,
        easing: EASE,
      },
    );
    return () => animation.cancel();
  }, [animate]);
  const label = { running: "Running", done: "Done", error: "Failed", cancelled: "Cancelled" }[state];
  return (
    <span
      ref={ref}
      className={cx(
        "inline-flex shrink-0 items-center gap-1.5 text-[12px]",
        state === "error"
          ? "text-red-700 dark:text-red-400"
          : state === "running"
            ? "text-(--iu-foreground)"
            : "text-(--iu-muted)",
      )}
    >
      {state === "running" ? <span aria-hidden="true" className="size-1.5 rounded-full bg-(--iu-accent)" /> : null}
      {state === "done" ? (
        <CircleCheck
          aria-hidden="true"
          size={14}
          strokeWidth={1.5}
          className="text-emerald-600 dark:text-emerald-400"
        />
      ) : null}
      {state === "error" ? (
        <CircleX aria-hidden="true" size={14} strokeWidth={1.5} className="text-red-600 dark:text-red-400" />
      ) : null}
      {state === "cancelled" ? <Ban aria-hidden="true" size={14} strokeWidth={1.5} /> : null}
      <span className="sr-only @md:not-sr-only">{label}</span>
    </span>
  );
}

function ResultTable({ name, result, animate }: { name: string; result: RelayResult; animate: boolean }) {
  const ref = useRef<HTMLTableElement>(null);
  useLayoutEffect(() => {
    const table = ref.current;
    if (!animate || !table || typeof table.animate !== "function" || prefersReducedMotion()) return;
    const animations: Animation[] = [];
    table.querySelectorAll<HTMLElement>("tbody tr").forEach((row, index) => {
      animations.push(
        row.animate(
          [
            { opacity: 0, transform: "translateY(4px)" },
            { opacity: 1, transform: "none" },
          ],
          {
            duration: 180,
            delay: 40 + index * 60,
            easing: EASE,
            fill: "backwards",
          },
        ),
      );
    });
    table.querySelectorAll<HTMLElement>("[data-bar]").forEach((bar, index) => {
      animations.push(
        bar.animate([{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], {
          duration: 240,
          delay: 100 + index * 60,
          easing: EASE,
          fill: "backwards",
        }),
      );
    });
    return () => animations.forEach((animation) => animation.cancel());
  }, [animate]);

  const peaks = Object.fromEntries(
    result.columns
      .filter((column) => column.bar)
      .map((column) => [column.key, Math.max(1, ...result.rows.map((row) => Number(row[column.key]) || 0))]),
  );

  return (
    <table ref={ref} className="mt-2 w-full border-collapse font-mono text-[12px] tabular-nums">
      <caption className="sr-only">Result of {name}</caption>
      <thead>
        <tr>
          {result.columns.map((column) => (
            <th
              key={column.key}
              scope="col"
              className={cx(
                "pr-6 pb-1.5 text-[11px] font-normal text-(--iu-muted) last:pr-0",
                column.align === "right" ? "text-right" : "text-left",
                column.bar || column.grow ? "w-full" : "whitespace-nowrap",
                column.optional && "hidden @md:table-cell",
              )}
            >
              {column.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {result.rows.map((row, rowIndex) => (
          <tr key={rowIndex} className="border-t border-dashed border-(--rc-line)">
            {result.columns.map((column) => {
              const value = row[column.key] ?? "";
              const text = typeof value === "number" ? formatNumber(value, column.decimals) : value;
              const peak = peaks[column.key] ?? 1;
              const share = typeof value === "number" ? value / peak : 0;
              return (
                <td
                  key={column.key}
                  className={cx(
                    "py-[calc(6px*var(--iu-density))] pr-6 align-top text-(--iu-foreground) last:pr-0",
                    column.align === "right" ? "text-right" : "text-left",
                    !column.bar && !column.grow && "whitespace-nowrap",
                    column.optional && "hidden @md:table-cell",
                  )}
                >
                  {column.bar ? (
                    <span className="flex items-center justify-between gap-3">
                      <span aria-hidden="true" className="relative h-1.5 max-w-[280px] min-w-10 flex-1">
                        <span
                          data-bar
                          className={cx(
                            "absolute inset-y-0 left-0 origin-left rounded-[1px]",
                            share >= 1 ? "bg-(--iu-accent)" : "bg-(--iu-foreground)/25",
                          )}
                          style={{ width: `${Math.max(3, Math.round(share * 100))}%` }}
                        />
                      </span>
                      <span className="min-w-[5ch] text-right">{text}</span>
                    </span>
                  ) : (
                    text
                  )}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ToolSection({
  label,
  meta,
  divided = false,
  tone = "neutral",
  children,
}: {
  label: string;
  meta?: string;
  divided?: boolean;
  tone?: "neutral" | "error";
  children: ReactNode;
}) {
  return (
    <div
      className={cx(
        "px-3 pt-2.5 pb-3",
        divided && "border-t border-dashed",
        divided && (tone === "error" ? "border-red-600/25 dark:border-red-400/25" : "border-(--rc-line)"),
      )}
    >
      <div
        className={cx(
          MICRO,
          "flex items-center justify-between gap-3",
          tone === "error" ? "text-red-700 dark:text-red-400" : "text-(--iu-muted)",
        )}
      >
        <span>{label}</span>
        {meta ? <span className="truncate tracking-normal normal-case">{meta}</span> : null}
      </div>
      {children}
    </div>
  );
}

function ToolCall({
  view,
  open,
  toggleId,
  onToggle,
  onRetry,
}: {
  view: ToolView;
  open: boolean;
  toggleId: string;
  onToggle: () => void;
  onRetry: () => void;
}) {
  const { call, state } = view;
  const Icon = call.kind === "sql" ? Database : Webhook;
  const bodyId = `${toggleId}-body`;
  return (
    <div className="relative">
      <span
        aria-hidden="true"
        className="absolute top-[14px] left-[-112px] hidden font-mono text-[11px] text-(--iu-muted) tabular-nums @2xl/console:block"
      >
        +{(view.offset / 1000).toFixed(1)} s
      </span>
      <div
        data-state={state}
        className="@container rounded-[min(var(--iu-radius),6px)] border border-(--rc-line) bg-(--rc-raised) data-[state=error]:border-red-600/35 dark:data-[state=error]:border-red-400/30"
      >
        <button
          id={toggleId}
          type="button"
          aria-expanded={open}
          aria-controls={bodyId}
          onClick={onToggle}
          className="group flex w-full items-center gap-2.5 rounded-[min(var(--iu-radius),6px)] px-3 py-[calc(10px*var(--iu-density))] text-left transition-colors duration-150 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-(--iu-accent) motion-reduce:transition-none pointer-fine:hover:bg-(--iu-foreground)/3"
        >
          <ChevronRight
            aria-hidden="true"
            size={14}
            strokeWidth={1.5}
            className="shrink-0 text-(--iu-muted) transition-transform duration-150 group-aria-expanded:rotate-90 motion-reduce:transition-none"
          />
          <span
            aria-hidden="true"
            className="hidden size-6 shrink-0 items-center justify-center rounded-[min(var(--iu-radius),4px)] border border-(--rc-line) bg-(--rc-panel) text-(--iu-muted) @md:flex"
          >
            <Icon size={13} strokeWidth={1.5} />
          </span>
          <span className="min-w-0 flex-1 truncate">
            <span className="font-mono text-[13px] text-(--iu-foreground)">{call.name}</span>
            <span className="ml-2.5 hidden text-[13px] text-(--iu-muted) @md:inline">{call.summary}</span>
          </span>
          <span
            className={cx(
              "shrink-0 font-mono text-[12px] tabular-nums",
              state === "running" ? "text-(--iu-foreground)" : "text-(--iu-muted)",
            )}
          >
            {formatMs(view.elapsed)}
          </span>
          <ToolStatus key={state} state={state} animate={view.fresh} />
        </button>
        <div
          id={bodyId}
          data-open={open}
          inert={!open}
          className="grid grid-rows-[0fr] transition-[grid-template-rows,visibility] duration-150 ease-out data-[open=false]:invisible data-[open=true]:grid-rows-[1fr] motion-reduce:transition-none"
        >
          <div className="relative min-h-0 overflow-hidden">
            <div className="border-t border-dashed border-(--rc-line)">
              <ToolSection label="Arguments" meta={call.kind === "sql" ? "SQL" : "JSON"}>
                <pre className="mt-2 rounded-[min(var(--iu-radius),4px)] bg-(--rc-sunken) px-3 py-2.5 font-mono text-[12px] leading-[1.65] break-words whitespace-pre-wrap text-(--iu-muted)">
                  <code>{highlight(call.args, call.kind)}</code>
                </pre>
              </ToolSection>
              {state === "done" && call.result ? (
                <ToolSection label="Result" meta={call.result.footnote} divided>
                  <ResultTable name={call.name} result={call.result} animate={view.fresh} />
                </ToolSection>
              ) : null}
              {state === "running" ? (
                <ToolSection label="Result" meta="Waiting for rows" divided>
                  <div aria-hidden="true" className="mt-2.5 space-y-3">
                    {[0.72, 0.56, 0.64].map((width, index) => (
                      <div key={index} className="flex items-center gap-4">
                        <span className="h-2 w-10 rounded-[2px] bg-(--iu-foreground)/8" />
                        <span
                          className="h-2 rounded-[2px] bg-(--iu-foreground)/8"
                          style={{ width: `${width * 50}%` }}
                        />
                        <span className="ml-auto h-2 w-14 rounded-[2px] bg-(--iu-foreground)/8" />
                      </div>
                    ))}
                  </div>
                </ToolSection>
              ) : null}
              {state === "error" && call.error ? (
                <ToolSection label="Error" meta={call.error.code} divided tone="error">
                  <p className="mt-2 text-[13px] leading-relaxed text-pretty text-(--iu-foreground)">
                    {call.error.message}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
                    <button
                      type="button"
                      onClick={onRetry}
                      className={cx(
                        "inline-flex h-8 items-center gap-1.5 rounded-[min(var(--iu-radius),6px)] border border-(--iu-foreground)/50 bg-(--rc-panel) px-3 text-[13px] font-medium text-(--iu-foreground) transition-colors duration-150 motion-reduce:transition-none dark:border-(--iu-foreground)/35 pointer-coarse:h-10 pointer-fine:hover:bg-(--iu-foreground)/6",
                        FOCUS,
                      )}
                    >
                      <RotateCcw aria-hidden="true" size={14} strokeWidth={1.5} />
                      Retry call
                    </button>
                    <span className="text-[12px] text-(--iu-muted)">
                      The answer continues once the lookup succeeds.
                    </span>
                  </div>
                </ToolSection>
              ) : null}
              {state === "cancelled" ? (
                <p className="border-t border-dashed border-(--rc-line) px-3 py-3 text-[13px] text-(--iu-muted)">
                  Stopped before {call.name} returned. Nothing was read.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ModelPicker({
  models,
  value,
  onChange,
}: {
  models: RelayModel[];
  value: string;
  onChange: (modelId: string) => void;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const selectedIndex = Math.max(
    0,
    models.findIndex((model) => model.id === value),
  );
  const selected = models[selectedIndex];

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const show = (index: number) => {
    setActive(index);
    setOpen(true);
  };
  const choose = (index: number) => {
    const model = models[index];
    if (model) onChange(model.id);
    setOpen(false);
  };

  const onKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    const last = models.length - 1;
    if (!open) {
      if (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        show(selectedIndex);
      } else if (event.key === "Home" || event.key === "End") {
        event.preventDefault();
        show(event.key === "Home" ? 0 : last);
      }
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive(Math.min(last, active + 1));
    } else if (event.key === "ArrowUp" && event.altKey) {
      event.preventDefault();
      choose(active);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive(Math.max(0, active - 1));
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      setActive(event.key === "Home" ? 0 : last);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      choose(active);
    } else if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
    } else if (event.key === "Tab") {
      choose(active);
    }
  };

  return (
    <div ref={wrapRef} className="relative">
      <span id={`${id}-label`} className="sr-only">
        Model
      </span>
      <button
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-labelledby={`${id}-label ${id}-value`}
        aria-activedescendant={open ? `${id}-option-${active}` : undefined}
        onClick={() => (open ? setOpen(false) : show(selectedIndex))}
        onKeyDown={onKeyDown}
        onKeyUp={(event) => {
          if (event.key === " ") event.preventDefault();
        }}
        className={cx(
          "inline-flex h-8 items-center gap-1.5 rounded-[min(var(--iu-radius),6px)] pr-1.5 pl-2 font-mono text-[12px] text-(--iu-foreground) transition-colors duration-150 motion-reduce:transition-none pointer-coarse:h-10 pointer-fine:hover:bg-(--iu-foreground)/6",
          FOCUS,
        )}
      >
        <span id={`${id}-value`}>{selected?.id}</span>
        <ChevronsUpDown aria-hidden="true" size={14} strokeWidth={1.5} className="text-(--iu-muted)" />
      </button>
      <ul
        id={`${id}-list`}
        role="listbox"
        aria-labelledby={`${id}-label`}
        data-open={open}
        className="absolute bottom-full left-0 z-20 mb-2 w-[min(18rem,calc(100vw-4rem))] origin-bottom-left rounded-[min(var(--iu-radius),8px)] border border-(--rc-line) bg-(--iu-surface) p-1 transition-[opacity,transform,visibility] duration-150 ease-out data-[open=false]:invisible data-[open=false]:translate-y-1 data-[open=false]:scale-[0.98] data-[open=false]:opacity-0 motion-reduce:transition-none dark:border-(--iu-foreground)/15"
      >
        {models.map((model, index) => (
          <li
            key={model.id}
            id={`${id}-option-${index}`}
            role="option"
            aria-selected={model.id === value}
            data-active={open && index === active}
            onPointerDown={(event) => event.preventDefault()}
            onPointerEnter={() => setActive(index)}
            onClick={() => choose(index)}
            className="flex cursor-default items-center gap-2.5 rounded-[min(var(--iu-radius),6px)] px-2.5 py-2 data-[active=true]:bg-(--iu-foreground)/6"
          >
            <Check
              aria-hidden="true"
              size={14}
              strokeWidth={1.75}
              className={cx("shrink-0 text-(--iu-accent)", model.id !== value && "invisible")}
            />
            <span className="min-w-0 flex-1">
              <span className="block font-mono text-[13px] text-(--iu-foreground)">{model.id}</span>
              <span className="block text-[12px] text-(--iu-muted)">{model.description}</span>
            </span>
            <span className="shrink-0 font-mono text-[11px] text-(--iu-muted) tabular-nums">
              {formatCompact(model.contextWindow)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ContextMeter({ used, limit }: { used: number; limit: number }) {
  const id = useId();
  const ratio = limit > 0 ? Math.min(1, used / limit) : 0;
  const near = ratio >= 0.8;
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <span id={id} className={cx(MICRO, "text-(--iu-muted)")}>
        Context
      </span>
      <div
        role="meter"
        aria-labelledby={id}
        aria-valuemin={0}
        aria-valuemax={limit}
        aria-valuenow={used}
        aria-valuetext={`${formatNumber(used)} of ${formatNumber(limit)} tokens, ${Math.round(ratio * 100)}%`}
        className="relative h-1 w-14 shrink-0 overflow-hidden rounded-full bg-(--iu-foreground)/10 @md:w-28"
      >
        <span
          className={cx(
            "absolute inset-0 origin-left transition-transform duration-150 ease-out motion-reduce:transition-none",
            near ? "bg-amber-500" : "bg-(--iu-foreground)/70",
          )}
          style={{ transform: `scaleX(${ratio})` }}
        />
      </div>
      <span aria-hidden="true" className="font-mono text-[11px] whitespace-nowrap text-(--iu-muted) tabular-nums">
        <span className="@lg:hidden">
          {formatCompact(used)} / {formatCompact(limit)}
        </span>
        <span className="hidden @lg:inline">
          {formatNumber(used)} / {formatNumber(limit)}
        </span>
      </span>
      {near ? <span className="font-mono text-[11px] text-amber-700 dark:text-amber-400">Near limit</span> : null}
    </div>
  );
}

function EmptyState({
  suggestions,
  model,
  contextUsed,
  onPick,
}: {
  suggestions: RelaySuggestion[];
  model: string;
  contextUsed: number;
  onPick: (text: string) => void;
}) {
  return (
    <div className="flex-1 px-4 py-10 @2xl:px-6 @2xl:py-14">
      <div className={cx(TURN_GRID, "mx-auto w-full max-w-[832px]")}>
        <header className={cx(MICRO, "flex items-baseline gap-2 @2xl:flex-col @2xl:gap-1 @2xl:pt-[13px]")}>
          <span className="text-(--iu-foreground)">New thread</span>
          <span className="text-(--iu-muted)">{model}</span>
        </header>
        <div className="min-w-0">
          <h3 className="text-[28px] leading-[1.1] font-semibold tracking-[-0.03em] text-balance @2xl:text-[34px]">
            What should we look into?
          </h3>
          <p className="mt-3 max-w-[60ch] text-[15px] leading-[1.6] text-pretty text-(--iu-muted)">
            The agent reads the payments warehouse, the incident log and deploy history, and changes none of them. Their
            schemas are preloaded, so this thread starts at {formatNumber(contextUsed)} tokens.
          </p>
          <div className="relative mt-8">
            {TICKS.map((corner) => (
              <span
                key={corner}
                aria-hidden="true"
                className={cx("pointer-events-none absolute size-2 border-(--iu-foreground)/35", corner)}
              />
            ))}
            <ul
              aria-label="Suggested prompts"
              className="grid gap-px overflow-hidden rounded-[min(var(--iu-radius),6px)] border border-(--rc-line) bg-(--rc-line) @xl:grid-cols-2"
            >
              {suggestions.map((suggestion, index) => (
                <li key={suggestion.text} className="flex bg-(--rc-panel)">
                  <button
                    type="button"
                    onClick={() => onPick(suggestion.text)}
                    className="group flex w-full flex-col items-start gap-3 p-4 text-left transition-colors duration-150 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-(--iu-accent) motion-reduce:transition-none pointer-fine:hover:bg-(--iu-foreground)/3"
                  >
                    <span className="flex w-full items-center justify-between font-mono text-[11px] text-(--iu-muted) tabular-nums">
                      {String(index + 1).padStart(2, "0")}
                      <ArrowUpRight
                        aria-hidden="true"
                        size={14}
                        strokeWidth={1.5}
                        className="transition-transform duration-150 motion-reduce:transition-none pointer-fine:group-hover:translate-x-0.5 pointer-fine:group-hover:-translate-y-0.5"
                      />
                    </span>
                    <span className="text-[15px] leading-snug text-pretty text-(--iu-foreground)">
                      {suggestion.text}
                    </span>
                    <span className="mt-auto inline-flex items-center gap-1.5 font-mono text-[11px] text-(--iu-muted)">
                      {suggestion.tool.startsWith("warehouse") ? (
                        <Database aria-hidden="true" size={12} strokeWidth={1.5} />
                      ) : (
                        <Webhook aria-hidden="true" size={12} strokeWidth={1.5} />
                      )}
                      {suggestion.tool}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function UserTurn({ turn, labelId }: { turn: RelayUserTurn; labelId: string }) {
  return (
    <article aria-labelledby={labelId} className={TURN_GRID}>
      <TurnLabel id={labelId} name="You" time={turn.time} boxed />
      <div className="min-w-0">
        <div className="rounded-[min(var(--iu-radius),8px)] border border-transparent bg-(--rc-sunken) px-4 py-3 text-[15px] leading-[1.6] text-pretty dark:border-(--rc-line) dark:bg-(--rc-raised)">
          {turn.text}
          {turn.attachments?.length ? (
            <ul aria-label="Attached files" className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1">
              {turn.attachments.map((file) => (
                <li key={file.id} className="inline-flex items-center gap-1.5 font-mono text-[11px] text-(--iu-muted)">
                  <FileGlyph name={file.name} />
                  {file.name}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function RelayAgentConsole({
  agentName = "Ops agent",
  title = "EU refund spike, Sat 24 Oct",
  turns = DEFAULT_TURNS,
  status = "idle",
  streamFrom,
  simulate = true,
  tokensPerSecond = 28,
  tools = DEFAULT_TOOLS,
  models = DEFAULT_MODELS,
  defaultModelId,
  attachments = DEFAULT_ATTACHMENTS,
  defaultDraft = "Draft the INC-4471 postmortem note with the fee impact.",
  contextUsed = 30_818,
  suggestions = DEFAULT_SUGGESTIONS,
  onSend,
  onStop,
  onRetry,
  onRetryTool,
  onCopy,
  onModelChange,
  onAttach,
  onRemoveAttachment,
  onStreamEnd,
  className = "",
}: RelayAgentConsoleProps) {
  const baseId = useId();
  const reduced = useSyncExternalStore(subscribeReducedMotion, getReducedMotion, getReducedMotionOnServer);
  const msPerToken = 1000 / Math.max(1, tokensPerSecond);

  const rootRef = useRef<HTMLElement>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const chipsRef = useRef<HTMLUListElement>(null);
  const sendRef = useRef<HTMLButtonElement>(null);
  const pinnedRef = useRef(true);
  const notifiedRef = useRef(-1);

  // The thread follows `turns`; a message sent without a parent update is appended locally.
  const [thread, setThread] = useState(turns);
  const [seenTurns, setSeenTurns] = useState(turns);
  if (turns !== seenTurns) {
    setSeenTurns(turns);
    setThread(turns);
  }

  const activeTurn = lastAgentTurn(thread);
  const runKey = `${activeTurn?.id ?? "none"}:${status}`;
  const [run, setRun] = useState<RunState>(() =>
    createRun(activeTurn, {
      streaming: status === "streaming",
      healed: false,
      part: streamFrom?.part ?? 0,
      progress: streamFrom?.progress ?? 0,
      epoch: 0,
      msPerToken,
    }),
  );
  const [seenRunKey, setSeenRunKey] = useState(runKey);
  if (runKey !== seenRunKey) {
    // A new turn or status starts over; the same turn keeps the calls it already opened.
    const sameTurn = activeTurn !== undefined && activeTurn.id === run.turnId;
    setSeenRunKey(runKey);
    setRun(
      createRun(activeTurn, {
        streaming: status === "streaming",
        healed: sameTurn && run.healed,
        part: 0,
        progress: 0,
        epoch: run.epoch + 1,
        msPerToken,
        instant: reduced && simulate,
        fresh: sameTurn ? run.fresh : [],
      }),
    );
  }

  const [openCalls, setOpenCalls] = useState<Record<string, boolean>>({});
  const [copiedTurn, setCopiedTurn] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [modelId, setModelId] = useState(defaultModelId ?? models[0]?.id ?? "");
  const [files, setFiles] = useState(attachments);
  const [draft, setDraft] = useState(defaultDraft);

  const streaming = run.phase === "streaming";
  const ticking = streaming && simulate && !reduced;

  // One frame loop drives the run while it is on screen; it stops offscreen and under reduced motion.
  useEffect(() => {
    if (!ticking) return;
    const node = rootRef.current;
    if (!node) return;
    let frame = 0;
    let last = 0;
    let pending = 0;
    const loop = (now: number) => {
      if (last !== 0) pending += Math.min(now - last, 64);
      last = now;
      if (pending >= 32) {
        const dt = pending;
        pending = 0;
        setRun((previous) => advanceRun(previous, dt));
      }
      frame = requestAnimationFrame(loop);
    };
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.some((entry) => entry.isIntersecting);
      if (visible && frame === 0) {
        last = 0;
        frame = requestAnimationFrame(loop);
      } else if (!visible && frame !== 0) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    });
    observer.observe(node);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [ticking]);

  const finishedEpoch = run.completed ? run.epoch : -1;
  useEffect(() => {
    if (finishedEpoch < 0 || notifiedRef.current === finishedEpoch || !run.turnId) return;
    notifiedRef.current = finishedEpoch;
    onStreamEnd?.(run.turnId);
  }, [finishedEpoch, onStreamEnd, run.turnId]);

  useEffect(() => {
    if (!copiedTurn) return;
    const timer = window.setTimeout(() => setCopiedTurn(null), 1600);
    return () => window.clearTimeout(timer);
  }, [copiedTurn]);

  useLayoutEffect(() => {
    const area = textareaRef.current;
    if (!area) return;
    area.style.height = "auto";
    area.style.height = `${Math.min(area.scrollHeight, 200)}px`;
  }, [draft]);

  // Keep the newest output in view while streaming, unless the reader scrolled up.
  useLayoutEffect(() => {
    const scroller = threadRef.current;
    if (scroller && pinnedRef.current && scroller.scrollHeight > scroller.clientHeight) {
      scroller.scrollTop = scroller.scrollHeight;
    }
  }, [run, thread.length]);

  const model = models.find((candidate) => candidate.id === modelId) ?? models[0];
  const limit = model?.contextWindow ?? 200_000;
  const activeViews = activeTurn ? viewParts(activeTurn, run, simulate, msPerToken) : [];
  const playing = simulate && run.phase !== "idle" && Boolean(activeTurn);
  const totalMs = run.durations.reduce((sum, duration) => sum + duration, 0);
  const share = totalMs > 0 ? Math.min(1, viewsElapsed(activeViews, msPerToken) / totalMs) : 1;
  const used =
    playing && activeTurn ? Math.round(contextUsed - activeTurn.tokens + activeTurn.tokens * share) : contextUsed;

  const degraded = tools.find((tool) => tool.status === "degraded");
  const health = streaming
    ? { dot: "bg-(--iu-accent)", label: "Responding", short: "Live" }
    : degraded
      ? { dot: "bg-amber-500", label: `${degraded.name} degraded`, short: "Degraded" }
      : { dot: "bg-emerald-500", label: `${tools.length} tools ready`, short: "Ready" };

  const lastView = activeViews[activeViews.length - 1];
  const failedView = activeViews.find((view): view is ToolView => view.kind === "tool" && view.state === "error");
  const runMessage =
    run.phase === "streaming"
      ? lastView?.kind === "tool"
        ? `Running ${lastView.call.name}`
        : `${agentName} is writing`
      : run.phase === "stopped"
        ? "Stopped"
        : failedView && run.epoch > 0
          ? `${failedView.call.name} failed`
          : run.completed
            ? "Response complete"
            : "";

  const toggleId = (turnId: string, callId: string) => `${baseId}-${turnId}-${callId}`;

  const stop = () => {
    if (run.phase !== "streaming") return;
    onStop?.();
    if (simulate) setRun((previous) => (previous.phase === "streaming" ? { ...previous, phase: "stopped" } : previous));
  };

  const retryTurn = (turn: RelayAgentTurn) => {
    onRetry?.(turn.id);
    if (!simulate || turn.id !== activeTurn?.id) return;
    setOpenCalls({});
    setCopiedTurn(null);
    setRun(
      createRun(turn, {
        streaming: true,
        healed: true,
        part: 0,
        progress: 0,
        epoch: run.epoch + 1,
        msPerToken,
        instant: reduced,
      }),
    );
    requestAnimationFrame(() => sendRef.current?.focus());
  };

  const retryCall = (turn: RelayAgentTurn, view: ToolView) => {
    onRetryTool?.(turn.id, view.call.id);
    if (!simulate || turn.id !== activeTurn?.id) return;
    setRun(
      createRun(turn, {
        streaming: true,
        healed: true,
        part: view.index,
        progress: 0,
        epoch: run.epoch + 1,
        msPerToken,
        instant: reduced,
        fresh: run.fresh.filter((id) => id !== view.call.id),
      }),
    );
    const target = toggleId(turn.id, view.call.id);
    requestAnimationFrame(() => document.getElementById(target)?.focus());
  };

  const copyTurn = async (turn: RelayAgentTurn, views: PartView[]) => {
    const text = viewsToText(views);
    const copied = await writeClipboard(text);
    setCopiedTurn(copied ? turn.id : null);
    setNotice(copied ? "Copied the answer" : "Copy failed. Select the text to copy it.");
    if (copied) onCopy?.(turn.id, text);
  };

  const send = () => {
    const text = draft.trim();
    if (!text || streaming) return;
    const sent = files;
    const time = new Date().toTimeString().slice(0, 5);
    setThread([
      ...thread,
      { id: `local-${Date.now()}`, role: "user", time, text, attachments: sent.length ? sent : undefined },
    ]);
    setDraft("");
    setFiles([]);
    pinnedRef.current = true;
    onSend?.({ text, attachments: sent, modelId });
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    send();
  };

  const onComposerKeyDown = (event: ReactKeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      send();
    }
  };

  const onFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (picked.length === 0) return;
    setFiles([
      ...files,
      ...picked.map((file, index) => ({
        id: `${file.name}-${file.size}-${file.lastModified}-${index}`,
        name: file.name,
        size: file.size,
      })),
    ]);
    setNotice(`Attached ${picked.length === 1 ? picked[0]?.name : `${picked.length} files`}`);
    onAttach?.(picked);
  };

  const removeFile = (file: RelayAttachment, index: number) => {
    const remaining = files.filter((candidate) => candidate.id !== file.id);
    setFiles(remaining);
    setNotice(`Removed ${file.name}`);
    onRemoveAttachment?.(file.id);
    requestAnimationFrame(() => {
      const buttons = chipsRef.current?.querySelectorAll("button");
      const next = buttons?.[Math.min(index, remaining.length - 1)];
      if (next) next.focus();
      else textareaRef.current?.focus();
    });
  };

  const pickSuggestion = (text: string) => {
    setDraft(text);
    requestAnimationFrame(() => {
      const area = textareaRef.current;
      if (!area) return;
      area.focus();
      area.setSelectionRange(text.length, text.length);
    });
  };

  const changeModel = (id: string) => {
    setModelId(id);
    onModelChange?.(id);
  };

  const onRootKeyDown = (event: ReactKeyboardEvent<HTMLElement>) => {
    if (event.key === "Escape" && streaming && !event.defaultPrevented) {
      event.preventDefault();
      stop();
    }
  };

  return (
    <section
      ref={rootRef}
      aria-labelledby={`${baseId}-title`}
      onKeyDown={onRootKeyDown}
      className={cx(
        "@container/console relative flex min-h-0 w-full flex-col rounded-[min(var(--iu-radius),8px)] border border-(--iu-border) bg-(--rc-panel) font-(family-name:--iu-font) text-(--iu-foreground) dark:border-(--iu-foreground)/12",
        "[--rc-line:color-mix(in_oklab,var(--iu-foreground)_13%,var(--iu-surface))] [--rc-panel:var(--iu-surface)] [--rc-raised:var(--iu-surface)] [--rc-sunken:color-mix(in_oklab,var(--iu-foreground)_3.5%,var(--iu-surface))]",
        "dark:[--rc-line:color-mix(in_oklab,var(--iu-foreground)_11%,transparent)] dark:[--rc-panel:color-mix(in_oklab,var(--iu-surface)_45%,var(--iu-background))] dark:[--rc-raised:var(--iu-surface)] dark:[--rc-sunken:color-mix(in_oklab,var(--iu-background)_70%,var(--iu-surface))]",
        className,
      )}
    >
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-(--rc-line) px-4 @2xl:px-6">
        <RelayMark />
        <h2 id={`${baseId}-title`} className="flex min-w-0 items-baseline gap-2 text-sm">
          <span className="hidden shrink-0 font-medium @lg:inline">{agentName}</span>
          <span aria-hidden="true" className="hidden text-(--iu-muted) @lg:inline">
            /
          </span>
          <span className="truncate font-medium @lg:font-normal @lg:text-(--iu-muted)">{title}</span>
        </h2>
        <p className={cx(MICRO, "ml-auto flex shrink-0 items-center gap-2 text-(--iu-muted)")}>
          <span aria-hidden="true" className={cx("size-1.5 rounded-full", health.dot)} />
          <span className="@lg:hidden">{health.short}</span>
          <span className="hidden @lg:inline">{health.label}</span>
        </p>
      </header>

      {/* One scroll container for the thread and the composer, so both share a column; the composer sticks. */}
      <div
        ref={threadRef}
        onScroll={(event) => {
          const node = event.currentTarget;
          pinnedRef.current = node.scrollHeight - node.scrollTop - node.clientHeight < 40;
        }}
        className="flex min-h-0 flex-1 flex-col overflow-y-auto rounded-b-[calc(min(var(--iu-radius),8px)-1px)]"
      >
        {thread.length === 0 ? (
          <EmptyState suggestions={suggestions} model={modelId} contextUsed={contextUsed} onPick={pickSuggestion} />
        ) : (
          <div className="flex-1 px-4 py-6 @2xl:px-6 @2xl:py-8">
            <ol className="mx-auto flex w-full max-w-[832px] flex-col gap-y-[calc(32px*var(--iu-density))]">
              {thread.map((turn) => {
                const labelId = `${baseId}-${turn.id}-label`;
                if (turn.role === "user") {
                  return (
                    <li key={turn.id}>
                      <UserTurn turn={turn} labelId={labelId} />
                    </li>
                  );
                }
                const isActive = turn.id === activeTurn?.id;
                const views = isActive ? activeViews : viewParts(turn, run, simulate, msPerToken);
                const live = isActive && streaming;
                const stopped = isActive && run.phase === "stopped";
                const copied = copiedTurn === turn.id;
                return (
                  <li key={turn.id}>
                    <article aria-labelledby={labelId} aria-busy={live || undefined} className={TURN_GRID}>
                      <TurnLabel id={labelId} name={agentName} time={turn.time} />
                      <div className="flex min-w-0 flex-col gap-3">
                        {views.map((view) => {
                          if (view.kind === "text") {
                            return (
                              <Prose
                                key={`text-${view.index}`}
                                tokens={view.tokens}
                                count={view.count}
                                caret={view.caret}
                                narration={view.narration}
                              />
                            );
                          }
                          const callKey = `${turn.id}:${view.call.id}`;
                          const open =
                            openCalls[callKey] ??
                            (view.state === "running" ||
                              view.state === "error" ||
                              view.fresh ||
                              view.call.open === true);
                          return (
                            <ToolCall
                              key={view.call.id}
                              view={view}
                              open={open}
                              toggleId={toggleId(turn.id, view.call.id)}
                              onToggle={() => setOpenCalls((previous) => ({ ...previous, [callKey]: !open }))}
                              onRetry={() => retryCall(turn, view)}
                            />
                          );
                        })}
                        {stopped ? (
                          <p className={cx(MICRO, "flex items-center gap-2 text-(--iu-muted)")}>
                            <Square aria-hidden="true" size={10} strokeWidth={0} fill="currentColor" />
                            Stopped after {formatSeconds(viewsElapsed(views, msPerToken))}
                          </p>
                        ) : null}
                        {live ? null : (
                          <div className="-ml-2 flex flex-wrap items-center gap-x-1 gap-y-1">
                            <button
                              type="button"
                              onClick={() => void copyTurn(turn, views)}
                              className={cx(GHOST, FOCUS)}
                            >
                              {copied ? (
                                <Check aria-hidden="true" size={14} strokeWidth={1.75} />
                              ) : (
                                <Copy aria-hidden="true" size={14} strokeWidth={1.5} />
                              )}
                              <span className="grid">
                                <span className="col-start-1 row-start-1">{copied ? "Copied" : "Copy"}</span>
                                <span aria-hidden="true" className="invisible col-start-1 row-start-1">
                                  Copied
                                </span>
                              </span>
                            </button>
                            <button type="button" onClick={() => retryTurn(turn)} className={cx(GHOST, FOCUS)}>
                              <RotateCcw aria-hidden="true" size={14} strokeWidth={1.5} />
                              Retry
                            </button>
                            <p className="ml-auto pl-2 font-mono text-[11px] text-(--iu-muted) tabular-nums">
                              {turn.model} · {formatNumber(turn.tokens)} tokens ·{" "}
                              {formatSeconds(viewsElapsed(views, msPerToken))}
                            </p>
                          </div>
                        )}
                      </div>
                    </article>
                  </li>
                );
              })}
            </ol>
          </div>
        )}

        <div className="sticky bottom-0 z-10 shrink-0 border-t border-(--rc-line) bg-(--rc-panel) px-4 pt-3 pb-3.5 @2xl:px-6 @2xl:pt-4 @2xl:pb-4">
          <div className="mx-auto w-full max-w-[832px] @2xl:pl-[112px]">
            <form
              onSubmit={onSubmit}
              className="rounded-[min(var(--iu-radius),8px)] border border-(--iu-foreground)/50 bg-(--iu-surface) has-[textarea:focus-visible]:outline-2 has-[textarea:focus-visible]:outline-offset-2 has-[textarea:focus-visible]:outline-(--iu-accent) dark:border-(--iu-foreground)/35"
            >
              {files.length > 0 ? (
                <ul ref={chipsRef} aria-label="Attachments" className="flex flex-wrap gap-2 px-3 pt-3">
                  {files.map((file, index) => (
                    <li
                      key={file.id}
                      className="inline-flex h-8 max-w-full items-center gap-2 rounded-[min(var(--iu-radius),6px)] border border-(--rc-line) bg-(--rc-raised) pr-1 pl-2.5 text-[13px]"
                    >
                      <FileGlyph name={file.name} />
                      <span className="min-w-0 truncate">{file.name}</span>
                      <span className="shrink-0 font-mono text-[11px] text-(--iu-muted) tabular-nums">
                        {formatBytes(file.size)}
                      </span>
                      <button
                        type="button"
                        aria-label={`Remove ${file.name}`}
                        onClick={() => removeFile(file, index)}
                        className={cx(
                          "relative inline-flex size-6 shrink-0 items-center justify-center rounded-[min(var(--iu-radius),4px)] text-(--iu-muted) transition-colors duration-150 motion-reduce:transition-none pointer-coarse:before:absolute pointer-coarse:before:-inset-2 pointer-fine:hover:bg-(--iu-foreground)/8 pointer-fine:hover:text-(--iu-foreground)",
                          FOCUS,
                        )}
                      >
                        <X aria-hidden="true" size={14} strokeWidth={1.5} />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
              <label htmlFor={`${baseId}-draft`} className="sr-only">
                Message {agentName}
              </label>
              <textarea
                id={`${baseId}-draft`}
                ref={textareaRef}
                rows={1}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={onComposerKeyDown}
                placeholder="Ask about payments, incidents or deploys"
                className="block max-h-[200px] min-h-[52px] w-full resize-none bg-transparent px-3.5 pt-3 pb-2 text-[15px] leading-[1.6] text-(--iu-foreground) outline-none placeholder:text-(--iu-muted)"
              />
              <div className="flex items-center gap-1 px-2 pb-2">
                <input ref={fileRef} type="file" multiple hidden onChange={onFiles} />
                <button
                  type="button"
                  aria-label="Attach files"
                  onClick={() => fileRef.current?.click()}
                  className={cx(
                    "inline-flex size-8 items-center justify-center rounded-[min(var(--iu-radius),6px)] text-(--iu-muted) transition-colors duration-150 motion-reduce:transition-none pointer-coarse:size-10 pointer-fine:hover:bg-(--iu-foreground)/6 pointer-fine:hover:text-(--iu-foreground)",
                    FOCUS,
                  )}
                >
                  <Paperclip aria-hidden="true" size={16} strokeWidth={1.5} />
                </button>
                <ModelPicker models={models} value={modelId} onChange={changeModel} />
                <button
                  ref={sendRef}
                  type={streaming ? "button" : "submit"}
                  onClick={streaming ? stop : undefined}
                  disabled={!streaming && !draft.trim()}
                  className={cx(
                    "ml-auto inline-flex h-8 min-w-[76px] items-center justify-center gap-1.5 rounded-[min(var(--iu-radius),6px)] px-3 text-[13px] font-medium transition-colors duration-150 motion-reduce:transition-none pointer-coarse:h-10",
                    FOCUS,
                    streaming
                      ? "bg-(--iu-foreground) text-(--iu-background) pointer-fine:hover:bg-(--iu-foreground)/85"
                      : "bg-(--iu-accent) text-(--iu-accent-foreground) disabled:bg-(--iu-foreground)/8 disabled:text-(--iu-muted) pointer-fine:enabled:hover:bg-(--iu-accent)/90",
                  )}
                >
                  {streaming ? (
                    <>
                      <Square aria-hidden="true" size={10} strokeWidth={0} fill="currentColor" />
                      Stop
                    </>
                  ) : (
                    <>
                      Send
                      <CornerDownLeft aria-hidden="true" size={14} strokeWidth={1.75} />
                    </>
                  )}
                </button>
              </div>
            </form>
            <div className="mt-3 flex items-center gap-3">
              <ContextMeter used={used} limit={limit} />
              <p className="ml-auto hidden items-center gap-3 font-mono text-[11px] text-(--iu-muted) @xl:flex">
                {streaming ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Kbd>Esc</Kbd>
                    stop
                  </span>
                ) : (
                  <>
                    <span className="inline-flex items-center gap-1.5">
                      <Kbd>
                        <CornerDownLeft aria-hidden="true" size={11} strokeWidth={1.75} />
                        <span className="sr-only">Enter</span>
                      </Kbd>
                      send
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Kbd>Shift</Kbd>
                      <Kbd>
                        <CornerDownLeft aria-hidden="true" size={11} strokeWidth={1.75} />
                        <span className="sr-only">Enter</span>
                      </Kbd>
                      new line
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      <p aria-live="polite" className="sr-only">
        {runMessage}
      </p>
      <p aria-live="polite" className="sr-only">
        {notice}
      </p>
    </section>
  );
}

export default RelayAgentConsole;
