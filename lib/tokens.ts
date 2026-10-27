import { and, eq, isNull, lt, or } from "drizzle-orm";
import type { Db } from "./db/create";
import { apiTokens } from "./db/schema";

// CLI access tokens (spec section 10): "ilui_live_" plus 32 base62 characters. Only an HMAC-SHA-256 of the token,
// keyed with TOKEN_PEPPER, is stored, so a leaked database cannot be replayed against /r/. One token per user:
// issuing a new one replaces the old row, which revokes the old token at once.

export const TOKEN_PREFIX = "ilui_live_";
export const TOKEN_RANDOM_LENGTH = 32;
export const TOKEN_PATTERN = /^ilui_live_[0-9A-Za-z]{32}$/;

const BASE62 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
// The largest multiple of 62 that fits in a byte; bytes at or above it are dropped, so every character is uniform.
const UNBIASED_LIMIT = 248;
// lastUsedAt is a coarse "seen recently" signal; one write per minute is enough and spares D1 the CLI's bursts.
const LAST_USED_RESOLUTION_MS = 60_000;

/** A fresh token from crypto.getRandomValues, by rejection sampling (no modulo bias). */
export function generateToken(): string {
  let out = "";
  while (out.length < TOKEN_RANDOM_LENGTH) {
    const bytes = crypto.getRandomValues(new Uint8Array(48));
    for (const byte of bytes) {
      if (byte >= UNBIASED_LIMIT) continue;
      out += BASE62[byte % 62];
      if (out.length === TOKEN_RANDOM_LENGTH) break;
    }
  }
  return TOKEN_PREFIX + out;
}

function pepper(): string {
  const value = process.env.TOKEN_PEPPER;
  if (!value) throw new Error("TOKEN_PEPPER is not set. Run pnpm setup (locally) or set the Worker secret.");
  return value;
}

/** Hex HMAC-SHA-256 of a token keyed with TOKEN_PEPPER: the only form a token is ever stored in. */
export async function hashToken(token: string, secret = pepper()): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
  ]);
  const digest = new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(token)));
  return Array.from(digest, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/** Compares two strings in time that depends only on their length. */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Creates or replaces the user's single token and returns the plaintext, which is never stored or shown again. */
export async function issueToken(db: Db, userId: string): Promise<string> {
  const token = generateToken();
  const tokenHash = await hashToken(token);
  const createdAt = new Date();
  await db
    .insert(apiTokens)
    .values({ id: crypto.randomUUID(), userId, tokenHash, createdAt, lastUsedAt: null })
    .onConflictDoUpdate({
      target: apiTokens.userId,
      set: { id: crypto.randomUUID(), tokenHash, createdAt, lastUsedAt: null },
    });
  return token;
}

/** The user a token belongs to, or null for anything malformed, unknown or revoked. Records the use. */
export async function verifyToken(db: Db, token: string, now = Date.now()): Promise<{ userId: string } | null> {
  if (!TOKEN_PATTERN.test(token)) return null;
  const tokenHash = await hashToken(token);
  const row = await db
    .select({ id: apiTokens.id, userId: apiTokens.userId, tokenHash: apiTokens.tokenHash })
    .from(apiTokens)
    .where(eq(apiTokens.tokenHash, tokenHash))
    .get();
  if (!row || !timingSafeEqual(row.tokenHash, tokenHash)) return null;
  await db
    .update(apiTokens)
    .set({ lastUsedAt: new Date(now) })
    .where(
      and(
        eq(apiTokens.id, row.id),
        or(isNull(apiTokens.lastUsedAt), lt(apiTokens.lastUsedAt, new Date(now - LAST_USED_RESOLUTION_MS))),
      ),
    );
  return { userId: row.userId };
}

/** When the user's token was created and last used, or null when they have none. Never the token itself. */
export async function getTokenInfo(
  db: Db,
  userId: string,
): Promise<{ createdAt: Date; lastUsedAt: Date | null } | null> {
  const row = await db
    .select({ createdAt: apiTokens.createdAt, lastUsedAt: apiTokens.lastUsedAt })
    .from(apiTokens)
    .where(eq(apiTokens.userId, userId))
    .get();
  return row ?? null;
}

/** The bearer token of a request: "" (anonymous) when the header is missing, empty or not a Bearer credential. */
export function bearerToken(request: Request): string {
  return /^Bearer\s+(\S+)\s*$/i.exec(request.headers.get("authorization") ?? "")?.[1] ?? "";
}
