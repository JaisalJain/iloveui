import DodoPayments from "dodopayments";
import { describe, expect, it } from "vitest";
import { LocalProvider } from "@/lib/payments/local";
import { toPaymentEvent } from "@/lib/payments/provider";
import { WebhookSignatureError, signWebhook, verifyWebhook, webhookHeaders } from "@/lib/standard-webhooks";

const secret = `whsec_${btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))))}`;
const body = JSON.stringify({ business_id: "local", type: "payment.succeeded", data: { payment_id: "pay_1" } });

describe("Standard Webhooks signing", () => {
  it("verifies a valid signature and returns the webhook id", async () => {
    const headers = new Headers(await webhookHeaders(secret, "msg_1", body));
    await expect(verifyWebhook(secret, headers, body)).resolves.toBe("msg_1");
  });

  it("rejects a tampered body, a wrong secret and missing headers", async () => {
    const headers = new Headers(await webhookHeaders(secret, "msg_1", body));
    await expect(verifyWebhook(secret, headers, body.replace("pay_1", "pay_2"))).rejects.toThrow(WebhookSignatureError);
    const other = `whsec_${btoa("another secret of thirty-two bytes")}`;
    await expect(verifyWebhook(other, headers, body)).rejects.toThrow(WebhookSignatureError);
    await expect(verifyWebhook(secret, new Headers(), body)).rejects.toThrow(WebhookSignatureError);
  });

  it("rejects stale and future timestamps", async () => {
    const now = Date.now();
    const stale = Math.floor(now / 1000) - 301;
    const headers = new Headers(await webhookHeaders(secret, "msg_1", body, stale));
    await expect(verifyWebhook(secret, headers, body, { now })).rejects.toThrow(/tolerance/);
    const future = new Headers(await webhookHeaders(secret, "msg_1", body, Math.floor(now / 1000) + 301));
    await expect(verifyWebhook(secret, future, body, { now })).rejects.toThrow(/tolerance/);
  });

  it("accepts any matching signature in a rotated list", async () => {
    const ts = Math.floor(Date.now() / 1000);
    const good = await signWebhook(secret, "msg_1", ts, body);
    const headers = new Headers({
      "webhook-id": "msg_1",
      "webhook-timestamp": String(ts),
      "webhook-signature": `v1,AAAA ${good}`,
    });
    await expect(verifyWebhook(secret, headers, body)).resolves.toBe("msg_1");
  });

  it("is wire-compatible with the Dodo SDK's verification", async () => {
    const headers = await webhookHeaders(secret, "msg_local_1", body);
    const client = new DodoPayments({ bearerToken: "unused", environment: "test_mode", baseURL: null });
    expect(() => client.webhooks.unwrap(body, { headers, key: secret })).not.toThrow();
    expect(() => client.webhooks.unwrap(`${body} `, { headers, key: secret })).toThrow();
  });
});

describe("webhook payload mapping", () => {
  const payment = {
    type: "payment.succeeded",
    data: {
      payment_id: "pay_1",
      status: "succeeded",
      total_amount: 9900,
      currency: "USD",
      customer: { email: "Ira@Quillstone.dev" },
      metadata: { clerk_user_id: "user_1", plan: "pro", currency: "USD" },
      refund_status: null,
    },
  };

  it("maps a paid iloveui checkout", () => {
    expect(toPaymentEvent("msg_1", payment)).toEqual({
      type: "payment.succeeded",
      eventId: "msg_1",
      paymentId: "pay_1",
      userId: "user_1",
      email: "ira@quillstone.dev",
      plan: "pro",
      currency: "USD",
      amountMinor: 9900,
      fullyRefunded: false,
    });
  });

  it("ignores payments without iloveui metadata or with a bad plan", () => {
    const sample = { ...payment, data: { ...payment.data, metadata: {} } };
    expect(toPaymentEvent("msg_2", sample)).toEqual({
      type: "ignored",
      eventId: "msg_2",
      sourceType: "payment.succeeded",
    });
    const badPlan = { ...payment, data: { ...payment.data, metadata: { clerk_user_id: "u", plan: "gold" } } };
    expect(toPaymentEvent("msg_3", badPlan).type).toBe("ignored");
    expect(toPaymentEvent("msg_4", { type: "subscription.active", data: { payment_id: "p" } }).type).toBe("ignored");
  });

  it("maps refunds, partial refunds and lost disputes", () => {
    const refund = { type: "refund.succeeded", data: { payment_id: "pay_1", refund_id: "ref_1", is_partial: false } };
    expect(toPaymentEvent("m", refund)).toMatchObject({ type: "refund.succeeded", partial: false });
    const partial = { type: "refund.succeeded", data: { payment_id: "pay_1", refund_id: "ref_1", is_partial: true } };
    expect(toPaymentEvent("m", partial)).toMatchObject({ partial: true });
    expect(toPaymentEvent("m", { type: "dispute.lost", data: { payment_id: "pay_1" } }).type).toBe("dispute.lost");
    expect(toPaymentEvent("m", { type: "dispute.accepted", data: { payment_id: "pay_1" } }).type).toBe("dispute.lost");
  });
});

describe("LocalProvider", () => {
  const sent: { url: string; init: RequestInit }[] = [];
  const provider = new LocalProvider({
    secret,
    siteUrl: "http://localhost:3000",
    send: async (url, init) => {
      sent.push({ url, init });
      return new Response(null, { status: 200 });
    },
  });
  const request = {
    plan: "team" as const,
    currency: "INR" as const,
    userId: "user_1",
    email: "ira@quillstone.dev",
    returnUrl: "http://localhost:3000/account?checkout=success",
    cancelUrl: "http://localhost:3000/pricing",
  };

  it("creates a signed /dev/checkout link at the plan's price", async () => {
    const session = await provider.createCheckout(request);
    const url = new URL(session.url);
    expect(url.pathname).toBe("/dev/checkout");
    const read = await provider.readCheckout(url.searchParams.get("session"));
    expect(read).toMatchObject({ plan: "team", currency: "INR", amountMinor: 1_499_900, userId: "user_1" });
  });

  it("rejects altered and expired links", async () => {
    const token = new URL((await provider.createCheckout(request)).url).searchParams.get("session") ?? "";
    const [payload, mac] = token.split(".");
    const forged = btoa(JSON.stringify({ ...(await provider.readCheckout(token)), amountMinor: 100 }))
      .replaceAll("=", "")
      .replaceAll("+", "-")
      .replaceAll("/", "_");
    expect(await provider.readCheckout(`${forged}.${mac}`)).toBeNull();
    expect(await provider.readCheckout(`${payload}`)).toBeNull();
    const later = new LocalProvider({
      secret,
      siteUrl: "http://localhost:3000",
      now: () => Date.now() + 25 * 3600_000,
    });
    expect(await later.readCheckout(token)).toBeNull();
  });

  it("Pay sends a signed payment.succeeded webhook and returns the return URL", async () => {
    sent.length = 0;
    const token = new URL((await provider.createCheckout(request)).url).searchParams.get("session") ?? "";
    const result = await provider.completeCheckout(token, "succeeded");
    expect(result.ok).toBe(true);
    expect(result.returnUrl).toMatch(/\/account\?checkout=success&payment_id=pay_local_.+&status=succeeded$/);
    const delivery = sent[0];
    expect(delivery?.url).toBe("http://localhost:3000/api/webhooks/local");
    const event = await provider.verifyWebhook(String(delivery?.init.body), new Headers(delivery?.init.headers));
    expect(event).toMatchObject({ type: "payment.succeeded", plan: "team", currency: "INR", amountMinor: 1_499_900 });
  });

  it("Fail sends payment.failed and returns no return URL", async () => {
    sent.length = 0;
    const token = new URL((await provider.createCheckout(request)).url).searchParams.get("session") ?? "";
    expect(await provider.completeCheckout(token, "failed")).toEqual({ ok: true, returnUrl: null });
    const delivery = sent[0];
    const event = await provider.verifyWebhook(String(delivery?.init.body), new Headers(delivery?.init.headers));
    expect(event.type).toBe("payment.failed");
  });

  it("refund sends a signed full refund.succeeded", async () => {
    sent.length = 0;
    const refund = await provider.refund("pay_local_1", "test");
    expect(refund.status).toBe("succeeded");
    const delivery = sent[0];
    const event = await provider.verifyWebhook(String(delivery?.init.body), new Headers(delivery?.init.headers));
    expect(event).toMatchObject({ type: "refund.succeeded", paymentId: "pay_local_1", partial: false });
  });
});
