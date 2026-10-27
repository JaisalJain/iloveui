import type { ReactNode } from "react";

const UNLOCKS = [
  { label: "License", detail: "Pro or Team access, invoices and refunds" },
  { label: "CLI token", detail: "npx shadcn@latest add @iloveui/<slug>" },
  { label: "Bookmarks", detail: "The designs you saved, on every device" },
] as const;

/**
 * The frame around Clerk's sign-in and sign-up components: an editorial column on the left, the form in a card on
 * the right. Clerk renders only after its script loads, so a skeleton of the same size holds the space until then.
 */
export function AuthPage({
  eyebrow,
  title,
  lead,
  fields,
  children,
}: {
  eyebrow: string;
  /** Form fields on Clerk's first step: sign-in asks for an email, sign-up for an email and a password. */
  fields: 1 | 2;
  title: ReactNode;
  lead: string;
  children: ReactNode;
}) {
  return (
    <section className="page-frame grid gap-12 pt-12 pb-8 sm:pt-20 lg:grid-cols-12 lg:gap-6 lg:pt-24">
      <div className="lg:col-span-5">
        <p className="label-mono text-muted">{eyebrow}</p>
        <h1 className="mt-4 text-40 font-semibold text-balance sm:text-64">{title}</h1>
        <p className="mt-6 max-w-md text-16 text-pretty text-muted">{lead}</p>
        <dl className="mt-10 hidden max-w-md border-t border-hairline sm:block">
          {UNLOCKS.map((item) => (
            <div key={item.label} className="grid grid-cols-[7rem_1fr] gap-4 border-b border-hairline py-3 text-14">
              <dt className="pt-0.5 label-mono text-muted">{item.label}</dt>
              <dd className={item.label === "CLI token" ? "font-mono text-12 leading-5 text-fg" : "text-fg"}>
                {item.detail}
              </dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="lg:col-span-6 lg:col-start-7">
        <div className="group grid w-full max-w-[28rem] rounded-card border border-hairline bg-surface p-6 shadow-sm sm:p-8">
          <div className="col-start-1 row-start-1 min-w-0">{children}</div>
          <AuthFormSkeleton fields={fields} />
        </div>
      </div>
    </section>
  );
}

/** Mirrors Clerk's first step (provider button, divider, fields, continue, footer) at Clerk's measured sizes and
 * hides itself as soon as Clerk mounts its card in the same grid cell, so the swap does not move the page. */
function AuthFormSkeleton({ fields }: { fields: 1 | 2 }) {
  return (
    <div aria-hidden className="col-start-1 row-start-1 flex flex-col group-has-[.cl-cardBox]:hidden">
      <div className="h-[35px] rounded-control border border-hairline" />
      <div className="mt-6 flex h-5 items-center gap-4">
        <div className="h-px flex-1 bg-hairline" />
        <div className="h-3 w-4 rounded-control bg-raised" />
        <div className="h-px flex-1 bg-hairline" />
      </div>
      {Array.from({ length: fields }, (_, index) => (
        <div key={index} className="mt-6">
          <div className="h-[19px] w-24 rounded-control bg-raised" />
          <div className="mt-2 h-9 rounded-control border border-control/40" />
        </div>
      ))}
      <div className="mt-8 h-[33px] rounded-control bg-raised" />
      <div className="mx-auto mt-8 h-5 w-48 rounded-control bg-raised" />
      <div className="mt-8 flex h-[17px] justify-between">
        <div className="w-28 rounded-control bg-raised" />
        <div className="w-32 rounded-control bg-raised" />
      </div>
      <div className="h-[25px]" />
    </div>
  );
}
