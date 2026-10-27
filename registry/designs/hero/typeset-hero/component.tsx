"use client";

import { useId, useRef, useState, type KeyboardEvent } from "react";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "motion/react";
import { ArrowRight, Check } from "lucide-react";

export type TypesetFormat = "print" | "web" | "newsletter";

export type TypesetFormatOption = {
  id: TypesetFormat;
  label: string;
  /** Page spec shown in mono beside the tabs, for example "A4 · 2 columns". */
  spec: string;
};

export type TypesetArticle = {
  publication: string;
  domain: string;
  section: string;
  issue: string;
  title: string;
  dek: string;
  author: string;
  date: string;
  paragraphs: string[];
  pullQuote: string;
};

export type TypesetHeroProps = {
  brand?: string;
  kicker?: string;
  /** The start of the one message. */
  headline?: string;
  /** The phrase set in italic serif at the end of the headline. */
  headlineEmphasis?: string;
  subline?: string;
  ctaLabel?: string;
  ctaHref?: string;
  note?: string;
  documentPath?: string;
  wordCount?: string;
  article?: TypesetArticle;
  formats?: TypesetFormatOption[];
  defaultFormat?: TypesetFormat;
  onFormatChange?: (format: TypesetFormat) => void;
  className?: string;
};

const DEFAULT_FORMATS: TypesetFormatOption[] = [
  { id: "print", label: "Print", spec: "A4 · 2 columns" },
  { id: "web", label: "Web", spec: "680px · 1 column" },
  { id: "newsletter", label: "Newsletter", spec: "600px · email-safe" },
];

const DEFAULT_ARTICLE: TypesetArticle = {
  publication: "The Platform",
  domain: "theplatform.press",
  section: "Travel · Essay",
  issue: "No. 14",
  title: "The slow return of the night train",
  dek: "Europe's sleepers are full again. Nobody planned for it, least of all the railways.",
  author: "Ines Albrecht",
  date: "14 October 2026",
  paragraphs: [
    "At four minutes past nine the sleeper leaves Vienna with its blinds half drawn. By the time the attendant has collected the breakfast cards, Salzburg is a smear of platform light and the compartment has become, improbably, a bedroom.",
    "Ridership on European sleeper routes rose thirty-one percent between 2023 and 2025, and operators are adding carriages faster than they can find people to staff them. The demand surprised everyone who had spent a decade retiring the stock.",
    "What passengers describe is less a timetable than a temperament: the refusal to hurry, the pleasure of arriving somewhere already rested, the strange intimacy of strangers brushing their teeth in a corridor at dawn.",
  ],
  pullQuote: "A sleeper is a hotel that happens to be moving.",
};

function cx(...values: (string | false | undefined)[]) {
  return values.filter(Boolean).join(" ");
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const BODY = "leading-[1.6] text-(--iu-foreground)/85";

function PrintPage({ article }: { article: TypesetArticle }) {
  const [first, ...rest] = article.paragraphs;
  return (
    <div className="bg-(--iu-surface) px-5 py-6 @md:px-9 @md:py-8">
      <div className="flex items-baseline justify-between gap-4 font-mono text-[10px] tracking-[0.12em] text-(--iu-muted) uppercase">
        <span>{article.section}</span>
        <span className="tabular-nums">{article.issue}</span>
      </div>
      <div aria-hidden="true" className="mt-2 border-t-[3px] border-double border-(--iu-foreground)/70" />
      <p className="mt-5 font-serif text-[30px] leading-[1.02] tracking-[-0.01em] text-balance @md:text-[42px]">
        {article.title}
      </p>
      <p className="mt-3 max-w-[30rem] font-serif text-[16px] leading-snug text-pretty text-(--iu-muted) italic @md:text-[18px]">
        {article.dek}
      </p>
      <p className="mt-4 text-[10px] font-medium tracking-[0.14em] text-(--iu-muted) uppercase">
        By {article.author} <span aria-hidden="true">·</span> {article.date}
      </p>
      <div
        className={cx(
          BODY,
          "mt-6 gap-8 border-t border-(--iu-border) pt-5 text-[13px] hyphens-auto @md:columns-2 @md:text-justify",
          "[column-rule:1px_solid_var(--iu-border)]",
        )}
      >
        <p className="first-letter:float-left first-letter:mt-1 first-letter:mr-1.5 first-letter:font-serif first-letter:text-[52px] first-letter:leading-[0.8] first-letter:text-(--iu-accent)">
          {first}
        </p>
        <p className="mt-3">{rest[0]}</p>
        <p className="my-5 break-inside-avoid border-y border-(--iu-foreground)/60 py-3 font-serif text-[20px] leading-[1.15] text-(--iu-foreground) italic @md:text-left">
          “{article.pullQuote}”
        </p>
        {rest.slice(1).map((paragraph) => (
          <p key={paragraph.slice(0, 24)} className="mt-3 first:mt-0">
            {paragraph}
          </p>
        ))}
      </div>
      <div className="mt-6 flex justify-between border-t border-(--iu-border) pt-2 font-mono text-[10px] text-(--iu-muted) tabular-nums">
        <span>{article.publication}</span>
        <span>p. 14</span>
      </div>
    </div>
  );
}

function WebPage({ article }: { article: TypesetArticle }) {
  const [first, second] = article.paragraphs;
  return (
    <div className="bg-(--iu-surface)">
      <div className="flex items-center justify-between gap-3 border-b border-(--iu-border) px-5 py-2.5 @md:px-8">
        <span className="font-serif text-[17px] italic">{article.publication}</span>
        <span className="font-mono text-[10px] text-(--iu-muted)">
          {article.domain}/{article.section.split(" ")[0]?.toLowerCase()}
        </span>
      </div>
      <div className="mx-auto max-w-[34rem] px-5 py-7 @md:px-8 @md:py-10">
        <p className="font-mono text-[10px] tracking-[0.12em] text-(--iu-muted) uppercase">{article.section}</p>
        <p className="mt-3 font-serif text-[30px] leading-[1.04] tracking-[-0.01em] text-balance @md:text-[38px]">
          {article.title}
        </p>
        <p className="mt-3 text-[15px] leading-snug text-pretty text-(--iu-muted)">{article.dek}</p>
        <div className="mt-5 flex items-center gap-3">
          <span
            aria-hidden="true"
            className="inline-flex size-7 items-center justify-center rounded-full bg-(--iu-foreground)/8 text-[10px] font-semibold text-(--iu-foreground)"
          >
            {initials(article.author)}
          </span>
          <span className="text-[12px] leading-tight">
            <span className="block font-medium">{article.author}</span>
            <span className="block text-(--iu-muted)">{article.date} · 6 min read</span>
          </span>
        </div>
        <div className={cx(BODY, "mt-6 text-[14px] text-pretty")}>
          <p>{first}</p>
          <p className="my-5 border-l-2 border-(--iu-accent) pl-4 font-serif text-[22px] leading-[1.15] text-(--iu-foreground) italic">
            “{article.pullQuote}”
          </p>
          <p>{second}</p>
        </div>
      </div>
    </div>
  );
}

function NewsletterPage({ article }: { article: TypesetArticle }) {
  return (
    <div className="mx-auto max-w-[24rem] border border-(--iu-border) bg-(--iu-surface) px-6 py-7 dark:border-(--iu-foreground)/10">
      <div className="text-center">
        <p className="font-serif text-[26px] leading-none">{article.publication}</p>
        <p className="mt-2 font-mono text-[10px] tracking-[0.12em] text-(--iu-muted) uppercase tabular-nums">
          Sunday edition · {article.issue}
        </p>
      </div>
      <div aria-hidden="true" className="mt-4 border-t-[3px] border-double border-(--iu-foreground)/70" />
      <p className="mt-5 font-serif text-[26px] leading-[1.05] text-balance">{article.title}</p>
      <p className="mt-2 text-[11px] text-(--iu-muted)">
        {article.author} · {article.date}
      </p>
      <p className={cx(BODY, "mt-4 text-[14px] text-pretty")}>{article.paragraphs[0]}</p>
      <span className="mt-5 inline-flex h-9 items-center gap-2 bg-(--iu-foreground) px-4 text-[13px] font-medium text-(--iu-background)">
        Continue reading
        <ArrowRight size={14} strokeWidth={1.5} aria-hidden="true" />
      </span>
      <p className="mt-7 border-t border-(--iu-border) pt-3 text-[10px] leading-relaxed text-(--iu-muted)">
        You subscribed at {article.domain}. Manage preferences or unsubscribe at any time.
      </p>
    </div>
  );
}

export function TypesetHero({
  brand = "Quire",
  kicker = "For independent publications",
  headline = "One draft, typeset for",
  headlineEmphasis = "every page.",
  subline = "Write in a calm editor. Quire sets the same story for your website, your newsletter and a print-ready PDF, with the hyphenation and hanging punctuation a designer would fuss over.",
  ctaLabel = "Start your first issue",
  ctaHref = "#start",
  note = "Free for one publication.",
  documentPath = "Issue 14 / Night trains",
  wordCount = "1,284 words",
  article = DEFAULT_ARTICLE,
  formats = DEFAULT_FORMATS,
  defaultFormat = "print",
  onFormatChange,
  className = "",
}: TypesetHeroProps) {
  const reduceMotion = useReducedMotion();
  const titleId = useId();
  const baseId = useId();
  const [format, setFormat] = useState<TypesetFormat>(defaultFormat);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const active = formats.find((option) => option.id === format) ?? formats[0];

  function select(index: number) {
    const option = formats[index];
    if (!option) return;
    setFormat(option.id);
    onFormatChange?.(option.id);
    tabRefs.current[index]?.focus();
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = formats.length - 1;
    const next =
      event.key === "ArrowRight"
        ? index === last
          ? 0
          : index + 1
        : event.key === "ArrowLeft"
          ? index === 0
            ? last
            : index - 1
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? last
              : null;
    if (next === null) return;
    event.preventDefault();
    select(next);
  }

  return (
    <MotionConfig
      reducedMotion="user"
      transition={reduceMotion ? { duration: 0 } : { duration: 0.32, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <section
        aria-labelledby={titleId}
        className={`bg-(--iu-background) font-(family-name:--iu-font) text-(--iu-foreground) ${className}`}
      >
        <div className="mx-auto max-w-[1240px] px-6 pt-10 pb-16 sm:px-10 sm:pt-14 sm:pb-24">
          <div className="flex items-baseline justify-between gap-4 border-b-[3px] border-double border-(--iu-foreground)/70 pb-3">
            <span className="font-serif text-[22px] leading-none italic">{brand}</span>
            <span className="font-mono text-[11px] tracking-[0.08em] text-(--iu-muted) uppercase tabular-nums">
              Vol. 3 · Autumn 2026
            </span>
          </div>

          <div className="mt-12 grid grid-cols-12 gap-x-6 gap-y-14 sm:mt-16 lg:gap-x-12">
            <div className="col-span-12 flex flex-col lg:col-span-5 lg:pt-6">
              <p className="flex items-center gap-3 text-[11px] font-medium tracking-[0.16em] text-(--iu-muted) uppercase">
                <span aria-hidden="true" className="h-px w-8 bg-(--iu-accent)" />
                {kicker}
              </p>
              <h1
                id={titleId}
                className="mt-6 font-serif text-[clamp(3rem,1.9rem+4.6vw,5.75rem)] leading-[0.94] font-normal tracking-[-0.02em] text-balance"
              >
                {headline} <em className="italic">{headlineEmphasis}</em>
              </h1>
              <p className="mt-7 max-w-[32rem] text-base leading-[1.6] text-pretty text-(--iu-muted) sm:text-[17px]">
                {subline}
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4">
                <a
                  href={ctaHref}
                  className="group inline-flex h-11 items-center gap-2 rounded-[min(var(--iu-radius),2px)] bg-(--iu-foreground) px-5 text-sm font-medium text-(--iu-background) transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--iu-accent) motion-reduce:transition-none pointer-fine:hover:bg-[color-mix(in_oklab,var(--iu-foreground)_84%,var(--iu-background))]"
                >
                  {ctaLabel}
                  <ArrowRight
                    size={16}
                    strokeWidth={1.5}
                    aria-hidden="true"
                    className="transition-transform duration-200 motion-reduce:transition-none pointer-fine:group-hover:translate-x-0.5"
                  />
                </a>
                <span className="text-sm text-(--iu-muted)">{note}</span>
              </div>
              <p className="mt-auto hidden pt-14 font-mono text-[11px] leading-relaxed text-(--iu-muted) lg:block">
                Fig. 1 — One manuscript, three outputs. Switch the format to see the same story reset.
              </p>
            </div>

            <figure className="@container col-span-12 lg:col-span-7">
              <div className="rounded-[min(var(--iu-radius),2px)] border border-(--iu-border) bg-(--iu-surface) dark:border-(--iu-foreground)/14">
                <div className="flex items-center justify-between gap-4 border-b border-(--iu-border) px-4 py-[calc(10px*var(--iu-density))]">
                  <figcaption className="min-w-0 truncate text-[13px] font-medium">{documentPath}</figcaption>
                  <span className="inline-flex shrink-0 items-center gap-1.5 font-mono text-[11px] text-(--iu-muted) tabular-nums">
                    <Check size={12} strokeWidth={1.75} aria-hidden="true" />
                    Saved · {wordCount}
                  </span>
                </div>
                <div className="flex items-end justify-between gap-4 border-b border-(--iu-border) px-2 @md:px-3">
                  <div role="tablist" aria-label="Output format" className="flex">
                    {formats.map((option, index) => {
                      const selected = option.id === format;
                      return (
                        <button
                          key={option.id}
                          ref={(node) => {
                            tabRefs.current[index] = node;
                          }}
                          id={`${baseId}-tab-${option.id}`}
                          type="button"
                          role="tab"
                          aria-selected={selected}
                          aria-controls={`${baseId}-panel`}
                          tabIndex={selected ? 0 : -1}
                          onClick={() => select(index)}
                          onKeyDown={(event) => onKeyDown(event, index)}
                          className={cx(
                            "relative h-10 px-3 text-[13px] transition-colors duration-200 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-(--iu-accent) motion-reduce:transition-none",
                            selected
                              ? "font-medium text-(--iu-foreground)"
                              : "text-(--iu-muted) pointer-fine:hover:text-(--iu-foreground)",
                          )}
                        >
                          {option.label}
                          {selected ? (
                            <motion.span
                              layoutId={`${baseId}-underline`}
                              aria-hidden="true"
                              className="absolute inset-x-3 -bottom-px h-0.5 bg-(--iu-accent)"
                            />
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                  <AnimatePresence initial={false} mode="wait">
                    <motion.span
                      key={active?.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: reduceMotion ? 0 : 0.2 }}
                      className="hidden pb-3 font-mono text-[11px] text-(--iu-muted) tabular-nums @md:block"
                    >
                      {active?.spec}
                    </motion.span>
                  </AnimatePresence>
                </div>
                <div
                  id={`${baseId}-panel`}
                  role="tabpanel"
                  aria-labelledby={`${baseId}-tab-${format}`}
                  className="bg-(--iu-foreground)/[0.035] p-3 @md:min-h-[600px] @md:p-6 dark:bg-(--iu-background)"
                >
                  <AnimatePresence initial={false} mode="wait">
                    <motion.div
                      key={format}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className={
                        format === "newsletter" ? "" : "border border-(--iu-border) dark:border-(--iu-foreground)/10"
                      }
                    >
                      {format === "print" ? (
                        <PrintPage article={article} />
                      ) : format === "web" ? (
                        <WebPage article={article} />
                      ) : (
                        <NewsletterPage article={article} />
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </figure>
          </div>
        </div>
      </section>
    </MotionConfig>
  );
}

export default TypesetHero;
