import { getViewer, monetizationOff, signInRequired } from "@/lib/auth";
import { monetizationEnabled } from "@/lib/monetization";
import { getDesign } from "@/lib/catalog";
import { getDb } from "@/lib/db";
import { getAccess } from "@/lib/entitlements";
import { getPrivateDesign } from "@/lib/private-design";

// GET /api/code/<slug> → DesignCode. The only way Pro source reaches a browser: the design page asks here when the
// visitor looks signed in, and the server decides. Free code is public (it is also a static file).

export const dynamic = "force-dynamic";

const HEADERS = { "cache-control": "private, no-store", vary: "Cookie" };

function fail(status: 403 | 404, error: string, message: string) {
  return Response.json({ error, message }, { status, headers: HEADERS });
}

export async function GET(_request: Request, { params }: RouteContext<"/api/code/[slug]">) {
  if (!monetizationEnabled()) return monetizationOff();
  const { slug } = await params;
  const design = getDesign(slug);
  if (!design) return fail(404, "not_found", "No design with that name.");

  if (design.tier === "pro") {
    const viewer = await getViewer();
    if (!viewer) return signInRequired();
    const access = await getAccess(getDb(), viewer.id);
    if (!access.pro) return fail(403, "no_pro_access", "This account has no Pro access yet. See /pricing.");
  }

  const payload = await getPrivateDesign(slug);
  if (!payload) return fail(404, "not_found", "This design is not built yet.");
  return Response.json(payload.code, { headers: HEADERS });
}
