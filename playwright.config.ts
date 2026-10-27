import { defineConfig, devices } from "@playwright/test";

// Two targets share port 3000 and run one after the other (scripts/e2e.ts):
// - preview: the production build in the local Workers runtime (every spec except *.dev.spec.ts)
// - dev: `next dev`, for flows that need development-only code such as the local test checkout (*.dev.spec.ts)
const target = process.env.E2E_TARGET === "dev" ? "dev" : "preview";
const BASE_URL = "http://localhost:3000";

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: target === "dev" ? "**/*.dev.spec.ts" : "**/*.spec.ts",
  testIgnore: target === "dev" ? [] : ["**/*.dev.spec.ts"],
  // The dev target signs in with Clerk test users: global setup mints a Clerk Testing Token and warms the pages the
  // dev specs use (tests/e2e/dev.setup.ts).
  globalSetup: target === "dev" ? "./tests/e2e/dev.setup.ts" : undefined,
  outputDir: "./test-results/artifacts",
  // Dev specs share the dev server's local D1 file (some write to it through wrangler) and a rate-limited Clerk
  // development instance, so they run one at a time.
  fullyParallel: target !== "dev",
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: process.env.E2E_WORKERS ? Number(process.env.E2E_WORKERS) : target === "dev" ? 1 : "50%",
  reporter: [["list"]],
  timeout: 60_000,
  // next dev compiles server actions and routes on their first call, which can take longer than 10 seconds.
  expect: { timeout: target === "dev" ? 30_000 : 10_000 },
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
  },
  projects: [{ name: target, use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: target === "dev" ? "pnpm dev" : "pnpm preview",
    url: BASE_URL,
    reuseExistingServer: process.env.E2E_REUSE === "1",
    timeout: 20 * 60_000,
    stdout: "ignore",
    stderr: "pipe",
    gracefulShutdown: { signal: "SIGTERM", timeout: 5_000 },
  },
});
