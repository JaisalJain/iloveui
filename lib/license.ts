import { site } from "./site";

// The iloveui license (spec section 11). Rendered on /license and shipped as LICENSE.txt in every download.
export const LICENSE_TITLE = "iloveui License";

export const LICENSE_SECTIONS: { heading: string; body: string[] }[] = [
  {
    heading: "Who this license is from",
    body: [
      `The designs on ${site.domain} are made and sold by ${site.owner.name}, ${site.owner.status}, ${site.owner.country}. Payments are processed by ${site.merchantOfRecord}, the Merchant of Record.`,
    ],
  },
  {
    heading: "What you may do",
    body: [
      "Use the designs you have access to in an unlimited number of personal and commercial end products, for yourself and for your clients.",
      "Modify the designs as much as you like, combine them with other work, and ship them in websites, web apps, desktop and mobile apps, internal tools and client deliverables.",
    ],
  },
  {
    heading: "What you may not do",
    body: [
      "Resell, sublicense or redistribute the designs, original or modified, as a UI kit, template, component library or design asset.",
    ],
  },
  {
    heading: "Free designs",
    body: ["Free designs follow the same terms at no cost."],
  },
  {
    heading: "Pro and Team",
    body: [
      "A Pro license is for one person. A Team license covers up to 10 people, each with their own seat.",
      "Both are lifetime licenses: they include every current design and every design added later.",
    ],
  },
  {
    heading: "No warranty",
    body: [
      'The designs are provided "as is", without warranty of any kind. The seller is not liable for any claim, damages or other liability arising from their use.',
    ],
  },
  {
    heading: "Governing law",
    body: [`This license is governed by the laws of ${site.governingLaw}. Questions: ${site.supportEmail}.`],
  },
];

/** Plain-text version for LICENSE.txt in downloads. */
export function licenseText(): string {
  const lines = [LICENSE_TITLE, "=".repeat(LICENSE_TITLE.length), ""];
  for (const section of LICENSE_SECTIONS) {
    lines.push(section.heading, "-".repeat(section.heading.length));
    for (const paragraph of section.body) lines.push(paragraph, "");
  }
  return `${lines.join("\n").trim()}\n`;
}
