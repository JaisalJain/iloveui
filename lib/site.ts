// Site identity. Every page, legal text and metadata reads these values from here.
export const site = {
  name: "iloveui",
  domain: "iloveui.dev",
  productionUrl: "https://iloveui.dev",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://iloveui.dev",
  tagline: "UI you'll actually ship.",
  description: "Hand-built React and HTML designs. Re-theme them to your brand, then copy, install, or download.",
  repository: "https://github.com/JaisalJain/iloveui",
} as const;

export function absoluteUrl(path: string): string {
  return new URL(path, site.url).toString();
}
