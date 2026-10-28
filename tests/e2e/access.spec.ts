import { expect, test } from "@playwright/test";
import { registryItemSchema } from "shadcn/schema";
import { readZip } from "@/lib/zip";
import { freeDesigns } from "./pro-source";

// Access on the production build with MONETIZATION_ENABLED off, the default: every design's registry item, code
// and download is open to anonymous requests, and every account, payment and Pro route is a 404. The paid flows
// (MONETIZATION_ENABLED=true) are covered by the *.dev.spec.ts files and tests/unit/monetization.test.ts.

const DESIGNS = freeDesigns();
// Anonymous downloads share one IP and a limit of 60 an hour, so the page test below downloads the one design the
// request loop leaves out.
const BUTTON_DESIGN = DESIGNS.at(-1);

test.describe("every design is open to everyone", () => {
  test("every design in the catalog is free", () => {
    expect(DESIGNS.length).toBeGreaterThanOrEqual(60);
  });

  for (const design of DESIGNS) {
    test(`${design.slug}: registry item and download`, async ({ request }) => {
      const item = await request.get(`/r/${design.slug}.json`);
      expect(item.status()).toBe(200);
      const parsed = registryItemSchema.safeParse(await item.json());
      expect(parsed.success).toBe(true);
      expect(parsed.data?.files?.[0]?.content?.length ?? 0).toBeGreaterThan(100);

      if (design === BUTTON_DESIGN) return;
      const download = await request.get(`/api/download/${design.slug}?accent=00AA55&radius=4&neutral=stone`);
      expect(download.status()).toBe(200);
      expect(download.headers()["content-type"]).toBe("application/zip");
      expect(download.headers()["content-disposition"]).toBe(`attachment; filename="iloveui-${design.slug}.zip"`);
      const entries = readZip(new Uint8Array(await download.body()));
      const names = entries.map((entry) => entry.name.split("/").pop());
      expect(names).toEqual(["component.tsx", "component.html", "theme.css", "ai-prompt.md", "LICENSE.txt"]);
      const text = (name: string) =>
        new TextDecoder().decode(entries.find((entry) => entry.name.endsWith(`/${name}`))?.data);
      expect(text("theme.css")).toContain("--iu-accent: #00AA55;");
      expect(text("component.html")).toContain("--iu-radius: 4px;");
    });
  }

  test("unknown and malformed registry names are 404 JSON", async ({ request }) => {
    for (const path of ["/r/no-such-design.json", `/r/${DESIGNS[0]?.slug ?? "x"}`, "/r/..%2Fsecrets.json"]) {
      const response = await request.get(path);
      expect(response.status(), path).toBe(404);
    }
    const unknown = await request.get("/r/no-such-design.json");
    expect(await unknown.json()).toMatchObject({ error: "Not Found" });
  });

  test("a design page offers its code and a download, with no account controls", async ({ page }) => {
    const design = BUTTON_DESIGN;
    test.skip(!design, "no design");
    await page.goto(`/designs/${design!.category}/${design!.slug}`);
    await page.locator("section[aria-labelledby=code-heading]").scrollIntoViewIfNeeded();
    await expect(page.locator("[data-code-viewer]")).toBeVisible();
    await expect(page.getByRole("button", { name: /Bookmark/ })).toHaveCount(0);
    const button = page.locator("[data-download]");
    await expect(button).toBeVisible();
    const downloaded = page.waitForEvent("download");
    await button.click();
    expect((await downloaded).suggestedFilename()).toBe(`iloveui-${design!.slug}.zip`);
  });
});

test.describe("account, payment and Pro routes are off", () => {
  const PAGES = ["/pricing", "/pricing/opengraph-image", "/account", "/sign-in", "/sign-up", "/dev/checkout"];

  for (const path of PAGES) {
    test(`GET ${path} is 404`, async ({ request }) => {
      expect((await request.get(path)).status()).toBe(404);
    });
  }

  test("the account, checkout and webhook APIs are 404", async ({ request }) => {
    const slug = DESIGNS[0]?.slug ?? "x";
    const gets = [`/api/code/${slug}`, "/api/bookmarks", "/checkout?plan=pro", "/account/refresh"];
    for (const path of gets) expect((await request.get(path, { maxRedirects: 0 })).status(), path).toBe(404);
    const posts = [
      "/api/checkout",
      "/api/refund",
      "/api/team/seats",
      "/api/token/rotate",
      "/api/webhooks/dodo",
      "/api/webhooks/clerk",
      "/api/webhooks/local",
    ];
    for (const path of posts) expect((await request.post(path, { data: {} })).status(), path).toBe(404);
  });

  test("no page links to pricing or sign-in", async ({ page }) => {
    for (const path of ["/", "/designs", "/docs"]) {
      await page.goto(path);
      await expect(page.locator('a[href="/pricing"], a[href="/sign-in"], a[href="/account"]')).toHaveCount(0);
    }
  });
});
