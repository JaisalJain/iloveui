import { expect, test } from "@playwright/test";
import { expectNoAxeViolations, expectNoHorizontalOverflow, setColorScheme, watchConsole } from "./helpers";

// Phase 5 pages owned outside the home and docs work: legal pages, contact, collections, SEO files and JSON-LD.

const PAGES = [
  "/license",
  "/terms",
  "/privacy",
  "/refunds",
  "/contact",
  "/collections",
  "/collections/saas-landing",
  "/collections/ai-app",
  "/collections/dashboard",
] as const;

test.describe("legal, contact and collection pages", () => {
  for (const route of PAGES) {
    for (const scheme of ["dark", "light"] as const) {
      test(`${route} renders cleanly in ${scheme}`, async ({ page }) => {
        const problems = watchConsole(page);
        await setColorScheme(page, scheme);
        const response = await page.goto(route);
        expect(response?.status()).toBe(200);
        await expect(page.locator("h1")).toHaveCount(1);
        await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", new RegExp(`${route}$`));
        await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /opengraph-image/);
        await expectNoAxeViolations(page);
        expect(problems).toEqual([]);
      });
    }
  }

  test("titles and descriptions are unique", async ({ page }) => {
    const titles = new Set<string>();
    const descriptions = new Set<string>();
    for (const route of PAGES) {
      await page.goto(route);
      const title = await page.title();
      const description = (await page.locator('meta[name="description"]').getAttribute("content")) ?? "";
      expect(titles.has(title), `duplicate title "${title}"`).toBe(false);
      expect(descriptions.has(description), `duplicate description on ${route}`).toBe(false);
      titles.add(title);
      descriptions.add(description);
    }
  });

  for (const width of [375, 768, 1440]) {
    test(`no horizontal overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      for (const route of PAGES) {
        await page.goto(route);
        await expectNoHorizontalOverflow(page);
      }
    });
  }

  test("legal pages carry the owner's terms", async ({ page }) => {
    await page.goto("/refunds");
    await expect(page.getByText("Full refund within 14 days of purchase. No reason needed.")).toBeVisible();
    await page.goto("/terms");
    await expect(page.getByText(/Merchant of Record and authorized reseller/).first()).toBeVisible();
    await expect(page.getByText("Governed by the laws of India.", { exact: true })).toBeVisible();
    await page.goto("/license");
    await expect(page.getByText(/Resell, sublicense or redistribute the designs/).first()).toBeVisible();
  });

  test("the table of contents jumps to its section", async ({ page }) => {
    await page.goto("/privacy");
    await page
      .getByRole("navigation", { name: "On this page" })
      .getByRole("link", { name: /Cookies/ })
      .click();
    await expect(page).toHaveURL(/#cookies$/);
    await expect(page.getByRole("heading", { name: /Cookies and local storage/ })).toBeInViewport();
  });

  test("an unknown collection is a 404", async ({ page }) => {
    const response = await page.goto("/collections/not-a-set");
    expect(response?.status()).toBe(404);
  });

  test("the 404 page searches the catalog", async ({ page }) => {
    const response = await page.goto("/this-page-is-missing");
    expect(response?.status()).toBe(404);
    await page.getByRole("searchbox", { name: "Search designs" }).fill("pricing");
    await page.getByRole("button", { name: "Search", exact: true }).click();
    await expect(page).toHaveURL(/\/designs\?q=pricing$/);
  });
});

test.describe("SEO files", () => {
  test("robots.txt allows the site, blocks private paths and points to the sitemap", async ({ request }) => {
    const response = await request.get("/robots.txt");
    expect(response.status()).toBe(200);
    const text = await response.text();
    expect(text).toContain("Allow: /");
    for (const path of ["/api/", "/account", "/dev/", "/checkout", "/preview/", "/r/"]) {
      expect(text).toContain(`Disallow: ${path}`);
    }
    expect(text).toMatch(/Sitemap: https?:\/\/[^\s]+\/sitemap\.xml/);
  });

  test("sitemap.xml lists every public route with absolute URLs", async ({ request }) => {
    const response = await request.get("/sitemap.xml");
    expect(response.status()).toBe(200);
    const xml = await response.text();
    const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => new URL(match[1]!).pathname);
    for (const path of [
      "/",
      "/designs",
      "/designs/hero",
      "/designs/forms/pillow-workspace-form",
      "/collections",
      "/collections/dashboard",
      "/pricing",
      "/docs",
      "/docs/cli",
      "/changelog",
      "/license",
      "/terms",
      "/privacy",
      "/refunds",
      "/contact",
    ]) {
      expect(urls, path).toContain(path);
    }
    expect(urls.some((path) => /^\/(api|account|preview|r|dev)\b/.test(path))).toBe(false);
    expect(new Set(urls).size).toBe(urls.length);
  });

  test("llms.txt lists the catalog with install commands and the docs", async ({ request }) => {
    const response = await request.get("/llms.txt");
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("text/plain");
    const text = await response.text();
    expect(text.startsWith("# iloveui\n")).toBe(true);
    expect(text).toContain("## Designs");
    expect(text).toContain("## Docs");
    expect(text).toContain("npx shadcn@latest add @iloveui/gridline-hero");
    expect(text).toMatch(/\[Gridline Hero\]\(https?:\/\/[^)]+\/designs\/hero\/gridline-hero\)/i);
    expect(text).toMatch(/\[CLI\]\(https?:\/\/[^)]+\/docs\/cli\)/);
  });
});

test.describe("JSON-LD", () => {
  async function jsonLd(page: import("@playwright/test").Page) {
    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(blocks.length).toBeGreaterThan(0);
    return blocks.map((block) => JSON.parse(block) as Record<string, unknown>);
  }

  test("/pricing describes Pro and Team as Products with USD and INR offers", async ({ page }) => {
    await page.goto("/pricing");
    const [data] = await jsonLd(page);
    const products = (data?.["@graph"] ?? []) as {
      "@type": string;
      name: string;
      offers: { price: string; priceCurrency: string }[];
      aggregateRating?: unknown;
      review?: unknown;
    }[];
    expect(products.map((product) => product["@type"])).toEqual(["Product", "Product"]);
    expect(products.map((product) => product.name)).toEqual(["iloveui Pro", "iloveui Team"]);
    expect(products[0]?.offers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ price: "99.00", priceCurrency: "USD" }),
        expect.objectContaining({ price: "4999.00", priceCurrency: "INR" }),
      ]),
    );
    expect(products[1]?.offers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ price: "299.00", priceCurrency: "USD" }),
        expect.objectContaining({ price: "14999.00", priceCurrency: "INR" }),
      ]),
    );
    for (const product of products) {
      expect(product.aggregateRating).toBeUndefined();
      expect(product.review).toBeUndefined();
    }
  });

  test("design pages describe themselves as SoftwareSourceCode", async ({ page }) => {
    await page.goto("/designs/hero/gridline-hero");
    const [data] = await jsonLd(page);
    expect(data?.["@type"]).toBe("SoftwareSourceCode");
    expect(data?.name).toBeTruthy();
  });
});
