import { migrate } from "drizzle-orm/d1/migrator";
import { getPlatformProxy } from "wrangler";
import { createDb, type Db } from "@/lib/db/create";
import * as schema from "@/lib/db/schema";

export type TestDb = { db: Db; env: CloudflareEnv; dispose: () => Promise<void> };

/** An ephemeral local D1 + R2 (the same workerd implementation as production), migrated with the committed SQL. */
export async function createTestDb(): Promise<TestDb> {
  const proxy = await getPlatformProxy<CloudflareEnv>({
    configPath: "wrangler.jsonc",
    persist: false,
    remoteBindings: false,
    envFiles: [],
  });
  const db = createDb(proxy.env.DB);
  await migrate(db, { migrationsFolder: "drizzle" });
  return { db, env: proxy.env, dispose: proxy.dispose };
}

/** Deletes every row, children first, because D1 always enforces foreign keys. */
export async function resetTestDb(db: Db) {
  await db.batch([
    db.delete(schema.seats),
    db.delete(schema.apiTokens),
    db.delete(schema.bookmarks),
    db.delete(schema.licenses),
    db.delete(schema.webhookEvents),
    db.delete(schema.rateLimits),
    db.delete(schema.designMetrics),
    db.delete(schema.users),
  ]);
}
