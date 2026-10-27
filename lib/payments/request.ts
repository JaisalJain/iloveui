import "server-only";
import type { Currency } from "@/config/pricing";
import { DEV_REGION_COOKIE, resolveCurrency } from "@/lib/region";

const NO_STORE = { "cache-control": "no-store" };

/** The buyer's pricing currency from Cloudflare's country header (or the development region settings). */
export function requestCurrency(request: Request): Currency {
  const cookie = request.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim().split("="))
    .find(([name]) => name === DEV_REGION_COOKIE)?.[1];
  const devCookie = cookie ? decodeURIComponent(cookie) : null;
  return resolveCurrency({ countryHeader: request.headers.get("cf-ipcountry"), devCookie });
}

export function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return Response.json(body, { status, headers: { ...NO_STORE, ...headers } });
}

/** Parses a JSON object body, or returns null for anything else. */
export async function readJsonObject(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const body: unknown = await request.json();
    return body && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}
