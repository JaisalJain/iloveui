// pnpm test:e2e: runs the Playwright suite against the production build in the local Workers runtime, then the
// development-only specs (local test checkout) against `next dev`. Extra arguments go to Playwright.
// After the preview run, the per-design accessibility results are merged into registry/audits.json.
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { readAudits, writeAudits } from "./lib/audits";

const args = process.argv.slice(2);
const AUDITS_DIR = "test-results/audits";

function run(command: string, commandArgs: string[], env: Record<string, string> = {}) {
  return spawnSync(command, commandArgs, { stdio: "inherit", env: { ...process.env, ...env } }).status ?? 1;
}

function mergeAudits() {
  if (!existsSync(AUDITS_DIR)) return;
  type Result = { slug: string; hash: string; violations: number; snapshots: number };
  const results = readdirSync(AUDITS_DIR).map(
    (file) => JSON.parse(readFileSync(`${AUDITS_DIR}/${file}`, "utf8")) as Result,
  );
  const audits = readAudits();
  const auditedAt = new Date().toISOString().slice(0, 10);
  for (const slug of new Set(results.map((result) => result.slug))) {
    const modes = results.filter((result) => result.slug === slug);
    const [first] = modes;
    if (!first || modes.length < 2 || modes.some((mode) => mode.hash !== first.hash)) continue;
    audits[slug] = {
      hash: first.hash,
      violations: modes.reduce((sum, mode) => sum + mode.violations, 0),
      snapshots: modes.reduce((sum, mode) => sum + mode.snapshots, 0),
      auditedAt,
    };
  }
  writeAudits(audits);
  console.log(`\n✓ registry/audits.json updated for ${new Set(results.map((r) => r.slug)).size} design(s)`);
}

// The test list is generated from the catalog, so it must exist before Playwright collects tests.
if (run("pnpm", ["build-registry", "--no-r2"]) !== 0) process.exit(1);
// Rate-limit windows left by earlier runs would throttle the suite's anonymous downloads (one IP on this machine,
// 60 an hour). Clear them once, before any server holds the local database.
if (
  run("pnpm", ["exec", "wrangler", "d1", "execute", "iloveui-db", "--local", "--command", "DELETE FROM rate_limits"], {
    CI: "1",
  }) !== 0
) {
  process.exit(1);
}
rmSync(AUDITS_DIR, { recursive: true, force: true });

const hasDevSpecs = readdirSync("tests/e2e", { recursive: true }).some((file) => String(file).endsWith(".dev.spec.ts"));
const targets = (["preview", "dev"] as const).filter((target) => target === "preview" || hasDevSpecs);

for (const target of targets) {
  console.log(`\n▶ e2e against ${target === "preview" ? "pnpm preview (Workers runtime)" : "pnpm dev"}\n`);
  const status = run("pnpm", ["exec", "playwright", "test", ...args], { E2E_TARGET: target });
  if (target === "preview") mergeAudits();
  if (status !== 0) process.exit(status);
}
