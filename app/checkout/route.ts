import { getViewer } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { startCheckout } from "@/lib/payments/checkout";
import { requestCurrency } from "@/lib/payments/request";

// GET /checkout?plan=pro|team, the target of the pricing page buttons. The middleware sends signed-out visitors to
// sign-in first and back here after. Success redirects to the provider's hosted checkout; any failure goes back to
// /pricing with a code the page explains.

export const dynamic = "force-dynamic";

function redirect(location: string | URL): Response {
  return new Response(null, { status: 303, headers: { location: location.toString(), "cache-control": "no-store" } });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const viewer = await getViewer();
  if (!viewer) {
    const signIn = new URL("/sign-in", url);
    signIn.searchParams.set("redirect_url", url.toString());
    return redirect(signIn);
  }
  const result = await startCheckout(getDb(), viewer, url.searchParams.get("plan"), requestCurrency(request));
  if (result.ok) return redirect(result.url);
  if (result.error === "already_owned") return redirect(new URL("/account", url));
  const pricing = new URL("/pricing", url);
  pricing.searchParams.set("checkout_error", result.error);
  return redirect(pricing);
}
