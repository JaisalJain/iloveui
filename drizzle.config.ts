import { defineConfig } from "drizzle-kit";

// drizzle-kit only generates SQL here; wrangler applies it (locally and remotely) from the same folder.
export default defineConfig({
  dialect: "sqlite",
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
});
