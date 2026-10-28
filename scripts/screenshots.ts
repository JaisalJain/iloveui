// pnpm screenshots: captures the README images in docs/screenshots/ from a running site (start it first with
// `pnpm preview`, or pass a base URL). Each view is taken in light and dark at 1440 x 900, twice the pixel density.
//   home         the hero wall
//   designs      /designs with live card thumbnails
//   theme-lab    a design page re-themed through Theme Lab, with the accent picker open
import { mkdirSync } from "node:fs";
import { chromium, expect, type Page } from "@playwright/test";
import { normalizeTheme, themeCss } from "../lib/theme";

const BASE_URL = process.argv[2] ?? "http://localhost:3000";
const OUT_DIR = "docs/screenshots";
const DESIGN_PAGE = "/designs/dashboards/tally-ops-dashboard";
const THEME = normalizeTheme({
  accent: "#0F9F6E",
  neutral: "stone",
  radius: 14,
  font: "geist",
  density: "comfortable",
});
// Stored the way Theme Lab stores it: preview documents read the CSS before their first paint.
const STORED_THEME = JSON.stringify({ ...THEME, css: themeCss(THEME) });

/** Waits until every thumbnail frame near the viewport has a src and its document has loaded. */
async function thumbnailsLoaded(page: Page) {
  await page.waitForFunction(() => {
    const frames = [...document.querySelectorAll<HTMLIFrameElement>("iframe[data-thumb], iframe[data-src]")].filter(
      (frame) => {
        const box = frame.getBoundingClientRect();
        return box.bottom > 0 && box.top < window.innerHeight && box.width > 0;
      },
    );
    return frames.length > 0 && frames.every((frame) => frame.src);
  });
  await page.waitForLoadState("load");
  const thumbs = page.frames().filter((frame) => frame.url().includes("/thumbs/"));
  await Promise.all(thumbs.map((frame) => frame.waitForLoadState("load").catch(() => undefined)));
}

/** --iu-accent on the root of the design page's preview frame, once it has booted. */
async function previewAccent(page: Page): Promise<string> {
  const frame = page.frames().find((candidate) => candidate.url().includes("/preview/"));
  if (!frame) return "";
  return frame
    .evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--iu-accent").trim().toUpperCase())
    .catch(() => "");
}

const VIEWS: { name: string; capture: (page: Page) => Promise<void> }[] = [
  {
    name: "home",
    capture: async (page) => {
      await page.goto(BASE_URL);
      await thumbnailsLoaded(page);
      await page.waitForTimeout(1500);
    },
  },
  {
    name: "designs",
    capture: async (page) => {
      await page.goto(`${BASE_URL}/designs`);
      await page.mouse.wheel(0, 260);
      await thumbnailsLoaded(page);
      await page.waitForTimeout(1000);
    },
  },
  {
    name: "theme-lab",
    capture: async (page) => {
      await page.goto(`${BASE_URL}${DESIGN_PAGE}`);
      const stage = page.locator("iframe[src*='/preview/']").first();
      await stage.scrollIntoViewIfNeeded();
      await page.mouse.wheel(0, -120);
      await expect.poll(() => previewAccent(page), { timeout: 30_000 }).toBe(THEME.accent);
      await page
        .getByRole("region", { name: "Theme Lab" })
        .getByRole("button", { name: /^Accent / })
        .click();
      await page.getByRole("dialog", { name: "Accent color" }).waitFor();
      await page.waitForTimeout(800);
    },
  },
];

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  for (const scheme of ["light", "dark"] as const) {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 2,
      colorScheme: scheme,
    });
    await context.addInitScript(
      ([theme, mode]) => {
        window.localStorage.setItem("iloveui.theme", theme);
        window.localStorage.setItem("iloveui.mode", mode);
      },
      [STORED_THEME, scheme] as const,
    );
    for (const view of VIEWS) {
      const page = await context.newPage();
      // Only the Theme Lab view shows a custom theme; the others show the defaults.
      if (view.name !== "theme-lab") await page.addInitScript(() => window.localStorage.removeItem("iloveui.theme"));
      await view.capture(page);
      await page.screenshot({ path: `${OUT_DIR}/${view.name}-${scheme}.png` });
      console.log(`✓ ${OUT_DIR}/${view.name}-${scheme}.png`);
      await page.close();
    }
    await context.close();
  }
  await browser.close();
}

main().catch((error: unknown) => {
  console.error(`✗ screenshots: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
