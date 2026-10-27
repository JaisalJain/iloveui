import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/og";
import { catalogOg, catalogPageParams } from "@/lib/og-content";

export const alt = "iloveui designs, a later page of the catalog.";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const dynamicParams = false;
export const generateStaticParams = catalogPageParams;

export default async function OpengraphImage({ params }: { params: Promise<{ n: string }> }) {
  return renderOgImage(catalogOg(Number((await params).n)));
}
