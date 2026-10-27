import { collectionOg, collectionParams } from "@/components/collections/collection-data";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/og";

export const alt = "An iloveui collection.";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const dynamicParams = false;
export const generateStaticParams = collectionParams;

export default async function OpengraphImage({ params }: { params: Promise<{ slug: string }> }) {
  return renderOgImage(collectionOg((await params).slug));
}
