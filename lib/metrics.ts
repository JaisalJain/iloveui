import { gt, sql } from "drizzle-orm";
import type { Db } from "./db/create";
import { designMetrics } from "./db/schema";

// Per-design usage counters (design_metrics). Copies drive the "Most copied" sort on /designs.

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
