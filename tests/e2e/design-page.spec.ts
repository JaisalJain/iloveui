import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { expectNoAxeViolations, expectNoHorizontalOverflow, setColorScheme } from "./helpers";

// The design page (/designs/[category]/[slug]): preview stage controls reach the frame, code copies carry Theme Lab
// tokens, bookmarks persist, Pro pages never carry Pro source, and the page passes axe in both themes.

type Meta = { slug: string; category: string; tier: "free" | "pro" };
const ROOT = "registry/designs";
const designs = readdirSync(ROOT).flatMap((category) =>
  readdirSync(path.join(ROOT, category)).map((slug) => {
    const dir = path.join(ROOT, category, slug);
    return { dir, meta: JSON.parse(readFileSync(path.join(dir, "meta.json"), "utf8")) as Meta };
  }),
);
const FREE = designs.find((design) => design.meta.slug === "pillow-workspace-form") ?? designs[0]!;
const PRO = designs.find((design) => design.meta.slug === "atelier-product-page") ?? designs[1]!;
/** Every source file of the site itself: a line that also appears there is generic code, not a design's. */
function siteSource(dir: string): string {
  return readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter((entry) => entry.isFile() && /\.(ts|tsx)$/.test(entry.name))
    .map((entry) => readFileSync(path.join(entry.parentPath, entry.name), "utf8"))
    .join("\n");
}
const SITE_SOURCE = ["app", "components", "lib"].map(siteSource).join("\n");
const urlOf = (meta: Meta) => `/designs/${meta.category}/${meta.slug}`;

/** Lines long and specific enough that finding one on the page means Pro source leaked (as in pro-source.test.ts). */
function distinctiveLines(dir: string): string[] {
  return ["component.tsx", "component.html", "ai-prompt.md"].flatMap((file) =>
    readFileSync(path.join(dir, file), "utf8")
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length >= 28 && !/^(import |export |\/\/|\*|<\/|\)|\}|"use client")/.test(line))
      // Public by nature: the HTML document title is the design's name, and icon geometry comes from lucide.
      .filter((line) => !/^<(title|path|circle|rect|line|polyline|polygon)[ >]/.test(line)),
  );
}

async function previewFrame(page: Page) {
  const handle = await page.locator("iframe[data-preview]").first().elementHandle();
  const frame = await handle?.contentFrame();
  if (!frame) throw new Error("preview frame missing");
  await frame.waitForLoadState("load");
  await frame.locator("h1, h2, h3, h4, p, label").first().waitFor();
  return frame;
}

test.describe("design page", () => {
  test("presets and the keyboard handle set the frame width", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(urlOf(FREE.meta));
    const frame = page.locator("iframe[data-preview]").first();
    const readout = page.locator("[data-stage-readout]");
    const handle = page.getByRole("separator", { name: "Preview width" });

    await page.getByRole("radio", { name: "375 pixels" }).click();
    await expect(readout).toHaveText("375 px");
    await expect(handle).toHaveAttribute("aria-valuenow", "375");
    await expect.poll(async () => (await frame.boundingBox())?.width).toBeCloseTo(375, 0);

    await page.getByRole("radio", { name: "768 pixels" }).click();
    await expect(readout).toHaveText("768 px");

    await handle.focus();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await expect(handle).toHaveAttribute("aria-valuenow", "788");
    await expect(readout).toHaveText("788 px");
    await page.keyboard.press("ArrowLeft");
    await expect(readout).toHaveText("778 px");

    // Wider than the stage: the frame keeps its width and is scaled down to fit.
    await page.keyboard.press("End");
    await expect(handle).toHaveAttribute("aria-valuenow", "1920");
    await expect(readout).toHaveText(/^1920 px · \d+%$/);
    await page.keyboard.press("Home");
    await expect(readout).toHaveText("320 px");
  });

  test("mode, state and Replay reach the frame", async ({ page }) => {
    await setColorScheme(page, "light");
    await page.goto(urlOf(FREE.meta));
    const frame = await previewFrame(page);
    await expect(frame.locator("html")).not.toHaveClass(/\bdark\b/);

    await page.getByRole("radio", { name: "Dark" }).click();
    await expect(frame.locator("html")).toHaveClass(/\bdark\b/);
    await page.getByRole("radio", { name: "Light" }).click();
    await expect(frame.locator("html")).not.toHaveClass(/\bdark\b/);

    const markup = () => frame.locator("body").innerHTML();
    const initial = await markup();
    await page.getByRole("button", { name: /^State/ }).click();
    await page.getByRole("menuitemradio", { name: "Error" }).click();
    await expect.poll(markup).not.toBe(initial);

    // Replay remounts the design: an element marked now is replaced by a fresh one.
    await frame
      .locator("body")
      .locator("h1, h2, h3, h4, p, label")
      .first()
      .evaluate((element) => element.setAttribute("data-e2e", "1"));
    await expect(frame.locator("[data-e2e]")).toHaveCount(1);
    await page.getByRole("button", { name: "Replay" }).click();
    await expect(frame.locator("[data-e2e]")).toHaveCount(0);
  });

  test("free code copies with the button and with C, and HTML carries the Theme Lab tokens", async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.addInitScript(() => {
      window.localStorage.setItem(
        "iloveui.theme",
        JSON.stringify({ accent: "#0F9F6E", neutral: "stone", radius: 4, font: "geist", density: "compact" }),
      );
      window.localStorage.removeItem("iloveui.format");
    });
    await page.goto(urlOf(FREE.meta));
    const clipboard = () => page.evaluate(() => navigator.clipboard.readText());
    const source = readFileSync(path.join(FREE.dir, "component.tsx"), "utf8");

    const viewer = page.locator("[data-code-viewer]");
    await viewer.scrollIntoViewIfNeeded();
    await expect(viewer).toContainText("use client");

    await page.locator("[data-copy-code]").click();
    await expect(page.locator("[data-copy-code]")).toContainText("Copied");
    expect(await clipboard()).toBe(source);

    await page.getByRole("tab", { name: "HTML" }).click();
    await expect(viewer).toContainText("<!doctype html>", { ignoreCase: true });
    await page.evaluate(() => navigator.clipboard.writeText(""));
    await page.keyboard.press("c");
    await expect.poll(clipboard).toContain("--iu-accent: #0F9F6E;");
    const html = await clipboard();
    expect(html).toContain("--iu-radius: 4px;");
    expect(html).toContain("/* iloveui:tokens:end */");
    expect(await page.evaluate(() => window.localStorage.getItem("iloveui.format"))).toBe("html");
  });

  for (const { dir, meta } of designs.filter((design) => design.meta.tier === "pro")) {
    test(`Pro design ${meta.slug} sends no Pro source`, async ({ page }) => {
      const freeLines = new Set(
        designs.filter((design) => design.meta.tier === "free").flatMap((design) => distinctiveLines(design.dir)),
      );
      const lines = distinctiveLines(dir).filter((line) => !freeLines.has(line) && !SITE_SOURCE.includes(line));
      expect(lines.length).toBeGreaterThan(10);

      const bodies: Promise<{ url: string; text: string }>[] = [];
      page.on("response", (response) => {
        // The live preview runs the compiled, minified component inside its own frame by design (DECISIONS.md);
        // everything the page itself loads is checked.
        if (response.request().frame() !== page.mainFrame()) return;
        bodies.push(
          response
            .text()
            .then((text) => ({ url: response.url(), text }))
            .catch(() => ({ url: response.url(), text: "" })),
        );
      });
      await page.goto(urlOf(meta), { waitUntil: "networkidle" });
      await page.locator("section[aria-labelledby=code-heading]").scrollIntoViewIfNeeded();
      await page.getByRole("tab", { name: "HTML" }).click();
      await page.waitForLoadState("networkidle");
      await expect(page.getByRole("link", { name: "See pricing" }).first()).toBeVisible();

      const documents = [{ url: "page", text: await page.content() }, ...(await Promise.all(bodies))];
      const leaks = documents.flatMap(({ url, text }) =>
        lines.filter((line) => text.includes(line)).map((line) => `${url}: ${line}`),
      );
      expect(leaks).toEqual([]);
    });
  }

  test("a bookmark survives a reload", async ({ page }) => {
    await page.goto(urlOf(FREE.meta));
    const bookmark = page.getByRole("button", { name: /^Bookmark/ });
    await expect(bookmark).toHaveAttribute("aria-pressed", "false");
    await bookmark.click();
    await expect(bookmark).toHaveAttribute("aria-pressed", "true");
    await page.reload();
    await expect(page.getByRole("button", { name: /^Bookmark/ })).toHaveAttribute("aria-pressed", "true");
    expect(await page.evaluate(() => window.localStorage.getItem("iloveui.bookmarks"))).toContain(FREE.meta.slug);
  });

  test("a slug under the wrong category is a 404", async ({ page }) => {
    const response = await page.goto(`/designs/${FREE.meta.category === "hero" ? "forms" : "hero"}/${FREE.meta.slug}`);
    expect(response?.status()).toBe(404);
  });

  for (const { meta } of [FREE, PRO]) {
    for (const scheme of ["light", "dark"] as const) {
      test(`axe: ${meta.tier} design page in ${scheme}`, async ({ page }) => {
        await setColorScheme(page, scheme);
        await page.goto(urlOf(meta), { waitUntil: "networkidle" });
        await page.locator("section[aria-labelledby=code-heading]").scrollIntoViewIfNeeded();
        if (meta.tier === "free") await expect(page.locator("[data-code-viewer]")).toBeVisible();
        await expectNoAxeViolations(page);
        await page.getByRole("button", { name: /^State/ }).click();
        await expect(page.getByRole("menu")).toBeVisible();
        await expectNoAxeViolations(page);
        await page.keyboard.press("Escape");
        await page.setViewportSize({ width: 375, height: 800 });
        await expectNoHorizontalOverflow(page);
      });
    }
  }
});
