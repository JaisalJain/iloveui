import { NextResponse, type NextRequest } from "next/server";
import { monetizationOff } from "@/lib/auth";
import { monetizationEnabled } from "@/lib/monetization";
import { safeNextPath } from "./safe-next";

// A full page load through the middleware, which refreshes an expired Clerk session token (or clears a stale
// signed-in hint) before bouncing back, signed in or not. Design pages use it when /api/code answers 401 while the
// hint cookie says the visitor is signed in.
export function GET(request: NextRequest) {
  if (!monetizationEnabled()) return monetizationOff();
  const next = safeNextPath(request.nextUrl.searchParams.get("next"));
  const response = NextResponse.redirect(new URL(next, request.nextUrl.origin), 303);
  response.headers.set("cache-control", "no-store");
  return response;
}
