import { readFileSync } from "node:fs";
import path from "node:path";
import tailwindcss from "@tailwindcss/postcss";
import postcss from "postcss";

const ROOT = path.resolve(".");

/** Compiles a Tailwind entry stylesheet. `entry` decides how relative @import and @source paths resolve. */
export async function compileCss(entry: string, css?: string, { minify = true } = {}): Promise<string> {
  const input = css ?? readFileSync(entry, "utf8");
  const result = await postcss([tailwindcss({ base: ROOT, optimize: { minify } })]).process(input, { from: entry });
  return result.css;
}

/** The stylesheet preview documents use: the shared base plus every class used by the catalog. */
export function compilePreviewCss() {
  return compileCss(path.join(ROOT, "app/(preview)/preview.css"));
}
