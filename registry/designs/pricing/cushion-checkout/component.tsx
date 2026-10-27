"use client";

import { useEffect, useId, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import {
  AnimatePresence,
  MotionConfig,
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";
import { Check, CircleAlert, CreditCard, LoaderCircle, Lock, Minus, Plus, RotateCcw } from "lucide-react";

export type CushionBilling = "monthly" | "yearly";
export type CushionCheckoutStatus = "idle" | "loading" | "error" | "success";

export type CushionCountry = {
  code: string;
  name: string;
  /** Tax name printed in the summary ("VAT", "GST", "Sales tax"). */
  taxLabel: string;
  /** Tax rate from 0 to 1. */
  taxRate: number;
  postalLabel: string;
};

export type CushionValues = {
  email: string;
  cardNumber: string;
  expiry: string;
  cvc: string;
  name: string;
  country: string;
  postalCode: string;
};

export type CushionPayment = CushionValues & {
  billing: CushionBilling;
  seats: number;
  /** Amounts in cents. */
  subtotal: number;
  tax: number;
  total: number;
};

export type CushionReceipt = {
  reference: string;
  date: string;
  renewsOn: Record<CushionBilling, string>;
};

export type CushionCheckoutProps = {
  productName?: string;
  planName?: string;
  /** Price per seat per month in cents, for each billing period. */
  seatPrice?: Record<CushionBilling, number>;
  defaultBilling?: CushionBilling;
  defaultSeats?: number;
  minSeats?: number;
  maxSeats?: number;
  countries?: CushionCountry[];
  defaultValues?: Partial<CushionValues>;
  refundLine?: string;
  /** What the plan includes, listed under the total. */
  includes?: string[];
  /** Controlled status. Leave unset and return a Promise from onPay to let the component drive it. */
  status?: CushionCheckoutStatus;
  errorTitle?: string;
  errorMessage?: string;
  receipt?: CushionReceipt;
  onPay?: (payment: CushionPayment) => void | Promise<void>;
  onOpenWorkspace?: () => void;
  onDownloadReceipt?: () => void;
  className?: string;
};

const DEFAULT_COUNTRIES: CushionCountry[] = [
  { code: "GB", name: "United Kingdom", taxLabel: "VAT", taxRate: 0.2, postalLabel: "Postcode" },
  { code: "DE", name: "Germany", taxLabel: "VAT", taxRate: 0.19, postalLabel: "Postal code" },
  { code: "NL", name: "Netherlands", taxLabel: "VAT", taxRate: 0.21, postalLabel: "Postal code" },
  { code: "IN", name: "India", taxLabel: "GST", taxRate: 0.18, postalLabel: "PIN code" },
  { code: "AU", name: "Australia", taxLabel: "GST", taxRate: 0.1, postalLabel: "Postcode" },
  { code: "SG", name: "Singapore", taxLabel: "GST", taxRate: 0.09, postalLabel: "Postal code" },
  { code: "CA", name: "Canada", taxLabel: "GST", taxRate: 0.05, postalLabel: "Postal code" },
  { code: "US", name: "United States", taxLabel: "Sales tax", taxRate: 0, postalLabel: "ZIP code" },
];

const DEFAULT_INCLUDES = [
  "Shared team calendars and booking pages",
  "Round-robin and collective scheduling",
  "Priority support with a 4-hour reply",
];

const DEFAULT_RECEIPT: CushionReceipt = {
  reference: "TW-48217-2026",
  date: "27 Oct 2026",
  renewsOn: { monthly: "27 Nov 2026", yearly: "27 Oct 2027" },
};

const EMPTY: CushionValues = {
  email: "",
  cardNumber: "",
  expiry: "",
  cvc: "",
  name: "",
  country: "GB",
  postalCode: "",
};

type Field = keyof CushionValues;
type Errors = Partial<Record<Field, string>>;
const FIELD_ORDER: Field[] = ["email", "cardNumber", "expiry", "cvc", "name", "country", "postalCode"];

const SOFT = [
  "[--cc-sh-card:0_1px_1px_color-mix(in_oklab,black_4%,transparent),0_8px_16px_-6px_color-mix(in_oklab,black_6%,transparent),0_40px_72px_-28px_color-mix(in_oklab,black_20%,transparent)]",
  "[--cc-sh-well:inset_0_1px_3px_color-mix(in_oklab,black_8%,transparent)]",
  "[--cc-sh-thumb:inset_0_1px_0_color-mix(in_oklab,white_80%,transparent),0_1px_2px_color-mix(in_oklab,black_8%,transparent),0_4px_10px_-3px_color-mix(in_oklab,black_14%,transparent)]",
  "[--cc-sh-btn:inset_0_1px_0_color-mix(in_oklab,white_30%,transparent),inset_0_-2px_0_color-mix(in_oklab,black_10%,transparent),0_1px_2px_color-mix(in_oklab,black_12%,transparent),0_10px_20px_-10px_color-mix(in_oklab,var(--iu-accent)_70%,transparent)]",
  "[--cc-sh-pressed:inset_0_2px_5px_color-mix(in_oklab,black_28%,transparent),inset_0_1px_1px_color-mix(in_oklab,black_16%,transparent)]",
  "[--cc-sh-key:inset_0_1px_0_color-mix(in_oklab,white_80%,transparent),0_1px_2px_color-mix(in_oklab,black_10%,transparent),0_3px_8px_-3px_color-mix(in_oklab,black_14%,transparent)]",
  "[--cc-tint:color-mix(in_oklab,var(--iu-accent)_7%,var(--iu-surface))]",
  "[--cc-well:color-mix(in_oklab,var(--iu-foreground)_3%,var(--iu-surface))]",
  "dark:[--cc-sh-card:inset_0_1px_0_color-mix(in_oklab,white_5%,transparent),0_24px_48px_-16px_color-mix(in_oklab,black_70%,transparent)]",
  "dark:[--cc-sh-well:inset_0_1px_2px_color-mix(in_oklab,black_45%,transparent)]",
  "dark:[--cc-sh-thumb:inset_0_1px_0_color-mix(in_oklab,white_8%,transparent),0_1px_2px_color-mix(in_oklab,black_40%,transparent),0_4px_10px_-3px_color-mix(in_oklab,black_50%,transparent)]",
  "dark:[--cc-sh-btn:inset_0_1px_0_color-mix(in_oklab,white_26%,transparent),inset_0_-2px_0_color-mix(in_oklab,black_14%,transparent),0_1px_2px_color-mix(in_oklab,black_40%,transparent),0_10px_20px_-10px_color-mix(in_oklab,var(--iu-accent)_35%,transparent)]",
  "dark:[--cc-sh-pressed:inset_0_2px_6px_color-mix(in_oklab,black_45%,transparent),inset_0_1px_1px_color-mix(in_oklab,black_30%,transparent)]",
  "dark:[--cc-sh-key:inset_0_1px_0_color-mix(in_oklab,white_8%,transparent),0_1px_2px_color-mix(in_oklab,black_40%,transparent)]",
  "dark:[--cc-tint:color-mix(in_oklab,var(--iu-accent)_5%,var(--iu-background))]",
  "dark:[--cc-well:color-mix(in_oklab,var(--iu-foreground)_4%,var(--iu-background))]",
].join(" ");

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--iu-accent)";

const FIELD_BOX =
  "relative flex h-12 items-center gap-2 rounded-[max(var(--iu-radius),14px)] border border-(--iu-foreground)/35 bg-(--cc-well) px-4 shadow-(--cc-sh-well) transition-[border-color,box-shadow,background-color] duration-200 focus-within:border-(--iu-foreground)/60 focus-within:bg-(--iu-surface) focus-within:shadow-none focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-(--iu-accent) motion-reduce:transition-none data-[invalid]:border-red-600 dark:data-[invalid]:border-red-400";

function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
function formatMoney(cents: number) {
  return money.format(cents / 100);
}

function digits(value: string) {
  return value.replace(/\D/g, "");
}

function cardBrand(number: string): { name: string; cvc: number; groups: number[] } | null {
  const d = digits(number);
  if (/^3[47]/.test(d)) return { name: "Amex", cvc: 4, groups: [4, 6, 5] };
  if (/^4/.test(d)) return { name: "Visa", cvc: 3, groups: [4, 4, 4, 4, 3] };
  if (/^(5[1-5]|2[2-7])/.test(d)) return { name: "Mastercard", cvc: 3, groups: [4, 4, 4, 4] };
  return null;
}

function formatCard(value: string) {
  const brand = cardBrand(value);
  const d = digits(value).slice(0, brand?.name === "Amex" ? 15 : 19);
  const groups = brand?.groups ?? [4, 4, 4, 4, 3];
  const out: string[] = [];
  let index = 0;
  for (const size of groups) {
    if (index >= d.length) break;
    out.push(d.slice(index, index + size));
    index += size;
  }
  return out.join(" ");
}

function formatExpiry(value: string, previous: string) {
  const d = digits(value).slice(0, 4);
  if (value.length < previous.length && previous.endsWith("/") && !value.endsWith("/")) return d.slice(0, 1);
  if (d.length >= 3) return `${d.slice(0, 2)}/${d.slice(2)}`;
  if (d.length === 2) return `${d}/`;
  if (d.length === 1 && Number(d) > 1) return `0${d}/`;
  return d;
}

function luhn(number: string) {
  const d = digits(number);
  let sum = 0;
  for (let i = 0; i < d.length; i += 1) {
    let n = Number(d[d.length - 1 - i]);
    if (i % 2 === 1) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
  }
  return d.length >= 13 && sum % 10 === 0;
}

function validate(field: Field, values: CushionValues): string | undefined {
  const value = values[field].trim();
  switch (field) {
    case "email":
      if (!value) return "Enter the email for your receipt.";
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? undefined : "That email is missing an @ or a domain.";
    case "cardNumber":
      if (!value) return "Enter your card number.";
      return luhn(value) ? undefined : "That card number is incomplete or mistyped.";
    case "expiry": {
      const match = /^(\d{2})\/(\d{2})$/.exec(value);
      if (!match) return "Use MM/YY.";
      const month = Number(match[1]);
      const year = 2000 + Number(match[2]);
      if (month < 1 || month > 12) return "Month runs from 01 to 12.";
      const now = new Date();
      if (year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1))
        return "This card has expired.";
      return undefined;
    }
    case "cvc": {
      const size = cardBrand(values.cardNumber)?.cvc ?? 3;
      return digits(value).length === size ? undefined : `Enter the ${size} digits on the back.`;
    }
    case "name":
      return value ? undefined : "Enter the name printed on the card.";
    case "postalCode":
      return value ? undefined : "Enter your postal code for tax.";
    default:
      return undefined;
  }
}

/** The total tweens to its new value with a soft spring: the signature moment. */
function Amount({ cents, className, name }: { cents: number; className?: string; name?: string }) {
  const reduceMotion = useReducedMotion();
  const value = useMotionValue(cents);
  const text = useTransform(value, (v) => formatMoney(Math.round(v)));
  useEffect(() => {
    const controls = animate(
      value,
      cents,
      reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 30, restDelta: 0.5 },
    );
    return () => controls.stop();
  }, [cents, reduceMotion, value]);
  return (
    <>
      <motion.span aria-hidden="true" data-amount={name} className={cx("tabular-nums", className)}>
        {text}
      </motion.span>
      <span className="sr-only" data-amount-sr={name}>
        {formatMoney(cents)}
      </span>
    </>
  );
}

function FieldShell({
  id,
  label,
  error,
  hint,
  children,
  className,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-2 block text-sm font-medium">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-message`} className="mt-2 flex items-start gap-1.5 text-[13px] text-red-700 dark:text-red-400">
          <CircleAlert size={14} strokeWidth={1.75} aria-hidden="true" className="mt-0.5 shrink-0" />
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-message`} className="mt-2 text-[13px] text-(--iu-muted)">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function TidewellMark() {
  return (
    <span
      aria-hidden="true"
      className="inline-flex size-10 items-center justify-center rounded-[max(var(--iu-radius),12px)] bg-(--iu-accent) text-(--iu-accent-foreground) shadow-(--cc-sh-btn)"
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <path d="M3 9c2.5-2.4 4.5-2.4 6 0s3.5 2.4 6 0 4.5-2.4 6 0" />
        <path d="M3 15c2.5-2.4 4.5-2.4 6 0s3.5 2.4 6 0 4.5-2.4 6 0" opacity="0.55" />
      </svg>
    </span>
  );
}

export function CushionCheckout({
  productName = "Tidewell",
  planName = "Team plan",
  seatPrice = { monthly: 1200, yearly: 960 },
  defaultBilling = "yearly",
  defaultSeats = 4,
  minSeats = 1,
  maxSeats = 50,
  countries = DEFAULT_COUNTRIES,
  defaultValues,
  includes = DEFAULT_INCLUDES,
  refundLine = "Full refund within 14 days, no questions asked. Cancel anytime from Settings.",
  status,
  errorTitle = "Your card was declined",
  errorMessage = "Your bank declined the charge without giving a reason. You were not charged. Try another card, or call the number on the back of yours.",
  receipt = DEFAULT_RECEIPT,
  onPay,
  onOpenWorkspace,
  onDownloadReceipt,
  className = "",
}: CushionCheckoutProps) {
  const reduceMotion = useReducedMotion();
  const uid = useId();
  const id = (name: string) => `${uid}-${name}`;
  const rootRef = useRef<HTMLElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);
  const [billing, setBilling] = useState<CushionBilling>(defaultBilling);
  const [seats, setSeats] = useState(defaultSeats);
  const [values, setValues] = useState<CushionValues>({ ...EMPTY, ...defaultValues });
  const [errors, setErrors] = useState<Errors>({});
  const [ownStatus, setOwnStatus] = useState<CushionCheckoutStatus>("idle");
  const [played, setPlayed] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const current = status ?? ownStatus;
  const loading = current === "loading";

  const country = countries.find((c) => c.code === values.country) ?? countries[0]!;
  const months = billing === "yearly" ? 12 : 1;
  const subtotal = seatPrice[billing] * seats * months;
  const tax = Math.round(subtotal * country.taxRate);
  const total = subtotal + tax;
  const saving = Math.round((1 - seatPrice.yearly / seatPrice.monthly) * 100);
  const brand = cardBrand(values.cardNumber);

  useEffect(() => {
    if (!played) return;
    if (ownStatus === "error") alertRef.current?.focus();
  }, [ownStatus, played]);

  // The spinner is an honest indicator: it only turns while the payment runs and pauses offscreen.
  useEffect(() => {
    const root = rootRef.current;
    if (!loading || !root || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry) root.toggleAttribute("data-offscreen", !entry.isIntersecting);
    });
    observer.observe(root);
    return () => {
      observer.disconnect();
      root.removeAttribute("data-offscreen");
    };
  }, [loading]);

  function update(field: Field, raw: string) {
    let value = raw;
    if (field === "cardNumber") value = formatCard(raw);
    if (field === "expiry") value = formatExpiry(raw, values.expiry);
    if (field === "cvc") value = digits(raw).slice(0, 4);
    const next = { ...values, [field]: value };
    setValues(next);
    if (errors[field]) setErrors((e) => ({ ...e, [field]: validate(field, next) }));
  }

  function blur(field: Field) {
    if (!values[field].trim()) return;
    setErrors((e) => ({ ...e, [field]: validate(field, values) }));
  }

  function changeSeats(delta: number) {
    const next = Math.min(maxSeats, Math.max(minSeats, seats + delta));
    setSeats(next);
    setAnnouncement(
      `${next} ${next === 1 ? "seat" : "seats"}, total ${formatMoney(seatPrice[billing] * next * months * (1 + country.taxRate))}`,
    );
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (loading) return;
    const found: Errors = {};
    for (const field of FIELD_ORDER) {
      const message = validate(field, values);
      if (message) found[field] = message;
    }
    setErrors(found);
    const invalid = FIELD_ORDER.filter((field) => found[field]);
    if (invalid.length > 0) {
      document.getElementById(id(invalid[0]!))?.focus();
      setAnnouncement(`${invalid.length} ${invalid.length === 1 ? "field needs" : "fields need"} attention.`);
      return;
    }
    const result = onPay?.({ ...values, billing, seats, subtotal, tax, total });
    if (status !== undefined || !result || typeof result.then !== "function") return;
    setPlayed(true);
    setOwnStatus("loading");
    setAnnouncement(`Processing payment of ${formatMoney(total)}`);
    result.then(
      () => {
        setOwnStatus("success");
        setAnnouncement("");
      },
      () => {
        setOwnStatus("error");
        setAnnouncement("");
      },
    );
  }

  const describe = (field: Field, hint?: boolean) => (errors[field] || hint ? `${id(field)}-message` : undefined);
  const input =
    "h-full w-full min-w-0 bg-transparent text-base text-(--iu-foreground) outline-none placeholder:text-(--iu-muted)";

  return (
    <MotionConfig
      reducedMotion="user"
      transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 400, damping: 30 }}
    >
      <section
        ref={rootRef}
        aria-label={`${productName} checkout`}
        data-status={current}
        className={`group/cc @container font-(family-name:--iu-font) text-(--iu-foreground) ${SOFT} ${className}`}
      >
        <div className="mx-auto grid max-w-[1000px] overflow-hidden rounded-[max(calc(var(--iu-radius)+14px),24px)] border border-(--iu-border) bg-(--iu-surface) shadow-(--cc-sh-card) @2xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] dark:border-(--iu-foreground)/10">
          <aside
            aria-labelledby={id("summary")}
            className="flex flex-col border-b border-(--iu-border) bg-(--cc-tint) p-[calc(24px*var(--iu-density))] @2xl:border-r @2xl:border-b-0 @2xl:p-[calc(36px*var(--iu-density))] dark:border-(--iu-foreground)/10"
          >
            <div className="flex items-center gap-3">
              <TidewellMark />
              <div>
                <p className="text-base font-semibold">{productName}</p>
                <p className="text-sm text-(--iu-muted)">{planName}</p>
              </div>
            </div>
            <h2 id={id("summary")} className="mt-8 text-sm font-medium text-(--iu-muted)">
              Order summary
            </h2>

            <fieldset className="mt-3">
              <legend className="sr-only">Billing period</legend>
              <div className="relative grid grid-cols-2 rounded-full border border-(--iu-foreground)/35 bg-(--cc-well) p-1 shadow-(--cc-sh-well)">
                {(["monthly", "yearly"] as const).map((option) => {
                  const checked = billing === option;
                  return (
                    <label
                      key={option}
                      data-billing-option={option}
                      className="relative flex h-10 cursor-pointer items-center justify-center gap-2 rounded-full text-sm font-medium has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-(--iu-accent)"
                    >
                      <input
                        type="radio"
                        name={id("billing")}
                        value={option}
                        checked={checked}
                        disabled={loading}
                        onChange={() => {
                          setBilling(option);
                          setAnnouncement(
                            `Billed ${option}, total ${formatMoney(seatPrice[option] * seats * (option === "yearly" ? 12 : 1) * (1 + country.taxRate))}`,
                          );
                        }}
                        className="sr-only"
                      />
                      {checked ? (
                        <motion.span
                          layoutId={id("thumb")}
                          data-thumb
                          aria-hidden="true"
                          className="absolute inset-0 rounded-full bg-(--iu-surface) shadow-(--cc-sh-thumb) dark:bg-[color-mix(in_oklab,var(--iu-foreground)_12%,var(--iu-surface))]"
                        />
                      ) : null}
                      <span className="relative">{option === "monthly" ? "Monthly" : "Yearly"}</span>
                      {option === "yearly" ? (
                        <span className="relative rounded-full bg-(--iu-accent) px-2 py-0.5 text-[11px] font-semibold text-(--iu-accent-foreground) tabular-nums">
                          Save {saving}%
                        </span>
                      ) : null}
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <div className="mt-6 flex items-center justify-between gap-4">
              <div>
                <p id={id("seats-label")} className="text-sm font-medium">
                  Seats
                </p>
                <p className="text-[13px] text-(--iu-muted)">Prorated when you add more</p>
              </div>
              <div role="group" aria-labelledby={id("seats-label")} className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => changeSeats(-1)}
                  disabled={seats <= minSeats || loading}
                  aria-label="Remove a seat"
                  className={`inline-flex size-10 items-center justify-center rounded-full border border-(--iu-foreground)/35 bg-(--iu-surface) shadow-(--cc-sh-key) transition-[scale,box-shadow,translate] duration-150 active:scale-[0.96] active:shadow-(--cc-sh-pressed) disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none motion-reduce:transition-none ${FOCUS} pointer-fine:hover:not-disabled:-translate-y-px`}
                >
                  <Minus size={16} strokeWidth={1.75} aria-hidden="true" />
                </button>
                <output
                  aria-live="off"
                  data-seats
                  className="w-12 text-center text-2xl font-semibold tracking-[-0.02em] tabular-nums"
                >
                  {seats}
                </output>
                <button
                  type="button"
                  onClick={() => changeSeats(1)}
                  disabled={seats >= maxSeats || loading}
                  aria-label="Add a seat"
                  className={`inline-flex size-10 items-center justify-center rounded-full border border-(--iu-foreground)/35 bg-(--iu-surface) shadow-(--cc-sh-key) transition-[scale,box-shadow,translate] duration-150 active:scale-[0.96] active:shadow-(--cc-sh-pressed) disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none motion-reduce:transition-none ${FOCUS} pointer-fine:hover:not-disabled:-translate-y-px`}
                >
                  <Plus size={16} strokeWidth={1.75} aria-hidden="true" />
                </button>
              </div>
            </div>

            <dl className="mt-8 space-y-3 text-sm">
              <div className="flex items-baseline justify-between gap-4">
                <dt>
                  {planName} × <span data-seats-inline>{seats}</span>
                  <span className="block text-[13px] text-(--iu-muted)" data-rate>
                    {formatMoney(seatPrice[billing])} per seat a month, billed {billing}
                  </span>
                </dt>
                <dd>
                  <Amount cents={subtotal} name="subtotal" />
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <dt>
                  <span data-tax-label>
                    {country.taxLabel} {Math.round(country.taxRate * 1000) / 10}%
                  </span>
                  <span className="block text-[13px] text-(--iu-muted)" data-tax-note>
                    {country.taxRate > 0 ? `Charged for ${country.name}` : `Not collected for ${country.name}`}
                  </span>
                </dt>
                <dd>
                  <Amount cents={tax} name="tax" />
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-4 border-t border-dashed border-(--iu-foreground)/20 pt-4">
                <dt className="font-medium">Due today</dt>
                <dd className="text-[32px] leading-none font-semibold tracking-[-0.03em]">
                  <Amount cents={total} name="total" />
                </dd>
              </div>
            </dl>

            <ul aria-label={`Included in ${planName}`} className="mt-8 space-y-2.5 text-[13px] text-(--iu-muted)">
              {includes.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <Check
                    size={14}
                    strokeWidth={2}
                    aria-hidden="true"
                    className="mt-0.5 shrink-0 text-(--iu-foreground)"
                  />
                  {item}
                </li>
              ))}
            </ul>

            <p className="mt-auto flex items-start gap-2 pt-8 text-[13px] leading-snug text-pretty text-(--iu-muted)">
              <RotateCcw size={14} strokeWidth={1.75} aria-hidden="true" className="mt-0.5 shrink-0" />
              <span>
                {refundLine} Renews on <span data-renews>{receipt.renewsOn[billing]}</span>.
              </span>
            </p>
          </aside>

          <div className="p-[calc(24px*var(--iu-density))] @2xl:p-[calc(36px*var(--iu-density))]">
            <AnimatePresence initial={false} mode="wait">
              {current === "success" ? (
                <motion.div
                  key="receipt"
                  data-receipt
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex h-full flex-col"
                >
                  <svg
                    width="56"
                    height="56"
                    viewBox="0 0 56 56"
                    fill="none"
                    aria-hidden="true"
                    className="text-(--iu-accent)"
                  >
                    <circle cx="28" cy="28" r="27" fill="currentColor" opacity="0.14" />
                    <circle cx="28" cy="28" r="20" fill="currentColor" />
                    <motion.path
                      d="M19.5 28.5l6 6 11-12"
                      stroke="var(--iu-accent-foreground)"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={played ? { pathLength: 0 } : false}
                      animate={{ pathLength: 1 }}
                      transition={
                        reduceMotion ? { duration: 0 } : { delay: 0.15, duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }
                      }
                    />
                  </svg>
                  <h2
                    ref={(node) => {
                      // The receipt mounts after the form's exit, so focus moves here once it exists.
                      if (node && played) node.focus();
                    }}
                    tabIndex={-1}
                    className="mt-6 text-2xl font-semibold tracking-[-0.02em] text-balance outline-none"
                  >
                    Payment received
                  </h2>
                  <p data-paid className="mt-2 text-base text-pretty text-(--iu-muted)">
                    {formatMoney(total)} paid to {productName}. Your receipt is on its way to{" "}
                    <span className="text-(--iu-foreground)">{values.email || "your inbox"}</span>.
                  </p>
                  <dl className="mt-8 divide-y divide-dashed divide-(--iu-foreground)/15 rounded-[max(var(--iu-radius),16px)] border border-(--iu-border) bg-(--cc-well) px-5 text-sm dark:border-(--iu-foreground)/10">
                    {[
                      ["Receipt", receipt.reference],
                      ["Date", receipt.date],
                      ["Card", brand ? `${brand.name} ending ${digits(values.cardNumber).slice(-4)}` : "Card on file"],
                      ["Seats", `${seats} on ${planName}`],
                      ["Next renewal", receipt.renewsOn[billing]],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between gap-4 py-3">
                        <dt className="text-(--iu-muted)">{label}</dt>
                        <dd data-row={label} className="text-right font-medium tabular-nums">
                          {value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  <div className="mt-auto flex flex-col gap-3 pt-8 @md:flex-row">
                    <button
                      type="button"
                      onClick={onOpenWorkspace}
                      className={`inline-flex h-12 items-center justify-center rounded-full bg-(--iu-accent) px-6 text-[15px] font-semibold text-(--iu-accent-foreground) shadow-(--cc-sh-btn) transition-[scale,box-shadow,translate] duration-150 active:scale-[0.98] active:shadow-(--cc-sh-pressed) motion-reduce:transition-none @md:flex-1 ${FOCUS} pointer-fine:hover:-translate-y-px`}
                    >
                      Open your workspace
                    </button>
                    <button
                      type="button"
                      onClick={onDownloadReceipt}
                      className={`inline-flex h-12 items-center justify-center rounded-full border border-(--iu-foreground)/35 bg-(--iu-surface) px-6 text-[15px] font-medium shadow-(--cc-sh-key) transition-[scale,box-shadow,translate] duration-150 active:scale-[0.98] active:shadow-(--cc-sh-pressed) motion-reduce:transition-none ${FOCUS} pointer-fine:hover:-translate-y-px`}
                    >
                      Download receipt
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  noValidate
                  onSubmit={submit}
                  aria-labelledby={id("payment")}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="flex flex-col gap-5"
                >
                  <div className="flex items-baseline justify-between gap-4">
                    <h2 id={id("payment")} className="text-xl font-semibold tracking-[-0.02em]">
                      Payment
                    </h2>
                    <span className="inline-flex items-center gap-1.5 text-[13px] text-(--iu-muted)">
                      <Lock size={14} strokeWidth={1.75} aria-hidden="true" />
                      Encrypted
                    </span>
                  </div>

                  {current === "error" ? (
                    <div
                      ref={alertRef}
                      role="alert"
                      tabIndex={-1}
                      className="flex gap-3 rounded-[max(var(--iu-radius),16px)] border border-red-600/30 bg-red-600/[0.06] p-4 outline-none dark:border-red-400/30 dark:bg-red-400/[0.08]"
                    >
                      <CircleAlert
                        size={18}
                        strokeWidth={1.75}
                        aria-hidden="true"
                        className="mt-0.5 shrink-0 text-red-700 dark:text-red-400"
                      />
                      <div>
                        <p className="text-sm font-semibold">{errorTitle}</p>
                        <p className="mt-1 text-[13px] leading-snug text-pretty text-(--iu-muted)">{errorMessage}</p>
                      </div>
                    </div>
                  ) : null}

                  <FieldShell id={id("email")} label="Email for receipt" error={errors.email}>
                    <div className={FIELD_BOX} data-invalid={errors.email ? "" : undefined}>
                      <input
                        id={id("email")}
                        type="email"
                        autoComplete="email"
                        inputMode="email"
                        value={values.email}
                        disabled={loading}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => update("email", e.target.value)}
                        onBlur={() => blur("email")}
                        aria-invalid={errors.email ? true : undefined}
                        aria-describedby={describe("email")}
                        placeholder="you@company.com"
                        className={input}
                      />
                    </div>
                  </FieldShell>

                  <FieldShell id={id("cardNumber")} label="Card number" error={errors.cardNumber}>
                    <div className={FIELD_BOX} data-invalid={errors.cardNumber ? "" : undefined}>
                      <CreditCard
                        size={18}
                        strokeWidth={1.5}
                        aria-hidden="true"
                        className="shrink-0 text-(--iu-muted)"
                      />
                      <input
                        id={id("cardNumber")}
                        autoComplete="cc-number"
                        inputMode="numeric"
                        value={values.cardNumber}
                        disabled={loading}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => update("cardNumber", e.target.value)}
                        onBlur={() => blur("cardNumber")}
                        aria-invalid={errors.cardNumber ? true : undefined}
                        aria-describedby={describe("cardNumber")}
                        placeholder="1234 1234 1234 1234"
                        className={cx(input, "font-mono text-[15px] tabular-nums")}
                      />
                      <AnimatePresence initial={false}>
                        {brand ? (
                          <motion.span
                            key={brand.name}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="shrink-0 rounded-full bg-(--iu-foreground) px-2 py-0.5 text-[11px] font-semibold text-(--iu-background)"
                          >
                            {brand.name}
                          </motion.span>
                        ) : null}
                      </AnimatePresence>
                    </div>
                  </FieldShell>

                  <div className="grid grid-cols-2 gap-4">
                    <FieldShell id={id("expiry")} label="Expiry" error={errors.expiry}>
                      <div className={FIELD_BOX} data-invalid={errors.expiry ? "" : undefined}>
                        <input
                          id={id("expiry")}
                          autoComplete="cc-exp"
                          inputMode="numeric"
                          value={values.expiry}
                          disabled={loading}
                          onChange={(e: ChangeEvent<HTMLInputElement>) => update("expiry", e.target.value)}
                          onBlur={() => blur("expiry")}
                          aria-invalid={errors.expiry ? true : undefined}
                          aria-describedby={describe("expiry")}
                          placeholder="MM/YY"
                          className={cx(input, "font-mono text-[15px] tabular-nums")}
                        />
                      </div>
                    </FieldShell>
                    <FieldShell id={id("cvc")} label="Security code" error={errors.cvc}>
                      <div className={FIELD_BOX} data-invalid={errors.cvc ? "" : undefined}>
                        <input
                          id={id("cvc")}
                          autoComplete="cc-csc"
                          inputMode="numeric"
                          value={values.cvc}
                          disabled={loading}
                          onChange={(e: ChangeEvent<HTMLInputElement>) => update("cvc", e.target.value)}
                          onBlur={() => blur("cvc")}
                          aria-invalid={errors.cvc ? true : undefined}
                          aria-describedby={describe("cvc")}
                          placeholder={brand?.cvc === 4 ? "4 digits" : "3 digits"}
                          className={cx(input, "font-mono text-[15px] tabular-nums")}
                        />
                      </div>
                    </FieldShell>
                  </div>

                  <FieldShell id={id("name")} label="Name on card" error={errors.name}>
                    <div className={FIELD_BOX} data-invalid={errors.name ? "" : undefined}>
                      <input
                        id={id("name")}
                        autoComplete="cc-name"
                        value={values.name}
                        disabled={loading}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => update("name", e.target.value)}
                        onBlur={() => blur("name")}
                        aria-invalid={errors.name ? true : undefined}
                        aria-describedby={describe("name")}
                        className={input}
                      />
                    </div>
                  </FieldShell>

                  <div className="grid grid-cols-1 gap-4 @md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
                    <FieldShell id={id("country")} label="Country">
                      <div className={FIELD_BOX}>
                        <select
                          id={id("country")}
                          autoComplete="country"
                          value={values.country}
                          disabled={loading}
                          onChange={(e: ChangeEvent<HTMLSelectElement>) => update("country", e.target.value)}
                          className={cx(input, "cursor-pointer appearance-none pr-6")}
                        >
                          {countries.map((c) => (
                            <option key={c.code} value={c.code}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                        <svg
                          aria-hidden="true"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.75"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="pointer-events-none absolute right-4 text-(--iu-muted)"
                        >
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </div>
                    </FieldShell>
                    <FieldShell id={id("postalCode")} label={country.postalLabel} error={errors.postalCode}>
                      <div className={FIELD_BOX} data-invalid={errors.postalCode ? "" : undefined}>
                        <input
                          id={id("postalCode")}
                          autoComplete="postal-code"
                          value={values.postalCode}
                          disabled={loading}
                          onChange={(e: ChangeEvent<HTMLInputElement>) => update("postalCode", e.target.value)}
                          onBlur={() => blur("postalCode")}
                          aria-invalid={errors.postalCode ? true : undefined}
                          aria-describedby={describe("postalCode")}
                          className={cx(input, "uppercase")}
                        />
                      </div>
                    </FieldShell>
                  </div>

                  <button
                    type="submit"
                    aria-disabled={loading || undefined}
                    className={`relative mt-2 inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-(--iu-accent) px-6 text-base font-semibold text-(--iu-accent-foreground) shadow-(--cc-sh-btn) transition-[scale,box-shadow,translate] duration-200 group-data-[status=loading]/cc:scale-[0.98] group-data-[status=loading]/cc:shadow-(--cc-sh-pressed) active:scale-[0.98] active:shadow-(--cc-sh-pressed) aria-disabled:cursor-progress motion-reduce:transition-none ${FOCUS} pointer-fine:hover:not-aria-disabled:-translate-y-px`}
                  >
                    {loading ? (
                      <>
                        <LoaderCircle
                          size={18}
                          strokeWidth={2}
                          aria-hidden="true"
                          className="animate-spin group-data-[offscreen]/cc:[animation-play-state:paused] motion-reduce:animate-none"
                        />
                        Processing payment
                      </>
                    ) : (
                      <>
                        <Lock size={16} strokeWidth={2} aria-hidden="true" />
                        <span data-pay-verb>{current === "error" ? "Try again" : "Pay"}</span>{" "}
                        <Amount cents={total} name="pay" />
                      </>
                    )}
                  </button>
                  <p data-footnote className="text-center text-[13px] leading-snug text-pretty text-(--iu-muted)">
                    {country.taxRate > 0
                      ? `Includes ${formatMoney(tax)} ${country.taxLabel}.`
                      : `No ${country.taxLabel.toLowerCase()} charged.`}{" "}
                    You will see {productName.toUpperCase()} on your statement.
                  </p>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
        <span aria-live="polite" className="sr-only">
          {announcement}
        </span>
      </section>
    </MotionConfig>
  );
}

export default CushionCheckout;
