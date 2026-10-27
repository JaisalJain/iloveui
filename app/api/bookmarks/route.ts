import { getViewer, signInRequired } from "@/lib/auth";
import { addBookmarks, listBookmarks, parseBookmarkSlugs } from "@/lib/bookmarks";
import { getDesign } from "@/lib/catalog";
import { getDb } from "@/lib/db";

// GET /api/bookmarks → { slugs }. PUT /api/bookmarks { slugs } merges them into the viewer's bookmarks (unknown
// slugs are dropped) and returns the full list.

export const dynamic = "force-dynamic";

const NO_STORE = { "cache-control": "private, no-store" };
const MAX_BODY_BYTES = 64 * 1024;

export async function GET() {
  const viewer = await getViewer();
  if (!viewer) return signInRequired();
  return Response.json({ slugs: await listBookmarks(getDb(), viewer.id) }, { headers: NO_STORE });
}

export async function PUT(request: Request) {
  const viewer = await getViewer();
  if (!viewer) return signInRequired();
  let body: unknown;
  try {
    const text = await request.text();
    if (text.length > MAX_BODY_BYTES) throw new Error("too large");
    body = JSON.parse(text);
  } catch {
    body = null;
  }
  const slugs = parseBookmarkSlugs(body, (slug) => Boolean(getDesign(slug)));
  if (!slugs) {
    return Response.json(
      { error: "invalid_body", message: 'Send JSON: { "slugs": ["<design>", ...] }.' },
      { status: 400, headers: NO_STORE },
    );
  }
  return Response.json({ slugs: await addBookmarks(getDb(), viewer.id, slugs) }, { headers: NO_STORE });
}
