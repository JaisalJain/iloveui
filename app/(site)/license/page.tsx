import type { Metadata } from "next";
import { Emphasis, LegalPage, type LegalSection } from "@/components/legal/legal-page";
import { LEGAL_UPDATED, RELATED } from "@/components/legal/legal-links";
import { COPYRIGHT_LINE, LICENSE_PARAGRAPHS, LICENSE_TITLE } from "@/lib/license";
import { site } from "@/lib/site";

const description =
  "Every iloveui design is released under the MIT License: use, copy, change and share it in personal and commercial work, as long as the copyright notice stays with it.";

export const metadata: Metadata = {
  title: "License",
  description,
  alternates: { canonical: "/license" },
  openGraph: { title: `License · ${site.name}`, description, url: "/license" },
};

// The license text itself comes from lib/license.ts, the same source as the LICENSE.txt in every download, so the
// page and the file can never disagree. The section after it explains the text and is not part of it.
const sections: LegalSection[] = [
  {
    id: "license-text",
    title: "The license",
    content: (
      <>
        <p>
          <strong>{LICENSE_TITLE}</strong>
        </p>
        <p>{COPYRIGHT_LINE}</p>
        {LICENSE_PARAGRAPHS.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </>
    ),
  },
  {
    id: "in-plain-words",
    title: "In plain words",
    content: (
      <>
        <p>This explanation is not part of the license, and the text above wins if they ever differ.</p>
        <ul>
          <li>Use the designs in any project, personal or commercial, for yourself or for clients.</li>
          <li>Change them as much as you like and combine them with your own work.</li>
          <li>Copy, publish, share, sublicense or sell them, original or modified.</li>
          <li>
            The one condition: keep the copyright and permission notice with every copy or substantial portion. The
            LICENSE.txt in each download is that notice.
          </li>
          <li>The designs come as they are, with no warranty.</li>
        </ul>
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
          Use it, change it, <Emphasis>share</Emphasis> it.
        </>
      }
      intro={
        <p>
          The site and every design are released under the MIT License. It is also the LICENSE.txt inside every
          download, word for word.
        </p>
      }
      summary={[
        "Use the designs in any project, personal or commercial, for yourself or for clients.",
        "Copy, change, publish, share and sell them.",
        "Keep the copyright and permission notice with copies or substantial portions.",
        "No warranty: the designs come as they are.",
      ]}
      updated={LEGAL_UPDATED}
      sections={sections}
      related={[RELATED.privacy, RELATED.docs]}
    />
  );
}
