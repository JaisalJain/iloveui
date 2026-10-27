import type { MDXComponents, MDXContent } from "mdx/types";
import type { Metadata } from "next";
import type { ComponentProps } from "react";
import { getChangelogEntries } from "@/lib/changelog";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Changelog",
  description: "Every change to iloveui, newest first: new designs, site features and fixes, each with its date.",
  alternates: { canonical: "/changelog" },
};

// Entry bodies, keyed by file path; lib/changelog.ts reads only their metadata.
const BODIES = import.meta.glob<MDXContent>("/content/changelog/*.mdx", { eager: true, import: "default" });

function bodyOf(slug: string): MDXContent {
  const body = BODIES[`/content/changelog/${slug}.mdx`];
  if (!body) throw new Error(`content/changelog/${slug}.mdx has no body`);
  return body;
}

/** Headings inside an entry get ids prefixed with the entry's slug, so repeated section names stay unique. */
function entryComponents(slug: string): MDXComponents {
  return {
    h2: ({ id, className, ...props }: ComponentProps<"h2">) => (
      <h3 id={id ? `${slug}-${id}` : undefined} className={cn("mt-10 text-20 font-semibold", className)} {...props} />
    ),
    h3: ({ id, className, ...props }: ComponentProps<"h3">) => (
      <h3 id={id ? `${slug}-${id}` : undefined} className={cn("mt-10 text-20 font-semibold", className)} {...props} />
    ),
  };
}

const DISPLAY_DATE = new Intl.DateTimeFormat("en", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export default function ChangelogPage() {
  const entries = getChangelogEntries();
  return (
    <div className="page-frame pt-16 pb-24 sm:pt-24">
      <header className="max-w-3xl">
        <p className="label-mono text-muted">Changelog</p>
        <h1 className="mt-4 text-40 font-semibold sm:text-64">
          What changed, and <em className="font-serif font-normal italic">when</em>.
        </h1>
        <p className="mt-6 max-w-2xl text-16 text-muted sm:text-20">
          New designs, site features and fixes, newest first. Each entry is dated and complete.
        </p>
      </header>

      <ol className="mt-16 border-t border-hairline sm:mt-24" data-changelog>
        {entries.map((entry) => {
          const Body = bodyOf(entry.slug);
          return (
            <li key={entry.slug} className="border-b border-hairline py-12 sm:py-16" data-changelog-entry={entry.slug}>
              <article aria-labelledby={entry.slug} className="lg:grid lg:grid-cols-12 lg:gap-6">
                <div className="lg:col-span-3">
                  <time
                    dateTime={entry.date}
                    className="font-mono text-14 text-muted tabular-nums lg:sticky lg:top-24 lg:block"
                  >
                    {entry.date}
                    <span className="sr-only"> ({DISPLAY_DATE.format(new Date(`${entry.date}T00:00:00Z`))})</span>
                  </time>
                </div>
                <div className="mt-4 max-w-[46rem] min-w-0 lg:col-span-8 lg:mt-0">
                  <h2 id={entry.slug} className="scroll-mt-24 text-28 font-semibold">
                    <a
                      href={`#${entry.slug}`}
                      className="rounded-control transition-colors duration-160 ease-site hover:text-muted"
                    >
                      {entry.title}
                    </a>
                  </h2>
                  <p className="mt-4 text-16 text-muted sm:text-20">{entry.summary}</p>
                  <div className="mt-2">
                    <Body components={entryComponents(entry.slug)} />
                  </div>
                </div>
              </article>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
