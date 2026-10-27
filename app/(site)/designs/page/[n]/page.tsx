import type { Metadata } from "next";
import { BrowsePage, browseMetadata, pageParams, resolveRoute } from "@/components/browse/browse-page";

export const dynamicParams = false;

export function generateStaticParams() {
  return pageParams(null);
}

export async function generateMetadata({ params }: PageProps<"/designs/page/[n]">): Promise<Metadata> {
  const { page } = resolveRoute(null, (await params).n);
  return browseMetadata(null, page);
}

export default async function DesignsPageN({ params }: PageProps<"/designs/page/[n]">) {
  const { page } = resolveRoute(null, (await params).n);
  return <BrowsePage categorySlug={null} page={page} />;
}
