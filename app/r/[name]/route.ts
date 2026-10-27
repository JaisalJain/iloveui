import { getDesign } from "@/lib/catalog";
import { getDb } from "@/lib/db";
import { getAccess } from "@/lib/entitlements";
import { recordInstall } from "@/lib/metrics";
import { getPrivateDesign } from "@/lib/private-design";
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { site } from "@/lib/site";
import { bearerToken, verifyToken } from "@/lib/tokens";

// GET /r/<slug>.json for the shadcn CLI (spec section 10). Free items, registry.json and tokens.json are static
// files in public/r and are served before this route; it answers Pro items (and any free item that reaches it).
// The folder is [name], not [name].json: OpenNext and next dev disagree on the suffix param (shadcn research §9.4).
// The CLI prints `[error] message` from JSON bodies on 401, 403 and 404, so every message says what to do next.
// Never redirect here: the CLI drops the Authorization header on cross-origin redirects.

export const dynamic = "force-dynamic";

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const RATE_LIMIT = 120;
const RATE_WINDOW_MS = 60_000;
// One `shadcn add` fetches the item about three times; count one install per token and design in this window.
const INSTALL_DEDUPE_MS = 5 * 60_000;
const HEADERS = { "cache-control": "private, no-store", vary: "Authorization" };

function fail(status: 401 | 403 | 404 | 429, error: string, message: string, extra: Record<string, string> = {}) {
  return Response.json({ error, message }, { status, headers: { ...HEADERS, ...extra } });
}

function item(body: unknown) {
  return Response.json(body, { headers: HEADERS });
}

export async function GET(request: Request, { params }: RouteContext<"/r/[name]">) {
  const { name } = await params;
  const slug = name.endsWith(".json") ? name.slice(0, -".json".length) : "";
  const design = SLUG.test(slug) ? getDesign(slug) : undefined;
  if (!design) {
    const message = slug
      ? `No design named "${slug.slice(0, 64)}". Browse ${site.url}/designs.`
      : `Registry items end in .json, for example ${site.url}/r/<design>.json.`;
    return fail(404, "Not Found", message);
  }

  if (design.tier === "free") {
    const payload = await getPrivateDesign(slug);
    if (!payload) return fail(404, "Not Found", `${slug} is not built yet. Browse ${site.url}/designs.`);
    return item(payload.registryItem);
  }

  const token = bearerToken(request);
  if (!token) {
    return fail(
      401,
      "Unauthorized",
      `${slug} is a Pro design. Create a CLI token at ${site.url}/account and set ILOVEUI_TOKEN in .env.local.`,
    );
  }

  const db = getDb();
  const owner = await verifyToken(db, token);
  if (!owner) return fail(401, "Unauthorized", `Invalid or revoked token. Create a new one at ${site.url}/account.`);

  const limited = await rateLimit(db, { key: `r:${owner.userId}`, limit: RATE_LIMIT, windowMs: RATE_WINDOW_MS });
  if (!limited.ok) {
    const headers = rateLimitHeaders(limited);
    return fail(
      429,
      "Too Many Requests",
      `Rate limit of ${RATE_LIMIT} requests per minute reached. Retry in ${headers["retry-after"]} seconds.`,
      headers,
    );
  }

  const access = await getAccess(db, owner.userId);
  if (!access.pro) {
    return fail(403, "Forbidden", `This token has no active Pro license. Unlock Pro at ${site.url}/pricing.`);
  }

  const payload = await getPrivateDesign(slug);
  if (!payload) return fail(404, "Not Found", `${slug} is not built yet. Browse ${site.url}/designs.`);

  const firstFetch = await rateLimit(db, {
    key: `install:${owner.userId}:${slug}`,
    limit: 1,
    windowMs: INSTALL_DEDUPE_MS,
  });
  if (firstFetch.ok) await recordInstall(db, slug);

  return item(payload.registryItem);
}
