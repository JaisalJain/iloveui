import type { DesignState } from "@/registry/definitions";
import HesperStorefrontNav from "./component";

// A full-width storefront header over the top of a product page; the Fragrance menu starts open.
export default function Preview({ state }: { state: DesignState }) {
  return (
    <div key={state} className="min-h-dvh bg-(--iu-background) font-(family-name:--iu-font) text-(--iu-foreground)">
      <HesperStorefrontNav defaultOpenMenu="fragrance" />
      <main className="mx-auto max-w-[1320px] px-5 pt-16 pb-24 sm:px-10">
        <p className="text-[11px] font-medium tracking-[0.2em] text-(--iu-muted) uppercase">
          Fragrance · Eaux de parfum
        </p>
        <h1 className="mt-6 max-w-[12ch] font-serif text-[clamp(3rem,2rem+4vw,6rem)] leading-[0.95] font-normal text-balance">
          Vetiver Nocturne
        </h1>
        <p className="mt-6 max-w-[34rem] text-[15px] leading-relaxed text-pretty text-(--iu-muted)">
          Smoked vetiver from Java, black pepper and a cold iris heart, macerated for eight weeks in our Grasse cellar
          before it is poured by hand.
        </p>
        <p className="mt-10 font-serif text-3xl tabular-nums">€215</p>
        <dl className="mt-16 grid gap-px border-y border-(--iu-border) sm:grid-cols-3">
          {[
            ["Top", "Black pepper, bergamot"],
            ["Heart", "Iris, clary sage"],
            ["Base", "Java vetiver, birch tar"],
          ].map(([label, notes]) => (
            <div key={label} className="py-6 sm:pr-8">
              <dt className="text-[11px] font-medium tracking-[0.2em] text-(--iu-muted) uppercase">{label} notes</dt>
              <dd className="mt-3 font-serif text-2xl">{notes}</dd>
            </div>
          ))}
        </dl>
      </main>
    </div>
  );
}
