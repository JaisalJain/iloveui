import { CATEGORY_INTROS } from "@/components/browse/category-copy";
import { FREE_PLAN } from "@/config/pricing";
import { categoryName, formatGzip, getAllDesigns, getDesign, getDesignsInCategory } from "@/lib/catalog";
import { extraPageNumbers } from "@/lib/browse";
import { monetizationEnabled } from "@/lib/monetization";
import type { OgContent } from "@/lib/og";
import { CATEGORIES, getCategory, type CategorySlug } from "@/registry/definitions";

// What each route's Open Graph image says (spec section 8: every route has its own). The images are drawn by
// renderOgImage in lib/og.tsx and generated at build time; dynamic segments list their params here.

const pageSuffix = (page: number) => (page > 1 ? ` · page ${page}` : "");

export function catalogOg(page = 1): OgContent {
  return {
    eyebrow: "Designs",
    title: "UI designs you can",
    emphasis: "re-theme",
    titleEnd: "and ship.",
    description: "React and plain HTML, each with its gzipped size, dependencies and accessibility audit on the label.",
    meta: `${getAllDesigns().length} designs · ${CATEGORIES.length} categories${pageSuffix(page)}`,
  };
}

export function categoryOg(slug: string, page = 1): OgContent {
  const category = getCategory(slug);
  if (!category) throw new Error(`Unknown category "${slug}"`);
  const count = getDesignsInCategory(slug).length;
  return {
    eyebrow: "Category",
    title: category.name,
    description: CATEGORY_INTROS[category.slug],
    meta: `${count} ${count === 1 ? "design" : "designs"}${pageSuffix(page)}`,
  };
}

export function designOg(slug: string): OgContent {
  const design = getDesign(slug);
  if (!design) throw new Error(`Unknown design "${slug}"`);
  return {
    eyebrow: categoryName(design.category),
    title: design.name,
    description: design.description,
    meta: `${monetizationEnabled() ? (design.tier === "pro" ? "Pro" : "Free") : "MIT"} · ${formatGzip(design.receipt.gzipBytes)}`,
  };
}

export function pricingOg(): OgContent {
  return {
    eyebrow: "Pricing",
    title: "Pay once, keep",
    emphasis: "every",
    titleEnd: "design.",
    description: `${FREE_PLAN.designs} designs free forever. Pro unlocks every current and future design with one lifetime payment.`,
    meta: "Free · Pro · Team",
  };
}

export const catalogPageParams = () => extraPageNumbers(getAllDesigns().length).map((n) => ({ n }));

export const categoryParams = () => CATEGORIES.map((category) => ({ category: category.slug as CategorySlug }));

export const categoryPageParams = () =>
  CATEGORIES.flatMap((category) =>
    extraPageNumbers(getDesignsInCategory(category.slug).length).map((n) => ({ category: category.slug, n })),
  );

export const designParams = () => getAllDesigns().map((design) => ({ category: design.category, slug: design.slug }));
