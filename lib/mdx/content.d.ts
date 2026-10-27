// Types for the MDX files in content/. tsconfig limits automatic type packages to node, so @types/mdx is pulled in
// here, plus the `toc` export that lib/mdx/rehype-docs.mjs adds to every file.
/// <reference types="mdx" />

declare module "*.mdx" {
  /** The h2 and h3 headings of the file, in order. */
  export const toc: { id: string; title: string; depth: 2 | 3 }[];
}
