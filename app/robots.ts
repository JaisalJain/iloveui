import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

// Crawl the site; skip API routes, the account area, checkout, development-only pages, the bare preview frames
// (each design page already shows them) and the shadcn registry JSON.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/account", "/dev/", "/checkout", "/preview/", "/r/"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
