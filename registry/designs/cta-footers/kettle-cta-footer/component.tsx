"use client";

import { useId, useState, type FormEvent } from "react";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "motion/react";
import { AlertCircle, ArrowRight, Loader2 } from "lucide-react";

export type KettleNewsletterStatus = "idle" | "invalid" | "loading" | "success" | "error";

export type KettleMeal = { day: string; dish: string; minutes: number };

export type KettleLinkGroup = { title: string; links: { label: string; href: string }[] };

export type KettleCtaFooterProps = {
  headline?: string;
  subline?: string;
  ctaLabel?: string;
  ctaHref?: string;
  meals?: KettleMeal[];
  shoppingSummary?: string;
  brand?: string;
  tagline?: string;
  newsletterTitle?: string;
  newsletterHelper?: string;
  linkGroups?: KettleLinkGroup[];
  legal?: string;
  /** Forces a newsletter state, for previews and server-driven flows. Leave unset to let the form manage itself. */
  status?: KettleNewsletterStatus;
  defaultEmail?: string;
  /** Called with a valid email. Return a promise to show loading, then success or (if it rejects) error. */
  onSubscribe?: (email: string) => Promise<void> | void;
  onCtaClick?: () => void;
  className?: string;
};

const DEFAULT_MEALS: KettleMeal[] = [
  { day: "Mon", dish: "Miso aubergine traybake", minutes: 25 },
  { day: "Tue", dish: "Lemon orzo with peas", minutes: 20 },
  { day: "Wed", dish: "Black bean tacos", minutes: 15 },
  { day: "Thu", dish: "Chicken and leek pie", minutes: 40 },
  { day: "Fri", dish: "Pizza night", minutes: 30 },
];

const DEFAULT_LINKS: KettleLinkGroup[] = [
  {
    title: "Product",
    links: [
      { label: "Meal planner", href: "#planner" },
      { label: "Shopping lists", href: "#lists" },
      { label: "Pantry tracker", href: "#pantry" },
      { label: "Pricing", href: "#pricing" },
    ],
  },
  {
    title: "Recipes",
    links: [
      { label: "This week", href: "#this-week" },
      { label: "Under 20 minutes", href: "#quick" },
      { label: "Vegetarian", href: "#vegetarian" },
      { label: "Batch cooking", href: "#batch" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#about" },
      { label: "Careers", href: "#careers" },
      { label: "Press kit", href: "#press" },
      { label: "Contact", href: "#contact" },
    ],
  },
  {
    title: "Help",
    links: [
      { label: "Help centre", href: "#help" },
      { label: "Status", href: "#status" },
      { label: "Privacy", href: "#privacy" },
      { label: "Terms", href: "#terms" },
    ],
  },
];

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--iu-accent)";
const CHUNKY =
  "border-2 border-(--iu-foreground) shadow-[4px_4px_0_var(--iu-foreground)] dark:shadow-[4px_4px_0_color-mix(in_oklab,var(--iu-accent)_55%,transparent)]";

function KettleMark() {
  return (
    <svg viewBox="0 0 32 32" width="32" height="32" aria-hidden="true" className="shrink-0">
      <rect x="5" y="11" width="22" height="17" rx="8" fill="var(--iu-accent)" stroke="currentColor" strokeWidth="2" />
      <rect x="11" y="6" width="10" height="5" rx="2.5" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="19" r="1.6" fill="currentColor" />
      <circle cx="20" cy="19" r="1.6" fill="currentColor" />
      <path d="M13 23c1.8 1.4 4.2 1.4 6 0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function WeekSticker({ meals }: { meals: KettleMeal[] }) {
  return (
    <div className={`relative w-full -rotate-2 rounded-[max(var(--iu-radius),16px)] bg-(--iu-surface) p-4 ${CHUNKY}`}>
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-extrabold tracking-[-0.01em]">This week</span>
        <span className="rounded-full bg-(--iu-foreground) px-2 py-0.5 text-[11px] font-bold text-(--iu-background) tabular-nums">
          {meals.length} dinners
        </span>
      </div>
      <ul className="mt-3 space-y-[calc(6px*var(--iu-density))]">
        {meals.map((meal, index) => (
          <li
            key={meal.day}
            className="flex items-center gap-3 rounded-[12px] bg-(--iu-foreground)/[0.04] px-2.5 py-[calc(6px*var(--iu-density))] dark:bg-(--iu-foreground)/[0.07]"
          >
            <span
              className={`inline-flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold ${
                index === 0
                  ? "bg-(--iu-accent) text-(--iu-accent-foreground)"
                  : "border-2 border-(--iu-foreground)/80 text-(--iu-foreground)"
              }`}
            >
              {meal.day}
            </span>
            <span className="min-w-0 flex-1 truncate text-[13px] font-semibold">{meal.dish}</span>
            <span className="text-[12px] font-semibold text-(--iu-muted) tabular-nums">{meal.minutes}m</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function KettleCtaFooter({
  headline = "Dinner's sorted. All week.",
  subline = "Tell Kettle what's in the fridge and who's eating. Get five dinners and one shopping list in about four minutes.",
  ctaLabel = "Plan this week",
  ctaHref = "#plan",
  meals = DEFAULT_MEALS,
  shoppingSummary = "23 items · £41.80",
  brand = "Kettle",
  tagline = "Weeknight dinners, planned before the kettle boils.",
  newsletterTitle = "The Sunday shortlist",
  newsletterHelper = "Five tested recipes every Sunday morning. Unsubscribe in one click.",
  linkGroups = DEFAULT_LINKS,
  legal = "© 2026 Kettle Kitchen Ltd · Made in Bristol",
  status,
  defaultEmail = "",
  onSubscribe,
  onCtaClick,
  className = "",
}: KettleCtaFooterProps) {
  const reduceMotion = useReducedMotion();
  const ids = useId();
  const [email, setEmail] = useState(defaultEmail);
  const [internal, setInternal] = useState<KettleNewsletterStatus>("idle");
  const [submitted, setSubmitted] = useState(false);
  const current = status ?? internal;
  const messageId = `${ids}-message`;
  const helperId = `${ids}-helper`;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (current === "loading") return;
    setSubmitted(true);
    const value = email.trim();
    if (!EMAIL.test(value)) {
      setInternal("invalid");
      return;
    }
    setInternal("loading");
    try {
      await onSubscribe?.(value);
      setInternal("success");
    } catch {
      setInternal("error");
    }
  }

  function onEmailChange(value: string) {
    setEmail(value);
    if (submitted && internal === "invalid" && EMAIL.test(value.trim())) setInternal("idle");
    if (internal === "error") setInternal("idle");
  }

  const invalid = current === "invalid";
  const message =
    current === "invalid"
      ? email.trim() === ""
        ? "Add your email so we know where to send it."
        : "That doesn't look like an email yet. Try name@example.com."
      : current === "error"
        ? "We couldn't reach our kitchen. Your email is fine, so try again in a moment."
        : "";

  return (
    <MotionConfig
      reducedMotion="user"
      transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 400, damping: 18 }}
    >
      <div className={`bg-(--iu-background) font-(family-name:--iu-font) text-(--iu-foreground) ${className}`}>
        <div className="mx-auto max-w-[1200px] px-5 pt-12 pb-8 sm:px-10 sm:pt-20">
          {/* Call to action */}
          <section
            aria-labelledby={`${ids}-cta`}
            className={`relative overflow-hidden rounded-[max(var(--iu-radius),28px)] border-2 border-(--iu-foreground) bg-[color-mix(in_oklab,var(--iu-accent)_16%,var(--iu-surface))] shadow-[8px_8px_0_var(--iu-foreground)] dark:bg-[color-mix(in_oklab,var(--iu-accent)_10%,var(--iu-surface))] dark:shadow-[8px_8px_0_color-mix(in_oklab,var(--iu-accent)_55%,transparent)]`}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 200 200"
              className="pointer-events-none absolute -top-16 -right-16 size-64 text-(--iu-accent) opacity-25 sm:size-80"
            >
              <circle cx="100" cy="100" r="96" fill="currentColor" />
            </svg>
            <div className="relative grid gap-10 p-7 sm:p-12 md:grid-cols-[1.15fr_1fr] md:items-center">
              <div>
                <span className="inline-block -rotate-3 rounded-full border-2 border-(--iu-foreground) bg-(--iu-surface) px-3 py-1 text-[12px] font-bold">
                  Free for 30 days
                </span>
                <h2
                  id={`${ids}-cta`}
                  className="mt-5 text-[clamp(2.4rem,1.6rem+3.6vw,4.25rem)] leading-[0.95] font-extrabold tracking-[-0.04em] text-balance"
                >
                  {headline}
                </h2>
                <p className="mt-5 max-w-[30rem] text-base leading-relaxed font-medium text-pretty text-(--iu-foreground)/80 sm:text-[17px]">
                  {subline}
                </p>
                <motion.a
                  href={ctaHref}
                  onClick={onCtaClick}
                  whileHover={reduceMotion ? undefined : { rotate: [0, -2.5, 2, 0], transition: { duration: 0.4 } }}
                  className={`group mt-8 inline-flex h-14 items-center gap-2 rounded-full bg-(--iu-accent) px-7 text-[17px] font-extrabold text-(--iu-accent-foreground) transition-[translate,box-shadow] duration-100 active:translate-x-1 active:translate-y-1 active:shadow-none motion-reduce:transition-none ${CHUNKY} ${FOCUS}`}
                >
                  {ctaLabel}
                  <ArrowRight
                    size={20}
                    strokeWidth={2.25}
                    aria-hidden="true"
                    className="transition-transform duration-150 motion-reduce:transition-none pointer-fine:group-hover:translate-x-1"
                  />
                </motion.a>
              </div>
              <div aria-hidden="true" className="flex justify-center pt-2 pb-12 md:justify-end">
                <div className="relative w-full max-w-[300px] lg:max-w-[340px]">
                  <WeekSticker meals={meals} />
                  <span
                    className={`absolute -bottom-7 -left-2 rotate-[5deg] rounded-[16px] bg-(--iu-surface) px-3 py-2 text-[12px] font-bold sm:-left-6 ${CHUNKY}`}
                  >
                    Shopping list
                    <span className="block text-[11px] font-semibold text-(--iu-muted) tabular-nums">
                      {shoppingSummary}
                    </span>
                  </span>
                  <span className="absolute -right-2 -bottom-14 inline-flex size-20 rotate-12 flex-col items-center justify-center rounded-full border-2 border-(--iu-foreground) bg-(--iu-foreground) text-center text-(--iu-background) sm:-right-8">
                    <span className="text-[22px] leading-none font-extrabold tabular-nums">4</span>
                    <span className="text-[10px] leading-tight font-bold">
                      min to
                      <br />
                      plan
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </section>

          <footer>
            <div className="mt-16 grid grid-cols-1 gap-12 sm:mt-20 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
              <div>
                <div className="flex items-center gap-2.5">
                  <KettleMark />
                  <span className="text-[22px] font-extrabold tracking-[-0.03em]">{brand}</span>
                </div>
                <p className="mt-3 max-w-[22rem] text-[14px] font-medium text-(--iu-muted)">{tagline}</p>

                <form noValidate onSubmit={submit} className="mt-8 max-w-[28rem]">
                  <label htmlFor={`${ids}-email`} className="text-[15px] font-extrabold">
                    {newsletterTitle}
                  </label>
                  <p id={helperId} className="mt-1 text-[13px] text-(--iu-muted)">
                    {newsletterHelper}
                  </p>
                  <AnimatePresence initial={false} mode="wait">
                    {current === "success" ? (
                      <motion.div
                        key="success"
                        initial={{ opacity: 0, scale: 0.94 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className={`mt-3 flex min-h-12 items-center gap-3 rounded-[max(var(--iu-radius),20px)] bg-(--iu-surface) px-4 py-3 ${CHUNKY}`}
                      >
                        <svg viewBox="0 0 32 32" width="32" height="32" aria-hidden="true" className="shrink-0">
                          <circle cx="16" cy="16" r="15" fill="var(--iu-accent)" />
                          <motion.path
                            d="M9.5 16.5l4.5 4.5 8.5-9"
                            fill="none"
                            stroke="var(--iu-accent-foreground)"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{
                              duration: reduceMotion ? 0 : 0.35,
                              delay: reduceMotion ? 0 : 0.12,
                              ease: "easeOut",
                            }}
                          />
                        </svg>
                        <span className="text-[14px] leading-snug">
                          <span className="block font-extrabold">You’re on the list.</span>
                          <span className="block text-(--iu-muted)">The first shortlist lands on Sunday at 8:00.</span>
                        </span>
                      </motion.div>
                    ) : (
                      <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <div className="mt-3 flex gap-2">
                          <input
                            id={`${ids}-email`}
                            type="email"
                            name="email"
                            autoComplete="email"
                            inputMode="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(event) => onEmailChange(event.target.value)}
                            disabled={current === "loading"}
                            aria-invalid={invalid || undefined}
                            aria-describedby={message ? `${helperId} ${messageId}` : helperId}
                            className={`h-12 w-0 min-w-0 flex-1 rounded-full border-2 bg-(--iu-surface) px-5 text-[15px] font-medium placeholder:text-(--iu-muted) disabled:opacity-70 ${FOCUS} ${
                              invalid ? "border-red-600 dark:border-red-400" : "border-(--iu-foreground)"
                            }`}
                          />
                          <motion.button
                            type="submit"
                            disabled={current === "loading"}
                            aria-busy={current === "loading" || undefined}
                            animate={invalid && !reduceMotion ? { x: [0, -5, 5, -3, 0] } : { x: 0 }}
                            transition={{ duration: 0.35 }}
                            className={`relative inline-flex h-12 shrink-0 items-center justify-center rounded-full bg-(--iu-foreground) px-5 text-[15px] font-extrabold text-(--iu-background) transition-[translate,box-shadow] duration-100 active:translate-x-1 active:translate-y-1 active:shadow-none disabled:cursor-progress motion-reduce:transition-none ${CHUNKY} ${FOCUS}`}
                          >
                            <span className={current === "loading" ? "invisible" : ""}>Subscribe</span>
                            {current === "loading" ? (
                              <span className="absolute inset-0 flex items-center justify-center">
                                <Loader2
                                  size={20}
                                  strokeWidth={2.25}
                                  aria-hidden="true"
                                  className="animate-spin motion-reduce:animate-none"
                                />
                                <span className="sr-only">Subscribing</span>
                              </span>
                            ) : null}
                          </motion.button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <p
                    id={messageId}
                    aria-live="polite"
                    className={`mt-2 flex min-h-5 items-start gap-1.5 text-[13px] font-semibold ${
                      message ? "text-red-700 dark:text-red-300" : ""
                    }`}
                  >
                    {message ? (
                      <>
                        <AlertCircle size={16} strokeWidth={2} aria-hidden="true" className="mt-px shrink-0" />
                        {message}
                      </>
                    ) : current === "success" ? (
                      <span className="sr-only">Subscribed. The first shortlist lands on Sunday.</span>
                    ) : null}
                  </p>
                </form>
              </div>

              <nav aria-label="Footer" className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4">
                {linkGroups.map((group) => (
                  <div key={group.title}>
                    <h3 className="text-[13px] font-extrabold">{group.title}</h3>
                    <ul className="mt-3 space-y-1">
                      {group.links.map((link) => (
                        <li key={link.label}>
                          <a
                            href={link.href}
                            className={`-mx-2 inline-flex min-h-8 items-center rounded-full px-2 text-[14px] font-medium text-(--iu-muted) transition-colors duration-150 motion-reduce:transition-none pointer-coarse:min-h-10 pointer-fine:hover:bg-[color-mix(in_oklab,var(--iu-accent)_14%,transparent)] pointer-fine:hover:text-(--iu-foreground) ${FOCUS}`}
                          >
                            {link.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </nav>
            </div>

            <div className="mt-14 flex flex-col gap-3 border-t-2 border-dashed border-(--iu-foreground)/20 pt-6 text-[13px] font-medium text-(--iu-muted) sm:flex-row sm:items-center sm:justify-between">
              <p>{legal}</p>
              <p className="flex gap-4">
                <a
                  href="#instagram"
                  className={`inline-flex min-h-6 items-center rounded-full pointer-coarse:min-h-10 pointer-fine:hover:text-(--iu-foreground) ${FOCUS}`}
                >
                  Instagram
                </a>
                <a
                  href="#tiktok"
                  className={`inline-flex min-h-6 items-center rounded-full pointer-coarse:min-h-10 pointer-fine:hover:text-(--iu-foreground) ${FOCUS}`}
                >
                  TikTok
                </a>
                <a
                  href="#rss"
                  className={`inline-flex min-h-6 items-center rounded-full pointer-coarse:min-h-10 pointer-fine:hover:text-(--iu-foreground) ${FOCUS}`}
                >
                  Recipe RSS
                </a>
              </p>
            </div>
          </footer>
        </div>
      </div>
    </MotionConfig>
  );
}

export default KettleCtaFooter;
