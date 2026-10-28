// Site identity. Every page, legal text and metadata reads these values from here.
export const site = {
  name: "iloveui",
  // There is no public deployment: absolute URLs (canonical links, the sitemap, registry items) use
  // NEXT_PUBLIC_SITE_URL, so set it to your own origin when you deploy.
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  tagline: "UI you'll actually ship.",
  description: "Hand-built React and HTML designs. Re-theme them to your brand, then copy, install, or download.",
  repository: "https://github.com/JaisalJain/iloveui",
} as const;

export function absoluteUrl(path: string): string {
  return new URL(path, site.url).toString();
}
