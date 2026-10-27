import { isDodoConfigured } from "@/lib/payments/provider";

// POST /api/webhooks/local: deliveries from the local test checkout. Development only: NODE_ENV is a compile-time
// constant, so the production bundle keeps only the 404 below and none of the LocalProvider code.
export async function POST(request: Request) {
  if (process.env.NODE_ENV === "development" && !isDodoConfigured()) {
    const [{ getDb }, { createLocalProvider }, { fulfil }] = await Promise.all([
      import("@/lib/db"),
      import("@/lib/payments/local"),
      import("@/lib/payments/fulfil"),
    ]);
    return fulfil(getDb(), await createLocalProvider(), request);
  }
  return new Response("Not found", { status: 404, headers: { "cache-control": "no-store" } });
}
