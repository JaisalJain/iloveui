// pnpm gates: every quality gate from spec section 16, in order. Stops at the first failure.
//   typecheck, lint (ESLint, Prettier, forbidden words), unit tests, the end-to-end suite (production build in the
//   Workers runtime, then development-only flows) and the registry check with fresh accessibility audits.
import { spawnSync } from "node:child_process";

const steps: [string, string[]][] = [
  ["pnpm", ["typecheck"]],
  ["pnpm", ["lint"]],
  ["pnpm", ["test"]],
  ["pnpm", ["test:e2e"]],
  ["pnpm", ["validate-registry", "--require-audits"]],
];

const started = Date.now();
for (const [command, args] of steps) {
  console.log(`\n━━ ${command} ${args.join(" ")}`);
  const status = spawnSync(command, args, { stdio: "inherit" }).status;
  if (status !== 0) {
    console.error(`\n✗ Gate failed: ${command} ${args.join(" ")}`);
    process.exit(status ?? 1);
  }
}
console.log(`\n✓ All gates passed in ${Math.round((Date.now() - started) / 1000)}s`);
