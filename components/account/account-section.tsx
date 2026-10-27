import type { ReactNode } from "react";

/** One settings group: a label column on the left, the panel on the right, hairlines between groups. */
export function AccountSection({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description: ReactNode;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className="grid scroll-mt-24 gap-6 border-t border-hairline py-10 lg:grid-cols-12 lg:py-12"
    >
      <div className="lg:col-span-4 lg:pr-8">
        <h2 id={`${id}-heading`} className="text-20 font-semibold text-balance">
          {title}
        </h2>
        <p className="mt-2 max-w-sm text-14 text-pretty text-muted">{description}</p>
      </div>
      <div className="min-w-0 lg:col-span-8">{children}</div>
    </section>
  );
}

/** The card every panel sits in. */
export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-card border border-hairline bg-surface shadow-sm ${className}`}>{children}</div>;
}

/** A label/value row inside a panel. */
export function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 px-5 py-3 sm:grid-cols-[10rem_1fr] sm:gap-4 sm:px-6">
      <dt className="pt-0.5 label-mono text-muted">{label}</dt>
      <dd className="min-w-0 text-14 text-fg tabular-nums">{children}</dd>
    </div>
  );
}
