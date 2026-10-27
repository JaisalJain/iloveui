import * as z from "zod";
import {
  CATEGORIES,
  RESERVED_SLUGS,
  RUNTIME_DEPENDENCIES,
  STATES,
  STYLE_FAMILIES,
  TOKENS_ITEM,
  type CategorySlug,
  type StyleFamilySlug,
} from "./definitions";

export * from "./definitions";

// The meta.json schema (spec 9.5), validated by scripts/lib/validate.ts.
const categorySlugs = CATEGORIES.map((c) => c.slug) as [CategorySlug, ...CategorySlug[]];
const familySlugs = STYLE_FAMILIES.map((f) => f.slug) as [StyleFamilySlug, ...StyleFamilySlug[]];

const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SEMVER =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;
const unique = (values: readonly unknown[]) => new Set(values).size === values.length;

export const DesignMetaSchema = z
  .strictObject({
    slug: z
      .string()
      .regex(KEBAB, { error: "slug must be kebab-case" })
      .refine((slug) => !(RESERVED_SLUGS as readonly string[]).includes(slug), { error: "slug is reserved" }),
    name: z.string().min(2).max(48),
    category: z.enum(categorySlugs),
    styleFamily: z.enum(familySlugs),
    tier: z.enum(["free", "pro"]),
    description: z.string().min(20).max(160),
    tags: z
      .array(z.string().regex(KEBAB, { error: "tags must be kebab-case" }))
      .min(3)
      .max(8)
      .refine(unique, { error: "tags must be unique" }),
    states: z
      .array(z.enum(STATES))
      .min(1)
      .refine(unique, { error: "states must be unique" })
      .refine((states) => states[0] === "default", { error: 'states must start with "default"' }),
    hasMotion: z.boolean(),
    dependencies: z.array(z.enum(RUNTIME_DEPENDENCIES)).refine(unique, { error: "dependencies must be unique" }),
    registryDependencies: z
      .array(z.string().min(1))
      .refine(unique, { error: "registryDependencies must be unique" })
      .refine((deps) => deps.includes(TOKENS_ITEM), { error: `registryDependencies must include ${TOKENS_ITEM}` }),
    version: z.string().regex(SEMVER, { error: "version must be semver" }),
    createdAt: z.iso.date(),
  })
  .refine((meta) => !meta.dependencies.includes("motion") || meta.hasMotion, {
    error: "a design that depends on motion must set hasMotion to true",
    path: ["hasMotion"],
  });

export type DesignMeta = z.infer<typeof DesignMetaSchema>;
