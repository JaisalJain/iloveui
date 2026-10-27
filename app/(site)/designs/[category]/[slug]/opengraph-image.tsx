import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/og";
import { designOg, designParams } from "@/lib/og-content";

export const alt = "An iloveui design.";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const dynamicParams = false;
export const generateStaticParams = designParams;

export default async function OpengraphImage({ params }: { params: Promise<{ category: string; slug: string }> }) {
  return renderOgImage(designOg((await params).slug));
}
