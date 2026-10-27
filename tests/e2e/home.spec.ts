import { expect, test, type Page } from "@playwright/test";
import { expectNoAxeViolations, expectNoHorizontalOverflow, setColorScheme, watchConsole } from "./helpers";

const WALL = "[data-hero-wall]";
const TRACK = `${WALL} [data-wall-track]`;

function playState(page: Page) {
  return page
    .locator(TRACK)
    .first()
    .evaluate((track) => getComputedStyle(track).animationPlayState);
}

test.describe("home page", () => {
  test("the hero has the headline and both actions", async ({ page }) => {
    await page.goto("/");
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toHaveText("UI you'll actually ship.");
    await expect(heading.locator("em")).toHaveText("actually");
    await expect(page.getByRole("link", { name: "Browse designs" })).toHaveAttribute("href", "/designs");
    await expect(page.getByRole("link", { name: "See pricing" })).toHaveAttribute("href", "/pricing");
  });

  test("wall tiles are links to design pages with name, category and tag", async ({ page }) => {
    await page.goto("/");
    const tiles = page.locator(`${WALL} a[data-wall-tile]:not([tabindex="-1"])`);
    expect(await tiles.count()).toBeGreaterThan(0);
    const first = tiles.first();
    await expect(first).toHaveAttribute("href", /^\/designs\/[a-z0-9-]+\/[a-z0-9-]+$/);
    await expect(first).toHaveAccessibleName(/(Free|Pro)$/i);
    const frame = first.locator("iframe");
    await expect(frame).toHaveAttribute("aria-hidden", "true");
    await expect(frame).toHaveAttribute("tabindex", "-1");
    await expect(frame).toHaveAttribute("sandbox", "allow-scripts");
    // The duplicate set that closes the loop is hidden from assistive technology and the tab order.
    await expect(page.locator(`${WALL} ul[aria-hidden="true"] a[data-wall-tile]:not([tabindex="-1"])`)).toHaveCount(0);

    // Once the wall controller runs (it starts loading thumbnails), a focused tile is brought into view.
    await expect.poll(() => page.locator(`${WALL} iframe[src]`).count()).toBeGreaterThan(0);
    await first.focus();
    await expect(first).toBeInViewport();
    expect(await playState(page)).toBe("paused");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/designs\/[a-z0-9-]+\/[a-z0-9-]+$/);
  });

  test("thumbnails load lazily, after the headline", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    const frames = page.locator(`${WALL} iframe`);
    await expect.poll(() => page.locator(`${WALL} iframe[src]`).count()).toBeGreaterThan(0);
    const loaded = await page.locator(`${WALL} iframe[src]`).count();
    expect(loaded).toBeLessThan(await frames.count());
  });

  test("the wall pauses on hover, offscreen, with its button and in a hidden tab", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await expect.poll(() => playState(page)).toBe("running");

    await page.locator(WALL).hover({ position: { x: 200, y: 300 } });
    await expect.poll(() => playState(page)).toBe("paused");
    await page.mouse.move(10, 880);
    await expect.poll(() => playState(page)).toBe("running");

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(page.locator(WALL)).toHaveAttribute("data-offscreen", "");
    await expect.poll(() => playState(page)).toBe("paused");
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect.poll(() => playState(page)).toBe("running");

    await page.getByRole("button", { name: "Pause wall" }).click();
    await page.mouse.move(10, 880);
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await expect.poll(() => playState(page)).toBe("paused");
    await page.getByRole("button", { name: "Play wall" }).click();
    await page.mouse.move(10, 880);
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await expect.poll(() => playState(page)).toBe("running");

    await page.evaluate(() => {
      Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await expect.poll(() => playState(page)).toBe("paused");
  });

  test("reduced motion shows a static grid", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    const animation = await page
      .locator(TRACK)
      .first()
      .evaluate((track) => getComputedStyle(track).animationName);
    expect(animation).toBe("none");
    await expect(page.locator(`${WALL} ul[aria-hidden="true"]`).first()).toBeHidden();
    await expect(page.getByRole("button", { name: "Pause wall" })).toBeHidden();
  });

  test("every section renders", async ({ page }) => {
    await page.goto("/");
    for (const name of [
      "Re-themeable",
      "Two formats",
      "Audited",
      "Every category, built to a brief.",
      "Free forever, same license.",
      "Pick, theme, ship.",
      "Pay once. Keep every design.",
      "Latest changes.",
    ]) {
      await expect(page.getByRole("heading", { name, exact: false }).first()).toBeVisible();
    }
    const categories = page.locator('section[aria-labelledby="home-categories"] ol > li');
    await expect(categories).toHaveCount(19);
    await expect(categories.first().getByRole("link")).toHaveAttribute("href", /^\/designs\/[a-z-]+$/);
    const picks = page.locator('section[aria-labelledby="home-free"] ul > li');
    expect(await picks.count()).toBeGreaterThan(0);
    expect(await picks.count()).toBeLessThanOrEqual(8);
    const changes = page.locator('section[aria-labelledby="home-changelog"] ol > li');
    expect(await changes.count()).toBeGreaterThan(0);
    expect(await changes.count()).toBeLessThanOrEqual(3);
    await expect(changes.first().getByRole("link")).toHaveAttribute("href", /^\/changelog#/);
  });

  for (const scheme of ["dark", "light"] as const) {
    test(`passes axe in ${scheme}`, async ({ page }) => {
      const problems = watchConsole(page);
      await setColorScheme(page, scheme);
      await page.goto("/");
      await expectNoAxeViolations(page);
      expect(problems).toEqual([]);
    });
  }

  for (const width of [375, 768, 1440]) {
    test(`no horizontal overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/");
      await expectNoHorizontalOverflow(page);
    });
  }
});
