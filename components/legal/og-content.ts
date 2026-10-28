import type { OgContent } from "@/lib/og";
import { site } from "@/lib/site";

// Open Graph image text for the legal and contact pages, drawn by renderOgImage in lib/og.tsx.

export const LEGAL_OG = {
  license: {
    eyebrow: "License",
    title: "Use it, change it,",
    emphasis: "share",
    titleEnd: "it.",
    description: "Every design is MIT licensed: personal or commercial, as is or modified. Keep the copyright notice.",
    meta: "MIT License",
  },
  privacy: {
    eyebrow: "Privacy",
    title: "We collect",
    emphasis: "nothing",
    titleEnd: "about you.",
    description: "No accounts, no analytics, no tracking cookies. Your theme settings stay in your browser.",
    meta: "No personal data",
  },
  contact: {
    eyebrow: "Contact",
    title: "Write to a",
    emphasis: "person.",
    description: `Licenses, refunds, invoices and bugs all go to ${site.supportEmail}.`,
    meta: site.supportEmail,
  },
} satisfies Record<string, OgContent>;
