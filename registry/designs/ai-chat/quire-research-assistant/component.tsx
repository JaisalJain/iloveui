"use client";

import { Fragment, useEffect, useId, useRef, useState, type ChangeEvent, type KeyboardEvent } from "react";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "motion/react";
import { ArrowRight, ArrowUpRight, Check, ChevronDown, Copy, Paperclip, RotateCcw, Square, X } from "lucide-react";

export type QuireSource = {
  n: number;
  title: string;
  publisher: string;
  year: number;
  kind: "Study" | "Report" | "Analysis" | "Methods note";
  /** The exact passage the answer relies on. */
  passage: string;
  locator: string;
  domain: string;
};

export type QuireSentence = { text: string; cites?: number[] };

export type QuireBlock =
  | { type: "lead"; sentences: QuireSentence[] }
  | { type: "paragraph"; sentences: QuireSentence[] }
  | {
      type: "figure";
      label: string;
      caption: string;
      from: { value: number; label: string };
      to: { value: number; label: string };
      cite: number;
    };

export type QuireQuery = { query: string; results: number; read: number };

export type QuireAttachment = { id: string; name: string; size: string };

export type QuireModel = { id: string; name: string; description: string };

export type QuireResearchAssistantProps = {
  desk?: string;
  question?: string;
  askedBy?: string;
  askedAt?: string;
  questionAttachments?: QuireAttachment[];
  queries?: QuireQuery[];
  searchSeconds?: number;
  blocks?: QuireBlock[];
  sources?: QuireSource[];
  /** "streaming" writes the answer word by word; "error" cuts it off with a retry note. */
  status?: "idle" | "streaming" | "error";
  /** Where the streaming (or failed) answer starts, from 0 to 1 of its length. */
  streamFrom?: number;
  errorMessage?: string;
  models?: QuireModel[];
  defaultModelId?: string;
  attachments?: QuireAttachment[];
  credits?: { used: number; limit: number };
  answerMeta?: string;
  /** Citation opened on first render, showing its sentence underlined and its passage in the sources column. */
  defaultActiveCitation?: number | null;
  onSend?: (message: { text: string; attachments: QuireAttachment[]; modelId: string }) => void;
  onStop?: () => void;
  onRetry?: () => void;
  onCopy?: (text: string) => void;
  onModelChange?: (modelId: string) => void;
  onAttach?: (files: File[]) => void;
  onOpenSource?: (source: QuireSource) => void;
  onStreamEnd?: () => void;
  className?: string;
};

export const QUIRE_SOURCES: QuireSource[] = [
  {
    n: 1,
    title: "Four days, same pay: results from 48 firms",
    publisher: "Halvard Institute for Work",
    year: 2025,
    kind: "Report",
    passage: "Self-reported burnout fell from 41% to 29% of staff between the first and sixth month of the pilot.",
    locator: "p. 14",
    domain: "halvard.org",
  },
  {
    n: 2,
    title: "Who kept the fourth day?",
    publisher: "Journal of Organisational Health, 18(2)",
    year: 2026,
    kind: "Study",
    passage: "Of the 48 firms, 43 kept the schedule after twelve months; five reverted, most citing client coverage.",
    locator: "Table 3",
    domain: "joh-journal.org",
  },
  {
    n: 3,
    title: "Shorter weeks and sick days in small firms",
    publisher: "Corran Economic Review",
    year: 2025,
    kind: "Study",
    passage: "Sick days dropped by 22% on average, with the largest falls in teams of fewer than 20 people.",
    locator: "§4.2",
    domain: "corran-review.ie",
  },
  {
    n: 4,
    title: "The hidden overtime of compressed weeks",
    publisher: "The Fulmar Post",
    year: 2025,
    kind: "Analysis",
    passage: "A third of the managers we spoke to said they now answer email on the day off, most of them every week.",
    locator: "para. 9",
    domain: "fulmarpost.com",
  },
  {
    n: 5,
    title: "Measuring burnout in the 2025 pilot",
    publisher: "Halvard Institute for Work",
    year: 2025,
    kind: "Methods note",
    passage:
      "Burnout was measured with the 16-item Oldenburg inventory at months 0, 3 and 6, not a single survey item.",
    locator: "p. 3",
    domain: "halvard.org",
  },
];

export const QUIRE_BLOCKS: QuireBlock[] = [
  {
    type: "lead",
    sentences: [{ text: "Mostly yes, though the effect is smaller and less even than the headlines suggest." }],
  },
  {
    type: "paragraph",
    sentences: [
      {
        text: "In the largest 2025 pilot, the share of staff reporting burnout fell from 41% to 29% over six months,",
        cites: [1],
      },
      { text: "measured with a standard 16-item inventory rather than a single survey question.", cites: [5] },
    ],
  },
  {
    type: "figure",
    label: "Fig. 1",
    caption: "Staff reporting burnout, 48 firms",
    from: { value: 41, label: "Month 0" },
    to: { value: 29, label: "Month 6" },
    cite: 1,
  },
  {
    type: "paragraph",
    sentences: [
      { text: "Sick days fell too, by about 22% on average, with the biggest drops in small teams.", cites: [3] },
      { text: "Most firms kept the schedule: 43 of 48 were still on it a year later.", cites: [2] },
    ],
  },
  {
    type: "paragraph",
    sentences: [
      { text: "The caveat is unpaid spillover. A third of managers say they answer email on the day off,", cites: [4] },
      { text: "so the gain is real for most staff but thinner for the people running the teams." },
    ],
  },
];

export const QUIRE_QUERIES: QuireQuery[] = [
  { query: "four-day week pilot 2025 burnout results", results: 12, read: 4 },
  { query: "four-day week retention after 12 months", results: 7, read: 2 },
  { query: "compressed hours sick leave small firms", results: 8, read: 2 },
  { query: "four-day week managers overtime", results: 4, read: 1 },
];

export const QUIRE_MODELS: QuireModel[] = [
  { id: "scholar", name: "Scholar", description: "Reads every source it cites. About 30 seconds." },
  { id: "brief", name: "Brief", description: "Three sources, two paragraphs. About 8 seconds." },
  { id: "survey", name: "Survey", description: "Up to 60 sources with a comparison table." },
];

const FIGURE_UNITS = 14;
const TICK_MS = 70;
/** The cited-sentence rule: an accent line that draws left to right under every line of the sentence. */
const HIGHLIGHT =
  "bg-[linear-gradient(var(--iu-accent),var(--iu-accent))] box-decoration-clone bg-[length:0%_2px] bg-bottom-left bg-no-repeat pb-0.5 transition-[background-size] duration-[400ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] data-active:bg-[length:100%_2px] motion-reduce:transition-none";
const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--iu-accent)";
const SQUARE = "rounded-[min(var(--iu-radius),2px)]";
const KICKER = "text-[11px] font-medium tracking-[0.14em] text-(--iu-muted) uppercase";
const TEXT_BUTTON = `inline-flex h-8 cursor-pointer items-center gap-1.5 px-1 text-[13px] text-(--iu-muted) underline-offset-4 transition-colors duration-200 motion-reduce:transition-none pointer-coarse:h-10 pointer-fine:hover:text-(--iu-foreground) pointer-fine:hover:underline ${FOCUS}`;

function cx(...values: (string | false | null | undefined)[]) {
  return values.filter(Boolean).join(" ");
}

function wordCount(text: string) {
  return text.split(" ").length;
}

function blockUnits(block: QuireBlock) {
  if (block.type === "figure") return FIGURE_UNITS;
  return block.sentences.reduce((sum, sentence) => sum + wordCount(sentence.text), 0);
}

function totalUnits(blocks: QuireBlock[]) {
  return blocks.reduce((sum, block) => sum + blockUnits(block), 0);
}

/** Which sources have been cited by fully written sentences (or figures) up to `limit`. */
function citedUpTo(blocks: QuireBlock[], limit: number) {
  const cited = new Set<number>();
  let cursor = 0;
  for (const block of blocks) {
    if (block.type === "figure") {
      cursor += FIGURE_UNITS;
      if (cursor <= limit) cited.add(block.cite);
      continue;
    }
    for (const sentence of block.sentences) {
      cursor += wordCount(sentence.text);
      if (cursor <= limit) for (const n of sentence.cites ?? []) cited.add(n);
    }
  }
  return cited;
}

function plainAnswer(question: string, blocks: QuireBlock[], sources: QuireSource[]) {
  const body = blocks
    .map((block) => {
      if (block.type === "figure")
        return `${block.label}. ${block.caption}: ${block.from.value}% to ${block.to.value}% [${block.cite}]`;
      return block.sentences
        .map((sentence) => `${sentence.text}${(sentence.cites ?? []).map((n) => ` [${n}]`).join("")}`)
        .join(" ");
    })
    .join("\n\n");
  const notes = sources.map((s) => `[${s.n}] ${s.title}. ${s.publisher}, ${s.year}. ${s.domain}`).join("\n");
  return `${question}\n\n${body}\n\nSources\n${notes}`;
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

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function Caret() {
  return <span aria-hidden="true" className="ml-1 inline-block h-[1em] w-px translate-y-[0.12em] bg-(--iu-accent)" />;
}

function CitationButton({
  source,
  active,
  onToggle,
  controls,
}: {
  source: QuireSource | undefined;
  active: boolean;
  onToggle: () => void;
  controls: string;
}) {
  if (!source) return null;
  return (
    <button
      type="button"
      aria-expanded={active}
      aria-controls={controls}
      aria-label={`Source ${source.n}: ${source.title}`}
      onClick={onToggle}
      className={cx(
        "mx-0.5 inline-flex h-6 min-w-6 -translate-y-[0.35em] cursor-pointer items-center justify-center border px-1 align-baseline font-mono text-[11px] leading-none not-italic tabular-nums transition-colors duration-200 motion-reduce:transition-none",
        SQUARE,
        active
          ? "border-(--iu-foreground) bg-(--iu-foreground) text-(--iu-background)"
          : "border-(--iu-foreground)/35 text-(--iu-foreground) pointer-fine:hover:border-(--iu-foreground)",
        FOCUS,
      )}
    >
      {source.n}
    </button>
  );
}

function SlopeFigure({ block, active }: { block: Extract<QuireBlock, { type: "figure" }>; active: boolean }) {
  const top = 18;
  const bottom = 92;
  const max = Math.max(block.from.value, block.to.value) * 1.15;
  const y = (value: number) => bottom - (value / max) * (bottom - top);
  return (
    <figure className="my-2 grid grid-cols-1 gap-x-8 gap-y-4 border-y border-(--iu-border) py-6 @lg:grid-cols-[auto_1fr] @lg:items-center">
      <div className="flex items-baseline gap-3">
        <span className="font-serif text-[56px] leading-none tracking-[-0.02em] tabular-nums @lg:text-[72px]">
          {block.from.value}
          <span className="text-[0.5em]">%</span>
        </span>
        <ArrowRight size={24} strokeWidth={1} aria-hidden="true" className="self-center text-(--iu-muted)" />
        <span className="font-serif text-[56px] leading-none tracking-[-0.02em] text-(--iu-accent) tabular-nums @lg:text-[72px]">
          {block.to.value}
          <span className="text-[0.5em]">%</span>
        </span>
      </div>
      <svg
        viewBox="0 0 240 110"
        className="h-auto w-full max-w-[320px]"
        role="img"
        aria-label={`${block.caption}: ${block.from.value}% at ${block.from.label}, ${block.to.value}% at ${block.to.label}`}
      >
        <line x1="20" x2="220" y1={bottom} y2={bottom} stroke="var(--iu-border)" strokeWidth="1" />
        <line
          x1="20"
          x2="20"
          y1={top - 8}
          y2={bottom}
          stroke="var(--iu-border)"
          strokeWidth="1"
          strokeDasharray="2 3"
        />
        <line
          x1="220"
          x2="220"
          y1={top - 8}
          y2={bottom}
          stroke="var(--iu-border)"
          strokeWidth="1"
          strokeDasharray="2 3"
        />
        <motion.line
          x1="20"
          y1={y(block.from.value)}
          x2="220"
          y2={y(block.to.value)}
          stroke="var(--iu-foreground)"
          strokeWidth={active ? 2 : 1.25}
          initial={false}
        />
        <circle cx="20" cy={y(block.from.value)} r="3.5" fill="var(--iu-foreground)" />
        <circle cx="220" cy={y(block.to.value)} r="4.5" fill="var(--iu-accent)" />
        <text x="20" y="106" textAnchor="start" className="fill-(--iu-muted) font-mono text-[10px]">
          {block.from.label}
        </text>
        <text x="220" y="106" textAnchor="end" className="fill-(--iu-muted) font-mono text-[10px]">
          {block.to.label}
        </text>
      </svg>
      <figcaption className="font-mono text-[11px] text-(--iu-muted) @lg:col-span-2">
        {block.label} · {block.caption} · source [{block.cite}]
      </figcaption>
    </figure>
  );
}

/** Walks the blocks once, revealing words up to `progress`. */
function renderAnswer({
  blocks,
  sources,
  progress,
  writing,
  activeCite,
  sourceId,
  toggleCite,
}: {
  blocks: QuireBlock[];
  sources: QuireSource[];
  progress: number;
  writing: boolean;
  activeCite: number | null;
  sourceId: (n: number) => string;
  toggleCite: (n: number) => void;
}) {
  let cursor = 0;
  let caretPlaced = false;
  return blocks.map((block, blockIndex) => {
    if (cursor >= progress) {
      cursor += blockUnits(block);
      return null;
    }
    if (block.type === "figure") {
      cursor += FIGURE_UNITS;
      if (cursor > progress) return null;
      return (
        <motion.div key={blockIndex} initial={false} animate={{ opacity: 1 }}>
          <SlopeFigure block={block} active={activeCite === block.cite} />
        </motion.div>
      );
    }
    const sentences = block.sentences.map((sentence, sentenceIndex) => {
      const words = sentence.text.split(" ");
      const visible = Math.max(0, Math.min(words.length, progress - cursor));
      cursor += words.length;
      if (visible === 0) return null;
      const complete = visible === words.length;
      const isActive = complete && activeCite !== null && (sentence.cites ?? []).includes(activeCite);
      const caret = writing && !complete && !caretPlaced;
      if (caret) caretPlaced = true;
      return (
        <Fragment key={sentenceIndex}>
          {sentenceIndex > 0 && " "}
          {visible > 1 && (
            <span data-active={isActive || undefined} className={HIGHLIGHT}>
              {words.slice(0, visible - 1).join(" ")}{" "}
            </span>
          )}
          <span className="whitespace-nowrap">
            <span data-active={isActive || undefined} className={HIGHLIGHT}>
              {words[visible - 1]}
            </span>
            {complete &&
              (sentence.cites ?? []).map((n) => (
                <CitationButton
                  key={n}
                  source={sources.find((source) => source.n === n)}
                  active={activeCite === n}
                  controls={sourceId(n)}
                  onToggle={() => toggleCite(n)}
                />
              ))}
            {caret && <Caret />}
          </span>
        </Fragment>
      );
    });
    if (block.type === "lead") {
      return (
        <p
          key={blockIndex}
          className="font-serif text-[26px] leading-[1.25] tracking-[-0.01em] text-balance @lg:text-[30px]"
        >
          {sentences}
        </p>
      );
    }
    return (
      <p key={blockIndex} className="text-[16px] leading-[1.7] text-pretty @lg:text-[17px]">
        {sentences}
      </p>
    );
  });
}

function ModelPicker({
  models,
  value,
  onChange,
  disabled,
}: {
  models: QuireModel[];
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
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            openList();
          }
        }}
        className={cx(
          "inline-flex h-8 cursor-pointer items-center gap-1 px-1 text-[13px] text-(--iu-foreground) disabled:cursor-not-allowed disabled:opacity-60 pointer-coarse:h-10",
          FOCUS,
        )}
      >
        <span className="text-(--iu-muted)">Depth</span>
        <span className="font-serif text-[16px] italic">{selected?.name}</span>
        <ChevronDown size={14} strokeWidth={1.5} aria-hidden="true" className="text-(--iu-muted)" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            ref={listRef}
            id={listId}
            role="listbox"
            tabIndex={-1}
            aria-label="Research depth"
            aria-activedescendant={`${listId}-${active}`}
            onKeyDown={onListKey}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className={cx(
              "absolute bottom-full left-0 z-30 mb-2 w-[min(300px,calc(100vw-48px))] border border-(--iu-foreground)/25 bg-(--iu-surface) py-1 outline-none",
              SQUARE,
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
                  "flex cursor-pointer items-start gap-3 border-l-2 px-3 py-2.5",
                  index === active ? "border-(--iu-accent) bg-(--iu-foreground)/5" : "border-transparent",
                )}
              >
                <span className="min-w-0 flex-1">
                  <span className="block font-serif text-[18px] leading-tight italic">{model.name}</span>
                  <span className="mt-0.5 block text-[12px] leading-snug text-(--iu-muted)">{model.description}</span>
                </span>
                <Check
                  size={16}
                  strokeWidth={1.5}
                  aria-hidden="true"
                  className={cx("mt-1 shrink-0", model.id === value ? "opacity-100" : "opacity-0")}
                />
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

export function QuireResearchAssistant({
  desk = "Quire research desk",
  question = "Did the 2025 four-day week pilots actually reduce burnout?",
  askedBy = "Hana Sato",
  askedAt = "Tue 14 Oct 2025, 10:12",
  questionAttachments = [{ id: "qa1", name: "people-survey-q3.pdf", size: "412 KB" }],
  queries = QUIRE_QUERIES,
  searchSeconds = 6.2,
  blocks = QUIRE_BLOCKS,
  sources = QUIRE_SOURCES,
  status = "idle",
  streamFrom = 0,
  errorMessage = "The Corran Economic Review archive timed out, so I stopped before citing anything I had not read.",
  models = QUIRE_MODELS,
  defaultModelId = "scholar",
  attachments: initialAttachments = [],
  credits = { used: 38, limit: 120 },
  answerMeta = "Scholar · 1,284 tokens · 6 credits",
  defaultActiveCitation = 1,
  onSend,
  onStop,
  onRetry,
  onCopy,
  onModelChange,
  onAttach,
  onOpenSource,
  onStreamEnd,
  className = "",
}: QuireResearchAssistantProps) {
  const reduceMotion = useReducedMotion();
  const ids = useId();
  const rootRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const visibleRef = useRef(true);
  const endedRef = useRef(false);

  const total = totalUnits(blocks);
  const startUnits = Math.round(streamFrom * total);
  const [run, setRun] = useState<{ key: string; value: number } | null>(null);
  const [stoppedAt, setStoppedAt] = useState<number | null>(null);
  const [activeCite, setActiveCite] = useState<number | null>(defaultActiveCitation);
  const [traceOpen, setTraceOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [attachments, setAttachments] = useState(initialAttachments);
  const [modelId, setModelId] = useState(defaultModelId);
  const [copied, setCopied] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [spent, setSpent] = useState(0);

  const runKey = `${status}-${streamFrom}-${total}`;
  const streaming = status === "streaming" && stoppedAt === null;
  const progress = streaming
    ? run?.key === runKey
      ? run.value
      : reduceMotion && startUnits === 0
        ? total
        : startUnits
    : status === "error"
      ? startUnits
      : (stoppedAt ?? total);
  const writing = streaming && progress < total;
  const cited = citedUpTo(blocks, progress);
  const shownSources = sources.filter((source) => cited.has(source.n));

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
    if (!streaming || reduceMotion) return;
    endedRef.current = false;
    const timer = window.setInterval(() => {
      if (!visibleRef.current) return;
      setRun((current) => ({
        key: runKey,
        value: Math.min(total, (current?.key === runKey ? current.value : startUnits) + 1),
      }));
    }, TICK_MS);
    return () => window.clearInterval(timer);
  }, [streaming, reduceMotion, runKey, total, startUnits]);

  useEffect(() => {
    if (!streaming || progress < total || endedRef.current) return;
    endedRef.current = true;
    setSpent((value) => value + 6);
    onStreamEnd?.();
  }, [streaming, progress, total, onStreamEnd]);

  const stop = () => {
    if (!writing) return;
    setStoppedAt(progress);
    setAnnouncement("Stopped writing");
    onStop?.();
    inputRef.current?.focus();
  };

  const retry = () => {
    setStoppedAt(null);
    setRun(null);
    setActiveCite(null);
    onRetry?.();
  };

  const send = () => {
    const text = draft.trim();
    if (!text || writing) return;
    onSend?.({ text, attachments, modelId });
    setDraft("");
    setAttachments([]);
    setStoppedAt(null);
    setRun(null);
  };

  const toggleCite = (n: number) => {
    setActiveCite((current) => (current === n ? null : n));
    const source = sources.find((item) => item.n === n);
    if (source) setAnnouncement(activeCite === n ? "" : `Showing source ${n}, ${source.publisher}`);
  };

  const onFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;
    setAttachments((list) => [
      ...list,
      ...files.map((file, index) => ({
        id: `${file.name}-${index}-${list.length}`,
        name: file.name,
        size: formatBytes(file.size),
      })),
    ]);
    setAnnouncement(`Attached ${files.map((file) => file.name).join(", ")}`);
    onAttach?.(files);
    event.target.value = "";
  };

  const copy = async () => {
    const text = plainAnswer(question, blocks, sources);
    if (!(await copyText(text))) return;
    setCopied(true);
    setAnnouncement("Answer copied with its sources");
    onCopy?.(text);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const used = Math.min(credits.limit, credits.used + spent);
  const sourceId = (n: number) => `${ids}-source-${n}`;
  const failed = status === "error";
  const done = !failed && progress >= total;

  const rendered = renderAnswer({
    blocks,
    sources,
    progress,
    writing,
    activeCite,
    sourceId,
    toggleCite,
  });

  const writtenSentences = Math.min(
    blocks
      .flatMap((block) => (block.type === "figure" ? [FIGURE_UNITS] : block.sentences.map((s) => wordCount(s.text))))
      .reduce(
        (acc, units) => {
          acc.sum += units;
          if (acc.sum <= progress) acc.count += 1;
          return acc;
        },
        { sum: 0, count: 0 },
      ).count,
    99,
  );
  const totalSentences = blocks.reduce((sum, block) => sum + (block.type === "figure" ? 1 : block.sentences.length), 0);

  return (
    <MotionConfig
      reducedMotion="user"
      transition={reduceMotion ? { duration: 0 } : { duration: 0.32, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <section
        ref={rootRef}
        aria-label={`${desk}: ${question}`}
        onKeyDown={(event) => {
          if (event.key === "Escape" && writing) stop();
        }}
        className={cx(
          "@container w-full border border-(--iu-border) bg-(--iu-surface) font-(family-name:--iu-font) text-(--iu-foreground) dark:border-(--iu-foreground)/12",
          SQUARE,
          className,
        )}
      >
        <header className="flex items-center justify-between gap-4 border-b-[3px] border-double border-(--iu-foreground)/40 px-5 py-3 @lg:px-8">
          <span className={KICKER}>{desk}</span>
          <div
            role="meter"
            aria-label="Research credits"
            aria-valuemin={0}
            aria-valuemax={credits.limit}
            aria-valuenow={used}
            aria-valuetext={`${used} of ${credits.limit} research credits used this month`}
            className="flex items-center gap-3"
          >
            <span className="font-mono text-[11px] text-(--iu-muted) tabular-nums">
              <span className="hidden @md:inline">Credits </span>
              <span className="text-(--iu-foreground)">{used}</span> / {credits.limit}
            </span>
            <span aria-hidden="true" className="relative block h-px w-16 bg-(--iu-foreground)/25 @md:w-24">
              <motion.span
                className="absolute inset-y-[-1px] left-0 block bg-(--iu-accent)"
                initial={false}
                animate={{ width: `${(used / credits.limit) * 100}%` }}
              />
            </span>
          </div>
        </header>

        <div className="grid grid-cols-1 @4xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 px-5 pt-8 pb-6 @lg:px-10 @lg:pt-12 @4xl:border-r @4xl:border-(--iu-border)">
            <p className="font-mono text-[11px] text-(--iu-muted)">
              Asked by {askedBy} · {askedAt}
            </p>
            <h2 className="mt-3 max-w-[22ch] font-serif text-[34px] leading-[1.05] tracking-[-0.02em] text-balance italic @lg:text-[48px]">
              {question}
            </h2>
            {questionAttachments.length > 0 && (
              <p className="mt-4 font-mono text-[11px] text-(--iu-muted)">
                With {questionAttachments.map((file) => `${file.name} (${file.size})`).join(", ")}
              </p>
            )}

            <div className="mt-8 border-y border-(--iu-border)">
              <button
                type="button"
                aria-expanded={traceOpen}
                aria-controls={`${ids}-trace`}
                onClick={() => setTraceOpen((value) => !value)}
                className={cx("flex min-h-11 w-full cursor-pointer items-center gap-3 py-2 text-left", FOCUS)}
              >
                <span className={cx(KICKER, "shrink-0")}>Method</span>
                <span className="min-w-0 flex-1 truncate text-[14px]">
                  Searched {queries.length} queries, read {queries.reduce((sum, q) => sum + q.read, 0)} of{" "}
                  {queries.reduce((sum, q) => sum + q.results, 0)} sources
                </span>
                <span className="hidden font-mono text-[11px] text-(--iu-muted) tabular-nums @md:inline">
                  {searchSeconds.toFixed(1)} s
                </span>
                <ChevronDown
                  size={16}
                  strokeWidth={1.5}
                  aria-hidden="true"
                  className={cx(
                    "shrink-0 text-(--iu-muted) transition-transform duration-300 motion-reduce:transition-none",
                    traceOpen && "rotate-180",
                  )}
                />
              </button>
              <AnimatePresence initial={false}>
                {traceOpen && (
                  <motion.div
                    id={`${ids}-trace`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <ol className="border-t border-dashed border-(--iu-border) pt-3 pb-4">
                      {queries.map((query, index) => (
                        <li
                          key={query.query}
                          className="grid grid-cols-[28px_minmax(0,1fr)_auto] items-baseline gap-2 py-1.5"
                        >
                          <span className="font-mono text-[11px] text-(--iu-muted) tabular-nums">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <span className="font-mono text-[12px] break-words">{query.query}</span>
                          <span className="font-mono text-[11px] text-(--iu-muted) tabular-nums">
                            {query.read}/{query.results} read
                          </span>
                        </li>
                      ))}
                    </ol>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div aria-busy={writing} className="mt-8 flex max-w-[64ch] flex-col gap-5">
              {rendered}
              {progress === 0 && writing && (
                <p className="font-mono text-[12px] text-(--iu-muted)">
                  Reading sources
                  <Caret />
                </p>
              )}
            </div>

            {failed && (
              <div role="alert" className="mt-6 max-w-[64ch] border-l-2 border-red-700 py-1 pl-4 dark:border-red-400">
                <p className={cx(KICKER, "text-red-700 dark:text-red-400")}>Answer incomplete</p>
                <p className="mt-1 text-[15px] leading-[1.6] text-pretty">{errorMessage}</p>
                <button
                  type="button"
                  onClick={retry}
                  className={cx(TEXT_BUTTON, "mt-1 -ml-1 text-(--iu-foreground) underline")}
                >
                  <RotateCcw size={16} strokeWidth={1.5} aria-hidden="true" />
                  Retry the search
                </button>
              </div>
            )}

            {stoppedAt !== null && !done && (
              <p className="mt-6 font-mono text-[12px] text-(--iu-muted)">
                Stopped after {writtenSentences} of {totalSentences} sentences. Sources below are the ones already
                cited.
              </p>
            )}

            {(done || stoppedAt !== null) && (
              <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-(--iu-border) pt-3">
                <button type="button" onClick={copy} className={TEXT_BUTTON}>
                  {copied ? (
                    <Check size={16} strokeWidth={1.5} aria-hidden="true" />
                  ) : (
                    <Copy size={16} strokeWidth={1.5} aria-hidden="true" />
                  )}
                  {copied ? "Copied with sources" : "Copy with sources"}
                </button>
                <button type="button" onClick={retry} className={TEXT_BUTTON}>
                  <RotateCcw size={16} strokeWidth={1.5} aria-hidden="true" />
                  Retry
                </button>
                <span className="ml-auto font-mono text-[11px] text-(--iu-muted) tabular-nums">{answerMeta}</span>
              </div>
            )}
          </div>

          <aside
            aria-label="Sources"
            className="border-t border-(--iu-border) px-5 pt-6 pb-6 @lg:px-10 @4xl:border-t-0 @4xl:px-6 @4xl:pt-12"
          >
            <div className="flex items-baseline justify-between gap-3 border-b border-(--iu-foreground)/40 pb-2">
              <h3 className={KICKER}>Sources</h3>
              <span className="font-mono text-[11px] text-(--iu-muted) tabular-nums">{shownSources.length} cited</span>
            </div>
            {shownSources.length === 0 ? (
              <p className="py-4 text-[14px] text-(--iu-muted)">Sources appear here as the answer cites them.</p>
            ) : (
              <ol>
                <AnimatePresence initial={false}>
                  {shownSources.map((source) => {
                    const isActive = activeCite === source.n;
                    return (
                      <motion.li
                        key={source.n}
                        id={sourceId(source.n)}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="border-b border-(--iu-border)"
                      >
                        <button
                          type="button"
                          aria-expanded={isActive}
                          onClick={() => toggleCite(source.n)}
                          className={cx(
                            "grid w-full cursor-pointer grid-cols-[28px_minmax(0,1fr)] gap-x-2 py-[calc(14px*var(--iu-density))] text-left",
                            FOCUS,
                          )}
                        >
                          <span
                            className={cx(
                              "font-serif text-[22px] leading-none tabular-nums",
                              isActive ? "text-(--iu-accent)" : "text-(--iu-muted)",
                            )}
                          >
                            {source.n}
                          </span>
                          <span>
                            <span className="block font-serif text-[18px] leading-[1.2] text-pretty">
                              {source.title}
                            </span>
                            <span className="mt-1 block font-mono text-[11px] text-(--iu-muted)">
                              {source.publisher} · {source.year} · {source.kind}
                            </span>
                          </span>
                        </button>
                        <AnimatePresence initial={false}>
                          {isActive && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <blockquote className="mb-4 ml-[36px] border-l-2 border-(--iu-accent) pl-3">
                                <p className="font-serif text-[17px] leading-[1.4] italic">“{source.passage}”</p>
                                <footer className="mt-2 flex items-center justify-between gap-2 font-mono text-[11px] text-(--iu-muted)">
                                  <span>
                                    {source.domain} · {source.locator}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => onOpenSource?.(source)}
                                    className={cx(
                                      "inline-flex h-6 cursor-pointer items-center gap-1 text-(--iu-foreground) underline underline-offset-4 pointer-coarse:h-10",
                                      FOCUS,
                                    )}
                                  >
                                    Open
                                    <ArrowUpRight size={12} strokeWidth={1.5} aria-hidden="true" />
                                  </button>
                                </footer>
                              </blockquote>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.li>
                    );
                  })}
                </AnimatePresence>
              </ol>
            )}
          </aside>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            send();
          }}
          className="border-t-[3px] border-double border-(--iu-foreground)/40 px-5 py-4 @lg:px-10"
        >
          <label htmlFor={`${ids}-draft`} className={KICKER}>
            Follow-up
          </label>
          <textarea
            ref={inputRef}
            id={`${ids}-draft`}
            rows={2}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                event.preventDefault();
                send();
              }
            }}
            placeholder="Ask about methods, a source or a counter-argument"
            className="mt-2 block w-full resize-none border-b border-(--iu-foreground)/35 bg-transparent pb-2 font-serif text-[20px] leading-[1.35] text-(--iu-foreground) outline-none placeholder:text-(--iu-muted) focus:border-(--iu-accent)"
          />
          {attachments.length > 0 && (
            <ul aria-label="Attachments" className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
              {attachments.map((file) => (
                <li key={file.id} className="inline-flex items-center gap-1 font-mono text-[11px]">
                  <span>{file.name}</span>
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
                      FOCUS,
                    )}
                  >
                    <X size={12} strokeWidth={1.5} aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
            <input
              ref={fileRef}
              type="file"
              multiple
              aria-label="Attach documents"
              tabIndex={-1}
              className="sr-only"
              onChange={onFiles}
            />
            <button type="button" onClick={() => fileRef.current?.click()} className={TEXT_BUTTON}>
              <Paperclip size={16} strokeWidth={1.5} aria-hidden="true" />
              Attach
            </button>
            <ModelPicker
              models={models}
              value={modelId}
              disabled={writing}
              onChange={(id) => {
                setModelId(id);
                onModelChange?.(id);
              }}
            />
            <span className="ml-auto flex items-center gap-3">
              {writing && (
                <span className="hidden font-mono text-[11px] text-(--iu-muted) tabular-nums @md:inline">
                  Writing · sentence {Math.min(totalSentences, writtenSentences + 1)} of {totalSentences}
                </span>
              )}
              {writing ? (
                <button
                  type="button"
                  onClick={stop}
                  className={cx(
                    "inline-flex h-10 cursor-pointer items-center gap-2 border border-(--iu-foreground) px-4 text-[14px] font-medium",
                    SQUARE,
                    FOCUS,
                  )}
                >
                  <Square size={12} strokeWidth={2} aria-hidden="true" className="fill-current" />
                  Stop
                  <kbd className="hidden font-mono text-[10px] text-(--iu-muted) @md:inline">Esc</kbd>
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={draft.trim().length === 0}
                  className={cx(
                    "inline-flex h-10 cursor-pointer items-center gap-2 bg-(--iu-foreground) px-4 text-[14px] font-medium text-(--iu-background) transition-opacity duration-200 disabled:cursor-not-allowed disabled:opacity-40 motion-reduce:transition-none",
                    SQUARE,
                    FOCUS,
                  )}
                >
                  Ask
                  <ArrowRight size={16} strokeWidth={1.5} aria-hidden="true" />
                </button>
              )}
            </span>
          </div>
        </form>

        <p aria-live="polite" className="sr-only">
          {writing ? "Writing the answer" : announcement}
        </p>
      </section>
    </MotionConfig>
  );
}

export default QuireResearchAssistant;
