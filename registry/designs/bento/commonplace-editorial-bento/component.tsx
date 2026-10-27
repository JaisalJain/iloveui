"use client";

import { Fragment, useId, useState } from "react";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "motion/react";
import { Check, Plus } from "lucide-react";

export type CommonplacePassage = { id: string; text: string; page: number };

export type CommonplaceSource = {
  author: string;
  authorShort: string;
  title: string;
  publication: string;
  issue: string;
  date: string;
};

export type CommonplaceQueueItem = { title: string; minutes: number; progress?: number };

export type CommonplaceEditorialBentoProps = {
  issue?: string;
  headline?: string;
  headlineEmphasis?: string;
  standfirst?: string;
  source?: CommonplaceSource;
  /** The excerpt as plain text pieces and highlightable passages, in reading order. */
  excerpt?: (string | CommonplacePassage)[];
  /** Ids of passages already filed in the notebook. */
  defaultFiled?: string[];
  question?: string;
  queue?: CommonplaceQueueItem[];
  resurfaced?: { quote: string; from: string; date: string; note: string };
  onFiledChange?: (ids: string[]) => void;
  /** Called with the filed citations, one per line, after they are copied. */
  onCopyCitations?: (text: string) => void;
  className?: string;
};

const DEFAULT_SOURCE: CommonplaceSource = {
  author: "Margit Halvorsen",
  authorShort: "Halvorsen, M.",
  title: "The quiet return of the night train",
  publication: "The Ferrous Review",
  issue: "14(3)",
  date: "14 September 2026",
};

const DEFAULT_EXCERPT: (string | CommonplacePassage)[] = [
  "When the last sleeper service between Vienna and Paris closed in 2007, the timetable called it a rationalisation. ",
  {
    id: "p1",
    text: "Nineteen years later, the same route sells out its couchettes six weeks ahead,",
    page: 24,
  },
  " and operators are ordering carriages faster than factories can build them. The revival is less about nostalgia than arithmetic: ",
  { id: "p2", text: "a night train turns eleven hours of travel into no hours of lost working day.", page: 24 },
  " Airlines answered with cheaper fares; ",
  { id: "p3", text: "rail answered with a bed, a door that locks and breakfast at the border.", page: 25 },
];

const DEFAULT_QUEUE: CommonplaceQueueItem[] = [
  { title: "The quiet return of the night train", minutes: 18, progress: 62 },
  { title: "A field guide to municipal archives", minutes: 11 },
  { title: "Why ferries still run on paper", minutes: 24 },
  { title: "Letters from the signal box", minutes: 9 },
];

const DEFAULT_RESURFACED = {
  quote: "Every lever in the box was labelled by someone who expected to be forgotten.",
  from: "Letters from the signal box",
  date: "Sun 1 Nov",
  note: "Third return · next in 21 days",
};

function quoteOf(text: string) {
  const trimmed = text.replace(/[,.;]$/, "");
  return `${trimmed.charAt(0).toUpperCase()}${trimmed.slice(1)}.`;
}

const cx = (...parts: (string | false | undefined)[]) => parts.filter(Boolean).join(" ");

const KICKER = "text-[11px] font-medium tracking-[0.14em] text-(--iu-muted) uppercase";
const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--iu-accent)";
const EASE = [0.2, 0.8, 0.2, 1] as const;

function citation(source: CommonplaceSource, page: number) {
  const year = source.date.slice(-4);
  return `${source.authorShort} (${year}). ${source.title}. ${source.publication}, ${source.issue}, ${page}.`;
}

function SectionHead({ numeral, kicker, title }: { numeral: string; kicker: string; title: string }) {
  return (
    <header>
      <p className={KICKER}>
        <span className="font-serif text-sm tracking-normal normal-case italic">{numeral}.</span> {kicker}
      </p>
      <h3 className="mt-3 font-serif text-[28px] leading-[1.1] font-normal tracking-[-0.01em] text-balance">{title}</h3>
    </header>
  );
}

export function CommonplaceEditorialBento({
  issue = "No. 07 · Autumn 2026",
  headline = "Read once.",
  headlineEmphasis = "Keep what you underlined.",
  standfirst = "Commonplace files every passage you mark into a notebook that cites itself, answers questions from your own library and brings the best lines back when you have forgotten them.",
  source = DEFAULT_SOURCE,
  excerpt = DEFAULT_EXCERPT,
  defaultFiled = ["p1", "p2"],
  question = "What have I saved about sleeper-train pricing?",
  queue = DEFAULT_QUEUE,
  resurfaced = DEFAULT_RESURFACED,
  onFiledChange,
  onCopyCitations,
  className = "",
}: CommonplaceEditorialBentoProps) {
  const reduceMotion = useReducedMotion();
  const headingId = useId();
  const notebookId = useId();
  const [filed, setFiled] = useState<string[]>(defaultFiled);
  const [copied, setCopied] = useState(false);
  const passages = excerpt.filter((piece): piece is CommonplacePassage => typeof piece !== "string");
  const notes = passages.filter((passage) => filed.includes(passage.id));
  const queueMinutes = queue.reduce((total, item) => total + item.minutes, 0);

  function toggle(id: string) {
    const next = filed.includes(id) ? filed.filter((value) => value !== id) : [...filed, id];
    setFiled(next);
    onFiledChange?.(next);
  }

  return (
    <MotionConfig reducedMotion="user" transition={reduceMotion ? { duration: 0 } : { duration: 0.32, ease: EASE }}>
      <section
        aria-labelledby={headingId}
        className={cx("bg-(--iu-background) font-(family-name:--iu-font) text-(--iu-foreground)", className)}
      >
        <div className="mx-auto max-w-[1200px] px-6 py-16 sm:px-10 sm:py-24">
          {/* Masthead */}
          <div className="flex items-baseline justify-between gap-4 border-y-[3px] border-double border-(--iu-foreground) py-2">
            <span className="font-serif text-xl italic">Commonplace</span>
            <span className={cx(KICKER, "text-right")}>{issue}</span>
          </div>

          <div className="mt-10 grid grid-cols-12 gap-x-6 gap-y-6 sm:mt-14">
            <h2
              id={headingId}
              className="col-span-12 font-serif text-[clamp(2.75rem,1.6rem+4.4vw,5.25rem)] leading-[0.98] font-normal tracking-[-0.02em] text-balance lg:col-span-8"
            >
              {headline} <em className="italic">{headlineEmphasis}</em>
            </h2>
            <p className="col-span-12 max-w-[34rem] self-end border-l border-(--iu-border) pl-5 text-base leading-[1.6] text-pretty text-(--iu-muted) lg:col-span-4">
              {standfirst}
            </p>
          </div>

          {/* I. Lead feature: highlights filed into a notebook */}
          <article className="mt-14 border-t border-(--iu-foreground) pt-8 sm:mt-20">
            <div className="grid grid-cols-12 gap-x-6 gap-y-10">
              <div className="col-span-12 lg:col-span-7">
                <SectionHead
                  numeral="I"
                  kicker="Highlights"
                  title="Underline a sentence. It files itself, with the citation."
                />
                <figure className="mt-8 rounded-[min(var(--iu-radius),2px)] border border-(--iu-border) bg-(--iu-surface) p-[calc(24px*var(--iu-density))] sm:p-[calc(36px*var(--iu-density))]">
                  <figcaption className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-(--iu-border) pb-3">
                    <span className="font-serif text-lg italic">{source.title}</span>
                    <span className="font-mono text-[11px] text-(--iu-muted)">
                      {source.author} · {source.publication} · p. 24
                    </span>
                  </figcaption>
                  <p className="mt-5 text-[17px] leading-[1.75] text-pretty first-letter:float-left first-letter:mt-1.5 first-letter:mr-2 first-letter:font-serif first-letter:text-[64px] first-letter:leading-[0.8]">
                    {excerpt.map((piece, index) => {
                      if (typeof piece === "string") return <Fragment key={index}>{piece}</Fragment>;
                      const isFiled = filed.includes(piece.id);
                      const number = passages.indexOf(piece) + 1;
                      return (
                        <Fragment key={piece.id}>
                          <span
                            data-passage={piece.id}
                            onClick={() => toggle(piece.id)}
                            className={cx(
                              "cursor-pointer bg-[linear-gradient(var(--iu-accent),var(--iu-accent))] [box-decoration-break:clone] bg-[position:0_100%] bg-no-repeat pb-0.5 transition-[background-size] duration-[400ms] ease-out motion-reduce:transition-none",
                              isFiled
                                ? "bg-[length:100%_2px]"
                                : "bg-[length:0%_2px] underline decoration-(--iu-foreground)/40 decoration-dotted underline-offset-[5px]",
                            )}
                          >
                            {piece.text}
                          </span>
                          <button
                            type="button"
                            data-toggle={piece.id}
                            aria-pressed={isFiled}
                            aria-label={`${isFiled ? "Remove" : "File"} passage ${number}: ${piece.text}`}
                            aria-controls={notebookId}
                            onClick={() => toggle(piece.id)}
                            className={cx(
                              "relative -top-2 mx-0.5 inline-flex size-6 items-center justify-center rounded-full border align-middle font-mono text-[10px] transition-colors duration-200 motion-reduce:transition-none pointer-coarse:size-10",
                              isFiled
                                ? "border-(--iu-foreground) bg-(--iu-foreground) text-(--iu-background)"
                                : "border-(--iu-foreground)/40 text-(--iu-foreground) pointer-fine:hover:border-(--iu-foreground)",
                              FOCUS,
                            )}
                          >
                            {isFiled ? (
                              <Check size={12} strokeWidth={2} aria-hidden="true" />
                            ) : (
                              <Plus size={12} strokeWidth={2} aria-hidden="true" />
                            )}
                          </button>
                        </Fragment>
                      );
                    })}
                  </p>
                </figure>
              </div>

              <aside
                id={notebookId}
                aria-label="Notebook"
                className="col-span-12 lg:col-span-5 lg:border-l lg:border-(--iu-border) lg:pl-6"
              >
                <div className="flex items-baseline justify-between border-b border-(--iu-foreground) pb-2">
                  <span className="font-serif text-xl italic">Notebook</span>
                  <span className="font-mono text-[11px] text-(--iu-muted) tabular-nums" aria-live="polite" data-count>
                    {notes.length} of {passages.length} passages filed
                  </span>
                </div>
                <div data-notes>
                  {notes.length === 0 ? (
                    <div className="py-10">
                      <p className="font-serif text-xl italic">Nothing filed from this piece yet.</p>
                      <p className="mt-2 max-w-[28rem] text-sm leading-relaxed text-(--iu-muted)">
                        Underline a passage on the left, or use the plus beside it. It lands here with its page number
                        and a citation you can paste.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          const first = passages[0];
                          if (first) toggle(first.id);
                        }}
                        className={cx(
                          "mt-5 inline-flex h-10 items-center border-b border-(--iu-foreground) text-sm font-medium",
                          FOCUS,
                        )}
                      >
                        File the first passage
                      </button>
                    </div>
                  ) : (
                    <ol className="flex flex-col">
                      <AnimatePresence initial={false}>
                        {notes.map((note) => (
                          <motion.li
                            key={note.id}
                            layout
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            className="grid grid-cols-[2rem_minmax(0,1fr)] gap-x-3 border-b border-(--iu-border) py-[calc(20px*var(--iu-density))]"
                          >
                            <span className="font-serif text-[32px] leading-none italic tabular-nums">
                              {passages.indexOf(note) + 1}
                            </span>
                            <div>
                              <blockquote className="font-serif text-xl leading-snug text-pretty">
                                “{quoteOf(note.text)}”
                              </blockquote>
                              <p className="mt-3 font-mono text-[11px] leading-relaxed text-(--iu-muted)">
                                {citation(source, note.page)}
                              </p>
                            </div>
                          </motion.li>
                        ))}
                      </AnimatePresence>
                    </ol>
                  )}
                  {notes.length > 0 ? (
                    <div className="flex items-center justify-between gap-4 pt-4">
                      <span className="font-mono text-[11px] text-(--iu-muted)">APA 7 · page numbers kept</span>
                      <button
                        type="button"
                        onClick={() => {
                          const text = notes.map((note) => citation(source, note.page)).join("\n");
                          navigator.clipboard?.writeText(text).catch(() => undefined);
                          onCopyCitations?.(text);
                          setCopied(true);
                          window.setTimeout(() => setCopied(false), 1600);
                        }}
                        className={cx(
                          "inline-flex h-10 items-center border-b border-(--iu-foreground) text-sm font-medium",
                          FOCUS,
                        )}
                      >
                        <span aria-live="polite">
                          {copied ? "Copied" : `Copy ${notes.length} citation${notes.length === 1 ? "" : "s"}`}
                        </span>
                      </button>
                    </div>
                  ) : null}
                </div>
              </aside>
            </div>
          </article>

          {/* II to IV */}
          <div className="mt-14 grid grid-cols-12 gap-y-12 border-t border-(--iu-foreground) pt-8 sm:mt-20 lg:gap-x-0">
            <article className="col-span-12 md:col-span-6 md:pr-6 lg:col-span-5 lg:pr-8">
              <SectionHead numeral="II" kicker="Ask" title="Questions answered from your own shelves." />
              <div className="mt-6 border-t border-(--iu-border) pt-5">
                <p className="font-serif text-xl leading-snug italic">{question}</p>
                <p className="mt-4 text-[15px] leading-[1.65] text-pretty">
                  Two of your sources agree that couchette demand now outruns supply
                  <sup className="ml-0.5 font-mono text-[10px] text-(--iu-muted)">1</sup>, and that operators price
                  berths like hotel rooms rather than seats
                  <sup className="ml-0.5 font-mono text-[10px] text-(--iu-muted)">2</sup>. You have not saved anything
                  on fares before 2024.
                </p>
                <ol className="mt-5 flex flex-col gap-1.5 border-t border-(--iu-border) pt-3 font-mono text-[11px] text-(--iu-muted)">
                  <li>
                    1 · {source.authorShort}, {source.publication}, {source.date}
                  </li>
                  <li>2 · Brandauer, I., Transport Notes, 3 March 2026</li>
                </ol>
              </div>
            </article>

            <article className="col-span-12 md:col-span-6 md:border-l md:border-(--iu-border) md:pl-6 lg:col-span-4 lg:px-8">
              <SectionHead numeral="III" kicker="Queue" title="Tonight’s reading, set like a contents page." />
              <ol className="mt-6 border-t border-(--iu-border)">
                {queue.map((item, index) => (
                  <li key={item.title} className="border-b border-(--iu-border) py-[calc(12px*var(--iu-density))]">
                    <div className="flex items-baseline gap-2">
                      <span className="font-mono text-[11px] text-(--iu-muted) tabular-nums">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="min-w-0 font-serif text-[17px] leading-snug">{item.title}</span>
                      <span
                        aria-hidden="true"
                        className="min-w-4 flex-1 translate-y-[-3px] border-b border-dotted border-(--iu-foreground)/35"
                      />
                      <span className="font-mono text-[11px] whitespace-nowrap tabular-nums">{item.minutes} min</span>
                    </div>
                    {item.progress ? (
                      <p className="mt-1.5 pl-7 font-mono text-[11px] text-(--iu-muted)">
                        {item.progress}% read · resumes at p. 25
                      </p>
                    ) : null}
                  </li>
                ))}
              </ol>
              <p className="mt-3 font-mono text-[11px] text-(--iu-muted) tabular-nums">
                {queue.length} pieces · {queueMinutes} min
              </p>
            </article>

            <article className="col-span-12 lg:col-span-3 lg:border-l lg:border-(--iu-border) lg:pl-8">
              <SectionHead numeral="IV" kicker="Resurface" title="Sundays, an old line returns." />
              <figure className="mt-6 border-t border-(--iu-border) pt-5">
                <p className={KICKER}>{resurfaced.date}</p>
                <blockquote className="mt-3 font-serif text-[26px] leading-[1.15] text-balance italic">
                  “{resurfaced.quote}”
                </blockquote>
                <figcaption className="mt-4 text-sm text-(--iu-muted)">
                  from <span className="font-serif text-base italic">{resurfaced.from}</span>
                  <span className="mt-1 block font-mono text-[11px]">{resurfaced.note}</span>
                </figcaption>
              </figure>
            </article>
          </div>
        </div>
      </section>
    </MotionConfig>
  );
}

export default CommonplaceEditorialBento;
