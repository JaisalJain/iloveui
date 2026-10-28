import { getViewer, monetizationOff, signInRequired } from "@/lib/auth";
import { monetizationEnabled } from "@/lib/monetization";
import { removeBookmark } from "@/lib/bookmarks";
import { getDb } from "@/lib/db";

// DELETE /api/bookmarks/<slug> removes one bookmark. Removing one that does not exist succeeds too.

export const dynamic = "force-dynamic";

export async function DELETE(_request: Request, { params }: RouteContext<"/api/bookmarks/[slug]">) {
  if (!monetizationEnabled()) return monetizationOff();
  const viewer = await getViewer();
  if (!viewer) return signInRequired();
  const { slug } = await params;
  await removeBookmark(getDb(), viewer.id, slug);
  return new Response(null, { status: 204, headers: { "cache-control": "private, no-store" } });
}
