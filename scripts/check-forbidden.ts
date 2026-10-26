// Gate (spec section 16): the codebase outside CLAUDE.md must not contain the words and patterns that section 7.1
// forbids, nor the placeholder words section 16 names. Every list is read from CLAUDE.md at runtime, so this file
// never spells them out and the spec stays the single source of truth.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const spec = readFileSync("CLAUDE.md", "utf8");
const specLines = spec.split("\n");

function textAfter(label: string): string {
  const line = specLines.find((candidate) => candidate.includes(label));
  if (!line) throw new Error(`CLAUDE.md has no line containing "${label}"`);
  return line.slice(line.indexOf(label) + label.length);
}

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Section 7.1, last bullet: a comma-separated list of words; any suffix counts (an -ly or -ing form too).
const hypeWords = textAfter("Hype words:")
  .replace(/\.$/, "")
  .split(",")
  .map((word) => word.trim())
  .filter(Boolean);

// Section 16: the quoted placeholder words.
const placeholderWords = [...textAfter("forbidden words and patterns in 7.1, plus").matchAll(/"([^"]+)"/g)].map(
  (match) => match[1]!,
);

// Section 7.1, first bullet: "<hues> gradients; <pattern>; <pattern>; ...; emoji used as icons."
const visualLine = (specLines.find((line) => line.includes("gradients; gradient")) ?? "").replace(/^•\s*/, "");
const [huePart = "", ...patternParts] = visualLine.replace(/\.$/, "").split(";");
const gradientHues = huePart
  .replace(/ gradients$/, "")
  .split(/,| or /)
  .map((hue) => hue.trim().toLowerCase())
  .filter(Boolean);

// Each pattern name becomes the words that identify it: generic trailing nouns and a leading "cursor" are dropped,
// a trailing plural is made singular, and multi-word names are matched as phrases.
const GENERIC = new Set(["backgrounds", "badges", "effects", "cursor"]);
const patternPhrases = patternParts
  .flatMap((part) => part.trim().split(" or "))
  .filter((part) => !part.startsWith("emoji"))
  .map((part) => part.split(/\s+/).filter((word) => !GENERIC.has(word)))
  .filter((words) => words.length > 0)
  .map((words) => words.map((word, index) => (index === words.length - 1 ? word.replace(/s$/, "") : word)));

const hueAlternation = [...gradientHues, "indigo", "fuchsia"].map(escape).join("|");
const VARIATION_SELECTOR = String.fromCodePoint(0xfe0f);

type Rule = { name: string; regex: RegExp };
const rules: Rule[] = [
  ...hypeWords.map((word) => ({ name: `hype word "${word}"`, regex: new RegExp(`\\b${escape(word)}\\w*`, "i") })),
  ...placeholderWords.map((word) => ({
    name: `placeholder "${word}"`,
    regex: new RegExp(`\\b${escape(word)}\\b`, word === word.toUpperCase() ? "" : "i"),
  })),
  ...patternPhrases.map((words) => ({
    name: `forbidden pattern "${words.join(" ")}"`,
    regex: new RegExp(`\\b${words.map(escape).join("[-\\s]?")}`, "i"),
  })),
  { name: "gradient in a forbidden hue", regex: new RegExp(`(?:from|via|to)-(?:${hueAlternation})-\\d`, "i") },
  { name: "gradient in a forbidden hue", regex: new RegExp(`gradient\\([^)]*\\b(?:${hueAlternation})\\b`, "i") },
  { name: "frosted-glass blur", regex: /backdrop-(?:blur|filter)/ },
  { name: "emoji", regex: new RegExp(`\\p{Emoji_Presentation}|${VARIATION_SELECTOR}`, "u") },
];

if (hypeWords.length < 5 || placeholderWords.length < 4 || patternPhrases.length < 5 || gradientHues.length < 3) {
  console.error("✗ Could not read the forbidden lists from CLAUDE.md; check sections 7.1 and 16.");
  process.exit(1);
}

const BINARY = /\.(png|ico|jpe?g|webp|gif|woff2?|ttf|otf|zip|pdf)$/i;
const files = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard"], { encoding: "utf8" })
  .split("\n")
  .filter((file) => file && file !== "CLAUDE.md" && file !== "pnpm-lock.yaml" && !BINARY.test(file));

const hits: string[] = [];
for (const file of files) {
  let text: string;
  try {
    text = readFileSync(file, "utf8");
  } catch {
    continue;
  }
  text.split("\n").forEach((line, index) => {
    for (const rule of rules) {
      if (rule.regex.test(line)) hits.push(`${file}:${index + 1}: ${rule.name}: ${line.trim().slice(0, 120)}`);
    }
  });
}

if (hits.length > 0) {
  console.error("✗ Forbidden words or patterns found outside CLAUDE.md:");
  for (const hit of hits) console.error(`  ${hit}`);
  process.exit(1);
}
console.log(`✓ No forbidden words or patterns in ${files.length} files (${rules.length} rules read from CLAUDE.md).`);
