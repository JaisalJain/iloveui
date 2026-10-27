import { gt, sql } from "drizzle-orm";
import type { Db } from "./db/create";
import { designMetrics } from "./db/schema";

// Per-design usage counters (design_metrics). Copies drive the "Most copied" sort on /designs; installs and
// downloads are counted by the /r/ and /api/download routes.

/** Copy counts for every design that has been copied at least once. */
export async function getCopyCounts(db: Db): Promise<Record<string, number>> {
  const rows = await db
    .select({ slug: designMetrics.slug, copies: designMetrics.copies })
    .from(designMetrics)
    .where(gt(designMetrics.copies, 0));
  return Object.fromEntries(rows.map((row) => [row.slug, row.copies]));
}

/** Adds one copy to a design and returns its new total. */
export async function recordCopy(db: Db, slug: string): Promise<number> {
  const [row] = await db
    .insert(designMetrics)
    .values({ slug, copies: 1 })
    .onConflictDoUpdate({ target: designMetrics.slug, set: { copies: sql`${designMetrics.copies} + 1` } })
    .returning({ copies: designMetrics.copies });
  return row?.copies ?? 1;
}

/** Adds one CLI install to a design (the /r/ route dedupes the CLI's repeated requests before calling this). */
export async function recordInstall(db: Db, slug: string): Promise<void> {
  await db
    .insert(designMetrics)
    .values({ slug, installs: 1 })
    .onConflictDoUpdate({ target: designMetrics.slug, set: { installs: sql`${designMetrics.installs} + 1` } });
}

/** Adds one zip download to a design. */
export async function recordDownload(db: Db, slug: string): Promise<void> {
  await db
    .insert(designMetrics)
    .values({ slug, downloads: 1 })
    .onConflictDoUpdate({ target: designMetrics.slug, set: { downloads: sql`${designMetrics.downloads} + 1` } });
}
