import { getViewer, signInRequired } from "@/lib/auth";
import { getDesign } from "@/lib/catalog";
import { getDb } from "@/lib/db";
import { downloadFileName, themeFromSearchParams, themeZip } from "@/lib/download";
import { getAccess } from "@/lib/entitlements";
import { recordDownload } from "@/lib/metrics";
import { getDesignZip } from "@/lib/private-design";
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit";

// GET /api/download/<slug>?accent=&neutral=&radius=&font=&density= → the design's zip with the buyer's Theme Lab
// tokens. Free designs download for everyone; Pro designs need Pro access. 60 downloads per user (or, signed out,
// per IP) per hour (spec section 10).

export const dynamic = "force-dynamic";

const NO_STORE = { "cache-control": "private, no-store" };
const DOWNLOAD_LIMIT = 60;
const DOWNLOAD_WINDOW_MS = 60 * 60_000;

function fail(status: 403 | 404 | 429, error: string, message: string, headers: Record<string, string> = {}) {
  return Response.json({ error, message }, { status, headers: { ...NO_STORE, ...headers } });
}

export async function GET(request: Request, { params }: RouteContext<"/api/download/[slug]">) {
  const { slug } = await params;
  const design = getDesign(slug);
  if (!design) return fail(404, "not_found", "No design with that name.");

  const db = getDb();
  const viewer = await getViewer();
  if (design.tier === "pro") {
    if (!viewer) return signInRequired();
    const access = await getAccess(db, viewer.id);
    if (!access.pro) return fail(403, "no_pro_access", "This account has no Pro access yet. See /pricing.");
  }

  const who = viewer ? `user:${viewer.id}` : `ip:${request.headers.get("cf-connecting-ip")?.trim() || "local"}`;
  const limited = await rateLimit(db, { key: `download:${who}`, limit: DOWNLOAD_LIMIT, windowMs: DOWNLOAD_WINDOW_MS });
  if (!limited.ok) {
    return fail(
      429,
      "rate_limited",
      `You reached ${DOWNLOAD_LIMIT} downloads this hour. Try again later.`,
      rateLimitHeaders(limited),
    );
  }

  const archive = await getDesignZip(slug);
  if (!archive) return fail(404, "not_found", "This design's download is not built yet.");
  const zip = themeZip(archive, themeFromSearchParams(new URL(request.url).searchParams));
  await recordDownload(db, slug);

  // createZip allocates a plain ArrayBuffer; the cast only narrows the generic.
  return new Response(zip as Uint8Array<ArrayBuffer>, {
    headers: {
      ...NO_STORE,
      ...rateLimitHeaders(limited),
      "content-type": "application/zip",
      "content-length": String(zip.byteLength),
      "content-disposition": `attachment; filename="${downloadFileName(slug)}"`,
      "x-content-type-options": "nosniff",
    },
  });
}
