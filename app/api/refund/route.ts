import { eq } from "drizzle-orm";
import { getViewer, monetizationOff, signInRequired } from "@/lib/auth";
import { monetizationEnabled } from "@/lib/monetization";
import { getDb } from "@/lib/db";
import { licenses } from "@/lib/db/schema";
import { isRefundable, REFUND_WINDOW_DAYS } from "@/lib/licenses";
import { getPaymentProvider } from "@/lib/payments/provider";
import { json, readJsonObject } from "@/lib/payments/request";
import { site } from "@/lib/site";

// POST /api/refund { licenseId }: the owner's self-serve refund within the refund window (spec sections 1 and 11).
// This only asks the provider; access ends when the provider's refund webhook reaches fulfilment.
export async function POST(request: Request) {
  if (!monetizationEnabled()) return monetizationOff();
  const viewer = await getViewer();
  if (!viewer) return signInRequired();
  const body = await readJsonObject(request);
  const licenseId = typeof body?.licenseId === "string" ? body.licenseId : null;
  const db = getDb();
  const license = licenseId ? await db.select().from(licenses).where(eq(licenses.id, licenseId)).get() : undefined;
  if (!license || license.ownerUserId !== viewer.id) {
    return json({ error: "not_found", message: "No license with that id belongs to you." }, 404);
  }
  if (license.status !== "active") {
    return json({ error: "already_refunded", message: "This purchase has already been refunded." }, 409);
  }
  if (!isRefundable(license)) {
    return json(
      {
        error: "window_closed",
        message: `Refunds are available for ${REFUND_WINDOW_DAYS} days after purchase, and that window has closed. Write to ${site.supportEmail} if something went wrong.`,
      },
      409,
    );
  }
  const provider = await getPaymentProvider();
  if (!provider || provider.id !== license.provider) {
    return json(
      {
        error: "provider_unavailable",
        message: `This purchase was made through a payment setup that is not active here. Write to ${site.supportEmail} for a refund.`,
      },
      503,
    );
  }
  try {
    const refund = await provider.refund(
      license.providerPaymentId,
      `Self-serve refund within the ${REFUND_WINDOW_DAYS}-day window`,
    );
    if (refund.status === "failed") throw new Error(`Refund ${refund.refundId} failed.`);
    return json({ refundId: refund.refundId, status: refund.status }, 202);
  } catch (error) {
    console.error("Refund request failed", error);
    return json(
      {
        error: "refund_failed",
        message: `The refund could not be requested. Try again, or write to ${site.supportEmail}.`,
      },
      502,
    );
  }
}
