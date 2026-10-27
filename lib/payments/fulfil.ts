import { and, eq, sql } from "drizzle-orm";
import type { Db } from "@/lib/db/create";
import { apiTokens, licenses, seats, users, webhookEvents } from "@/lib/db/schema";
import { WebhookSignatureError } from "@/lib/standard-webhooks";
import type { PaymentEvent, PaymentProvider, ProviderId } from "./provider";

// Fulfilment (spec section 11): the only code that grants or revokes paid access, called by both webhook routes.
// Every change and the event record commit in one D1 batch (D1 runs a batch as a transaction), so a retry either
// finds the event recorded and stops, or finds nothing changed and does the whole job again.

export type FulfilOutcome = "granted" | "revoked" | "recorded" | "duplicate";

const NO_STORE = { "cache-control": "no-store" };

/** One license per provider payment, with an id derived from it so retries and seat rows agree on it. */
export async function licenseIdFor(provider: ProviderId, paymentId: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${provider}:${paymentId}`));
  const hex = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `lic_${hex.slice(0, 24)}`;
}

function isDuplicateEvent(error: unknown): boolean {
  for (let current: unknown = error; current instanceof Error; current = current.cause) {
    if (/UNIQUE constraint failed: webhook_events\.event_id/.test(current.message)) return true;
  }
  return false;
}

/**
 * Applies a verified event. Duplicates (same webhook id) change nothing. A refund or lost dispute for a payment we
 * have not seen is recorded and ignored: a later payment.succeeded delivery carries the refund in its payload.
 */
export async function applyPaymentEvent(db: Db, provider: ProviderId, event: PaymentEvent): Promise<FulfilOutcome> {
  const seen = await db
    .select({ id: webhookEvents.id })
    .from(webhookEvents)
    .where(eq(webhookEvents.eventId, event.eventId))
    .get();
  if (seen) return "duplicate";

  const record = db.insert(webhookEvents).values({ id: crypto.randomUUID(), provider, eventId: event.eventId });

  try {
    switch (event.type) {
      case "payment.succeeded": {
        const licenseId = await licenseIdFor(provider, event.paymentId);
        const writes = [
          record,
          db.insert(users).values({ id: event.userId, email: event.email }).onConflictDoNothing(),
          db
            .insert(licenses)
            .values({
              id: licenseId,
              ownerUserId: event.userId,
              plan: event.plan,
              currency: event.currency,
              amountMinor: event.amountMinor,
              providerPaymentId: event.paymentId,
              provider,
              status: event.fullyRefunded ? "refunded" : "active",
            })
            .onConflictDoNothing({ target: licenses.providerPaymentId }),
        ] as const;
        if (event.plan === "team") {
          // The owner holds the first of the Team's seats.
          await db.batch([
            ...writes,
            db
              .insert(seats)
              .values({
                id: crypto.randomUUID(),
                licenseId,
                email: event.email,
                userId: event.userId,
                status: event.fullyRefunded ? "removed" : "active",
              })
              .onConflictDoNothing(),
          ]);
        } else {
          await db.batch(writes);
        }
        return event.fullyRefunded ? "recorded" : "granted";
      }
      case "refund.succeeded":
      case "dispute.lost": {
        const license =
          event.type === "refund.succeeded" && event.partial
            ? undefined
            : await db
                .select({ id: licenses.id })
                .from(licenses)
                .where(and(eq(licenses.provider, provider), eq(licenses.providerPaymentId, event.paymentId)))
                .get();
        if (!license) {
          await record;
          return "recorded";
        }
        await db.batch([
          record,
          db.update(licenses).set({ status: "refunded" }).where(eq(licenses.id, license.id)),
          // Tokens of the owner and every active seat holder go, unless that person still has Pro through another
          // active license or seat. Runs before the seats below are marked removed.
          db.delete(apiTokens).where(sql`
            ${apiTokens.userId} in (
              select owner_user_id from licenses where id = ${license.id}
              union
              select user_id from seats where license_id = ${license.id} and status = 'active' and user_id is not null
            )
            and not exists (
              select 1 from licenses other
              where other.owner_user_id = ${apiTokens.userId} and other.status = 'active' and other.id <> ${license.id}
            )
            and not exists (
              select 1 from seats other_seat join licenses other_license on other_license.id = other_seat.license_id
              where other_seat.user_id = ${apiTokens.userId} and other_seat.status = 'active'
                and other_license.status = 'active' and other_license.id <> ${license.id}
            )`),
          db
            .update(seats)
            .set({ status: "removed" })
            .where(and(eq(seats.licenseId, license.id), sql`${seats.status} <> 'removed'`)),
        ]);
        return "revoked";
      }
      default:
        await record;
        return "recorded";
    }
  } catch (error) {
    // Two deliveries of one event raced past the check above; the loser's batch rolled back entirely.
    if (isDuplicateEvent(error)) return "duplicate";
    throw error;
  }
}

/**
 * The single fulfilment entry point for both webhook routes: verifies the signature against the raw body, then
 * applies the event. 401 for an unauthentic delivery; any other failure throws, the route answers 500 and the
 * provider retries with the same webhook id.
 */
export async function fulfil(db: Db, provider: PaymentProvider, request: Request): Promise<Response> {
  const rawBody = await request.text();
  let event: PaymentEvent;
  try {
    event = await provider.verifyWebhook(rawBody, request.headers);
  } catch (error) {
    if (error instanceof WebhookSignatureError) {
      return Response.json({ error: "invalid_signature" }, { status: 401, headers: NO_STORE });
    }
    throw error;
  }
  const outcome = await applyPaymentEvent(db, provider.id, event);
  return Response.json({ received: true, outcome }, { headers: NO_STORE });
}
