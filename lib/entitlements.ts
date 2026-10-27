import { and, desc, eq, sql } from "drizzle-orm";
import type { Db } from "./db/create";
import { licenses, seats } from "./db/schema";

// Pro access (spec section 12), computed here and nowhere else: a user has Pro when they own an active license or
// hold an active seat on one. Every route, page and the registry endpoint asks this function.

export type Access = {
  pro: boolean;
  via: "license" | "seat" | null;
  licenseId: string | null;
  plan: "pro" | "team" | null;
};

export const NO_ACCESS: Access = { pro: false, via: null, licenseId: null, plan: null };

export async function getAccess(db: Db, userId: string): Promise<Access> {
  const [owned, seated] = await db.batch([
    db
      .select({ id: licenses.id, plan: licenses.plan })
      .from(licenses)
      .where(and(eq(licenses.ownerUserId, userId), eq(licenses.status, "active")))
      // An owner of both plans is reported as Team, the plan with seats to manage.
      .orderBy(sql`case ${licenses.plan} when 'team' then 0 else 1 end`, desc(licenses.createdAt))
      .limit(1),
    db
      .select({ id: licenses.id, plan: licenses.plan })
      .from(seats)
      .innerJoin(licenses, eq(licenses.id, seats.licenseId))
      .where(and(eq(seats.userId, userId), eq(seats.status, "active"), eq(licenses.status, "active")))
      .orderBy(desc(seats.createdAt))
      .limit(1),
  ]);
  const license = owned[0];
  if (license) return { pro: true, via: "license", licenseId: license.id, plan: license.plan };
  const seat = seated[0];
  if (seat) return { pro: true, via: "seat", licenseId: seat.id, plan: seat.plan };
  return NO_ACCESS;
}
