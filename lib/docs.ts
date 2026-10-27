import type { OgContent } from "@/lib/og";

// The docs in navigation order. Each page's body is content/docs/<slug>.mdx; titles and descriptions live here so
// navigation, metadata, Open Graph images, the sitemap and llms.txt read one list without compiling any MDX.

export type DocPage = { slug: string; href: string; title: string; description: string };

export const DOC_PAGES: DocPage[] = [
  {
    slug: "overview",
    href: "/docs",
    title: "Overview",
    description:
      "How iloveui fits together: browse, re-theme with Theme Lab, then copy, install with the shadcn CLI, download or hand the design to an AI agent.",
  },
  {
    slug: "installation",
    href: "/docs/installation",
    title: "Installation",
    description:
      "Add a design to a React + Tailwind v4 app or a plain HTML page: the tokens, the component, fonts and dark mode.",
  },
  {
    slug: "cli",
    href: "/docs/cli",
    title: "CLI",
    description:
      "Install designs with the shadcn CLI under the @iloveui namespace, set up a token for Pro designs and read its errors.",
  },
  {
    slug: "theming",
    href: "/docs/theming",
    title: "Theming",
    description:
      "Theme Lab, the ten --iu-* tokens every design reads, and how your values reach previews, copied code and downloads.",
  },
  {
    slug: "ai-prompts",
    href: "/docs/ai-prompts",
    title: "AI prompts",
    description:
      "What each design's AI prompt contains and how to use it with coding agents, plus the llms.txt index of the catalog.",
  },
  {
    slug: "license",
    href: "/docs/license",
    title: "License",
    description:
      "The iloveui license in plain words: what you can build with the designs, what you cannot do with them, and refunds.",
  },
];

/** Slugs served by /docs/[slug] (the overview is /docs itself). */
export const DOC_SLUGS = DOC_PAGES.filter((page) => page.href !== "/docs").map((page) => page.slug);

export function getDocPage(slug: string): DocPage | undefined {
  return DOC_PAGES.find((page) => page.slug === slug);
}

export function requireDocPage(slug: string): DocPage {
  const page = getDocPage(slug);
  if (!page) throw new Error(`Unknown docs page "${slug}"`);
  return page;
}

/** The pages before and after a page in navigation order. */
export function docNeighbors(slug: string): { previous: DocPage | null; next: DocPage | null } {
  const index = DOC_PAGES.findIndex((page) => page.slug === slug);
  return {
    previous: index > 0 ? (DOC_PAGES[index - 1] ?? null) : null,
    next: index >= 0 ? (DOC_PAGES[index + 1] ?? null) : null,
  };
}

/** The document title: "Docs" for the overview, "<Page> · Docs" elsewhere, so every docs title is unique. */
export function docTitle(page: DocPage): string {
  return page.href === "/docs" ? "Docs" : `${page.title} · Docs`;
}

/** Position in the docs, for example "02 / 06". */
export function docPosition(page: DocPage): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(DOC_PAGES.indexOf(page) + 1)} / ${pad(DOC_PAGES.length)}`;
}

export function docOg(slug: string): OgContent {
  const page = requireDocPage(slug);
  if (page.href === "/docs") {
    return {
      eyebrow: "Docs",
      title: "Pick, theme, then",
      emphasis: "ship",
      description: page.description,
      meta: `${DOC_PAGES.length} pages`,
    };
  }
  return { eyebrow: "Docs", title: page.title, description: page.description, meta: docPosition(page) };
}
