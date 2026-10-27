import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { DesignCode } from "./catalog-types";

// The private half of the catalog, in the DOWNLOADS R2 bucket (written by scripts/build-registry.ts and
// scripts/build-zips.ts). Pro source lives only here; callers check entitlement before reading.

export type PrivateDesign = { registryItem: Record<string, unknown>; code: DesignCode };

export async function getPrivateDesign(slug: string): Promise<PrivateDesign | null> {
  const object = await getCloudflareContext().env.DOWNLOADS.get(`designs/${slug}.json`);
  return object ? ((await object.json()) as PrivateDesign) : null;
}

export async function getDesignZip(slug: string): Promise<Uint8Array | null> {
  const object = await getCloudflareContext().env.DOWNLOADS.get(`zips/${slug}.zip`);
  return object ? new Uint8Array(await object.arrayBuffer()) : null;
}
