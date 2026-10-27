import { Moon, Search, Sun } from "lucide-react";
import Link from "next/link";
import { AccountLink } from "./account-link";
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
          <SearchTrigger icon={<Search size={16} strokeWidth={1.5} aria-hidden />} />
          <ThemeToggle
            sunIcon={<Sun size={16} strokeWidth={1.5} aria-hidden />}
            moonIcon={<Moon size={16} strokeWidth={1.5} aria-hidden />}
          />
          <AccountLink />
        </div>
      </div>
    </header>
  );
}
