import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { collectionDesigns, collectionMeta, collectionPath } from "@/components/collections/collection-data";
import { DesignCard } from "@/components/designs/design-card";
import { COLLECTIONS } from "@/config/collections";
import { categoryName } from "@/lib/catalog";
import { toIndexEntry } from "@/lib/catalog-types";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

const description =
  "Curated sets of iloveui designs that belong in the same product: a SaaS landing page, an AI app and a dashboard.";

export const metadata: Metadata = {
  title: "Collections",
  description,
  alternates: { canonical: "/collections" },
  openGraph: { title: `Collections · ${site.name}`, description, url: "/collections" },
};

/** Cards shown per set on this page; the set's own page shows them all. */
const PREVIEW_COUNT = 3;

export default function CollectionsPage() {
  return (
    <div className="page-frame pt-16 pb-8 sm:pt-24">
      <header className="max-w-3xl">
        <p className="label-mono text-muted">Collections</p>
        <h1 className="mt-4 text-40 font-semibold sm:text-64">
          Designs that ship <em className="font-serif font-normal tracking-normal italic">together.</em>
        </h1>
        <p className="mt-6 max-w-2xl text-16 text-muted sm:text-20">
          Three sets, each picked for one kind of product. Start from the set closest to what you are building, then
          re-theme it once in the Theme Lab so every piece matches.
        </p>
      </header>

      <ol className="mt-16 sm:mt-24">
        {COLLECTIONS.map((collection, index) => {
          const designs = collectionDesigns(collection);
          const preview = designs.slice(0, PREVIEW_COUNT);
          const href = collectionPath(collection.slug);
          return (
            <li
              key={collection.slug}
              className="grid gap-8 border-t border-hairline py-12 sm:py-16 lg:grid-cols-12 lg:gap-6"
            >
              <div className="flex flex-col items-start lg:col-span-4 lg:pr-8">
                <span aria-hidden className="font-mono text-14 text-muted tabular-nums">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h2 id={`collection-${collection.slug}`} className="mt-3 text-28 font-semibold sm:text-40">
                  <Link href={href} className="rounded-control hover:underline hover:decoration-control">
                    {collection.title}
                  </Link>
                </h2>
                <p className="mt-4 max-w-md text-16 text-muted">{collection.description}</p>
                <p className="mt-4 font-mono text-12 text-muted tabular-nums">{collectionMeta(designs)}</p>
                <Link
                  href={href}
                  className="group mt-6 inline-flex min-h-10 items-center gap-2 rounded-control text-14 font-medium text-fg pointer-fine:min-h-6"
                >
                  Open the {collection.title} set
                  <ArrowRight
                    size={16}
                    strokeWidth={1.5}
                    aria-hidden
                    className="transition-transform duration-200 ease-site group-hover:translate-x-0.5"
                  />
                </Link>
              </div>
              <div className="lg:col-span-8">
                <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-3">
                  {preview.map((design, position) => (
                    <li key={design.slug} className={cn(position === PREVIEW_COUNT - 1 && "sm:max-xl:hidden")}>
                      <DesignCard design={toIndexEntry(design)} categoryLabel={categoryName(design.category)} />
                    </li>
                  ))}
                </ul>
                {designs.length > PREVIEW_COUNT ? (
                  <p className="mt-4 text-14 text-muted">
                    <Link href={href} className="underline decoration-control underline-offset-4 hover:decoration-fg">
                      See all {designs.length} designs in this set
                    </Link>
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
