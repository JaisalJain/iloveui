import { and, asc, desc, eq, ne, sql } from "drizzle-orm";
import { PAID_PLANS, type Currency } from "@/config/pricing";
import type { Db } from "./db/create";
import { licenses, seats, users } from "./db/schema";
import { getAccess, type Access } from "./entitlements";

// What /account shows about purchases and seats, plus the rules for refunds and Team seats (spec sections 8, 11).

const DAY_MS = 24 * 60 * 60 * 1000;
/** How long after purchase /account offers a self-serve refund. */
export const REFUND_WINDOW_DAYS = 14;
export const REFUND_WINDOW_MS = REFUND_WINDOW_DAYS * DAY_MS;
/** Seats on a Team license, the owner's included. */
export const TEAM_SEAT_LIMIT = PAID_PLANS.team.seats;

export type OwnedLicense = {
  id: string;
  plan: "pro" | "team";
  status: "active" | "refunded";
  currency: Currency;
  amountMinor: number;
  purchasedAt: Date;
  provider: "dodo" | "local";
  /** Whether /api/invoice/<id> has a document for this purchase. */
  invoiceAvailable: boolean;
  /** Active and within the refund window. */
  refundable: boolean;
  refundDeadline: Date;
};

export type HeldSeat = { licenseId: string; ownerEmail: string; since: Date };

export type SeatSummary = {
  id: string;
  email: string;
  status: "invited" | "active";
  invitedAt: Date;
  isOwner: boolean;
};

export type AccountSummary = {
  access: Access;
  /** The license the viewer bought, if any: the active one, or the latest when none is active. */
  license: OwnedLicense | null;
  /** A Team seat the viewer holds on someone else's license. */
  seat: HeldSeat | null;
  /** For Team owners: every seat that is not removed, owner first. */
  seats: SeatSummary[] | null;
  seatLimit: number;
};

export function refundDeadline(purchasedAt: Date): Date {
  return new Date(purchasedAt.getTime() + REFUND_WINDOW_MS);
}

export function isRefundable(license: { status: string; createdAt: Date }, now = Date.now()): boolean {
  return license.status === "active" && now <= refundDeadline(license.createdAt).getTime();
}

/** Dodo invoices exist whenever Dodo is configured; local test receipts only in development. */
export function invoiceAvailable(provider: "dodo" | "local"): boolean {
  return provider === "dodo"
    ? Boolean(process.env.DODO_PAYMENTS_API_KEY?.trim())
    : process.env.NODE_ENV === "development";
}

export async function getAccountSummary(
  db: Db,
  viewer: { id: string; email: string },
  now = Date.now(),
): Promise<AccountSummary> {
  const [access, owned, held] = await Promise.all([
    getAccess(db, viewer.id),
    db
      .select()
      .from(licenses)
      .where(eq(licenses.ownerUserId, viewer.id))
      .orderBy(
        sql`case ${licenses.status} when 'active' then 0 else 1 end`,
        sql`case ${licenses.plan} when 'team' then 0 else 1 end`,
        desc(licenses.createdAt),
      )
      .limit(1)
      .get(),
    db
      .select({ licenseId: licenses.id, ownerEmail: users.email, since: seats.createdAt })
      .from(seats)
      .innerJoin(licenses, eq(licenses.id, seats.licenseId))
      .innerJoin(users, eq(users.id, licenses.ownerUserId))
      .where(
        and(
          eq(seats.userId, viewer.id),
          eq(seats.status, "active"),
          eq(licenses.status, "active"),
          ne(licenses.ownerUserId, viewer.id),
        ),
      )
      .orderBy(desc(seats.createdAt))
      .limit(1)
      .get(),
  ]);

  const license: OwnedLicense | null = owned
    ? {
        id: owned.id,
        plan: owned.plan,
        status: owned.status,
        currency: owned.currency,
        amountMinor: owned.amountMinor,
        purchasedAt: owned.createdAt,
        provider: owned.provider,
        invoiceAvailable: invoiceAvailable(owned.provider),
        refundable: isRefundable(owned, now),
        refundDeadline: refundDeadline(owned.createdAt),
      }
    : null;

  let seatList: SeatSummary[] | null = null;
  if (owned && owned.plan === "team" && owned.status === "active") {
    const rows = await db
      .select({
        id: seats.id,
        email: seats.email,
        status: seats.status,
        createdAt: seats.createdAt,
        userId: seats.userId,
      })
      .from(seats)
      .where(and(eq(seats.licenseId, owned.id), ne(seats.status, "removed")))
      .orderBy(asc(seats.createdAt));
    seatList = rows
      .map((row) => ({
        id: row.id,
        email: row.email,
        status: row.status === "active" ? ("active" as const) : ("invited" as const),
        invitedAt: row.createdAt,
        isOwner: row.userId === viewer.id,
      }))
      .sort((a, b) => Number(b.isOwner) - Number(a.isOwner));
  }

  return { access, license, seat: held ?? null, seats: seatList, seatLimit: TEAM_SEAT_LIMIT };
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** A trimmed, lowercased email, or null when it is not one. */
export function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  return email.length <= 254 && EMAIL.test(email) ? email : null;
}

export type SeatError = "not_team_owner" | "invalid_email" | "duplicate" | "seat_limit" | "not_found" | "owner_seat";

export const SEAT_ERROR_STATUS: Record<SeatError, number> = {
  not_team_owner: 403,
  invalid_email: 400,
  duplicate: 409,
  seat_limit: 409,
  not_found: 404,
  owner_seat: 409,
};

export const SEAT_ERROR_MESSAGES: Record<SeatError, string> = {
  not_team_owner: "Only the owner of an active Team license can manage seats.",
  invalid_email: "Enter a valid email address.",
  duplicate: "That email already has a seat on this team.",
  seat_limit: `A Team license has ${TEAM_SEAT_LIMIT} seats, and all of them are taken. Remove a seat first.`,
  not_found: "That seat does not exist.",
  owner_seat: "The owner's own seat cannot be removed.",
};

async function ownedTeamLicense(db: Db, ownerId: string) {
  return db
    .select({ id: licenses.id })
    .from(licenses)
    .where(and(eq(licenses.ownerUserId, ownerId), eq(licenses.plan, "team"), eq(licenses.status, "active")))
    .orderBy(desc(licenses.createdAt))
    .get();
}

/** Invites an email to the owner's Team. The invite becomes an active seat when that email signs in. */
export async function inviteSeat(
  db: Db,
  owner: { id: string; email: string },
  rawEmail: unknown,
): Promise<{ ok: true; seat: SeatSummary } | { ok: false; error: SeatError }> {
  const license = await ownedTeamLicense(db, owner.id);
  if (!license) return { ok: false, error: "not_team_owner" };
  const email = normalizeEmail(rawEmail);
  if (!email) return { ok: false, error: "invalid_email" };

  const rows = await db
    .select({ id: seats.id, email: seats.email, status: seats.status })
    .from(seats)
    .where(eq(seats.licenseId, license.id));
  const existing = rows.find((row) => row.email === email);
  if ((existing && existing.status !== "removed") || email === owner.email) return { ok: false, error: "duplicate" };
  if (rows.filter((row) => row.status !== "removed").length >= TEAM_SEAT_LIMIT) {
    return { ok: false, error: "seat_limit" };
  }

  if (existing) {
    // A removed seat comes back as a fresh invite: (license, email) is unique.
    const [row] = await db
      .update(seats)
      .set({ status: "invited", userId: null, createdAt: new Date() })
      .where(eq(seats.id, existing.id))
      .returning();
    if (!row) return { ok: false, error: "not_found" };
    return { ok: true, seat: { id: row.id, email, status: "invited", invitedAt: row.createdAt, isOwner: false } };
  }
  const [row] = await db
    .insert(seats)
    .values({ id: crypto.randomUUID(), licenseId: license.id, email, status: "invited" })
    .returning();
  if (!row) return { ok: false, error: "not_found" };
  return { ok: true, seat: { id: row.id, email, status: "invited", invitedAt: row.createdAt, isOwner: false } };
}

/** Removes a seat from the owner's Team; the person loses Pro at once (getAccess only counts active seats). */
export async function removeSeat(
  db: Db,
  owner: { id: string; email: string },
  seatId: string,
): Promise<{ ok: true } | { ok: false; error: SeatError }> {
  const license = await ownedTeamLicense(db, owner.id);
  if (!license) return { ok: false, error: "not_team_owner" };
  const seat = await db
    .select({ id: seats.id, email: seats.email, userId: seats.userId, status: seats.status })
    .from(seats)
    .where(and(eq(seats.id, seatId), eq(seats.licenseId, license.id)))
    .get();
  if (!seat || seat.status === "removed") return { ok: false, error: "not_found" };
  if (seat.userId === owner.id || seat.email === owner.email) return { ok: false, error: "owner_seat" };
  await db.update(seats).set({ status: "removed" }).where(eq(seats.id, seat.id));
  return { ok: true };
}
