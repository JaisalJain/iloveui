import { existsSync, readFileSync, writeFileSync } from "node:fs";

/** Reads KEY=value pairs from a dotenv file (comments and blank lines ignored). */
export function readEnvFile(path: string): Record<string, string> {
  if (!existsSync(path)) return {};
  const values: Record<string, string> = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (!match?.[1]) continue;
    values[match[1]] = (match[2] ?? "").replace(/^(['"])(.*)\1$/, "$2");
  }
  return values;
}

/** Sets KEY=value in place, keeping comments and order; appends the key when it is missing. */
export function setEnvValue(path: string, key: string, value: string) {
  const lines = existsSync(path) ? readFileSync(path, "utf8").split(/\r?\n/) : [];
  const index = lines.findIndex((line) => new RegExp(`^\\s*${key}\\s*=`).test(line));
  if (index >= 0) lines[index] = `${key}=${value}`;
  else {
    if (lines.length > 0 && lines.at(-1) !== "") lines.push("");
    lines.push(`${key}=${value}`);
  }
  writeFileSync(path, lines.join("\n").replace(/\n*$/, "\n"));
}
