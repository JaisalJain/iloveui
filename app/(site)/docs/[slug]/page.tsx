import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DocsShell } from "@/components/docs/docs-shell";
import { DOC_SLUGS, docTitle, getDocPage } from "@/lib/docs";

type DocModule = typeof import("@/content/docs/cli.mdx");

// One static import per page keeps every docs page in the build graph; generateStaticParams prerenders them all.
const CONTENT: Record<string, () => Promise<DocModule>> = {
  installation: () => import("@/content/docs/installation.mdx"),
  cli: () => import("@/content/docs/cli.mdx"),
  theming: () => import("@/content/docs/theming.mdx"),
  "ai-prompts": () => import("@/content/docs/ai-prompts.mdx"),
  license: () => import("@/content/docs/license.mdx"),
};

export const dynamicParams = false;

export function generateStaticParams() {
  return DOC_SLUGS.map((slug) => ({ slug }));
}

function resolve(slug: string) {
  const page = getDocPage(slug);
  const load = CONTENT[slug];
  if (!page || !load) notFound();
  return { page, load };
}

export async function generateMetadata({ params }: PageProps<"/docs/[slug]">): Promise<Metadata> {
  const { page } = resolve((await params).slug);
  return { title: docTitle(page), description: page.description, alternates: { canonical: page.href } };
}

export default async function DocPage({ params }: PageProps<"/docs/[slug]">) {
  const { page, load } = resolve((await params).slug);
  const { default: Content, toc } = await load();
  return (
    <DocsShell slug={page.slug} toc={toc}>
      <Content />
    </DocsShell>
  );
}
