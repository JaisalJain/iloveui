import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

export const DESIGNS_DIR = path.resolve("registry/designs");

export const DESIGN_FILES = [
  "meta.json",
  "component.tsx",
  "component.html",
  "preview.tsx",
  "ai-prompt.md",
  "notes.md",
] as const;

export type DesignFolder = { category: string; slug: string; dir: string };

/** Every registry/designs/<category>/<slug>/ folder, sorted for stable output. */
export function listDesignFolders(): DesignFolder[] {
  if (!existsSync(DESIGNS_DIR)) return [];
  const folders: DesignFolder[] = [];
  for (const category of readdirSync(DESIGNS_DIR).sort()) {
    const categoryDir = path.join(DESIGNS_DIR, category);
    if (!statSync(categoryDir).isDirectory()) continue;
    for (const slug of readdirSync(categoryDir).sort()) {
      const dir = path.join(categoryDir, slug);
      if (statSync(dir).isDirectory()) folders.push({ category, slug, dir });
    }
  }
  return folders;
}

export function readDesignFile(folder: DesignFolder, file: (typeof DESIGN_FILES)[number]): string {
  return readFileSync(path.join(folder.dir, file), "utf8");
}
