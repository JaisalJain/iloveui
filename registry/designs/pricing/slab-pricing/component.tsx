"use client";

import { useEffect, useId, useRef, useState, type CSSProperties, type RefObject } from "react";
import { ArrowRight, Check, RotateCcw, TriangleAlert } from "lucide-react";

export type SlabBilling = "monthly" | "yearly";
export type SlabCheckoutStatus = "idle" | "loading" | "error" | "success";

export type SlabPlan = {
  id: string;
  name: string;
  tagline: string;
  /** Price per month in whole currency units, for each billing period. */
  price: Record<SlabBilling, number>;
  /** The included volume, set as a label under the price. */
  quota: string;
  /** What happens past the included volume. */
  overage: string;
  /** Replaces the line under the price for a billing period ("Free forever"). */
  note?: Partial<Record<SlabBilling, string>>;
  /** Plan this one builds on, for the "Everything in Starter, plus" line. */
  everythingIn?: string;
  highlights: string[];
  ctaLabel: string;
  /** Exactly one plan is highlighted: it gets the accent band, the deeper shadow and the accent action. */
  highlighted?: boolean;
  badge?: string;
};

/** true is a check, false a dash, a string is printed as the value. */
export type SlabFeatureValue = boolean | string;
export type SlabFeatureRow = { label: string; values: Record<string, SlabFeatureValue> };
export type SlabFeatureGroup = { title: string; rows: SlabFeatureRow[] };
export type SlabTerm = { label: string; text: string };
export type SlabCheckoutError = { title: string; detail: string; code?: string };
export type SlabOrder = {
  reference: string;
  placedOn: string;
  paymentMethod: string;
  taxLabel: string;
  /** Tax applied to the subtotal, from 0 to 1. */
  taxRate: number;
  renewsOn: Record<SlabBilling, string>;
};

export type SlabPricingProps = {
  eyebrow?: string;
  headline?: string;
  subline?: string;
  plans?: SlabPlan[];
  featureGroups?: SlabFeatureGroup[];
  /** Currency, tax, cancellation and refund terms, shown under the plans. */
  terms?: SlabTerm[];
  compareTitle?: string;
  /** ISO 4217 code used to format every price. */
  currency?: string;
  locale?: string;
  /** Text of the sticker on the billing switch. */
  savingLabel?: string;
  defaultBilling?: SlabBilling;
  /** Controls the billing period; pair it with onBillingChange. */
  billing?: SlabBilling;
  onBillingChange?: (billing: SlabBilling) => void;
  /** Controls the checkout state. Leave it unset and return a promise from onCheckout to let the component track it. */
  status?: SlabCheckoutStatus;
  /** Plan the checkout state belongs to; defaults to the highlighted plan. */
  checkoutPlanId?: string;
  onCheckout?: (planId: string, billing: SlabBilling) => void | Promise<unknown>;
  checkoutError?: SlabCheckoutError;
  order?: SlabOrder;
  continueLabel?: string;
  continueHref?: string;
  className?: string;
};

const DEFAULT_PLANS: SlabPlan[] = [
  {
    id: "starter",
    name: "Starter",
    tagline: "For side projects and first integrations.",
    price: { monthly: 29, yearly: 23 },
    quota: "250K events / mo",
    overage: "then $1.20 per 100K",
    highlights: ["10 endpoints", "3-day delivery log", "Retries for 24 hours", "HMAC-signed payloads"],
    ctaLabel: "Choose Starter",
  },
  {
    id: "team",
    name: "Team",
    tagline: "For products running webhooks in production.",
    price: { monthly: 79, yearly: 63 },
    quota: "2M events / mo",
    overage: "then $0.80 per 100K",
    everythingIn: "Starter",
    highlights: ["100 endpoints", "30-day log with replay", "Retries for 3 days", "Static egress IPs"],
    ctaLabel: "Choose Team",
    highlighted: true,
    badge: "Recommended",
  },
  {
    id: "scale",
    name: "Scale",
    tagline: "For platforms delivering to thousands of customers.",
    price: { monthly: 249, yearly: 199 },
    quota: "12M events / mo",
    overage: "then $0.45 per 100K",
    everythingIn: "Team",
    highlights: ["Unlimited endpoints", "90-day log with replay", "SAML SSO and audit log", "99.99% uptime SLA"],
    ctaLabel: "Choose Scale",
  },
];

const DEFAULT_FEATURE_GROUPS: SlabFeatureGroup[] = [
  {
    title: "Usage",
    rows: [
      { label: "Events per month", values: { starter: "250K", team: "2M", scale: "12M" } },
      { label: "Extra 100K events", values: { starter: "$1.20", team: "$0.80", scale: "$0.45" } },
      { label: "Endpoints", values: { starter: "10", team: "100", scale: "Unlimited" } },
      { label: "Delivery log", values: { starter: "3 days", team: "30 days", scale: "90 days" } },
    ],
  },
  {
    title: "Delivery",
    rows: [
      { label: "HMAC-signed payloads", values: { starter: true, team: true, scale: true } },
      { label: "Automatic retries", values: { starter: "24 hours", team: "3 days", scale: "7 days" } },
      { label: "Replay from the log", values: { starter: false, team: true, scale: true } },
      { label: "Static egress IPs", values: { starter: false, team: true, scale: true } },
      { label: "Delivery regions", values: { starter: "1", team: "3", scale: "6" } },
    ],
  },
  {
    title: "Security and support",
    rows: [
      { label: "SAML SSO and audit log", values: { starter: false, team: false, scale: true } },
      { label: "Uptime SLA", values: { starter: false, team: "99.9%", scale: "99.99%" } },
      { label: "Support", values: { starter: "Forum", team: "Email, 1 day", scale: "Engineer, 1 hour" } },
    ],
  },
];

const DEFAULT_TERMS: SlabTerm[] = [
  { label: "Currency", text: "Prices are in US dollars." },
  { label: "Tax", text: "Sales tax or VAT is added at checkout from your billing address." },
  { label: "Cancel", text: "Cancel anytime in Settings. Access runs to the end of the paid period." },
  { label: "Refunds", text: "Full refund within 14 days of any charge, no questions asked." },
];

const DEFAULT_ERROR: SlabCheckoutError = {
  title: "Checkout didn’t open",
  detail: "The payment page timed out after 10 seconds. Nothing was charged.",
  code: "Error 504 · ref 7KQ2-M9X4",
};

const DEFAULT_ORDER: SlabOrder = {
  reference: "PY-20817",
  placedOn: "Oct 26, 2026",
  paymentMethod: "Card ending 4417",
  taxLabel: "Sales tax 8.875%",
  taxRate: 0.08875,
  renewsOn: { monthly: "Nov 26, 2026", yearly: "Oct 26, 2027" },
};

const BILLING_OPTIONS: { value: SlabBilling; label: string }[] = [
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
/** The billing switch presses the slabs one after another, left to right. */
const SLAB_STAGGER = 60;
/** How long a slab stays pressed into its shadow. */
const SNAP_HOLD = 170;
/** Each digit starts rolling this long after the one to its left. */
const DIGIT_STAGGER = 50;

function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function isPromise(value: unknown): value is PromiseLike<unknown> {
  return typeof value === "object" && value !== null && typeof (value as { then?: unknown }).then === "function";
}

function formatMoney(amount: number, locale: string, currency: string, fractionDigits = 0) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(amount);
}

/** Splits a whole price into its currency symbol and its figure ("1,249"), so the figure can roll. */
function priceParts(amount: number, locale: string, currency: string) {
  const parts = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).formatToParts(amount);
  return {
    symbol: parts.find((part) => part.type === "currency")?.value ?? "",
    figure: parts
      .filter((part) => part.type === "integer" || part.type === "group")
      .map((part) => part.value)
      .join(""),
  };
}

const PAD = "px-6 md:px-4 lg:px-6";

function buttonClasses(primary: boolean) {
  return cx(
    "group/cta relative grid h-12 w-full grid-cols-1 place-items-center rounded-[min(var(--iu-radius),4px)] border-2 border-(--iu-foreground) px-4 text-[13px] font-extrabold tracking-[0.08em] uppercase shadow-[4px_4px_0_var(--slab-shade)] transition-[translate,box-shadow] duration-80 ease-linear select-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--iu-accent) active:translate-x-1 active:translate-y-1 active:shadow-none aria-disabled:translate-x-1 aria-disabled:translate-y-1 aria-disabled:cursor-progress aria-disabled:shadow-none motion-reduce:transition-none md:px-3 lg:px-4 pointer-fine:hover:not-active:not-aria-disabled:-translate-x-0.5 pointer-fine:hover:not-active:not-aria-disabled:-translate-y-0.5 pointer-fine:hover:not-active:not-aria-disabled:shadow-[6px_6px_0_var(--slab-shade)]",
    primary ? "bg-(--iu-accent) text-(--iu-accent-foreground)" : "bg-(--iu-surface) text-(--iu-foreground)",
  );
}

/**
 * A figure whose digits sit in vertical strips. When the value changes, each strip rolls to its new digit, left to
 * right, at a constant speed, so a digit that travels further rolls for longer.
 */
function RollingFigure({ value, from, delay }: { value: string; from: string; delay: number }) {
  const chars = value.split("");
  const offset = from.length - value.length;
  return (
    <span aria-hidden="true" data-slot="price-figure" className="flex">
      {chars.map((char, index) => {
        const slot = chars.length - index;
        const digit = DIGITS.indexOf(char);
        if (digit < 0) {
          return (
            <span key={`sep-${slot}`} className="block h-[1em] leading-none">
              {char}
            </span>
          );
        }
        const previous = DIGITS.indexOf(from[index + offset] ?? "");
        const distance = previous < 0 ? 0 : Math.abs(previous - digit);
        const style: CSSProperties = {
          transform: `translateY(${digit * -10}%)`,
          transitionDuration: `${90 + distance * 18}ms`,
          transitionDelay: `${delay + index * DIGIT_STAGGER}ms`,
        };
        return (
          <span key={`digit-${slot}`} className="block h-[1em] overflow-hidden">
            <span
              className="flex flex-col transition-transform ease-linear motion-reduce:transition-none"
              style={style}
            >
              {DIGITS.map((option) => (
                <span key={option} className="block h-[1em] leading-none">
                  {option}
                </span>
              ))}
            </span>
          </span>
        );
      })}
    </span>
  );
}

/** Three blocks that step while checkout opens: an honest busy signal that stops offscreen and under reduced motion. */
function WorkingBlocks({ running }: { running: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const node = ref.current;
    if (!running || !node || prefersReducedMotion()) return;
    let timer: number | undefined;
    const stop = () => {
      window.clearInterval(timer);
      timer = undefined;
    };
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) stop();
      else if (timer === undefined) timer = window.setInterval(() => setFrame((current) => (current + 1) % 3), 180);
    });
    observer.observe(node);
    return () => {
      observer.disconnect();
      stop();
    };
  }, [running]);

  return (
    <span ref={ref} aria-hidden="true" data-slot="busy-blocks" className="flex gap-1">
      {[0, 1, 2].map((block) => (
        <span
          key={block}
          className={cx("size-2 rounded-[1px] border-2 border-current", running && block === frame && "bg-current")}
        />
      ))}
    </span>
  );
}

function FeatureValue({ value }: { value: SlabFeatureValue | undefined }) {
  if (value === true) {
    return (
      <>
        <span
          aria-hidden="true"
          className="grid size-5 place-items-center rounded-[min(var(--iu-radius),2px)] bg-(--iu-foreground) text-(--iu-surface)"
        >
          <Check size={14} strokeWidth={3} />
        </span>
        <span className="sr-only">Included</span>
      </>
    );
  }
  if (!value) {
    return (
      <>
        <span aria-hidden="true" className="block h-0.5 w-3.5 bg-(--iu-muted)" />
        <span className="sr-only">Not included</span>
      </>
    );
  }
  return <span className="font-mono text-[13px] font-medium">{value}</span>;
}

function BillingSwitch({
  name,
  billing,
  savingLabel,
  onSelect,
}: {
  name: string;
  billing: SlabBilling;
  savingLabel: string;
  onSelect: (billing: SlabBilling) => void;
}) {
  return (
    <fieldset data-slot="billing-switch" className="relative w-72 max-w-full min-w-0 sm:w-80">
      <legend className="sr-only">Billing period</legend>
      <div className="relative grid h-14 grid-cols-2 overflow-hidden rounded-[min(var(--iu-radius),4px)] border-2 border-(--iu-foreground) bg-(--iu-surface) shadow-[4px_4px_0_var(--slab-shade)] has-focus-visible:outline-2 has-focus-visible:outline-offset-4 has-focus-visible:outline-(--iu-accent)">
        <span
          aria-hidden="true"
          data-slot="billing-thumb"
          className={cx(
            "absolute inset-y-0 left-0 w-1/2 bg-(--iu-foreground) transition-transform duration-100 ease-linear motion-reduce:transition-none",
            billing === "yearly" && "translate-x-full",
          )}
        />
        {BILLING_OPTIONS.map((option) => (
          <label
            key={option.value}
            className={cx(
              "relative flex cursor-pointer items-center justify-center text-sm font-extrabold tracking-[0.08em] uppercase transition-colors duration-100 ease-linear select-none has-checked:text-(--iu-background) motion-reduce:transition-none pointer-fine:hover:not-has-checked:bg-[color-mix(in_oklab,var(--iu-foreground)_8%,var(--iu-surface))]",
              option.value === "yearly" && "border-l-2 border-(--iu-foreground)",
            )}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={billing === option.value}
              onChange={() => onSelect(option.value)}
              className="sr-only"
            />
            {option.label}
            {option.value === "yearly" ? <span className="sr-only">, {savingLabel}</span> : null}
          </label>
        ))}
      </div>
      <span
        aria-hidden="true"
        data-slot="saving-sticker"
        className="pointer-events-none absolute -top-4 -right-3 rotate-[7deg] rounded-[min(var(--iu-radius),2px)] bg-(--iu-foreground) px-3 py-2 font-mono text-xs leading-none font-bold tracking-[0.06em] text-(--iu-background) uppercase ring-2 ring-(--iu-background)"
      >
        {savingLabel}
      </span>
    </fieldset>
  );
}

function ErrorBox({ id, error }: { id: string; error: SlabCheckoutError }) {
  return (
    <div
      id={id}
      role="alert"
      data-slot="checkout-error"
      className="mb-4 flex overflow-hidden rounded-[min(var(--iu-radius),4px)] border-2 border-(--iu-foreground) bg-(--iu-surface) text-left"
    >
      <span
        aria-hidden="true"
        className="flex w-10 shrink-0 justify-center border-r-2 border-(--iu-foreground) bg-red-600 pt-3 text-white dark:bg-red-500"
      >
        <TriangleAlert size={18} strokeWidth={2.25} />
      </span>
      <div className="min-w-0 px-3 py-3">
        <p className="text-sm leading-tight font-extrabold">{error.title}</p>
        <p className="mt-1 text-[13px] leading-snug text-pretty text-(--iu-muted)">{error.detail}</p>
        {error.code ? (
          <p className="mt-2 font-mono text-[11px] tracking-[0.04em] text-(--iu-muted) uppercase">{error.code}</p>
        ) : null}
      </div>
    </div>
  );
}

function Confirmation({
  plan,
  billing,
  order,
  locale,
  currency,
  continueLabel,
  continueHref,
  headingRef,
}: {
  plan: SlabPlan;
  billing: SlabBilling;
  order: SlabOrder;
  locale: string;
  currency: string;
  continueLabel: string;
  continueHref: string;
  headingRef: RefObject<HTMLHeadingElement | null>;
}) {
  const months = billing === "yearly" ? 12 : 1;
  const perMonth = plan.price[billing];
  const subtotal = perMonth * months;
  const tax = Math.round(subtotal * order.taxRate * 100) / 100;
  const total = Math.round((subtotal + tax) * 100) / 100;
  const money = (amount: number) => formatMoney(amount, locale, currency, 2);
  return (
    <div data-slot="confirmation" className={cx("flex flex-col py-6 md:row-span-4", PAD)}>
      <div className="flex items-start justify-between gap-4">
        <p className="font-mono text-[11px] leading-snug font-bold tracking-[0.06em] text-(--iu-muted) uppercase">
          Order {order.reference}
          <span className="block">{order.placedOn}</span>
        </p>
        <span
          aria-hidden="true"
          className="shrink-0 rotate-[-8deg] rounded-[min(var(--iu-radius),2px)] border-2 border-(--iu-foreground) px-2 py-1 font-mono text-xs leading-none font-bold tracking-[0.12em] uppercase"
        >
          Paid
        </span>
      </div>
      <h4
        ref={headingRef}
        tabIndex={-1}
        data-slot="confirmation-heading"
        className="mt-4 text-[32px] leading-none font-extrabold tracking-[-0.04em] text-balance outline-none"
      >
        You’re on {plan.name}.
      </h4>
      <dl className="mt-6 border-t-2 border-(--iu-foreground) font-mono text-[13px] tabular-nums">
        <div className="flex items-start justify-between gap-4 border-b border-dashed border-(--slab-shade) py-3">
          <dt>
            {plan.name}, {billing}
            <span className="mt-1 block text-(--iu-muted)">
              {months} × {money(perMonth)}
            </span>
          </dt>
          <dd>{money(subtotal)}</dd>
        </div>
        <div className="flex items-start justify-between gap-4 border-b border-dashed border-(--slab-shade) py-3">
          <dt>{order.taxLabel}</dt>
          <dd>{money(tax)}</dd>
        </div>
        <div className="flex items-start justify-between gap-4 border-b-2 border-(--iu-foreground) py-3 text-sm font-bold">
          <dt>Total charged</dt>
          <dd>{money(total)}</dd>
        </div>
      </dl>
      <p className="mt-4 text-sm leading-snug text-pretty text-(--iu-muted)">
        {order.paymentMethod}. Renews {order.renewsOn[billing]}. The receipt is on its way to your billing email.
      </p>
      <div className="mt-auto pt-6">
        <a href={continueHref} className={buttonClasses(Boolean(plan.highlighted))}>
          <span className="inline-flex items-center gap-2 whitespace-nowrap">
            {continueLabel}
            <ArrowRight
              size={16}
              strokeWidth={2.5}
              aria-hidden="true"
              className="transition-transform duration-80 ease-linear motion-reduce:transition-none md:hidden lg:block pointer-fine:group-hover/cta:translate-x-0.5"
            />
          </span>
        </a>
      </div>
    </div>
  );
}

function PlanSlab({
  plan,
  index,
  billing,
  locale,
  currency,
  status,
  checkoutError,
  order,
  continueLabel,
  continueHref,
  idPrefix,
  headingRef,
  onCheckout,
}: {
  plan: SlabPlan;
  index: number;
  billing: SlabBilling;
  locale: string;
  currency: string;
  status: SlabCheckoutStatus;
  checkoutError: SlabCheckoutError;
  order: SlabOrder;
  continueLabel: string;
  continueHref: string;
  idPrefix: string;
  headingRef: RefObject<HTMLHeadingElement | null>;
  onCheckout: (planId: string) => void;
}) {
  const loading = status === "loading";
  const failed = status === "error";
  const errorId = `${idPrefix}-${plan.id}-error`;
  const other: SlabBilling = billing === "yearly" ? "monthly" : "yearly";
  const current = priceParts(plan.price[billing], locale, currency);
  const previous = priceParts(plan.price[other], locale, currency);
  const money = (amount: number) => formatMoney(amount, locale, currency);
  const yearlyTotal = plan.price.yearly * 12;
  const saving = (plan.price.monthly - plan.price.yearly) * 12;
  const note =
    plan.note?.[billing] ??
    (billing === "yearly"
      ? `${money(yearlyTotal)} billed yearly${saving > 0 ? `, save ${money(saving)}` : ""}`
      : "Billed monthly, cancel anytime");
  const spoken =
    billing === "yearly"
      ? `${money(plan.price.yearly)} per month, billed yearly at ${money(yearlyTotal)}`
      : `${money(plan.price.monthly)} per month, billed monthly`;

  return (
    <li
      data-slot="plan"
      data-plan={plan.id}
      className={cx(
        "grid overflow-hidden rounded-[min(var(--iu-radius),4px)] border-2 border-(--iu-foreground) bg-(--iu-surface) transition-[translate,box-shadow] duration-80 ease-linear data-snap:shadow-none motion-reduce:transition-none md:row-span-5 md:grid-rows-subgrid",
        plan.highlighted
          ? "shadow-[12px_12px_0_var(--slab-shade)] data-snap:translate-x-3 data-snap:translate-y-3"
          : "shadow-[8px_8px_0_var(--slab-shade)] data-snap:translate-x-2 data-snap:translate-y-2",
      )}
    >
      <div
        data-slot="plan-band"
        className={cx(
          "border-b-2 border-(--iu-foreground) py-[calc(20px*var(--iu-density))]",
          PAD,
          plan.highlighted && "bg-(--iu-accent) text-(--iu-accent-foreground)",
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-xl leading-none font-extrabold tracking-[0.01em] uppercase">{plan.name}</h3>
          {plan.badge ? (
            <span className="shrink-0 rounded-[min(var(--iu-radius),2px)] border-2 border-current px-2 py-1 font-mono text-[11px] leading-none font-bold tracking-[0.06em] uppercase">
              {plan.badge}
            </span>
          ) : null}
        </div>
        <p className={cx("mt-3 text-sm leading-snug text-pretty", !plan.highlighted && "text-(--iu-muted)")}>
          {plan.tagline}
        </p>
      </div>

      {status === "success" ? (
        <Confirmation
          plan={plan}
          billing={billing}
          order={order}
          locale={locale}
          currency={currency}
          continueLabel={continueLabel}
          continueHref={continueHref}
          headingRef={headingRef}
        />
      ) : (
        <>
          <div data-slot="plan-price" className={cx("pt-6", PAD)}>
            <p className="flex items-start text-7xl leading-none font-extrabold tracking-[-0.04em] tabular-nums md:text-5xl lg:text-[64px] xl:text-[88px]">
              <span aria-hidden="true" className="mt-[0.08em] mr-[0.06em] text-[0.42em] leading-none tracking-normal">
                {current.symbol}
              </span>
              <RollingFigure value={current.figure} from={previous.figure} delay={index * SLAB_STAGGER + 40} />
              <span
                aria-hidden="true"
                className="mt-auto mb-[0.1em] ml-2 font-mono text-sm leading-none font-medium tracking-normal text-(--iu-muted)"
              >
                /mo
              </span>
              <span data-slot="price-spoken" className="sr-only">
                {spoken}
              </span>
            </p>
            <p
              data-slot="price-note"
              className="mt-3 font-mono text-[11px] font-medium tracking-[0.04em] text-(--iu-muted) uppercase"
            >
              {note}
            </p>
          </div>

          <div data-slot="plan-quota" className={cx("flex flex-wrap items-center gap-x-3 gap-y-2 pt-5 pb-6", PAD)}>
            <span className="rounded-[min(var(--iu-radius),2px)] border-2 border-(--iu-foreground) px-2 py-1 font-mono text-xs leading-none font-bold uppercase">
              {plan.quota}
            </span>
            <span className="font-mono text-xs text-(--iu-muted)">{plan.overage}</span>
          </div>

          <div data-slot="plan-features" className={cx("border-t-2 border-(--iu-foreground) py-6", PAD)}>
            <p className="font-mono text-[11px] font-bold tracking-[0.06em] uppercase">
              {plan.everythingIn ? `Everything in ${plan.everythingIn}, plus` : "Includes"}
            </p>
            <ul role="list" className="mt-4 grid gap-3">
              {plan.highlights.map((item) => (
                <li key={item} className="flex items-start gap-3 text-[15px] leading-5">
                  <span
                    aria-hidden="true"
                    className="grid size-5 shrink-0 place-items-center rounded-[min(var(--iu-radius),2px)] bg-(--iu-foreground) text-(--iu-surface)"
                  >
                    <Check size={14} strokeWidth={3} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div data-slot="plan-action" className={cx("flex flex-col justify-end pb-6", PAD)}>
            {failed ? <ErrorBox id={errorId} error={checkoutError} /> : null}
            <button
              type="button"
              data-slot="checkout-button"
              aria-disabled={loading || undefined}
              aria-describedby={failed ? errorId : undefined}
              onClick={() => onCheckout(plan.id)}
              className={buttonClasses(Boolean(plan.highlighted))}
            >
              <span
                data-slot="checkout-label"
                className={cx(
                  "col-start-1 row-start-1 inline-flex items-center gap-2 whitespace-nowrap",
                  loading && "invisible",
                )}
              >
                {failed ? (
                  <RotateCcw size={16} strokeWidth={2.5} aria-hidden="true" className="md:hidden lg:block" />
                ) : null}
                {failed ? "Retry checkout" : plan.ctaLabel}
                {failed ? null : (
                  <ArrowRight
                    size={16}
                    strokeWidth={2.5}
                    aria-hidden="true"
                    className="transition-transform duration-80 ease-linear motion-reduce:transition-none md:hidden lg:block pointer-fine:group-hover/cta:translate-x-0.5"
                  />
                )}
              </span>
              <span
                aria-hidden={!loading}
                data-slot="checkout-busy"
                className={cx(
                  "col-start-1 row-start-1 inline-flex items-center gap-2 whitespace-nowrap",
                  !loading && "invisible",
                )}
              >
                <WorkingBlocks running={loading} />
                <span>
                  Opening<span className="md:hidden lg:inline"> checkout</span>
                </span>
              </span>
            </button>
          </div>
        </>
      )}
    </li>
  );
}

export function SlabPricing({
  eyebrow = "Pipeyard pricing",
  headline = "Pay for what you deliver.",
  subline = "Every plan signs, retries and logs each webhook. Pick the volume you send today and move up when your traffic does.",
  plans = DEFAULT_PLANS,
  featureGroups = DEFAULT_FEATURE_GROUPS,
  terms = DEFAULT_TERMS,
  compareTitle = "Compare every limit",
  currency = "USD",
  locale = "en-US",
  savingLabel = "Save 20%",
  defaultBilling = "monthly",
  billing: billingProp,
  onBillingChange,
  status: statusProp,
  checkoutPlanId,
  onCheckout,
  checkoutError = DEFAULT_ERROR,
  order = DEFAULT_ORDER,
  continueLabel = "Open dashboard",
  continueHref = "#dashboard",
  className = "",
}: SlabPricingProps) {
  const idPrefix = useId();
  const headingId = `${idPrefix}-heading`;
  const [ownBilling, setOwnBilling] = useState<SlabBilling>(defaultBilling);
  const [ownCheckout, setOwnCheckout] = useState<{ status: SlabCheckoutStatus; planId?: string }>({
    status: "idle",
  });
  const [billingMessage, setBillingMessage] = useState("");
  const listRef = useRef<HTMLUListElement>(null);
  const confirmationRef = useRef<HTMLHeadingElement>(null);
  const timers = useRef<number[]>([]);
  const pressed = useRef(false);

  const billing = billingProp ?? ownBilling;
  const status = statusProp ?? ownCheckout.status;
  const highlightedId = (plans.find((plan) => plan.highlighted) ?? plans[0])?.id;
  const activePlanId = checkoutPlanId ?? ownCheckout.planId ?? highlightedId;
  const activePlan = plans.find((plan) => plan.id === activePlanId);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((timer) => window.clearTimeout(timer));
  }, []);

  // A confirmation replaces the button that was pressed, so focus moves to its heading.
  useEffect(() => {
    if (status === "success" && pressed.current) confirmationRef.current?.focus();
  }, [status, activePlanId]);

  function stampSlabs() {
    const slabs = Array.from(listRef.current?.querySelectorAll<HTMLElement>('[data-slot="plan"]') ?? []);
    timers.current.splice(0).forEach((timer) => window.clearTimeout(timer));
    slabs.forEach((slab) => slab.removeAttribute("data-snap"));
    if (prefersReducedMotion()) return;
    slabs.forEach((slab, index) => {
      const start = index * SLAB_STAGGER;
      timers.current.push(
        window.setTimeout(() => slab.setAttribute("data-snap", ""), start),
        window.setTimeout(() => slab.removeAttribute("data-snap"), start + SNAP_HOLD),
      );
    });
  }

  function selectBilling(next: SlabBilling) {
    if (next === billing) return;
    if (billingProp === undefined) setOwnBilling(next);
    onBillingChange?.(next);
    setBillingMessage(
      next === "yearly"
        ? `Yearly billing selected. ${savingLabel}. Prices are per month, billed once a year.`
        : "Monthly billing selected.",
    );
    stampSlabs();
  }

  function checkout(planId: string) {
    if (status === "loading") return;
    pressed.current = true;
    const result = onCheckout?.(planId, billing);
    if (statusProp !== undefined || !isPromise(result)) return;
    setOwnCheckout({ status: "loading", planId });
    result.then(
      () => setOwnCheckout({ status: "success", planId }),
      () => setOwnCheckout({ status: "error", planId }),
    );
  }

  const statusMessage = !activePlan
    ? ""
    : status === "loading"
      ? `Opening checkout for ${activePlan.name}.`
      : status === "success"
        ? `Payment confirmed. You’re on ${activePlan.name}.`
        : "";

  return (
    <section
      aria-labelledby={headingId}
      data-slot="slab-pricing"
      className={cx(
        "bg-(--iu-background) font-(family-name:--iu-font) text-(--iu-foreground) [--slab-shade:var(--iu-foreground)] dark:[--slab-shade:color-mix(in_oklab,var(--iu-foreground)_40%,var(--iu-background))]",
        className,
      )}
    >
      <div className="mx-auto max-w-[1200px] px-6 py-16 sm:px-10 sm:py-24">
        <header className="grid gap-x-8 gap-y-12 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <p className="flex items-center gap-2 font-mono text-xs font-bold tracking-[0.08em] uppercase">
              <span aria-hidden="true" className="size-2.5 bg-(--iu-accent)" />
              {eyebrow}
            </p>
            <h2
              id={headingId}
              className="mt-5 text-[clamp(2.5rem,1.4rem+4vw,4.75rem)] leading-[0.95] font-extrabold tracking-[-0.045em] text-balance"
            >
              {headline}
            </h2>
            <p className="mt-6 max-w-[34rem] text-base leading-relaxed text-pretty text-(--iu-muted) sm:text-lg">
              {subline}
            </p>
          </div>
          <div className="lg:col-span-5 lg:justify-self-end lg:pb-2">
            <BillingSwitch
              name={`${idPrefix}-billing`}
              billing={billing}
              savingLabel={savingLabel}
              onSelect={selectBilling}
            />
          </div>
        </header>

        <ul
          ref={listRef}
          role="list"
          data-slot="plans"
          className="mt-14 grid gap-y-10 md:mt-16 md:grid-cols-3 md:gap-x-6 md:gap-y-0 lg:gap-x-8"
        >
          {plans.map((plan, index) => (
            <PlanSlab
              key={plan.id}
              plan={plan}
              index={index}
              billing={billing}
              locale={locale}
              currency={currency}
              status={plan.id === activePlanId ? status : "idle"}
              checkoutError={checkoutError}
              order={order}
              continueLabel={continueLabel}
              continueHref={continueHref}
              idPrefix={idPrefix}
              headingRef={confirmationRef}
              onCheckout={checkout}
            />
          ))}
        </ul>

        <dl
          data-slot="terms"
          className="mt-14 grid gap-0.5 overflow-hidden rounded-[min(var(--iu-radius),4px)] border-2 border-(--iu-foreground) bg-(--iu-foreground) sm:grid-cols-2 lg:grid-cols-4"
        >
          {terms.map((term) => (
            <div key={term.label} className="bg-(--iu-background) px-5 py-[calc(16px*var(--iu-density))]">
              <dt className="font-mono text-[11px] font-bold tracking-[0.08em] uppercase">{term.label}</dt>
              <dd className="mt-2 text-sm leading-snug text-pretty text-(--iu-muted)">{term.text}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-20 sm:mt-24">
          <h3 className="text-[28px] leading-none font-extrabold tracking-[-0.03em] text-balance sm:text-[40px]">
            {compareTitle}
          </h3>

          <div
            data-slot="comparison"
            className="mt-8 hidden rounded-[min(var(--iu-radius),4px)] border-2 border-(--iu-foreground) bg-(--iu-surface) shadow-[8px_8px_0_var(--slab-shade)] md:block"
          >
            <table className="w-full table-fixed border-separate border-spacing-0 text-left">
              <caption data-slot="comparison-caption" className="sr-only">
                Plan comparison, prices per month billed {billing}
              </caption>
              <colgroup>
                <col className="w-[34%]" />
                {plans.map((plan) => (
                  <col key={plan.id} />
                ))}
              </colgroup>
              <thead className="sticky top-[var(--slab-sticky-top,0px)] z-10">
                <tr>
                  <th
                    scope="col"
                    data-slot="comparison-billing"
                    className="border-b-2 border-(--iu-foreground) bg-(--iu-surface) px-5 py-4 align-bottom font-mono text-[11px] font-bold tracking-[0.06em] text-(--iu-muted) uppercase"
                  >
                    Per month, billed {billing}
                  </th>
                  {plans.map((plan) => {
                    const price = priceParts(plan.price[billing], locale, currency);
                    return (
                      <th
                        key={plan.id}
                        scope="col"
                        className="relative border-b-2 border-l-2 border-(--iu-foreground) bg-(--iu-surface) px-5 py-4 align-bottom"
                      >
                        {plan.highlighted ? (
                          <span aria-hidden="true" className="absolute inset-x-0 top-0 h-2 bg-(--iu-accent)" />
                        ) : null}
                        <span className="block text-base leading-none font-extrabold uppercase">{plan.name}</span>
                        <span
                          data-slot="column-price"
                          data-plan={plan.id}
                          className="mt-2 block font-mono text-sm font-medium tabular-nums"
                        >
                          {price.symbol}
                          {price.figure}
                          <span className="text-(--iu-muted)">/mo</span>
                        </span>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              {featureGroups.map((group, groupIndex) => (
                <tbody key={group.title}>
                  <tr>
                    <th
                      scope="rowgroup"
                      colSpan={plans.length + 1}
                      className="border-b-2 border-(--iu-foreground) bg-(--iu-background) px-5 py-3 font-mono text-[11px] font-bold tracking-[0.08em] uppercase"
                    >
                      {group.title}
                    </th>
                  </tr>
                  {group.rows.map((row, rowIndex) => {
                    const lastInGroup = rowIndex === group.rows.length - 1;
                    const lastInTable = lastInGroup && groupIndex === featureGroups.length - 1;
                    // Rows inside a group are split by dashed hairlines in the shade; groups by solid 2px rules.
                    const rule = lastInTable
                      ? ""
                      : lastInGroup
                        ? "border-b-2"
                        : "border-b border-b-(--slab-shade) [border-bottom-style:dashed]";
                    return (
                      <tr key={row.label}>
                        <th
                          scope="row"
                          className={cx(
                            "border-(--iu-foreground) px-5 py-[calc(12px*var(--iu-density))] text-sm font-medium",
                            rule,
                          )}
                        >
                          {row.label}
                        </th>
                        {plans.map((plan) => (
                          <td
                            key={plan.id}
                            className={cx(
                              "border-l-2 border-(--iu-foreground) px-5 py-[calc(12px*var(--iu-density))]",
                              rule,
                            )}
                          >
                            <FeatureValue value={row.values[plan.id]} />
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              ))}
            </table>
          </div>

          {/* Below 768px: the same rows, each label over its three values, under a sticky row of plan columns. */}
          <div
            data-slot="comparison-stack"
            className="mt-8 rounded-[min(var(--iu-radius),4px)] border-2 border-(--iu-foreground) bg-(--iu-surface) shadow-[6px_6px_0_var(--slab-shade)] md:hidden"
          >
            <div
              aria-hidden="true"
              data-slot="stack-head"
              className="sticky top-[var(--slab-sticky-top,0px)] z-10 grid border-b-2 border-(--iu-foreground) bg-(--iu-surface)"
              style={{ gridTemplateColumns: `repeat(${plans.length}, minmax(0, 1fr))` }}
            >
              {plans.map((plan, planIndex) => {
                const price = priceParts(plan.price[billing], locale, currency);
                return (
                  <div
                    key={plan.id}
                    className={cx("relative px-3 pt-4 pb-3", planIndex > 0 && "border-l-2 border-(--iu-foreground)")}
                  >
                    {plan.highlighted ? <span className="absolute inset-x-0 top-0 h-1.5 bg-(--iu-accent)" /> : null}
                    <span className="block truncate text-sm leading-none font-extrabold uppercase">{plan.name}</span>
                    <span
                      data-slot="list-price"
                      data-plan={plan.id}
                      className="mt-1.5 block font-mono text-xs font-medium tabular-nums"
                    >
                      {price.symbol}
                      {price.figure}
                      <span className="text-(--iu-muted)">/mo</span>
                    </span>
                  </div>
                );
              })}
            </div>
            {featureGroups.map((group, groupIndex) => (
              <div key={group.title}>
                <p
                  className={cx(
                    "border-b-2 border-(--iu-foreground) bg-(--iu-background) px-3 py-2 font-mono text-[11px] font-bold tracking-[0.08em] uppercase",
                    groupIndex > 0 && "border-t-2",
                  )}
                >
                  {group.title}
                </p>
                <dl>
                  {group.rows.map((row, rowIndex) => (
                    <div
                      key={row.label}
                      className={cx(
                        "pt-[calc(12px*var(--iu-density))]",
                        rowIndex < group.rows.length - 1 &&
                          "border-b [border-bottom-style:dashed] border-(--slab-shade)",
                      )}
                    >
                      <dt className="px-3 text-sm leading-tight font-medium">{row.label}</dt>
                      <dd
                        className="mt-1 grid tabular-nums"
                        style={{ gridTemplateColumns: `repeat(${plans.length}, minmax(0, 1fr))` }}
                      >
                        {plans.map((plan, planIndex) => (
                          <span
                            key={plan.id}
                            className={cx(
                              "flex min-h-9 items-center px-3 pb-[calc(8px*var(--iu-density))] break-words",
                              planIndex > 0 && "border-l-2 border-(--iu-foreground)",
                            )}
                          >
                            <span className="sr-only">{plan.name}: </span>
                            <FeatureValue value={row.values[plan.id]} />
                          </span>
                        ))}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
        </div>

        <p aria-live="polite" data-slot="billing-status" className="sr-only">
          {billingMessage}
        </p>
        <p aria-live="polite" data-slot="checkout-status" className="sr-only">
          {statusMessage}
        </p>
      </div>
    </section>
  );
}

export default SlabPricing;
