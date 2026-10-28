import type { Metadata } from "next";
import { Emphasis, FactList, LegalPage, type LegalSection } from "@/components/legal/legal-page";
import { LEGAL_UPDATED, RELATED } from "@/components/legal/legal-links";
import { site } from "@/lib/site";

const description = `${site.name} collects no personal data: no accounts, no analytics and no tracking cookies. Theme settings stay in your browser, and usage is counted as anonymous totals per design.`;

export const metadata: Metadata = {
  title: "Privacy",
  description,
  alternates: { canonical: "/privacy" },
  openGraph: { title: `Privacy · ${site.name}`, description, url: "/privacy" },
};

// Every claim here describes the site with MONETIZATION_ENABLED false. The storage keys are the ones the site code
// writes; the counters are lib/metrics.ts and the IP-keyed windows in app/api/metrics and app/api/download.
const sections: LegalSection[] = [
  {
    id: "what-we-collect",
    title: "What we collect",
    content: (
      <>
        <p>
          Nothing that identifies you. {site.name} has no accounts, no sign-in and no payments, so there is no name,
          email address or payment detail to store. There are no analytics, no advertising and no tracking cookies, and
          no data is sold or shared.
        </p>
        <p>
          Cloudflare, which hosts the site, processes IP addresses and request details to serve and protect it, as any
          web host does.
        </p>
      </>
    ),
  },
  {
    id: "cookies",
    title: "Cookies and local storage",
    content: (
      <>
        <p>
          The site sets no tracking cookies. Your preferences stay in your browser’s local storage, which never leaves
          your device:
        </p>
        <FactList
          items={[
            { term: "iloveui.mode", detail: "Your light or dark theme choice.", meta: "Local storage" },
            {
              term: "iloveui.theme",
              detail: "Your Theme Lab settings: accent, neutral, radius, font and density.",
              meta: "Local storage",
            },
            {
              term: "iloveui.themelab",
              detail: "Whether the Theme Lab dock is expanded or collapsed.",
              meta: "Local storage",
            },
            {
              term: "iloveui.format",
              detail: "Whether you prefer the React or the HTML code tab.",
              meta: "Local storage",
            },
            {
              term: "iloveui.recent",
              detail: "The last few designs and pages you opened from search.",
              meta: "Local storage",
            },
          ]}
        />
        <p>Clearing your site data removes all of it.</p>
      </>
    ),
  },
  {
    id: "usage-counts",
    title: "Usage counts and rate limits",
    content: (
      <>
        <p>
          How many times each design is copied, installed or downloaded is kept as a running total per design. The
          totals are not linked to any person, device or address, and they power the “most copied” sort.
        </p>
        <p>
          To stop abuse, copy counting and downloads are rate limited by IP address: a counter holds the address and a
          number for one minute (copies) or one hour (downloads). An expired window is deleted the next time the same
          address is counted.
        </p>
      </>
    ),
  },
  {
    id: "accounts-and-payments",
    title: "Accounts and payments",
    content: (
      <p>
        If whoever runs this site switches on accounts and payments, sign-in is handled by Clerk and payments by Dodo
        Payments, and both process account and payment data under their own privacy policies.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes",
    content: <p>When this statement changes, the date at the top changes with it.</p>,
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Privacy"
      title={
        <>
          We collect <Emphasis>nothing</Emphasis> about you.
        </>
      }
      intro={<p>{site.name} works without accounts, so it has no personal data to collect, keep or share.</p>}
      summary={[
        "No accounts, no analytics, no advertising and no tracking cookies.",
        "Theme and other preferences stay in your browser’s local storage.",
        "Copies, installs and downloads are counted as anonymous totals per design.",
        "IP addresses appear only in rate-limit counters.",
      ]}
      updated={LEGAL_UPDATED}
      sections={sections}
      related={[RELATED.license, RELATED.docs, RELATED.contact]}
    />
  );
}
