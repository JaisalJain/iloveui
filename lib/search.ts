import type Fuse from "fuse.js";
import type { FuseOptionKey } from "fuse.js";

// Client-side search for the Cmd+K palette and the /designs search field. Fuse.js is loaded on first use so it
// never weighs on a page's initial JavaScript.

/** Splits a query into words and strips Fuse extended-search operators, so user input is always plain text. */
export function queryTokens(query: string): string[] {
  return query
    .toLowerCase()
    .split(/\s+/)
    .map((token) => token.replace(/^[!'^=]+/, "").replace(/\$+$/, ""))
    .filter((token) => token.length > 0);
}

/** Every word must match one of the fields (fuzzily, through Fuse's extended search syntax). */
export function toFuseQuery(query: string): string {
  return queryTokens(query).join(" ");
}

/** Instant fallback while Fuse loads: every word must appear in at least one field. */
export function matchesAllTokens(fields: readonly (string | undefined)[], query: string): boolean {
  const haystack = fields.filter(Boolean).join(" ").toLowerCase();
  return queryTokens(query).every((token) => haystack.includes(token));
}

let fusePromise: Promise<typeof Fuse> | null = null;

export function loadFuse(): Promise<typeof Fuse> {
  fusePromise ??= import("fuse.js").then((mod) => mod.default);
  return fusePromise;
}

export function createSearcher<T>(FuseClass: typeof Fuse, items: readonly T[], keys: FuseOptionKey<T>[]): Fuse<T> {
  return new FuseClass(items, {
    keys,
    threshold: 0.34,
    ignoreLocation: true,
    ignoreDiacritics: true,
    useExtendedSearch: true,
    includeScore: true,
  });
}
