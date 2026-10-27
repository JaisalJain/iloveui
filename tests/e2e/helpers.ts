import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

/** WCAG 2.2 AA plus axe best practices (closest to Lighthouse's accessibility audit). */
export const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

export async function expectNoAxeViolations(page: Page, { exclude = [] as string[] } = {}) {
  let builder = new AxeBuilder({ page }).withTags(AXE_TAGS).exclude("iframe[data-preview]");
  for (const selector of exclude) builder = builder.exclude(selector);
  const { violations } = await builder.analyze();
  expect(
    violations.map((violation) => ({
      rule: violation.id,
      help: violation.help,
      nodes: violation.nodes.map((node) => node.target.join(" ")),
    })),
  ).toEqual([]);
}

/** Collects console errors, warnings and uncaught exceptions; assert the list is empty at the end of a test. */
// Clerk prints this on every page it loads while it runs on development keys (the accountless app from pnpm setup);
// production keys never print it. Any other Clerk warning still fails the test.
const CLERK_DEVELOPMENT_KEYS_WARNING = "Clerk: Clerk has been loaded with development keys.";

export function watchConsole(page: Page) {
  const problems: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "warning" && message.text().startsWith(CLERK_DEVELOPMENT_KEYS_WARNING)) return;
    if (message.type() === "error" || message.type() === "warning")
      problems.push(`${message.type()}: ${message.text()}`);
  });
  page.on("pageerror", (error) => problems.push(`pageerror: ${error.message}`));
  return problems;
}

export async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow, "horizontal overflow in px").toBeLessThanOrEqual(0);
}

export async function setColorScheme(page: Page, scheme: "light" | "dark") {
  await page.emulateMedia({ colorScheme: scheme });
}
