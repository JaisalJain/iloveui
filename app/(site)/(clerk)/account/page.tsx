import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { AccountSection, DetailRow, Panel } from "@/components/account/account-section";
import { BookmarkList } from "@/components/account/bookmark-list";
import { CheckoutStatus } from "@/components/account/checkout-status";
import { formatDate, formatDateTime } from "@/components/account/format";
import { LicensePanel } from "@/components/account/license-panel";
import { SeatsPanel } from "@/components/account/seats-panel";
import { TokenPanel } from "@/components/account/token-panel";
import { getViewer } from "@/lib/auth";
import { listBookmarks } from "@/lib/bookmarks";
import { getAllDesigns, getDesign } from "@/lib/catalog";
import { getDb } from "@/lib/db";
import { getAccountSummary, REFUND_WINDOW_DAYS } from "@/lib/licenses";
import { site } from "@/lib/site";
import { getTokenInfo } from "@/lib/tokens";

export const metadata: Metadata = {
  title: "Account",
  description: "Your iloveui license, CLI token, Team seats and bookmarks.",
  robots: { index: false, follow: false },
};

/** Spec section 10, word for word, with this deployment's base URL. */
function componentsJson(siteUrl: string): string {
  return [
    `"registries": {`,
    `  "@iloveui": {`,
    `    "url": "${siteUrl}/r/{name}.json",`,
    `    "headers": {`,
    `      "Authorization": "Bearer \${ILOVEUI_TOKEN}"`,
    `    }`,
    `  }`,
    `}`,
  ].join("\n");
}

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ checkout?: string }> }) {
  // The middleware already redirects signed-out visitors; the page checks again because it is the boundary.
  const viewer = await getViewer();
  if (!viewer) redirect("/sign-in?redirect_url=%2Faccount");

  const db = getDb();
  const [summary, token, slugs, { checkout }] = await Promise.all([
    getAccountSummary(db, viewer),
    getTokenInfo(db, viewer.id),
    listBookmarks(db, viewer.id),
    searchParams,
  ]);
  const bookmarked = slugs.map((slug) => getDesign(slug)).filter((design) => design !== undefined);
  const example = getAllDesigns().find((design) => design.tier === "pro") ?? getAllDesigns()[0];
  const siteUrl = site.url.replace(/\/$/, "");
  const planLabel = summary.access.pro ? (summary.access.plan === "team" ? "Team" : "Pro") : "Free";

  return (
    <div className="page-frame pt-12 pb-8 sm:pt-20">
      <header className="pb-10">
        <p className="label-mono text-muted">Account</p>
        <h1 className="mt-4 text-40 font-semibold text-balance sm:text-64">
          Your <em className="font-serif font-normal tracking-normal">account.</em>
        </h1>
        <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-14 text-muted">
          <span className="break-all">
            <span className="sr-only">Signed in as </span>
            {viewer.email || "No email address on file"}
          </span>
          <span aria-hidden>·</span>
          <span className={summary.access.pro ? "text-accent" : undefined} data-plan>
            {planLabel}
          </span>
        </p>
        {checkout === "success" ? <CheckoutStatus pro={summary.access.pro} /> : null}
      </header>

      <AccountSection
        id="license"
        title="License"
        description={`Your plan, receipt and refund. Self-serve refunds are open for ${REFUND_WINDOW_DAYS} days after purchase.`}
      >
        <LicensePanel summary={summary} />
      </AccountSection>

      <AccountSection
        id="cli"
        title="CLI access"
        description="One personal token installs designs with the shadcn CLI. Keep it out of your repository."
      >
        <TokenPanel
          token={
            token
              ? {
                  createdAt: formatDate(token.createdAt),
                  lastUsedAt: token.lastUsedAt ? formatDateTime(token.lastUsedAt) : null,
                }
              : null
          }
          pro={summary.access.pro}
          envLine="ILOVEUI_TOKEN=ilui_live_..."
          componentsJson={componentsJson(siteUrl)}
          installCommand={`npx shadcn@latest add @iloveui/${example?.slug ?? "<slug>"}`}
        />
      </AccountSection>

      {summary.seats ? (
        <AccountSection
          id="team"
          title="Team"
          description={`Up to ${summary.seatLimit} people share your Team license, you included. Invites become seats when that address signs in.`}
        >
          <SeatsPanel
            limit={summary.seatLimit}
            seats={summary.seats.map((seat) => ({
              id: seat.id,
              email: seat.email,
              status: seat.status,
              since: formatDate(seat.invitedAt),
              isOwner: seat.isOwner,
            }))}
          />
        </AccountSection>
      ) : null}

      <AccountSection
        id="bookmarks"
        title="Bookmarks"
        description="Designs you saved, synced across the browsers you sign in on."
      >
        <BookmarkList designs={bookmarked} />
      </AccountSection>

      <AccountSection id="profile" title="Account" description="Sign-in is handled by Clerk.">
        <Panel>
          <dl className="divide-y divide-hairline">
            <DetailRow label="Email">
              <span className="font-mono break-all">{viewer.email || "No email address on file"}</span>
            </DetailRow>
          </dl>
          <div className="border-t border-hairline px-5 py-4 sm:px-6">
            <SignOutButton />
          </div>
        </Panel>
      </AccountSection>
    </div>
  );
}
