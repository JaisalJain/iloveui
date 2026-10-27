import Link from "next/link";
import type { Route } from "next";
import { useId, type ReactNode } from "react";
import { Segment, Segments } from "@/components/ui/segments";
import { browsePath, type Format, type Tier } from "@/lib/browse";
import { clsx } from "clsx";

export type Option = { slug: string; name: string };

type CategoryNavProps = {
  category: string | null;
  categories: readonly Option[];
  totalCount: number;
  categoryCounts: Readonly<Record<string, number>>;
  /** Query string carried by category links, so filters survive a change of category. */
  query: string;
  /** Called after following a category link (closes the mobile sheet). */
  onNavigate?: () => void;
  /** The desktop sidebar holds only the categories (the other filters sit in the toolbar); the mobile sheet holds
   * every filter first and the long category list last. */
  variant: "sidebar" | "sheet";
};

// Counts are hidden until the island has applied the URL's filters, so unfiltered numbers never flash.
export const COUNT = "font-mono text-12 tabular-nums [[data-browse-pending]_&]:invisible";

export function Section({ title, children, hint }: { title: string; children: ReactNode; hint?: ReactNode }) {
  const id = useId();
  return (
    <section
      aria-labelledby={id}
      className="flex flex-col gap-3 border-t border-hairline pt-6 first:border-t-0 first:pt-0"
    >
      <h2 id={id} className="label-mono text-muted">
        {title}
      </h2>
      {children}
      {hint ? <p className="text-12 text-muted">{hint}</p> : null}
    </section>
  );
}

const segmentItem = clsx(
  "inline-flex h-8 flex-1 items-center justify-center rounded-[4px] px-3 text-14 text-muted pointer-coarse:h-10",
  "transition-[background-color,color,box-shadow] duration-160 ease-site hover:text-fg",
  "data-[state=on]:bg-surface data-[state=on]:text-fg data-[state=on]:shadow-sm",
);

export function Segmented<T extends string>({
  label,
  value,
  options,
  onValueChange,
  className,
  description,
}: {
  className?: string;
  /** Read to screen readers with the group, for controls whose helper text is shown as a tooltip. */
  description?: string;
  label: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onValueChange: (value: T) => void;
}) {
  const descriptionId = useId();
  return (
    <Segments
      aria-label={label}
      aria-describedby={description ? descriptionId : undefined}
      value={value}
      onValueChange={(next) => {
        const option = options.find((candidate) => candidate.value === next);
        if (option) onValueChange(option.value);
      }}
      className={clsx("flex rounded-control border border-hairline bg-raised p-0.5", className)}
    >
      {options.map((option) => (
        <Segment key={option.value} value={option.value} className={segmentItem}>
          {option.label}
        </Segment>
      ))}
      {description ? (
        <span id={descriptionId} hidden>
          {description}
        </span>
      ) : null}
    </Segments>
  );
}

export const FORMAT_HINT = "Every design ships in both. This picks the tab you see first.";

export const TIER_OPTIONS: readonly { value: Tier; label: string }[] = [
  { value: "all", label: "All" },
  { value: "free", label: "Free" },
  { value: "pro", label: "Pro" },
];

export const FORMAT_OPTIONS: readonly { value: Format; label: string }[] = [
  { value: "react", label: "React" },
  { value: "html", label: "HTML" },
];

/** The category list: the desktop sidebar, and the last section of the mobile filter sheet. */
export function CategoryNav({
  category,
  categories,
  totalCount,
  categoryCounts,
  query,
  onNavigate,
  variant,
}: CategoryNavProps) {
  const rows = [{ slug: null, name: "All designs" }, ...categories];
  return (
    <nav
      aria-label="Categories"
      className={clsx("flex flex-col", variant === "sheet" && "border-t border-hairline pt-6")}
    >
      <ul className="-mx-2 flex flex-col">
        {rows.map((row) => {
          const count = row.slug === null ? totalCount : (categoryCounts[row.slug] ?? 0);
          const current = row.slug === category;
          return (
            <li key={row.slug ?? "all"}>
              <Link
                href={`${browsePath(row.slug)}${query}` as Route}
                aria-current={current ? "page" : undefined}
                onClick={onNavigate}
                className={clsx(
                  "relative flex min-h-8 items-center justify-between gap-3 rounded-control px-2 py-1.5 text-14 pointer-coarse:min-h-10",
                  "transition-colors duration-160 ease-site hover:bg-raised",
                  current ? "bg-raised font-medium text-fg" : count > 0 ? "text-fg" : "text-muted",
                )}
              >
                {current ? (
                  <span aria-hidden className="absolute inset-y-1.5 -left-px w-0.5 rounded-full bg-accent" />
                ) : null}
                <span className="min-w-0">{row.name}</span>
                <span className={clsx(COUNT, current ? "text-fg" : "text-muted")}>{count}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
