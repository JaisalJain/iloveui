import { expect, test, type Page } from "@playwright/test";
import { expectNoAxeViolations, expectNoHorizontalOverflow, setColorScheme } from "./helpers";

// Theme Lab (spec 7.4): the dock on every /designs page re-skins preview frames, persists under iloveui.theme and
// survives reloads; phones get the same controls in a bottom sheet.

const DEFAULTS = { accent: "#FF4D1F", neutral: "zinc", radius: 10, font: "inter-tight", density: "comfortable" };
const DESIGN_PAGE = "/designs/hero/gridline-hero";

async function storedTheme(page: Page): Promise<Record<string, unknown> | null> {
  return page.evaluate(() => {
    const raw = window.localStorage.getItem("iloveui.theme");
    return raw ? (JSON.parse(raw) as Record<string, unknown>) : null;
  });
}

/** --iu-accent as computed on the root element of the first frame whose URL contains `urlPart`. */
async function frameAccent(page: Page, urlPart: string): Promise<string | null> {
  const frame = page.frames().find((candidate) => candidate.url().includes(urlPart));
  if (!frame) return null;
  try {
    const value = await frame.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue("--iu-accent"),
    );
    return value.trim().toUpperCase();
  } catch {
    // The frame navigated or is still attaching; poll again.
    return null;
  }
}

function dock(page: Page) {
  return page.getByRole("region", { name: "Theme Lab" });
}

async function openDesktop(page: Page, path: string) {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(path);
  await expect(dock(page)).toBeVisible();
}

async function chooseAccentPreset(page: Page, name: RegExp) {
  await dock(page)
    .getByRole("button", { name: /^Accent / })
    .click();
  const popover = page.getByRole("dialog", { name: "Accent color" });
  await expect(popover).toBeVisible();
  await popover.getByRole("radio", { name }).click();
  await page.keyboard.press("Escape");
  await expect(popover).toBeHidden();
}

test.describe("Theme Lab", () => {
  test("a preset accent is stored and reaches card thumbnails on /designs", async ({ page }) => {
    await openDesktop(page, "/designs");
    await chooseAccentPreset(page, /^Cobalt/);
    await expect(dock(page).getByRole("button", { name: "Accent #2F5BEA" })).toBeVisible();
    expect(await storedTheme(page)).toMatchObject({ accent: "#2F5BEA" });
    await expect.poll(() => frameAccent(page, "/thumbs/")).toBe("#2F5BEA");
  });

  test("a preset accent reaches the preview stage on a design page", async ({ page }) => {
    await openDesktop(page, DESIGN_PAGE);
    await expect.poll(() => frameAccent(page, "/preview/")).toBe("#FF4D1F");
    await chooseAccentPreset(page, /^Emerald/);
    expect(await storedTheme(page)).toMatchObject({ accent: "#0F9F6E" });
    await expect.poll(() => frameAccent(page, "/preview/")).toBe("#0F9F6E");
  });

  test("the custom hex field rejects bad input and accepts a valid color", async ({ page }) => {
    await openDesktop(page, DESIGN_PAGE);
    await dock(page)
      .getByRole("button", { name: /^Accent / })
      .click();
    const popover = page.getByRole("dialog", { name: "Accent color" });
    const field = popover.getByLabel("Custom hex");

    await field.fill("#12345");
    await field.press("Enter");
    await expect(field).toHaveAttribute("aria-invalid", "true");
    await expect(popover.getByText("Use #RGB or #RRGGBB.")).toBeVisible();
    expect((await storedTheme(page))?.accent ?? DEFAULTS.accent).toBe(DEFAULTS.accent);

    await field.fill("#0a8");
    await expect(field).not.toHaveAttribute("aria-invalid", "true");
    await popover.getByRole("button", { name: "Apply" }).click();
    await expect(dock(page).getByRole("button", { name: "Accent #00AA88" })).toBeVisible();
    expect(await storedTheme(page)).toMatchObject({ accent: "#00AA88" });
    await expect.poll(() => frameAccent(page, "/preview/")).toBe("#00AA88");
  });

  test("radius, neutral, font and density change the stored state; Reset restores the defaults", async ({ page }) => {
    await openDesktop(page, DESIGN_PAGE);
    const bar = dock(page);
    const reset = bar.getByRole("button", { name: "Reset theme" });
    await expect(reset).toBeDisabled();

    const slider = bar.getByRole("slider", { name: "Radius" });
    await slider.focus();
    await page.keyboard.press("End");
    await expect(slider).toHaveAttribute("aria-valuenow", "24");
    await expect.poll(async () => (await storedTheme(page))?.radius).toBe(24);
    await page.keyboard.press("ArrowLeft");
    await expect.poll(async () => (await storedTheme(page))?.radius).toBe(23);

    await bar.getByRole("radio", { name: "Slate" }).click();
    await expect.poll(async () => (await storedTheme(page))?.neutral).toBe("slate");

    await bar.getByRole("button", { name: /^Font / }).click();
    await page.getByRole("menuitemradio", { name: "IBM Plex Sans" }).click();
    await expect(bar.getByRole("button", { name: "Font IBM Plex Sans" })).toBeFocused();
    await expect.poll(async () => (await storedTheme(page))?.font).toBe("ibm-plex-sans");

    await bar.getByRole("radio", { name: "Compact" }).click();
    await expect.poll(async () => (await storedTheme(page))?.density).toBe("compact");

    await expect(reset).toBeEnabled();
    await reset.click();
    await expect(reset).toBeDisabled();
    await expect(reset).toBeFocused();
    expect(await storedTheme(page)).toMatchObject(DEFAULTS);
    await expect(slider).toHaveAttribute("aria-valuenow", "10");
  });

  test("the theme survives a reload and the dock remembers being collapsed", async ({ page }) => {
    await openDesktop(page, DESIGN_PAGE);
    await chooseAccentPreset(page, /^Saffron/);
    await dock(page).getByRole("radio", { name: "Stone" }).click();
    await dock(page).getByRole("button", { name: "Collapse Theme Lab" }).click();
    const pill = page.getByRole("button", { name: "Theme Lab", expanded: false });
    await expect(pill).toBeFocused();

    await page.reload();
    await expect(pill).toBeVisible();
    await expect(dock(page)).toHaveCount(0);
    expect(await storedTheme(page)).toMatchObject({ accent: "#F2A516", neutral: "stone" });
    await expect.poll(() => frameAccent(page, "/preview/")).toBe("#F2A516");

    await pill.click();
    await expect(dock(page).getByRole("button", { name: "Accent #F2A516" })).toBeVisible();
    await expect(dock(page).getByRole("button", { name: "Collapse Theme Lab" })).toBeFocused();
  });

  for (const scheme of ["light", "dark"] as const) {
    test(`axe passes with the accent popover open (${scheme})`, async ({ page }) => {
      await setColorScheme(page, scheme);
      await openDesktop(page, DESIGN_PAGE);
      await dock(page)
        .getByRole("button", { name: /^Accent / })
        .click();
      await expect(page.getByRole("dialog", { name: "Accent color" })).toBeVisible();
      await expectNoAxeViolations(page);
    });

    test(`the phone sheet opens, traps focus, closes with Escape and returns focus (${scheme})`, async ({ page }) => {
      await setColorScheme(page, scheme);
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto(DESIGN_PAGE);
      await expect(dock(page)).toHaveCount(0);
      const trigger = page.getByRole("button", { name: "Theme", exact: true });
      await trigger.click();
      const sheet = page.getByRole("dialog", { name: "Theme Lab" });
      await expect(sheet).toBeVisible();
      await expectNoHorizontalOverflow(page);
      await expectNoAxeViolations(page);

      for (let i = 0; i < 30; i++) {
        await page.keyboard.press("Tab");
        expect(await sheet.evaluate((node) => node.contains(document.activeElement))).toBe(true);
      }

      await sheet.getByRole("radio", { name: /^Rose/ }).click();
      expect(await storedTheme(page)).toMatchObject({ accent: "#E5375F" });

      await page.keyboard.press("Escape");
      await expect(sheet).toBeHidden();
      await expect(trigger).toBeFocused();
    });
  }
});
