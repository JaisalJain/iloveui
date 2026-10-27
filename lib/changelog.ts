// The changelog: one MDX file per entry in content/changelog/, named <YYYY-MM-DD>-<topic>.mdx, each starting with
//
//   export const metadata = { date: "2026-10-27", title: "...", summary: "..." };
//
// The file name (without .mdx) is the entry's slug and its anchor on /changelog. Entries are listed newest first;
// entries on the same date list in reverse file-name order. The glob is resolved at build time, so nothing here
// touches a filesystem on Workers.

export type ChangelogEntry = { slug: string; date: string; title: string; summary: string };

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Whole modules, not `import: "metadata"`: the production build does not honour that option.
const MODULES = import.meta.glob<Record<string, unknown>>("/content/changelog/*.mdx", { eager: true });

function slugOf(path: string): string {
  return path.slice(path.lastIndexOf("/") + 1).replace(/\.mdx$/, "");
}

function text(value: unknown, field: string, slug: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`content/changelog/${slug}.mdx: metadata.${field} must be a non-empty string`);
  }
  return value.trim();
}

/** Validates the exported metadata of every entry and sorts newest first. Throws on any malformed entry. */
export function toChangelogEntries(modules: Record<string, unknown>): ChangelogEntry[] {
  const entries = Object.entries(modules).map(([path, metadata]): ChangelogEntry => {
    const slug = slugOf(path);
    if (!SLUG.test(slug)) throw new Error(`content/changelog/${slug}.mdx: file names are lowercase kebab-case`);
    const value = (typeof metadata === "object" && metadata !== null ? metadata : {}) as Record<string, unknown>;
    const date = text(value.date, "date", slug);
    if (!DATE.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00Z`))) {
      throw new Error(`content/changelog/${slug}.mdx: metadata.date must be an ISO date (YYYY-MM-DD)`);
    }
    return { slug, date, title: text(value.title, "title", slug), summary: text(value.summary, "summary", slug) };
  });
  return entries.sort((a, b) => b.date.localeCompare(a.date) || b.slug.localeCompare(a.slug));
}

let cached: ChangelogEntry[] | undefined;

function metadataOf(path: string, module: Record<string, unknown>): unknown {
  if ("metadata" in module) return module.metadata;
  throw new Error(
    `${path.slice(1)}: no \`export const metadata\` (exports: ${Object.keys(module).join(", ") || "none"})`,
  );
}

/** Every changelog entry, newest first. Synchronous; safe in server components and route handlers. */
export function getChangelogEntries(): ChangelogEntry[] {
  cached ??= toChangelogEntries(
    Object.fromEntries(Object.entries(MODULES).map(([path, module]) => [path, metadataOf(path, module)])),
  );
  return cached.map((entry) => ({ ...entry }));
}

/** The anchor of an entry on /changelog, for links from other pages. */
export function changelogHref(slug: string): string {
  return `/changelog#${slug}`;
}
