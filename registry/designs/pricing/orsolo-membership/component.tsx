"use client";

import { useId, useState, type CSSProperties } from "react";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "motion/react";
import { ArrowRight, RotateCcw } from "lucide-react";

export type OrsoloTerm = "one" | "two";
export type OrsoloStatus = "idle" | "loading" | "error" | "success";

export type OrsoloTier = {
  id: string;
  numeral: string;
  name: string;
  summary: string;
  /** Price per year in whole currency units on a one-year term. */
  annual: number;
  /** Exactly one tier is the house recommendation; it is selected first. */
  recommended?: boolean;
};

/** A string is printed in serif italic; false prints a quiet dash read as "Not included". */
export type OrsoloBenefit = { label: string; values: Record<string, string | false> };

export type OrsoloWelcome = {
  memberNumber: string;
  concierge: string;
  startsOn: string;
};

export type OrsoloMembershipProps = {
  house?: string;
  kicker?: string;
  headline?: string;
  /** The italic phrase inside the headline. */
  emphasis?: string;
  subline?: string;
  tiers?: OrsoloTier[];
  benefits?: OrsoloBenefit[];
  /** Discount for the two-year term, from 0 to 1. */
  twoYearDiscount?: number;
  currency?: string;
  locale?: string;
  defaultTierId?: string;
  defaultTerm?: OrsoloTerm;
  terms?: string;
  /** Controlled status. Leave unset and return a Promise from onRequest to let the component drive it. */
  status?: OrsoloStatus;
  errorMessage?: string;
  welcome?: OrsoloWelcome;
  onRequest?: (tierId: string, term: OrsoloTerm, total: number) => void | Promise<void>;
  onTierChange?: (tierId: string) => void;
  className?: string;
};

const DEFAULT_TIERS: OrsoloTier[] = [
  {
    id: "voyager",
    numeral: "I",
    name: "Voyager",
    summary: "For two or three journeys a year, planned with care.",
    annual: 1450,
  },
  {
    id: "reserve",
    numeral: "II",
    name: "Reserve",
    summary: "A travel designer who knows your habits, and the hours to match.",
    annual: 3900,
    recommended: true,
  },
  {
    id: "atelier",
    numeral: "III",
    name: "Atelier",
    summary: "One person for every trip, every table and every transfer.",
    annual: 9600,
  },
];

const DEFAULT_BENEFITS: OrsoloBenefit[] = [
  { label: "Concierge reply", values: { voyager: "Same day", reserve: "4 hours", atelier: "1 hour" } },
  { label: "Travel designer", values: { voyager: false, reserve: "Shared", atelier: "Personal" } },
  { label: "Hotel upgrades", values: { voyager: "On request", reserve: "Priority", atelier: "Assured" } },
  { label: "Airport transfers", values: { voyager: false, reserve: "4 a year", atelier: "Unlimited" } },
  { label: "Restaurant tables", values: { voyager: "Standard", reserve: "Priority", atelier: "First call" } },
  { label: "Guest membership", values: { voyager: false, reserve: "1 guest", atelier: "3 guests" } },
];

const DEFAULT_WELCOME: OrsoloWelcome = {
  memberNumber: "0417",
  concierge: "Margaux Lefèvre",
  startsOn: "1 November 2026",
};

const SLOW = [0.22, 0.61, 0.36, 1] as const;
const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--iu-accent)";

function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function SoftSwap({ value, className }: { value: string; className?: string }) {
  return (
    <span className={cx("relative inline-grid", className)}>
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={value}
          initial={{ opacity: 0, scale: 0.985 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.015 }}
          transition={{ duration: 0.4, ease: SLOW }}
          className="col-start-1 row-start-1 inline-block"
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export function OrsoloMembership({
  house = "Orsolo",
  kicker = "Membership · 2027",
  headline = "Travel, arranged quietly.",
  emphasis = "quietly",
  subline = "One annual membership, one person who answers. Choose the attention you would like; we take care of the rest.",
  tiers = DEFAULT_TIERS,
  benefits = DEFAULT_BENEFITS,
  twoYearDiscount = 0.12,
  currency = "EUR",
  locale = "en-GB",
  defaultTierId,
  defaultTerm = "one",
  terms = "Prices include VAT where it applies. Membership begins on acceptance, and you may cancel for a full refund within 14 days.",
  status,
  errorMessage = "Our membership desk could not confirm your place just now. Nothing has been charged.",
  welcome = DEFAULT_WELCOME,
  onRequest,
  onTierChange,
  className = "",
}: OrsoloMembershipProps) {
  const reduceMotion = useReducedMotion();
  const uid = useId();
  const startId = defaultTierId ?? tiers.find((tier) => tier.recommended)?.id ?? tiers[0]?.id ?? "";
  const [tierId, setTierId] = useState(startId);
  const [term, setTerm] = useState<OrsoloTerm>(defaultTerm);
  const [ownStatus, setOwnStatus] = useState<OrsoloStatus>("idle");
  const [played, setPlayed] = useState(false);
  const current = status ?? ownStatus;
  const loading = current === "loading";
  const tierIndex = Math.max(
    0,
    tiers.findIndex((tier) => tier.id === tierId),
  );
  const tier = tiers[tierIndex]!;
  const money = new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 });
  const perYear = (t: OrsoloTier) => (term === "two" ? Math.round(t.annual * (1 - twoYearDiscount)) : t.annual);
  const total = perYear(tier) * (term === "two" ? 2 : 1);
  const saved = term === "two" ? tier.annual * 2 - total : 0;
  const percent = Math.round(twoYearDiscount * 100);
  const [before, after] = headline.includes(emphasis) ? headline.split(emphasis) : [headline, ""];

  function chooseTier(id: string) {
    setTierId(id);
    onTierChange?.(id);
  }

  function request() {
    if (loading) return;
    const result = onRequest?.(tier.id, term, total);
    if (status !== undefined || !result || typeof result.then !== "function") return;
    setPlayed(true);
    setOwnStatus("loading");
    result.then(
      () => setOwnStatus("success"),
      () => setOwnStatus("error"),
    );
  }

  const columns = { "--mm-cols": tiers.length } as CSSProperties;
  const rowPad = "py-[calc(16px*var(--iu-density))]";

  return (
    <MotionConfig reducedMotion="user" transition={reduceMotion ? { duration: 0 } : { duration: 0.45, ease: SLOW }}>
      <section
        aria-labelledby={`${uid}-title`}
        style={columns}
        className={`bg-(--iu-background) font-(family-name:--iu-font) text-(--iu-foreground) ${className}`}
      >
        <div className="mx-auto max-w-[1180px] px-6 py-20 sm:px-10 sm:py-28">
          <header className="mx-auto max-w-[44rem] text-center">
            <p className="text-[11px] font-medium tracking-[0.24em] text-(--iu-muted) uppercase">
              {house} <span aria-hidden="true">·</span> {kicker}
            </p>
            <h2
              id={`${uid}-title`}
              className="mt-8 font-serif text-[clamp(2.75rem,1.8rem+3.6vw,5rem)] leading-[1.02] font-normal tracking-[-0.02em] text-balance"
            >
              {before}
              {after !== undefined && headline.includes(emphasis) ? <em className="italic">{emphasis}</em> : null}
              {after}
            </h2>
            <p className="mx-auto mt-6 max-w-[34rem] text-[15px] leading-relaxed text-pretty text-(--iu-muted)">
              {subline}
            </p>
          </header>

          <fieldset className="mx-auto mt-14 w-fit">
            <legend className="sr-only">Membership term</legend>
            <div className="flex items-center gap-8 border-b border-(--iu-border)">
              {(["one", "two"] as const).map((option) => {
                const checked = term === option;
                return (
                  <label
                    key={option}
                    data-term-option={option}
                    className="relative flex h-11 cursor-pointer items-center gap-2 text-[13px] tracking-[0.04em] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-4 has-[:focus-visible]:outline-(--iu-accent)"
                  >
                    <input
                      type="radio"
                      name={`${uid}-term`}
                      value={option}
                      checked={checked}
                      disabled={loading || current === "success"}
                      onChange={() => setTerm(option)}
                      className="sr-only"
                    />
                    <span data-term-text className={checked ? "text-(--iu-foreground)" : "text-(--iu-muted)"}>
                      {option === "one" ? "One year" : "Two years"}
                    </span>
                    {option === "two" ? (
                      <span className="font-serif text-[15px] text-(--iu-muted) italic">save {percent}%</span>
                    ) : null}
                    {checked ? (
                      <motion.span
                        layoutId={`${uid}-term-line`}
                        data-term-line
                        aria-hidden="true"
                        className="absolute inset-x-0 -bottom-px h-px bg-(--iu-accent)"
                      />
                    ) : null}
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="relative mt-14">
            {/* The frame that glides between columns, from tiers down through the comparison (wide screens). */}
            <motion.div
              aria-hidden="true"
              data-frame
              initial={false}
              animate={{ x: `${tierIndex * 100}%` }}
              className="pointer-events-none absolute inset-y-0 left-[28%] hidden w-[calc(72%/var(--mm-cols))] border border-(--iu-foreground)/45 md:block"
            >
              <span className="absolute inset-[3px] border border-(--iu-foreground)/15" />
              <span className="absolute -top-[4px] left-1/2 size-[7px] -translate-x-1/2 rotate-45 bg-(--iu-accent)" />
            </motion.div>

            <fieldset>
              <legend className="sr-only">Membership tier</legend>
              <div className="grid gap-4 md:grid-cols-[28%_repeat(var(--mm-cols),minmax(0,1fr))] md:gap-0">
                <div className="hidden flex-col justify-end pr-8 pb-8 md:flex">
                  <p className="text-[11px] tracking-[0.24em] text-(--iu-muted) uppercase">Per year</p>
                  <p data-term-note className="mt-3 text-[13px] leading-relaxed text-pretty text-(--iu-muted)">
                    {term === "two"
                      ? `Billed once for two years, ${percent}% below the annual rate.`
                      : "Billed once a year. Two-year terms are offered below the annual rate."}
                  </p>
                </div>
                {tiers.map((item) => {
                  const selected = item.id === tier.id;
                  return (
                    <label
                      key={item.id}
                      data-tier={item.id}
                      className={cx(
                        "relative grid cursor-pointer grid-cols-[minmax(0,1fr)_auto] gap-x-4 px-5 py-6 text-left has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-[-6px] has-[:focus-visible]:outline-(--iu-accent) md:flex md:flex-col md:items-center md:px-6 md:pt-10 md:pb-8 md:text-center",
                        "rounded-[min(var(--iu-radius),2px)] border border-(--iu-border) md:border-0",
                        selected && "max-md:border-(--iu-foreground)/45",
                      )}
                    >
                      <input
                        type="radio"
                        name={`${uid}-tier`}
                        value={item.id}
                        checked={selected}
                        disabled={loading || current === "success"}
                        onChange={() => chooseTier(item.id)}
                        className="sr-only"
                      />
                      {selected ? (
                        <span
                          aria-hidden="true"
                          data-diamond
                          className="absolute -top-[4px] left-1/2 size-[7px] -translate-x-1/2 rotate-45 bg-(--iu-accent) md:hidden"
                        />
                      ) : null}
                      <span aria-hidden="true" className="hidden font-serif text-lg text-(--iu-muted) italic md:block">
                        {item.numeral}
                      </span>
                      <span className="col-start-1 row-start-1 font-serif text-[28px] leading-none md:mt-3 md:text-[32px]">
                        {item.name}
                      </span>
                      <span className="col-start-1 row-start-2 mt-2 text-[10px] tracking-[0.24em] text-(--iu-muted) uppercase md:h-4">
                        {item.recommended ? "The members' choice" : ""}
                      </span>
                      <span className="col-start-2 row-span-2 row-start-1 self-center text-right font-serif text-[34px] leading-none tracking-[-0.02em] tabular-nums md:mt-8 md:text-[clamp(2.75rem,2rem+1.6vw,3.5rem)]">
                        <SoftSwap value={money.format(perYear(item))} />
                        <span
                          aria-hidden="true"
                          className="ml-1 font-(family-name:--iu-font) text-[12px] tracking-normal text-(--iu-muted) md:hidden"
                        >
                          / yr
                        </span>
                        <span className="sr-only"> per year</span>
                      </span>
                      <span className="col-span-2 mt-4 text-[13px] leading-relaxed text-pretty text-(--iu-muted) md:mt-6 md:max-w-[17rem]">
                        {item.summary}
                      </span>
                      <span
                        aria-hidden="true"
                        data-pill
                        className={cx(
                          "mt-8 hidden h-9 items-center rounded-full border px-5 text-[11px] tracking-[0.2em] uppercase transition-colors duration-300 motion-reduce:transition-none md:inline-flex",
                          selected
                            ? "border-(--iu-foreground) bg-(--iu-foreground) text-(--iu-background)"
                            : "border-(--iu-foreground)/35 text-(--iu-foreground)",
                        )}
                      >
                        {selected ? "Selected" : "Select"}
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <table className="mt-10 w-full table-fixed border-collapse text-left md:mt-0">
              <caption className="sr-only">What each membership includes</caption>
              <colgroup>
                <col className="w-[34%] md:w-[28%]" />
                {tiers.map((item) => (
                  <col key={item.id} />
                ))}
              </colgroup>
              <thead className="md:sr-only">
                <tr className="border-b border-(--iu-border)">
                  <th
                    scope="col"
                    className="pb-3 text-[10px] font-normal tracking-[0.24em] text-(--iu-muted) uppercase"
                  >
                    Benefit
                  </th>
                  {tiers.map((item) => (
                    <th
                      key={item.id}
                      data-head={item.id}
                      scope="col"
                      className={cx(
                        "pb-3 text-center font-serif text-[15px] font-normal italic",
                        item.id === tier.id ? "text-(--iu-foreground)" : "text-(--iu-muted)",
                      )}
                    >
                      <span aria-hidden="true">{item.numeral}</span>
                      <span className="sr-only">{item.name}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {benefits.map((benefit) => (
                  <tr key={benefit.label} className="border-t border-(--iu-border)">
                    <th
                      scope="row"
                      className={cx(
                        "pr-3 text-[11px] font-normal tracking-[0.16em] text-(--iu-muted) uppercase md:pr-8 md:tracking-[0.2em]",
                        rowPad,
                      )}
                    >
                      {benefit.label}
                    </th>
                    {tiers.map((item) => {
                      const value = benefit.values[item.id] ?? false;
                      return (
                        <td
                          key={item.id}
                          data-col={item.id}
                          className={cx(
                            "px-1 text-center font-serif text-[15px] italic transition-colors duration-300 motion-reduce:transition-none md:text-lg",
                            rowPad,
                            item.id === tier.id ? "text-(--iu-foreground)" : "text-(--iu-muted)",
                          )}
                        >
                          {value === false ? (
                            <>
                              <span aria-hidden="true">–</span>
                              <span className="sr-only">Not included</span>
                            </>
                          ) : (
                            value
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mx-auto mt-16 max-w-[40rem] border-t border-(--iu-border) pt-12 text-center">
            <AnimatePresence initial={false} mode="wait">
              {current === "success" ? (
                <motion.div
                  key="welcome"
                  data-welcome
                  initial={{ opacity: 0, scale: 0.985 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mx-auto max-w-[30rem] rounded-[min(var(--iu-radius),2px)] border border-(--iu-foreground)/45 p-[3px] text-left"
                >
                  <div className="border border-(--iu-foreground)/15 px-6 py-8 sm:px-10 sm:py-10">
                    <div className="flex items-baseline justify-between gap-4 text-[10px] tracking-[0.24em] text-(--iu-muted) uppercase">
                      <span>{house}</span>
                      <span className="tabular-nums">Nº {welcome.memberNumber}</span>
                    </div>
                    <h3
                      ref={(node) => {
                        // The card mounts after the request panel's exit, so focus moves here once it exists.
                        if (node && played) node.focus();
                      }}
                      tabIndex={-1}
                      className="mt-10 font-serif text-[40px] leading-none outline-none"
                    >
                      Welcome, <em className="italic">member.</em>
                    </h3>
                    <p data-welcome-text className="mt-4 text-[13px] leading-relaxed text-pretty text-(--iu-muted)">
                      Your {tier.name} membership begins on {welcome.startsOn}. {money.format(total)} has been charged
                      for {term === "two" ? "two years" : "one year"}.
                    </p>
                    <div className="mt-8 flex items-center gap-3 border-t border-(--iu-border) pt-6">
                      <span
                        aria-hidden="true"
                        className="inline-flex size-10 items-center justify-center rounded-full border border-(--iu-foreground)/35 font-serif text-[15px] italic"
                      >
                        {initials(welcome.concierge)}
                      </span>
                      <p className="text-[13px] leading-snug">
                        {welcome.concierge}
                        <span className="block text-(--iu-muted)">Your concierge writes within the day</span>
                      </p>
                      <span aria-hidden="true" className="ml-auto size-[7px] rotate-45 bg-(--iu-accent)" />
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="request" data-request-panel exit={{ opacity: 0 }}>
                  <p className="text-[11px] tracking-[0.24em] text-(--iu-muted) uppercase">Your selection</p>
                  <p data-selection className="mt-4 font-serif text-[28px] leading-tight text-balance">
                    <SoftSwap
                      value={`${tier.name}, ${term === "two" ? "two years" : "one year"}, ${money.format(total)}`}
                    />
                  </p>
                  <p data-saved className="mt-2 h-5 text-[13px] text-(--iu-muted) tabular-nums">
                    {saved > 0
                      ? `You save ${money.format(saved)} on the two-year term.`
                      : "Renews each year; no obligation."}
                  </p>

                  {current === "error" ? (
                    <div
                      role="alert"
                      className="mx-auto mt-8 flex max-w-[30rem] items-start gap-3 border-y border-red-700/40 py-4 text-left dark:border-red-400/40"
                    >
                      <span
                        aria-hidden="true"
                        className="mt-1.5 size-[7px] shrink-0 rotate-45 bg-red-700 dark:bg-red-400"
                      />
                      <p className="text-[13px] leading-relaxed text-pretty">
                        <span className="font-medium">Not yet confirmed. </span>
                        <span className="text-(--iu-muted)">{errorMessage}</span>
                      </p>
                    </div>
                  ) : null}

                  <button
                    type="button"
                    onClick={request}
                    data-request
                    aria-disabled={loading || undefined}
                    className={cx(
                      "group relative mt-8 inline-flex h-12 min-w-[16rem] items-center justify-center gap-3 overflow-hidden rounded-full bg-(--iu-foreground) px-8 text-[12px] tracking-[0.2em] text-(--iu-background) uppercase transition-[background-color] duration-300 motion-reduce:transition-none pointer-fine:hover:bg-[color-mix(in_oklab,var(--iu-foreground)_86%,var(--iu-background))]",
                      FOCUS,
                      loading && "cursor-progress",
                    )}
                  >
                    {current === "error" ? <RotateCcw size={14} strokeWidth={1.5} aria-hidden="true" /> : null}
                    <span>
                      {loading ? "Reserving your place" : current === "error" ? "Try again" : "Request membership"}
                    </span>
                    {current === "idle" ? (
                      <ArrowRight
                        size={14}
                        strokeWidth={1.5}
                        aria-hidden="true"
                        className="transition-transform duration-300 motion-reduce:transition-none pointer-fine:group-hover:translate-x-0.5"
                      />
                    ) : null}
                    {loading ? (
                      <motion.span
                        aria-hidden="true"
                        className="absolute inset-x-8 bottom-2.5 h-px origin-left bg-(--iu-background)/70"
                        initial={{ scaleX: 0.04 }}
                        animate={{ scaleX: 0.94 }}
                        transition={{ duration: reduceMotion ? 0 : 3, ease: [0.1, 0.6, 0.3, 1] }}
                      />
                    ) : null}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
            <p className="mx-auto mt-10 max-w-[34rem] text-[12px] leading-relaxed text-pretty text-(--iu-muted)">
              {terms}
            </p>
            <span data-announce aria-live="polite" className="sr-only">
              {loading
                ? `Reserving your place in ${tier.name}`
                : current === "success"
                  ? `Welcome to ${house}. Membership number ${welcome.memberNumber}.`
                  : ""}
            </span>
          </div>
        </div>
      </section>
    </MotionConfig>
  );
}

export default OrsoloMembership;
