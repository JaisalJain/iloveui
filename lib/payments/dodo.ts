import "server-only";
import DodoPayments from "dodopayments";
import { PAID_PLANS } from "@/config/pricing";
import { WebhookSignatureError } from "@/lib/standard-webhooks";
import {
  toPaymentEvent,
  type CheckoutRequest,
  type CheckoutSession,
  type PaymentEvent,
  type PaymentInfo,
  type PaymentProvider,
  type RefundResult,
} from "./provider";

// Dodo Payments, Merchant of Record (spec sections 0 and 11), through the official SDK. The client is built per
// call from process.env: Workers forbid reusing I/O objects across requests, and the SDK throws without a key.

type DodoEnvironment = "test_mode" | "live_mode";

/** The SDK defaults to live_mode and ignores DODO_PAYMENTS_ENVIRONMENT, so it is always passed explicitly. */
export function dodoEnvironment(value = process.env.DODO_PAYMENTS_ENVIRONMENT): DodoEnvironment {
  return value?.trim() === "live_mode" ? "live_mode" : "test_mode";
}

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not set.`);
  return value;
}

export function createDodoClient(): DodoPayments {
  return new DodoPayments({
    bearerToken: requiredEnv("DODO_PAYMENTS_API_KEY"),
    environment: dodoEnvironment(),
    // A stray DODO_PAYMENTS_BASE_URL next to `environment` would throw "Ambiguous URL".
    baseURL: null,
    webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_KEY?.trim() || null,
    timeout: 15_000,
    maxRetries: 2,
  });
}

export class DodoProvider implements PaymentProvider {
  readonly id = "dodo" as const;

  async createCheckout(request: CheckoutRequest): Promise<CheckoutSession> {
    const productId = requiredEnv(PAID_PLANS[request.plan].dodoProductEnv[request.currency]);
    const session = await createDodoClient().checkoutSessions.create({
      product_cart: [{ product_id: productId, quantity: 1 }],
      customer: { email: request.email },
      ...(request.currency === "INR" ? { billing_address: { country: "IN" as const } } : {}),
      billing_currency: request.currency,
      minimal_address: true,
      return_url: request.returnUrl,
      cancel_url: request.cancelUrl,
      // Metadata values are strings only; fulfilment validates them again when the webhook arrives.
      metadata: {
        clerk_user_id: request.userId,
        email: request.email,
        plan: request.plan,
        currency: request.currency,
      },
      feature_flags: { allow_currency_selection: false, allow_discount_code: false, redirect_immediately: true },
      customization: { theme: "system" },
    });
    if (!session.checkout_url) throw new Error(`Dodo checkout session ${session.session_id} has no URL.`);
    return { url: session.checkout_url, reference: session.session_id };
  }

  async verifyWebhook(rawBody: string, headers: Headers): Promise<PaymentEvent> {
    const id = headers.get("webhook-id");
    const signature = headers.get("webhook-signature");
    const timestamp = headers.get("webhook-timestamp");
    // unwrap() skips verification when no headers are passed, so missing headers never reach it.
    if (!id || !signature || !timestamp) throw new WebhookSignatureError("Missing webhook headers.");
    // A missing key is a configuration error: a 500 makes Dodo retry once it is fixed.
    const key = requiredEnv("DODO_PAYMENTS_WEBHOOK_KEY");
    let event: unknown;
    try {
      event = createDodoClient().webhooks.unwrap(rawBody, {
        headers: { "webhook-id": id, "webhook-signature": signature, "webhook-timestamp": timestamp },
        key,
      });
    } catch (cause) {
      throw new WebhookSignatureError("Webhook signature verification failed.", { cause });
    }
    return toPaymentEvent(id, event);
  }

  async getPayment(paymentId: string): Promise<PaymentInfo | null> {
    try {
      const payment = await createDodoClient().payments.retrieve(paymentId);
      return {
        paymentId: payment.payment_id,
        status:
          payment.status === "succeeded"
            ? "succeeded"
            : payment.status === "failed" || payment.status === "cancelled"
              ? "failed"
              : "pending",
        amountMinor: payment.total_amount,
        currency: payment.currency,
        refunded: payment.refund_status ?? "none",
      };
    } catch (error) {
      if (error instanceof DodoPayments.NotFoundError) return null;
      throw error;
    }
  }

  async refund(paymentId: string, reason: string): Promise<RefundResult> {
    // The SDK sends no idempotency key, so a retried POST could ask twice; Dodo refuses the second anyway.
    const refund = await createDodoClient().refunds.create({ payment_id: paymentId, reason }, { maxRetries: 0 });
    return {
      refundId: refund.refund_id,
      status: refund.status === "succeeded" ? "succeeded" : refund.status === "failed" ? "failed" : "pending",
    };
  }

  async getInvoice(paymentId: string): Promise<Response | null> {
    try {
      return await createDodoClient().invoices.payments.retrieve(paymentId);
    } catch (error) {
      if (error instanceof DodoPayments.NotFoundError) return null;
      throw error;
    }
  }
}
