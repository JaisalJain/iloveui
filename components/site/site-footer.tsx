import Link from "next/link";
import { site } from "@/lib/site";
import { Logo } from "./logo";
import { ShortcutsButton } from "./shortcuts-button";

// Evaluated when the module loads (build time for static pages), not during render.
const YEAR = new Date().getFullYear();

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-hairline">
      <div className="page-frame grid gap-8 py-12 sm:grid-cols-12">
        <div className="sm:col-span-6">
          <Link href="/" aria-label="iloveui home" className="-m-2 inline-flex rounded-control p-2">
            <Logo aria-hidden className="h-5 w-auto text-fg" />
          </Link>
          <p className="mt-4 max-w-sm text-14 text-muted">{site.description}</p>
        </div>
        <div className="flex flex-col gap-2 text-14 sm:col-span-6 sm:items-end">
          <span className="label-mono text-muted">Support</span>
          <a
            href={`mailto:${site.supportEmail}`}
            className="text-fg underline decoration-muted underline-offset-4 transition-colors hover:decoration-fg"
          >
            {site.supportEmail}
          </a>
        </div>
      </div>
      <div className="page-frame flex flex-wrap items-center justify-between gap-4 border-t border-hairline py-6">
        <p className="text-12 text-muted">
          © {YEAR} {site.owner.name}, {site.owner.country}.
        </p>
        <ShortcutsButton />
      </div>
    </footer>
  );
}
