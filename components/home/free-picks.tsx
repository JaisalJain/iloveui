import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { DesignCard } from "@/components/designs/design-card";
import { categoryName } from "@/lib/catalog";
import type { CatalogDesign } from "@/lib/catalog-types";
import { SectionHeading } from "./section-heading";

/** Up to eight free designs as browse cards. */
export function FreePicks({ designs, freeTotal }: { designs: CatalogDesign[]; freeTotal: number }) {
  return (
    <section aria-labelledby="home-free" className="border-t border-hairline">
      <div className="page-frame py-24 sm:py-32">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading id="home-free" index="02" eyebrow="Free picks" title="Free forever, same license.">
            Commercial use, both formats and CLI installs, with no account needed to copy the code.
          </SectionHeading>
          <Link
            href="/designs?tier=free"
            className="inline-flex h-10 shrink-0 items-center gap-2 rounded-control text-14 font-medium text-fg underline decoration-control underline-offset-4 transition-colors hover:decoration-fg"
          >
            All {freeTotal} free designs
            <ArrowRight size={16} strokeWidth={1.5} aria-hidden />
          </Link>
        </div>
        <ul className="mt-12 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {designs.map((design) => (
            <li key={design.slug} className="grid">
              <DesignCard
                design={{
                  slug: design.slug,
                  name: design.name,
                  category: design.category,
                  tier: design.tier,
                  thumb: design.thumb,
                  gzipBytes: design.receipt.gzipBytes,
                }}
                categoryLabel={categoryName(design.category)}
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
