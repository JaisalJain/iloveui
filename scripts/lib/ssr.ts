import { mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";
import { createElement, type ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { DesignMeta } from "../../registry/schema";
import type { DesignFolder } from "./registry-files";

const SSR_DIR = path.resolve("registry/generated/.ssr");

export type StateRender = { state: string; markup: string };

/**
 * Server-renders every declared state of a design's preview, the way the static thumbnail and the first paint of
 * the live preview render it. Returns the markup per state and any problems found.
 */
export async function renderStates(
  folder: DesignFolder,
  meta: DesignMeta,
): Promise<{ renders: StateRender[]; problems: string[] }> {
  mkdirSync(SSR_DIR, { recursive: true });
  const outfile = path.join(SSR_DIR, `${folder.slug}.${process.pid}.${Date.now()}.mjs`);
  const problems: string[] = [];
  try {
    await build({
      entryPoints: [path.join(folder.dir, "preview.tsx")],
      outfile,
      bundle: true,
      format: "esm",
      platform: "node",
      target: "node22",
      jsx: "automatic",
      external: ["react", "react-dom", "motion", "lucide-react"],
      define: { "process.env.NODE_ENV": '"production"' },
      logLevel: "error",
    });
    const mod = (await import(pathToFileURL(outfile).href)) as { default?: ComponentType<{ state: string }> };
    const Preview = mod.default;
    if (typeof Preview !== "function") return { renders: [], problems: ["preview.tsx has no default component"] };

    const renders: StateRender[] = [];
    for (const state of meta.states) {
      try {
        renders.push({ state, markup: renderToStaticMarkup(createElement(Preview, { state })) });
      } catch (error) {
        problems.push(`preview state "${state}" fails to render: ${(error as Error).message}`);
      }
    }
    const base = renders.find((render) => render.state === "default");
    for (const render of renders) {
      if (render.state !== "default" && base && render.markup === base.markup) {
        problems.push(`state "${render.state}" renders exactly like "default"; it must be visibly different`);
      }
      if (/style="[^"]*opacity:\s*0(?:[;"]|\.0*[;"])/.test(render.markup)) {
        problems.push(
          `state "${render.state}" server-renders content at opacity 0 (hidden until JavaScript runs); use initial={false}`,
        );
      }
      if (render.markup.length < 200) problems.push(`state "${render.state}" renders almost nothing`);
    }
    return { renders, problems };
  } finally {
    rmSync(outfile, { force: true });
  }
}
