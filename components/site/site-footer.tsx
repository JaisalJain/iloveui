import { Keyboard } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { monetizationEnabled } from "@/lib/monetization";
import { site } from "@/lib/site";
import { DevRegionSwitcher } from "./dev-region-switcher";
import { Logo } from "./logo";
import { ShortcutsButton } from "./shortcuts-button";

// Evaluated when the module loads (build time for static pages), not during render.
const YEAR = new Date().getFullYear();

const COLUMNS: { title: string; links: { href: Route; label: string; plain?: boolean }[] }[] = [
  {
    title: "Product",
    links: [
      { href: "/designs", label: "Designs" },
      { href: "/collections", label: "Collections" },
      ...(monetizationEnabled() ? [{ href: "/pricing" as Route, label: "Pricing" }] : []),
      { href: "/changelog", label: "Changelog" },
    ],
  },
  {
    title: "Resources",
    links: [
      { href: "/docs", label: "Docs" },
      { href: "/docs/installation" as Route, label: "Installation" },
      { href: "/docs/cli" as Route, label: "CLI" },
      { href: "/docs/theming" as Route, label: "Theming" },
      // A plain text file for agents, not a page: a normal link, never prefetched as a route.
      { href: "/llms.txt", label: "llms.txt", plain: true },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/license", label: "License" },
      { href: "/privacy", label: "Privacy" },
      { href: "/contact", label: "Contact" },
    ],
  },
];

const LINK =
  "inline-flex min-h-10 items-center rounded-control text-14 text-muted transition-colors duration-160 ease-site hover:text-fg pointer-fine:min-h-7";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-hairline">
      <div className="page-frame grid gap-12 py-12 sm:py-16 lg:grid-cols-12 lg:gap-6">
        <div className="lg:col-span-5">
          <Link href="/" aria-label="iloveui home" className="-m-2 inline-flex rounded-control p-2">
            <Logo aria-hidden className="h-5 w-auto text-fg" />
          </Link>
          <p className="mt-4 max-w-sm text-14 text-muted">{site.description}</p>
          <a
            href={`mailto:${site.supportEmail}`}
            className="mt-6 inline-flex min-h-10 items-center rounded-control font-mono text-14 text-fg underline decoration-control underline-offset-4 transition-colors hover:decoration-fg pointer-fine:min-h-6"
          >
            {site.supportEmail}
          </a>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-6 lg:col-start-7">
          {COLUMNS.map((column) => (
            <nav key={column.title} aria-labelledby={`footer-${column.title.toLowerCase()}`}>
              <h2 id={`footer-${column.title.toLowerCase()}`} className="label-mono text-muted">
                {column.title}
              </h2>
              <ul className="mt-3">
                {column.links.map((link) => (
                  <li key={link.href}>
                    {link.plain ? (
                      <a href={link.href} className={`${LINK} font-mono`}>
                        {link.label}
                      </a>
                    ) : (
                      <Link href={link.href} prefetch={false} className={LINK}>
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>
      <div className="page-frame flex flex-wrap items-center justify-between gap-4 border-t border-hairline py-6">
        <p className="text-12 text-muted">
          © {YEAR} {site.name}. Open source under the MIT License.
        </p>
        <div className="flex flex-wrap items-center gap-4">
          {process.env.NODE_ENV === "development" && monetizationEnabled() ? <DevRegionSwitcher /> : null}
          <ShortcutsButton icon={<Keyboard size={16} strokeWidth={1.5} aria-hidden />} />
        </div>
      </div>
    </footer>
  );
}
