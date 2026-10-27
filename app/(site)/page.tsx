import type { Metadata } from "next";
import { CategoryIndex } from "@/components/home/category-index";
import { FreePicks } from "@/components/home/free-picks";
import { Hero } from "@/components/home/hero";
import { catalogStats, categoryIndex, freePicks, interleavedDesigns, wallColumns } from "@/components/home/home-data";
import { HowItWorks } from "@/components/home/how-it-works";
import { LatestChanges } from "@/components/home/latest-changes";
import { PricingTeaser } from "@/components/home/pricing-teaser";
import { ValueStrip } from "@/components/home/value-strip";
import { getChangelogEntries } from "@/lib/changelog";
import { site } from "@/lib/site";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: { absolute: `${site.name} · ${site.tagline}` },
  description: site.description,
  alternates: { canonical: "/" },
};

export default function HomePage() {
  const stats = catalogStats();
  const picks = freePicks();
  const designs = interleavedDesigns();
  // The receipt and CLI examples use a real free design, so every number shown is one a visitor can check.
  const sample = picks[0] ?? designs[0];
  return (
    <>
      <Hero columns={wallColumns()} total={stats.total} free={stats.free} />
      <ValueStrip sample={sample} />
      <CategoryIndex categories={categoryIndex()} total={stats.total} target={stats.target} />
      {picks.length > 0 ? <FreePicks designs={picks} freeTotal={stats.free} /> : null}
      {sample ? (
        <HowItWorks
          query={picks.length > 0 ? "free" : sample.category}
          results={(picks.length > 0 ? picks : designs).slice(0, 3)}
          installSlug={sample.slug}
        />
      ) : null}
      <PricingTeaser />
      <LatestChanges entries={getChangelogEntries().slice(0, 3)} />
    </>
  );
}
