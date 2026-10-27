import type { Metadata } from "next";
import Link from "next/link";
import { Emphasis, LegalPage, type LegalSection } from "@/components/legal/legal-page";
import { LEGAL_UPDATED, MERCHANT_OF_RECORD_LINE, RELATED } from "@/components/legal/legal-links";
import { site } from "@/lib/site";

const days = site.refundWindowDays;
const mor = site.merchantOfRecord;
const description = `Full refund within ${days} days of purchase, no questions asked. Request it from your account page or by email; ${mor} returns it to your original payment method.`;

export const metadata: Metadata = {
  title: "Refunds",
  description,
  alternates: { canonical: "/refunds" },
  openGraph: { title: `Refunds · ${site.name}`, description, url: "/refunds" },
};

const email = <a href={`mailto:${site.supportEmail}`}>{site.supportEmail}</a>;

const sections: LegalSection[] = [
  {
    id: "the-policy",
    title: "The policy",
    content: (
      <>
        <p>
          If {site.name} is not for you, you get a full refund of what you paid, as long as you ask within {days} days
          of purchase. You do not need to give a reason, and we will not ask for one.
        </p>
        <p>It applies to Pro and Team licenses alike, in US dollars or Indian rupees.</p>
      </>
    ),
  },
  {
    id: "how-to-ask",
    title: "How to ask for a refund",
    content: (
      <>
        <p>
          <strong>From your account</strong>, which is fastest:
        </p>
        <ol>
          <li>
            Sign in and open your <Link href="/account">account page</Link>.
          </li>
          <li>Under your license, choose Request a refund. The page shows the last day you can.</li>
          <li>Confirm. The page updates on its own when the refund is confirmed.</li>
        </ol>
        <p>
          <strong>By email</strong>: write to {email} from the address you bought with, within the {days} days. A
          request sent on day {days} counts, even if we answer on day {days + 1}.
        </p>
      </>
    ),
  },
  {
    id: "timing",
    title: "When the money arrives",
    content: (
      <>
        <p>{MERCHANT_OF_RECORD_LINE}</p>
        <p>
          We issue every refund through {mor}, which returns it to the card or account you paid with. {mor} usually
          confirms within minutes; your bank may then take 5 to 10 business days to show it on your statement.
        </p>
      </>
    ),
  },
  {
    id: "access",
    title: "What happens to your access",
    content: (
      <>
        <p>Access changes only when {mor} confirms the refund, not when you ask for it. At that point:</p>
        <ul>
          <li>Pro access ends for you, and for every seat if it was a Team license.</li>
          <li>Your CLI token stops working, so Pro installs from the shadcn CLI are refused.</li>
          <li>Pro code panels, AI prompts and downloads lock again.</li>
          <li>The right to use Pro designs under the license ends.</li>
        </ul>
        <p>
          The free designs, your account and your bookmarks stay. You can buy again whenever you like, at the price on
          the <Link href="/pricing">pricing</Link> page at that time.
        </p>
      </>
    ),
  },
  {
    id: "after-the-window",
    title: `After ${days} days`,
    content: (
      <>
        <p>
          The self-serve button disappears when the window closes, and the license stays yours for good. If something is
          broken, email {email}: fixing a design is part of what you paid for.
        </p>
        <p>
          Charged twice, or charged for something you did not buy? Email us whatever the date and we will sort it out
          with {mor}.
        </p>
      </>
    ),
  },
  {
    id: "disputes",
    title: "Before you dispute a charge",
    content: (
      <p>
        Please write to us or to {mor} before opening a dispute with your bank. Inside the {days} days a refund is
        faster than any dispute, and after them we would still rather hear what went wrong.
      </p>
    ),
  },
];

export default function RefundsPage() {
  return (
    <LegalPage
      eyebrow="Refund policy"
      title={
        <>
          {days} days, <Emphasis>no</Emphasis> questions.
        </>
      }
      intro={<p>How to get your money back, how long it takes, and what changes when it goes through.</p>}
      summary={[
        `Full refund within ${days} days of purchase. No reason needed.`,
        "Ask from your account page in two clicks, or by email.",
        `${mor} returns the money to your original payment method; banks may take 5 to 10 business days.`,
        "When the refund is confirmed, Pro access ends and your CLI token stops working.",
      ]}
      updated={LEGAL_UPDATED}
      sections={sections}
      related={[RELATED.terms, RELATED.pricing, RELATED.contact]}
    />
  );
}
