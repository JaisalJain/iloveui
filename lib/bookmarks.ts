import { and, asc, eq } from "drizzle-orm";
import type { Db } from "./db/create";
import { bookmarks } from "./db/schema";

// Bookmarks of signed-in users in D1. The design page keeps working from localStorage for everyone and mirrors
// into these rows when the visitor is signed in (lib/client/bookmarks.ts).

/** More than the catalog will ever hold; bounds a single request. */
export const MAX_BOOKMARKS = 1000;

/** The user's bookmarked slugs, oldest first. */
export async function listBookmarks(db: Db, userId: string): Promise<string[]> {
  const rows = await db
    .select({ slug: bookmarks.slug })
    .from(bookmarks)
    .where(eq(bookmarks.userId, userId))
    .orderBy(asc(bookmarks.createdAt), asc(bookmarks.slug));
  return rows.map((row) => row.slug);
}

/** Adds slugs the user has not bookmarked yet (existing bookmarks keep their date) and returns the full list. */
export async function addBookmarks(db: Db, userId: string, slugs: readonly string[]): Promise<string[]> {
  const unique = [...new Set(slugs)];
  if (unique.length > 0) {
    // D1 caps bound parameters per statement, so insert in chunks.
    const chunks: string[][] = [];
    for (let i = 0; i < unique.length; i += 25) chunks.push(unique.slice(i, i + 25));
    for (const chunk of chunks) {
      await db
        .insert(bookmarks)
        .values(chunk.map((slug) => ({ userId, slug })))
        .onConflictDoNothing();
    }
  }
  return listBookmarks(db, userId);
}

export async function removeBookmark(db: Db, userId: string, slug: string): Promise<void> {
  await db.delete(bookmarks).where(and(eq(bookmarks.userId, userId), eq(bookmarks.slug, slug)));
}

/**
 * Validates a PUT body against the catalog: `{ slugs: string[] }` with known slugs only. Unknown slugs (a design
 * renamed since the browser stored it) are dropped rather than failing the whole merge.
 */
export function parseBookmarkSlugs(body: unknown, known: (slug: string) => boolean): string[] | null {
  if (typeof body !== "object" || body === null) return null;
  const { slugs } = body as { slugs?: unknown };
  if (!Array.isArray(slugs) || slugs.length > MAX_BOOKMARKS) return null;
  if (!slugs.every((slug) => typeof slug === "string")) return null;
  return [...new Set(slugs as string[])].filter((slug) => known(slug));
}
