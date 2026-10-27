// pnpm design:check <slug> [--quick]
// Renders one design on its own (no Next.js) the way buyers and the gates see it: every declared state at 375, 768
// and 1440px in light and dark, plus the HTML version with compiled CSS. Runs axe (WCAG 2.2 AA), checks for
// horizontal overflow and console errors, and writes screenshots and two contact sheets to
// test-results/design-check/<slug>/. --quick renders 375 and 1440 only and skips the HTML version.
import { createReadStream, existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import path from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { chromium, type Browser, type Page } from "@playwright/test";
import { build } from "esbuild";
import { compileCss } from "./lib/css";
import { listDesignFolders } from "./lib/registry-files";
import { renderStates } from "./lib/ssr";
import { validateFolder } from "./lib/validate";

const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
const ROOT = path.resolve(".");
const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".woff2": "font/woff2",
  ".png": "image/png",
};

const slug = process.argv[2];
const quick = process.argv.includes("--quick");
if (!slug || slug.startsWith("--")) {
  console.error("Usage: pnpm design:check <slug> [--quick]");
  process.exit(1);
}

const folder = listDesignFolders().find((candidate) => candidate.slug === slug);
if (!folder) {
  console.error(`No design folder named "${slug}" in registry/designs/<category>/`);
  process.exit(1);
}

const OUT = path.join(ROOT, "test-results/design-check", slug);
const SITE = path.join(OUT, "site");
const SHOTS = path.join(OUT, "shots");

function serve(): Promise<Server> {
  const server = createServer((request, response) => {
    const url = new URL(request.url ?? "/", "http://localhost");
    const file = url.pathname.startsWith("/fonts/")
      ? path.join(ROOT, "public", url.pathname)
      : path.join(SITE, url.pathname === "/" ? "index.html" : url.pathname);
    if (!file.startsWith(ROOT) || !existsSync(file) || !statSync(file).isFile()) {
      response.writeHead(404).end();
      return;
    }
    response.writeHead(200, { "content-type": MIME[path.extname(file)] ?? "application/octet-stream" });
    createReadStream(file).pipe(response);
  });
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(server)));
}

const MODE_SCRIPT = `<script>document.documentElement.classList.toggle('dark',new URLSearchParams(location.search).get('mode')==='dark')</script>`;

async function prepare(problems: string[]) {
  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(SITE, { recursive: true });
  mkdirSync(SHOTS, { recursive: true });

  const entry = path.join(SITE, "entry.tsx");
  writeFileSync(
    entry,
    [
      'import { createRoot } from "react-dom/client";',
      `import Preview from ${JSON.stringify(path.join(folder!.dir, "preview.tsx"))};`,
      'const state = new URLSearchParams(location.search).get("state") ?? "default";',
      'createRoot(document.getElementById("root")!).render(<Preview state={state as never} />);',
    ].join("\n"),
  );
  await build({
    entryPoints: [entry],
    outfile: path.join(SITE, "app.js"),
    bundle: true,
    format: "esm",
    platform: "browser",
    jsx: "automatic",
    define: { "process.env.NODE_ENV": '"development"' },
    logLevel: "error",
  });
  const baseCss = path.join(ROOT, "registry/preview-base.css");
  writeFileSync(
    path.join(SITE, "style.css"),
    await compileCss(
      path.join(folder!.dir, "__design-check__.css"),
      [
        '@import "tailwindcss" source(none);',
        `@import ${JSON.stringify(baseCss)};`,
        `@source ${JSON.stringify(folder!.dir)};`,
        `@source ${JSON.stringify(path.join(ROOT, "registry/preview-kit.tsx"))};`,
      ].join("\n"),
      { minify: false },
    ),
  );
  writeFileSync(
    path.join(SITE, "index.html"),
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${slug} · design check</title><link rel="stylesheet" href="/style.css">${MODE_SCRIPT}</head><body><div id="root"></div><script type="module" src="/app.js"></script></body></html>`,
  );

  if (quick) return;
  const htmlSource = readFileSync(path.join(folder!.dir, "component.html"), "utf8");
  const twBlock = /<style type="text\/tailwindcss">([\s\S]*?)<\/style>/.exec(htmlSource)?.[1];
  if (!twBlock) {
    problems.push('component.html has no <style type="text/tailwindcss"> block');
    return;
  }
  writeFileSync(
    path.join(SITE, "html.css"),
    await compileCss(
      path.join(folder!.dir, "__design-check-html__.css"),
      [
        '@import "tailwindcss" source(none);',
        `@import ${JSON.stringify(baseCss)};`,
        `@source ${JSON.stringify(path.join(folder!.dir, "component.html"))};`,
        twBlock,
      ].join("\n"),
      { minify: false },
    ),
  );
  writeFileSync(
    path.join(SITE, "html.html"),
    htmlSource
      .replace(/<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/@tailwindcss\/browser@[^"]+"><\/script>/, MODE_SCRIPT)
      .replace(/<style type="text\/tailwindcss">[\s\S]*?<\/style>/, '<link rel="stylesheet" href="/html.css">'),
  );
}

type Shot = { variant: "react" | "html"; state: string; mode: "light" | "dark"; width: number; file: string };

async function check(page: Page, label: string, problems: string[]) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(250);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  if (overflow > 0) problems.push(`${label}: horizontal overflow of ${overflow}px`);
  const { violations } = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
  for (const violation of violations) {
    const targets = violation.nodes
      .slice(0, 3)
      .map((node) => node.target.join(" "))
      .join(" | ");
    problems.push(`${label}: axe ${violation.id} (${violation.help}) at ${targets}`);
  }
}

async function shoot(page: Page, file: string) {
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  const width = page.viewportSize()?.width ?? 1440;
  await page.screenshot({
    path: file,
    fullPage: height <= 2600,
    clip: height > 2600 ? { x: 0, y: 0, width, height: 2600 } : undefined,
  });
}

async function render(browser: Browser, base: string, states: string[], problems: string[]): Promise<Shot[]> {
  const shots: Shot[] = [];
  const widths = quick ? [375, 1440] : [375, 768, 1440];
  for (const mode of ["light", "dark"] as const) {
    const context = await browser.newContext({ colorScheme: mode, reducedMotion: "reduce" });
    const page = await context.newPage();
    page.on("console", (message) => {
      // motion's development build notes that reduced motion is on (the harness emulates it on purpose).
      if (message.text().includes("You have Reduced Motion enabled")) return;
      if (message.type() === "error" || message.type() === "warning") {
        problems.push(`console ${message.type()} (${mode}): ${message.text().slice(0, 300)}`);
      }
    });
    page.on("pageerror", (error) => problems.push(`page error (${mode}): ${error.message}`));
    for (const width of widths) {
      await page.setViewportSize({ width, height: 900 });
      for (const state of states) {
        await page.goto(`${base}/index.html?state=${state}&mode=${mode}`, { waitUntil: "networkidle" });
        const label = `react ${state} ${mode} ${width}px`;
        await check(page, label, problems);
        const file = path.join(SHOTS, `react-${state}-${mode}-${width}.png`);
        await shoot(page, file);
        shots.push({ variant: "react", state, mode, width, file });
      }
      if (!quick && width !== 768 && existsSync(path.join(SITE, "html.html"))) {
        await page.goto(`${base}/html.html?mode=${mode}`, { waitUntil: "networkidle" });
        await check(page, `html ${mode} ${width}px`, problems);
        const file = path.join(SHOTS, `html-default-${mode}-${width}.png`);
        await shoot(page, file);
        shots.push({ variant: "html", state: "default", mode, width, file });
      }
    }
    await context.close();
  }
  return shots;
}

async function contactSheet(browser: Browser, title: string, shots: Shot[], file: string) {
  if (shots.length === 0) return;
  const cells = shots
    .map(
      (shot) =>
        `<figure><img src="data:image/png;base64,${readFileSync(shot.file).toString("base64")}" style="width:${Math.round(shot.width * (shot.width >= 1440 ? 0.5 : shot.width >= 768 ? 0.5 : 0.75))}px"><figcaption>${shot.variant} · ${shot.state} · ${shot.mode} · ${shot.width}px</figcaption></figure>`,
    )
    .join("");
  const page = await browser.newPage({ viewport: { width: 1500, height: 800 } });
  await page.setContent(
    `<html><body style="margin:16px;background:#777;font:12px monospace;color:#fff"><h1 style="font-size:14px">${title}</h1><div style="display:flex;flex-wrap:wrap;gap:16px;align-items:flex-start">${cells}</div><style>figure{margin:0}img{display:block;border:1px solid #000;max-height:1300px;object-fit:cover;object-position:top}</style></body></html>`,
  );
  await page.screenshot({ path: file, fullPage: true });
  await page.close();
}

async function main() {
  const problems: string[] = [];
  const { meta, problems: staticProblems } = validateFolder(folder!);
  problems.push(...staticProblems.map((problem) => `validate: ${problem.message}`));
  if (!meta) {
    for (const problem of problems) console.error(`✗ ${problem}`);
    process.exit(1);
  }
  const ssr = await renderStates(folder!, meta);
  problems.push(...ssr.problems.map((problem) => `server render: ${problem}`));

  await prepare(problems);
  const server = await serve();
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const browser = await chromium.launch();
  try {
    const shots = await render(browser, base, meta.states, problems);
    const isDefault = (shot: Shot) => shot.state === "default";
    await contactSheet(
      browser,
      `${slug}: default state, React and HTML`,
      shots.filter((shot) => isDefault(shot) && (shot.width !== 768 || shot.mode === "light")),
      path.join(OUT, "sheet-default.png"),
    );
    await contactSheet(
      browser,
      `${slug}: other states`,
      shots.filter(
        (shot) =>
          !isDefault(shot) &&
          ((shot.width === 1440 && shot.mode === "light") || (shot.width === 375 && shot.mode === "dark")),
      ),
      path.join(OUT, "sheet-states.png"),
    );
    console.log(`\nScreenshots: ${path.relative(ROOT, SHOTS)}/ (${shots.length})`);
    console.log(`Contact sheets: ${path.relative(ROOT, path.join(OUT, "sheet-default.png"))}`);
    if (meta.states.length > 1)
      console.log(`                ${path.relative(ROOT, path.join(OUT, "sheet-states.png"))}`);
  } finally {
    await browser.close();
    server.close();
  }

  const unique = [...new Set(problems)];
  if (unique.length > 0) {
    console.error(`\n✗ ${slug}: ${unique.length} problem(s)`);
    for (const problem of unique) console.error(`  - ${problem}`);
    process.exit(1);
  }
  console.log(`\n✓ ${slug}: every state passes axe with no overflow or console errors.`);
}

main().catch((error: unknown) => {
  console.error(`✗ design:check: ${error instanceof Error ? (error.stack ?? error.message) : String(error)}`);
  process.exit(1);
});
