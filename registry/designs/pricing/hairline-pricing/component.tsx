"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "motion/react";
import { ArrowRight, Check, Minus, RotateCcw, TriangleAlert } from "lucide-react";

export type HairlineBilling = "monthly" | "yearly";
export type HairlineCheckoutStatus = "idle" | "loading" | "error" | "success";

export type HairlinePlan = {
  id: string;
  name: string;
  /** Short name for the comparison table header on phones. */
  shortName?: string;
  summary: string;
  /** Price per seat per month in whole currency units, for each billing period. */
  price: Record<HairlineBilling, number>;
  ctaLabel: string;
  /** Exactly one plan is highlighted: a heavier top rule, a tinted column and the accent action. */
  highlighted?: boolean;
  /** Small label on the highlighted plan. */
  marker?: string;
};

/** true is a check, false a dash, a string is printed as the value (keep it under ten characters). */
export type HairlineValue = boolean | string;
export type HairlineRow = { label: string; values: Record<string, HairlineValue> };

export type HairlinePricingProps = {
  eyebrow?: string;
  section?: string;
  headline?: string;
  subline?: string;
  plans?: HairlinePlan[];
  rows?: HairlineRow[];
  /** Currency symbol printed before every price. */
  currencySymbol?: string;
  unitLabel?: string;
  /** Tax and refund line under the comparison. */
  terms?: string;
  defaultBilling?: HairlineBilling;
  /** Controlled checkout status. Leave unset to let a Promise returned by onCheckout drive it. */
  status?: HairlineCheckoutStatus;
  /** The plan the status belongs to. */
  checkoutPlanId?: string;
  errorMessage?: string;
  successMessage?: string;
  onCheckout?: (planId: string, billing: HairlineBilling) => void | Promise<void>;
  onBillingChange?: (billing: HairlineBilling) => void;
  className?: string;
};

const DEFAULT_PLANS: HairlinePlan[] = [
  {
    id: "solo",
    name: "Solo",
    summary: "One reviewer, side projects and client handoffs.",
    price: { monthly: 12, yearly: 10 },
    ctaLabel: "Choose Solo",
  },
  {
    id: "studio",
    name: "Studio",
    summary: "Product teams that ship and review every week.",
    price: { monthly: 29, yearly: 24 },
    ctaLabel: "Choose Studio",
    highlighted: true,
    marker: "Most teams",
  },
  {
    id: "company",
    name: "Company",
    shortName: "Co.",
    summary: "Several teams, security reviews and audit trails.",
    price: { monthly: 59, yearly: 49 },
    ctaLabel: "Choose Company",
  },
];

const DEFAULT_ROWS: HairlineRow[] = [
  { label: "Review rooms", values: { solo: "3", studio: "Unlimited", company: "Unlimited" } },
  { label: "Guests per room", values: { solo: "5", studio: "25", company: "Unlimited" } },
  { label: "Version history", values: { solo: "30 days", studio: "1 year", company: "Forever" } },
  { label: "Figma and Git sync", values: { solo: true, studio: true, company: true } },
  { label: "Approval workflows", values: { solo: false, studio: true, company: true } },
  { label: "SSO and SCIM", values: { solo: false, studio: false, company: true } },
  { label: "Audit log export", values: { solo: false, studio: false, company: true } },
  { label: "Support", values: { solo: "Email", studio: "Priority", company: "Dedicated" } },
];

const EASE = [0.2, 0.8, 0.2, 1] as const;

function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

function savingPercent(plans: HairlinePlan[]) {
  const best = Math.max(
    0,
    ...plans.map((plan) => (plan.price.monthly > 0 ? 1 - plan.price.yearly / plan.price.monthly : 0)),
  );
  return Math.round(best * 100);
}

function Price({ value, symbol }: { value: number; symbol: string }) {
  return (
    <span data-price className="relative inline-flex h-[1em] items-baseline overflow-hidden leading-none">
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={value}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18, ease: EASE }}
          className="inline-block tabular-nums"
        >
          {symbol}
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function FadeText({ text, className }: { text: string; className?: string }) {
  return (
    <span data-fade className={cx("relative block", className)}>
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={text}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18, ease: EASE }}
          className="block"
        >
          {text}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function CellValue({ value }: { value: HairlineValue }) {
  if (value === true) {
    return (
      <>
        <Check size={16} strokeWidth={1.5} aria-hidden="true" className="text-(--iu-foreground)" />
        <span className="sr-only">Included</span>
      </>
    );
  }
  if (value === false) {
    return (
      <>
        <Minus size={16} strokeWidth={1.5} aria-hidden="true" className="text-(--iu-muted)" />
        <span className="sr-only">Not included</span>
      </>
    );
  }
  return <span className="tabular-nums">{value}</span>;
}

export function HairlinePricing({
  eyebrow = "Lintel · Pricing",
  section = "02 / Plans",
  headline = "Pay for the reviews you run.",
  subline = "Every plan includes unlimited viewers and comments. You pay per editor, the people who open and approve review rooms.",
  plans = DEFAULT_PLANS,
  rows = DEFAULT_ROWS,
  currencySymbol = "$",
  unitLabel = "per editor / month",
  terms = "Prices in USD per editor. VAT or GST is added at checkout where it applies. Cancel anytime, and get a full refund within 30 days of any charge.",
  defaultBilling = "yearly",
  status,
  checkoutPlanId = "studio",
  errorMessage = "Checkout did not open: the payment service timed out. Nothing was charged.",
  successMessage = "Your workspace is upgraded. The receipt is on its way to your billing email.",
  onCheckout,
  onBillingChange,
  className = "",
}: HairlinePricingProps) {
  const reduceMotion = useReducedMotion();
  const titleId = useId();
  const groupName = useId();
  const [billing, setBilling] = useState<HairlineBilling>(defaultBilling);
  const [ownStatus, setOwnStatus] = useState<HairlineCheckoutStatus>("idle");
  const [ownPlanId, setOwnPlanId] = useState(checkoutPlanId);
  const confirmationRef = useRef<HTMLParagraphElement>(null);
  const currentStatus = status ?? ownStatus;
  const currentPlanId = status ? checkoutPlanId : ownPlanId;
  const saving = savingPercent(plans);
  const statusPlan = plans.find((plan) => plan.id === currentPlanId);
  const announcement =
    currentStatus === "loading"
      ? `Opening checkout for ${statusPlan?.name ?? "your plan"}`
      : currentStatus === "success"
        ? `${statusPlan?.name ?? "Plan"} is active. ${successMessage}`
        : "";

  useEffect(() => {
    if (currentStatus === "success" && ownStatus === "success") confirmationRef.current?.focus();
  }, [currentStatus, ownStatus]);

  function chooseBilling(next: HairlineBilling) {
    setBilling(next);
    onBillingChange?.(next);
  }

  function checkout(planId: string) {
    if (currentStatus === "loading") return;
    const result = onCheckout?.(planId, billing);
    if (status !== undefined || !result || typeof result.then !== "function") return;
    setOwnPlanId(planId);
    setOwnStatus("loading");
    result.then(
      () => setOwnStatus("success"),
      () => setOwnStatus("error"),
    );
  }

  const cellPad = "py-[calc(12px*var(--iu-density))]";

  return (
    <MotionConfig reducedMotion="user" transition={reduceMotion ? { duration: 0 } : { duration: 0.18, ease: EASE }}>
      <section
        aria-labelledby={titleId}
        className={`bg-(--iu-background) font-(family-name:--iu-font) text-(--iu-foreground) ${className}`}
      >
        <div className="mx-auto max-w-[1200px] px-6 pt-12 pb-16 sm:px-10 sm:pt-16 sm:pb-24">
          <div className="flex items-baseline justify-between border-b border-(--iu-border) pb-3 text-[11px] font-medium tracking-[0.08em] text-(--iu-muted) uppercase">
            <span>{eyebrow}</span>
            <span className="tabular-nums">{section}</span>
          </div>

          <div className="mt-12 grid grid-cols-12 sm:mt-16">
            <div className="col-span-12 pb-10 lg:col-span-4 lg:row-start-1 lg:pr-10 lg:pb-0">
              <h2
                id={titleId}
                className="max-w-[18ch] text-[clamp(2.5rem,1.9rem+2.4vw,3.5rem)] leading-[1] font-semibold tracking-[-0.035em] text-balance"
              >
                {headline}
              </h2>
              <p className="mt-6 max-w-[34rem] text-base leading-relaxed text-pretty text-(--iu-muted)">{subline}</p>
            </div>

            <div className="col-span-12 pb-10 md:col-span-4 md:pr-8 lg:col-start-1 lg:row-start-2 lg:self-end lg:pt-10 lg:pr-10 lg:pb-6">
              <fieldset>
                <legend className="text-[11px] font-medium tracking-[0.08em] text-(--iu-muted) uppercase">
                  Billing period
                </legend>
                <div className="mt-3 grid grid-cols-2 rounded-[min(var(--iu-radius),6px)] border border-(--iu-foreground)/35 p-0.5">
                  {(["monthly", "yearly"] as const).map((option) => {
                    const checked = billing === option;
                    return (
                      <label
                        key={option}
                        data-billing-option={option}
                        className="relative flex h-10 cursor-pointer items-center justify-center gap-2 rounded-[min(var(--iu-radius),5px)] text-sm font-medium has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-(--iu-accent)"
                      >
                        <input
                          type="radio"
                          name={groupName}
                          value={option}
                          checked={checked}
                          onChange={() => chooseBilling(option)}
                          className="sr-only"
                        />
                        {checked ? (
                          <motion.span
                            layoutId={`${groupName}-thumb`}
                            data-thumb
                            aria-hidden="true"
                            className="absolute inset-0 rounded-[min(var(--iu-radius),5px)] bg-(--iu-foreground)"
                          />
                        ) : null}
                        <span
                          data-option-text
                          className={cx(
                            "relative transition-colors duration-150 motion-reduce:transition-none",
                            checked ? "text-(--iu-background)" : "text-(--iu-foreground)",
                          )}
                        >
                          {option === "monthly" ? "Monthly" : "Yearly"}
                        </span>
                        {option === "yearly" && saving > 0 ? (
                          <span
                            data-option-text
                            className={cx(
                              "relative font-mono text-[11px] tabular-nums transition-colors duration-150 motion-reduce:transition-none",
                              checked ? "text-(--iu-background)" : "text-(--iu-muted)",
                            )}
                          >
                            −{saving}%
                          </span>
                        ) : null}
                      </label>
                    );
                  })}
                </div>
              </fieldset>
              <p className="mt-3 text-[13px] leading-snug text-pretty text-(--iu-muted)">
                Yearly billing saves {saving}% on every plan, two months free.
              </p>
            </div>

            <ul
              aria-label="Plans"
              className="col-span-12 grid border-b border-(--iu-border) md:col-span-8 md:col-start-5 md:grid-cols-3 lg:row-span-2 lg:row-start-1"
            >
              {plans.map((plan, index) => {
                const price = plan.price[billing];
                const yearlyTotal = plan.price.yearly * 12;
                const monthlyTotal = plan.price.monthly * 12;
                const billed =
                  billing === "yearly"
                    ? `Billed ${currencySymbol}${yearlyTotal} yearly, you save ${currencySymbol}${monthlyTotal - yearlyTotal}`
                    : `Billed monthly, ${currencySymbol}${monthlyTotal} a year`;
                const isTarget = plan.id === currentPlanId;
                const loading = isTarget && currentStatus === "loading";
                const done = isTarget && currentStatus === "success";
                return (
                  <li
                    key={plan.id}
                    data-plan={plan.id}
                    className={cx(
                      "flex flex-col px-0 pb-6 md:px-5",
                      index > 0 && "md:border-l md:border-l-(--iu-border)",
                      plan.highlighted
                        ? "border-t-2 border-t-(--iu-foreground) pt-[19px] md:bg-(--iu-foreground)/[0.035] dark:md:bg-(--iu-foreground)/[0.05]"
                        : "border-t border-t-(--iu-border) pt-5",
                    )}
                  >
                    <div className="flex items-baseline justify-between gap-3 text-[11px] font-medium tracking-[0.08em] uppercase">
                      <span className="text-(--iu-muted) tabular-nums">{String(index + 1).padStart(2, "0")}</span>
                      {plan.highlighted && plan.marker ? (
                        <span className="text-(--iu-foreground)">{plan.marker}</span>
                      ) : null}
                    </div>
                    <h3 className="mt-6 text-xl font-semibold tracking-[-0.02em]">{plan.name}</h3>
                    <p className="mt-2 text-sm leading-snug text-pretty text-(--iu-muted) md:min-h-[4lh] xl:min-h-[2lh]">
                      {plan.summary}
                    </p>
                    <p className="mt-8 flex items-baseline gap-2 md:flex-col md:items-start md:gap-1 xl:flex-row xl:items-baseline xl:gap-2">
                      <span className="text-[56px] font-semibold tracking-[-0.04em] md:text-[clamp(2.75rem,1.6rem+2.4vw,4rem)]">
                        <Price value={price} symbol={currencySymbol} />
                      </span>
                      <span className="sr-only">
                        {unitLabel}, {billing === "yearly" ? "billed yearly" : "billed monthly"}
                      </span>
                      <span
                        aria-hidden="true"
                        className="max-w-[6rem] text-xs leading-tight text-(--iu-muted) md:max-w-none xl:max-w-[6rem]"
                      >
                        {unitLabel}
                      </span>
                    </p>
                    <FadeText
                      text={billed}
                      className="mt-2 min-h-[2lh] text-[13px] leading-snug text-(--iu-muted) tabular-nums"
                    />
                    <div className="mt-auto pt-6">
                      {done ? (
                        <p
                          ref={confirmationRef}
                          tabIndex={-1}
                          className="flex min-h-11 items-start gap-2 text-sm leading-snug font-medium outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--iu-accent)"
                        >
                          <span
                            aria-hidden="true"
                            className="mt-px inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-(--iu-foreground) text-(--iu-background)"
                          >
                            <Check size={12} strokeWidth={2} />
                          </span>
                          <span>
                            {plan.name} is active
                            <span className="mt-1 block font-normal text-(--iu-muted)">{successMessage}</span>
                          </span>
                        </p>
                      ) : (
                        <button
                          type="button"
                          onClick={() => checkout(plan.id)}
                          data-checkout={plan.id}
                          aria-label={loading ? "Opening checkout" : plan.ctaLabel}
                          aria-disabled={loading || undefined}
                          className={cx(
                            "group relative flex h-11 w-full items-center justify-between gap-2 overflow-hidden rounded-[min(var(--iu-radius),6px)] px-4 text-sm font-medium whitespace-nowrap transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--iu-accent) motion-reduce:transition-none md:max-lg:px-3",
                            plan.highlighted
                              ? "bg-(--iu-accent) text-(--iu-accent-foreground) pointer-fine:hover:bg-[color-mix(in_oklab,var(--iu-accent)_88%,var(--iu-foreground))]"
                              : "border border-(--iu-foreground)/35 text-(--iu-foreground) pointer-fine:hover:border-(--iu-foreground)",
                            loading && "cursor-progress",
                          )}
                        >
                          <span data-label className="md:max-lg:hidden">
                            {loading ? "Opening checkout" : plan.ctaLabel}
                          </span>
                          <span data-short-label aria-hidden="true" className="hidden md:max-lg:inline">
                            {loading ? "Opening" : plan.name}
                          </span>
                          <ArrowRight
                            size={16}
                            strokeWidth={1.5}
                            aria-hidden="true"
                            className={cx(
                              "shrink-0 transition-transform duration-150 motion-reduce:transition-none md:max-lg:hidden pointer-fine:group-hover:translate-x-0.5",
                              loading && "opacity-0",
                            )}
                          />
                          {loading ? (
                            <motion.span
                              aria-hidden="true"
                              className={cx(
                                "absolute inset-x-0 bottom-0 block h-0.5 origin-left",
                                plan.highlighted ? "bg-(--iu-accent-foreground)" : "bg-(--iu-foreground)",
                              )}
                              initial={{ scaleX: 0.08 }}
                              animate={{ scaleX: 0.92 }}
                              transition={{ duration: reduceMotion ? 0 : 2.4, ease: [0.1, 0.7, 0.3, 1] }}
                            />
                          ) : null}
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {currentStatus === "error" ? (
            <div
              role="alert"
              className="mt-6 flex flex-col gap-4 border-y border-(--iu-border) py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <p className="flex items-start gap-3 text-sm leading-snug">
                <TriangleAlert
                  size={16}
                  strokeWidth={1.5}
                  aria-hidden="true"
                  className="mt-0.5 shrink-0 text-red-700 dark:text-red-400"
                />
                <span>
                  <span className="font-medium">{statusPlan?.name ?? "Checkout"}: </span>
                  <span className="text-(--iu-muted)">{errorMessage}</span>
                </span>
              </p>
              <button
                type="button"
                onClick={() => checkout(currentPlanId)}
                className="inline-flex h-10 shrink-0 items-center gap-2 self-start rounded-[min(var(--iu-radius),6px)] border border-(--iu-foreground)/35 px-4 text-sm font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--iu-accent) motion-reduce:transition-none sm:self-auto pointer-fine:hover:border-(--iu-foreground)"
              >
                <RotateCcw size={16} strokeWidth={1.5} aria-hidden="true" />
                Try again
              </button>
            </div>
          ) : null}
          <span data-announce aria-live="polite" className="sr-only">
            {announcement}
          </span>

          <table className="mt-14 w-full table-fixed border-collapse text-left text-sm sm:mt-20">
            <caption className="pb-4 text-left text-[11px] font-medium tracking-[0.08em] text-(--iu-muted) uppercase">
              Compare plans
            </caption>
            <colgroup>
              <col className="w-[40%] md:w-[33.333%]" />
              {plans.map((plan) => (
                <col key={plan.id} className="w-[20%] md:w-[22.222%]" />
              ))}
            </colgroup>
            <thead>
              <tr className="border-b border-(--iu-foreground)/80">
                <th scope="col" className="pb-2 text-[11px] font-medium tracking-[0.08em] text-(--iu-muted) uppercase">
                  <span className="sr-only">Feature</span>
                </th>
                {plans.map((plan) => (
                  <th
                    key={plan.id}
                    scope="col"
                    className={cx(
                      "px-1 pb-2 text-[11px] font-medium tracking-[0.08em] uppercase md:px-5",
                      plan.highlighted
                        ? "bg-(--iu-foreground)/[0.035] text-(--iu-foreground) dark:bg-(--iu-foreground)/[0.05]"
                        : "text-(--iu-muted)",
                    )}
                  >
                    <span className="md:hidden" aria-hidden="true">
                      {plan.shortName ?? plan.name}
                    </span>
                    <span className="sr-only md:not-sr-only">{plan.name}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label} className="border-b border-(--iu-border)">
                  <th scope="row" className={cx("pr-3 align-top font-normal text-(--iu-muted)", cellPad)}>
                    {row.label}
                  </th>
                  {plans.map((plan) => (
                    <td
                      key={plan.id}
                      className={cx(
                        "px-1 align-top md:px-5",
                        cellPad,
                        plan.highlighted && "bg-(--iu-foreground)/[0.035] dark:bg-(--iu-foreground)/[0.05]",
                      )}
                    >
                      <CellValue value={row.values[plan.id] ?? false} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-6 max-w-[60ch] text-[13px] leading-relaxed text-pretty text-(--iu-muted)">{terms}</p>
        </div>
      </section>
    </MotionConfig>
  );
}

export default HairlinePricing;
