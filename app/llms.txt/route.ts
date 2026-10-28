import { collectionDesigns, collectionPath } from "@/components/collections/collection-data";
import { COLLECTIONS } from "@/config/collections";
import { FREE_PLAN, PAID_PLANS, formatPrice } from "@/config/pricing";
import { categoryName, designPath, formatGzip, getAllDesigns, getDesignsInCategory } from "@/lib/catalog";
import { DOC_PAGES } from "@/lib/docs";
import { monetizationEnabled } from "@/lib/monetization";
import { absoluteUrl, site } from "@/lib/site";
import { CATEGORIES } from "@/registry/definitions";

// /llms.txt (https://llmstxt.org): the catalog with page URLs, tiers and install commands, plus the docs and key
// links, as Markdown for agents. Generated once at build time from the same catalog the site uses.
export const dynamic = "force-static";

const link = (title: string, path: string, note?: string) =>
  `- [${title}](${absoluteUrl(path)})${note ? `: ${note}` : ""}`;

function body(): string {
  const paid = monetizationEnabled();
  const designs = getAllDesigns();
  const free = designs.filter((design) => design.tier === "free").length;
  const pro = PAID_PLANS.pro.prices;
  const lines: string[] = [
    `# ${site.name}`,
    "",
    `> ${site.description} Every design ships as a React + Tailwind CSS v4 component and as plain HTML + Tailwind CSS v4 with vanilla JavaScript, themed through --iu-* CSS variables.`,
    "",
    `${
      paid
        ? `The catalog has ${designs.length} designs today, ${free} of them free. Free designs install without an account. Pro designs need a personal token from ${absoluteUrl("/account")}, created after buying Pro (${formatPrice(pro.USD.amountMinor, "USD")}, or ${formatPrice(pro.INR.amountMinor, "INR")} in India) or Team.`
        : `The catalog has ${designs.length} designs today, all free. Every design installs, copies and downloads without an account.`
    } All designs follow the license at ${absoluteUrl("/license")}: use them in any end product; do not resell or redistribute them as a UI kit, template or library.`,
    "",
    "## Install",
    "",
    paid
      ? "Add the registry to components.json once. For free designs, the string form needs no token:"
      : "Add the registry to components.json once:",
    "",
    "```json",
    `"registries": { "@iloveui": "${site.url}/r/{name}.json" }`,
    "```",
    "",
    ...(paid
      ? [
          "For Pro designs, use the object form and put ILOVEUI_TOKEN=ilui_live_... in .env.local (the CLI refuses to run while that variable is empty):",
          "",
          "```json",
          `"registries": {`,
          `  "@iloveui": {`,
          `    "url": "${site.url}/r/{name}.json",`,
          `    "headers": { "Authorization": "Bearer \${ILOVEUI_TOKEN}" }`,
          `  }`,
          `}`,
          "```",
          "",
        ]
      : []),
    "Then install any design by its slug, for example:",
    "",
    "```sh",
    `npx shadcn@latest add @iloveui/${designs.find((design) => design.tier === "free")?.slug ?? "<slug>"}`,
    "```",
    "",
    "Each design page also offers the code to copy in both formats, a zip download and an AI prompt describing the component.",
    "",
    "## Designs",
  ];

  for (const category of CATEGORIES) {
    const inCategory = getDesignsInCategory(category.slug);
    if (inCategory.length === 0) continue;
    lines.push("", `### ${categoryName(category.slug)}`, "");
    for (const design of inCategory) {
      lines.push(
        link(
          design.name,
          designPath(design),
          `${design.description} ${paid ? `${design.tier === "pro" ? "Pro" : "Free"}, ` : ""}${formatGzip(design.receipt.gzipBytes)}. Install: \`npx shadcn@latest add @iloveui/${design.slug}\``,
        ),
      );
    }
  }

  lines.push("", "## Collections", "");
  for (const collection of COLLECTIONS) {
    const slugs = collectionDesigns(collection).map((design) => design.slug);
    lines.push(
      link(collection.title, collectionPath(collection.slug), `${collection.description} (${slugs.join(", ")})`),
    );
  }

  lines.push("", "## Docs", "");
  for (const page of DOC_PAGES) lines.push(link(page.title, page.href, page.description));

  lines.push(
    "",
    "## Key links",
    "",
    link(
      "All designs",
      "/designs",
      `Browse and filter by category, style family, ${paid ? "tier, " : ""}motion and format.`,
    ),
    ...(paid
      ? [
          link(
            "Pricing",
            "/pricing",
            `${FREE_PLAN.designs} designs free. Pro and Team are one lifetime payment for every current and future design.`,
          ),
        ]
      : []),
    link("License", "/license", "What you may build with the designs."),
    link("Changelog", "/changelog", "New designs and changes, newest first."),
    link("Catalog index (JSON)", "/catalog.json", "Every design's slug, name, category, tier, tags and size."),
    "",
    "## Optional",
    "",
    link("Terms", "/terms"),
    link("Privacy", "/privacy"),
    link("Refunds", "/refunds", `Full refund within ${site.refundWindowDays} days of purchase, no questions asked.`),
    link("Contact", "/contact", site.supportEmail),
    "",
  );
  return lines.join("\n");
}

export function GET() {
  return new Response(body(), { headers: { "content-type": "text/plain; charset=utf-8" } });
}
