import { getViewer, monetizationOff, signInRequired } from "@/lib/auth";
import { monetizationEnabled } from "@/lib/monetization";
import { getDb } from "@/lib/db";
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { issueToken } from "@/lib/tokens";

// POST /api/token/rotate → { token }: creates the viewer's CLI token or replaces it (the old one stops working at
// once). The plaintext appears only in this response. Any signed-in user may hold a token: /r/ checks Pro access on
// every request, so a token without a license gets 403 and starts working the moment a license is bought.

export const dynamic = "force-dynamic";

const NO_STORE = { "cache-control": "no-store" };
const ROTATE_LIMIT = 10;
const ROTATE_WINDOW_MS = 60 * 60_000;

export async function POST() {
  if (!monetizationEnabled()) return monetizationOff();
  const viewer = await getViewer();
  if (!viewer) return signInRequired();
  const db = getDb();
  const limited = await rateLimit(db, { key: `token:${viewer.id}`, limit: ROTATE_LIMIT, windowMs: ROTATE_WINDOW_MS });
  if (!limited.ok) {
    return Response.json(
      { error: "rate_limited", message: "Too many new tokens this hour. Try again later." },
      { status: 429, headers: { ...NO_STORE, ...rateLimitHeaders(limited) } },
    );
  }
  const token = await issueToken(db, viewer.id);
  return Response.json({ token }, { headers: NO_STORE });
}
