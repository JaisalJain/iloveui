"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import {
  AnimatePresence,
  MotionConfig,
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";
import { ArrowUpRight } from "lucide-react";

export type PrivateOfficePeriod = {
  id: string;
  label: string;
  /** Phrase after the gain, for example "this quarter". */
  phrase: string;
  /** Gain over the period in whole currency units. */
  change: number;
  /** Gain as a percentage of the starting value. */
  changePercent: number;
  /** Net worth samples across the period, oldest first. */
  series: number[];
};

export type PrivateOfficeHolding = { label: string; share: number };

export type PrivateOfficeFact = { value: string; label: string };

export type PrivateOfficeHeroProps = {
  house?: string;
  established?: string;
  headline?: string;
  headlineEmphasis?: string;
  subline?: string;
  ctaLabel?: string;
  ctaHref?: string;
  note?: string;
  facts?: PrivateOfficeFact[];
  statementTitle?: string;
  client?: string;
  currency?: string;
  netWorth?: number;
  periods?: PrivateOfficePeriod[];
  defaultPeriod?: string;
  holdings?: PrivateOfficeHolding[];
  banker?: string;
  bankerNote?: string;
  onPeriodChange?: (periodId: string) => void;
  className?: string;
};

const DEFAULT_PERIODS: PrivateOfficePeriod[] = [
  {
    id: "quarter",
    label: "Quarter",
    phrase: "this quarter",
    change: 1284310,
    changePercent: 2.7,
    series: [46.93, 47.12, 46.88, 47.31, 47.42, 47.2, 47.58, 47.66, 47.49, 47.83, 47.98, 48.05, 48.22],
  },
  {
    id: "year",
    label: "Year",
    phrase: "this year",
    change: 4906112,
    changePercent: 11.3,
    series: [43.31, 43.9, 43.52, 44.48, 45.1, 44.71, 45.62, 46.3, 46.04, 46.93, 47.49, 47.83, 48.22],
  },
  {
    id: "five",
    label: "Five years",
    phrase: "over five years",
    change: 17402880,
    changePercent: 56.5,
    series: [30.81, 32.4, 31.2, 33.9, 36.1, 35.2, 37.8, 40.6, 39.9, 42.7, 44.9, 46.3, 48.22],
  },
];

const DEFAULT_HOLDINGS: PrivateOfficeHolding[] = [
  { label: "Equities", share: 42 },
  { label: "Fixed income", share: 28 },
  { label: "Private markets", share: 18 },
  { label: "Cash", share: 12 },
];

const DEFAULT_FACTS: PrivateOfficeFact[] = [
  { value: "One", label: "banker for every family" },
  { value: "24h", label: "to any answer" },
  { value: "1911", label: "independent since" },
];

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function linePath(series: number[], width: number, height: number) {
  const min = Math.min(...series);
  const max = Math.max(...series);
  const span = max - min || 1;
  return series
    .map((value, index) => {
      const x = (index / Math.max(1, series.length - 1)) * width;
      const y = height - ((value - min) / span) * (height - 8) - 4;
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

const LABEL = "text-[10px] font-medium tracking-[0.2em] uppercase";
const INVERSE_MUTED = "text-(--iu-background)/65 dark:text-(--iu-muted)";

export function PrivateOfficeHero({
  house = "Corven & Hale",
  established = "Private office · Zürich · London",
  headline = "Wealth, kept",
  headlineEmphasis = "quietly.",
  subline = "One banker, one statement and every holding in view, for families who would rather think about their wealth four times a year than every day.",
  ctaLabel = "Request an introduction",
  ctaHref = "#introduction",
  note = "Relationships begin at €5 million.",
  facts = DEFAULT_FACTS,
  statementTitle = "Private statement",
  client = "The Valdés-Hartmann family",
  currency = "€",
  netWorth = 48216904,
  periods = DEFAULT_PERIODS,
  defaultPeriod = "year",
  holdings = DEFAULT_HOLDINGS,
  banker = "Céleste Varga",
  bankerNote = "Your banker · in the office until 19:00",
  onPeriodChange,
  className = "",
}: PrivateOfficeHeroProps) {
  const reduceMotion = useReducedMotion();
  const titleId = useId();
  const [periodId, setPeriodId] = useState(defaultPeriod);
  const radioRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const period = periods.find((option) => option.id === periodId) ?? periods[0];
  const format = (value: number) => `${currency}${Math.round(value).toLocaleString("en-GB")}`;

  const change = useMotionValue(period?.change ?? 0);
  const changeText = useTransform(change, (value) => `+${format(value)}`);
  useEffect(() => {
    if (!period) return;
    const controls = animate(change, period.change, {
      duration: reduceMotion ? 0 : 0.5,
      ease: [0.2, 0.8, 0.2, 1],
    });
    return () => controls.stop();
  }, [change, period, reduceMotion]);

  function choose(index: number, focus: boolean) {
    const option = periods[index];
    if (!option) return;
    setPeriodId(option.id);
    onPeriodChange?.(option.id);
    if (focus) radioRefs.current[index]?.focus();
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = periods.length - 1;
    const forward = event.key === "ArrowRight" || event.key === "ArrowDown";
    const back = event.key === "ArrowLeft" || event.key === "ArrowUp";
    if (!forward && !back) return;
    event.preventDefault();
    choose(forward ? (index === last ? 0 : index + 1) : index === 0 ? last : index - 1, true);
  }

  const path = period ? linePath(period.series, 320, 96) : "";
  const endY = (() => {
    if (!period) return 48;
    const min = Math.min(...period.series);
    const max = Math.max(...period.series);
    const last = period.series[period.series.length - 1] ?? max;
    return 96 - ((last - min) / (max - min || 1)) * 88 - 4;
  })();

  return (
    <MotionConfig
      reducedMotion="user"
      transition={reduceMotion ? { duration: 0 } : { duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <section
        aria-labelledby={titleId}
        className={`bg-(--iu-background) font-(family-name:--iu-font) text-(--iu-foreground) ${className}`}
      >
        <div className="mx-auto max-w-[1240px] px-6 py-14 sm:px-10 sm:py-20 lg:py-28">
          <div className="grid grid-cols-12 gap-x-6 gap-y-16 lg:items-center lg:gap-x-16">
            {/* The message: first in reading order, right of the statement on wide screens. */}
            <div className="col-span-12 lg:order-2 lg:col-span-7">
              <p className={`${LABEL} flex flex-wrap gap-x-4 gap-y-1 text-(--iu-muted)`}>
                <span className="text-(--iu-foreground)">{house}</span>
                <span>{established}</span>
              </p>
              <div aria-hidden="true" className="mt-4 h-px w-12 bg-(--iu-accent)" />
              <h1
                id={titleId}
                className="mt-10 font-serif text-[clamp(3.25rem,2rem+5vw,6.5rem)] leading-[0.95] font-normal tracking-[-0.02em] text-balance"
              >
                {headline} <em className="italic">{headlineEmphasis}</em>
              </h1>
              <p className="mt-8 max-w-[30rem] text-[15px] leading-[1.7] text-pretty text-(--iu-muted)">{subline}</p>
              <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4">
                <a
                  href={ctaHref}
                  className="group inline-flex h-12 items-center gap-3 rounded-full border border-(--iu-foreground) bg-(--iu-foreground) pr-5 pl-7 text-[13px] font-medium tracking-[0.04em] text-(--iu-background) transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--iu-accent) motion-reduce:transition-none pointer-fine:hover:bg-transparent pointer-fine:hover:text-(--iu-foreground)"
                >
                  {ctaLabel}
                  <ArrowUpRight
                    size={16}
                    strokeWidth={1.25}
                    aria-hidden="true"
                    className="transition-transform duration-300 motion-reduce:transition-none pointer-fine:group-hover:translate-x-px pointer-fine:group-hover:-translate-y-px"
                  />
                </a>
                <span className="text-[13px] text-(--iu-muted)">{note}</span>
              </div>
              <dl className="mt-16 grid max-w-[34rem] grid-cols-3 border-t border-(--iu-border)">
                {facts.map((fact, index) => (
                  <div key={fact.label} className={`pt-5 ${index > 0 ? "border-l border-(--iu-border) pl-5" : "pr-5"}`}>
                    <dt className="sr-only">{fact.label}</dt>
                    <dd>
                      <span className="block font-serif text-[30px] leading-none tabular-nums">{fact.value}</span>
                      <span className="mt-2 block text-[12px] leading-snug text-(--iu-muted)">{fact.label}</span>
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <figure className="col-span-12 lg:order-1 lg:col-span-5">
              <div className="relative mx-auto max-w-[440px] rounded-[min(var(--iu-radius),2px)] bg-(--iu-foreground) p-2 text-(--iu-background) dark:border dark:border-(--iu-border) dark:bg-(--iu-surface) dark:text-(--iu-foreground)">
                <div className="border border-(--iu-background)/20 px-6 pt-7 pb-6 sm:px-8 dark:border-(--iu-foreground)/10">
                  <figcaption className="text-center">
                    <span className={`${LABEL} ${INVERSE_MUTED} block`}>{statementTitle}</span>
                    <span className="mt-2 block font-serif text-[17px] italic">{client}</span>
                  </figcaption>
                  <div
                    aria-hidden="true"
                    className="mx-auto mt-5 h-px w-full bg-(--iu-background)/20 dark:bg-(--iu-foreground)/10"
                  />

                  <p className="mt-7 text-center">
                    <span className={`${LABEL} ${INVERSE_MUTED} block`}>Net worth</span>
                    <span className="mt-3 block font-serif text-[clamp(2.5rem,1.9rem+2.6vw,3.5rem)] leading-none tracking-[-0.01em] tabular-nums">
                      {format(netWorth)}
                    </span>
                    <span className="mt-3 block text-[13px] tabular-nums">
                      <motion.span>{changeText}</motion.span>
                      <span className={INVERSE_MUTED}>
                        {" "}
                        · {period?.changePercent.toFixed(1)}% {period?.phrase}
                      </span>
                    </span>
                  </p>

                  <div className="relative mt-6 h-24">
                    <svg
                      viewBox="0 0 320 96"
                      preserveAspectRatio="none"
                      aria-hidden="true"
                      className="h-full w-full overflow-visible"
                    >
                      <line
                        x1="0"
                        y1="95.5"
                        x2="320"
                        y2="95.5"
                        stroke="currentColor"
                        strokeOpacity="0.2"
                        strokeWidth="1"
                        vectorEffect="non-scaling-stroke"
                      />
                      <AnimatePresence initial={false}>
                        <motion.path
                          key={period?.id}
                          d={path}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.25"
                          initial={{ pathLength: 0, opacity: 0 }}
                          animate={{ pathLength: 1, opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: reduceMotion ? 0 : 0.6, ease: [0.2, 0.8, 0.2, 1] }}
                        />
                      </AnimatePresence>
                    </svg>
                    <motion.span
                      aria-hidden="true"
                      className="absolute -right-1 size-2 rounded-full bg-(--iu-accent)"
                      initial={false}
                      animate={{ top: endY - 4 }}
                    />
                  </div>
                  <p className="sr-only" aria-live="polite">
                    {period
                      ? `Up ${format(period.change)}, ${period.changePercent.toFixed(1)} percent ${period.phrase}.`
                      : ""}
                  </p>

                  <div role="radiogroup" aria-label="Statement period" className="mt-6 flex justify-center gap-1">
                    {periods.map((option, index) => {
                      const checked = option.id === period?.id;
                      return (
                        <button
                          key={option.id}
                          ref={(node) => {
                            radioRefs.current[index] = node;
                          }}
                          type="button"
                          role="radio"
                          aria-checked={checked}
                          tabIndex={checked ? 0 : -1}
                          onClick={() => choose(index, false)}
                          onKeyDown={(event) => onKeyDown(event, index)}
                          className={`relative h-10 rounded-full px-4 text-[12px] tracking-[0.06em] transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--iu-accent) motion-reduce:transition-none ${
                            checked
                              ? "text-(--iu-background) dark:text-(--iu-foreground)"
                              : `${INVERSE_MUTED} pointer-fine:hover:text-(--iu-background) dark:pointer-fine:hover:text-(--iu-foreground)`
                          }`}
                        >
                          {checked ? (
                            <motion.span
                              layoutId={`${titleId}-period`}
                              aria-hidden="true"
                              className="absolute inset-0 rounded-full border border-(--iu-background)/45 dark:border-(--iu-foreground)/35"
                            />
                          ) : null}
                          <span className="relative">{option.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-7 border-t border-(--iu-background)/20 pt-5 dark:border-(--iu-foreground)/10">
                    <p className={`${LABEL} ${INVERSE_MUTED}`}>Allocation</p>
                    <div aria-hidden="true" className="mt-3 flex h-1 gap-0.5">
                      {holdings.map((holding, index) => (
                        <span
                          key={holding.label}
                          className={
                            index === 0
                              ? "bg-(--iu-background) dark:bg-(--iu-foreground)"
                              : "bg-(--iu-background)/35 dark:bg-(--iu-foreground)/30"
                          }
                          style={{ width: `${holding.share}%` }}
                        />
                      ))}
                    </div>
                    <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-[calc(8px*var(--iu-density))] text-[12px]">
                      {holdings.map((holding) => (
                        <div key={holding.label} className="flex items-baseline justify-between gap-3">
                          <dt className={INVERSE_MUTED}>{holding.label}</dt>
                          <dd className="tabular-nums">{holding.share}%</dd>
                        </div>
                      ))}
                    </dl>
                  </div>

                  <div className="mt-6 flex items-center gap-3 border-t border-(--iu-background)/20 pt-5 dark:border-(--iu-foreground)/10">
                    <span
                      aria-hidden="true"
                      className="inline-flex size-9 items-center justify-center rounded-full border border-(--iu-background)/35 font-serif text-[14px] dark:border-(--iu-foreground)/30"
                    >
                      {initials(banker)}
                    </span>
                    <span className="text-[12px] leading-tight">
                      <span className="block">{banker}</span>
                      <span className={`mt-0.5 block ${INVERSE_MUTED}`}>{bankerNote}</span>
                    </span>
                  </div>
                </div>
              </div>
            </figure>
          </div>
        </div>
      </section>
    </MotionConfig>
  );
}

export default PrivateOfficeHero;
