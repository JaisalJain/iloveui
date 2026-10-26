import "./globals.css";
import type { Metadata } from "next";
import { NotFoundContent } from "@/components/site/not-found-content";
import { SiteChrome } from "@/components/site/site-chrome";

export const metadata: Metadata = {
  title: "Page not found",
  description: "The page you asked for does not exist on iloveui.",
};

// Unmatched URLs render outside the (site) layout, so this page brings the chrome itself.
export default function RootNotFound() {
  return (
    <SiteChrome>
      <NotFoundContent />
    </SiteChrome>
  );
}
