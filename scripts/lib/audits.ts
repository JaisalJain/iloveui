import { existsSync, readFileSync, writeFileSync } from "node:fs";

// registry/audits.json: the result of the last end-to-end accessibility audit of each design version.
// tests/e2e/designs.spec.ts writes it; build-registry reads it for the receipt ("axe: 0 violations").
export const AUDITS_FILE = "registry/audits.json";

export type Audit = { hash: string; violations: number; snapshots: number; auditedAt: string };

export function readAudits(): Record<string, Audit> {
  if (!existsSync(AUDITS_FILE)) return {};
  return JSON.parse(readFileSync(AUDITS_FILE, "utf8")) as Record<string, Audit>;
}

export function writeAudits(audits: Record<string, Audit>) {
  const sorted = Object.fromEntries(Object.entries(audits).sort(([a], [b]) => a.localeCompare(b)));
  writeFileSync(AUDITS_FILE, `${JSON.stringify(sorted, null, 2)}\n`);
}
