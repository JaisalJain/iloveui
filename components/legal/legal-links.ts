import type { Route } from "next";
import { site } from "@/lib/site";

/** The date the legal pages last changed. Update it with any change to their substance. */
export const LEGAL_UPDATED = "2026-10-27";

/** Dodo Payments' own documents, which govern the purchase transaction and the payment data Dodo collects. */
export const DODO_BUYER_TERMS = "https://dodopayments.com/legal/buyer-terms";
export const DODO_PRIVACY_POLICY = "https://dodopayments.com/privacy-policy";

/** How the Merchant of Record arrangement is described everywhere on the site. */
export const MERCHANT_OF_RECORD_LINE = `Payments are processed by ${site.merchantOfRecord}, our Merchant of Record and authorized reseller, which handles payment, sales tax, VAT and GST, and invoicing.`;

export type RelatedLink = { href: Route; label: string; description: string };

export const RELATED: Record<"license" | "terms" | "privacy" | "refunds" | "contact" | "pricing", RelatedLink> = {
  license: { href: "/license", label: "License", description: "What you may build with the designs." },
  terms: { href: "/terms", label: "Terms", description: "The agreement for buying and using iloveui." },
  privacy: { href: "/privacy", label: "Privacy", description: "What we store, why, and for how long." },
  refunds: {
    href: "/refunds",
    label: "Refunds",
    description: `Full refund within ${site.refundWindowDays} days, no questions asked.`,
  },
  contact: { href: "/contact", label: "Contact", description: `Write to ${site.supportEmail}.` },
  pricing: { href: "/pricing", label: "Pricing", description: "Free, Pro and Team, with one lifetime payment." },
};
