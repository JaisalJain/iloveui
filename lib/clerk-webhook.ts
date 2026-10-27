import type { UserJSON, WebhookEvent } from "@clerk/nextjs/server";
import { and, eq, ne, sql } from "drizzle-orm";
import type { Db } from "./db/create";
import { apiTokens, bookmarks, seats, users, webhookEvents } from "./db/schema";

// Clerk webhook handling (spec section 11), separate from the route so it runs against an ephemeral D1 in tests.
// Clerk delivers at least once and in any order: the svix id de-duplicates retries, and users.updated_at keeps a
// late event from overwriting newer data or bringing a deleted user back.

export type ClerkWebhookResult = "processed" | "duplicate" | "ignored";

/** The primary address, lowercased; the first address when no primary is set (matches lib/auth.ts). */
export function primaryEmail(user: Pick<UserJSON, "email_addresses" | "primary_email_address_id">): string {
  const primary = user.email_addresses.find((address) => address.id === user.primary_email_address_id);
  return (primary ?? user.email_addresses[0])?.email_address.toLowerCase() ?? "";
}

export async function handleClerkEvent(db: Db, eventId: string, event: WebhookEvent): Promise<ClerkWebhookResult> {
  const seen = await db
    .select({ id: webhookEvents.id })
    .from(webhookEvents)
    .where(eq(webhookEvents.eventId, eventId))
    .get();
  if (seen) return "duplicate";

  // Recorded in the same batch as the change: D1 batches are atomic, so a failed write leaves no record and
  // Clerk's retry is processed in full.
  const record = db
    .insert(webhookEvents)
    .values({ id: crypto.randomUUID(), provider: "clerk", eventId })
    .onConflictDoNothing({ target: webhookEvents.eventId });

  switch (event.type) {
    case "user.created":
    case "user.updated": {
      const user = event.data;
      await db.batch([upsertUserIfNewer(db, user), record]);
      return "processed";
    }
    case "user.deleted": {
      const userId = event.data.id;
      if (!userId) break;
      await db.batch([...deleteUserStatements(db, userId, new Date(event.timestamp)), record]);
      return "processed";
    }
    default:
      break;
  }
  await record;
  return "ignored";
}

function upsertUserIfNewer(db: Db, user: UserJSON) {
  const updatedAt = new Date(user.updated_at);
  return db
    .insert(users)
    .values({ id: user.id, email: primaryEmail(user), createdAt: new Date(user.created_at), updatedAt })
    .onConflictDoUpdate({
      target: users.id,
      set: { email: sql`excluded.email`, updatedAt: sql`excluded.updated_at` },
      setWhere: sql`excluded.updated_at > ${users.updatedAt}`,
    });
}

/**
 * A deleted Clerk user keeps a tombstone row (empty email, updated_at at the deletion time) because licenses,
 * seats and payment records point to it; keeping the licenses lets a refund or invoice still be processed. What
 * only made sense for a living account goes in the same batch: the CLI token, bookmarks and held Team seats.
 */
function deleteUserStatements(db: Db, userId: string, deletedAt: Date) {
  return [
    db.delete(apiTokens).where(eq(apiTokens.userId, userId)),
    db.delete(bookmarks).where(eq(bookmarks.userId, userId)),
    db
      .update(seats)
      .set({ status: "removed" })
      .where(and(eq(seats.userId, userId), ne(seats.status, "removed"))),
    db
      .insert(users)
      .values({ id: userId, email: "", updatedAt: deletedAt })
      .onConflictDoUpdate({
        target: users.id,
        set: { email: "", updatedAt: sql`max(${users.updatedAt}, excluded.updated_at)` },
      }),
  ] as const;
}
