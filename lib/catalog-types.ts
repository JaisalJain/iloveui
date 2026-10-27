import type { CategorySlug, DesignState, StyleFamilySlug } from "@/registry/definitions";

// Public catalog metadata produced by scripts/build-registry.ts. Nothing here is design source code.

export type FileStat = { name: string; lines: number; bytes: number };

export type Receipt = {
  /** Gzipped size of component.tsx bundled with react, react-dom, motion and lucide-react external. */
  gzipBytes: number;
  dependencies: string[];
  /** axe violations from the last end-to-end audit of this exact version, or null when not yet audited. */
  axeViolations: number | null;
  reducedMotion: boolean;
};

export type CatalogDesign = {
  slug: string;
  name: string;
  category: CategorySlug;
  styleFamily: StyleFamilySlug;
  tier: "free" | "pro";
  description: string;
  tags: string[];
  states: DesignState[];
  hasMotion: boolean;
  dependencies: string[];
  version: string;
  createdAt: string;
  /** Hash of every file in the design folder; changes whenever the design changes. */
  hash: string;
  receipt: Receipt;
  files: { react: FileStat[]; html: FileStat[] };
  /** Static, script-free rendering of the default state used by cards and the hero wall. */
  thumb: string;
  /** Free designs only: static JSON with the highlighted code and AI prompt. Pro code is served after an
   * entitlement check and never has a public URL. */
  codeUrl: string | null;
};

export type Catalog = { designs: CatalogDesign[] };

/** One entry of public/catalog.json: what cards, filters and search need, for every design. */
export type CatalogIndexEntry = Pick<
  CatalogDesign,
  "slug" | "name" | "category" | "styleFamily" | "tier" | "description" | "tags" | "hasMotion" | "createdAt" | "thumb"
> & { gzipBytes: number };

export function toIndexEntry(design: CatalogDesign): CatalogIndexEntry {
  return {
    slug: design.slug,
    name: design.name,
    category: design.category,
    styleFamily: design.styleFamily,
    tier: design.tier,
    description: design.description,
    tags: design.tags,
    hasMotion: design.hasMotion,
    createdAt: design.createdAt,
    gzipBytes: design.receipt.gzipBytes,
    thumb: design.thumb,
  };
}

/** Highlighted source for one file of a design, as served to people allowed to see it. */
export type CodeFile = { name: string; language: "tsx" | "html"; lines: number; code: string; html: string };

export type DesignCode = { slug: string; version: string; files: CodeFile[]; aiPrompt: string };
