import { getViewer, signInRequired } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { SEAT_ERROR_MESSAGES, SEAT_ERROR_STATUS, removeSeat } from "@/lib/licenses";
import { json } from "@/lib/payments/request";

// DELETE /api/team/seats/<seatId>: a Team owner removes a seat; that person loses Pro at once.
export async function DELETE(_request: Request, { params }: { params: Promise<{ seatId: string }> }) {
  const viewer = await getViewer();
  if (!viewer) return signInRequired();
  const { seatId } = await params;
  const result = await removeSeat(getDb(), viewer, seatId);
  if (!result.ok) {
    return json({ error: result.error, message: SEAT_ERROR_MESSAGES[result.error] }, SEAT_ERROR_STATUS[result.error]);
  }
  return json({ removed: true });
}
