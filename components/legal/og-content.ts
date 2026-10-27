import type { OgContent } from "@/lib/og";
import { site } from "@/lib/site";

// Open Graph image text for the legal and contact pages, drawn by renderOgImage in lib/og.tsx.

export const LEGAL_OG = {
  license: {
    eyebrow: "License",
    title: "Build anything.",
    emphasis: "Resell",
    titleEnd: "nothing.",
    description: "Unlimited personal and commercial end products, for you and your clients. No UI kits, no resale.",
    meta: "Free and Pro · same terms",
  },
  terms: {
    eyebrow: "Terms",
    title: "The terms, in",
    emphasis: "plain",
    titleEnd: "words.",
    description: `Lifetime Pro and Team licenses, sold through ${site.merchantOfRecord} as Merchant of Record.`,
    meta: `Governed by the laws of ${site.governingLaw}`,
  },
  privacy: {
    eyebrow: "Privacy",
    title: "We keep",
    emphasis: "very",
    titleEnd: "little.",
    description: "An email, your purchases, a hashed CLI token and your bookmarks. No card data, no ad trackers.",
    meta: "Clerk · Cloudflare · Dodo Payments",
  },
  refunds: {
    eyebrow: "Refunds",
    title: `${site.refundWindowDays} days,`,
    emphasis: "no",
    titleEnd: "questions.",
    description: `Request a full refund from your account page or by email within ${site.refundWindowDays} days of purchase.`,
    meta: `Full refund · ${site.refundWindowDays} days`,
  },
  contact: {
    eyebrow: "Contact",
    title: "Write to a",
    emphasis: "person.",
    description: `Licenses, refunds, invoices and bugs all go to ${site.supportEmail}.`,
    meta: site.supportEmail,
  },
} satisfies Record<string, OgContent>;
