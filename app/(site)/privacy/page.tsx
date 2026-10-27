import type { Metadata } from "next";
import Link from "next/link";
import { Emphasis, FactList, LegalPage, type LegalSection } from "@/components/legal/legal-page";
import { DODO_PRIVACY_POLICY, LEGAL_UPDATED, RELATED } from "@/components/legal/legal-links";
import { site } from "@/lib/site";

const description = `What iloveui stores and why, the processors involved (Clerk, Cloudflare, ${site.merchantOfRecord}), cookies and local storage, retention, and how to get or delete your data.`;

export const metadata: Metadata = {
  title: "Privacy",
  description,
  alternates: { canonical: "/privacy" },
  openGraph: { title: `Privacy · ${site.name}`, description, url: "/privacy" },
};

const email = <a href={`mailto:${site.supportEmail}`}>{site.supportEmail}</a>;
const mor = site.merchantOfRecord;

const sections: LegalSection[] = [
  {
    id: "who-is-responsible",
    title: "Who is responsible",
    content: (
      <p>
        {site.owner.name}, a {site.owner.status} in {site.owner.country}, runs {site.name} and decides what happens to
        the data described here. Write to {email} about anything on this page.
      </p>
    ),
  },
  {
    id: "what-we-store",
    title: "What we store and why",
    content: (
      <>
        <p>
          Browsing, previewing and copying free designs needs no account and stores nothing about you on our side. Once
          you sign in or buy, our database holds the following, and nothing else about you.
        </p>
        <FactList
          items={[
            {
              term: "Account",
              detail: "Your Clerk user id and email address, to sign you in, tie purchases to you and answer support.",
              meta: "Kept until you delete your account",
            },
            {
              term: "Purchases",
              detail: `Plan, currency, amount, date, status and the ${mor} payment id, to grant access, process refunds and link invoices.`,
              meta: "Kept for tax and accounting records, also after account deletion",
            },
            {
              term: "Team seats",
              detail:
                "The email addresses a Team owner invites and whether each seat is invited, active or removed, so an invite can turn into a seat when that person signs in.",
              meta: "Kept for the life of the Team license",
            },
            {
              term: "CLI token",
              detail:
                "A hash of your token, never the token itself, with when it was created and last used, to check installs from the shadcn CLI.",
              meta: "Replaced when you rotate it; deleted with your account",
            },
            {
              term: "Bookmarks",
              detail: "The designs you bookmark, so they follow you between devices.",
              meta: "Until you remove them or delete your account",
            },
            {
              term: "Usage counts",
              detail:
                "How many times each design was copied, installed or downloaded, as totals per design that are not linked to anyone, to sort by most copied.",
              meta: "Totals only, kept indefinitely",
            },
            {
              term: "Rate limits",
              detail:
                "A counter per account, token or IP address for one minute or one hour, to stop abuse of the registry, downloads and checkout.",
              meta: "Old windows are deleted the next time the same key is counted",
            },
          ]}
        />
      </>
    ),
  },
  {
    id: "what-we-never-store",
    title: "What we never collect",
    content: (
      <ul>
        <li>Card or bank details. Those go straight to {mor} and never reach us.</li>
        <li>Your password. Clerk handles sign-in; with GitHub or Google there is no password at all.</li>
        <li>Advertising or analytics trackers. The site has none, and we do not sell or rent data to anyone.</li>
      </ul>
    ),
  },
  {
    id: "processors",
    title: "Who processes data for us",
    content: (
      <>
        <p>Three companies process data so the site can work. Each sees only what its job needs.</p>
        <FactList
          items={[
            {
              term: "Clerk",
              detail: (
                <>
                  Sign-in and sessions: your email address, the sign-in method you chose and session details. Clerk only
                  runs on the sign-in, sign-up, account and checkout pages.{" "}
                  <a href="https://clerk.com/legal/privacy" rel="noopener">
                    Clerk’s privacy policy
                  </a>
                </>
              ),
            },
            {
              term: "Cloudflare",
              detail: (
                <>
                  Hosting, the database and file storage. Like any web host it processes IP addresses and request
                  details to serve and protect the site, and tells us the country of your connection so we can show
                  prices in rupees or dollars. We do not store that country.{" "}
                  <a href="https://www.cloudflare.com/privacypolicy/" rel="noopener">
                    Cloudflare’s privacy policy
                  </a>
                </>
              ),
            },
            {
              term: mor,
              detail: (
                <>
                  Checkout, payment, tax and invoices, as Merchant of Record. {mor} collects your payment and billing
                  details as an independent controller under its own policy, and sends us the payment id, amount,
                  currency and status, plus the name, email and country you entered at checkout. We keep only what is
                  listed above.{" "}
                  <a href={DODO_PRIVACY_POLICY} rel="noopener">
                    {mor}’ privacy policy
                  </a>
                </>
              ),
            },
          ]}
        />
        <p>These companies may process data outside {site.owner.country}.</p>
      </>
    ),
  },
  {
    id: "cookies",
    title: "Cookies and local storage",
    content: (
      <>
        <p>
          There are no advertising or tracking cookies. Browsing the catalog signed out sets none at all. This is
          everything the site keeps in your browser:
        </p>
        <FactList
          items={[
            {
              term: "Clerk session cookies",
              detail: "Keep you signed in. Clerk sets them on the sign-in, sign-up, account and checkout pages.",
              meta: "Cookies · until you sign out or they expire",
            },
            {
              term: "iu_signed_in",
              detail:
                "Holds the value 1 while you are signed in, so static pages know to fetch your bookmarks and Pro code. It grants nothing by itself.",
              meta: "Cookie · up to 30 days",
            },
            {
              term: "iloveui.mode",
              detail: "Your light or dark theme choice.",
              meta: "Local storage",
            },
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
              term: "iloveui.bookmarks",
              detail: "Bookmarked designs, so bookmarks work before you sign in.",
              meta: "Local storage",
            },
            {
              term: "iloveui.bookmarks.merged",
              detail: "Marks that this browser’s bookmarks were added to your account, so they merge only once.",
              meta: "Local storage",
            },
            {
              term: "iloveui.recent",
              detail: "The last few designs and pages you opened from search.",
              meta: "Local storage",
            },
            {
              term: "iloveui.session-refresh",
              detail: "Stops the site from refreshing an expired sign-in more than once in a row.",
              meta: "Session storage · cleared when the tab closes",
            },
          ]}
        />
        <p>Local storage never leaves your browser. Clearing your site data removes all of it.</p>
      </>
    ),
  },
  {
    id: "your-rights",
    title: "Access, correction and deletion",
    content: (
      <>
        <p>
          Email {email} from your account’s address to get a copy of your data, correct it, or delete your account, and
          you will get an answer from the same address.
        </p>
        <p>
          Deleting your account removes your email address, CLI token, bookmarks and Team seats. Purchase records stay,
          without your email, because tax law requires them and so a refund or invoice can still be processed. Your
          bookmarks and theme in this browser stay until you clear your site data.
        </p>
      </>
    ),
  },
  {
    id: "changes",
    title: "Changes",
    content: (
      <p>When this policy changes, the date at the top changes with it. Earlier versions are available on request.</p>
    ),
  },
  {
    id: "contact",
    title: "Contact",
    content: (
      <p>
        Questions or requests go to {email}. The <Link href="/contact">contact page</Link> has more ways we can help.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Privacy policy"
      title={
        <>
          We keep <Emphasis>very</Emphasis> little.
        </>
      }
      intro={<p>What {site.name} stores, why it needs it, who helps run the service, and how to have it removed.</p>}
      summary={[
        "Browsing signed out stores nothing about you and sets no cookies.",
        "Signed in, we store your email, your purchases, a hash of your CLI token and your bookmarks.",
        `Card details go to ${mor}, our Merchant of Record, and never reach us.`,
        "No advertising, no analytics trackers, no selling data.",
        `Email ${site.supportEmail} to get a copy of your data or delete your account.`,
      ]}
      updated={LEGAL_UPDATED}
      sections={sections}
      related={[RELATED.terms, RELATED.license, RELATED.contact]}
    />
  );
}
