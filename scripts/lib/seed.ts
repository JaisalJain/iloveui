import { createDb } from "../../lib/db/create";
import { licenses, seats, users } from "../../lib/db/schema";

/**
 * One demo account state for local testing: a Team license with a pending seat invite for a Clerk test email.
 * Sign up locally as DEMO_SEAT_EMAIL (verification code 424242) and the invite turns into an active Pro seat.
 */
export const DEMO_OWNER_ID = "user_demo_team_owner";
export const DEMO_OWNER_EMAIL = "team-owner+clerk_test@iloveui.dev";
export const DEMO_SEAT_EMAIL = "demo+clerk_test@iloveui.dev";
export const DEMO_LICENSE_ID = "lic_demo_team";
export const DEMO_PAYMENT_ID = "local_pay_demo_team";

export async function seedDemoAccount(d1: D1Database) {
  const db = createDb(d1);
  await db.batch([
    db.insert(users).values({ id: DEMO_OWNER_ID, email: DEMO_OWNER_EMAIL }).onConflictDoNothing(),
    db
      .insert(licenses)
      .values({
        id: DEMO_LICENSE_ID,
        ownerUserId: DEMO_OWNER_ID,
        plan: "team",
        currency: "USD",
        amountMinor: 29900,
        providerPaymentId: DEMO_PAYMENT_ID,
        provider: "local",
        status: "active",
      })
      .onConflictDoNothing(),
    db
      .insert(seats)
      .values({
        id: "seat_demo_owner",
        licenseId: DEMO_LICENSE_ID,
        email: DEMO_OWNER_EMAIL,
        userId: DEMO_OWNER_ID,
        status: "active",
      })
      .onConflictDoNothing(),
    db
      .insert(seats)
      .values({ id: "seat_demo_invite", licenseId: DEMO_LICENSE_ID, email: DEMO_SEAT_EMAIL, status: "invited" })
      .onConflictDoNothing(),
  ]);
}
