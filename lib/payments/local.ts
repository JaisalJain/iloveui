import "server-only";
import { and, eq } from "drizzle-orm";
import { PAID_PLANS, isPaidPlanId, type Currency, type PaidPlanId } from "@/config/pricing";
import type { Db } from "@/lib/db/create";
import { licenses } from "@/lib/db/schema";
import { site } from "@/lib/site";
import { verifyWebhook, webhookHeaders } from "@/lib/standard-webhooks";
import {
  toPaymentEvent,
  type CheckoutRequest,
  type CheckoutSession,
  type PaymentEvent,
  type PaymentInfo,
  type PaymentProvider,
  type RefundResult,
} from "./provider";

// LocalProvider (spec section 0): a stand-in for Dodo that needs no account. It sells the same plans at the same
// prices, serves a test checkout at /dev/checkout, and reports every outcome as a Dodo-format webhook signed with
// Standard Webhooks (LOCAL_WEBHOOK_SECRET) to /api/webhooks/local, which runs the same fulfilment as Dodo's.
// Only `next dev` ever loads this module; the marker below lets scripts/check-build.ts prove production never does.

export const LOCAL_PROVIDER_MARKER = "iloveui-local-provider";

/** How long a local checkout link stays valid, matching Dodo's 24-hour sessions. */
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

export type LocalCheckoutSession = {
  reference: string;
  paymentId: string;
  plan: PaidPlanId;
  currency: Currency;
  amountMinor: number;
  userId: string;
  email: string;
  returnUrl: string;
  cancelUrl: string;
  expiresAt: number;
};

export type LocalOutcome = "succeeded" | "failed";

type Options = {
  secret: string;
  siteUrl: string;
  /** Sends the webhook; tests replace it to deliver in-process. */
  send?: (url: string, init: RequestInit) => Promise<Response>;
  /** Looks up recorded local payments; local payments exist only as license rows. */
  db?: () => Db;
  now?: () => number;
};

const encoder = new TextEncoder();

function base64url(bytes: Uint8Array): string {
  let bin = "";
  for (const byte of bytes) bin += String.fromCharCode(byte);
  return btoa(bin).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function fromBase64url(value: string): Uint8Array<ArrayBuffer> {
  const bin = atob(value.replaceAll("-", "+").replaceAll("_", "/"));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
  return out;
}

function randomId(prefix: string): string {
  return `${prefix}${base64url(crypto.getRandomValues(new Uint8Array(12)))}`;
}

export class LocalProvider implements PaymentProvider {
  readonly id = "local" as const;
  readonly #secret: string;
  readonly #siteUrl: string;
  readonly #send: (url: string, init: RequestInit) => Promise<Response>;
  readonly #db: (() => Db) | undefined;
  readonly #now: () => number;

  constructor({ secret, siteUrl, send = (url, init) => fetch(url, init), db, now = Date.now }: Options) {
    this.#secret = secret;
    this.#siteUrl = siteUrl.replace(/\/$/, "");
    this.#send = send;
    this.#db = db;
    this.#now = now;
  }

  // The checkout link carries its own signed session, so the checkout page needs no storage and no sign-in.
  async #sessionKey(): Promise<CryptoKey> {
    const digest = await crypto.subtle.digest("SHA-256", encoder.encode(`checkout-session:${this.#secret}`));
    return crypto.subtle.importKey("raw", digest, { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
  }

  async createCheckout(request: CheckoutRequest): Promise<CheckoutSession> {
    const session: LocalCheckoutSession = {
      reference: randomId("cks_local_"),
      paymentId: randomId("pay_local_"),
      plan: request.plan,
      currency: request.currency,
      amountMinor: PAID_PLANS[request.plan].prices[request.currency].amountMinor,
      userId: request.userId,
      email: request.email,
      returnUrl: request.returnUrl,
      cancelUrl: request.cancelUrl,
      expiresAt: this.#now() + SESSION_TTL_MS,
    };
    const payload = base64url(encoder.encode(JSON.stringify(session)));
    const mac = new Uint8Array(await crypto.subtle.sign("HMAC", await this.#sessionKey(), encoder.encode(payload)));
    const url = new URL("/dev/checkout", this.#siteUrl);
    url.searchParams.set("session", `${payload}.${base64url(mac)}`);
    return { url: url.toString(), reference: session.reference };
  }

  /** The session behind a checkout link, or null when the link was altered or has expired. */
  async readCheckout(token: string | null | undefined): Promise<LocalCheckoutSession | null> {
    const [payload, mac, extra] = (token ?? "").split(".");
    if (!payload || !mac || extra !== undefined) return null;
    try {
      const valid = await crypto.subtle.verify(
        "HMAC",
        await this.#sessionKey(),
        fromBase64url(mac),
        encoder.encode(payload),
      );
      if (!valid) return null;
      const session = JSON.parse(new TextDecoder().decode(fromBase64url(payload))) as LocalCheckoutSession;
      if (!isPaidPlanId(session.plan) || session.expiresAt < this.#now()) return null;
      return session;
    } catch {
      return null;
    }
  }

  /** The Pay and Fail buttons: reports the outcome to /api/webhooks/local exactly as Dodo would. */
  async completeCheckout(token: string, outcome: LocalOutcome): Promise<{ ok: boolean; returnUrl: string | null }> {
    const session = await this.readCheckout(token);
    if (!session) return { ok: false, returnUrl: null };
    const delivered = await this.#deliver(outcome === "succeeded" ? "payment.succeeded" : "payment.failed", {
      payload_type: "Payment",
      payment_id: session.paymentId,
      checkout_session_id: session.reference,
      status: outcome,
      total_amount: session.amountMinor,
      currency: session.currency,
      customer: { customer_id: `cus_local_${session.userId}`, email: session.email, name: session.email },
      metadata: { clerk_user_id: session.userId, email: session.email, plan: session.plan, currency: session.currency },
      product_cart: [{ product_id: `local_${session.plan}_${session.currency.toLowerCase()}`, quantity: 1 }],
      refunds: [],
      refund_status: null,
      ...(outcome === "failed"
        ? { error_code: "GENERIC_DECLINE", error_message: "The local test checkout declined this payment." }
        : {}),
    });
    if (!delivered || outcome === "failed") return { ok: delivered, returnUrl: null };
    // Dodo appends these to the return URL too; the account page still waits for the license in D1.
    const returnUrl = new URL(session.returnUrl);
    returnUrl.searchParams.set("payment_id", session.paymentId);
    returnUrl.searchParams.set("status", "succeeded");
    return { ok: true, returnUrl: returnUrl.toString() };
  }

  async #deliver(type: string, data: Record<string, unknown>): Promise<boolean> {
    const body = JSON.stringify({
      business_id: LOCAL_PROVIDER_MARKER,
      type,
      timestamp: new Date(this.#now()).toISOString(),
      data,
    });
    const headers = await webhookHeaders(this.#secret, randomId("msg_local_"), body);
    const response = await this.#send(`${this.#siteUrl}/api/webhooks/local`, {
      method: "POST",
      headers: { ...headers, "content-type": "application/json" },
      body,
    });
    return response.ok;
  }

  async verifyWebhook(rawBody: string, headers: Headers): Promise<PaymentEvent> {
    const eventId = await verifyWebhook(this.#secret, headers, rawBody, { now: this.#now() });
    return toPaymentEvent(eventId, JSON.parse(rawBody));
  }

  async getPayment(paymentId: string): Promise<PaymentInfo | null> {
    if (!this.#db) return null;
    const license = await this.#db()
      .select({ amountMinor: licenses.amountMinor, currency: licenses.currency, status: licenses.status })
      .from(licenses)
      .where(and(eq(licenses.provider, "local"), eq(licenses.providerPaymentId, paymentId)))
      .get();
    if (!license) return null;
    return {
      paymentId,
      status: "succeeded",
      amountMinor: license.amountMinor,
      currency: license.currency,
      refunded: license.status === "refunded" ? "full" : "none",
    };
  }

  /** A local refund completes at once: the signed refund webhook is delivered before this returns. */
  async refund(paymentId: string, reason: string): Promise<RefundResult> {
    const refundId = randomId("ref_local_");
    const delivered = await this.#deliver("refund.succeeded", {
      payload_type: "Refund",
      refund_id: refundId,
      payment_id: paymentId,
      is_partial: false,
      status: "succeeded",
      reason,
    });
    return { refundId, status: delivered ? "succeeded" : "failed" };
  }

  /** Local purchases have no Merchant of Record invoice; the invoice route prints a labelled test receipt. */
  async getInvoice(): Promise<Response | null> {
    return null;
  }
}

export async function createLocalProvider(): Promise<LocalProvider> {
  const secret = process.env.LOCAL_WEBHOOK_SECRET?.trim();
  if (!secret) throw new Error("LOCAL_WEBHOOK_SECRET is not set. Run pnpm setup.");
  const { getDb } = await import("@/lib/db");
  return new LocalProvider({ secret, siteUrl: site.url, db: getDb });
}
