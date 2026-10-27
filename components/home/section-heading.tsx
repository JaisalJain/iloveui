import type { ReactNode } from "react";

/** The home page's section opener: a numbered mono eyebrow, a headline and one short lead. */
export function SectionHeading({
  id,
  index,
  eyebrow,
  title,
  children,
}: {
  id: string;
  index: string;
  eyebrow: string;
  title: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div>
      <p className="label-mono text-muted">
        <span className="text-fg">{index}</span>
        <span aria-hidden className="mx-2">
          /
        </span>
        {eyebrow}
      </p>
      <h2 id={id} className="mt-4 text-28 font-semibold sm:text-40">
        {title}
      </h2>
      {children ? <p className="mt-4 max-w-md text-16 text-muted">{children}</p> : null}
    </div>
  );
}
