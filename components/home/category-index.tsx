import { clsx } from "clsx";
import type { Route } from "next";
import Link from "next/link";
import { SectionHeading } from "./section-heading";

type CategoryRow = { slug: string; name: string; count: number; target: number };

/** Every category with its live count against its planned size; empty categories say so. */
export function CategoryIndex({
  categories,
  total,
  target,
}: {
  categories: CategoryRow[];
  total: number;
  target: number;
}) {
  return (
    <section
      aria-labelledby="home-categories"
      className="page-frame grid gap-12 py-24 sm:py-32 lg:grid-cols-12 lg:gap-6"
    >
      <div className="lg:col-span-4">
        <div className="lg:sticky lg:top-28">
          <SectionHeading id="home-categories" index="01" eyebrow="Catalog" title="Every category, built to a brief.">
            Live counts against each category&rsquo;s planned size. {total} of {target} designs are in; Pro includes
            every one that follows.
          </SectionHeading>
          <Link
            href="/designs"
            className="mt-8 inline-flex h-10 items-center gap-2 rounded-control text-14 font-medium text-fg underline decoration-control underline-offset-4 transition-colors hover:decoration-fg"
          >
            Browse all {total} designs
          </Link>
        </div>
      </div>
      <ol className="grid content-start gap-x-6 sm:grid-cols-2 lg:col-span-8">
        {categories.map((category, index) => {
          const empty = category.count === 0;
          const share = Math.min(1, category.count / category.target);
          return (
            <li key={category.slug} className="border-t border-hairline">
              <Link
                href={`/designs/${category.slug}` as Route}
                prefetch={false}
                className="group grid grid-cols-[2rem_1fr_auto] items-baseline gap-x-2 gap-y-2 rounded-control py-3 transition-colors duration-160 hover:bg-raised sm:-mx-2 sm:px-2"
              >
                <span className="font-mono text-12 text-muted tabular-nums">{String(index + 1).padStart(2, "0")}</span>
                <span className={clsx("text-14", empty ? "text-muted" : "font-medium text-fg")}>{category.name}</span>
                <span className="font-mono text-12 whitespace-nowrap tabular-nums">
                  {empty ? (
                    <span className="text-muted">planned {category.target}</span>
                  ) : (
                    <>
                      <span className="text-fg">{category.count}</span>
                      <span className="text-muted"> / {category.target}</span>
                    </>
                  )}
                </span>
                <span aria-hidden className="col-start-2 col-end-4 h-0.5 overflow-hidden rounded-full bg-hairline">
                  <span className="block h-full origin-left bg-fg" style={{ transform: `scaleX(${share})` }} />
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
