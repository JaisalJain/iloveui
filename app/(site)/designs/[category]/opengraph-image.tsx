import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/og";
import { categoryOg, categoryParams } from "@/lib/og-content";

export const alt = "An iloveui design category.";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const dynamicParams = false;
export const generateStaticParams = categoryParams;

export default async function OpengraphImage({ params }: { params: Promise<{ category: string }> }) {
  return renderOgImage(categoryOg((await params).category));
}
