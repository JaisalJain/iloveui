// Build-time check (spec section 0): production output must not contain the LocalProvider or its routes.
// Runs after `opennextjs-cloudflare build` in `pnpm preview` (and before any deploy).
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

// A marker that exists only in the local test checkout code paths (never in docs or copy).
const SENTINELS = ["iloveui-local-provider"];
const ROOTS = [".next/server", ".open-next"];

function* walk(dir: string): Generator<string> {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = statSync(full);
    if (stat.isDirectory()) yield* walk(full);
    else if (/\.(m?js|cjs|html|json|rsc|body)$/.test(name) && !name.endsWith(".map")) yield full;
  }
}

const roots = ROOTS.filter((root) => existsSync(root));
if (roots.length === 0) {
  console.error("✗ No build output found. Run the production build first.");
  process.exit(1);
}

const hits: string[] = [];
let scanned = 0;
for (const root of roots) {
  for (const file of walk(root)) {
    scanned += 1;
    const text = readFileSync(file, "utf8");
    for (const sentinel of SENTINELS) if (text.includes(sentinel)) hits.push(`${file}: "${sentinel}"`);
  }
}

if (hits.length > 0) {
  console.error("✗ The production build contains development-only payment code:");
  for (const hit of hits) console.error(`  ${hit}`);
  process.exit(1);
}
console.log(`✓ Production build is free of LocalProvider code (${scanned} files scanned).`);
