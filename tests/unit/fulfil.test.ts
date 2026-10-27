import { eq } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { apiTokens, licenses, seats, users, webhookEvents } from "@/lib/db/schema";
import { getAccess } from "@/lib/entitlements";
import { applyPaymentEvent, fulfil, licenseIdFor } from "@/lib/payments/fulfil";
import { LocalProvider } from "@/lib/payments/local";
import type { PaymentEvent } from "@/lib/payments/provider";
import { webhookHeaders } from "@/lib/standard-webhooks";
import { createTestDb, resetTestDb, type TestDb } from "./helpers/d1";

let t: TestDb;
const secret = `whsec_${btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))))}`;

beforeAll(async () => {
  t = await createTestDb();
});

afterAll(async () => {
  await t?.dispose();
});

beforeEach(async () => {
  await resetTestDb(t.db);
});

const paid = (overrides: Partial<Extract<PaymentEvent, { type: "payment.succeeded" }>> = {}): PaymentEvent => ({
  type: "payment.succeeded",
  eventId: "msg_pay",
  paymentId: "pay_1",
  userId: "user_owner",
  email: "ira@quillstone.dev",
  plan: "pro",
  currency: "USD",
  amountMinor: 9900,
  fullyRefunded: false,
  ...overrides,
});

const refunded = (overrides: Partial<Extract<PaymentEvent, { type: "refund.succeeded" }>> = {}): PaymentEvent => ({
  type: "refund.succeeded",
  eventId: "msg_refund",
  paymentId: "pay_1",
  refundId: "ref_1",
  partial: false,
  ...overrides,
});

async function token(userId: string, email = `${userId}@quillstone.dev`) {
  await t.db.insert(users).values({ id: userId, email }).onConflictDoNothing();
  await t.db.insert(apiTokens).values({ id: crypto.randomUUID(), userId, tokenHash: `hash_${userId}` });
}

describe("fulfilment", () => {
  it("creates exactly one license for a payment and grants Pro", async () => {
    expect(await applyPaymentEvent(t.db, "local", paid())).toBe("granted");
    const rows = await t.db.select().from(licenses);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      id: await licenseIdFor("local", "pay_1"),
      ownerUserId: "user_owner",
      plan: "pro",
      currency: "USD",
      amountMinor: 9900,
      provider: "local",
      status: "active",
    });
    expect(await t.db.$count(seats)).toBe(0);
    expect(await getAccess(t.db, "user_owner")).toMatchObject({ pro: true, via: "license", plan: "pro" });
  });

  it("ignores duplicate events and a second event for the same payment", async () => {
    await applyPaymentEvent(t.db, "local", paid());
    expect(await applyPaymentEvent(t.db, "local", paid())).toBe("duplicate");
    expect(await applyPaymentEvent(t.db, "local", paid({ eventId: "msg_pay_retry" }))).toBe("granted");
    expect(await t.db.$count(licenses)).toBe(1);
    expect(await t.db.$count(webhookEvents)).toBe(2);
  });

  it("creates the owner's active seat for Team", async () => {
    await applyPaymentEvent(t.db, "local", paid({ plan: "team", amountMinor: 29900 }));
    const [seat] = await t.db.select().from(seats);
    expect(seat).toMatchObject({ email: "ira@quillstone.dev", userId: "user_owner", status: "active" });
  });

  it("revokes access and deletes the owner's and seat holders' tokens on a full refund", async () => {
    await applyPaymentEvent(t.db, "local", paid({ plan: "team", amountMinor: 29900 }));
    const licenseId = await licenseIdFor("local", "pay_1");
    await token("user_owner");
    await token("user_seat");
    await token("user_bystander");
    await t.db.insert(seats).values({
      id: crypto.randomUUID(),
      licenseId,
      email: "user_seat@quillstone.dev",
      userId: "user_seat",
      status: "active",
    });
    expect((await getAccess(t.db, "user_seat")).pro).toBe(true);

    expect(await applyPaymentEvent(t.db, "local", refunded())).toBe("revoked");
    expect((await t.db.select().from(licenses))[0]?.status).toBe("refunded");
    expect((await getAccess(t.db, "user_owner")).pro).toBe(false);
    expect((await getAccess(t.db, "user_seat")).pro).toBe(false);
    const remaining = await t.db.select({ userId: apiTokens.userId }).from(apiTokens);
    expect(remaining.map((row) => row.userId)).toEqual(["user_bystander"]);
    const seatStatuses = await t.db.select({ status: seats.status }).from(seats);
    expect(seatStatuses.every((seat) => seat.status === "removed")).toBe(true);
  });

  it("keeps the token of a seat holder who still owns Pro elsewhere", async () => {
    await applyPaymentEvent(t.db, "local", paid({ plan: "team", amountMinor: 29900 }));
    await applyPaymentEvent(
      t.db,
      "local",
      paid({ eventId: "msg_pay_2", paymentId: "pay_2", userId: "user_seat", email: "user_seat@quillstone.dev" }),
    );
    await t.db.insert(seats).values({
      id: crypto.randomUUID(),
      licenseId: await licenseIdFor("local", "pay_1"),
      email: "user_seat@quillstone.dev",
      userId: "user_seat",
      status: "active",
    });
    await token("user_seat");
    await applyPaymentEvent(t.db, "local", refunded());
    expect(await t.db.$count(apiTokens, eq(apiTokens.userId, "user_seat"))).toBe(1);
    expect((await getAccess(t.db, "user_seat")).pro).toBe(true);
  });

  it("leaves the license active on a partial refund and revokes on a lost dispute", async () => {
    await applyPaymentEvent(t.db, "dodo", paid());
    expect(await applyPaymentEvent(t.db, "dodo", refunded({ partial: true }))).toBe("recorded");
    expect((await getAccess(t.db, "user_owner")).pro).toBe(true);
    const dispute: PaymentEvent = { type: "dispute.lost", eventId: "msg_dispute", paymentId: "pay_1" };
    expect(await applyPaymentEvent(t.db, "dodo", dispute)).toBe("revoked");
    expect((await getAccess(t.db, "user_owner")).pro).toBe(false);
  });

  it("records a refund for an unknown payment and honours a late payment that shows the refund", async () => {
    expect(await applyPaymentEvent(t.db, "dodo", refunded())).toBe("recorded");
    expect(await t.db.$count(licenses)).toBe(0);
    expect(await applyPaymentEvent(t.db, "dodo", paid({ fullyRefunded: true }))).toBe("recorded");
    expect((await t.db.select().from(licenses))[0]?.status).toBe("refunded");
    expect((await getAccess(t.db, "user_owner")).pro).toBe(false);
  });

  it("keeps the same payment id apart across providers", async () => {
    await applyPaymentEvent(t.db, "dodo", paid());
    await applyPaymentEvent(t.db, "local", refunded());
    expect((await getAccess(t.db, "user_owner")).pro).toBe(true);
  });

  it("records failed payments without creating a license", async () => {
    const failed: PaymentEvent = { type: "payment.failed", eventId: "msg_fail", paymentId: "pay_1" };
    expect(await applyPaymentEvent(t.db, "local", failed)).toBe("recorded");
    expect(await t.db.$count(licenses)).toBe(0);
  });
});

describe("fulfil() with signed deliveries", () => {
  // LocalProvider delivers straight into fulfil(), the same function the webhook routes call.
  const provider: LocalProvider = new LocalProvider({
    secret,
    siteUrl: "http://localhost:3000",
    send: (url, init) => fulfil(t.db, provider, new Request(url, init)),
  });
  const checkout = {
    plan: "pro" as const,
    currency: "INR" as const,
    userId: "user_local",
    email: "noor@fernleaf.dev",
    returnUrl: "http://localhost:3000/account?checkout=success",
    cancelUrl: "http://localhost:3000/pricing",
  };

  it("Pay grants Pro, Fail does not, refund revokes", async () => {
    const failToken = new URL((await provider.createCheckout(checkout)).url).searchParams.get("session") ?? "";
    expect((await provider.completeCheckout(failToken, "failed")).ok).toBe(true);
    expect(await t.db.$count(licenses)).toBe(0);

    const payToken = new URL((await provider.createCheckout(checkout)).url).searchParams.get("session") ?? "";
    expect((await provider.completeCheckout(payToken, "succeeded")).ok).toBe(true);
    // A second Pay on the same link sends a new event for the same payment: still one license.
    await provider.completeCheckout(payToken, "succeeded");
    const rows = await t.db.select().from(licenses);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ plan: "pro", currency: "INR", amountMinor: 499_900, provider: "local" });
    expect((await getAccess(t.db, "user_local")).pro).toBe(true);

    await token("user_local", "noor@fernleaf.dev");
    await provider.refund(rows[0]?.providerPaymentId ?? "", "test");
    expect((await getAccess(t.db, "user_local")).pro).toBe(false);
    expect(await t.db.$count(apiTokens)).toBe(0);
  });

  it("answers 401 to an unsigned or tampered delivery and changes nothing", async () => {
    const body = JSON.stringify({ type: "payment.succeeded", data: { payment_id: "pay_x" } });
    const unsigned = await fulfil(t.db, provider, new Request("http://localhost/x", { method: "POST", body }));
    expect(unsigned.status).toBe(401);
    const headers = await webhookHeaders(secret, "msg_x", body);
    const tampered = await fulfil(
      t.db,
      provider,
      new Request("http://localhost/x", { method: "POST", body: body.replace("pay_x", "pay_y"), headers }),
    );
    expect(tampered.status).toBe(401);
    expect(await t.db.$count(webhookEvents)).toBe(0);
  });
});
