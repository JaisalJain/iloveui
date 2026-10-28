import { verifyWebhook } from "@clerk/nextjs/webhooks";
import type { NextRequest } from "next/server";
import { handleClerkEvent } from "@/lib/clerk-webhook";
import { getDb } from "@/lib/db";
import { monetizationOff } from "@/lib/auth";
import { monetizationEnabled } from "@/lib/monetization";

const NO_STORE = { "cache-control": "no-store" };

// Public on purpose: Clerk signs every delivery (CLERK_WEBHOOK_SIGNING_SECRET), and that signature is the check.
// Locally Clerk cannot reach localhost, so lib/auth.ts creates users on their first authenticated request instead.
export async function POST(request: NextRequest) {
  if (!monetizationEnabled()) return monetizationOff();
  let event;
  try {
    // Reads the raw body itself, so nothing may consume the request first.
    event = await verifyWebhook(request);
  } catch {
    return Response.json({ error: "invalid_signature" }, { status: 400, headers: NO_STORE });
  }
  const eventId = request.headers.get("svix-id");
  if (!eventId) return Response.json({ error: "missing_event_id" }, { status: 400, headers: NO_STORE });

  const result = await handleClerkEvent(getDb(), eventId, event);
  return Response.json({ received: true, result }, { headers: NO_STORE });
}
