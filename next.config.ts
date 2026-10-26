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
  turbopack: {
    rules: {
      // OG image fonts (assets/fonts) are imported as bytes so the image routes never touch the filesystem.
      "*.ttf": { condition: { not: "foreign" }, type: "bytes" },
    },
  },
};

export default nextConfig;
