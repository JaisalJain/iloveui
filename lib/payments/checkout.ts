import "server-only";
import { and, eq } from "drizzle-orm";
import { isPaidPlanId, type Currency, type PaidPlanId } from "@/config/pricing";
import type { Db } from "@/lib/db/create";
import { licenses } from "@/lib/db/schema";
import { rateLimit } from "@/lib/rate-limit";
import { absoluteUrl } from "@/lib/site";
import type { CheckoutError } from "./checkout-errors";
import { getPaymentProvider } from "./provider";

// Starting a checkout (spec section 11), shared by GET /checkout (the pricing page buttons) and POST /api/checkout.
// The caller is signed in; this decides whether a checkout may start and asks the active provider for its URL.

export { CHECKOUT_ERROR_MESSAGES, CHECKOUT_ERROR_STATUS, isCheckoutError, type CheckoutError } from "./checkout-errors";

export const CHECKOUT_LIMIT = { limit: 10, windowMs: 60 * 60 * 1000 };

export async function startCheckout(
  db: Db,
  viewer: { id: string; email: string },
  plan: unknown,
  currency: Currency,
): Promise<{ ok: true; url: string } | { ok: false; error: CheckoutError }> {
  if (!isPaidPlanId(plan)) return { ok: false, error: "invalid_plan" };
  const provider = await getPaymentProvider();
  if (!provider) return { ok: false, error: "not_configured" };

  // Buying the plan you own (or Pro while owning Team) would only charge twice; Pro owners may still buy Team.
  const owned = await db
    .select({ plan: licenses.plan })
    .from(licenses)
    .where(and(eq(licenses.ownerUserId, viewer.id), eq(licenses.status, "active")));
  if (owned.some((license) => license.plan === plan || license.plan === "team")) {
    return { ok: false, error: "already_owned" };
  }

  const limit = await rateLimit(db, { key: `checkout:${viewer.id}`, ...CHECKOUT_LIMIT });
  if (!limit.ok) return { ok: false, error: "rate_limited" };

  try {
    const session = await provider.createCheckout({
      plan: plan satisfies PaidPlanId,
      currency,
      userId: viewer.id,
      email: viewer.email,
      returnUrl: absoluteUrl("/account?checkout=success"),
      cancelUrl: absoluteUrl("/pricing"),
    });
    return { ok: true, url: session.url };
  } catch (error) {
    console.error("Checkout could not start", error);
    return { ok: false, error: "failed" };
  }
}
