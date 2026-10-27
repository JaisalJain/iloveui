import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [
    {
      name: "iloveui:uncached-globs",
      // Vitest caches transformed modules on disk, keyed by their source. A module that calls import.meta.glob also
      // depends on which files exist (a new changelog entry changes nothing in lib/changelog.ts), so it is never cached.
      configureVitest({ defineCacheKeyGenerator }) {
        defineCacheKeyGenerator(({ sourceCode }) => (sourceCode.includes("import.meta.glob") ? false : undefined));
      },
    },
  ],
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
