import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { cache } from "react";
import { createDb, type Db } from "./create";

export type { Db };

// One client per request: Workers forbid reusing I/O objects across requests.
export const getDb = cache((): Db => createDb(getCloudflareContext().env.DB));
