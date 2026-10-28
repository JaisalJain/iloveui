import path from "node:path";
import createMDX from "@next/mdx";
import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

// Gives `next dev` the local D1 and R2 emulation through wrangler (state in .wrangler/state/v3).
initOpenNextCloudflareForDev();

const nextConfig: NextConfig = {
  typedRoutes: true,
  cacheComponents: false,
  poweredByHeader: false,
  agentRules: false,
  images: { unoptimized: true },
  // Inlined at build time so server, client and middleware bundles read the same value (lib/monetization.ts).
  env: { MONETIZATION_ENABLED: process.env.MONETIZATION_ENABLED === "true" ? "true" : "false" },
  // Sandboxed thumbnails have an opaque origin, so their font requests are cross-origin (public/_headers does the
  // same for the deployed static assets).
  async headers() {
    return [{ source: "/fonts/:path*", headers: [{ key: "Access-Control-Allow-Origin", value: "*" }] }];
  },
  turbopack: {
    rules: {
      // OG image fonts (assets/fonts) are imported as bytes so the image routes never touch the filesystem.
      "*.ttf": { condition: { not: "foreign" }, type: "bytes" },
    },
  },
};

// MDX for the docs and changelog in content/. Turbopack takes plugins only as serializable values, so the local
// rehype plugin (heading ids, the on-page contents, build-time code highlighting) is passed as an absolute path.
const withMDX = createMDX({
  options: { rehypePlugins: [path.join(process.cwd(), "lib/mdx/rehype-docs.mjs")] },
});

export default withMDX(nextConfig);
