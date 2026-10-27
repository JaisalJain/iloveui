import { getDesign } from "@/lib/catalog";
import { getDb } from "@/lib/db";
import { getCopyCounts, recordCopy } from "@/lib/metrics";
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit";

// GET: copy counts per design for the "Most copied" sort. POST { slug, kind: "copy" }: counts one copy.
export const dynamic = "force-dynamic";

const NO_STORE = { "cache-control": "no-store" };
const POST_LIMIT = 60;
const POST_WINDOW_MS = 60_000;
const MAX_BODY_BYTES = 1024;

function json(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return Response.json(body, { status, headers: { ...NO_STORE, ...headers } });
}

export async function GET() {
  return json({ copies: await getCopyCounts(getDb()) });
}

export async function POST(request: Request) {
  const db = getDb();
  const ip = request.headers.get("cf-connecting-ip")?.trim() || "local";
  const limited = await rateLimit(db, { key: `metrics:${ip}`, limit: POST_LIMIT, windowMs: POST_WINDOW_MS });
  if (!limited.ok) return json({ error: "Too many requests. Try again in a minute." }, 429, rateLimitHeaders(limited));

  let body: unknown;
  try {
    const text = await request.text();
    if (text.length > MAX_BODY_BYTES) return json({ error: "Body too large." }, 400);
    body = JSON.parse(text);
  } catch {
    return json({ error: 'Send JSON: { "slug": "<design>", "kind": "copy" }.' }, 400);
  }
  const { slug, kind } = (typeof body === "object" && body !== null ? body : {}) as Record<string, unknown>;
  if (typeof slug !== "string" || kind !== "copy") {
    return json({ error: 'Send JSON: { "slug": "<design>", "kind": "copy" }.' }, 400);
  }
  if (!getDesign(slug)) return json({ error: `Unknown design "${slug.slice(0, 64)}".` }, 404);

  const copies = await recordCopy(db, slug);
  return json({ slug, copies }, 200, rateLimitHeaders(limited));
}
