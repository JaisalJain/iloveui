import type { Metadata } from "next";
import { HomeShortcutHints } from "@/components/site/home-shortcut-hints";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: `${site.name} · ${site.tagline}` },
  description: site.description,
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <section className="page-frame pt-24 pb-16 sm:pt-32">
      <h1 className="max-w-4xl text-40 font-semibold sm:text-64 lg:text-96">
        {"UI you'll "}
        <em className="font-serif font-normal tracking-normal">actually</em>
        {" ship."}
      </h1>
      <p className="mt-6 max-w-xl text-20 text-muted">{site.description}</p>
      <HomeShortcutHints />
    </section>
  );
}
