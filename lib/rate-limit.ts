import { and, eq, lt, sql } from "drizzle-orm";
import type { Db } from "./db/create";
import { rateLimits } from "./db/schema";

// Fixed-window rate limiting on D1 (spec section 10). One upsert counts the request and returns the new total;
// the same batch drops this key's expired windows, so the table only ever holds current windows.

export type RateLimitResult = {
  ok: boolean;
  limit: number;
  remaining: number;
  /** Epoch ms when the current window ends. */
  resetAt: number;
};

export async function rateLimit(
  db: Db,
  { key, limit, windowMs, now = Date.now() }: { key: string; limit: number; windowMs: number; now?: number },
): Promise<RateLimitResult> {
  const windowStart = Math.floor(now / windowMs) * windowMs;
  const [, counted] = await db.batch([
    db.delete(rateLimits).where(and(eq(rateLimits.key, key), lt(rateLimits.windowStart, windowStart))),
    db
      .insert(rateLimits)
      .values({ key, windowStart, count: 1 })
      .onConflictDoUpdate({
        target: [rateLimits.key, rateLimits.windowStart],
        set: { count: sql`${rateLimits.count} + 1` },
      })
      .returning({ count: rateLimits.count }),
  ]);
  const count = counted[0]?.count ?? 1;
  return { ok: count <= limit, limit, remaining: Math.max(0, limit - count), resetAt: windowStart + windowMs };
}

/** Headers that tell a client about its limit; Retry-After is added once it is exceeded. */
export function rateLimitHeaders(result: RateLimitResult, now = Date.now()): Record<string, string> {
  const headers: Record<string, string> = {
    "x-ratelimit-limit": String(result.limit),
    "x-ratelimit-remaining": String(result.remaining),
    "x-ratelimit-reset": String(Math.ceil(result.resetAt / 1000)),
  };
  if (!result.ok) headers["retry-after"] = String(Math.max(1, Math.ceil((result.resetAt - now) / 1000)));
  return headers;
}
