import { expect, test } from "@playwright/test";
import { expectNoAxeViolations, expectNoHorizontalOverflow, setColorScheme, watchConsole } from "./helpers";

const DOCS = [
  { href: "/docs", title: "Overview" },
  { href: "/docs/installation", title: "Installation" },
  { href: "/docs/cli", title: "CLI" },
  { href: "/docs/theming", title: "Theming" },
  { href: "/docs/ai-prompts", title: "AI prompts" },
  { href: "/docs/license", title: "License" },
];

test.describe("docs", () => {
  test("every page marks itself in the sidebar and has one h1", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    for (const doc of DOCS) {
      const response = await page.goto(doc.href);
      expect(response?.status(), doc.href).toBe(200);
      await expect(page.locator("h1")).toHaveCount(1);
      const current = page.locator('nav[aria-label="Docs"]:visible [aria-current="page"]');
      await expect(current).toHaveCount(1);
      await expect(current).toHaveText(doc.title);
    }
  });

  test("previous and next walk the docs in order", async ({ page }) => {
    await page.goto(DOCS[0]!.href);
    await expect(page.locator('[data-pager="previous"]')).toHaveCount(0);
    for (const doc of DOCS.slice(1)) {
      await page.locator('[data-pager="next"]').click();
      await expect(page).toHaveURL(doc.href);
      await expect(page.locator('nav[aria-label="Docs"]:visible [aria-current="page"]')).toHaveText(doc.title);
    }
    await expect(page.locator('[data-pager="next"]')).toHaveCount(0);
    await page.locator('[data-pager="previous"]').click();
    await expect(page).toHaveURL(DOCS.at(-2)!.href);
  });

  test("the mobile page picker opens in place and navigates", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto("/docs/installation");
    const picker = page.locator("details", { has: page.locator("summary", { hasText: "Installation" }) });
    await picker.locator("summary").click();
    await picker.getByRole("link", { name: "Theming" }).click();
    await expect(page).toHaveURL("/docs/theming");
    await expectNoHorizontalOverflow(page);
  });

  test("long pages list their sections and the links reach them", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/docs/cli");
    const toc = page.getByRole("navigation", { name: "On this page" });
    const links = toc.getByRole("link");
    expect(await links.count()).toBeGreaterThanOrEqual(3);
    const href = await links.nth(1).getAttribute("href");
    expect(href).toMatch(/^#/);
    await expect(page.locator(href!)).toHaveCount(1);
  });

  test("code blocks copy their exact source", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/docs/cli");
    const block = page.locator("figure", { hasText: '"registries"' });
    await block.locator("[data-copy-code]").click();
    await expect(block.locator("[data-copy-code]")).toContainText("Copied");
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(copied).toContain('"@iloveui": "http://localhost:3000/r/{name}.json"');
    expect(copied).not.toContain("%SITE_URL%");
  });

  for (const scheme of ["dark", "light"] as const) {
    for (const route of ["/docs", "/docs/cli", "/changelog"]) {
      test(`${route} has no axe violations in ${scheme}`, async ({ page }) => {
        const problems = watchConsole(page);
        await setColorScheme(page, scheme);
        await page.goto(route);
        await expectNoAxeViolations(page);
        expect(problems).toEqual([]);
      });
    }
  }
});

test.describe("changelog", () => {
  test("entries are dated and newest first", async ({ page }) => {
    await page.goto("/changelog");
    await expect(page.locator("h1")).toHaveCount(1);
    const dates = await page
      .locator("[data-changelog-entry] time")
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("datetime") ?? ""));
    expect(dates.length).toBeGreaterThan(0);
    expect(dates.every((date) => /^\d{4}-\d{2}-\d{2}$/.test(date))).toBe(true);
    expect([...dates].sort().reverse()).toEqual(dates);
    const ids = await page.locator("[data-changelog-entry] h2").evaluateAll((nodes) => nodes.map((node) => node.id));
    expect(new Set(ids).size).toBe(ids.length);
  });
});
