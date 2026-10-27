import { eq } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { apiTokens, users } from "@/lib/db/schema";
import {
  bearerToken,
  generateToken,
  getTokenInfo,
  hashToken,
  issueToken,
  timingSafeEqual,
  TOKEN_PATTERN,
  TOKEN_PREFIX,
  verifyToken,
} from "@/lib/tokens";
import { createTestDb, resetTestDb, type TestDb } from "./helpers/d1";

// CLI access tokens (spec section 10): format, storage as a peppered hash only, one per user, rotation, lastUsedAt.

let t: TestDb;
const previousPepper = process.env.TOKEN_PEPPER;

beforeAll(async () => {
  process.env.TOKEN_PEPPER = "unit-test-pepper";
  t = await createTestDb();
});

afterAll(async () => {
  process.env.TOKEN_PEPPER = previousPepper;
  await t?.dispose();
});

beforeEach(async () => {
  await resetTestDb(t.db);
  await t.db.insert(users).values([
    { id: "user_a", email: "mira.okafor@lumenfield.io" },
    { id: "user_b", email: "tomas.reyes@harborline.dev" },
  ]);
});

describe("token format", () => {
  it("is ilui_live_ plus 32 base62 characters", () => {
    const token = generateToken();
    expect(token.startsWith(TOKEN_PREFIX)).toBe(true);
    expect(token).toMatch(TOKEN_PATTERN);
    expect(token).toHaveLength(TOKEN_PREFIX.length + 32);
  });

  it("uses the whole alphabet without obvious bias", () => {
    const counts = new Map<string, number>();
    for (let i = 0; i < 2000; i += 1) {
      for (const char of generateToken().slice(TOKEN_PREFIX.length)) counts.set(char, (counts.get(char) ?? 0) + 1);
    }
    expect(counts.size).toBe(62);
    // 64,000 characters over 62 symbols: about 1,032 each. Modulo bias on bytes would push the first 8 to ~1,240.
    for (const count of counts.values()) expect(count).toBeGreaterThan(850);
    for (const count of counts.values()) expect(count).toBeLessThan(1220);
  });

  it("never repeats", () => {
    const tokens = new Set(Array.from({ length: 500 }, generateToken));
    expect(tokens.size).toBe(500);
  });
});

describe("hashing", () => {
  it("depends on the pepper and never contains the token", async () => {
    const token = generateToken();
    const hash = await hashToken(token);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).not.toContain(token.slice(TOKEN_PREFIX.length));
    expect(await hashToken(token, "another-pepper")).not.toBe(hash);
    expect(await hashToken(token)).toBe(hash);
  });

  it("compares in constant time", () => {
    expect(timingSafeEqual("abc", "abc")).toBe(true);
    expect(timingSafeEqual("abc", "abd")).toBe(false);
    expect(timingSafeEqual("abc", "abcd")).toBe(false);
  });
});

describe("issue, verify and rotate", () => {
  it("stores only the hash and verifies the plaintext", async () => {
    const token = await issueToken(t.db, "user_a");
    const rows = await t.db.select().from(apiTokens);
    expect(rows).toHaveLength(1);
    expect(JSON.stringify(rows)).not.toContain(token);
    expect(rows[0]?.tokenHash).toBe(await hashToken(token));
    expect(await verifyToken(t.db, token)).toEqual({ userId: "user_a" });
  });

  it("keeps one token per user and revokes the old one on rotation", async () => {
    const first = await issueToken(t.db, "user_a");
    const second = await issueToken(t.db, "user_a");
    expect(second).not.toBe(first);
    expect(await t.db.$count(apiTokens)).toBe(1);
    expect(await verifyToken(t.db, first)).toBeNull();
    expect(await verifyToken(t.db, second)).toEqual({ userId: "user_a" });
  });

  it("keeps users apart", async () => {
    const a = await issueToken(t.db, "user_a");
    const b = await issueToken(t.db, "user_b");
    expect(await verifyToken(t.db, a)).toEqual({ userId: "user_a" });
    expect(await verifyToken(t.db, b)).toEqual({ userId: "user_b" });
  });

  it("rejects malformed, unknown and deleted tokens", async () => {
    const token = await issueToken(t.db, "user_a");
    expect(await verifyToken(t.db, "")).toBeNull();
    expect(await verifyToken(t.db, "ilui_live_short")).toBeNull();
    expect(await verifyToken(t.db, `${token}x`)).toBeNull();
    expect(await verifyToken(t.db, generateToken())).toBeNull();
    await t.db.delete(apiTokens).where(eq(apiTokens.userId, "user_a"));
    expect(await verifyToken(t.db, token)).toBeNull();
  });

  it("tracks lastUsedAt at minute resolution", async () => {
    const token = await issueToken(t.db, "user_a");
    expect((await getTokenInfo(t.db, "user_a"))?.lastUsedAt).toBeNull();
    const now = Date.now();
    await verifyToken(t.db, token, now);
    expect((await getTokenInfo(t.db, "user_a"))?.lastUsedAt?.getTime()).toBe(now);
    await verifyToken(t.db, token, now + 10_000);
    expect((await getTokenInfo(t.db, "user_a"))?.lastUsedAt?.getTime()).toBe(now);
    await verifyToken(t.db, token, now + 61_000);
    expect((await getTokenInfo(t.db, "user_a"))?.lastUsedAt?.getTime()).toBe(now + 61_000);
  });

  it("reports no token info for users without one", async () => {
    expect(await getTokenInfo(t.db, "user_b")).toBeNull();
    await issueToken(t.db, "user_b");
    expect((await getTokenInfo(t.db, "user_b"))?.createdAt).toBeInstanceOf(Date);
  });
});

describe("bearer header", () => {
  const request = (value?: string) =>
    new Request("http://localhost/r/x.json", { headers: value === undefined ? {} : { authorization: value } });

  it("treats a missing, empty or non-Bearer header as anonymous", () => {
    expect(bearerToken(request())).toBe("");
    expect(bearerToken(request(""))).toBe("");
    expect(bearerToken(request("Bearer "))).toBe("");
    expect(bearerToken(request("Basic dXNlcjpwYXNz"))).toBe("");
  });

  it("reads the token of a Bearer header", () => {
    expect(bearerToken(request("Bearer ilui_live_abc"))).toBe("ilui_live_abc");
    expect(bearerToken(request("bearer  ilui_live_abc "))).toBe("ilui_live_abc");
  });
});
