import type { Metadata } from "next";
import Link from "next/link";
import { Emphasis, LegalPage, type LegalSection } from "@/components/legal/legal-page";
import { DODO_BUYER_TERMS, LEGAL_UPDATED, MERCHANT_OF_RECORD_LINE, RELATED } from "@/components/legal/legal-links";
import { FREE_PLAN, PAID_PLANS } from "@/config/pricing";
import { site } from "@/lib/site";

const description = `Terms of sale and use for iloveui: accounts, Pro and Team licenses, lifetime access, refunds, ${site.merchantOfRecord} as Merchant of Record, and Indian governing law.`;

export const metadata: Metadata = {
  title: "Terms",
  description,
  alternates: { canonical: "/terms" },
  openGraph: { title: `Terms · ${site.name}`, description, url: "/terms" },
};

const email = <a href={`mailto:${site.supportEmail}`}>{site.supportEmail}</a>;
const team = PAID_PLANS.team.seats;

const sections: LegalSection[] = [
  {
    id: "who-we-are",
    title: "Who we are",
    content: (
      <>
        <p>
          {site.name} ({site.domain}) is made and run by {site.owner.name}, a {site.owner.status} in{" "}
          {site.owner.country}. In these terms, “we” and “us” mean {site.owner.name}, and “you” means the person using
          the site or buying a license.
        </p>
        <p>{MERCHANT_OF_RECORD_LINE}</p>
      </>
    ),
  },
  {
    id: "the-agreement",
    title: "What these terms cover",
    content: (
      <>
        <p>Using {site.name} involves three documents, each with its own job:</p>
        <ul>
          <li>
            <strong>These terms</strong> cover your account, the plans, access to the designs and how we run the
            service.
          </li>
          <li>
            <strong>
              The <Link href="/license">iloveui License</Link>
            </strong>{" "}
            covers what you may build with the designs. It applies to free and Pro designs alike.
          </li>
          <li>
            <strong>
              {site.merchantOfRecord}’{" "}
              <a href={DODO_BUYER_TERMS} rel="noopener">
                Buyer Terms
              </a>
            </strong>{" "}
            cover the purchase transaction itself: the payment, taxes and the invoice.
          </li>
        </ul>
        <p>By using the site or buying a license, you agree to these terms and the license.</p>
      </>
    ),
  },
  {
    id: "accounts",
    title: "Accounts",
    content: (
      <>
        <p>
          You can browse, preview and copy free designs without an account. Buying a plan, bookmarking across devices,
          creating a CLI token and joining a Team need one. Sign-in is handled by Clerk with your email address or a
          GitHub or Google account.
        </p>
        <ul>
          <li>One account is for one person. Keep your sign-in method to yourself.</li>
          <li>Use an email address you can receive mail at: Team invites, invoices and support replies go there.</li>
          <li>You are responsible for what happens under your account and with your CLI token.</li>
        </ul>
      </>
    ),
  },
  {
    id: "plans",
    title: "Plans and lifetime access",
    content: (
      <>
        <p>
          <strong>Free</strong> gives everyone {FREE_PLAN.designs} designs, free forever, for personal and commercial
          work.
        </p>
        <p>
          <strong>Pro</strong> gives one person every design in the catalog for one payment. <strong>Team</strong> gives
          the same to up to {team} people. Current prices are on the <Link href="/pricing">pricing</Link> page.
        </p>
        <p>
          <strong>Lifetime</strong> means there is no subscription and nothing to renew: one payment covers every design
          in the catalog today and every design we add later, for as long as {site.name} runs. A license stays active
          until it is refunded or ended under the <a href="#ending">ending</a> section below.
        </p>
        <p>
          We may improve, rename or retire individual designs over time. A design you have already copied, installed or
          downloaded stays yours to use under the license.
        </p>
      </>
    ),
  },
  {
    id: "team-seats",
    title: "Team seats",
    content: (
      <>
        <p>
          The person who buys a Team license is its owner and holds the first seat. From the account page the owner can
          invite up to {team - 1} more people by email.
        </p>
        <ul>
          <li>An invite becomes an active seat when that person signs in with the invited email address.</li>
          <li>Each seat is for one named person. Seats are not shared logins.</li>
          <li>The owner can remove a seat at any time; that person’s Pro access ends straight away.</li>
          <li>Billing, invoices and refunds belong to the owner. A refund ends access for every seat.</li>
        </ul>
      </>
    ),
  },
  {
    id: "payment",
    title: "Payment, tax and invoices",
    content: (
      <>
        <p>{MERCHANT_OF_RECORD_LINE}</p>
        <ul>
          <li>
            {site.merchantOfRecord} is the seller of record for your purchase and resells the license on our behalf. We
            never see or store your card details, and we never charge your card or issue invoices ourselves.
          </li>
          <li>
            Prices are in US dollars, or Indian rupees for buyers in India, and are set by the country of your
            connection. {site.merchantOfRecord} adds sales tax, VAT or GST at checkout where it applies.
          </li>
          <li>
            The charge appears on your statement with a <code>DODOPAY_</code> prefix. {site.merchantOfRecord} emails
            your invoice after payment, and your account page links to it.
          </li>
          <li>
            Access is granted when {site.merchantOfRecord} confirms the payment to us, usually within seconds. It is
            never granted from the checkout page alone.
          </li>
        </ul>
        <p>
          If a price changes later, it does not change what you already paid or what your license includes. Please
          contact {site.merchantOfRecord} or us before disputing a charge with your bank; a refund is faster.
        </p>
      </>
    ),
  },
  {
    id: "refunds",
    title: "Refunds",
    content: (
      <>
        <p>
          You get a full refund within {site.refundWindowDays} days of purchase, no questions asked. Request it from
          your account page or by email; the <Link href="/refunds">refund policy</Link> has the details.
        </p>
        <p>
          A refund ends the license it refunds: Pro access ends for you and any Team seats, your CLI token stops
          working, and the right to use Pro designs under the license ends with it.
        </p>
      </>
    ),
  },
  {
    id: "cli-and-downloads",
    title: "CLI tokens and downloads",
    content: (
      <>
        <p>
          Pro designs install through the shadcn CLI with a personal access token you create on your account page. The
          token is shown once; we store only a hash of it. You can rotate it at any time, which ends the old one
          immediately.
        </p>
        <p>
          To keep the service fast for everyone, the registry allows 120 requests per token per minute and downloads are
          limited to 60 per person per hour. Normal use never comes close.
        </p>
      </>
    ),
  },
  {
    id: "acceptable-use",
    title: "Acceptable use",
    content: (
      <>
        <p>Please do not:</p>
        <ul>
          <li>Share your account, CLI token or downloaded Pro files with anyone who does not hold a seat.</li>
          <li>Get around access controls, or scrape or bulk-download the catalog to rebuild or redistribute it.</li>
          <li>Put more load on the service than normal use would, or try to break or probe it.</li>
          <li>Use the site or the designs for anything unlawful.</li>
        </ul>
      </>
    ),
  },
  {
    id: "warranty",
    title: "Warranty and liability",
    content: (
      <>
        <p>
          We build every design to work and to pass its accessibility audit, and we fix problems you report. Still, the
          designs and the service are provided “as is”, without warranty of any kind, and you are responsible for
          testing them in your own product.
        </p>
        <p>
          To the extent the law allows, we are not liable for indirect or consequential losses, and our total liability
          to you is limited to the amount you paid us for your license. Nothing in these terms limits rights you have
          under consumer protection law that cannot be excluded.
        </p>
      </>
    ),
  },
  {
    id: "ending",
    title: "Ending",
    content: (
      <>
        <p>
          You can stop using {site.name} at any time. To delete your account, email us from its address; the{" "}
          <Link href="/privacy">privacy policy</Link> explains what is kept for payment records.
        </p>
        <p>
          If an account breaks the license or these terms, for example by reselling designs or sharing a token, we may
          suspend its access. We will email you first to explain why and give you a chance to respond, unless the
          problem is ongoing harm to the service.
        </p>
      </>
    ),
  },
  {
    id: "changes",
    title: "Changes to these terms",
    content: (
      <p>
        When these terms change, the date at the top of this page changes with them. Changes apply from that date and
        never take away access you have already paid for.
      </p>
    ),
  },
  {
    id: "governing-law",
    title: "Governing law",
    content: (
      <p>
        These terms and the license are governed by the laws of {site.governingLaw}. The purchase transaction itself is
        governed by {site.merchantOfRecord}’ Buyer Terms.
      </p>
    ),
  },
  {
    id: "contact",
    title: "Contact",
    content: (
      <p>
        Questions about these terms go to {email}. The <Link href="/contact">contact page</Link> lists what to include
        so we can answer in one reply.
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Terms of sale and use"
      title={
        <>
          The terms, in <Emphasis>plain</Emphasis> words.
        </>
      }
      intro={<p>What you get when you use or buy {site.name}, and what we ask of you in return.</p>}
      summary={[
        `Pro and Team are one payment for every current and future design. Team covers up to ${team} people.`,
        `${site.merchantOfRecord} sells the license as Merchant of Record and handles payment, tax and invoices.`,
        `Full refund within ${site.refundWindowDays} days, no questions asked. A refund ends the license.`,
        "Build whatever you like with the designs; do not resell or redistribute them.",
        `Governed by the laws of ${site.governingLaw}.`,
      ]}
      updated={LEGAL_UPDATED}
      sections={sections}
      related={[RELATED.license, RELATED.refunds, RELATED.privacy]}
    />
  );
}
