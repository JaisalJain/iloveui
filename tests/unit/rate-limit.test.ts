import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { rateLimits } from "@/lib/db/schema";
import { getCopyCounts, recordCopy } from "@/lib/metrics";
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { createTestDb, resetTestDb, type TestDb } from "./helpers/d1";

let t: TestDb;

beforeAll(async () => {
  t = await createTestDb();
});

afterAll(async () => {
  await t?.dispose();
});

beforeEach(async () => {
  await resetTestDb(t.db);
});

describe("fixed-window rate limit on D1", () => {
  const options = { key: "metrics:203.0.113.7", limit: 3, windowMs: 60_000 };

  it("allows the limit, then refuses until the window rolls over", async () => {
    const now = 1_800_000_030_000;
    const results = [];
    for (let i = 0; i < 4; i += 1) results.push(await rateLimit(t.db, { ...options, now }));
    expect(results.map((result) => result.ok)).toEqual([true, true, true, false]);
    expect(results.map((result) => result.remaining)).toEqual([2, 1, 0, 0]);
    expect(results[3]?.resetAt).toBe(1_800_000_060_000);
    expect(rateLimitHeaders(results[3]!, now)["retry-after"]).toBe("30");

    const next = await rateLimit(t.db, { ...options, now: now + 60_000 });
    expect(next).toMatchObject({ ok: true, remaining: 2 });
    // The expired window was dropped in the same batch.
    expect(await t.db.$count(rateLimits)).toBe(1);
  });

  it("keeps keys independent", async () => {
    const now = 1_800_000_000_000;
    await rateLimit(t.db, { ...options, now });
    const other = await rateLimit(t.db, { ...options, key: "metrics:local", now });
    expect(other.remaining).toBe(2);
  });
});

describe("design metrics", () => {
  it("counts copies per design", async () => {
    expect(await getCopyCounts(t.db)).toEqual({});
    expect(await recordCopy(t.db, "gridline-hero")).toBe(1);
    expect(await recordCopy(t.db, "gridline-hero")).toBe(2);
    await recordCopy(t.db, "margin-notes");
    expect(await getCopyCounts(t.db)).toEqual({ "gridline-hero": 2, "margin-notes": 1 });
  });
});
