import { registryItemSchema, registrySchema } from "shadcn/schema";
import { site } from "../../lib/site";
import { DEFAULT_THEME, IU_TOKEN_NAMES, themeTokens } from "../../lib/theme";
import { TOKENS_ITEM, type DesignMeta } from "../../registry/schema";

// shadcn registry items (https://ui.shadcn.com/schema/registry-item.json) for the @iloveui namespace.

export const REGISTRY_ITEM_SCHEMA = "https://ui.shadcn.com/schema/registry-item.json";
const AUTHOR = `iloveui <${site.repository}>`;

/** The free theme item every design depends on: all ten --iu-* variables for light and dark. */
export function tokensItem() {
  const { light, dark } = themeTokens(DEFAULT_THEME);
  const strip = (name: string) => name.replace(/^--/, "");
  const item = {
    $schema: REGISTRY_ITEM_SCHEMA,
    name: TOKENS_ITEM.replace("@iloveui/", ""),
    type: "registry:theme" as const,
    title: "iloveui tokens",
    description: "The --iu-* CSS variables every iloveui design reads. Edit them to re-theme every design at once.",
    author: AUTHOR,
    cssVars: {
      light: Object.fromEntries(IU_TOKEN_NAMES.map((name) => [strip(name), light[name]])),
      dark: Object.fromEntries(IU_TOKEN_NAMES.slice(0, 7).map((name) => [strip(name), dark[name]])),
    },
  };
  return registryItemSchema.parse(item);
}

export function designItem(meta: DesignMeta, source: string, siteUrl: string) {
  const url = `${siteUrl}/designs/${meta.category}/${meta.slug}`;
  const item = {
    $schema: REGISTRY_ITEM_SCHEMA,
    name: meta.slug,
    type: "registry:block" as const,
    title: meta.name,
    description: meta.description,
    author: AUTHOR,
    dependencies: meta.dependencies,
    registryDependencies: meta.registryDependencies,
    files: [
      {
        path: `registry/iloveui/${meta.slug}.tsx`,
        type: "registry:component" as const,
        target: `@components/iloveui/${meta.slug}.tsx`,
        content: source,
      },
    ],
    docs: `Added components/iloveui/${meta.slug}.tsx. It reads the --iu-* tokens from @iloveui/tokens; edit them in your global CSS to re-theme it. Docs: ${url}`,
    categories: [meta.category, meta.styleFamily],
    meta: { tier: meta.tier, styleFamily: meta.styleFamily, version: meta.version, url },
  };
  return registryItemSchema.parse(item);
}

/** The catalog the CLI fetches for `list` and `search`: names and descriptions only, never file contents. */
export function registryIndex(metas: DesignMeta[], siteUrl: string) {
  const tokens = tokensItem();
  const index = {
    $schema: "https://ui.shadcn.com/schema/registry.json",
    name: "iloveui",
    homepage: siteUrl,
    items: [
      { name: tokens.name, type: tokens.type, title: tokens.title, description: tokens.description },
      ...metas.map((meta) => ({
        name: meta.slug,
        type: "registry:block" as const,
        title: meta.name,
        description: meta.description,
        categories: [meta.category, meta.styleFamily],
        meta: {
          tier: meta.tier,
          styleFamily: meta.styleFamily,
          version: meta.version,
          url: `${siteUrl}/designs/${meta.category}/${meta.slug}`,
        },
      })),
    ],
  };
  return registrySchema.parse(index);
}
