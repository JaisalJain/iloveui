// pnpm validate-registry: checks every design folder against the catalog rules in spec section 9 and
// registry/README.md, including server-rendering every declared state.
//   --only <slug>      check one design (plus catalog-wide rules) and skip the others
//   --require-audits   also require a passing axe audit of each design's current version (registry/audits.json)
import type { DesignMeta } from "../registry/schema";
import { readAudits } from "./lib/audits";
import { designHash } from "./lib/hash";
import { listDesignFolders } from "./lib/registry-files";
import { renderStates } from "./lib/ssr";
import { validateCatalog, validateFolder, type Problem } from "./lib/validate";

async function main() {
  const requireAudits = process.argv.includes("--require-audits");
  const onlyIndex = process.argv.indexOf("--only");
  const only = onlyIndex >= 0 ? process.argv[onlyIndex + 1] : undefined;
  const all = listDesignFolders();
  const folders = only ? all.filter((folder) => folder.slug === only) : all;
  if (only && folders.length === 0) {
    console.error(`✗ No design folder named "${only}"`);
    process.exit(1);
  }
  const problems: Problem[] = [];
  const metas: DesignMeta[] = [];
  const audits = readAudits();

  for (const folder of folders) {
    const where = `${folder.category}/${folder.slug}`;
    const result = validateFolder(folder);
    problems.push(...result.problems);
    if (!result.meta) continue;
    metas.push(result.meta);
    if (result.problems.length === 0) {
      const ssr = await renderStates(folder, result.meta);
      problems.push(...ssr.problems.map((message) => ({ where, message })));
    }
    if (requireAudits) {
      const audit = audits[folder.slug];
      if (!audit || audit.hash !== designHash(folder)) {
        problems.push({ where, message: "no axe audit for this version; run pnpm test:e2e" });
      } else if (audit.violations !== 0) {
        problems.push({ where, message: `axe audit found ${audit.violations} violation(s)` });
      }
    }
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

void main();
