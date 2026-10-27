// pnpm setup: prepares a fresh clone for local development with no accounts.
// 1. .env.local from .env.example, with generated secrets
// 2. Cloudflare binding types
// 3. D1 migrations applied to the local database
// 4. the registry built (catalog, previews, thumbnails; Pro payloads into local R2) and the download zips
// 5. the local database seeded with one demo account state
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { getPlatformProxy } from "wrangler";
import { readEnvFile, setEnvValue } from "./lib/env-file";
import { DEMO_SEAT_EMAIL, seedDemoAccount } from "./lib/seed";

const ENV_FILE = ".env.local";

function step(title: string) {
  console.log(`\n→ ${title}`);
}

function run(command: string, args: string[], env: Record<string, string> = {}) {
  const result = spawnSync(command, args, { stdio: ["ignore", "inherit", "inherit"], env: { ...process.env, ...env } });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} exited with code ${result.status ?? "unknown"}`);
  }
}

function ensureEnvFile() {
  step("Environment");
  if (!existsSync(ENV_FILE)) {
    copyFileSync(".env.example", ENV_FILE);
    console.log(`  created ${ENV_FILE} from .env.example`);
  } else {
    console.log(`  ${ENV_FILE} exists, keeping your values`);
  }
  const env = readEnvFile(ENV_FILE);
  if (!env.TOKEN_PEPPER) {
    setEnvValue(ENV_FILE, "TOKEN_PEPPER", randomBytes(32).toString("base64url"));
    console.log("  generated TOKEN_PEPPER");
  }
  if (!env.LOCAL_WEBHOOK_SECRET) {
    // Same format as Standard Webhooks secrets (whsec_ + base64), so local and Dodo webhooks verify the same way.
    setEnvValue(ENV_FILE, "LOCAL_WEBHOOK_SECRET", `whsec_${randomBytes(32).toString("base64")}`);
    console.log("  generated LOCAL_WEBHOOK_SECRET");
  }
}

function generateTypes() {
  step("Cloudflare binding types");
  run("pnpm", ["cf-typegen"]);
}

function applyMigrations() {
  step("Database migrations (local D1)");
  // CI=1 answers wrangler's confirmation prompt, which has no --yes flag.
  run("pnpm", ["exec", "wrangler", "d1", "migrations", "apply", "iloveui-db", "--local"], { CI: "1" });
}

function buildRegistry() {
  step("Registry and downloads");
  run("pnpm", ["build-registry"]);
  run("pnpm", ["build-zips"]);
}

async function seed() {
  step("Demo account");
  const { env, dispose } = await getPlatformProxy<CloudflareEnv>({ remoteBindings: false });
  try {
    await seedDemoAccount(env.DB);
    console.log(`  Team license with a pending seat for ${DEMO_SEAT_EMAIL}`);
  } finally {
    await dispose();
  }
}

async function main() {
  ensureEnvFile();
  generateTypes();
  applyMigrations();
  buildRegistry();
  await seed();
  console.log("\n✓ Setup complete. Start the site with: pnpm dev (http://localhost:3000)\n");
}

main().catch((error: unknown) => {
  console.error(`\n✗ Setup failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
