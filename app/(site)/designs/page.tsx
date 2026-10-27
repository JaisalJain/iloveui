import type { Metadata } from "next";
import { BrowsePage, browseMetadata } from "@/components/browse/browse-page";

export const dynamic = "force-static";

export const metadata: Metadata = browseMetadata(null, 1);

export default function DesignsPage() {
  return <BrowsePage categorySlug={null} page={1} />;
}
