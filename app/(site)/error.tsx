"use client";

import { RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SiteError({ error, retry }: { error: unknown; retry: () => void }) {
  const digest =
    typeof error === "object" && error !== null && "digest" in error
      ? String((error as { digest: unknown }).digest)
      : null;
  return (
    <section role="alert" className="page-frame flex flex-col items-start pt-24 pb-16 sm:pt-32">
      <p className="label-mono text-muted">Something went wrong</p>
      <h1 className="mt-4 max-w-2xl text-40 font-semibold sm:text-64">
        {"That didn't load. "}
        <em className="font-serif font-normal tracking-normal">Our side.</em>
      </h1>
      <p className="mt-6 max-w-lg text-16 text-muted">
        The page hit an error while rendering. Trying again usually works; if it keeps happening, email us the reference
        below.
      </p>
      {digest ? <p className="mt-4 font-mono text-12 text-muted">Reference {digest}</p> : null}
      <Button variant="primary" size="lg" className="mt-10" onClick={() => retry()}>
        <RotateCw size={16} strokeWidth={1.5} aria-hidden />
        Try again
      </Button>
    </section>
  );
}
