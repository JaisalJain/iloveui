// pnpm build-registry: validates the catalog and generates everything the site serves from it.
//
// Public outputs (no Pro source): registry/generated/catalog.json, registry/generated/preview-loaders.ts,
// public/code/<free-slug>.<hash>.json, public/r/<free-slug>.json, public/r/tokens.json, public/r/registry.json,
// public/catalog.json (search index), public/thumbs/*.
// Private output: designs/<slug>.json in the DOWNLOADS R2 bucket (registry item, highlighted code, AI prompt).
//
//   --remote   upload private payloads to the real R2 bucket instead of the local emulation
//   --no-r2    skip the R2 upload (static outputs only)
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { toIndexEntry, type CatalogDesign, type DesignCode } from "../lib/catalog-types";
import type { DesignMeta } from "../registry/schema";
import { readAudits } from "./lib/audits";
import { compilePreviewCss } from "./lib/css";
import { designHash, sha256 } from "./lib/hash";
import { highlight } from "./lib/highlight";
import { measureComponent } from "./lib/measure";
import { uploadObjects, type R2Object } from "./lib/r2";
import { designItem, registryIndex, tokensItem } from "./lib/registry-item";
import { listDesignFolders, readDesignFile, type DesignFolder } from "./lib/registry-files";
import { renderStates } from "./lib/ssr";
import { thumbnailDocument } from "./lib/thumbnail";
import { validateCatalog, validateFolder, type Problem } from "./lib/validate";

const GENERATED = path.resolve("registry/generated");
const CACHE_DIR = path.join(GENERATED, ".cache");
const PUBLIC_CODE = path.resolve("public/code");
const PUBLIC_R = path.resolve("public/r");
const PUBLIC_THUMBS = path.resolve("public/thumbs");

const args = new Set(process.argv.slice(2));
const remote = args.has("--remote");
const skipR2 = args.has("--no-r2");

if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://iloveui.dev").replace(/\/$/, "");

// Anything that changes generated output for an unchanged design invalidates the cache.
const PIPELINE_HASH = sha256(
  ["scripts/lib/highlight.ts", "scripts/lib/thumbnail.ts", "scripts/lib/registry-item.ts", "registry/preview-kit.tsx"]
    .map((file) => readFileSync(file, "utf8"))
    .join("\n") + SITE_URL,
).slice(0, 12);

type Built = {
  key: string;
  gzipBytes: number;
  externals: string[];
  defaultMarkup: string;
  code: DesignCode;
  registryItem: ReturnType<typeof designItem>;
};

function writeJson(file: string, data: unknown) {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}

function lineCount(text: string) {
  return text.replace(/\n$/, "").split("\n").length;
}

async function buildDesign(folder: DesignFolder, meta: DesignMeta, hash: string): Promise<Built> {
  const key = `${hash}-${PIPELINE_HASH}`;
  const cacheFile = path.join(CACHE_DIR, `${meta.slug}.json`);
  if (existsSync(cacheFile)) {
    const cached = JSON.parse(readFileSync(cacheFile, "utf8")) as Built;
    if (cached.key === key) return cached;
  }
  const tsx = readDesignFile(folder, "component.tsx");
  const html = readDesignFile(folder, "component.html");
  const measured = await measureComponent(path.join(folder.dir, "component.tsx"));
  if (measured.bundledFromNodeModules.length > 0) {
    throw new Error(`${meta.slug}: component.tsx bundles ${measured.bundledFromNodeModules.join(", ")}`);
  }
  const ssr = await renderStates(folder, meta);
  if (ssr.problems.length > 0) throw new Error(`${meta.slug}: ${ssr.problems.join("; ")}`);
  const built: Built = {
    key,
    gzipBytes: measured.gzipBytes,
    externals: measured.externals,
    defaultMarkup: ssr.renders.find((render) => render.state === "default")?.markup ?? "",
    code: {
      slug: meta.slug,
      version: meta.version,
      files: [
        { name: "component.tsx", language: "tsx", lines: lineCount(tsx), code: tsx, html: highlight(tsx, "tsx") },
        { name: "component.html", language: "html", lines: lineCount(html), code: html, html: highlight(html, "html") },
      ],
      aiPrompt: readDesignFile(folder, "ai-prompt.md"),
    },
    registryItem: designItem(meta, tsx, SITE_URL),
  };
  writeJson(cacheFile, built);
  return built;
}

/** Removes generated files whose design no longer exists. */
function prune(dir: string, keep: Set<string>) {
  if (!existsSync(dir)) return;
  for (const name of readdirSync(dir))
    if (!keep.has(name)) rmSync(path.join(dir, name), { recursive: true, force: true });
}

async function main() {
  const started = Date.now();
  const folders = listDesignFolders();
  const problems: Problem[] = [];
  const entries: { folder: DesignFolder; meta: DesignMeta }[] = [];
  for (const folder of folders) {
    const result = validateFolder(folder);
    problems.push(...result.problems);
    if (result.meta) entries.push({ folder, meta: result.meta });
  }
  problems.push(...validateCatalog(entries.map((entry) => entry.meta)));
  if (problems.length > 0) {
    for (const problem of problems) console.error(`✗ ${problem.where}: ${problem.message}`);
    console.error(`\nbuild-registry stopped: ${problems.length} problem(s). Run pnpm validate-registry for details.`);
    process.exit(1);
  }

  // Newest first; the catalog order is the default sort everywhere.
  entries.sort((a, b) => b.meta.createdAt.localeCompare(a.meta.createdAt) || a.meta.slug.localeCompare(b.meta.slug));

  const previewCss = await compilePreviewCss();
  const cssName = `thumbs.${sha256(previewCss).slice(0, 10)}.css`;
  mkdirSync(PUBLIC_THUMBS, { recursive: true });
  writeFileSync(path.join(PUBLIC_THUMBS, cssName), previewCss);

  const audits = readAudits();
  const designs: CatalogDesign[] = [];
  const privateObjects: R2Object[] = [];
  const keepCode = new Set<string>();
  const keepR = new Set<string>(["tokens.json", "registry.json"]);
  const keepThumbs = new Set<string>([cssName]);

  for (const { folder, meta } of entries) {
    const hash = designHash(folder);
    const built = await buildDesign(folder, meta, hash);
    const audit = audits[meta.slug];
    const thumbName = `${meta.slug}.html`;
    const codeName = `${meta.slug}.${hash.slice(0, 10)}.json`;
    writeFileSync(
      path.join(PUBLIC_THUMBS, thumbName),
      thumbnailDocument({ name: meta.name, markup: built.defaultMarkup, cssHref: `/thumbs/${cssName}` }),
    );
    keepThumbs.add(thumbName);

    designs.push({
      slug: meta.slug,
      name: meta.name,
      category: meta.category,
      styleFamily: meta.styleFamily,
      tier: meta.tier,
      description: meta.description,
      tags: meta.tags,
      states: meta.states,
      hasMotion: meta.hasMotion,
      dependencies: meta.dependencies,
      version: meta.version,
      createdAt: meta.createdAt,
      hash,
      receipt: {
        gzipBytes: built.gzipBytes,
        dependencies: built.externals.filter((name) => name !== "react" && name !== "react-dom"),
        axeViolations: audit && audit.hash === hash ? audit.violations : null,
        reducedMotion: true,
      },
      files: {
        react: [
          {
            name: "component.tsx",
            lines: built.code.files[0]!.lines,
            bytes: Buffer.byteLength(built.code.files[0]!.code),
          },
        ],
        html: [
          {
            name: "component.html",
            lines: built.code.files[1]!.lines,
            bytes: Buffer.byteLength(built.code.files[1]!.code),
          },
        ],
      },
      thumb: `/thumbs/${thumbName}`,
      codeUrl: meta.tier === "free" ? `/code/${codeName}` : null,
    });

    privateObjects.push({
      key: `designs/${meta.slug}.json`,
      body: JSON.stringify({ registryItem: built.registryItem, code: built.code }),
      contentType: "application/json",
    });
    if (meta.tier === "free") {
      writeJson(path.join(PUBLIC_CODE, codeName), built.code);
      keepCode.add(codeName);
      writeJson(path.join(PUBLIC_R, `${meta.slug}.json`), built.registryItem);
      keepR.add(`${meta.slug}.json`);
    }
  }

  writeJson(path.join(GENERATED, "catalog.json"), { designs });
  writeJson(path.join(PUBLIC_R, "tokens.json"), tokensItem());
  writeJson(
    path.join(PUBLIC_R, "registry.json"),
    registryIndex(
      entries.map((entry) => entry.meta),
      SITE_URL,
    ),
  );
  writeJson(path.resolve("public/catalog.json"), designs.map(toIndexEntry));
  writeFileSync(
    path.join(GENERATED, "preview-loaders.ts"),
    [
      "// Generated by scripts/build-registry.ts from registry/designs. Rebuilt on every pnpm dev and pnpm build.",
      'import { lazy, type ComponentType } from "react";',
      'import type { DesignState } from "@/registry/definitions";',
      "",
      "type PreviewComponent = ComponentType<{ state: DesignState }>;",
      "",
      "export const previewComponents: Partial<Record<string, PreviewComponent>> = {",
      ...entries.map(
        ({ meta }) =>
          `  "${meta.slug}": lazy(() => import("@/registry/designs/${meta.category}/${meta.slug}/preview")),`,
      ),
      "};",
      "",
    ].join("\n"),
  );
  prune(PUBLIC_CODE, keepCode);
  prune(PUBLIC_R, keepR);
  prune(PUBLIC_THUMBS, keepThumbs);
  prune(CACHE_DIR, new Set(entries.map(({ meta }) => `${meta.slug}.json`)));

  let uploaded = 0;
  if (!skipR2 && privateObjects.length > 0) uploaded = (await uploadObjects(privateObjects, { remote })).uploaded;

  const free = designs.filter((design) => design.tier === "free").length;
  console.log(
    `✓ registry: ${designs.length} design(s) (${free} free, ${designs.length - free} pro), ` +
      `${skipR2 ? "R2 skipped" : `${uploaded} R2 object(s) updated${remote ? " (remote)" : ""}`}, ` +
      `${((Date.now() - started) / 1000).toFixed(1)}s`,
  );
}

main().catch((error: unknown) => {
  console.error(`✗ build-registry: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
