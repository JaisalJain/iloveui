import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    alias: {
      // "server-only" throws outside the react-server condition; unit tests import server modules directly.
      "server-only": new URL("./tests/unit/stubs/server-only.ts", import.meta.url).pathname,
    },
  },
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts"],
    reporters: ["default"],
    setupFiles: ["tests/unit/setup.ts"],
    // wrangler (used for the local D1 test database) imports the deprecated punycode module on Node 24.
    execArgv: ["--disable-warning=DEP0040"],
    testTimeout: 20_000,
    hookTimeout: 60_000,
  },
});
