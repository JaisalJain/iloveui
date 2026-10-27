import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { PAGE_SIZE } from "@/lib/browse";
import type { Catalog } from "@/lib/catalog-types";
import { CATEGORIES, STYLE_FAMILIES } from "@/registry/definitions";
import { expectNoAxeViolations, expectNoHorizontalOverflow, setColorScheme, watchConsole } from "./helpers";

// /designs, its category pages and real paginated URLs: static rendering, URL-synced filters, search, sort,
// Load more, the mobile filter sheet, and the empty and skeleton states.
const catalog = JSON.parse(readFileSync("registry/generated/catalog.json", "utf8")) as Catalog;
const designs = catalog.designs;
const free = designs.filter((design) => design.tier === "free");
const emptyCategory = CATEGORIES.find((category) => !designs.some((design) => design.category === category.slug));
const fullCategory = CATEGORIES.find((category) => designs.some((design) => design.category === category.slug))!;

const results = (page: Page) =>
  page.getByRole("heading", { name: "Results" }).locator("xpath=..").locator("a[href^='/designs/']");
const count = (page: Page) => page.locator("p[aria-live]");

test.describe("browse routes", () => {
  const routes = [
    "/designs",
    `/designs/${fullCategory.slug}`,
    ...(emptyCategory ? [`/designs/${emptyCategory.slug}`] : []),
  ];

  for (const route of routes) {
    for (const scheme of ["light", "dark"] as const) {
      test(`${route} renders cleanly in ${scheme}`, async ({ page }) => {
        const problems = watchConsole(page);
        await setColorScheme(page, scheme);
        const response = await page.goto(route);
        expect(response?.status()).toBe(200);
        await expect(page.locator("h1")).toHaveCount(1);
        await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", new RegExp(`${route}$`));
        await expectNoAxeViolations(page);
        expect(problems).toEqual([]);
      });
    }
    for (const width of [375, 768, 1440]) {
      test(`${route} has no horizontal overflow at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(route);
        await expectNoHorizontalOverflow(page);
      });
    }
  }

  test("titles and descriptions are unique across browse routes", async ({ page }) => {
    const titles = new Set<string>();
    const descriptions = new Set<string>();
    for (const route of ["/designs", ...CATEGORIES.map((category) => `/designs/${category.slug}`)]) {
      await page.goto(route);
      titles.add(await page.title());
      descriptions.add((await page.locator('meta[name="description"]').getAttribute("content")) ?? "");
    }
    expect(titles.size).toBe(CATEGORIES.length + 1);
    expect(descriptions.size).toBe(CATEGORIES.length + 1);
  });

  test("unknown categories and out-of-range pages are 404", async ({ page }) => {
    for (const route of ["/designs/not-a-category", "/designs/page/1", "/designs/page/0", "/designs/page/999"]) {
      expect((await page.goto(route))?.status(), route).toBe(404);
    }
  });

  test("the server renders the first page without JavaScript", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto("/designs");
    await expect(results(page)).toHaveCount(Math.min(PAGE_SIZE, designs.length));
    if (designs.length > PAGE_SIZE) {
      await expect(page.getByRole("link", { name: "Load more" })).toHaveAttribute("href", "/designs/page/2");
    }
    await context.close();
  });
});

test.describe("filters", () => {
  test("every desktop filter is visible without scrolling", async ({ page }) => {
    for (const [width, height] of [
      [1440, 900],
      [1280, 800],
      [1024, 768],
    ] as const) {
      await page.setViewportSize({ width, height });
      await page.goto("/designs");
      for (const control of [
        page.getByRole("radiogroup", { name: "Tier" }),
        page.getByRole("button", { name: /^Style family/ }),
        page.getByRole("button", { name: "Has motion", exact: true }),
        page.getByRole("radiogroup", { name: "Preferred code format" }),
        page.getByRole("radiogroup", { name: "Sort" }),
      ]) {
        await expect(control).toBeInViewport();
      }
    }
  });

  test("tier, family and motion filters update results, counts and the URL", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/designs");
    await expect(count(page)).toHaveText(`${designs.length} designs`);

    await page.getByRole("radiogroup", { name: "Tier" }).getByRole("radio", { name: "Free" }).click();
    await expect(page).toHaveURL(/\/designs\?tier=free$/);
    await expect(results(page)).toHaveCount(free.length);

    const family = free[0]!.styleFamily;
    const familyName = STYLE_FAMILIES.find((candidate) => candidate.slug === family)!.name;
    await page.getByRole("button", { name: /^Style family/ }).click();
    const menu = page.getByRole("menu");
    await expect(menu).toBeVisible();
    // The menu opens with a short pop-in; axe measures contrast once it has settled.
    await menu.evaluate((element) => Promise.all(element.getAnimations().map((animation) => animation.finished)));
    await expectNoAxeViolations(page);
    await menu.getByRole("menuitemcheckbox", { name: new RegExp(`^${familyName}`) }).click();
    await expect(page).toHaveURL(new RegExp(`family=${family}`));
    // The menu stays open for picking several families; Escape closes it and returns focus to the trigger.
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
    await expect(page.getByRole("button", { name: /^Style family\s*1\s*selected/ })).toBeFocused();
    const expected = free.filter((design) => design.styleFamily === family);
    await expect(results(page)).toHaveCount(expected.length);

    await page.getByRole("button", { name: "Has motion", exact: true }).click();
    await expect(page).toHaveURL(/motion=1/);
    await expect(page.getByRole("button", { name: "Has motion", exact: true })).toHaveAttribute("aria-pressed", "true");
    const withMotion = expected.filter((design) => design.hasMotion);
    if (withMotion.length === 0) {
      await expect(page.getByRole("heading", { name: "Nothing matches these filters." })).toBeVisible();
      await page.getByRole("button", { name: "Clear filters" }).click();
    } else {
      await expect(results(page)).toHaveCount(withMotion.length);
      await page.getByRole("button", { name: "Clear all" }).click();
    }
    await expect(page).toHaveURL(/\/designs$/);
    await expect(results(page)).toHaveCount(Math.min(PAGE_SIZE, designs.length));
  });

  test("a filtered URL renders filtered results on load", async ({ page }) => {
    await page.goto("/designs?tier=pro");
    const pro = designs.filter((design) => design.tier === "pro");
    await expect(results(page)).toHaveCount(Math.min(PAGE_SIZE, pro.length));
    await expect(page.getByRole("radiogroup", { name: "Tier" }).getByRole("radio", { name: "Pro" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await expect(page.locator("html")).not.toHaveAttribute("data-browse-pending", /.*/);
  });

  test("/ focuses search, which matches names and shows an empty state", async ({ page }) => {
    await page.goto("/designs");
    await page.locator("h1").click();
    await page.keyboard.press("/");
    const field = page.getByRole("searchbox", { name: "Search designs" });
    await expect(field).toBeFocused();
    const target = designs[0]!;
    await field.fill(target.name);
    await expect(page).toHaveURL(/q=/);
    await expect(results(page).filter({ hasText: target.name })).toHaveCount(1);
    await field.fill("qqqqzzzz");
    await expect(page.getByRole("heading", { name: "Nothing matches these filters." })).toBeVisible();
    await field.press("Escape");
    await expect(field).toHaveValue("");
  });

  test("Most copied sorts by copy counts from /api/metrics", async ({ page }) => {
    const [first, second] = [...designs].sort((a, b) => a.name.localeCompare(b.name));
    await page.route("/api/metrics", (route) =>
      route.fulfill({ json: { copies: { [second!.slug]: 9, [first!.slug]: 3 } } }),
    );
    await page.goto("/designs");
    await page.getByRole("radiogroup", { name: "Sort" }).getByRole("radio", { name: "Most copied" }).click();
    await expect(page).toHaveURL(/sort=copied/);
    await expect(results(page).first()).toHaveAttribute("href", `/designs/${second!.category}/${second!.slug}`);
    await expect(results(page).nth(1)).toHaveAttribute("href", `/designs/${first!.category}/${first!.slug}`);
  });

  test("the format preference is stored for the design page", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/designs");
    await page.getByRole("radiogroup", { name: "Preferred code format" }).getByRole("radio", { name: "HTML" }).click();
    await expect(page).toHaveURL(/format=html/);
    expect(await page.evaluate(() => localStorage.getItem("iloveui.format"))).toBe("html");
    await expect(results(page)).toHaveCount(Math.min(PAGE_SIZE, designs.length));
  });

  test("category links keep the filters and show category counts", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/designs?tier=free");
    const nav = page.getByRole("navigation", { name: "Categories" });
    await nav.getByRole("link", { name: new RegExp(`^${fullCategory.name}`) }).click();
    await expect(page).toHaveURL(new RegExp(`/designs/${fullCategory.slug}\\?tier=free$`));
    await expect(page.locator("h1")).toHaveText(fullCategory.name);
    await expect(nav.getByRole("link", { name: new RegExp(`^${fullCategory.name}`) })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });
});

test.describe("mobile", () => {
  test("filters open in a sheet with an active count", async ({ page }) => {
    const problems = watchConsole(page);
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/designs");
    await expect(page.getByRole("complementary", { name: "Categories" })).toBeHidden();
    await page.getByRole("button", { name: /^Filters/ }).click();
    const sheet = page.getByRole("dialog", { name: "Filters" });
    await expect(sheet).toBeVisible();
    await expectNoAxeViolations(page);
    await sheet.getByRole("radiogroup", { name: "Tier" }).getByRole("radio", { name: "Pro" }).click();
    await sheet.getByRole("button", { name: /^Show \d+ designs?$/ }).click();
    await expect(sheet).toBeHidden();
    await expect(page.getByRole("button", { name: /^Filters\s*1\s*active$/ })).toBeVisible();
    await expectNoHorizontalOverflow(page);
    expect(problems).toEqual([]);
  });
});

test.describe("empty category", () => {
  test.skip(!emptyCategory, "every category has designs");

  test("points to all designs", async ({ page }) => {
    await page.goto(`/designs/${emptyCategory!.slug}`);
    await expect(page.getByRole("heading", { name: `Nothing in ${emptyCategory!.name} yet.` })).toBeVisible();
    await page.getByRole("link", { name: "Browse all designs" }).click();
    await expect(page).toHaveURL(/\/designs$/);
  });
});

test.describe("pagination", () => {
  test.skip(designs.length <= PAGE_SIZE, "the catalog fits on one page");

  test("Load more appends the next page in place, and page 2 is a real URL", async ({ page }) => {
    await page.goto("/designs");
    await page.getByRole("link", { name: "Load more" }).click();
    await expect(results(page)).toHaveCount(Math.min(PAGE_SIZE * 2, designs.length));
    await expect(page).toHaveURL(/\/designs$/);
    await expect(results(page).nth(PAGE_SIZE)).toBeFocused();

    const response = await page.goto("/designs/page/2");
    expect(response?.status()).toBe(200);
    await expect(results(page)).toHaveCount(Math.min(PAGE_SIZE, designs.length - PAGE_SIZE));
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/designs\/page\/2$/);
  });
});
