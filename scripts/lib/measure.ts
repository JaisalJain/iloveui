import { constants, gzipSync } from "node:zlib";
import { build } from "esbuild";

// The size receipt: component.tsx bundled and minified with every runtime package external, so the number is the
// design's own weight; its runtime dependencies are listed separately on the receipt.
const RUNTIME_EXTERNALS = ["react", "react-dom", "motion", "lucide-react"];

const packageName = (path: string) =>
  path
    .split("/")
    .slice(0, path.startsWith("@") ? 2 : 1)
    .join("/");

export type Measurement = { gzipBytes: number; externals: string[]; bundledFromNodeModules: string[] };

export async function measureComponent(entry: string): Promise<Measurement> {
  const result = await build({
    entryPoints: [entry],
    bundle: true,
    write: false,
    metafile: true,
    format: "esm",
    platform: "browser",
    target: "es2022",
    jsx: "automatic",
    minify: true,
    legalComments: "none",
    charset: "utf8",
    define: { "process.env.NODE_ENV": '"production"' },
    external: RUNTIME_EXTERNALS,
    logLevel: "silent",
  });
  const [file] = result.outputFiles;
  if (!file) throw new Error(`esbuild produced no output for ${entry}`);
  const output = Object.values(result.metafile.outputs)[0];
  const externals = [
    ...new Set((output?.imports ?? []).filter((item) => item.external).map((item) => packageName(item.path))),
  ].sort();
  const bundledFromNodeModules = Object.keys(result.metafile.inputs).filter((input) => input.includes("node_modules/"));
  const gzipBytes = gzipSync(file.contents, { level: constants.Z_BEST_COMPRESSION }).byteLength;
  return { gzipBytes, externals, bundledFromNodeModules };
}
