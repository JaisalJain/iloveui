import type { Metadata } from "next";
import { BrowsePage, browseMetadata, categoryParams, resolveRoute } from "@/components/browse/browse-page";

export const dynamicParams = false;

export function generateStaticParams() {
  return categoryParams();
}

export async function generateMetadata({ params }: PageProps<"/designs/[category]">): Promise<Metadata> {
  const { category } = await params;
  resolveRoute(category, null);
  return browseMetadata(category, 1);
}

export default async function CategoryPage({ params }: PageProps<"/designs/[category]">) {
  const { category } = await params;
  resolveRoute(category, null);
  return <BrowsePage categorySlug={category} page={1} />;
}
