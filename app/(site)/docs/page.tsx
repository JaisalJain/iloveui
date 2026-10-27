import type { Metadata } from "next";
import { DocsShell } from "@/components/docs/docs-shell";
import { docTitle, requireDocPage } from "@/lib/docs";
import Overview, { toc } from "@/content/docs/overview.mdx";

const page = requireDocPage("overview");

export const metadata: Metadata = {
  title: docTitle(page),
  description: page.description,
  alternates: { canonical: page.href },
};

export default function DocsOverviewPage() {
  return (
    <DocsShell
      slug={page.slug}
      toc={toc}
      title={
        <>
          Pick, theme, then <em className="font-serif font-normal italic">ship</em>.
        </>
      }
    >
      <Overview />
    </DocsShell>
  );
}
