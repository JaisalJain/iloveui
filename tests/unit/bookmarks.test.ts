import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { addBookmarks, listBookmarks, MAX_BOOKMARKS, parseBookmarkSlugs, removeBookmark } from "@/lib/bookmarks";
import { users } from "@/lib/db/schema";
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
  await t.db.insert(users).values([
    { id: "user_a", email: "ines.varga@northpeak.studio" },
    { id: "user_b", email: "kofi.mensah@quillstack.dev" },
  ]);
});

describe("bookmarks in D1", () => {
  it("merges without duplicates and keeps users apart", async () => {
    expect(await listBookmarks(t.db, "user_a")).toEqual([]);
    expect(await addBookmarks(t.db, "user_a", ["gridline-hero", "slab-pricing", "gridline-hero"])).toEqual([
      "gridline-hero",
      "slab-pricing",
    ]);
    const merged = await addBookmarks(t.db, "user_a", ["slab-pricing", "gumdrop-buttons"]);
    expect([...merged].sort()).toEqual(["gridline-hero", "gumdrop-buttons", "slab-pricing"]);
    expect(await listBookmarks(t.db, "user_b")).toEqual([]);
  });

  it("removes one bookmark, and removing a missing one is fine", async () => {
    await addBookmarks(t.db, "user_a", ["gridline-hero", "slab-pricing"]);
    await removeBookmark(t.db, "user_a", "gridline-hero");
    await removeBookmark(t.db, "user_a", "not-bookmarked");
    expect(await listBookmarks(t.db, "user_a")).toEqual(["slab-pricing"]);
  });

  it("handles a merge larger than one statement's parameter budget", async () => {
    const slugs = Array.from({ length: 60 }, (_, index) => `design-${index}`);
    expect(await addBookmarks(t.db, "user_a", slugs)).toHaveLength(60);
  });

  it("accepts an empty merge", async () => {
    expect(await addBookmarks(t.db, "user_a", [])).toEqual([]);
  });
});

describe("PUT body validation", () => {
  const known = (slug: string) => ["gridline-hero", "slab-pricing"].includes(slug);

  it("keeps known slugs and drops unknown ones", () => {
    expect(parseBookmarkSlugs({ slugs: ["gridline-hero", "renamed-design", "slab-pricing"] }, known)).toEqual([
      "gridline-hero",
      "slab-pricing",
    ]);
  });

  it("rejects anything that is not { slugs: string[] } within the size limit", () => {
    expect(parseBookmarkSlugs(null, known)).toBeNull();
    expect(parseBookmarkSlugs("gridline-hero", known)).toBeNull();
    expect(parseBookmarkSlugs({ slugs: "gridline-hero" }, known)).toBeNull();
    expect(parseBookmarkSlugs({ slugs: [1, 2] }, known)).toBeNull();
    expect(parseBookmarkSlugs({ slugs: Array.from({ length: MAX_BOOKMARKS + 1 }, () => "x") }, known)).toBeNull();
  });
});
