import { drizzle, type DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "./schema";

export type Db = DrizzleD1Database<typeof schema>;

/** Wraps a D1 binding with Drizzle. Shared by the app (per request), scripts and tests. */
export function createDb(d1: D1Database): Db {
  return drizzle(d1, { schema });
}
