import { clsx } from "clsx";
import Link from "next/link";
import { TierTag } from "@/components/designs/tier-tag";
import { buttonClasses } from "@/components/ui/button-classes";
import { FREE_PLAN, PAID_PLANS, formatPrice } from "@/config/pricing";
import { site } from "@/lib/site";
import { SectionHeading } from "./section-heading";

// The home page is static, so it cannot read the visitor's country: prices show in USD with the India prices stated
// beside them, and /pricing shows the visitor's own currency.
export function PricingTeaser() {
  const pro = PAID_PLANS.pro;
  const team = PAID_PLANS.team;
  const plans = [
    { id: "free", name: FREE_PLAN.name, summary: FREE_PLAN.summary, price: formatPrice(0, "USD"), regular: null },
    {
      id: "pro",
      name: pro.name,
      summary: pro.summary,
      price: formatPrice(pro.prices.USD.amountMinor, "USD"),
      regular: pro.prices.USD.regularMinor ? formatPrice(pro.prices.USD.regularMinor, "USD") : null,
    },
    {
      id: "team",
      name: team.name,
      summary: team.summary,
      price: formatPrice(team.prices.USD.amountMinor, "USD"),
      regular: null,
    },
  ];
  return (
    <section aria-labelledby="home-pricing" className="border-t border-hairline">
      <div className="page-frame grid gap-12 py-24 sm:py-32 lg:grid-cols-12 lg:gap-6">
        <div className="lg:col-span-4">
          <SectionHeading id="home-pricing" index="04" eyebrow="Pricing" title="Pay once. Keep every design.">
            One lifetime payment, no subscription. Full refund within {site.refundWindowDays} days, no questions asked.
          </SectionHeading>
          <p className="mt-6 max-w-md text-14 text-muted">
            Prices in USD. In India, Pro is{" "}
            <span className="text-fg tabular-nums">{formatPrice(pro.prices.INR.amountMinor, "INR")}</span> and Team{" "}
            <span className="text-fg tabular-nums">{formatPrice(team.prices.INR.amountMinor, "INR")}</span>, charged in
            rupees.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/pricing" className={buttonClasses({ variant: "primary", size: "md" })}>
              Compare plans
            </Link>
            <Link href="/designs?tier=free" className={buttonClasses({ variant: "outline", size: "md" })}>
              Start free
            </Link>
          </div>
        </div>
        <ul className="lg:col-span-8 lg:col-start-5">
          {plans.map((plan) => (
            <li
              key={plan.id}
              className={clsx(
                "grid grid-cols-[1fr_auto] items-baseline gap-x-6 gap-y-2 border-t border-hairline px-4 py-6 last:border-b sm:grid-cols-[8rem_1fr_auto] sm:px-6 sm:py-8",
                // Pro is the one highlighted plan: a raised card whose border also separates its neighbours.
                plan.id === "pro" && "rounded-card border bg-surface shadow-sm",
                plan.id === "team" && "border-t-0",
              )}
            >
              <h3 className="flex items-center gap-2 text-20 font-semibold">
                {plan.name}
                {plan.id === "pro" ? <TierTag tier="pro" /> : null}
              </h3>
              <p className="order-3 col-span-2 max-w-md text-14 text-muted sm:order-none sm:col-span-1">
                {plan.summary}
              </p>
              <p className="text-right whitespace-nowrap">
                {plan.regular ? (
                  <s className="mr-2 text-14 text-muted tabular-nums">
                    <span className="sr-only">Regular price </span>
                    {plan.regular}
                  </s>
                ) : null}
                <span className="text-28 font-semibold tabular-nums">{plan.price}</span>
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
