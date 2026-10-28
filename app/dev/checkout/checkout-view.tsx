import { ArrowLeft, FlaskConical } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/site/logo";
import { buttonClasses } from "@/components/ui/button-classes";
import { PAID_PLANS, formatPrice } from "@/config/pricing";
import { REFUND_WINDOW_DAYS } from "@/lib/licenses";
import { createLocalProvider } from "@/lib/payments/local";
import { LocalCheckoutForm } from "./local-checkout";

// The local stand-in for Dodo's hosted checkout: an order summary on the left, the payment panel on the right, and
// a banner nobody can mistake for a real payment page.

function Banner() {
  return (
    <header className="border-b border-hairline bg-surface">
      <div className="page-frame flex flex-wrap items-center gap-x-3 gap-y-1 py-3 text-14">
        <span className="inline-flex items-center gap-2 rounded-full border border-accent px-2.5 py-0.5 font-mono text-12 text-accent">
          <FlaskConical size={14} strokeWidth={1.5} aria-hidden />
          Local test checkout
        </span>
        <span className="text-pretty text-muted">
          No money moves. Pay and Fail send signed webhooks to{" "}
          <code className="font-mono text-12">/api/webhooks/local</code>, the way Dodo Payments would.
        </span>
      </div>
    </header>
  );
}

function Expired() {
  return (
    <main id="main" className="page-frame flex flex-col items-start py-24">
      <p className="label-mono text-muted">Checkout</p>
      <h1 className="mt-4 max-w-2xl text-28 font-semibold text-balance sm:text-40">
        This checkout link has expired or was changed.
      </h1>
      <p className="mt-4 max-w-lg text-16 text-pretty text-muted">
        Checkout links work for 24 hours. Start again from the pricing page to get a fresh one.
      </p>
      <Link href="/pricing" className={buttonClasses({ variant: "primary", size: "lg", className: "mt-8" })}>
        Back to pricing
      </Link>
    </main>
  );
}

export async function LocalCheckoutPage({ token }: { token: string | null }) {
  const provider = await createLocalProvider();
  const session = await provider.readCheckout(token);
  if (!token || !session) {
    return (
      <div className="min-h-dvh bg-canvas text-fg">
        <Banner />
        <Expired />
      </div>
    );
  }

  const plan = PAID_PLANS[session.plan];
  const amount = formatPrice(session.amountMinor, session.currency);
  const regular = plan.prices[session.currency].regularMinor;
  const seats = plan.seats === 1 ? "1 person" : `Up to ${plan.seats} people`;

  return (
    <div className="flex min-h-dvh flex-col bg-canvas text-fg">
      <Banner />
      <main id="main" className="page-frame grid flex-1 gap-12 py-12 lg:grid-cols-12 lg:gap-6 lg:py-24">
        <section aria-labelledby="summary" className="lg:col-span-5">
          <a
            href={session.cancelUrl}
            className="-ml-2 inline-flex tap-target items-center gap-2 rounded-control px-2 text-14 text-muted hover:text-fg"
          >
            <ArrowLeft size={16} strokeWidth={1.5} aria-hidden />
            Back to pricing
          </a>
          <div className="mt-8 flex items-center gap-3">
            <Logo aria-hidden className="h-5 w-auto text-fg" />
            <span className="sr-only">iloveui</span>
          </div>
          <h1 id="summary" className="mt-6 text-14 font-medium text-muted">
            Pay iloveui
          </h1>
          <p className="mt-2 flex items-baseline gap-3">
            <span className="text-40 font-semibold tabular-nums sm:text-64">{amount}</span>
            {regular ? (
              <span className="text-16 text-muted tabular-nums">
                <span className="sr-only">Regular price </span>
                <s>{formatPrice(regular, session.currency)}</s>
              </span>
            ) : null}
          </p>
          <dl className="mt-10 divide-y divide-hairline border-y border-hairline text-14">
            <div className="flex items-start justify-between gap-6 py-4">
              <dt>
                <span className="block font-medium text-fg">iloveui {plan.name}</span>
                <span className="mt-1 block text-muted">Lifetime license · {seats}</span>
              </dt>
              <dd className="font-mono tabular-nums">{amount}</dd>
            </div>
            <div className="flex justify-between gap-6 py-4 text-muted">
              <dt>Tax</dt>
              <dd className="font-mono">Included</dd>
            </div>
            <div className="flex justify-between gap-6 py-4 font-medium">
              <dt>Total due today</dt>
              <dd className="font-mono tabular-nums">
                {amount} <span className="text-muted">{session.currency}</span>
              </dd>
            </div>
          </dl>
          <p className="mt-6 max-w-md text-14 text-pretty text-muted">
            One payment, no renewal. Refundable from your account for {REFUND_WINDOW_DAYS} days after purchase.
          </p>
        </section>

        <section aria-labelledby="payment" className="lg:col-span-6 lg:col-start-7">
          <div className="rounded-card border border-hairline bg-surface p-6 shadow-sm sm:p-8">
            <h2 id="payment" className="text-20 font-semibold">
              Payment
            </h2>
            <LocalCheckoutForm
              token={token}
              email={session.email}
              amount={amount}
              cancelUrl={session.cancelUrl}
              reference={session.reference}
            />
          </div>
        </section>
      </main>
    </div>
  );
}
