import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Local test checkout",
  description: "A stand-in for the hosted Dodo Payments checkout, for testing purchases on a development server.",
  robots: { index: false, follow: false },
};

// GET /dev/checkout?session=<signed session> (spec section 0). The checkout view sits inside the development branch:
// NODE_ENV is a compile-time constant, so production bundles drop it and this page is a static 404.
export default async function DevCheckoutPage({ searchParams }: { searchParams: Promise<{ session?: string }> }) {
  if (process.env.NODE_ENV === "development") {
    const { LocalCheckoutPage } = await import("./checkout-view");
    const { session } = await searchParams;
    return <LocalCheckoutPage token={typeof session === "string" ? session : null} />;
  }
  notFound();
}
