import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { FREE_PLAN, PAID_PLANS, formatPrice } from "@/config/pricing";
import { buttonClasses } from "@/components/ui/button-classes";
import { REFUND_WINDOW_DAYS, type AccountSummary } from "@/lib/licenses";
import { DetailRow, Panel } from "./account-section";
import { formatDate } from "./format";
import { RefundButton } from "./refund-button";

function StatusPill({ tone, children }: { tone: "active" | "muted"; children: string }) {
  return (
    <span className="inline-flex h-6 items-center gap-2 rounded-full border border-hairline px-2.5 font-mono text-12 text-muted">
      <span aria-hidden className={`size-1.5 rounded-full ${tone === "active" ? "bg-accent" : "bg-muted"}`} />
      {children}
    </span>
  );
}

function PanelHeader({ title, pill, lead }: { title: string; pill: ReactNode; lead: string }) {
  return (
    <div className="flex flex-col gap-3 px-5 pt-5 pb-4 sm:px-6 sm:pt-6">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-28 font-semibold">{title}</p>
        {pill}
      </div>
      <p className="max-w-lg text-14 text-pretty text-muted">{lead}</p>
    </div>
  );
}

export function LicensePanel({ summary }: { summary: AccountSummary }) {
  const { license, seat, access } = summary;
  const ownsActive = license?.status === "active";

  return (
    <div className="flex flex-col gap-4" data-license-status={access.pro ? "pro" : "free"}>
      {seat && !ownsActive ? (
        <Panel>
          <PanelHeader
            title="Pro"
            pill={<StatusPill tone="active">Team seat</StatusPill>}
            lead="Every design is unlocked through a seat on a Team license. The owner manages seats and billing."
          />
          <dl className="divide-y divide-hairline border-t border-hairline">
            <DetailRow label="Team owner">
              <span className="font-mono break-all">{seat.ownerEmail}</span>
            </DetailRow>
            <DetailRow label="Member since">{formatDate(seat.since)}</DetailRow>
          </dl>
        </Panel>
      ) : null}

      {license ? (
        <Panel>
          <PanelHeader
            title={PAID_PLANS[license.plan].name}
            pill={
              ownsActive ? (
                <StatusPill tone="active">Active</StatusPill>
              ) : (
                <StatusPill tone="muted">Refunded</StatusPill>
              )
            }
            lead={
              ownsActive
                ? license.plan === "team"
                  ? "Every current and future design, for you and up to 9 people you invite."
                  : "Every current and future design, yours for good."
                : "This purchase was refunded, so its Pro access has ended."
            }
          />
          <dl className="divide-y divide-hairline border-t border-hairline">
            <DetailRow label="Plan">
              {license.plan === "team"
                ? `Team, lifetime, up to ${summary.seatLimit} people`
                : "Pro, lifetime, 1 person"}
            </DetailRow>
            <DetailRow label="Purchased">{formatDate(license.purchasedAt)}</DetailRow>
            <DetailRow label="Amount">
              {formatPrice(license.amountMinor, license.currency)}{" "}
              <span className="font-mono text-12 text-muted">{license.currency}</span>
            </DetailRow>
            <DetailRow label="Paid with">
              {license.provider === "local" ? "Local test checkout (no real charge)" : "Dodo Payments"}
            </DetailRow>
            <DetailRow label="Refund">
              {!ownsActive
                ? "Refunded"
                : license.refundable
                  ? `Available until ${formatDate(license.refundDeadline)}`
                  : `The ${REFUND_WINDOW_DAYS}-day window closed on ${formatDate(license.refundDeadline)}`}
            </DetailRow>
          </dl>
          {license.invoiceAvailable || (ownsActive && license.refundable) ? (
            <div className="flex flex-col gap-4 border-t border-hairline px-5 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-6">
              {license.invoiceAvailable ? (
                <a
                  href={`/api/invoice/${license.id}`}
                  target="_blank"
                  rel="noopener"
                  className={buttonClasses({ variant: "outline", size: "sm" })}
                >
                  {license.provider === "local" ? "Test receipt" : "Invoice"}
                  <ArrowUpRight size={16} strokeWidth={1.5} aria-hidden />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              ) : (
                <span />
              )}
              {ownsActive && license.refundable ? (
                <RefundButton
                  licenseId={license.id}
                  amount={formatPrice(license.amountMinor, license.currency)}
                  deadline={formatDate(license.refundDeadline)}
                  team={license.plan === "team"}
                />
              ) : null}
            </div>
          ) : null}
        </Panel>
      ) : null}

      {!access.pro ? (
        <Panel>
          <PanelHeader
            title="Free"
            pill={<StatusPill tone="muted">No Pro access</StatusPill>}
            lead={`${FREE_PLAN.designs} designs are free for personal and commercial work. Pro unlocks every design, current and future, with one payment.`}
          />
          <div className="border-t border-hairline px-5 py-4 sm:px-6">
            <Link href="/pricing" className={buttonClasses({ variant: "primary", size: "md" })}>
              See pricing
            </Link>
          </div>
        </Panel>
      ) : null}
    </div>
  );
}
