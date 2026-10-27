import { getViewer, signInRequired } from "@/lib/auth";
import { removeBookmark } from "@/lib/bookmarks";
import { getDb } from "@/lib/db";

// DELETE /api/bookmarks/<slug> removes one bookmark. Removing one that does not exist succeeds too.

export const dynamic = "force-dynamic";

export async function DELETE(_request: Request, { params }: RouteContext<"/api/bookmarks/[slug]">) {
  const viewer = await getViewer();
  if (!viewer) return signInRequired();
  const { slug } = await params;
  await removeBookmark(getDb(), viewer.id, slug);
  return new Response(null, { status: 204, headers: { "cache-control": "private, no-store" } });
}
