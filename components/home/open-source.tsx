import Link from "next/link";
import { buttonClasses } from "@/components/ui/button-classes";
import { site } from "@/lib/site";
import { SectionHeading } from "./section-heading";

// Takes the pricing teaser's place while monetization is off: what the repository holds and how to run it.
export function OpenSource({ total }: { total: number }) {
  const rows = [
    {
      name: "Designs",
      body: `${total} components in React and plain HTML. Use them in personal and commercial work, no account needed.`,
      proof: "MIT",
    },
    {
      name: "Site",
      body: "Next.js on Cloudflare Workers: Theme Lab, the preview stage, search and the shadcn registry endpoint.",
      proof: "D1 + R2",
    },
    {
      name: "Gates",
      body: "Typecheck, lint, unit tests, Playwright, and axe on every design at three widths in light and dark.",
      proof: "pnpm gates",
    },
  ];
  return (
    <section aria-labelledby="home-source" className="border-t border-hairline">
      <div className="page-frame grid gap-12 py-24 sm:py-32 lg:grid-cols-12 lg:gap-6">
        <div className="min-w-0 lg:col-span-4">
          <SectionHeading id="home-source" index="04" eyebrow="Open source" title="Read it, fork it, ship it.">
            The designs, the site that shows them and the checks that keep them honest live in one repository.
          </SectionHeading>
          <p className="mt-6 rounded-control border border-hairline bg-surface px-3 py-2 font-mono text-12 [overflow-wrap:anywhere] text-fg">
            <span aria-hidden className="mr-2 text-muted select-none">
              $
            </span>
            git clone {site.repository}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={site.repository} className={buttonClasses({ variant: "primary", size: "md" })}>
              View on GitHub
            </a>
            <Link href="/docs" className={buttonClasses({ variant: "outline", size: "md" })}>
              Read the docs
            </Link>
          </div>
        </div>
        <ul className="lg:col-span-8 lg:col-start-5">
          {rows.map((row) => (
            <li
              key={row.name}
              className="grid grid-cols-[1fr_auto] items-baseline gap-x-6 gap-y-2 border-t border-hairline px-4 py-6 last:border-b sm:grid-cols-[8rem_1fr_auto] sm:px-6 sm:py-8"
            >
              <h3 className="text-20 font-semibold">{row.name}</h3>
              <p className="order-3 col-span-2 max-w-md text-14 text-muted sm:order-none sm:col-span-1">{row.body}</p>
              <p className="text-right font-mono text-14 whitespace-nowrap text-fg">{row.proof}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
