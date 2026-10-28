import { clsx } from "clsx";
import { Check, Copy, CornerDownLeft, Search } from "lucide-react";
import type { ReactNode } from "react";
import { TierTag } from "@/components/designs/tier-tag";
import { categoryName } from "@/lib/catalog";
import type { CatalogDesign } from "@/lib/catalog-types";
import { monetizationEnabled } from "@/lib/monetization";
import { ACCENT_PRESETS, NEUTRALS } from "@/lib/theme";
import { SectionHeading } from "./section-heading";

// Each step is illustrated with the site's own UI, drawn static: the search palette, the Theme Lab controls and the
// CLI bar. The illustrations are decorative (aria-hidden); the step text says the same thing in words.

function Frame({ children }: { children: ReactNode }) {
  return (
    <div
      aria-hidden
      className="flex h-60 flex-col justify-center gap-3 overflow-hidden rounded-frame border border-hairline bg-surface p-5 shadow-sm select-none"
    >
      {children}
    </div>
  );
}

function PickIllustration({ query, designs }: { query: string; designs: CatalogDesign[] }) {
  return (
    <Frame>
      <div className="flex h-9 items-center gap-2 rounded-control border border-control bg-canvas px-3 text-14">
        <Search size={16} strokeWidth={1.5} className="text-muted" />
        <span className="text-fg">{query}</span>
        <span className="-ml-1.5 h-4 w-px bg-fg" />
      </div>
      <ul className="flex flex-col gap-1">
        {designs.map((design, index) => (
          <li
            key={design.slug}
            className={clsx(
              "flex items-center justify-between gap-3 rounded-control px-3 py-2",
              index === 0 && "bg-raised",
            )}
          >
            <span className="min-w-0">
              <span className="block truncate text-14 font-medium text-fg">{design.name}</span>
              <span className="block truncate text-12 text-muted">{categoryName(design.category)}</span>
            </span>
            {index === 0 ? (
              <CornerDownLeft size={16} strokeWidth={1.5} className="shrink-0 text-muted" />
            ) : (
              <TierTag tier={design.tier} />
            )}
          </li>
        ))}
      </ul>
    </Frame>
  );
}

function ThemeIllustration() {
  const neutrals = Object.values(NEUTRALS).map((neutral) => neutral.name);
  return (
    <Frame>
      <div className="flex items-center justify-between gap-3">
        <span className="label-mono text-muted">Accent</span>
        <span className="font-mono text-12 text-fg">{ACCENT_PRESETS[2].hex}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {ACCENT_PRESETS.map((preset, index) => (
          <span
            key={preset.id}
            className={clsx(
              "size-6 rounded-full border border-hairline",
              index === 2 && "outline-2 outline-offset-2 outline-fg outline-solid",
            )}
            style={{ backgroundColor: preset.hex }}
          />
        ))}
      </div>
      <div className="mt-2 flex items-center gap-3">
        <span className="label-mono text-muted">Radius</span>
        <span className="relative h-1 flex-1 rounded-full bg-raised">
          <span className="absolute inset-y-0 left-0 w-[58%] rounded-full bg-fg" />
          <span className="absolute top-1/2 left-[58%] size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-control bg-surface shadow-sm" />
        </span>
        <span className="font-mono text-12 text-fg tabular-nums">14px</span>
      </div>
      <div className="mt-2 grid grid-cols-3 rounded-control border border-hairline bg-canvas p-0.5 text-12">
        {neutrals.map((name, index) => (
          <span
            key={name}
            className={clsx(
              "rounded-[4px] py-1.5 text-center",
              index === 1 ? "bg-surface font-medium text-fg shadow-sm" : "text-muted",
            )}
          >
            {name}
          </span>
        ))}
      </div>
    </Frame>
  );
}

function ShipIllustration({ slug }: { slug: string }) {
  return (
    <Frame>
      <div className="flex items-center gap-2 rounded-control border border-hairline bg-canvas py-1.5 pr-1.5 pl-3">
        <span className="min-w-0 flex-1 truncate font-mono text-12 text-fg">
          <span className="text-muted">$ </span>npx shadcn@latest add @iloveui/{slug}
        </span>
        <span className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-control bg-raised px-2 text-12 font-medium text-fg">
          <Check size={14} strokeWidth={1.5} />
          Copied
        </span>
      </div>
      <ul className="flex flex-col gap-1.5 px-1 font-mono text-12 text-muted">
        <li className="flex items-center gap-2">
          <Check size={14} strokeWidth={1.5} className="text-fg" />
          Checking registry
        </li>
        <li className="flex items-center gap-2">
          <Check size={14} strokeWidth={1.5} className="text-fg" />
          Installing dependencies
        </li>
        <li className="flex min-w-0 items-center gap-2">
          <Check size={14} strokeWidth={1.5} className="shrink-0 text-fg" />
          <span className="truncate">
            Created <span className="text-fg">components/{slug}.tsx</span>
          </span>
        </li>
      </ul>
      <div className="mt-1 flex items-center gap-2 border-t border-hairline px-1 pt-3 text-12 text-muted">
        <Copy size={14} strokeWidth={1.5} />
        Or copy the React or HTML file, or download the zip.
      </div>
    </Frame>
  );
}

export function HowItWorks({
  query,
  results,
  installSlug,
}: {
  query: string;
  results: CatalogDesign[];
  installSlug: string;
}) {
  const steps = [
    {
      title: "Pick",
      body: `Filter by category, style family, ${monetizationEnabled() ? "tier " : ""}and motion, or open search with Cmd+K or Ctrl+K and type what you need.`,
      art: <PickIllustration query={query} designs={results} />,
    },
    {
      title: "Theme",
      body: "Set your accent, neutrals, radius, font and density once. Every preview re-renders, and copied code carries your tokens.",
      art: <ThemeIllustration />,
    },
    {
      title: "Ship",
      body: "Install with the shadcn CLI, copy either file, or download a zip with an AI prompt for your coding agent.",
      art: <ShipIllustration slug={installSlug} />,
    },
  ];
  return (
    <section aria-labelledby="home-how" className="border-t border-hairline">
      <div className="page-frame py-24 sm:py-32">
        <SectionHeading id="home-how" index="03" eyebrow="How it works" title="Pick, theme, ship.">
          From the catalog to your repository in three steps, with your brand applied before you copy a line.
        </SectionHeading>
        <ol className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-3 lg:gap-6">
          {steps.map((step, index) => (
            <li
              key={step.title}
              className="grid min-w-0 gap-6 sm:grid-cols-2 sm:items-center lg:flex lg:flex-col lg:items-stretch"
            >
              {step.art}
              <div>
                <h3 className="flex items-baseline gap-3 text-20 font-semibold">
                  <span className="font-mono text-12 font-normal text-muted tabular-nums">0{index + 1}</span>
                  {step.title}
                </h3>
                <p className="mt-2 max-w-sm text-14 text-muted">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
