// pnpm test:e2e: runs the Playwright suite against the production build in the local Workers runtime, then the
// development-only specs (local test checkout) against `next dev`. Extra arguments go to Playwright.
import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";

const args = process.argv.slice(2);
const hasDevSpecs = readdirSync("tests/e2e", { recursive: true }).some((file) => String(file).endsWith(".dev.spec.ts"));
const targets = (["preview", "dev"] as const).filter((target) => target === "preview" || hasDevSpecs);

for (const target of targets) {
  console.log(`\n▶ e2e against ${target === "preview" ? "pnpm preview (Workers runtime)" : "pnpm dev"}\n`);
  const result = spawnSync("pnpm", ["exec", "playwright", "test", ...args], {
    stdio: "inherit",
    env: { ...process.env, E2E_TARGET: target },
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
