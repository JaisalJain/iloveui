import { execFileSync } from "node:child_process";
import { expect, test } from "@playwright/test";
import { registryItemSchema } from "shadcn/schema";
import { readZip } from "@/lib/zip";
import { freeDesigns, leakedLines, proDesigns } from "./pro-source";

// Access control that holds on the production build without signing in (spec sections 10 and 16): anonymous and
// invalid-token requests for Pro registry items, downloads and code get zero Pro source lines; free items and free
// downloads work for everyone. Signed-in checks live in access.dev.spec.ts.

const PRO = proDesigns();
const FREE = freeDesigns();
const INVALID_TOKEN = "ilui_live_0000000000000000000000000000ZZZZ";

test.describe("Pro source stays locked for anonymous and invalid-token requests", () => {
  test("has Pro and free designs to check", () => {
    expect(PRO.length).toBeGreaterThan(0);
    expect(FREE.length).toBeGreaterThan(0);
    for (const design of PRO) expect(design.lines.length).toBeGreaterThan(10);
  });

  for (const design of PRO) {
    test(`${design.slug}: registry item, code, download and page`, async ({ request }) => {
      const anonymous = await request.get(`/r/${design.slug}.json`);
      expect(anonymous.status()).toBe(401);
      expect(anonymous.headers()["content-type"]).toContain("application/json");
      const anonymousBody = await anonymous.text();
      expect(JSON.parse(anonymousBody)).toMatchObject({ error: "Unauthorized" });
      expect(anonymousBody).toContain("/account");

      const emptyBearer = await request.get(`/r/${design.slug}.json`, { headers: { authorization: "Bearer " } });
      expect(emptyBearer.status()).toBe(401);

      const invalid = await request.get(`/r/${design.slug}.json`, {
        headers: { authorization: `Bearer ${INVALID_TOKEN}` },
      });
      expect(invalid.status()).toBe(401);
      const invalidBody = await invalid.text();
      expect(JSON.parse(invalidBody)).toMatchObject({ error: "Unauthorized" });
      expect(invalidBody).toContain("/account");

      const code = await request.get(`/api/code/${design.slug}`);
      expect(code.status()).toBe(401);

      const download = await request.get(`/api/download/${design.slug}`);
      expect(download.status()).toBe(401);
      expect(download.headers()["content-type"]).toContain("application/json");

      const page = await request.get(`/designs/${design.category}/${design.slug}`);
      expect(page.status()).toBe(200);

      const bodies = {
        anonymous: anonymousBody,
        emptyBearer: await emptyBearer.text(),
        invalid: invalidBody,
        code: await code.text(),
        download: await download.text(),
        page: await page.text(),
      };
      for (const [name, body] of Object.entries(bodies)) {
        expect(leakedLines(body, design.lines), `Pro source in the ${name} response`).toEqual([]);
      }
    });
  }

  test("unknown and malformed registry names are 404 JSON", async ({ request }) => {
    for (const path of ["/r/no-such-design.json", `/r/${PRO[0]?.slug ?? "x"}`, "/r/..%2Fsecrets.json"]) {
      const response = await request.get(path);
      expect(response.status(), path).toBe(404);
    }
    const unknown = await request.get("/r/no-such-design.json");
    expect(await unknown.json()).toMatchObject({ error: "Not Found" });
  });

  test("the locked design page shows the unlock card and no download", async ({ page }) => {
    const design = PRO[0];
    test.skip(!design, "no Pro design");
    await page.goto(`/designs/${design!.category}/${design!.slug}`);
    await expect(page.getByRole("heading", { name: "Get the source with Pro" }).first()).toBeVisible();
    await expect(page.locator("[data-download]")).toHaveCount(0);
    await expect(page.locator("[data-code-viewer]")).toHaveCount(0);
  });
});

test.describe("free designs are open to everyone", () => {
  // Anonymous downloads share one per-IP hourly window on this machine; start each run with a fresh one.
  test.beforeAll(() => {
    execFileSync(
      "pnpm",
      [
        "exec",
        "wrangler",
        "d1",
        "execute",
        "iloveui-db",
        "--local",
        "--command",
        "DELETE FROM rate_limits WHERE key LIKE 'download:ip:%'",
      ],
      { stdio: "ignore" },
    );
  });

  for (const design of FREE) {
    test(`${design.slug}: registry item and download`, async ({ request }) => {
      const item = await request.get(`/r/${design.slug}.json`);
      expect(item.status()).toBe(200);
      const parsed = registryItemSchema.safeParse(await item.json());
      expect(parsed.success).toBe(true);
      expect(parsed.data?.files?.[0]?.content?.length ?? 0).toBeGreaterThan(100);

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

  test("free code is served by the code API too", async ({ request }) => {
    const design = FREE[0];
    test.skip(!design, "no free design");
    const response = await request.get(`/api/code/${design!.slug}`);
    expect(response.status()).toBe(200);
    const code = (await response.json()) as { slug: string; files: { name: string }[] };
    expect(code.slug).toBe(design!.slug);
    expect(code.files.map((file) => file.name)).toEqual(["component.tsx", "component.html"]);
  });

  test("the free design page offers a download", async ({ page }) => {
    const design = FREE[0];
    test.skip(!design, "no free design");
    await page.goto(`/designs/${design!.category}/${design!.slug}`);
    const button = page.locator("[data-download]");
    await expect(button).toBeVisible();
    const downloaded = page.waitForEvent("download");
    await button.click();
    expect((await downloaded).suggestedFilename()).toBe(`iloveui-${design!.slug}.zip`);
  });
});
