// Plans and prices (spec section 11). The pricing page, checkout and fulfilment all read them from here, and
// LocalProvider sells exactly these plans.

export type Currency = "USD" | "INR";
export type PaidPlanId = "pro" | "team";
export type PlanId = "free" | PaidPlanId;

type Price = {
  /** What a buyer pays today, in minor units (cents or paise). */
  amountMinor: number;
  /** The regular price when a launch price is running. */
  regularMinor?: number;
};

export type PaidPlan = {
  id: PaidPlanId;
  name: string;
  summary: string;
  seats: number;
  prices: Record<Currency, Price>;
  /** Environment variables holding the Dodo Payments product id for each currency. */
  dodoProductEnv: Record<Currency, string>;
};

export const FREE_PLAN = {
  id: "free",
  name: "Free",
  summary: "24 designs, free forever, for personal and commercial work.",
  designs: 24,
  seats: 1,
} as const;

export const PAID_PLANS: Record<PaidPlanId, PaidPlan> = {
  pro: {
    id: "pro",
    name: "Pro",
    summary: "Every current and future design for one person, with one lifetime payment.",
    seats: 1,
    prices: { USD: { amountMinor: 9_900, regularMinor: 14_900 }, INR: { amountMinor: 499_900 } },
    dodoProductEnv: { USD: "DODO_PRODUCT_PRO_USD", INR: "DODO_PRODUCT_PRO_INR" },
  },
  team: {
    id: "team",
    name: "Team",
    summary: "Everything in Pro for up to 10 people, with seats managed from one account.",
    seats: 10,
    prices: { USD: { amountMinor: 29_900 }, INR: { amountMinor: 1_499_900 } },
    dodoProductEnv: { USD: "DODO_PRODUCT_TEAM_USD", INR: "DODO_PRODUCT_TEAM_INR" },
  },
};

export function isPaidPlanId(value: unknown): value is PaidPlanId {
  return value === "pro" || value === "team";
}

/** "$99" or "₹4,999": whole units, grouped the way each currency's buyers read prices. */
export function formatPrice(amountMinor: number, currency: Currency): string {
  return new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amountMinor / 100);
}
