import Link from "next/link";
import { buttonClasses } from "@/components/ui/button-classes";

export function NotFoundContent() {
  return (
    <section className="page-frame flex flex-col items-start pt-24 pb-16 sm:pt-32">
      <p className="label-mono text-muted">Error 404</p>
      <h1 className="mt-4 max-w-2xl text-40 font-semibold sm:text-64">
        {"This page doesn't "}
        <em className="font-serif font-normal tracking-normal">exist.</em>
      </h1>
      <p className="mt-6 max-w-lg text-16 text-muted">
        The link may be out of date, or the page may have moved. Everything that exists is one search away.
      </p>
      <Link href="/" className={buttonClasses({ variant: "primary", size: "lg", className: "mt-10" })}>
        Back to home
      </Link>
    </section>
  );
}
