import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { SIGNED_IN_HINT_COOKIE } from "@/components/auth/signed-in-hint";
import { monetizationEnabled } from "@/lib/monetization";

// Clerk runs only where it is needed: the auth pages, /account, /checkout and the API routes that call auth().
// Public pages (/, /designs, design pages, /r/, and /pricing when monetization is on) are not matched, so they stay static and never load
// Clerk. Every page and route still checks auth itself; the redirect below only saves a round trip.

// SIGNED_IN_HINT_COOKIE is set while the visitor is signed in, so static pages know when to ask the API for owner-only
// content. It is a hint for the interface, never an authorization: every API route checks the session itself.

const PROTECTED_PAGES = ["/account", "/checkout"];

/** Static pages send visitors here to refresh an expired session token. A visitor who turns out to be signed out is
 * not sent to sign-in: the hint cookie is cleared below and the route returns them to the page they came from. */
const SESSION_REFRESH_PATH = "/account/refresh";

const withClerk = clerkMiddleware(
  async (auth, request) => {
    const { pathname } = request.nextUrl;
    const { isAuthenticated, redirectToSignIn } = await auth();
    const protectedPage =
      pathname !== SESSION_REFRESH_PATH &&
      PROTECTED_PAGES.some((page) => pathname === page || pathname.startsWith(`${page}/`));
    if (protectedPage && !isAuthenticated) return redirectToSignIn({ returnBackUrl: request.url });

    const response = NextResponse.next();
    // Only page loads update the hint: API calls can carry an expired short-lived session token while the visitor
    // is still signed in, and page loads are where Clerk refreshes it.
    if (request.method === "GET" && request.headers.get("sec-fetch-dest") === "document") {
      const hinted = request.cookies.get(SIGNED_IN_HINT_COOKIE)?.value === "1";
      if (isAuthenticated && !hinted) {
        response.cookies.set(SIGNED_IN_HINT_COOKIE, "1", { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 30 });
      } else if (!isAuthenticated && hinted) {
        response.cookies.delete(SIGNED_IN_HINT_COOKIE);
      }
    }
    return response;
  },
  {
    authorizedParties: ["http://localhost:3000", "https://iloveui.dev"],
    // Our own pages, not Clerk's hosted ones, for the redirects above.
    signInUrl: "/sign-in",
    signUpUrl: "/sign-up",
  },
);

// Without monetization there are no accounts: Clerk never runs and needs no keys.
export default monetizationEnabled() ? withClerk : () => NextResponse.next();

export const config = {
  matcher: ["/account/:path*", "/sign-in/:path*", "/sign-up/:path*", "/checkout/:path*", "/api/:path*"],
};
