import type { DesignState } from "@/registry/definitions";
import PlumblineMegaHeader from "./component";

const ALERTS = [
  { query: "growth.daily_cohorts", owner: "Inès Moreau", cost: "$412.80", budget: "88%" },
  { query: "finance.revenue_rollup", owner: "Dev Malhotra", cost: "$267.15", budget: "61%" },
  { query: "ml.feature_backfill", owner: "Sora Lindgren", cost: "$1,094.32", budget: "97%" },
  { query: "ops.carrier_sla", owner: "Kwame Asante", cost: "$58.40", budget: "23%" },
];

// A full-width header over the top of a page; the Product menu starts open so its panel shows in the preview.
export default function Preview({ state }: { state: DesignState }) {
  return (
    <div key={state} className="min-h-dvh bg-(--iu-background) font-(family-name:--iu-font) text-(--iu-foreground)">
      <PlumblineMegaHeader defaultOpenMenu="product" />
      <main className="mx-auto max-w-[1200px] px-6 pt-16 pb-24 sm:px-10">
        <p className="flex justify-between border-b border-(--iu-border) pb-3 text-[11px] font-medium tracking-[0.08em] text-(--iu-muted) uppercase">
          <span>Product / Alerts</span>
          <span className="tabular-nums">03 / Observe</span>
        </p>
        <h1 className="mt-12 max-w-[14ch] text-[clamp(2.5rem,1.6rem+3.6vw,4.5rem)] leading-[0.98] font-semibold tracking-[-0.035em] text-balance">
          Page the owner before the bill lands.
        </h1>
        <p className="mt-6 max-w-[36rem] text-base leading-relaxed text-pretty text-(--iu-muted) sm:text-lg">
          Alerts watch every warehouse query against its team budget and message the person who wrote it, with the plan,
          the cost and a one-click pause.
        </p>
        <table className="mt-16 w-full table-fixed border-t border-(--iu-border) text-left text-sm">
          <caption className="sr-only">Queries closest to their budget today</caption>
          <thead>
            <tr className="text-[11px] tracking-[0.08em] text-(--iu-muted) uppercase">
              <th scope="col" className="w-1/2 py-3 font-medium sm:w-2/5">
                Query
              </th>
              <th scope="col" className="hidden py-3 font-medium sm:table-cell">
                Owner
              </th>
              <th scope="col" className="py-3 text-right font-medium">
                Today
              </th>
              <th scope="col" className="py-3 text-right font-medium">
                Budget
              </th>
            </tr>
          </thead>
          <tbody>
            {ALERTS.map((alert) => (
              <tr key={alert.query} className="border-t border-(--iu-border)">
                <td className="truncate py-3 font-mono text-[13px]">{alert.query}</td>
                <td className="hidden py-3 sm:table-cell">{alert.owner}</td>
                <td className="py-3 text-right font-mono text-[13px] tabular-nums">{alert.cost}</td>
                <td className="py-3 text-right font-mono text-[13px] tabular-nums">{alert.budget}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </div>
  );
}
