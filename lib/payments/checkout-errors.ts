// Why a checkout could not start, shared by the checkout routes and the pricing page that explains it.

export type CheckoutError = "invalid_plan" | "not_configured" | "rate_limited" | "already_owned" | "failed";

/** The messages the pricing page shows for `?checkout_error=<code>`. */
export const CHECKOUT_ERROR_MESSAGES: Record<CheckoutError, string> = {
  invalid_plan: "That plan does not exist. Pick Pro or Team below.",
  not_configured: "Payments are not configured on this server yet, so checkout is unavailable.",
  rate_limited: "Too many checkout attempts in the last hour. Try again later.",
  already_owned: "You already own this plan. Your account page has your license.",
  failed: "Checkout could not start. Nothing was charged; try again in a moment.",
};

export const CHECKOUT_ERROR_STATUS: Record<CheckoutError, number> = {
  invalid_plan: 400,
  not_configured: 503,
  rate_limited: 429,
  already_owned: 409,
  failed: 502,
};

export function isCheckoutError(value: unknown): value is CheckoutError {
  return typeof value === "string" && Object.hasOwn(CHECKOUT_ERROR_MESSAGES, value);
}
