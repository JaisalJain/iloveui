import { gzipSync } from "node:zlib";
import { expect, test, type Page } from "@playwright/test";

// Spec section 13: /designs ships under 200 kB of JavaScript, gzipped, through Phase 4 (Phase 5 aims for 150 kB as a
// best effort). Every script the page loads is fetched again and gzipped here, so the number does not depend on how
// the local server compresses responses.
const DESIGNS_JS_BUDGET = 200_000;

async function gzippedScriptBytes(page: Page, route: string) {
  const scripts = new Set<string>();
  page.on("response", (response) => {
    if (response.request().resourceType() === "script" && response.ok()) scripts.add(response.url());
  });
  await page.goto(route, { waitUntil: "networkidle" });
  let total = 0;
  for (const url of scripts) {
    const body = await (await page.request.get(url)).body();
    total += gzipSync(body, { level: 9 }).length;
  }
  return total;
}

test("/designs loads under 200 kB of JavaScript, gzipped", async ({ page }) => {
  const bytes = await gzippedScriptBytes(page, "/designs");
  test.info().annotations.push({ type: "gzipped JavaScript", description: `${(bytes / 1000).toFixed(1)} kB` });
  expect(bytes).toBeLessThan(DESIGNS_JS_BUDGET);
});
