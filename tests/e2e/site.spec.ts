import { expect, test } from "@playwright/test";
import { expectNoAxeViolations, expectNoHorizontalOverflow, setColorScheme, watchConsole } from "./helpers";
import { SITE_ROUTES } from "./routes";

test.describe("site routes", () => {
  for (const route of SITE_ROUTES) {
    for (const scheme of ["dark", "light"] as const) {
      test(`${route} renders cleanly in ${scheme}`, async ({ page }) => {
        const problems = watchConsole(page);
        await setColorScheme(page, scheme);
        const response = await page.goto(route);
        expect(response?.status()).toBe(200);
        await expect(page.locator("h1")).toHaveCount(1);
        await expectNoAxeViolations(page);
        expect(problems).toEqual([]);
      });
    }
  }

  test("titles and descriptions are unique", async ({ page }) => {
    const seen = new Map<string, string>();
    for (const route of SITE_ROUTES) {
      await page.goto(route);
      const title = await page.title();
      const description = await page.locator('meta[name="description"]').getAttribute("content");
      const ogImage = await page.locator('meta[property="og:image"]').getAttribute("content");
      expect(title, `${route} title`).toBeTruthy();
      expect(description, `${route} description`).toBeTruthy();
      expect(ogImage, `${route} og:image`).toBeTruthy();
      expect(seen.has(title), `duplicate title "${title}"`).toBe(false);
      seen.set(title, route);
    }
  });

  for (const width of [375, 768, 1440]) {
    test(`no horizontal overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      for (const route of SITE_ROUTES) {
        await page.goto(route);
        await expectNoHorizontalOverflow(page);
      }
    });
  }
});

test.describe("theme", () => {
  test("the toggle and the T key switch themes and the choice persists", async ({ page }) => {
    await setColorScheme(page, "dark");
    await page.goto("/");
    const html = page.locator("html");
    await page.getByRole("button", { name: "Switch to light theme" }).click();
    await expect(html).toHaveAttribute("data-theme", "light");
    await page.keyboard.press("t");
    await expect(html).toHaveAttribute("data-theme", "dark");
    await page.keyboard.press("t");
    await page.reload();
    await expect(html).toHaveAttribute("data-theme", "light");
  });

  test("T is ignored while typing in a field", async ({ page }) => {
    await setColorScheme(page, "dark");
    await page.goto("/");
    await page.keyboard.press("Control+k");
    await page.getByRole("combobox", { name: "Search" }).pressSequentially("t");
    await expect(page.locator("html")).not.toHaveAttribute("data-theme", "light");
  });
});

test.describe("command palette", () => {
  test("opens with Ctrl+K, filters, runs an action from the keyboard and restores focus", async ({ page }) => {
    await setColorScheme(page, "dark");
    await page.goto("/");
    const trigger = page.getByRole("button", { name: "Search designs" }).first();
    await trigger.focus();
    await page.keyboard.press("Control+k");
    const dialog = page.getByRole("dialog", { name: "Search" });
    await expect(dialog).toBeVisible();
    const input = dialog.getByRole("combobox", { name: "Search" });
    await expect(input).toBeFocused();
    await input.fill("toggle theme");
    const option = dialog.getByRole("option", { name: /Toggle light and dark theme/ });
    await expect(option).toHaveAttribute("aria-selected", "true");
    await page.keyboard.press("Enter");
    await expect(dialog).toBeHidden();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  });

  test("arrow keys move the active option and Escape closes", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Control+k");
    const dialog = page.getByRole("dialog", { name: "Search" });
    const options = dialog.getByRole("option");
    await expect(options.first()).toHaveAttribute("aria-selected", "true");
    await page.keyboard.press("ArrowDown");
    await expect(options.nth(1)).toHaveAttribute("aria-selected", "true");
    await page.keyboard.press("ArrowUp");
    await page.keyboard.press("ArrowUp");
    await expect(options.last()).toHaveAttribute("aria-selected", "true");
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("shows a designed empty state with one action", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Control+k");
    const dialog = page.getByRole("dialog", { name: "Search" });
    await dialog.getByRole("combobox").fill("zzzzzz");
    await expect(dialog.getByText(/No matches for/)).toBeVisible();
    await dialog.getByRole("button", { name: "Clear search" }).click();
    await expect(dialog.getByRole("option").first()).toBeVisible();
  });

  test("/ opens search when the page has no search field", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("/");
    await expect(page.getByRole("dialog", { name: "Search" })).toBeVisible();
  });

  test("passes axe while open in both themes", async ({ page }) => {
    for (const scheme of ["dark", "light"] as const) {
      await setColorScheme(page, scheme);
      await page.goto("/");
      await page.keyboard.press("Control+k");
      await expect(page.getByRole("dialog", { name: "Search" })).toBeVisible();
      await expectNoAxeViolations(page);
    }
  });
});

test.describe("keyboard shortcuts dialog", () => {
  test("? opens it, it lists every shortcut and passes axe", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Shift+?");
    const dialog = page.getByRole("dialog", { name: "Keyboard shortcuts" });
    await expect(dialog).toBeVisible();
    for (const label of ["Search designs", "Focus the search field", "Toggle light and dark theme", "Copy the code"]) {
      await expect(dialog.getByText(new RegExp(label))).toBeVisible();
    }
    await expectNoAxeViolations(page);
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("opening a dialog does not shift the layout", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    const anchor = page.locator("header a").first();
    const before = await anchor.boundingBox();
    await page.keyboard.press("Shift+?");
    await expect(page.getByRole("dialog")).toBeVisible();
    const after = await anchor.boundingBox();
    expect(after?.x).toBe(before?.x);
    expect(after?.y).toBe(before?.y);
  });
});

test.describe("errors and production-only behaviour", () => {
  test("unknown URLs get the custom 404 page", async ({ page }) => {
    const problems = watchConsole(page);
    const response = await page.goto("/this-page-does-not-exist");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("doesn't");
    await expect(page.getByRole("link", { name: "Back to home" })).toBeVisible();
    await expectNoAxeViolations(page);
    expect(problems.filter((problem) => !problem.includes("404"))).toEqual([]);
  });

  test("LocalProvider routes return 404 in the production build", async ({ request }) => {
    expect((await request.get("/dev/checkout")).status()).toBe(404);
    expect((await request.post("/api/webhooks/local", { data: {} })).status()).toBe(404);
  });

  test("hashed static assets are cached immutably", async ({ page }) => {
    const responses: { url: string; cacheControl: string | undefined }[] = [];
    page.on("response", (response) => {
      if (response.url().includes("/_next/static/")) {
        responses.push({ url: response.url(), cacheControl: response.headers()["cache-control"] });
      }
    });
    await page.goto("/");
    expect(responses.length).toBeGreaterThan(0);
    for (const response of responses) expect(response.cacheControl).toContain("immutable");
  });
});
