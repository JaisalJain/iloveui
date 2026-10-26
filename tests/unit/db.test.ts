import { eq } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { licenses, seats, users, webhookEvents } from "@/lib/db/schema";
import { DEMO_LICENSE_ID, DEMO_SEAT_EMAIL, seedDemoAccount } from "@/scripts/lib/seed";
import { createTestDb, resetTestDb, type TestDb } from "./helpers/d1";

let t: TestDb;

beforeAll(async () => {
  t = await createTestDb();
});

afterAll(async () => {
  await t?.dispose();
});

beforeEach(async () => {
  await resetTestDb(t.db);
});

describe("schema on local D1", () => {
  it("enforces unique provider payment ids", async () => {
    await t.db.insert(users).values({ id: "user_a", email: "a@example.com" });
    const license = {
      ownerUserId: "user_a",
      plan: "pro" as const,
      currency: "USD" as const,
      amountMinor: 9900,
      providerPaymentId: "pay_1",
      provider: "local" as const,
    };
    await t.db.insert(licenses).values({ id: "lic_1", ...license });
    await expect(t.db.insert(licenses).values({ id: "lic_2", ...license })).rejects.toThrow();
  });

  it("enforces unique webhook event ids", async () => {
    await t.db.insert(webhookEvents).values({ id: "evt_row_1", provider: "local", eventId: "msg_1" });
    await expect(
      t.db.insert(webhookEvents).values({ id: "evt_row_2", provider: "dodo", eventId: "msg_1" }),
    ).rejects.toThrow();
  });

  it("enforces foreign keys", async () => {
    await expect(
      t.db.insert(licenses).values({
        id: "lic_orphan",
        ownerUserId: "user_missing",
        plan: "pro",
        currency: "USD",
        amountMinor: 9900,
        providerPaymentId: "pay_orphan",
        provider: "local",
      }),
    ).rejects.toThrow();
  });

  it("rolls back a whole batch when one statement fails", async () => {
    await expect(
      t.db.batch([
        t.db.insert(users).values({ id: "user_b", email: "b@example.com" }),
        t.db.insert(users).values({ id: "user_b", email: "duplicate@example.com" }),
      ]),
    ).rejects.toThrow();
    expect(await t.db.$count(users)).toBe(0);
  });

  it("fills created_at from SQLite", async () => {
    const before = Date.now();
    await t.db.insert(users).values({ id: "user_c", email: "c@example.com" });
    const [row] = await t.db.select().from(users).where(eq(users.id, "user_c"));
    expect(row?.createdAt.getTime()).toBeGreaterThanOrEqual(before - 1000);
  });
});

describe("demo seed", () => {
  it("creates a Team license with one active and one invited seat, and is idempotent", async () => {
    await seedDemoAccount(t.env.DB);
    await seedDemoAccount(t.env.DB);
    const [license] = await t.db.select().from(licenses).where(eq(licenses.id, DEMO_LICENSE_ID));
    expect(license).toMatchObject({ plan: "team", status: "active", provider: "local" });
    const seatRows = await t.db.select().from(seats).where(eq(seats.licenseId, DEMO_LICENSE_ID));
    expect(seatRows).toHaveLength(2);
    expect(seatRows.find((seat) => seat.email === DEMO_SEAT_EMAIL)).toMatchObject({ status: "invited", userId: null });
  });
});
