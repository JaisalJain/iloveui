"use client";

import { Fragment, useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

export type MarginNote = {
  /** Stable id, used for keys and element ids. */
  id: string;
  /** The testimonial itself, without quotation marks. */
  quote: string;
  /** Full name, shown in the index, the byline and as a monogram. */
  name: string;
  role: string;
  company: string;
  /** ISO date (YYYY-MM-DD) the note was written. */
  date: string;
};

export type MarginNotesTestimonialsProps = {
  kicker?: string;
  edition?: string;
  heading?: string;
  intro?: string;
  notes?: MarginNote[];
  /** Index of the note featured on first render. */
  defaultIndex?: number;
  /** Called whenever a different note is featured (click, arrow keys, Home or End). */
  onSelectedChange?: (note: MarginNote, index: number) => void;
  className?: string;
};

const DEFAULT_NOTES: MarginNote[] = [
  {
    id: "deshmukh",
    quote:
      "I annotated 312 papers across three years. Ibid turned those margins into a literature review I could defend, line by line, in front of my committee.",
    name: "Anjali Deshmukh",
    role: "Doctoral researcher",
    company: "Eastmoor University",
    date: "2026-03-03",
  },
  {
    id: "quiroga",
    quote:
      "Every claim in a draft links straight to its source document. Our lawyers read the margins before the story, and sign off a full day sooner.",
    name: "Mariela Quiroga",
    role: "Investigations editor",
    company: "The Saltmarsh Ledger",
    date: "2026-05-22",
  },
  {
    id: "asante-ofori",
    quote:
      "The protocol, the plate-reader export and the reason we changed step four sit on one page. Reviewers stopped asking how we got our numbers.",
    name: "Kwame Asante-Ofori",
    role: "Lab lead",
    company: "Calder Plant Genomics",
    date: "2026-07-09",
  },
  {
    id: "brandvold",
    quote:
      "Each excerpt keeps its box, folder and page. When a visiting scholar asks where a line came from, I answer in one click instead of one afternoon.",
    name: "Ilse Brandvold",
    role: "Senior archivist",
    company: "Vestby Harbour Archive",
    date: "2026-09-18",
  },
  {
    id: "callaghan",
    quote:
      "Forty-one interviews, one notebook. Tagging a quote takes a keystroke, and our synthesis reads like a first draft instead of a wall of sticky notes.",
    name: "Rhys Callaghan",
    role: "Head of research",
    company: "Fernway Freight",
    date: "2026-10-14",
  },
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

/** The pull quote and its hanging mark share one size, so the mark sits exactly on the first line. */
const QUOTE_TYPE = "font-serif text-[length:clamp(1.875rem,8.8cqi,3.75rem)] leading-[1.08] tracking-[-0.012em] italic";

/** Each word (and the byline) reads its timing from the panel state; words on one line share a delay. */
const LINE_MOTION =
  "translate-y-(--mn-shift) opacity-(--mn-opacity) transition-[opacity,translate] duration-(--mn-duration) delay-[calc(var(--mn-delay)+var(--line,0)*var(--mn-stagger))] ease-(--mn-ease) motion-reduce:transition-none";

function formatDate(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return iso;
  return `${day} ${MONTHS[month - 1] ?? ""} ${year}`;
}

function issueNumber(value: number) {
  return String(value).padStart(2, "0");
}

function initials(name: string) {
  const parts = name.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return `${first}${last}`.toUpperCase();
}

/** "Kwame Asante-Ofori" becomes ["Kwame", "Asante-Ofori"]: narrow layouts show only the first part. */
function splitName(name: string): [string, string] {
  const trimmed = name.trim();
  const space = trimmed.indexOf(" ");
  return space === -1 ? [trimmed, ""] : [trimmed.slice(0, space), trimmed.slice(space + 1)];
}

/** An odometer: each digit is a column of 0-9 that rolls to its value. */
function RollingNumber({ value }: { value: number }) {
  return (
    <span className="inline-flex">
      {issueNumber(value)
        .split("")
        .map((digit, index) => (
          <span key={index} className="inline-block h-[1.1em] overflow-hidden px-[0.04em]">
            <span
              className="flex flex-col transition-transform duration-[360ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none"
              style={{ transform: `translateY(-${Number(digit) * 10}%)` }}
            >
              {DIGITS.map((option) => (
                <span key={option} className="h-[1.1em]">
                  {option}
                </span>
              ))}
            </span>
          </span>
        ))}
    </span>
  );
}

function QuoteWords({ text }: { text: string }) {
  const words = text.split(/\s+/).filter(Boolean);
  return words.map((word, index) => (
    <Fragment key={index}>
      <span data-word className={`inline-block ${LINE_MOTION}`}>
        {index === words.length - 1 ? `${word}”` : word}
      </span>
      {index < words.length - 1 ? " " : null}
    </Fragment>
  ));
}

export function MarginNotesTestimonials({
  kicker = "Readers’ notes",
  edition = "Vol. 3 · Autumn 2026",
  heading = "Notes from the margins",
  intro = "Five researchers on what changed once their sources, drafts and second thoughts lived in Ibid.",
  notes = DEFAULT_NOTES,
  defaultIndex = 0,
  onSelectedChange,
  className = "",
}: MarginNotesTestimonialsProps) {
  const baseId = useId();
  const count = notes.length;
  const [selection, setSelection] = useState(() => ({
    active: Math.min(Math.max(0, Math.round(defaultIndex)), Math.max(0, count - 1)),
    previous: -1,
  }));
  const [orientation, setOrientation] = useState<"horizontal" | "vertical">("vertical");
  const [overflow, setOverflow] = useState<"none" | "start" | "end" | "both">("none");
  const tablistRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const panelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const active = Math.min(selection.active, Math.max(0, count - 1));

  // The index is a vertical list beside the quote, and a row of names above it in narrow containers. The observer
  // reports once when it starts and again whenever the container query flips the layout or a name changes width.
  // In the row it also tracks whether names are scrolled out of view, so those edges fade. Re-runs when the notes
  // change, so data that arrives after the first render is observed too.
  useEffect(() => {
    const list = tablistRef.current;
    if (notes.length === 0 || !list) return;
    const update = () => {
      const vertical = getComputedStyle(list).flexDirection === "column";
      setOrientation(vertical ? "vertical" : "horizontal");
      const before = !vertical && list.scrollLeft > 1;
      const after = !vertical && list.scrollLeft + list.clientWidth < list.scrollWidth - 1;
      setOverflow(before && after ? "both" : before ? "start" : after ? "end" : "none");
    };
    const observer = new ResizeObserver(update);
    observer.observe(list);
    Array.from(list.children).forEach((tab) => observer.observe(tab));
    list.addEventListener("scroll", update, { passive: true });
    return () => {
      observer.disconnect();
      list.removeEventListener("scroll", update);
    };
  }, [notes]);

  if (count === 0) return null;

  const tabId = (index: number) => `${baseId}-tab-${index}`;
  const panelId = (index: number) => `${baseId}-panel-${index}`;

  /** Groups a panel's words into rendered lines, so each line leaves and arrives as one. */
  function measureLines(index: number) {
    const panel = panelRefs.current[index];
    if (!panel) return;
    let line = -1;
    let top = Number.NEGATIVE_INFINITY;
    panel.querySelectorAll<HTMLElement>("[data-word]").forEach((word) => {
      if (word.offsetTop > top + 2) {
        line += 1;
        top = word.offsetTop;
      }
      word.style.setProperty("--line", String(line));
    });
    panel.style.setProperty("--lines", String(line + 1));
    // The byline arrives with the first line, so the reader knows who is speaking as soon as the quote starts.
    panel.querySelector<HTMLElement>("[data-byline]")?.style.setProperty("--line", "0");
  }

  function select(index: number) {
    if (index === active) return;
    measureLines(active);
    measureLines(index);
    // A note that has fully left rests above its slot (so an exit still running is never cut short). Move it
    // below without a transition first, so its lines rise into place.
    // A note re-selected mid-exit reverses from where its lines are instead.
    const incoming = panelRefs.current[index];
    const parts = incoming ? Array.from(incoming.querySelectorAll<HTMLElement>("[data-word], [data-byline]")) : [];
    if (incoming && parts.length > 0 && parts.every((part) => getComputedStyle(part).opacity === "0")) {
      incoming.dataset.state = "ready";
      incoming.getBoundingClientRect();
    }
    setSelection({ active: index, previous: active });
    // In the narrow layout the row of names can scroll; keep the chosen one fully in view.
    tabRefs.current[index]?.scrollIntoView({ block: "nearest", inline: "nearest" });
    const note = notes[index];
    if (note) onSelectedChange?.(note, index);
  }

  function onTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = count - 1;
    // Only the arrows along the index move the selection, so the others keep scrolling the page.
    const forward = orientation === "vertical" ? "ArrowDown" : "ArrowRight";
    const backward = orientation === "vertical" ? "ArrowUp" : "ArrowLeft";
    let next: number | null = null;
    if (event.key === forward) next = index === last ? 0 : index + 1;
    else if (event.key === backward) next = index === 0 ? last : index - 1;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = last;
    if (next === null) return;
    event.preventDefault();
    select(next);
    tabRefs.current[next]?.focus();
  }

  return (
    <section
      aria-labelledby={`${baseId}-heading`}
      className={`@container/notes bg-(--iu-background) px-3 py-12 font-(family-name:--iu-font) text-(--iu-foreground) sm:px-6 sm:py-20 ${className}`}
    >
      <div className="mx-auto max-w-[1200px] rounded-[min(var(--iu-radius),2px)] border border-(--iu-border) bg-(--iu-surface) px-5 pt-5 pb-10 @2xl/notes:px-10 @2xl/notes:pt-7 @2xl/notes:pb-14 @4xl/notes:px-14 @4xl/notes:pb-16">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 pb-3 text-[11px] font-medium tracking-[0.08em] text-(--iu-muted) uppercase">
          <span className="whitespace-nowrap">{kicker}</span>
          <span className="ml-auto font-mono tracking-[0.04em] whitespace-nowrap tabular-nums">{edition}</span>
        </div>
        <div
          aria-hidden="true"
          className="h-1.5 border-t-[3px] border-b border-(--iu-foreground) dark:border-(--iu-foreground)/85"
        />

        <div className="mt-8 grid grid-cols-1 @4xl/notes:mt-12 @4xl/notes:grid-cols-12">
          <div className="@4xl/notes:col-span-5 @4xl/notes:border-r @4xl/notes:border-(--iu-border) @6xl/notes:col-span-4">
            <h2
              id={`${baseId}-heading`}
              className="font-serif text-[1.75rem] leading-[1.05] tracking-[-0.01em] text-balance @2xl/notes:text-[2rem] @4xl/notes:pr-10 @4xl/notes:text-[2.5rem]"
            >
              {heading}
            </h2>
            <p className="mt-4 max-w-[30rem] text-[15px] leading-relaxed text-pretty text-(--iu-muted) @4xl/notes:pr-10">
              {intro}
            </p>

            <div
              ref={tablistRef}
              role="tablist"
              aria-label={kicker}
              aria-orientation={orientation}
              data-overflow={overflow}
              className="mt-8 flex snap-x snap-mandatory scroll-px-10 [scrollbar-width:thin] overflow-x-auto data-[overflow=both]:[mask-image:linear-gradient(to_right,transparent,black_2.5rem,black_calc(100%-2.5rem),transparent)] data-[overflow=end]:[mask-image:linear-gradient(to_right,black_calc(100%-2.5rem),transparent)] data-[overflow=start]:[mask-image:linear-gradient(to_right,transparent,black_2.5rem)] @4xl/notes:mt-12 @4xl/notes:flex-col @4xl/notes:overflow-visible @4xl/notes:border-t @4xl/notes:border-(--iu-border)"
            >
              {notes.map((note, index) => {
                const selected = index === active;
                const [givenName, familyName] = splitName(note.name);
                return (
                  <button
                    key={note.id}
                    ref={(element) => {
                      tabRefs.current[index] = element;
                    }}
                    type="button"
                    role="tab"
                    id={tabId(index)}
                    aria-selected={selected}
                    aria-controls={panelId(index)}
                    tabIndex={selected ? 0 : -1}
                    onClick={() => select(index)}
                    onKeyDown={(event) => onTabKeyDown(event, index)}
                    className="relative isolate flex h-11 min-w-max flex-1 snap-start items-center justify-center border-b border-(--iu-border) px-3 whitespace-nowrap text-(--iu-muted) transition-colors duration-150 after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:bg-(--iu-foreground) after:opacity-0 after:transition-opacity after:duration-150 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-(--iu-accent) aria-selected:text-(--iu-foreground) aria-selected:after:opacity-100 motion-reduce:transition-none motion-reduce:after:transition-none @4xl/notes:grid @4xl/notes:h-auto @4xl/notes:min-w-0 @4xl/notes:grid-cols-[3.75rem_1fr] @4xl/notes:items-baseline @4xl/notes:justify-start @4xl/notes:py-[calc(16px*var(--iu-density))] @4xl/notes:pr-8 @4xl/notes:pl-0 @4xl/notes:text-left @4xl/notes:whitespace-normal @4xl/notes:before:absolute @4xl/notes:before:inset-y-0 @4xl/notes:before:right-0 @4xl/notes:before:-left-4 @4xl/notes:before:-z-10 @4xl/notes:before:bg-(--iu-foreground)/[0.03] @4xl/notes:before:opacity-0 @4xl/notes:after:inset-x-auto @4xl/notes:after:inset-y-0 @4xl/notes:after:-right-0.5 @4xl/notes:after:h-auto @4xl/notes:after:w-[3px] @4xl/notes:focus-visible:outline-offset-2 @4xl/notes:aria-selected:before:opacity-100 pointer-fine:hover:text-(--iu-foreground)"
                  >
                    <span className="sr-only font-serif italic @4xl/notes:not-sr-only @4xl/notes:text-[17px] @4xl/notes:leading-none">
                      No. {issueNumber(index + 1)}
                    </span>{" "}
                    <span className="text-[13px] font-medium @4xl/notes:text-[15px] @4xl/notes:leading-snug">
                      {givenName} <span className="sr-only @3xl/notes:not-sr-only">{familyName}</span>
                    </span>{" "}
                    <span className="hidden text-[13px] leading-snug text-pretty text-(--iu-muted) @4xl/notes:col-start-2 @4xl/notes:mt-1 @4xl/notes:block">
                      {note.role}, {note.company}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="@container/quote mt-10 flex flex-col @4xl/notes:col-span-7 @4xl/notes:mt-3 @4xl/notes:pl-14 @6xl/notes:col-span-8">
            <div aria-hidden="true" className="flex items-center gap-4">
              <span className="inline-flex items-baseline font-serif text-[1.75rem] leading-none italic">
                No.&nbsp;
                <RollingNumber value={active + 1} />
              </span>
              <span className="h-px flex-1 bg-(--iu-border)" />
              <span className="font-mono text-[11px] text-(--iu-muted) tabular-nums">of {issueNumber(count)}</span>
            </div>

            <div className="relative mt-10 grid flex-1 @4xl/notes:mt-12">
              {/* Hanging punctuation: the opening mark sits in the margin so the text keeps a clean left edge. */}
              <span
                aria-hidden="true"
                className={`pointer-events-none absolute top-0 right-full pr-[0.04em] text-(--iu-accent) select-none ${QUOTE_TYPE}`}
              >
                {"“"}
              </span>

              {notes.map((note, index) => {
                const state = index === active ? "active" : index === selection.previous ? "leaving" : "waiting";
                return (
                  <div
                    key={note.id}
                    ref={(element) => {
                      panelRefs.current[index] = element;
                    }}
                    role="tabpanel"
                    id={panelId(index)}
                    aria-labelledby={tabId(index)}
                    aria-hidden={state === "active" ? undefined : true}
                    tabIndex={state === "active" ? 0 : undefined}
                    data-state={state}
                    className="invisible relative col-start-1 row-start-1 flex flex-col transition-[visibility] delay-[calc(260ms+var(--lines,6)*44ms)] duration-0 [--mn-delay:0ms] [--mn-duration:0ms] [--mn-ease:linear] [--mn-opacity:0] [--mn-shift:-0.5rem] [--mn-stagger:0ms] before:pointer-events-none before:absolute before:-inset-y-2 before:-right-2 before:left-[calc(-0.4*clamp(1.875rem,8.8cqi,3.75rem)_-_0.25rem)] before:rounded-[min(var(--iu-radius),2px)] before:border-2 before:border-(--iu-accent) before:opacity-0 focus-visible:outline-none focus-visible:before:opacity-100 data-[state=active]:visible data-[state=active]:delay-0 data-[state=active]:[--mn-delay:140ms] data-[state=active]:[--mn-duration:260ms,300ms] data-[state=active]:[--mn-ease:cubic-bezier(0.2,0.8,0.2,1)] data-[state=active]:[--mn-opacity:1] data-[state=active]:[--mn-shift:0px] data-[state=active]:[--mn-stagger:48ms] data-[state=leaving]:[--mn-duration:240ms,260ms] data-[state=leaving]:[--mn-ease:cubic-bezier(0.33,1,0.68,1),cubic-bezier(0.32,0,0.67,0)] data-[state=leaving]:[--mn-stagger:44ms] data-[state=ready]:[--mn-shift:0.5rem] motion-reduce:transition-none"
                  >
                    <figure className="flex flex-1 flex-col">
                      <blockquote>
                        <p className="sr-only">{note.quote}</p>
                        <p aria-hidden="true" className={`text-balance dark:text-(--iu-foreground)/90 ${QUOTE_TYPE}`}>
                          <QuoteWords text={note.quote} />
                        </p>
                      </blockquote>
                      <figcaption
                        data-byline
                        className={`flex items-center gap-4 pt-10 @lg/quote:pt-12 @4xl/notes:mt-auto ${LINE_MOTION}`}
                      >
                        <span
                          aria-hidden="true"
                          className="flex size-11 shrink-0 items-center justify-center rounded-[min(var(--iu-radius),2px)] border border-(--iu-foreground)/15 bg-(--iu-background) font-serif text-lg italic dark:bg-(--iu-foreground)/5"
                        >
                          {initials(note.name)}
                        </span>
                        <span className="flex min-w-0 flex-1 flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                          <span className="min-w-0">
                            <span className="block text-[15px] leading-snug font-medium">{note.name}</span>
                            <span className="block text-sm leading-snug text-(--iu-muted)">
                              {note.role}, {note.company}
                            </span>
                          </span>
                          <time
                            dateTime={note.date}
                            className="font-mono text-[11px] tracking-[0.04em] text-(--iu-muted) tabular-nums"
                          >
                            {formatDate(note.date)}
                          </time>
                        </span>
                      </figcaption>
                    </figure>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default MarginNotesTestimonials;
