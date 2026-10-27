import { eq } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { licenses, seats, users } from "@/lib/db/schema";
import { getAccess } from "@/lib/entitlements";
import {
  REFUND_WINDOW_MS,
  TEAM_SEAT_LIMIT,
  getAccountSummary,
  inviteSeat,
  isRefundable,
  normalizeEmail,
  removeSeat,
} from "@/lib/licenses";
import { createTestDb, resetTestDb, type TestDb } from "./helpers/d1";

let t: TestDb;

beforeAll(async () => {
  t = await createTestDb();
});

afterAll(async () => {
  await t?.dispose();
});

const owner = { id: "user_owner", email: "ira@quillstone.dev" };
const member = { id: "user_member", email: "dev@fernleaf.dev" };

beforeEach(async () => {
  await resetTestDb(t.db);
  await t.db.insert(users).values([owner, member]);
});

async function license(plan: "pro" | "team", status: "active" | "refunded" = "active", createdAt = new Date()) {
  const id = `lic_${plan}_${status}_${createdAt.getTime()}`;
  await t.db.insert(licenses).values({
    id,
    ownerUserId: owner.id,
    plan,
    currency: "USD",
    amountMinor: plan === "pro" ? 9900 : 29900,
    providerPaymentId: `pay_${id}`,
    provider: "local",
    status,
    createdAt,
  });
  if (plan === "team") {
    await t.db
      .insert(seats)
      .values({ id: `seat_${id}`, licenseId: id, email: owner.email, userId: owner.id, status: "active" });
  }
  return id;
}

describe("getAccess", () => {
  it("has no access without a license", async () => {
    expect(await getAccess(t.db, owner.id)).toEqual({ pro: false, via: null, licenseId: null, plan: null });
  });

  it("grants the owner of an active license", async () => {
    const id = await license("pro");
    expect(await getAccess(t.db, owner.id)).toEqual({ pro: true, via: "license", licenseId: id, plan: "pro" });
  });

  it("grants an active seat, not an invited or removed one", async () => {
    const id = await license("team");
    await t.db.insert(seats).values({ id: "s1", licenseId: id, email: member.email, status: "invited" });
    expect((await getAccess(t.db, member.id)).pro).toBe(false);
    await t.db.update(seats).set({ status: "active", userId: member.id }).where(eq(seats.id, "s1"));
    expect(await getAccess(t.db, member.id)).toEqual({ pro: true, via: "seat", licenseId: id, plan: "team" });
    expect(await removeSeat(t.db, owner, "s1")).toEqual({ ok: true });
    expect((await getAccess(t.db, member.id)).pro).toBe(false);
  });

  it("denies a refunded license and its seats", async () => {
    const id = await license("team", "refunded");
    await t.db
      .insert(seats)
      .values({ id: "s1", licenseId: id, email: member.email, userId: member.id, status: "active" });
    expect((await getAccess(t.db, owner.id)).pro).toBe(false);
    expect((await getAccess(t.db, member.id)).pro).toBe(false);
  });
});

describe("refund window", () => {
  it("allows a refund for 14 days after purchase, only while active", () => {
    expect(REFUND_WINDOW_MS).toBe(14 * 24 * 60 * 60 * 1000);
    const createdAt = new Date("2026-10-01T10:00:00Z");
    expect(isRefundable({ status: "active", createdAt }, Date.parse("2026-10-15T10:00:00Z"))).toBe(true);
    expect(isRefundable({ status: "active", createdAt }, Date.parse("2026-10-15T10:00:01Z"))).toBe(false);
    expect(isRefundable({ status: "refunded", createdAt }, Date.parse("2026-10-02T10:00:00Z"))).toBe(false);
  });
});

describe("Team seats", () => {
  it("validates and normalizes emails", () => {
    expect(normalizeEmail("  Dev@Fernleaf.DEV ")).toBe("dev@fernleaf.dev");
    expect(normalizeEmail("not-an-email")).toBeNull();
    expect(normalizeEmail(42)).toBeNull();
  });

  it("only lets an active Team owner invite", async () => {
    expect(await inviteSeat(t.db, owner, member.email)).toEqual({ ok: false, error: "not_team_owner" });
    await license("pro");
    expect(await inviteSeat(t.db, owner, member.email)).toEqual({ ok: false, error: "not_team_owner" });
    expect(await inviteSeat(t.db, member, owner.email)).toEqual({ ok: false, error: "not_team_owner" });
  });

  it("invites, refuses duplicates and the owner, and re-invites a removed seat", async () => {
    await license("team");
    expect(await inviteSeat(t.db, owner, "bad")).toEqual({ ok: false, error: "invalid_email" });
    const first = await inviteSeat(t.db, owner, "Dev@Fernleaf.dev");
    expect(first).toMatchObject({ ok: true, seat: { email: "dev@fernleaf.dev", status: "invited" } });
    expect(await inviteSeat(t.db, owner, "dev@fernleaf.dev")).toEqual({ ok: false, error: "duplicate" });
    expect(await inviteSeat(t.db, owner, owner.email)).toEqual({ ok: false, error: "duplicate" });
    if (!first.ok) throw new Error("invite failed");
    expect(await removeSeat(t.db, owner, first.seat.id)).toEqual({ ok: true });
    expect(await removeSeat(t.db, owner, first.seat.id)).toEqual({ ok: false, error: "not_found" });
    expect(await inviteSeat(t.db, owner, "dev@fernleaf.dev")).toMatchObject({ ok: true });
  });

  it("caps a Team at 10 seats including the owner", async () => {
    await license("team");
    for (let i = 1; i < TEAM_SEAT_LIMIT; i += 1) {
      expect((await inviteSeat(t.db, owner, `person${i}@fernleaf.dev`)).ok).toBe(true);
    }
    expect(await inviteSeat(t.db, owner, "one-more@fernleaf.dev")).toEqual({ ok: false, error: "seat_limit" });
  });

  it("never removes the owner's seat or another team's seat", async () => {
    const id = await license("team");
    expect(await removeSeat(t.db, owner, `seat_${id}`)).toEqual({ ok: false, error: "owner_seat" });
    expect(await removeSeat(t.db, member, `seat_${id}`)).toEqual({ ok: false, error: "not_team_owner" });
  });
});

describe("account summary", () => {
  it("describes a Team owner's license and seats", async () => {
    const id = await license("team");
    await inviteSeat(t.db, owner, member.email);
    const summary = await getAccountSummary(t.db, owner);
    expect(summary.access).toMatchObject({ pro: true, via: "license", plan: "team" });
    expect(summary.license).toMatchObject({ id, plan: "team", status: "active", refundable: true, provider: "local" });
    expect(summary.seats?.map((seat) => [seat.email, seat.status, seat.isOwner])).toEqual([
      [owner.email, "active", true],
      [member.email, "invited", false],
    ]);
    expect(summary.seatLimit).toBe(10);
  });

  it("describes a seat holder and an expired refund window", async () => {
    const old = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000);
    const id = await license("team", "active", old);
    await t.db
      .insert(seats)
      .values({ id: "s1", licenseId: id, email: member.email, userId: member.id, status: "active" });
    const forMember = await getAccountSummary(t.db, member);
    expect(forMember).toMatchObject({ license: null, seats: null, seat: { licenseId: id, ownerEmail: owner.email } });
    expect((await getAccountSummary(t.db, owner)).license?.refundable).toBe(false);
  });
});
