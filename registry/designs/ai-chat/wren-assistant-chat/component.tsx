"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "motion/react";
import {
  ArrowUp,
  Check,
  ChevronDown,
  Copy,
  FileText,
  LoaderCircle,
  Paperclip,
  RotateCcw,
  Search,
  Square,
  TriangleAlert,
  X,
} from "lucide-react";

export type WrenStay = {
  name: string;
  area: string;
  detail: string;
  pricePerNight: number;
  bestFit?: boolean;
};

export type WrenToolCall = {
  /** Shown on the pill once the call finished, e.g. "Checked 3 stays in Alfama". */
  label: string;
  /** Shown while the call runs, e.g. "Checking stays in Alfama". */
  runningLabel: string;
  durationMs: number;
  args: { label: string; value: string }[];
  results: WrenStay[];
  /** Start with the arguments and results unfolded. */
  defaultOpen?: boolean;
};

export type WrenPart =
  | { type: "text"; text: string }
  | { type: "tool"; call: WrenToolCall }
  | { type: "plan"; items: { day: string; text: string }[] };

export type WrenAttachment = { id: string; name: string; size: string };

export type WrenMessage =
  | { id: string; role: "user"; time: string; text: string; attachments?: WrenAttachment[] }
  | { id: string; role: "assistant"; time: string; parts: WrenPart[]; tokens: number; model: string };

export type WrenModel = { id: string; name: string; description: string };

export type WrenUsage = { used: number; limit: number; label: string };

export type WrenAssistantChatProps = {
  assistantName?: string;
  context?: string;
  greeting?: string;
  messages?: WrenMessage[];
  /** "streaming" plays the last assistant message; "error" shows it cut off with a retry card. */
  status?: "idle" | "streaming" | "error";
  /** Where the streaming (or failed) reply starts, from 0 to 1 of its length. */
  streamFrom?: number;
  errorMessage?: string;
  models?: WrenModel[];
  defaultModelId?: string;
  attachments?: WrenAttachment[];
  defaultDraft?: string;
  usage?: WrenUsage;
  suggestions?: string[];
  onSend?: (message: { text: string; attachments: WrenAttachment[]; modelId: string }) => void;
  onStop?: (messageId: string) => void;
  onRetry?: (messageId: string) => void;
  onCopy?: (messageId: string, text: string) => void;
  onModelChange?: (modelId: string) => void;
  onAttach?: (files: File[]) => void;
  onStreamEnd?: (messageId: string) => void;
  className?: string;
};

export const WREN_MODELS: WrenModel[] = [
  { id: "wren-quick", name: "Wren Quick", description: "Fast answers for one-line questions" },
  { id: "wren-plus", name: "Wren Plus", description: "Plans trips step by step and checks prices" },
  { id: "wren-deep", name: "Wren Deep", description: "Compares many options, takes a little longer" },
];

export const WREN_DEMO_MESSAGES: WrenMessage[] = [
  {
    id: "m1",
    role: "user",
    time: "09:41",
    text: "Plan a long weekend in Lisbon for two, 13 to 16 March. We want somewhere quiet near the tram, and the whole trip under €600.",
    attachments: [{ id: "a1", name: "flights-lis-0313.pdf", size: "182 KB" }],
  },
  {
    id: "m2",
    role: "assistant",
    time: "09:41",
    model: "Wren Plus",
    tokens: 486,
    parts: [
      { type: "text", text: "Your flights land at 10:20 on Friday, so I looked for stays you can reach before lunch." },
      {
        type: "tool",
        call: {
          label: "Checked 3 stays in Alfama",
          runningLabel: "Checking stays in Alfama",
          durationMs: 840,
          defaultOpen: true,
          args: [
            { label: "Check-in", value: "Fri 13 Mar" },
            { label: "Nights", value: "3" },
            { label: "Guests", value: "2" },
            { label: "Max per night", value: "€140" },
            { label: "Near", value: "Tram 28" },
          ],
          results: [
            {
              name: "Casa Azulejo",
              area: "Alfama",
              detail: "4 min walk to tram 28 · courtyard room",
              pricePerNight: 118,
              bestFit: true,
            },
            { name: "Pátio das Laranjas", area: "Graça", detail: "7 min walk · rooftop, no lift", pricePerNight: 104 },
            { name: "Rua do Vigário 22", area: "Alfama", detail: "2 min walk · street-facing", pricePerNight: 136 },
          ],
        },
      },
      {
        type: "text",
        text: "Casa Azulejo fits best: its courtyard rooms face away from the street, and three nights come to €354. Here is a gentle plan around it.",
      },
      {
        type: "plan",
        items: [
          { day: "Fri 13", text: "Check in, lunch at Graça market, sunset from the Senhora do Monte viewpoint." },
          { day: "Sat 14", text: "Tram 28 to Estrela early, then the tile museum and dinner in Alfama." },
          { day: "Sun 15", text: "Day trip to Sintra by train, €16.40 return each, back for a late fado set." },
        ],
      },
      {
        type: "text",
        text: "With €160 set aside for food and €33 for trains, you land at €547, which leaves €53 of room.",
      },
    ],
  },
];

const DEFAULT_SUGGESTIONS = [
  "Plan a long weekend in Lisbon under €600",
  "Find a quiet stay near tram 28",
  "What should I pack for 18 °C and rain?",
];

const TOOL_UNITS = 90;
const TICK_MS = 32;
const UNITS_PER_TICK = 3;

const ROOT_VARS = [
  "[--wr-well:color-mix(in_oklab,var(--iu-foreground)_4%,var(--iu-surface))]",
  "[--wr-tint:color-mix(in_oklab,var(--iu-accent)_12%,var(--iu-surface))]",
  "[--wr-line:color-mix(in_oklab,var(--iu-foreground)_38%,var(--iu-surface))]",
  "[--wr-sh-card:0_1px_1px_color-mix(in_oklab,black_4%,transparent),0_6px_12px_-4px_color-mix(in_oklab,black_5%,transparent),0_32px_64px_-24px_color-mix(in_oklab,black_18%,transparent)]",
  "[--wr-sh-well:inset_0_1px_3px_color-mix(in_oklab,black_8%,transparent)]",
  "[--wr-sh-raised:inset_0_1px_0_color-mix(in_oklab,white_70%,transparent),0_1px_2px_color-mix(in_oklab,black_7%,transparent),0_6px_14px_-6px_color-mix(in_oklab,black_14%,transparent)]",
  "[--wr-sh-pop:0_2px_4px_color-mix(in_oklab,black_4%,transparent),0_18px_40px_-12px_color-mix(in_oklab,black_24%,transparent)]",
  "[--wr-sh-btn:inset_0_1px_0_color-mix(in_oklab,white_30%,transparent),inset_0_-2px_0_color-mix(in_oklab,black_10%,transparent),0_1px_2px_color-mix(in_oklab,black_12%,transparent),0_10px_20px_-10px_color-mix(in_oklab,var(--iu-accent)_70%,transparent)]",
  "[--wr-sh-pressed:inset_0_2px_5px_color-mix(in_oklab,black_28%,transparent)]",
  "dark:[--wr-well:color-mix(in_oklab,var(--iu-foreground)_5%,var(--iu-background))]",
  "dark:[--wr-tint:color-mix(in_oklab,var(--iu-accent)_14%,var(--iu-surface))]",
  "dark:[--wr-line:color-mix(in_oklab,var(--iu-foreground)_42%,var(--iu-surface))]",
  "dark:[--wr-sh-card:inset_0_1px_0_color-mix(in_oklab,white_5%,transparent),0_24px_48px_-16px_color-mix(in_oklab,black_70%,transparent)]",
  "dark:[--wr-sh-well:inset_0_1px_2px_color-mix(in_oklab,black_45%,transparent)]",
  "dark:[--wr-sh-raised:inset_0_1px_0_color-mix(in_oklab,white_7%,transparent),0_1px_2px_color-mix(in_oklab,black_40%,transparent),0_6px_14px_-6px_color-mix(in_oklab,black_60%,transparent)]",
  "dark:[--wr-sh-pop:inset_0_1px_0_color-mix(in_oklab,white_6%,transparent),0_24px_48px_-12px_color-mix(in_oklab,black_75%,transparent)]",
  "dark:[--wr-sh-btn:inset_0_1px_0_color-mix(in_oklab,white_26%,transparent),inset_0_-2px_0_color-mix(in_oklab,black_14%,transparent),0_1px_2px_color-mix(in_oklab,black_40%,transparent),0_10px_20px_-10px_color-mix(in_oklab,var(--iu-accent)_35%,transparent)]",
  "dark:[--wr-sh-pressed:inset_0_2px_6px_color-mix(in_oklab,black_45%,transparent)]",
].join(" ");

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--iu-accent)";
const SOFT_BUTTON = `inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full px-3 text-[13px] font-medium text-(--iu-muted) transition-[background-color,color,scale] duration-150 active:scale-[0.97] motion-reduce:transition-none pointer-coarse:h-10 pointer-fine:hover:bg-(--wr-well) pointer-fine:hover:text-(--iu-foreground) ${FOCUS}`;

function cx(...values: (string | false | null | undefined)[]) {
  return values.filter(Boolean).join(" ");
}

function partUnits(part: WrenPart) {
  if (part.type === "text") return part.text.length;
  if (part.type === "tool") return TOOL_UNITS;
  return part.items.reduce((sum, item) => sum + item.text.length, 0);
}

function messageUnits(parts: WrenPart[]) {
  return parts.reduce((sum, part) => sum + partUnits(part), 0);
}

function plainText(parts: WrenPart[]) {
  return parts
    .map((part) => {
      if (part.type === "text") return part.text;
      if (part.type === "plan") return part.items.map((item) => `${item.day}: ${item.text}`).join("\n");
      return `${part.call.label}: ${part.call.results.map((stay) => `${stay.name} €${stay.pricePerNight}`).join(", ")}`;
    })
    .join("\n\n");
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Sandboxed frames can block the async clipboard; a selected textarea still copies on a user gesture.
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

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Wren's mark: a small bird drawn in two strokes. */
function WrenMark({ size = 40 }: { size?: number }) {
  return (
    <span
      aria-hidden="true"
      style={{ width: size, height: size }}
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-(--wr-tint) text-(--iu-foreground) shadow-(--wr-sh-raised)"
    >
      <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="none">
        <path
          d="M4 14.5c2.6 0 4.2-1.2 5.2-3.4C10.6 8 12.7 6 15.6 6c2.1 0 3.6 1.2 4.4 2.6l-2.4.9c.2 3.9-2.7 7.5-7.6 7.5H5.5"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M9 17l-1.6 3M12 17l-.4 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="15.8" cy="8.9" r="1.1" fill="var(--iu-accent)" />
      </svg>
    </span>
  );
}

function UsageMeter({ usage, extra }: { usage: WrenUsage; extra: number }) {
  const used = Math.min(usage.limit, usage.used + extra);
  const ratio = usage.limit > 0 ? used / usage.limit : 0;
  return (
    <div
      role="meter"
      aria-label={usage.label}
      aria-valuemin={0}
      aria-valuemax={usage.limit}
      aria-valuenow={used}
      aria-valuetext={`${used} of ${usage.limit} ${usage.label.toLowerCase()} used`}
      className="flex shrink-0 flex-col items-end gap-1.5"
    >
      <span className="text-[12px] font-medium text-(--iu-muted) tabular-nums">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span
            key={used}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="inline-block text-(--iu-foreground)"
          >
            {used}
          </motion.span>
        </AnimatePresence>
        <span> / {usage.limit}</span>
        <span className="hidden @md:inline"> {usage.label.toLowerCase()}</span>
      </span>
      <span
        aria-hidden="true"
        className="block h-2 w-20 overflow-hidden rounded-full bg-(--wr-well) shadow-(--wr-sh-well) @md:w-28"
      >
        <motion.span
          className="block h-full rounded-full bg-(--iu-accent)"
          initial={false}
          animate={{ width: `${Math.max(4, ratio * 100)}%` }}
        />
      </span>
    </div>
  );
}

function ToolCallBlock({ call, state }: { call: WrenToolCall; state: "running" | "done" }) {
  const [open, setOpen] = useState(call.defaultOpen ?? false);
  const panelId = useId();
  const running = state === "running";
  const best = call.results.find((stay) => stay.bestFit);
  return (
    <div className="my-1">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        disabled={running}
        onClick={() => setOpen((value) => !value)}
        className={cx(
          "group inline-flex min-h-10 max-w-full cursor-pointer items-center gap-2 rounded-full border border-(--iu-border) bg-(--iu-surface) py-1.5 pr-3 pl-1.5 text-left text-[14px] font-medium shadow-(--wr-sh-raised) transition-[translate,box-shadow,scale] duration-200 active:scale-[0.98] active:shadow-(--wr-sh-pressed) disabled:cursor-default motion-reduce:transition-none dark:border-(--iu-foreground)/10 pointer-fine:hover:not-disabled:-translate-y-px",
          FOCUS,
        )}
      >
        <span
          aria-hidden="true"
          className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-(--wr-tint) text-(--iu-foreground)"
        >
          {running ? (
            <LoaderCircle size={15} strokeWidth={1.75} className="animate-spin motion-reduce:animate-none" />
          ) : (
            <Search size={15} strokeWidth={1.75} />
          )}
        </span>
        <span className="truncate">{running ? `${call.runningLabel}…` : call.label}</span>
        {!running && (
          <span className="shrink-0 font-mono text-[11px] text-(--iu-muted) tabular-nums">
            {(call.durationMs / 1000).toFixed(1)} s
          </span>
        )}
        {!running && (
          <ChevronDown
            size={16}
            strokeWidth={1.5}
            aria-hidden="true"
            className={cx(
              "shrink-0 text-(--iu-muted) transition-transform duration-200 motion-reduce:transition-none",
              open && "rotate-180",
            )}
          />
        )}
      </button>
      <AnimatePresence initial={false}>
        {open && !running && (
          <motion.div
            id={panelId}
            key="panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 rounded-[max(var(--iu-radius),18px)] border border-(--iu-border) bg-(--wr-well) p-[calc(12px*var(--iu-density))] shadow-(--wr-sh-well) @md:p-[calc(16px*var(--iu-density))] dark:border-(--iu-foreground)/8">
              <p className="text-[12px] font-medium text-(--iu-muted)">Asked for</p>
              <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Search arguments">
                {call.args.map((arg) => (
                  <li
                    key={arg.label}
                    className="inline-flex items-center gap-1.5 rounded-full border border-(--iu-border) bg-(--iu-surface) px-2.5 py-1 text-[12px] dark:border-(--iu-foreground)/10"
                  >
                    <span className="text-(--iu-muted)">{arg.label}</span>
                    <span className="font-medium tabular-nums">{arg.value}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-[12px] font-medium text-(--iu-muted)">Found</p>
              <ul className="mt-2 grid grid-cols-1 gap-2">
                {call.results.map((stay, index) => (
                  <motion.li
                    key={stay.name}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.06 * index }}
                    className={cx(
                      "flex items-center gap-3 rounded-[max(var(--iu-radius),14px)] border bg-(--iu-surface) p-[calc(10px*var(--iu-density))] shadow-(--wr-sh-raised)",
                      stay.bestFit ? "border-(--iu-accent)" : "border-(--iu-border) dark:border-(--iu-foreground)/10",
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className="inline-flex size-10 shrink-0 items-center justify-center rounded-[12px] bg-(--wr-tint) text-[15px] font-semibold"
                    >
                      {stay.name.charAt(0)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className="text-[14px] font-semibold">{stay.name}</span>
                        {stay.bestFit && (
                          <span className="rounded-full bg-(--iu-accent) px-2 py-0.5 text-[11px] font-semibold text-(--iu-accent-foreground)">
                            Best fit
                          </span>
                        )}
                      </span>
                      <span className="mt-0.5 block truncate text-[12px] text-(--iu-muted)">
                        {stay.area} · {stay.detail}
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block text-[17px] font-semibold tracking-[-0.01em] tabular-nums">
                        €{stay.pricePerNight}
                      </span>
                      <span className="block text-[11px] text-(--iu-muted)">a night</span>
                    </span>
                  </motion.li>
                ))}
              </ul>
              {best && (
                <p className="mt-3 text-[12px] text-(--iu-muted)">
                  Ranked by walking time to the tram, then by noise from the street.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Caret() {
  return (
    <span
      aria-hidden="true"
      className="ml-0.5 inline-block h-[1.05em] w-2 translate-y-[0.15em] rounded-full bg-(--iu-accent)"
    />
  );
}

function AssistantBody({ parts, limit, streaming }: { parts: WrenPart[]; limit: number; streaming: boolean }) {
  const nodes: ReactNode[] = [];
  let cursor = 0;
  for (const [index, part] of parts.entries()) {
    if (cursor >= limit) break;
    const units = partUnits(part);
    const visible = Math.min(units, limit - cursor);
    const caretHere = streaming && visible < units;
    if (part.type === "text") {
      nodes.push(
        <p key={index} className="text-[15px] leading-[1.6] text-pretty">
          {part.text.slice(0, visible)}
          {caretHere && <Caret />}
        </p>,
      );
    } else if (part.type === "tool") {
      nodes.push(<ToolCallBlock key={index} call={part.call} state={visible < units ? "running" : "done"} />);
    } else {
      let itemCursor = 0;
      const items: ReactNode[] = [];
      for (const item of part.items) {
        if (itemCursor >= visible) break;
        const shown = Math.min(item.text.length, visible - itemCursor);
        items.push(
          <li
            key={item.day}
            className="grid grid-cols-[64px_1fr] gap-3 border-t border-(--iu-border) py-[calc(10px*var(--iu-density))] first:border-t-0 dark:border-(--iu-foreground)/8"
          >
            <span className="text-[13px] font-semibold tabular-nums">{item.day}</span>
            <span className="text-[14px] leading-[1.55] text-pretty">
              {item.text.slice(0, shown)}
              {caretHere && shown < item.text.length && <Caret />}
            </span>
          </li>,
        );
        itemCursor += item.text.length;
      }
      nodes.push(
        <ol
          key={index}
          aria-label="Plan by day"
          className="rounded-[max(var(--iu-radius),16px)] border border-(--iu-border) bg-(--iu-surface) px-4 py-1 shadow-(--wr-sh-raised) dark:border-(--iu-foreground)/10"
        >
          {items}
        </ol>,
      );
    }
    cursor += units;
  }
  return <div className="flex flex-col gap-3">{nodes}</div>;
}

function StopRing({ progress }: { progress: number }) {
  const r = 21;
  const c = 2 * Math.PI * r;
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" className="pointer-events-none absolute -inset-1 size-12 -rotate-90">
      <circle cx="24" cy="24" r={r} fill="none" stroke="var(--wr-well)" strokeWidth="2.5" />
      <circle
        cx="24"
        cy="24"
        r={r}
        fill="none"
        stroke="var(--iu-accent)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - Math.min(1, Math.max(0, progress)))}
      />
    </svg>
  );
}

function ModelPicker({
  models,
  value,
  onChange,
  disabled,
}: {
  models: WrenModel[];
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
  const onListKey = (event: KeyboardEvent<HTMLUListElement>) => {
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
        aria-label={`Model: ${selected?.name ?? ""}`}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            openList();
          }
        }}
        className={cx(
          "inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-(--iu-border) bg-(--iu-surface) pr-2.5 pl-3 text-[13px] font-medium shadow-(--wr-sh-raised) transition-[scale,box-shadow] duration-150 active:scale-[0.97] active:shadow-(--wr-sh-pressed) disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none dark:border-(--iu-foreground)/10 pointer-coarse:h-10",
          FOCUS,
        )}
      >
        {selected?.name}
        <ChevronDown size={14} strokeWidth={1.75} aria-hidden="true" className="text-(--iu-muted)" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            ref={listRef}
            id={listId}
            role="listbox"
            tabIndex={-1}
            aria-label="Choose a model"
            aria-activedescendant={`${listId}-${active}`}
            onKeyDown={onListKey}
            initial={{ opacity: 0, scale: 0.96, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 4 }}
            className="absolute bottom-full left-0 z-30 mb-2 w-[min(280px,calc(100vw-48px))] origin-bottom-left rounded-[max(var(--iu-radius),18px)] border border-(--iu-border) bg-(--iu-surface) p-1.5 shadow-(--wr-sh-pop) outline-none dark:border-(--iu-foreground)/12"
          >
            {models.map((model, index) => {
              const isSelected = model.id === value;
              return (
                <li
                  key={model.id}
                  id={`${listId}-${index}`}
                  role="option"
                  aria-selected={isSelected}
                  onPointerEnter={() => setActive(index)}
                  onClick={() => choose(index)}
                  className={cx(
                    "flex cursor-pointer items-start gap-2 rounded-[12px] px-3 py-2.5",
                    index === active && "bg-(--wr-well)",
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14px] font-semibold">{model.name}</span>
                    <span className="block text-[12px] leading-snug text-(--iu-muted)">{model.description}</span>
                  </span>
                  <Check
                    size={16}
                    strokeWidth={2}
                    aria-hidden="true"
                    className={cx("mt-0.5 shrink-0", isSelected ? "opacity-100" : "opacity-0")}
                  />
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

export function WrenAssistantChat({
  assistantName = "Wren",
  context = "Wayfern trips · Lisbon, 13–16 Mar",
  greeting = "Where to next, Inés?",
  messages = WREN_DEMO_MESSAGES,
  status = "idle",
  streamFrom = 0,
  errorMessage = "I lost the connection while writing the plan. Nothing was saved and this reply did not count toward your month.",
  models = WREN_MODELS,
  defaultModelId = "wren-plus",
  attachments: initialAttachments = [],
  defaultDraft = "",
  usage = { used: 312, limit: 500, label: "Replies" },
  suggestions = DEFAULT_SUGGESTIONS,
  onSend,
  onStop,
  onRetry,
  onCopy,
  onModelChange,
  onAttach,
  onStreamEnd,
  className = "",
}: WrenAssistantChatProps) {
  const reduceMotion = useReducedMotion();
  const rootRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const chipRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const draftId = useId();

  const [draft, setDraft] = useState(defaultDraft);
  const [attachments, setAttachments] = useState<WrenAttachment[]>(initialAttachments);
  const [modelId, setModelId] = useState(defaultModelId);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [stopped, setStopped] = useState<Record<string, number>>({});
  const [finished, setFinished] = useState(0);

  const last = messages.at(-1);
  const lastAssistant = last && last.role === "assistant" ? last : null;
  const total = lastAssistant ? messageUnits(lastAssistant.parts) : 0;
  const streamingId =
    status === "streaming" && lastAssistant && stopped[lastAssistant.id] === undefined ? lastAssistant.id : null;

  const [stream, setStream] = useState<{ id: string | null; value: number }>(() => ({
    id: streamingId,
    value: Math.round(streamFrom * total),
  }));
  const startUnits = Math.round(streamFrom * total);
  // Under reduced motion a demo frame (streamFrom > 0) stays still; a reply the user asked for lands at once.
  const progress = stream.id === streamingId ? stream.value : reduceMotion && startUnits === 0 ? total : startUnits;
  const visibleRef = useRef(true);
  const endedRef = useRef(new Set<string>());

  useEffect(() => {
    const node = rootRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver((entries) => {
      visibleRef.current = entries[0]?.isIntersecting ?? true;
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // Advance the stream whenever a reply is playing and the card is on screen.
  useEffect(() => {
    if (!streamingId || reduceMotion) return;
    endedRef.current.delete(streamingId);
    const start = Math.round(streamFrom * total);
    const timer = window.setInterval(() => {
      if (!visibleRef.current) return;
      setStream((current) => ({
        id: streamingId,
        value: Math.min(total, (current.id === streamingId ? current.value : start) + UNITS_PER_TICK),
      }));
    }, TICK_MS);
    return () => window.clearInterval(timer);
  }, [streamingId, total, streamFrom, reduceMotion]);

  useEffect(() => {
    if (!streamingId || progress < total) return;
    if (endedRef.current.has(streamingId)) return;
    endedRef.current.add(streamingId);
    setFinished((count) => count + 1);
    setAnnouncement("Reply finished");
    onStreamEnd?.(streamingId);
  }, [progress, total, streamingId, onStreamEnd]);

  const isStreaming = streamingId !== null && progress < total;

  const stop = useCallback(() => {
    if (!streamingId) return;
    setStopped((map) => ({ ...map, [streamingId]: progress }));
    setAnnouncement("Stopped");
    onStop?.(streamingId);
    inputRef.current?.focus();
  }, [streamingId, progress, onStop]);

  const send = () => {
    const text = draft.trim();
    if (!text || isStreaming) return;
    onSend?.({ text, attachments, modelId });
    setDraft("");
    setAttachments([]);
  };

  const removeAttachment = (index: number) => {
    const item = attachments[index];
    const next = attachments.filter((_, i) => i !== index);
    setAttachments(next);
    if (item) setAnnouncement(`Removed ${item.name}`);
    requestAnimationFrame(() => {
      const target = chipRefs.current[Math.min(index, next.length - 1)];
      if (next.length > 0 && target) target.focus();
      else inputRef.current?.focus();
    });
  };

  const onFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;
    setAttachments((list) => [
      ...list,
      ...files.map((file, index) => ({
        id: `${file.name}-${Date.now()}-${index}`,
        name: file.name,
        size: formatBytes(file.size),
      })),
    ]);
    setAnnouncement(`Attached ${files.map((file) => file.name).join(", ")}`);
    onAttach?.(files);
    event.target.value = "";
  };

  const copy = async (message: Extract<WrenMessage, { role: "assistant" }>) => {
    const text = plainText(message.parts);
    const ok = await copyText(text);
    if (!ok) return;
    setCopiedId(message.id);
    setAnnouncement("Copied to clipboard");
    onCopy?.(message.id, text);
    window.setTimeout(() => setCopiedId((id) => (id === message.id ? null : id)), 1600);
  };

  const retry = (id: string) => {
    setStream({ id: null, value: 0 });
    setStopped((map) => {
      const next = { ...map };
      delete next[id];
      return next;
    });
    onRetry?.(id);
  };

  const lastFailed = status === "error" && lastAssistant ? lastAssistant.id : null;
  const hasDraft = draft.trim().length > 0;
  const ratio = total > 0 ? progress / total : 0;

  const rootClass = useMemo(
    () =>
      cx(
        "@container relative mx-auto flex w-full max-w-[760px] flex-col rounded-[max(calc(var(--iu-radius)+14px),24px)] border border-(--iu-border) bg-(--iu-surface) font-(family-name:--iu-font) text-(--iu-foreground) shadow-(--wr-sh-card) dark:border-(--iu-foreground)/10",
        ROOT_VARS,
        className,
      ),
    [className],
  );

  return (
    <MotionConfig
      reducedMotion="user"
      transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 360, damping: 30 }}
    >
      <section
        ref={rootRef}
        aria-label={`${assistantName}, trip assistant`}
        className={rootClass}
        onKeyDown={(event) => {
          if (event.key === "Escape" && isStreaming) stop();
        }}
      >
        <header className="flex items-center gap-3 border-b border-(--iu-border) px-4 py-3.5 @md:px-6 dark:border-(--iu-foreground)/8">
          <WrenMark />
          <div className="min-w-0 flex-1">
            <h2 className="text-[16px] leading-tight font-semibold">{assistantName}</h2>
            <p className="truncate text-[13px] text-(--iu-muted)">{context}</p>
          </div>
          <UsageMeter usage={usage} extra={finished} />
        </header>

        <div className="flex flex-col gap-7 px-4 py-6 @md:px-6 @md:py-8">
          {messages.length === 0 ? (
            <div className="flex flex-col items-start gap-6 py-6 @md:py-10">
              <WrenMark size={56} />
              <div>
                <h3 className="text-[28px] leading-[1.1] font-semibold tracking-[-0.02em] text-balance @md:text-[34px]">
                  {greeting}
                </h3>
                <p className="mt-2 max-w-[44ch] text-[15px] leading-[1.55] text-pretty text-(--iu-muted)">
                  Ask for a plan, a stay or a packing list. {assistantName} checks real prices before it answers.
                </p>
              </div>
              <ul className="grid w-full gap-2.5 @md:grid-cols-3">
                {suggestions.map((suggestion) => (
                  <li key={suggestion}>
                    <button
                      type="button"
                      onClick={() => {
                        setDraft(suggestion);
                        inputRef.current?.focus();
                      }}
                      className={cx(
                        "h-full min-h-20 w-full cursor-pointer rounded-[max(var(--iu-radius),18px)] border border-(--iu-border) bg-(--iu-surface) p-4 text-left text-[14px] leading-snug font-medium shadow-(--wr-sh-raised) transition-[translate,scale,box-shadow] duration-200 active:scale-[0.98] active:shadow-(--wr-sh-pressed) motion-reduce:transition-none dark:border-(--iu-foreground)/10 pointer-fine:hover:-translate-y-0.5",
                        FOCUS,
                      )}
                    >
                      {suggestion}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            messages.map((message) => {
              if (message.role === "user") {
                return (
                  <div key={message.id} className="flex flex-col items-end gap-2">
                    {message.attachments?.map((file) => (
                      <span
                        key={file.id}
                        className="inline-flex items-center gap-2 rounded-full border border-(--iu-border) bg-(--iu-surface) py-1 pr-3 pl-1 text-[12px] shadow-(--wr-sh-raised) dark:border-(--iu-foreground)/10"
                      >
                        <span className="inline-flex size-6 items-center justify-center rounded-full bg-(--wr-well)">
                          <FileText size={13} strokeWidth={1.75} aria-hidden="true" />
                        </span>
                        <span className="font-medium">{file.name}</span>
                        <span className="text-(--iu-muted) tabular-nums">{file.size}</span>
                      </span>
                    ))}
                    <p className="max-w-[88%] rounded-[22px] rounded-br-[8px] bg-(--wr-tint) px-4 py-3 text-[15px] leading-[1.55] text-pretty @md:max-w-[75%]">
                      <span className="sr-only">You said: </span>
                      {message.text}
                    </p>
                    <span className="text-[11px] text-(--iu-muted) tabular-nums">{message.time}</span>
                  </div>
                );
              }
              const isLive = message.id === streamingId;
              const stoppedAt = stopped[message.id];
              const failed = message.id === lastFailed;
              const units = messageUnits(message.parts);
              const limit = isLive
                ? progress
                : stoppedAt !== undefined
                  ? stoppedAt
                  : failed
                    ? Math.round(streamFrom * units)
                    : units;
              const done = limit >= units && !failed;
              return (
                <article
                  key={message.id}
                  aria-label={`${assistantName} at ${message.time}`}
                  aria-busy={isLive && !done}
                  className="flex gap-3"
                >
                  <span className="hidden @md:block">
                    <WrenMark size={32} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <AssistantBody parts={message.parts} limit={limit} streaming={isLive && !done} />
                    {stoppedAt !== undefined && !done && (
                      <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-(--wr-well) px-3 py-1 text-[12px] font-medium text-(--iu-muted)">
                        <Square size={10} strokeWidth={2} aria-hidden="true" className="fill-current" />
                        Stopped. Ask again or retry for the full plan.
                      </p>
                    )}
                    {failed && (
                      <div
                        role="alert"
                        className="mt-4 flex flex-col gap-3 rounded-[max(var(--iu-radius),18px)] border border-red-600/30 bg-red-600/6 p-4 @md:flex-row @md:items-center dark:border-red-400/30 dark:bg-red-400/8"
                      >
                        <TriangleAlert
                          size={20}
                          strokeWidth={1.75}
                          aria-hidden="true"
                          className="shrink-0 text-red-700 dark:text-red-400"
                        />
                        <p className="flex-1 text-[14px] leading-snug text-pretty">{errorMessage}</p>
                        <button
                          type="button"
                          onClick={() => retry(message.id)}
                          className={cx(
                            "inline-flex h-10 shrink-0 cursor-pointer items-center justify-center gap-2 self-start rounded-full bg-(--iu-accent) px-4 text-[14px] font-semibold text-(--iu-accent-foreground) shadow-(--wr-sh-btn) transition-[scale,box-shadow] duration-150 active:scale-[0.97] active:shadow-(--wr-sh-pressed) motion-reduce:transition-none @md:self-auto",
                            FOCUS,
                          )}
                        >
                          <RotateCcw size={16} strokeWidth={1.75} aria-hidden="true" />
                          Retry
                        </button>
                      </div>
                    )}
                    {(done || stoppedAt !== undefined) && (
                      <div className="mt-3 -ml-3 flex flex-wrap items-center gap-1">
                        <button type="button" onClick={() => copy(message)} className={SOFT_BUTTON}>
                          {copiedId === message.id ? (
                            <Check size={16} strokeWidth={1.75} aria-hidden="true" />
                          ) : (
                            <Copy size={16} strokeWidth={1.5} aria-hidden="true" />
                          )}
                          {copiedId === message.id ? "Copied" : "Copy"}
                        </button>
                        <button type="button" onClick={() => retry(message.id)} className={SOFT_BUTTON}>
                          <RotateCcw size={16} strokeWidth={1.5} aria-hidden="true" />
                          Retry
                        </button>
                        <span className="ml-2 text-[12px] text-(--iu-muted) tabular-nums">
                          {message.model} · {message.tokens.toLocaleString("en-US")} tokens · {message.time}
                        </span>
                      </div>
                    )}
                  </div>
                </article>
              );
            })
          )}
        </div>

        <form
          className="px-3 pb-3 @md:px-5 @md:pb-5"
          onSubmit={(event) => {
            event.preventDefault();
            send();
          }}
        >
          <div className="rounded-[max(calc(var(--iu-radius)+8px),22px)] border border-(--wr-line) bg-(--wr-well) p-2 shadow-(--wr-sh-well) transition-[border-color,box-shadow] duration-200 focus-within:border-(--iu-accent) motion-reduce:transition-none">
            {attachments.length > 0 && (
              <ul className="flex flex-wrap gap-1.5 px-1 pt-1 pb-2" aria-label="Attachments">
                {attachments.map((file, index) => (
                  <li
                    key={file.id}
                    className="inline-flex items-center gap-2 rounded-full border border-(--iu-border) bg-(--iu-surface) py-0.5 pr-0.5 pl-3 text-[12px] shadow-(--wr-sh-raised) dark:border-(--iu-foreground)/10"
                  >
                    <FileText size={13} strokeWidth={1.75} aria-hidden="true" className="text-(--iu-muted)" />
                    <span className="max-w-[160px] truncate font-medium">{file.name}</span>
                    <span className="text-(--iu-muted) tabular-nums">{file.size}</span>
                    <button
                      ref={(node) => {
                        chipRefs.current[index] = node;
                      }}
                      type="button"
                      aria-label={`Remove ${file.name}`}
                      onClick={() => removeAttachment(index)}
                      className={cx(
                        "inline-flex size-7 cursor-pointer items-center justify-center rounded-full text-(--iu-muted) pointer-coarse:size-10 pointer-fine:hover:bg-(--wr-well) pointer-fine:hover:text-(--iu-foreground)",
                        FOCUS,
                      )}
                    >
                      <X size={14} strokeWidth={1.75} aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <label htmlFor={draftId} className="sr-only">
              Message {assistantName}
            </label>
            <textarea
              ref={inputRef}
              id={draftId}
              rows={2}
              value={draft}
              placeholder={`Ask ${assistantName} about your trip`}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                  event.preventDefault();
                  send();
                }
              }}
              className="block w-full resize-none bg-transparent px-2 py-[calc(8px*var(--iu-density))] text-[15px] leading-[1.5] text-(--iu-foreground) outline-none placeholder:text-(--iu-muted)"
            />
            <div className="flex items-center gap-2 pt-1">
              <input
                ref={fileRef}
                type="file"
                multiple
                aria-label="Attach files"
                className="sr-only"
                tabIndex={-1}
                onChange={onFiles}
              />
              <button
                type="button"
                aria-label="Attach files"
                onClick={() => fileRef.current?.click()}
                className={cx(
                  "inline-flex size-9 cursor-pointer items-center justify-center rounded-full border border-(--iu-border) bg-(--iu-surface) text-(--iu-foreground) shadow-(--wr-sh-raised) transition-[scale,box-shadow] duration-150 active:scale-[0.95] active:shadow-(--wr-sh-pressed) motion-reduce:transition-none dark:border-(--iu-foreground)/10 pointer-coarse:size-10",
                  FOCUS,
                )}
              >
                <Paperclip size={16} strokeWidth={1.5} aria-hidden="true" />
              </button>
              <ModelPicker
                models={models}
                value={modelId}
                disabled={isStreaming}
                onChange={(id) => {
                  setModelId(id);
                  onModelChange?.(id);
                }}
              />
              <span className="ml-auto hidden text-[12px] text-(--iu-muted) @md:inline">
                {isStreaming ? "Esc to stop" : "Enter to send · Shift+Enter for a new line"}
              </span>
              <span className="relative ml-auto inline-flex size-10 shrink-0 @md:ml-1">
                {isStreaming && <StopRing progress={ratio} />}
                <AnimatePresence initial={false} mode="popLayout">
                  {isStreaming ? (
                    <motion.button
                      key="stop"
                      type="button"
                      aria-label="Stop generating"
                      onClick={stop}
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.6, opacity: 0 }}
                      whileTap={{ scale: 0.92 }}
                      className={cx(
                        "inline-flex size-10 cursor-pointer items-center justify-center rounded-full bg-(--iu-surface) text-(--iu-foreground) shadow-(--wr-sh-raised)",
                        FOCUS,
                      )}
                    >
                      <Square size={14} strokeWidth={2} aria-hidden="true" className="fill-current" />
                    </motion.button>
                  ) : (
                    <motion.button
                      key="send"
                      type="submit"
                      aria-label="Send message"
                      disabled={!hasDraft}
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.6, opacity: 0 }}
                      whileTap={hasDraft ? { scale: 0.92 } : undefined}
                      className={cx(
                        "inline-flex size-10 cursor-pointer items-center justify-center rounded-full bg-(--iu-accent) text-(--iu-accent-foreground) shadow-(--wr-sh-btn) disabled:cursor-not-allowed disabled:bg-(--iu-foreground)/10 disabled:text-(--iu-muted) disabled:shadow-none",
                        FOCUS,
                      )}
                    >
                      <ArrowUp size={18} strokeWidth={2} aria-hidden="true" />
                    </motion.button>
                  )}
                </AnimatePresence>
              </span>
            </div>
          </div>
          <p className="mt-2 px-2 text-center text-[11px] text-(--iu-muted)">
            {assistantName} can get prices wrong. Check the booking page before you pay.
          </p>
        </form>

        <p aria-live="polite" className="sr-only">
          {isStreaming ? `${assistantName} is replying` : announcement}
        </p>
      </section>
    </MotionConfig>
  );
}

export default WrenAssistantChat;
