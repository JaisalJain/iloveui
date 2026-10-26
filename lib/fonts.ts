import localFont from "next/font/local";

// Self-hosted latin subsets in public/fonts. The same files back the preview iframes through @font-face.
export const interTight = localFont({
  src: "../public/fonts/inter-tight-latin-var.woff2",
  weight: "100 900",
  style: "normal",
  variable: "--font-inter-tight",
  display: "swap",
});

export const instrumentSerif = localFont({
  src: [{ path: "../public/fonts/instrument-serif-italic-latin.woff2", weight: "400", style: "italic" }],
  variable: "--font-instrument-serif",
  display: "swap",
  adjustFontFallback: "Times New Roman",
});

export const jetbrainsMono = localFont({
  src: "../public/fonts/jetbrains-mono-latin-var.woff2",
  weight: "100 800",
  style: "normal",
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const fontVariables = [interTight.variable, instrumentSerif.variable, jetbrainsMono.variable].join(" ");
