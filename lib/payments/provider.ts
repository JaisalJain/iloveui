import "server-only";
import { isPaidPlanId, type Currency, type PaidPlanId } from "@/config/pricing";

// The one interface every payment provider implements (spec sections 6 and 11). DodoProvider runs whenever
// DODO_PAYMENTS_API_KEY is set; LocalProvider only when that key is absent in `next dev`. Both speak Dodo's webhook
// format, so one mapper turns either into the events fulfilment understands.

export type ProviderId = "dodo" | "local";

export type CheckoutRequest = {
  plan: PaidPlanId;
  currency: Currency;
  userId: string;
  email: string;
  /** Where the buyer lands after paying. Never proof of payment: only a verified webhook grants access. */
  returnUrl: string;
  /** Where the buyer lands if they back out. */
  cancelUrl: string;
};

export type CheckoutSession = { url: string; reference: string };

export type PaymentInfo = {
  paymentId: string;
  status: "succeeded" | "failed" | "pending";
  amountMinor: number;
  currency: string;
  refunded: "none" | "partial" | "full";
};

export type RefundResult = { refundId: string; status: "pending" | "succeeded" | "failed" };

/** What fulfilment acts on. `eventId` is the Standard Webhooks `webhook-id`, stable across retries. */
export type PaymentEvent =
  | {
      type: "payment.succeeded";
      eventId: string;
      paymentId: string;
      userId: string;
      email: string;
      plan: PaidPlanId;
      currency: Currency;
      amountMinor: number;
      /** Webhook payloads carry the latest state, so a late delivery can already show a full refund. */
      fullyRefunded: boolean;
    }
  | { type: "payment.failed"; eventId: string; paymentId: string }
  | { type: "refund.succeeded"; eventId: string; paymentId: string; refundId: string; partial: boolean }
  | { type: "dispute.lost"; eventId: string; paymentId: string }
  | { type: "ignored"; eventId: string; sourceType: string };

export interface PaymentProvider {
  readonly id: ProviderId;
  /** Creates a one-time checkout for the plan in the buyer's currency and returns the hosted checkout URL. */
  createCheckout(request: CheckoutRequest): Promise<CheckoutSession>;
  /** Verifies a delivery against its raw body; throws WebhookSignatureError when it is not authentic. */
  verifyWebhook(rawBody: string, headers: Headers): Promise<PaymentEvent>;
  getPayment(paymentId: string): Promise<PaymentInfo | null>;
  /** Asks for a full refund. Access is revoked only when the refund webhook arrives. */
  refund(paymentId: string, reason: string): Promise<RefundResult>;
  /** The provider's invoice document for a payment, or null when the provider issues none. */
  getInvoice(paymentId: string): Promise<Response | null>;
}

export function isDodoConfigured(): boolean {
  return Boolean(process.env.DODO_PAYMENTS_API_KEY?.trim());
}

/**
 * The active provider, or null when payments are not configured (a production build without Dodo keys). The
 * LocalProvider import sits inside the development branch: NODE_ENV is a compile-time constant, so production
 * bundles drop it entirely and scripts/check-build.ts proves it.
 */
export async function getPaymentProvider(): Promise<PaymentProvider | null> {
  if (isDodoConfigured()) {
    const { DodoProvider } = await import("./dodo");
    return new DodoProvider();
  }
  if (process.env.NODE_ENV === "development") {
    const { createLocalProvider } = await import("./local");
    return createLocalProvider();
  }
  return null;
}

type Json = Record<string, unknown>;

function record(value: unknown): Json | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Json) : null;
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

/**
 * Maps a verified Dodo-format webhook body to a PaymentEvent. Anything without iloveui's metadata (the dashboard's
 * "Send example" events, other products, event types we do not handle) becomes "ignored": acknowledged, recorded,
 * never fulfilled.
 */
export function toPaymentEvent(eventId: string, body: unknown): PaymentEvent {
  const envelope = record(body);
  const type = text(envelope?.type) ?? "unknown";
  const data = record(envelope?.data);
  const ignored: PaymentEvent = { type: "ignored", eventId, sourceType: type };
  const paymentId = text(data?.payment_id);
  if (!data || !paymentId) return ignored;

  switch (type) {
    case "payment.succeeded": {
      const metadata = record(data.metadata);
      const customer = record(data.customer);
      const userId = text(metadata?.clerk_user_id);
      const plan = metadata?.plan;
      const currency = data.currency;
      const amountMinor = data.total_amount;
      const email = (text(metadata?.email) ?? text(customer?.email) ?? "").toLowerCase();
      if (
        data.status !== "succeeded" ||
        !userId ||
        !isPaidPlanId(plan) ||
        (currency !== "USD" && currency !== "INR") ||
        typeof amountMinor !== "number" ||
        !Number.isInteger(amountMinor) ||
        !email
      ) {
        return ignored;
      }
      return {
        type,
        eventId,
        paymentId,
        userId,
        email,
        plan,
        currency,
        amountMinor,
        fullyRefunded: data.refund_status === "full",
      };
    }
    case "payment.failed":
      return { type, eventId, paymentId };
    case "refund.succeeded":
      return {
        type,
        eventId,
        paymentId,
        refundId: text(data.refund_id) ?? "",
        partial: data.is_partial !== false,
      };
    case "dispute.lost":
    case "dispute.accepted":
      // Both return the funds to the buyer, so both end access like a refund.
      return { type: "dispute.lost", eventId, paymentId };
    default:
      return ignored;
  }
}
