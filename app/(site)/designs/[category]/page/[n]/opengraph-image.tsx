import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/og";
import { categoryOg, categoryPageParams } from "@/lib/og-content";

export const alt = "An iloveui design category, a later page.";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const dynamicParams = false;
export const generateStaticParams = categoryPageParams;

export default async function OpengraphImage({ params }: { params: Promise<{ category: string; n: string }> }) {
  const { category, n } = await params;
  return renderOgImage(categoryOg(category, Number(n)));
}
