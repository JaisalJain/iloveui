"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "motion/react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Check } from "lucide-react";

export type TidewaterSubmission = {
  id: string;
  title: string;
  author: string;
  form: "Essay" | "Fiction" | "Poetry" | "Reportage";
  words: number;
  /** ISO date (YYYY-MM-DD). */
  received: string;
  status: "unread" | "first-read" | "second-read" | "shortlisted";
  /** Full name of the reader holding it, if any. */
  reader?: string;
};

export type TidewaterSortKey = "received" | "words" | "title" | "author";

export type TidewaterSubmissionsProps = {
  publication?: string;
  issue?: string;
  headline?: string;
  standfirst?: string;
  submissions?: TidewaterSubmission[];
  pageSize?: number;
  /** Reading speed used for the selection's reading time. */
  wordsPerMinute?: number;
  defaultSelected?: string[];
  /** A confirmation shown on first render, as after a bulk action. */
  initialNotice?: string;
  status?: "ready" | "loading";
  onShortlist?: (ids: string[]) => void;
  onDecline?: (ids: string[]) => void;
  onOpen?: (id: string) => void;
  onOpenCall?: () => void;
  className?: string;
};

export const DEFAULT_SUBMISSIONS: TidewaterSubmission[] = [
  {
    id: "s-418",
    title: "The Ferryman’s Ledger",
    author: "Ines Achterberg",
    form: "Essay",
    words: 4210,
    received: "2026-10-24",
    status: "unread",
  },
  {
    id: "s-417",
    title: "What the Estuary Keeps",
    author: "Tomasz Wierzbicki",
    form: "Fiction",
    words: 6880,
    received: "2026-10-23",
    status: "first-read",
    reader: "Maren Oduya",
  },
  {
    id: "s-415",
    title: "Salt Year",
    author: "Adaeze Okonkwo",
    form: "Poetry",
    words: 940,
    received: "2026-10-21",
    status: "second-read",
    reader: "Linus Harrow",
  },
  {
    id: "s-414",
    title: "A Short History of Fog Horns",
    author: "Callum Reyes-Whitlock",
    form: "Reportage",
    words: 5320,
    received: "2026-10-19",
    status: "unread",
  },
  {
    id: "s-412",
    title: "Mending Nets in Kilkeel",
    author: "Siobhán Keary",
    form: "Essay",
    words: 3175,
    received: "2026-10-17",
    status: "first-read",
    reader: "Maren Oduya",
  },
  {
    id: "s-411",
    title: "Low Water",
    author: "Hamid Sorouri",
    form: "Fiction",
    words: 8945,
    received: "2026-10-15",
    status: "shortlisted",
    reader: "Linus Harrow",
  },
  {
    id: "s-409",
    title: "Inventory of a Drowned Garden",
    author: "Paloma Ferreira-Lund",
    form: "Poetry",
    words: 1260,
    received: "2026-10-12",
    status: "unread",
  },
  {
    id: "s-408",
    title: "The Lighthouse Keeper’s Daughter Writes Back",
    author: "Ruth Ebbesen",
    form: "Fiction",
    words: 5610,
    received: "2026-10-10",
    status: "second-read",
    reader: "Maren Oduya",
  },
  {
    id: "s-406",
    title: "On Tide Tables",
    author: "Dev Ramaswamy",
    form: "Essay",
    words: 2890,
    received: "2026-10-08",
    status: "unread",
  },
  {
    id: "s-405",
    title: "Night Shift at the Fish Auction",
    author: "Grete Solberg",
    form: "Reportage",
    words: 7140,
    received: "2026-10-05",
    status: "first-read",
    reader: "Linus Harrow",
  },
  {
    id: "s-403",
    title: "Barnacles",
    author: "Okwudili Ajayi",
    form: "Poetry",
    words: 610,
    received: "2026-10-02",
    status: "unread",
  },
  {
    id: "s-401",
    title: "Every Boat Is Named for Someone",
    author: "Lucía Montenegro",
    form: "Essay",
    words: 3960,
    received: "2026-09-29",
    status: "second-read",
    reader: "Linus Harrow",
  },
  {
    id: "s-398",
    title: "The Weight of a Wet Rope",
    author: "Fintan Doyle",
    form: "Fiction",
    words: 4475,
    received: "2026-09-24",
    status: "unread",
  },
  {
    id: "s-396",
    title: "Breakwater",
    author: "Yuki Takamura",
    form: "Poetry",
    words: 820,
    received: "2026-09-19",
    status: "first-read",
    reader: "Maren Oduya",
  },
  {
    id: "s-393",
    title: "Where the Pilot Boats Wait",
    author: "Anneke Visser",
    form: "Reportage",
    words: 6025,
    received: "2026-09-14",
    status: "unread",
  },
  {
    id: "s-390",
    title: "Letters from a Tidal Island",
    author: "Rhiannon Pryce",
    form: "Essay",
    words: 5190,
    received: "2026-09-08",
    status: "second-read",
    reader: "Maren Oduya",
  },
];

const SORTS: { key: TidewaterSortKey; label: string; defaultDirection: "asc" | "desc" }[] = [
  { key: "received", label: "Received", defaultDirection: "desc" },
  { key: "words", label: "Length", defaultDirection: "desc" },
  { key: "title", label: "Title", defaultDirection: "asc" },
  { key: "author", label: "Author", defaultDirection: "asc" },
];

const NUMBER_WORDS = [
  "No",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
  "Twenty",
];

const EASE = [0.2, 0.8, 0.2, 1] as const;
const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--iu-accent)";

function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

function spelled(count: number) {
  return NUMBER_WORDS[count] ?? String(count);
}

function readingTime(words: number, wpm: number) {
  const minutes = Math.max(1, Math.round(words / wpm));
  if (minutes < 60) return `about ${minutes} minutes of reading`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return `about ${hours} hour${hours === 1 ? "" : "s"}${rest ? ` ${rest} minutes` : ""} of reading`;
}

function surname(name: string) {
  return name.split(/\s+/).at(-1) ?? name;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function StatusLine({ submission }: { submission: TidewaterSubmission }) {
  const label = {
    unread: "Unread",
    "first-read": "First read",
    "second-read": "Second read",
    shortlisted: "Shortlisted",
  }[submission.status];
  return (
    <span className="inline-flex items-center gap-2 text-[13px] whitespace-nowrap">
      <span
        aria-hidden="true"
        className={cx(
          "inline-block size-2",
          submission.status === "unread" && "rounded-full border border-(--iu-muted)",
          submission.status === "first-read" && "rounded-full bg-(--iu-muted)",
          submission.status === "second-read" && "rounded-full bg-(--iu-foreground)",
          submission.status === "shortlisted" && "rotate-45 bg-(--iu-accent)",
        )}
      />
      <span className={submission.status === "unread" ? "text-(--iu-muted)" : "text-(--iu-foreground)"}>{label}</span>
      {submission.reader && (
        <span className="font-mono text-[11px] tracking-[0.04em] text-(--iu-muted)">
          <span aria-hidden="true">{initials(submission.reader)}</span>
          <span className="sr-only">with {submission.reader}</span>
        </span>
      )}
    </span>
  );
}

export function TidewaterSubmissions({
  publication = "Tidewater Review",
  issue = "Winter 2026 · No. 31",
  headline = "The reading pile",
  standfirst = "Sixteen pieces are waiting for a decision before the issue closes on 14 November. Read slowly; decide together.",
  submissions = DEFAULT_SUBMISSIONS,
  pageSize = 6,
  wordsPerMinute = 230,
  defaultSelected = [],
  initialNotice,
  status = "ready",
  onShortlist,
  onDecline,
  onOpen,
  onOpenCall,
  className = "",
}: TidewaterSubmissionsProps) {
  const reduceMotion = useReducedMotion();
  const titleId = useId();
  const [items, setItems] = useState(submissions);
  const [source, setSource] = useState(submissions);
  if (source !== submissions) {
    setSource(submissions);
    setItems(submissions);
  }
  const [sort, setSort] = useState<{ key: TidewaterSortKey; direction: "asc" | "desc" }>({
    key: "received",
    direction: "desc",
  });
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(() => new Set(defaultSelected));
  const [notice, setNotice] = useState<string | null>(initialNotice ?? null);
  const [undo, setUndo] = useState<TidewaterSubmission[] | null>(null);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => {
      setNotice(null);
      setUndo(null);
    }, 8000);
    return () => clearTimeout(timer);
  }, [notice]);

  const sorted = useMemo(() => {
    const factor = sort.direction === "asc" ? 1 : -1;
    return [...items].sort((a, b) => {
      if (sort.key === "words") return (a.words - b.words) * factor;
      if (sort.key === "title") return a.title.localeCompare(b.title) * factor;
      if (sort.key === "author") return surname(a.author).localeCompare(surname(b.author)) * factor;
      return (Date.parse(a.received) - Date.parse(b.received)) * factor;
    });
  }, [items, sort]);

  const dateFormat = useMemo(
    () => new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }),
    [],
  );
  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const offset = (currentPage - 1) * pageSize;
  const pageItems = sorted.slice(offset, offset + pageSize);
  const chosen = items.filter((item) => selected.has(item.id));
  const chosenWords = chosen.reduce((sum, item) => sum + item.words, 0);
  const loading = status === "loading";
  const empty = !loading && items.length === 0;

  function chooseSort(key: TidewaterSortKey) {
    setSort((previous) => {
      if (previous.key === key) return { key, direction: previous.direction === "asc" ? "desc" : "asc" };
      return { key, direction: SORTS.find((option) => option.key === key)?.defaultDirection ?? "asc" };
    });
    setPage(1);
  }

  function toggle(id: string) {
    setSelected((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function act(kind: "shortlist" | "decline") {
    const ids = chosen.map((item) => item.id);
    if (ids.length === 0) return;
    setUndo(items);
    if (kind === "shortlist") {
      setItems((previous) =>
        previous.map((item) => (selected.has(item.id) ? { ...item, status: "shortlisted" } : item)),
      );
      onShortlist?.(ids);
    } else {
      setItems((previous) => previous.filter((item) => !selected.has(item.id)));
      onDecline?.(ids);
    }
    const noun = ids.length === 1 ? "piece" : "pieces";
    setNotice(
      kind === "shortlist"
        ? `${spelled(ids.length)} ${noun} moved to the shortlist.`
        : `${spelled(ids.length)} ${noun} declined. Authors are notified on Friday.`,
    );
    setSelected(new Set());
  }

  return (
    <MotionConfig reducedMotion="user" transition={reduceMotion ? { duration: 0 } : { duration: 0.32, ease: EASE }}>
      <section
        aria-labelledby={titleId}
        className={cx(
          "@container rounded-[min(var(--iu-radius),2px)] border border-(--iu-border) bg-(--iu-surface) font-(family-name:--iu-font) text-(--iu-foreground)",
          className,
        )}
      >
        {/* Masthead */}
        <header className="px-5 pt-6 @2xl:px-10 @2xl:pt-10">
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b-[3px] border-double border-(--iu-foreground) pb-2 text-[11px] font-medium tracking-[0.16em] uppercase">
            <span>{publication}</span>
            <span className="font-mono tracking-[0.08em] text-(--iu-muted)">{issue}</span>
          </div>
          <div className="grid gap-x-10 gap-y-3 pt-6 pb-8 @3xl:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] @3xl:items-end">
            <h2
              id={titleId}
              className="font-serif text-[clamp(2.5rem,1.6rem+4cqi,4.5rem)] leading-[0.95] font-normal tracking-[-0.02em] text-balance"
            >
              <em>{headline}</em>
            </h2>
            <p className="max-w-[44ch] text-[15px] leading-relaxed text-pretty text-(--iu-muted)">{standfirst}</p>
          </div>
        </header>

        <div className="max-h-[560px] [scrollbar-gutter:stable] overflow-y-auto" aria-busy={loading || undefined}>
          {/* Sticky sort masthead */}
          <div className="sticky top-0 z-10 flex flex-wrap items-center gap-x-5 gap-y-2 border-y border-(--iu-border) bg-(--iu-surface) px-5 py-2.5 @2xl:px-10">
            <span
              id={`${titleId}-sort`}
              className="text-[11px] font-medium tracking-[0.16em] text-(--iu-muted) uppercase"
            >
              Order by
            </span>
            <div role="group" aria-labelledby={`${titleId}-sort`} className="flex flex-wrap gap-x-4 gap-y-1">
              {SORTS.map((option) => {
                const active = sort.key === option.key;
                return (
                  <button
                    key={option.key}
                    type="button"
                    aria-pressed={active}
                    disabled={loading || empty}
                    onClick={() => chooseSort(option.key)}
                    className={cx(
                      "group inline-flex h-8 items-center gap-1 rounded-[min(var(--iu-radius),2px)] text-[14px] transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none pointer-coarse:h-10",
                      active ? "text-(--iu-foreground)" : "text-(--iu-muted) pointer-fine:hover:text-(--iu-foreground)",
                      focusRing,
                    )}
                  >
                    <span
                      className={cx(
                        "border-b pb-px",
                        active ? "border-(--iu-accent) font-serif text-[17px] italic" : "border-transparent",
                      )}
                    >
                      {option.label}
                    </span>
                    {active &&
                      (sort.direction === "asc" ? (
                        <>
                          <ArrowUp size={13} strokeWidth={1.5} aria-hidden="true" />
                          <span className="sr-only">, ascending</span>
                        </>
                      ) : (
                        <>
                          <ArrowDown size={13} strokeWidth={1.5} aria-hidden="true" />
                          <span className="sr-only">, descending</span>
                        </>
                      ))}
                  </button>
                );
              })}
            </div>
            <span className="ml-auto hidden font-mono text-[11px] text-(--iu-muted) tabular-nums @2xl:inline">
              {loading ? "—" : `${items.length} in the pile`}
            </span>
          </div>

          {/* The pile */}
          {loading ? (
            <ol aria-label="Loading submissions" className="px-5 @2xl:px-10">
              {[0.62, 0.48, 0.7, 0.55].map((width, index) => (
                <li
                  key={index}
                  className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-x-4 border-b border-(--iu-border) py-5 @2xl:grid-cols-[3rem_minmax(0,1fr)_7rem_7rem]"
                >
                  <span aria-hidden="true" className="h-7 w-6 bg-(--iu-foreground)/8" />
                  <span className="flex flex-col gap-2.5">
                    <span
                      aria-hidden="true"
                      className="h-5 bg-(--iu-foreground)/8"
                      style={{ width: `${width * 100}%` }}
                    />
                    <span aria-hidden="true" className="h-3 w-40 bg-(--iu-foreground)/6" />
                  </span>
                  <span aria-hidden="true" className="hidden h-3 w-16 self-center bg-(--iu-foreground)/6 @2xl:block" />
                  <span aria-hidden="true" className="hidden h-3 w-20 self-center bg-(--iu-foreground)/6 @2xl:block" />
                </li>
              ))}
            </ol>
          ) : empty ? (
            <div className="flex flex-col items-start gap-4 px-5 py-14 @2xl:px-10">
              <svg
                aria-hidden="true"
                width="88"
                height="48"
                viewBox="0 0 88 48"
                fill="none"
                className="text-(--iu-muted)"
              >
                <path d="M4 40h80" stroke="currentColor" />
                <path d="M4 44h80" stroke="currentColor" strokeOpacity="0.5" />
                <path d="M14 40V18l14-8h32l14 8v22" stroke="currentColor" />
                <path d="M14 18h60" stroke="currentColor" strokeDasharray="2 3" />
              </svg>
              <p className="font-serif text-[28px] leading-tight italic">The pile is empty.</p>
              <p className="max-w-[46ch] text-[15px] leading-relaxed text-pretty text-(--iu-muted)">
                Every piece has a decision. New submissions arrive here as soon as the reading period opens.
              </p>
              <button
                type="button"
                onClick={onOpenCall}
                className={cx(
                  "inline-flex h-10 items-center gap-2 border-b border-(--iu-foreground) text-[14px] font-medium transition-[gap] duration-200 motion-reduce:transition-none pointer-fine:hover:gap-3",
                  focusRing,
                )}
              >
                Open the spring reading period
                <ArrowRight size={16} strokeWidth={1.5} aria-hidden="true" />
              </button>
            </div>
          ) : (
            <ol aria-label="Submissions" start={offset + 1} className="px-5 @2xl:px-10">
              <AnimatePresence initial={false} mode="popLayout">
                {pageItems.map((item, index) => {
                  const isSelected = selected.has(item.id);
                  const number = String(offset + index + 1).padStart(2, "0");
                  return (
                    <motion.li
                      key={item.id}
                      layout="position"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="relative grid grid-cols-[2.5rem_minmax(0,1fr)] gap-x-4 border-b border-(--iu-border) py-[calc(20px*var(--iu-density))] @2xl:grid-cols-[3rem_minmax(0,1fr)_6.5rem_8.5rem] @2xl:gap-x-6"
                    >
                      <span
                        aria-hidden="true"
                        className={cx(
                          "absolute top-4 bottom-4 -left-5 w-[3px] origin-top bg-(--iu-accent) transition-transform duration-300 motion-reduce:transition-none @2xl:-left-10",
                          isSelected ? "scale-y-100" : "scale-y-0",
                        )}
                      />
                      <label className="relative self-start">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggle(item.id)}
                          aria-label={`Select “${item.title}” by ${item.author}`}
                          className="peer absolute inset-0 size-full cursor-pointer opacity-0"
                        />
                        <span
                          aria-hidden="true"
                          className={cx(
                            "flex h-10 w-10 items-start justify-start font-serif text-[28px] leading-none tabular-nums transition-colors duration-200 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-(--iu-accent) motion-reduce:transition-none",
                            isSelected
                              ? "text-(--iu-foreground)"
                              : "text-(--iu-muted) pointer-fine:peer-hover:text-(--iu-foreground)",
                          )}
                        >
                          {isSelected ? (
                            <span className="inline-flex size-8 items-center justify-center rounded-[min(var(--iu-radius),2px)] bg-(--iu-foreground) text-(--iu-surface)">
                              <Check size={18} strokeWidth={2} />
                            </span>
                          ) : (
                            number
                          )}
                        </span>
                      </label>

                      <div className="min-w-0">
                        <a
                          href={`#${item.id}`}
                          onClick={(event) => {
                            if (!onOpen) return;
                            event.preventDefault();
                            onOpen(item.id);
                          }}
                          className={cx(
                            "font-serif text-[22px] leading-[1.15] text-balance decoration-(--iu-accent) decoration-1 underline-offset-4 @2xl:text-[24px] pointer-fine:hover:underline",
                            focusRing,
                          )}
                        >
                          {item.title}
                        </a>
                        <p className="mt-1.5 text-[13px] text-(--iu-muted)">
                          by <span className="text-(--iu-foreground)">{item.author}</span>
                          <span className="@2xl:hidden">
                            {" "}
                            · {item.form} ·{" "}
                            <span className="font-mono tabular-nums">{item.words.toLocaleString("en-GB")}</span> words
                          </span>
                          <span>
                            {" "}
                            · received{" "}
                            <span className="font-mono text-[12px] tabular-nums">
                              {dateFormat.format(new Date(`${item.received}T00:00:00Z`))}
                            </span>
                          </span>
                        </p>
                        <div className="mt-2 @2xl:hidden">
                          <StatusLine submission={item} />
                        </div>
                      </div>

                      <div className="hidden pt-1.5 @2xl:block">
                        <p className="text-[11px] font-medium tracking-[0.16em] text-(--iu-muted) uppercase">
                          {item.form}
                        </p>
                        <p className="mt-1 font-mono text-[13px] tabular-nums">
                          {item.words.toLocaleString("en-GB")}
                          <span className="text-(--iu-muted)"> w</span>
                        </p>
                      </div>
                      <div className="hidden pt-1.5 @2xl:block">
                        <StatusLine submission={item} />
                      </div>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ol>
          )}
        </div>

        {/* Colophon: the selection, stated in prose, and what to do with it */}
        <div className="border-t-[3px] border-double border-(--iu-foreground) px-5 py-4 @2xl:px-10">
          <AnimatePresence initial={false} mode="wait">
            {notice ? (
              <motion.div
                key="notice"
                role="status"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-wrap items-center gap-x-4 gap-y-2"
              >
                <span aria-hidden="true" className="inline-block size-2 rotate-45 bg-(--iu-accent)" />
                <p className="font-serif text-[20px] italic">{notice}</p>
                {undo && (
                  <button
                    type="button"
                    onClick={() => {
                      setItems(undo);
                      setUndo(null);
                      setNotice(null);
                    }}
                    className={cx(
                      "inline-flex h-8 items-center border-b border-(--iu-foreground) text-[13px] font-medium pointer-coarse:h-10",
                      focusRing,
                    )}
                  >
                    Undo
                  </button>
                )}
              </motion.div>
            ) : chosen.length > 0 ? (
              <motion.div
                key="chosen"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3"
              >
                <p aria-live="polite" className="text-[15px] text-pretty">
                  <span className="font-serif text-[20px] italic">
                    {spelled(chosen.length)} {chosen.length === 1 ? "piece" : "pieces"}
                  </span>
                  <span className="text-(--iu-muted)">
                    {" "}
                    · <span className="font-mono text-[13px] tabular-nums">
                      {chosenWords.toLocaleString("en-GB")}
                    </span>{" "}
                    words, {readingTime(chosenWords, wordsPerMinute)}
                  </span>
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => act("shortlist")}
                    className={cx(
                      "inline-flex h-9 items-center rounded-[min(var(--iu-radius),2px)] bg-(--iu-foreground) px-4 text-[13px] font-medium text-(--iu-surface) transition-opacity duration-200 motion-reduce:transition-none pointer-coarse:h-10 pointer-fine:hover:opacity-85",
                      focusRing,
                    )}
                  >
                    Shortlist
                  </button>
                  <button
                    type="button"
                    onClick={() => act("decline")}
                    className={cx(
                      "inline-flex h-9 items-center rounded-[min(var(--iu-radius),2px)] border border-(--iu-foreground)/40 px-4 text-[13px] font-medium transition-colors duration-200 motion-reduce:transition-none pointer-coarse:h-10 pointer-fine:hover:border-(--iu-foreground)",
                      focusRing,
                    )}
                  >
                    Decline
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelected(new Set())}
                    className={cx(
                      "inline-flex h-9 items-center px-2 text-[13px] text-(--iu-muted) underline-offset-4 pointer-coarse:h-10 pointer-fine:hover:underline",
                      focusRing,
                    )}
                  >
                    Clear
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.p
                key="hint"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-[14px] text-pretty text-(--iu-muted)"
              >
                {loading
                  ? "Gathering the pile…"
                  : empty
                    ? "Nothing to decide."
                    : "Select pieces by their number to shortlist or decline them together."}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Pagination */}
        <nav
          aria-label="Pages of the pile"
          className="flex items-center justify-between gap-4 border-t border-(--iu-border) px-5 py-3 @2xl:px-10"
        >
          <button
            type="button"
            disabled={currentPage <= 1 || loading || empty}
            onClick={() => setPage(currentPage - 1)}
            className={cx(
              "inline-flex h-9 items-center gap-2 text-[13px] font-medium disabled:cursor-not-allowed disabled:text-(--iu-muted) disabled:opacity-60 pointer-coarse:h-10",
              focusRing,
            )}
          >
            <ArrowLeft size={16} strokeWidth={1.5} aria-hidden="true" />
            <span>
              Newer<span className="sr-only @md:not-sr-only"> pieces</span>
            </span>
          </button>
          <ol className="flex items-center gap-1">
            {Array.from({ length: loading || empty ? 1 : pageCount }, (_, index) => index + 1).map((number) => (
              <li key={number}>
                <button
                  type="button"
                  aria-label={`Page ${number}`}
                  aria-current={number === currentPage ? "page" : undefined}
                  disabled={loading || empty}
                  onClick={() => setPage(number)}
                  className={cx(
                    "inline-flex h-9 min-w-9 items-center justify-center font-serif text-[18px] tabular-nums transition-colors duration-200 disabled:cursor-not-allowed motion-reduce:transition-none pointer-coarse:h-10 pointer-coarse:min-w-10",
                    number === currentPage
                      ? "text-(--iu-foreground) italic underline decoration-(--iu-accent) decoration-2 underline-offset-[6px]"
                      : "text-(--iu-muted) pointer-fine:hover:text-(--iu-foreground)",
                    focusRing,
                  )}
                >
                  {number}
                </button>
              </li>
            ))}
          </ol>
          <button
            type="button"
            disabled={currentPage >= pageCount || loading || empty}
            onClick={() => setPage(currentPage + 1)}
            className={cx(
              "inline-flex h-9 items-center gap-2 text-[13px] font-medium disabled:cursor-not-allowed disabled:text-(--iu-muted) disabled:opacity-60 pointer-coarse:h-10",
              focusRing,
            )}
          >
            <span>
              Older<span className="sr-only @md:not-sr-only"> pieces</span>
            </span>
            <ArrowRight size={16} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </nav>
      </section>
    </MotionConfig>
  );
}

export default TidewaterSubmissions;
