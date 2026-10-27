import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import type { Catalog } from "@/lib/catalog-types";

// Gate (spec section 16): every design preview at 375, 768 and 1440 in light and dark, in every declared state:
// a saved snapshot, no horizontal overflow, zero axe violations. Results feed registry/audits.json (the receipt).
const catalog = JSON.parse(readFileSync("registry/generated/catalog.json", "utf8")) as Catalog;
const WIDTHS = [375, 768, 1440];
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
const SNAPSHOTS = "test-results/snapshots";
const AUDITS = "test-results/audits";

test.describe.configure({ mode: "parallel" });

for (const design of catalog.designs) {
  for (const mode of ["light", "dark"] as const) {
    test(`design ${design.slug} (${mode})`, async ({ browser }) => {
      test.setTimeout(180_000);
      const context = await browser.newContext({ colorScheme: mode, reducedMotion: "reduce" });
      const page = await context.newPage();
      const consoleProblems: string[] = [];
      page.on("console", (message) => {
        if (message.type() === "error" || message.type() === "warning") consoleProblems.push(message.text());
      });
      page.on("pageerror", (error) => consoleProblems.push(error.message));

      let violations = 0;
      let snapshots = 0;
      mkdirSync(`${SNAPSHOTS}/${design.slug}`, { recursive: true });
      for (const width of WIDTHS) {
        await page.setViewportSize({ width, height: 900 });
        for (const state of design.states) {
          const label = `${state} ${mode} ${width}px`;
          await page.goto(`/preview/${design.slug}?state=${state}&mode=${mode}`, { waitUntil: "networkidle" });
          await page.evaluate(() => document.fonts.ready);
          await page.waitForTimeout(150);

          const overflow = await page.evaluate(
            () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
          );
          expect.soft(overflow, `horizontal overflow (${label})`).toBeLessThanOrEqual(0);

          const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
          violations += results.violations.length;
          expect
            .soft(
              results.violations.map((v) => `${v.id}: ${v.nodes.map((node) => node.target.join(" ")).join(", ")}`),
              `axe (${label})`,
            )
            .toEqual([]);

          const height = await page.evaluate(() => document.documentElement.scrollHeight);
          await page.screenshot({
            path: `${SNAPSHOTS}/${design.slug}/${state}-${mode}-${width}.png`,
            fullPage: height <= 4000,
            animations: "disabled",
            caret: "hide",
          });
          snapshots += 1;
        }
      }
      await context.close();

      mkdirSync(AUDITS, { recursive: true });
      writeFileSync(
        `${AUDITS}/${design.slug}.${mode}.json`,
        JSON.stringify({ slug: design.slug, hash: design.hash, violations, snapshots }),
      );
      expect.soft(consoleProblems, "console errors and warnings").toEqual([]);
    });
  }
}
