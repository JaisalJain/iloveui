import { CircleAlert, Check, Minus } from "lucide-react";
import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import type { ReactNode } from "react";
import { buttonClasses } from "@/components/ui/button-classes";
import { FREE_PLAN, PAID_PLANS, formatPrice, type Currency } from "@/config/pricing";
import { CHECKOUT_ERROR_MESSAGES, isCheckoutError } from "@/lib/payments/checkout-errors";
import { DEV_REGION_COOKIE, resolveCurrency } from "@/lib/region";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";
import { CATEGORIES } from "@/registry/definitions";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "24 designs free forever. Pro unlocks every current and future design with one lifetime payment; Team covers up to 10 people.",
  alternates: { canonical: "/pricing" },
};

const CATALOG_TARGET = CATEGORIES.reduce((sum, category) => sum + category.target, 0);

type Cell = boolean | string;
const COMPARISON: { label: string; free: Cell; pro: Cell; team: Cell }[] = [
  { label: "Designs", free: `${FREE_PLAN.designs}`, pro: "Every design", team: "Every design" },
  { label: "Designs added later", free: false, pro: true, team: true },
  { label: "React and HTML versions", free: true, pro: true, team: true },
  { label: "Theme Lab tokens in copied code", free: true, pro: true, team: true },
  { label: "Install with the shadcn CLI", free: "Free designs", pro: true, team: true },
  { label: "AI prompts and zip downloads", free: "Free designs", pro: true, team: true },
  { label: "Commercial use", free: true, pro: true, team: true },
  { label: "People", free: "1", pro: "1", team: "Up to 10" },
];

function faq(currency: Currency): { question: string; answer: ReactNode }[] {
  const pro = PAID_PLANS.pro.prices;
  const team = PAID_PLANS.team.prices;
  return [
    {
      question: "What can I build with the designs?",
      answer:
        "Unlimited personal and commercial end products, for yourself and for clients. You may not resell, sublicense or redistribute the designs as a UI kit, template, component library or design asset, whether original or modified. Free designs come under the same terms at no cost.",
    },
    {
      question: "Do I get new designs after I buy?",
      answer: `Yes. Pro and Team include every design in the catalog today and every one added later, with no renewal. The catalog is growing toward ${CATALOG_TARGET} designs.`,
    },
    {
      question: "What if it is not for me?",
      answer: `You get a full refund within ${site.refundWindowDays} days of purchase, no questions asked. Access ends when the refund goes through.`,
    },
    {
      question: "How do Team seats work?",
      answer:
        "The owner invites up to 9 more people by email. An invite becomes an active seat as soon as that person signs in with the invited address, and the owner can remove seats at any time.",
    },
    {
      question: "Can I install designs from the command line?",
      answer: (
        <>
          Every design installs with the shadcn CLI, for example{" "}
          <code className="font-mono text-14 text-fg">npx shadcn@latest add @iloveui/gridline-hero</code>. Pro designs
          need your personal access token, which you create from your account.
        </>
      ),
    },
    {
      question: "Which formats do designs come in?",
      answer:
        "Each design ships twice: a single React component in TypeScript with Tailwind CSS v4, and a plain HTML file with Tailwind CSS v4 and vanilla JavaScript. Both carry your Theme Lab tokens when you copy or download them.",
    },
    {
      question: "Will I get an invoice?",
      answer: `${site.merchantOfRecord} processes payments as Merchant of Record. It adds sales tax or VAT where it applies and emails you an invoice; the invoice link also stays on your account page.`,
    },
    {
      question: "Is there India pricing?",
      answer:
        currency === "INR"
          ? `Yes, and you are seeing it: in India, Pro is ${formatPrice(pro.INR.amountMinor, "INR")} and Team ${formatPrice(team.INR.amountMinor, "INR")}, charged in rupees.`
          : `Yes. Buyers in India pay in rupees: ${formatPrice(pro.INR.amountMinor, "INR")} for Pro and ${formatPrice(team.INR.amountMinor, "INR")} for Team. The price follows the country of your connection.`,
    },
  ];
}

function CellValue({ value }: { value: Cell }) {
  if (value === true) {
    return (
      <>
        <Check size={16} strokeWidth={1.5} aria-hidden className="text-fg" />
        <span className="sr-only">Included</span>
      </>
    );
  }
  if (value === false) {
    return (
      <>
        <Minus size={16} strokeWidth={1.5} aria-hidden className="text-muted" />
        <span className="sr-only">Not included</span>
      </>
    );
  }
  return <span className="tabular-nums">{value}</span>;
}

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout_error?: string | string[] }>;
}) {
  const [headerList, cookieStore, query] = await Promise.all([headers(), cookies(), searchParams]);
  const checkoutError = isCheckoutError(query.checkout_error) ? query.checkout_error : null;
  const currency = resolveCurrency({
    countryHeader: headerList.get("cf-ipcountry"),
    devCookie: cookieStore.get(DEV_REGION_COOKIE)?.value ?? null,
  });
  const other: Currency = currency === "USD" ? "INR" : "USD";
  const plans = [
    {
      id: "free",
      name: FREE_PLAN.name,
      summary: FREE_PLAN.summary,
      price: formatPrice(0, currency),
      regular: null,
      terms: "Free forever",
      highlighted: false,
      action: { href: "/designs?tier=free", label: "Browse free designs" },
    },
    ...(["pro", "team"] as const).map((id) => {
      const plan = PAID_PLANS[id];
      const price = plan.prices[currency];
      return {
        id,
        name: plan.name,
        summary: plan.summary,
        price: formatPrice(price.amountMinor, currency),
        regular: price.regularMinor ? formatPrice(price.regularMinor, currency) : null,
        terms: id === "team" ? `One payment, up to ${plan.seats} people` : "One payment, lifetime access",
        highlighted: id === "pro",
        // A plain link, never prefetched: following it starts a checkout.
        action: { href: `/checkout?plan=${id}`, label: `Get ${plan.name}` },
      };
    }),
  ];

  return (
    <div className="page-frame pt-16 pb-8 sm:pt-24">
      <header className="max-w-3xl">
        <p className="label-mono text-muted">Pricing</p>
        <h1 className="mt-4 text-40 font-semibold sm:text-64">
          Pay once, keep <em className="font-serif font-normal italic">every</em> design.
        </h1>
        <p className="mt-6 max-w-2xl text-16 text-muted sm:text-20">
          Start with {FREE_PLAN.designs} free designs. Pro unlocks the whole catalog, including every design added
          later, for one lifetime payment.
        </p>
      </header>

      {checkoutError ? (
        <div
          role="alert"
          className="mt-12 flex max-w-3xl items-start gap-3 rounded-card border border-hairline bg-surface p-4 text-14 shadow-sm sm:mt-16"
        >
          <CircleAlert size={16} strokeWidth={1.5} aria-hidden className="mt-0.5 shrink-0 text-danger" />
          <p>
            <span className="font-medium">Checkout did not start.</span>{" "}
            <span className="text-muted">{CHECKOUT_ERROR_MESSAGES[checkoutError]}</span>
          </p>
        </div>
      ) : null}

      <section aria-label="Plans" className="mt-12 grid gap-4 sm:mt-16 lg:grid-cols-3">
        {plans.map((plan) => (
          <article
            key={plan.id}
            aria-labelledby={`plan-${plan.id}`}
            className={cn(
              "flex flex-col rounded-card border bg-surface p-6 shadow-sm sm:p-8",
              plan.highlighted ? "border-accent" : "border-hairline",
            )}
          >
            <div className="flex items-center justify-between gap-4">
              <h2 id={`plan-${plan.id}`} className="text-20 font-semibold">
                {plan.name}
              </h2>
              {plan.regular ? <span className="label-mono text-accent">Launch price</span> : null}
            </div>
            <p className="mt-6 flex items-baseline gap-3">
              <span className="text-40 font-semibold tabular-nums">{plan.price}</span>
              {plan.regular ? (
                <span className="text-16 text-muted tabular-nums">
                  <span className="sr-only">Regular price </span>
                  <s>{plan.regular}</s>
                </span>
              ) : null}
            </p>
            <p className="mt-1 font-mono text-12 text-muted">{plan.terms}</p>
            <p className="mt-6 flex-1 text-14 text-muted">{plan.summary}</p>
            <a
              href={plan.action.href}
              className={buttonClasses({
                variant: plan.highlighted ? "primary" : "outline",
                size: "lg",
                className: "mt-8 w-full",
              })}
            >
              {plan.action.label}
            </a>
          </article>
        ))}
      </section>

      <p className="mt-6 max-w-3xl text-14 text-muted">
        Prices in {currency === "USD" ? "US dollars" : "Indian rupees"}.{" "}
        {currency === "USD"
          ? `Buyers in India pay ${formatPrice(PAID_PLANS.pro.prices.INR.amountMinor, "INR")} for Pro and ${formatPrice(PAID_PLANS.team.prices.INR.amountMinor, "INR")} for Team.`
          : `Outside India, Pro is ${formatPrice(PAID_PLANS.pro.prices[other].amountMinor, other)} and Team ${formatPrice(PAID_PLANS.team.prices[other].amountMinor, other)}.`}{" "}
        {site.merchantOfRecord}, our Merchant of Record, adds sales tax or VAT at checkout where it applies. Full refund
        within {site.refundWindowDays} days.
      </p>

      <section aria-labelledby="compare" className="mt-24">
        <h2 id="compare" className="text-28 font-semibold">
          Compare plans
        </h2>
        <div className="mt-8 rounded-card border border-hairline bg-surface">
          <table className="w-full table-fixed border-collapse text-left text-14">
            <thead>
              <tr className="border-b border-hairline">
                <th scope="col" className="w-[38%] px-3 py-3 font-normal sm:px-6">
                  <span className="sr-only">Feature</span>
                </th>
                {plans.map((plan) => (
                  <th
                    key={plan.id}
                    scope="col"
                    className={cn("px-3 py-3 font-semibold sm:px-6", plan.highlighted && "text-accent")}
                  >
                    {plan.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((row) => (
                <tr key={row.label} className="border-b border-hairline last:border-b-0">
                  <th scope="row" className="px-3 py-3 font-normal text-muted sm:px-6">
                    {row.label}
                  </th>
                  {(["free", "pro", "team"] as const).map((plan) => (
                    <td key={plan} className="px-3 py-3 align-middle sm:px-6">
                      <span className="inline-flex items-center">
                        <CellValue value={row[plan]} />
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="faq" className="mt-24 grid gap-8 lg:grid-cols-12">
        <h2 id="faq" className="text-28 font-semibold lg:col-span-4">
          Questions
        </h2>
        <div className="divide-y divide-hairline border-y border-hairline lg:col-span-8">
          {faq(currency).map((item) => (
            <details key={item.question} className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-16 font-medium [&::-webkit-details-marker]:hidden">
                {item.question}
                <span
                  aria-hidden
                  className="relative size-4 shrink-0 text-muted before:absolute before:top-1/2 before:left-0 before:h-px before:w-4 before:bg-current after:absolute after:top-0 after:left-1/2 after:h-4 after:w-px after:bg-current after:transition-transform after:duration-200 after:ease-site group-open:after:scale-y-0"
                />
              </summary>
              <div className="max-w-2xl pb-6 text-14 text-muted">{item.answer}</div>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
