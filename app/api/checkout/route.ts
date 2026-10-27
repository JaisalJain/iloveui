import { getViewer, signInRequired } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { CHECKOUT_ERROR_MESSAGES, CHECKOUT_ERROR_STATUS, startCheckout } from "@/lib/payments/checkout";
import { json, readJsonObject, requestCurrency } from "@/lib/payments/request";

// POST /api/checkout { plan } → { url }: the JSON form of GET /checkout (spec section 11).
export async function POST(request: Request) {
  const viewer = await getViewer();
  if (!viewer) return signInRequired();
  const body = await readJsonObject(request);
  const result = await startCheckout(getDb(), viewer, body?.plan, requestCurrency(request));
  if (result.ok) return json({ url: result.url });
  return json(
    { error: result.error, message: CHECKOUT_ERROR_MESSAGES[result.error] },
    CHECKOUT_ERROR_STATUS[result.error],
  );
}
