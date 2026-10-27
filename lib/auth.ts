import "server-only";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { getDb, type Db } from "./db";
import { seats, users } from "./db/schema";

// Who is asking. Clerk owns identity only (spec section 6); D1 holds the users row every license, seat, token and
// bookmark points to. Call these only from routes matched by middleware.ts: Clerk's auth() needs its middleware.

export type Viewer = { id: string; email: string };

/** The signed-in user with a users row guaranteed, or null when signed out. */
export async function getViewer(): Promise<Viewer | null> {
  const { isAuthenticated, userId } = await auth();
  if (!isAuthenticated || !userId) return null;
  const db = getDb();
  const viewer = await ensureUser(db, userId);
  await activateInvitedSeats(db, viewer);
  return viewer;
}

/**
 * The users row for a Clerk user. Clerk's webhooks cannot reach localhost, so the first authenticated request
 * creates the row (one Backend API call per new user); after that this is a single D1 read.
 */
export async function ensureUser(db: Db, userId: string): Promise<Viewer> {
  const existing = await db.select({ id: users.id, email: users.email }).from(users).where(eq(users.id, userId)).get();
  if (existing) return existing;
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const email = (user.primaryEmailAddress?.emailAddress ?? user.emailAddresses[0]?.emailAddress ?? "").toLowerCase();
  await db.insert(users).values({ id: userId, email }).onConflictDoUpdate({ target: users.id, set: { email } });
  return { id: userId, email };
}

/** A Team invite becomes an active seat when the invited email signs in (spec section 11). */
export async function activateInvitedSeats(db: Db, viewer: Viewer) {
  if (!viewer.email) return;
  const pending = await db
    .select({ id: seats.id })
    .from(seats)
    .where(and(eq(seats.email, viewer.email), eq(seats.status, "invited")))
    .get();
  if (!pending) return;
  await db
    .update(seats)
    .set({ userId: viewer.id, status: "active" })
    .where(and(eq(seats.email, viewer.email), eq(seats.status, "invited")));
}

/** The JSON 401 every API route returns to signed-out callers. */
export function signInRequired(): Response {
  return Response.json(
    { error: "sign_in_required", message: "Sign in to continue.", signIn: "/sign-in" },
    { status: 401, headers: { "cache-control": "no-store" } },
  );
}
