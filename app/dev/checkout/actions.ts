"use server";

export type CheckoutActionResult = { ok: boolean; returnUrl: string | null };

/** Pay or Fail on the local test checkout: LocalProvider sends the signed webhook and waits for fulfilment. */
export async function completeLocalCheckout(
  token: string,
  outcome: "succeeded" | "failed",
): Promise<CheckoutActionResult> {
  if (process.env.NODE_ENV === "development" && (outcome === "succeeded" || outcome === "failed")) {
    const { createLocalProvider } = await import("@/lib/payments/local");
    const provider = await createLocalProvider();
    return provider.completeCheckout(token, outcome);
  }
  return { ok: false, returnUrl: null };
}
