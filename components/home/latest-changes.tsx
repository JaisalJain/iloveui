import { ArrowRight } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import type { ChangelogEntry } from "@/lib/changelog";
import { SectionHeading } from "./section-heading";

const DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

/** The three newest changelog entries, each linking to its place on /changelog. */
export function LatestChanges({ entries }: { entries: ChangelogEntry[] }) {
  return (
    <section aria-labelledby="home-changelog" className="border-t border-hairline">
      <div className="page-frame grid gap-12 pt-24 sm:pt-32 lg:grid-cols-12 lg:gap-6">
        <div className="lg:col-span-4">
          <SectionHeading id="home-changelog" index="05" eyebrow="Changelog" title="Latest changes.">
            New designs and site features, dated and listed as they ship.
          </SectionHeading>
          <Link
            href="/changelog"
            className="mt-8 inline-flex h-10 items-center gap-2 rounded-control text-14 font-medium text-fg underline decoration-control underline-offset-4 transition-colors hover:decoration-fg"
          >
            Full changelog
            <ArrowRight size={16} strokeWidth={1.5} aria-hidden />
          </Link>
        </div>
        {entries.length > 0 ? (
          <ol className="lg:col-span-8 lg:col-start-5">
            {entries.map((entry) => (
              <li key={entry.slug} className="border-t border-hairline last:border-b">
                <Link
                  href={`/changelog#${entry.slug}` as Route}
                  prefetch={false}
                  className="group grid gap-2 rounded-control py-6 transition-colors duration-160 hover:bg-raised sm:-mx-3 sm:grid-cols-[9rem_1fr] sm:gap-6 sm:px-3"
                >
                  <time dateTime={entry.date} className="pt-0.5 font-mono text-12 text-muted tabular-nums">
                    {DATE_FORMAT.format(new Date(`${entry.date}T00:00:00Z`))}
                  </time>
                  <span>
                    <span className="block text-16 font-medium text-fg">{entry.title}</span>
                    <span className="mt-1 block max-w-xl text-14 text-muted">{entry.summary}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-14 text-muted lg:col-span-8 lg:col-start-5">
            No entries yet. The first one lands with the next release.
          </p>
        )}
      </div>
    </section>
  );
}
