import { getViewer, signInRequired } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { SEAT_ERROR_MESSAGES, SEAT_ERROR_STATUS, inviteSeat } from "@/lib/licenses";
import { json, readJsonObject } from "@/lib/payments/request";

// POST /api/team/seats { email }: a Team owner invites someone (spec section 11).
export async function POST(request: Request) {
  const viewer = await getViewer();
  if (!viewer) return signInRequired();
  const body = await readJsonObject(request);
  const result = await inviteSeat(getDb(), viewer, body?.email);
  if (!result.ok) {
    return json({ error: result.error, message: SEAT_ERROR_MESSAGES[result.error] }, SEAT_ERROR_STATUS[result.error]);
  }
  return json({ seat: result.seat }, 201);
}
