// pnpm lighthouse: Lighthouse (mobile, its default) on the pages spec section 13 names, against the production build
// served locally (start it with `pnpm preview` first, or set LIGHTHOUSE_URL). Fails when a score or metric misses its
// target. INP needs real interactions, so Total Blocking Time stands in for it in this lab run, as Lighthouse does.
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";

const BASE_URL = process.env.LIGHTHOUSE_URL ?? "http://localhost:3000";
// Run through pnpm dlx, pinned, outside the project's dependencies: installed as a dependency, Lighthouse brings
// @opentelemetry/api, which satisfies an optional peer of Next.js and changes the packages the app resolves.
const LIGHTHOUSE = "lighthouse@13.5.0";
const PAGES = ["/", "/designs", "/designs/ecommerce/atelier-product-page"];
const OUT = path.resolve("test-results/lighthouse");

const SCORE_TARGETS = { performance: 95, accessibility: 100, "best-practices": 100, seo: 100 } as const;
const METRIC_TARGETS = [
  { id: "largest-contentful-paint", label: "LCP", max: 2000, format: (v: number) => `${Math.round(v)} ms` },
  { id: "cumulative-layout-shift", label: "CLS", max: 0.05, format: (v: number) => v.toFixed(3) },
  { id: "total-blocking-time", label: "TBT", max: 200, format: (v: number) => `${Math.round(v)} ms` },
] as const;

type Report = {
  categories: Record<keyof typeof SCORE_TARGETS, { score: number | null }>;
  audits: Record<string, { numericValue?: number }>;
};

mkdirSync(OUT, { recursive: true });
const failures: string[] = [];

for (const page of PAGES) {
  const url = new URL(page, BASE_URL).toString();
  const file = path.join(OUT, `${page === "/" ? "home" : page.slice(1).replaceAll("/", "_")}.json`);
  const status = spawnSync(
    "pnpm",
    [
      "dlx",
      LIGHTHOUSE,
      url,
      "--output=json",
      `--output-path=${file}`,
      "--quiet",
      "--chrome-flags=--headless=new --no-sandbox",
    ],
    { stdio: "inherit" },
  ).status;
  if (status !== 0) {
    failures.push(`${page}: Lighthouse did not finish (exit ${status ?? "unknown"})`);
    continue;
  }
  const report = JSON.parse(readFileSync(file, "utf8")) as Report;
  const scores = Object.entries(SCORE_TARGETS).map(([id, target]) => {
    const score = Math.round((report.categories[id as keyof typeof SCORE_TARGETS].score ?? 0) * 100);
    if (score < target) failures.push(`${page}: ${id} ${score} (target ${target})`);
    return `${id} ${score}`;
  });
  const metrics = METRIC_TARGETS.map(({ id, label, max, format }) => {
    const value = report.audits[id]?.numericValue ?? Number.POSITIVE_INFINITY;
    if (value >= max) failures.push(`${page}: ${label} ${format(value)} (target under ${format(max)})`);
    return `${label} ${format(value)}`;
  });
  console.log(`\n${page}\n  ${scores.join(" · ")}\n  ${metrics.join(" · ")}`);
}

if (failures.length > 0) {
  console.error(`\n✗ Lighthouse targets missed:\n${failures.map((failure) => `  ${failure}`).join("\n")}`);
  process.exit(1);
}
console.log(`\n✓ Every section 13 Lighthouse target met. Reports in ${path.relative(process.cwd(), OUT)}/`);
