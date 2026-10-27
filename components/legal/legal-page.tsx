import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

export type LegalSection = {
  /** Anchor id, also used by the table of contents. */
  id: string;
  title: string;
  content: ReactNode;
};

export type LegalPageProps = {
  eyebrow: string;
  /** The h1. Pass at most one <Emphasis> inside it. */
  title: ReactNode;
  /** One or two sentences under the title. */
  intro: ReactNode;
  /** "The short version": three to five plain-language points that the sections below spell out. */
  summary: ReactNode[];
  /** ISO date of the last change to this page. */
  updated: string;
  sections: LegalSection[];
  /** Other pages a reader of this one usually needs next. */
  related: { href: Route; label: string; description: string }[];
};

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const pad = (index: number) => String(index + 1).padStart(2, "0");

/** The one phrase in a headline set in Instrument Serif italic. */
export function Emphasis({ children }: { children: ReactNode }) {
  return <em className="font-serif font-normal tracking-normal italic">{children}</em>;
}

// Prose rhythm for section bodies: 16px text at 1.55, 16px between blocks, lists with hairline dashes, links
// underlined in the muted color until hovered.
const PROSE =
  "max-w-[65ch] text-16 text-fg/90 " +
  "[&>*+*]:mt-4 [&_strong]:font-medium [&_strong]:text-fg " +
  "[&_a]:text-fg [&_a]:underline [&_a]:decoration-control [&_a]:underline-offset-4 [&_a]:transition-colors " +
  "[&_a:hover]:decoration-fg " +
  "[&_ul]:space-y-2 [&_ul>li]:relative [&_ul>li]:pl-5 " +
  "[&_ul>li]:before:absolute [&_ul>li]:before:top-[0.78em] [&_ul>li]:before:left-0 [&_ul>li]:before:h-px " +
  "[&_ul>li]:before:w-2.5 [&_ul>li]:before:bg-control " +
  "[&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-5 [&_ol>li]:pl-1 [&_ol>li]:marker:font-mono " +
  "[&_ol>li]:marker:text-14 [&_ol>li]:marker:text-muted " +
  "[&_code]:rounded-[4px] [&_code]:bg-raised [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-14";

/** Section body text, also usable outside LegalPage (the contact page). */
export function Prose({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={className ? `${PROSE} ${className}` : PROSE}>{children}</div>;
}

/**
 * The reading layout shared by /license, /terms, /privacy and /refunds: a title block with the last-updated date,
 * a plain-language summary, a sticky table of contents beside a 65ch reading column, and links to related pages.
 * Server-rendered with no client JavaScript: the table of contents is plain anchor links.
 */
export function LegalPage({ eyebrow, title, intro, summary, updated, sections, related }: LegalPageProps) {
  return (
    <article className="page-frame pt-16 pb-8 sm:pt-24">
      <header className="max-w-3xl">
        <p className="label-mono text-muted">{eyebrow}</p>
        <h1 className="mt-4 text-40 font-semibold sm:text-64">{title}</h1>
        <div className="mt-6 max-w-2xl text-16 text-muted sm:text-20">{intro}</div>
        <p className="mt-6 font-mono text-12 text-muted">
          Last updated <time dateTime={updated}>{dateFormat.format(new Date(updated))}</time>
        </p>
      </header>

      <div className="mt-12 grid gap-12 sm:mt-16 lg:grid-cols-12 lg:gap-8">
        <aside className="lg:col-span-3">
          <nav aria-label="On this page" className="lg:sticky lg:top-24">
            <p className="label-mono text-muted">On this page</p>
            <ol className="mt-3 grid gap-x-6 border-l border-hairline sm:grid-cols-2 lg:grid-cols-1">
              {sections.map((section, index) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="-ml-px flex min-h-10 items-baseline gap-3 border-l border-transparent py-2 pl-4 text-14 text-muted transition-colors duration-160 ease-site hover:border-fg hover:text-fg pointer-fine:min-h-8 pointer-fine:py-1.5"
                  >
                    <span className="font-mono text-12 tabular-nums">{pad(index)}</span>
                    <span>{section.title}</span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </aside>

        <div className="min-w-0 lg:col-span-8 lg:col-start-5">
          <section
            aria-labelledby="short-version"
            className="max-w-[65ch] rounded-card border border-hairline bg-surface p-6 shadow-sm sm:p-8"
          >
            <h2 id="short-version" className="label-mono text-muted">
              The short version
            </h2>
            <ul className="mt-4 space-y-3">
              {summary.map((point, index) => (
                <li key={index} className="flex gap-3 text-16">
                  <span aria-hidden className="mt-[0.7em] h-px w-3 shrink-0 bg-accent" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </section>

          <div className="mt-16 space-y-16">
            {sections.map((section, index) => (
              <section
                key={section.id}
                id={section.id}
                aria-labelledby={`${section.id}-title`}
                className="scroll-mt-24"
              >
                <h2 id={`${section.id}-title`} className="flex items-baseline gap-4 text-20 font-semibold sm:text-28">
                  <span aria-hidden className="font-mono text-14 font-normal tracking-normal text-muted tabular-nums">
                    {pad(index)}
                  </span>
                  <span>{section.title}</span>
                </h2>
                <Prose className="mt-6">{section.content}</Prose>
              </section>
            ))}
          </div>

          <RelatedPages links={related} />
        </div>
      </div>
    </article>
  );
}

/**
 * Facts that would be a table on a wide screen (what we store, which cookies exist), as a description list that
 * reads the same at 375px: the term, what it is for, and one mono line of metadata such as how long it is kept.
 */
export function FactList({ items }: { items: { term: string; detail: ReactNode; meta?: ReactNode }[] }) {
  return (
    <dl className="mt-6! divide-y divide-hairline rounded-card border border-hairline bg-surface shadow-sm">
      {items.map((item) => (
        <div key={item.term} className="grid gap-1 px-4 py-4 sm:grid-cols-[12rem_minmax(0,1fr)] sm:gap-6 sm:px-6">
          <dt className="text-14 font-medium text-fg">{item.term}</dt>
          <dd className="text-14 text-muted">
            <span className="block">{item.detail}</span>
            {item.meta ? <span className="mt-2 block font-mono text-12 text-muted">{item.meta}</span> : null}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function RelatedPages({ links }: { links: LegalPageProps["related"] }) {
  return (
    <nav aria-label="Related pages" className="mt-24 border-t border-hairline pt-8">
      <p className="label-mono text-muted">Related</p>
      <ul className="mt-4 grid gap-3 sm:grid-cols-3">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="flex h-full flex-col rounded-card border border-hairline bg-surface p-4 shadow-sm transition-[translate,box-shadow] duration-450 ease-spring hover:-translate-y-0.5 hover:shadow-lg"
            >
              <span className="text-14 font-medium text-fg">{link.label}</span>
              <span className="mt-1 text-14 text-muted">{link.description}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
