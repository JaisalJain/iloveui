import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PreviewRuntime } from "@/components/preview/preview-runtime";
import { getAllDesigns, getDesign } from "@/lib/catalog";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllDesigns().map((design) => ({ slug: design.slug }));
}

export async function generateMetadata({ params }: PageProps<"/preview/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const design = getDesign(slug);
  if (!design) notFound();
  return {
    title: `${design.name} preview`,
    description: `Live preview of ${design.name}.`,
    robots: { index: false, follow: false },
  };
}

export default async function PreviewPage({ params }: PageProps<"/preview/[slug]">) {
  const { slug } = await params;
  const design = getDesign(slug);
  if (!design) notFound();
  return <PreviewRuntime slug={design.slug} states={design.states} />;
}
