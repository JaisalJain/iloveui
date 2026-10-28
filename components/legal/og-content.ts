import type { OgContent } from "@/lib/og";

// Open Graph image text for the legal pages, drawn by renderOgImage in lib/og.tsx.

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
} satisfies Record<string, OgContent>;
