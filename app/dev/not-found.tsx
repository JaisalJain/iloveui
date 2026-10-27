import type { Metadata } from "next";
import { NotFoundContent } from "@/components/site/not-found-content";
import { SiteChrome } from "@/components/site/site-chrome";

export const metadata: Metadata = {
  title: "Page not found",
  description: "The page you asked for does not exist on iloveui.",
};

// Production builds answer every development-only page with the site's own 404.
export default function DevNotFound() {
  return (
    <SiteChrome>
      <NotFoundContent />
    </SiteChrome>
  );
}
