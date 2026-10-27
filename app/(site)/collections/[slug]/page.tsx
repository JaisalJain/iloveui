import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  collectionDesigns,
  collectionMeta,
  collectionParams,
  collectionPath,
} from "@/components/collections/collection-data";
import { DesignCard } from "@/components/designs/design-card";
import { buttonClasses } from "@/components/ui/button-classes";
import { COLLECTIONS, getCollection, type Collection } from "@/config/collections";
import { categoryName } from "@/lib/catalog";
import { toIndexEntry } from "@/lib/catalog-types";
import { site } from "@/lib/site";

export const dynamicParams = false;
export const generateStaticParams = collectionParams;

/** Below this many designs a set says plainly that it is still small. */
const SMALL_SET = 6;

function resolveCollection(slug: string): Collection {
  const collection = getCollection(slug);
  if (!collection) notFound();
  return collection;
}

export async function generateMetadata({ params }: PageProps<"/collections/[slug]">): Promise<Metadata> {
  const collection = resolveCollection((await params).slug);
  const title = `${collection.title} collection`;
  return {
    title,
    description: collection.description,
    alternates: { canonical: collectionPath(collection.slug) },
    openGraph: {
      title: `${title} · ${site.name}`,
      description: collection.description,
      url: collectionPath(collection.slug),
    },
  };
}

export default async function CollectionPage({ params }: PageProps<"/collections/[slug]">) {
  const collection = resolveCollection((await params).slug);
  const designs = collectionDesigns(collection);
  const others = COLLECTIONS.filter((other) => other.slug !== collection.slug);

  return (
    <div className="page-frame pt-6 pb-8 sm:pt-10">
      <nav aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-14 text-muted">
          <li>
            <Link href="/collections" className="rounded-[4px] hover:text-fg">
              Collections
            </Link>
          </li>
          <li aria-hidden className="text-control">
            /
          </li>
          <li>
            <span aria-current="page" className="text-fg">
              {collection.title}
            </span>
          </li>
        </ol>
      </nav>

      <header className="mt-8 grid gap-6 border-b border-hairline pb-10 sm:mt-12 sm:pb-12 lg:grid-cols-12 lg:items-end lg:gap-8">
        <div className="lg:col-span-8">
          <p className="label-mono text-muted">Collection</p>
          <h1 className="mt-4 text-40 font-semibold sm:text-64">{collection.title}</h1>
          <p className="mt-6 max-w-2xl text-16 text-muted sm:text-20">{collection.description}</p>
        </div>
        <p className="font-mono text-12 text-muted tabular-nums lg:col-span-4 lg:text-right">
          {collectionMeta(designs)}
        </p>
      </header>

      {designs.length > 0 ? <h2 className="sr-only">Designs in this set</h2> : null}
      {designs.length > 0 ? (
        <ul className="mt-10 grid grid-cols-1 gap-4 sm:mt-12 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {designs.map((design, index) => (
            <li key={design.slug}>
              <DesignCard
                design={toIndexEntry(design)}
                categoryLabel={categoryName(design.category)}
                eager={index < 3}
              />
            </li>
          ))}
        </ul>
      ) : null}

      {designs.length < SMALL_SET ? (
        <section
          aria-labelledby="small-set"
          className="mt-10 flex flex-col items-start gap-4 rounded-card border border-hairline bg-surface p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-8"
        >
          <div className="max-w-xl">
            <h2 id="small-set" className="text-16 font-medium">
              {designs.length === 0 ? "This set is empty for now." : "A small set, for now."}
            </h2>
            <p className="mt-1 text-14 text-muted">
              {designs.length === 0
                ? "No design in the catalog fits it yet. New designs join as they ship."
                : `It holds ${designs.length} ${designs.length === 1 ? "design" : "designs"} today and grows as new designs ship. Meanwhile, the full catalog has more to combine with ${designs.length === 1 ? "it" : "them"}.`}
            </p>
          </div>
          <Link href="/designs" className={buttonClasses({ variant: "outline", size: "md" })}>
            Browse all designs
          </Link>
        </section>
      ) : null}

      <nav aria-labelledby="other-collections" className="mt-24 border-t border-hairline pt-8">
        <h2 id="other-collections" className="label-mono text-muted">
          Other collections
        </h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {others.map((other) => (
            <li key={other.slug}>
              <Link
                href={collectionPath(other.slug)}
                className="group flex h-full items-start justify-between gap-6 rounded-card border border-hairline bg-surface p-5 shadow-sm transition-[translate,box-shadow] duration-450 ease-spring hover:-translate-y-0.5 hover:shadow-lg"
              >
                <span>
                  <span className="block text-16 font-medium text-fg">{other.title}</span>
                  <span className="mt-1 block text-14 text-muted">{other.description}</span>
                </span>
                <ArrowRight size={16} strokeWidth={1.5} aria-hidden className="mt-1 shrink-0 text-muted" />
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
