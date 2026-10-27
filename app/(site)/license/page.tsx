import type { Metadata } from "next";
import Link from "next/link";
import { Emphasis, LegalPage, type LegalSection } from "@/components/legal/legal-page";
import { LEGAL_UPDATED, RELATED } from "@/components/legal/legal-links";
import { FREE_PLAN, PAID_PLANS } from "@/config/pricing";
import { LICENSE_SECTIONS, LICENSE_TITLE } from "@/lib/license";
import { site } from "@/lib/site";

const description =
  "The iloveui license: use the designs in unlimited personal and commercial end products for you and your clients. No resale as a UI kit, template or library.";

export const metadata: Metadata = {
  title: "License",
  description,
  alternates: { canonical: "/license" },
  openGraph: { title: `License · ${site.name}`, description, url: "/license" },
};

const slug = (heading: string) =>
  heading
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

// The license text itself comes from lib/license.ts, the same source as the LICENSE.txt in every download, so the
// page and the file can never disagree. The two sections after it explain the text and are not part of it.
const licenseSections: LegalSection[] = LICENSE_SECTIONS.map((section) => ({
  id: slug(section.heading),
  title: section.heading,
  content: section.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>),
}));

const explainers: LegalSection[] = [
  {
    id: "free-and-pro",
    title: "How Free and Pro relate",
    content: (
      <>
        <p>
          There is one license. {FREE_PLAN.designs} designs are free forever: anyone may copy, install or download them
          and use them under the terms above, with no account and no payment.
        </p>
        <p>
          Every other design is Pro. A Pro license gives one person access to all of them, including every design added
          later, for one payment. A Team license does the same for up to {PAID_PLANS.team.seats} people: the owner and
          up to {PAID_PLANS.team.seats - 1} invited seats, each signing in as themselves.
        </p>
        <p>
          The terms of use do not change with the plan. What changes is which designs you can open: Free gives you the
          free ones, Pro and Team give you everything. Prices and plans are on the <Link href="/pricing">pricing</Link>{" "}
          page.
        </p>
      </>
    ),
  },
  {
    id: "examples",
    title: "Examples",
    content: (
      <>
        <p>These examples explain the license. They are not part of it, and the text above wins if they ever differ.</p>
        <p>
          <strong>Fine:</strong>
        </p>
        <ul>
          <li>The pricing section of your SaaS product, re-themed to your brand.</li>
          <li>A marketing site you build for a client, who then owns and runs it.</li>
          <li>An internal dashboard at the company you work for.</li>
          <li>A mobile web app you sell to your own customers.</li>
        </ul>
        <p>
          <strong>Not fine:</strong>
        </p>
        <ul>
          <li>Selling or giving away a starter template, theme or boilerplate built from the designs.</li>
          <li>Publishing the designs, or modified versions of them, as an npm package or component library.</li>
          <li>Uploading them to a marketplace of UI kits, Figma files or design assets.</li>
          <li>Sharing your Pro access, CLI token or downloaded zips with people who do not hold a seat.</li>
        </ul>
        <p>
          Not sure about a case? Email <a href={`mailto:${site.supportEmail}`}>{site.supportEmail}</a> before you ship
          it and you will get a straight answer.
        </p>
      </>
    ),
  },
];

export default function LicensePage() {
  return (
    <LegalPage
      eyebrow={LICENSE_TITLE}
      title={
        <>
          Build anything. <Emphasis>Resell</Emphasis> nothing.
        </>
      }
      intro={
        <p>
          One license covers every design, free or Pro. It is also the LICENSE.txt inside every download, word for word.
        </p>
      }
      summary={[
        "Use the designs in unlimited personal and commercial end products, for yourself and for clients.",
        "Change them as much as you like.",
        "Do not resell, sublicense or redistribute them as a UI kit, template, component library or design asset.",
        `Free designs follow the same terms at no cost. Pro is for one person; Team covers up to ${PAID_PLANS.team.seats}.`,
      ]}
      updated={LEGAL_UPDATED}
      sections={[...licenseSections, ...explainers]}
      related={[RELATED.terms, RELATED.pricing, RELATED.contact]}
    />
  );
}
