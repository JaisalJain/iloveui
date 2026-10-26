import Link from "next/link";
import { Logo } from "./logo";
import { SearchTrigger } from "./search-trigger";
import { ThemeToggle } from "./theme-toggle";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-canvas">
      <div className="page-frame flex h-14 items-center gap-6 sm:h-16">
        <Link href="/" aria-label="iloveui home" className="group -m-2 inline-flex rounded-control p-2">
          <Logo aria-hidden className="h-5 w-auto text-fg" />
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <SearchTrigger />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
