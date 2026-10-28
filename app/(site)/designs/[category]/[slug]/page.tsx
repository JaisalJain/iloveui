import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { DesignCard } from "@/components/designs/design-card";
import { TierTag } from "@/components/designs/tier-tag";
import { CodePanel } from "@/components/design-page/code-panel";
import { AiPromptButton, BookmarkButton, DownloadButton, InstallBar } from "@/components/design-page/design-actions";
import { ProCodePanel } from "@/components/design-page/pro-code-panel";
import { categoryPath, DESIGNS_PATH } from "@/components/design-page/paths";
import { ReceiptBar } from "@/components/design-page/receipt-bar";
import { relatedDesigns } from "@/components/design-page/related";
import { PreviewStage } from "@/components/preview/preview-stage";
import { categoryName, designPath, getAllDesigns, getDesign, styleFamilyName } from "@/lib/catalog";
import { toIndexEntry, type CatalogDesign } from "@/lib/catalog-types";
import { absoluteUrl, site } from "@/lib/site";

export const dynamicParams = false;

// Both segments come from here: the parent [category] generates its params in a page, not a layout, so they are not
// passed down to this function.
export function generateStaticParams() {
  return getAllDesigns().map((design) => ({ category: design.category, slug: design.slug }));
}

/** The design at this URL, or a 404 when the slug is unknown or belongs to another category. */
function resolveDesign(category: string, slug: string): CatalogDesign {
  const design = getDesign(slug);
  if (!design || design.category !== category) notFound();
  return design;
}

export async function generateMetadata({ params }: PageProps<"/designs/[category]/[slug]">): Promise<Metadata> {
  const { category, slug } = await params;
  const design = resolveDesign(category, slug);
  return {
    title: design.name,
    description: design.description,
    alternates: { canonical: designPath(design) },
    openGraph: { title: `${design.name} · ${site.name}`, description: design.description, url: designPath(design) },
  };
}

const dateFormat = new Intl.DateTimeFormat("en", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" });

export default async function DesignPage({ params }: PageProps<"/designs/[category]/[slug]">) {
  const { category, slug } = await params;
  const design = resolveDesign(category, slug);
  const pro = design.tier === "pro";
  const related = relatedDesigns(design, getAllDesigns());
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareSourceCode",
    name: design.name,
    description: design.description,
    url: absoluteUrl(designPath(design)),
    programmingLanguage: ["TypeScript", "HTML"],
    runtimePlatform: "React 19, Tailwind CSS v4",
    version: design.version,
    dateCreated: design.createdAt,
    keywords: design.tags.join(", "),
    isAccessibleForFree: !pro,
    author: { "@type": "Organization", name: site.name, url: site.repository },
    codeRepository: site.repository,
  };

  return (
    <div className="page-frame pt-6 pb-8 sm:pt-10">
      <script
        type="application/ld+json"
        // Static catalog data serialized at build time; "<" is escaped so the JSON can never close the tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      <nav aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-14 text-muted">
          <li>
            <Link href={DESIGNS_PATH} className="rounded-[4px] hover:text-fg">
              Designs
            </Link>
          </li>
          <li aria-hidden className="text-control">
            /
          </li>
          <li>
            <Link href={categoryPath(design.category)} className="rounded-[4px] hover:text-fg">
              {categoryName(design.category)}
            </Link>
          </li>
          <li aria-hidden className="text-control">
            /
          </li>
          <li>
            <span aria-current="page" className="text-fg">
              {design.name}
            </span>
          </li>
        </ol>
      </nav>

      <header className="mt-8 grid grid-cols-1 gap-6 sm:mt-12 lg:grid-cols-12 lg:items-end lg:gap-8">
        <div className="lg:col-span-8">
          <div className="flex flex-wrap items-center gap-3">
            <TierTag tier={design.tier} />
            <span className="label-mono text-muted">{styleFamilyName(design.styleFamily)}</span>
          </div>
          <h1 className="mt-4 text-40 font-semibold text-fg sm:text-64">{design.name}</h1>
          <p className="mt-4 max-w-2xl text-16 text-muted sm:text-20">{design.description}</p>
        </div>
        <div className="flex flex-wrap items-start gap-2 lg:col-span-4 lg:justify-end">
          <DownloadButton slug={design.slug} name={design.name} pro={pro} />
          <BookmarkButton slug={design.slug} name={design.name} />
        </div>
      </header>

      <div className="mt-8 sm:mt-10">
        <ReceiptBar receipt={design.receipt} />
      </div>

      <div className="mt-8">
        <PreviewStage slug={design.slug} name={design.name} states={design.states} />
      </div>

      <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="min-w-0 lg:col-span-8">
          {pro || !design.codeUrl ? (
            <ProCodePanel slug={design.slug} files={design.files} />
          ) : (
            <CodePanel slug={design.slug} codeUrl={design.codeUrl} files={design.files} />
          )}
        </div>

        <aside aria-label="Install and details" className="flex flex-col gap-8 lg:col-span-4">
          <section aria-labelledby="install-heading">
            <h2 id="install-heading" className="label-mono text-muted">
              Install with the shadcn CLI
            </h2>
            <div className="mt-3">
              <InstallBar slug={design.slug} pro={pro} />
            </div>
          </section>

          <section aria-labelledby="prompt-heading">
            <h2 id="prompt-heading" className="label-mono text-muted">
              Hand it to your agent
            </h2>
            <p className="mt-2 text-14 text-muted">
              Component, props, tokens and integration steps in one prompt, with your Theme Lab tokens appended.
            </p>
            <div className="mt-3">
              <AiPromptButton slug={design.slug} codeUrl={pro ? null : design.codeUrl} />
            </div>
          </section>

          <section aria-labelledby="details-heading">
            <h2 id="details-heading" className="label-mono text-muted">
              Details
            </h2>
            <dl className="mt-3 divide-y divide-hairline border-y border-hairline text-14">
              <DetailRow term="Category">
                <Link href={categoryPath(design.category)} className="rounded-[4px] text-fg hover:underline">
                  {categoryName(design.category)}
                </Link>
              </DetailRow>
              <DetailRow term="Style family">{styleFamilyName(design.styleFamily)}</DetailRow>
              <DetailRow term="States">
                <span className="font-mono text-12">{design.states.join(", ")}</span>
              </DetailRow>
              <DetailRow term="Motion">{design.hasMotion ? "Yes" : "None"}</DetailRow>
              <DetailRow term="Tags">
                <span className="font-mono text-12">{design.tags.join(", ")}</span>
              </DetailRow>
              <DetailRow term="Version">
                <span className="font-mono text-12 tabular-nums">
                  {design.version} · {dateFormat.format(new Date(design.createdAt))}
                </span>
              </DetailRow>
            </dl>
          </section>
        </aside>
      </div>

      {related.length > 0 ? (
        <section aria-labelledby="related-heading" className="mt-24">
          <h2 id="related-heading" className="text-28 font-semibold text-fg">
            Related designs
          </h2>
          <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((item) => (
              <li key={item.slug}>
                <DesignCard design={toIndexEntry(item)} categoryLabel={categoryName(item.category)} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function DetailRow({ term, children }: { term: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[7.5rem_1fr] items-baseline gap-4 py-3">
      <dt className="text-muted">{term}</dt>
      <dd className="min-w-0 text-fg">{children}</dd>
    </div>
  );
}
