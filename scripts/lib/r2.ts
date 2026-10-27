import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { getPlatformProxy } from "wrangler";
import { sha256 } from "./hash";

// Uploads build output to the DOWNLOADS bucket: the local emulation by default (the same .wrangler state next dev
// and pnpm preview read), or the real bucket with --remote when going live (needs wrangler login or an API token).

export type R2Object = { key: string; body: Uint8Array | string; contentType: string; contentDisposition?: string };

const BUCKET = "iloveui-downloads";

export async function uploadObjects(objects: R2Object[], { remote = false } = {}): Promise<{ uploaded: number }> {
  if (remote) return uploadRemote(objects);
  const { env, dispose } = await getPlatformProxy<CloudflareEnv>({ remoteBindings: false, envFiles: [] });
  let uploaded = 0;
  try {
    for (const object of objects) {
      const digest = sha256(object.body);
      const existing = await env.DOWNLOADS.head(object.key);
      if (existing?.customMetadata?.sha256 === digest) continue;
      await env.DOWNLOADS.put(object.key, object.body, {
        httpMetadata: { contentType: object.contentType, contentDisposition: object.contentDisposition },
        customMetadata: { sha256: digest },
      });
      uploaded += 1;
    }
  } finally {
    await dispose();
  }
  return { uploaded };
}

function uploadRemote(objects: R2Object[]): { uploaded: number } {
  const dir = mkdtempSync(path.join(tmpdir(), "iloveui-r2-"));
  try {
    for (const [index, object] of objects.entries()) {
      const file = path.join(dir, String(index));
      writeFileSync(file, object.body);
      const args = ["exec", "wrangler", "r2", "object", "put", `${BUCKET}/${object.key}`, `--file=${file}`];
      args.push(`--content-type=${object.contentType}`, "--remote");
      if (object.contentDisposition) args.push(`--content-disposition=${object.contentDisposition}`);
      const result = spawnSync("pnpm", args, { stdio: ["ignore", "ignore", "inherit"] });
      if (result.status !== 0) throw new Error(`Uploading ${object.key} to R2 failed`);
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
  return { uploaded: objects.length };
}
