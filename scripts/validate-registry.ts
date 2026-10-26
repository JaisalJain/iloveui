// pnpm validate-registry: checks every design folder against the catalog rules in spec section 9.
import { existsSync } from "node:fs";
import path from "node:path";
import * as z from "zod";
import { CATEGORIES, DesignMetaSchema, type DesignMeta } from "../registry/schema";
import { DESIGN_FILES, listDesignFolders, readDesignFile, type DesignFolder } from "./lib/registry-files";

type Problem = { where: string; message: string };

export function validateFolder(folder: DesignFolder): { meta: DesignMeta | null; problems: Problem[] } {
  const where = `${folder.category}/${folder.slug}`;
  const problems: Problem[] = [];
  for (const file of DESIGN_FILES) {
    if (!existsSync(path.join(folder.dir, file))) problems.push({ where, message: `missing ${file}` });
  }
  if (!existsSync(path.join(folder.dir, "meta.json"))) return { meta: null, problems };

  let raw: unknown;
  try {
    raw = JSON.parse(readDesignFile(folder, "meta.json"));
  } catch (error) {
    problems.push({ where, message: `meta.json is not valid JSON (${(error as Error).message})` });
    return { meta: null, problems };
  }
  const parsed = DesignMetaSchema.safeParse(raw);
  if (!parsed.success) {
    problems.push({ where, message: `meta.json:\n${z.prettifyError(parsed.error)}` });
    return { meta: null, problems };
  }
  const meta = parsed.data;
  if (meta.slug !== folder.slug) problems.push({ where, message: `slug "${meta.slug}" must match its folder name` });
  if (meta.category !== folder.category) {
    problems.push({ where, message: `category "${meta.category}" must match its folder "${folder.category}"` });
  }
  return { meta, problems };
}

export function validateCatalog(metas: DesignMeta[]): Problem[] {
  const problems: Problem[] = [];
  const seen = new Map<string, number>();
  for (const meta of metas) seen.set(meta.slug, (seen.get(meta.slug) ?? 0) + 1);
  for (const [slug, count] of seen) {
    if (count > 1) problems.push({ where: slug, message: `slug is used ${count} times; slugs are global` });
  }
  for (const category of CATEGORIES) {
    const free = metas.filter((meta) => meta.category === category.slug && meta.tier === "free").length;
    if (free > category.free) {
      problems.push({
        where: category.slug,
        message: `${free} free designs; this category allows exactly ${category.free}`,
      });
    }
  }
  return problems;
}

function main() {
  const folders = listDesignFolders();
  const problems: Problem[] = [];
  const metas: DesignMeta[] = [];
  for (const folder of folders) {
    const result = validateFolder(folder);
    problems.push(...result.problems);
    if (result.meta) metas.push(result.meta);
  }
  problems.push(...validateCatalog(metas));

  if (problems.length > 0) {
    for (const problem of problems) console.error(`✗ ${problem.where}: ${problem.message}`);
    console.error(`\n${problems.length} problem(s) in ${folders.length} design(s).`);
    process.exit(1);
  }
  const free = metas.filter((meta) => meta.tier === "free").length;
  console.log(`✓ ${metas.length} design(s) valid (${free} free, ${metas.length - free} pro).`);
}

main();
