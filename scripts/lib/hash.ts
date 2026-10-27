import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { DESIGN_FILES, type DesignFolder } from "./registry-files";

export function sha256(input: string | Uint8Array): string {
  return createHash("sha256").update(input).digest("hex");
}

/** A short hash of every file in a design folder: changes whenever any part of the design changes. */
export function designHash(folder: DesignFolder): string {
  const hash = createHash("sha256");
  for (const file of DESIGN_FILES) {
    hash.update(file);
    hash.update(readFileSync(path.join(folder.dir, file)));
  }
  return hash.digest("hex").slice(0, 16);
}
