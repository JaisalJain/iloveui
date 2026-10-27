import type { Metadata } from "next";
import { BrowsePage, browseMetadata, categoryPageParams, resolveRoute } from "@/components/browse/browse-page";

export const dynamicParams = false;

export function generateStaticParams() {
  return categoryPageParams();
}

export async function generateMetadata({ params }: PageProps<"/designs/[category]/page/[n]">): Promise<Metadata> {
  const { category, n } = await params;
  const { page } = resolveRoute(category, n);
  return browseMetadata(category, page);
}

export default async function CategoryPageN({ params }: PageProps<"/designs/[category]/page/[n]">) {
  const { category, n } = await params;
  const { page } = resolveRoute(category, n);
  return <BrowsePage categorySlug={category} page={page} />;
}
