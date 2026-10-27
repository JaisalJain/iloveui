import { getDb } from "@/lib/db";
import { DodoProvider } from "@/lib/payments/dodo";
import { fulfil } from "@/lib/payments/fulfil";
import { isDodoConfigured } from "@/lib/payments/provider";

// POST /api/webhooks/dodo: Dodo Payments deliveries. Processed synchronously and acknowledged only after the D1
// batch commits, so any failure is retried by Dodo with the same webhook id.
export async function POST(request: Request) {
  if (!isDodoConfigured()) return new Response("Not found", { status: 404 });
  return fulfil(getDb(), new DodoProvider(), request);
}
