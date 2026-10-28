"use client";

// The (site) error boundary's content, loaded only when an error is shown (see app/(site)/error.tsx).
import { RotateCw } from "lucide-react";
import Link from "next/link";
import { buttonClasses } from "@/components/ui/button-classes";
import { site } from "@/lib/site";

export default function SiteErrorContent({ error, retry }: { error: unknown; retry: () => void }) {
  const digest =
    typeof error === "object" && error !== null && "digest" in error
      ? String((error as { digest: unknown }).digest)
      : null;
  const issue = `${site.repository}/issues/new?title=${encodeURIComponent(digest ? `Error ${digest}` : "Page error")}`;
  return (
    <section role="alert" className="page-frame flex flex-col items-start pt-24 pb-16 sm:pt-32">
      <p className="label-mono text-muted">Something went wrong</p>
      <h1 className="mt-4 max-w-2xl text-40 font-semibold sm:text-64">
        {"That didn't load. "}
        <em className="font-serif font-normal tracking-normal">Our side.</em>
      </h1>
      <p className="mt-6 max-w-lg text-16 text-muted">
        The page hit an error while rendering, and it is a bug on our side, not something you did. Trying again usually
        works; if it keeps happening, report it and we will fix it.
      </p>
      {digest ? (
        <p className="mt-6 rounded-control border border-hairline bg-surface px-3 py-2 font-mono text-12 text-muted shadow-sm">
          Reference <span className="text-fg select-all">{digest}</span>
        </p>
      ) : null}
      <div className="mt-10 flex flex-wrap items-center gap-3">
        <button type="button" className={buttonClasses({ variant: "primary", size: "lg" })} onClick={() => retry()}>
          <RotateCw size={16} strokeWidth={1.5} aria-hidden />
          Try again
        </button>
        <Link href="/designs" className={buttonClasses({ variant: "outline", size: "lg" })}>
          Browse designs
        </Link>
      </div>
      <p className="mt-8 text-14 text-muted">
        Still broken?{" "}
        <a
          href={issue}
          rel="noopener"
          className="text-fg underline decoration-control underline-offset-4 hover:decoration-fg"
        >
          Open an issue on GitHub
        </a>
        {digest ? " with the reference above." : "."} Or go back to the{" "}
        <Link href="/" className="text-fg underline decoration-control underline-offset-4 hover:decoration-fg">
          home page
        </Link>
        .
      </p>
    </section>
  );
}
