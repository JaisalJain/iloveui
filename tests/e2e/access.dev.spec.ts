import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { registryItemSchema } from "shadcn/schema";
import { readZip } from "@/lib/zip";
import { clerkTestEmail, deleteClerkUser, signInAs } from "./clerk";
import { leakedLines, proDesigns } from "./pro-source";

// Signed-in access control against `next dev` with a Clerk development sign-in (spec sections 10 and 16): a
// signed-in non-owner gets 403 and zero Pro source lines from /r/, /api/download and /api/code, and the design page
// stays locked. Then the user gets a license (inserted into the local D1) and the page unlocks, the CLI token
// installs through /r/, and the download carries the Theme Lab tokens.

test.describe.configure({ mode: "serial" });

const PRO = proDesigns()[0];
const EMAIL = clerkTestEmail("access");
let userId = "";

function d1(sql: string): string {
  return execFileSync("pnpm", ["exec", "wrangler", "d1", "execute", "iloveui-db", "--local", "--command", sql], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

/** Clerk ids are [A-Za-z0-9_]; refuse anything else before it reaches a SQL string. */
function sqlId(value: string): string {
  if (!/^[A-Za-z0-9_]+$/.test(value)) throw new Error(`unexpected id ${value}`);
  return value;
}

async function designPage(page: Page) {
  await page.goto(`/designs/${PRO!.category}/${PRO!.slug}`);
  await page.locator('section[aria-labelledby="code-heading"]').scrollIntoViewIfNeeded();
}

test.beforeAll(() => {
  if (!PRO) throw new Error("No Pro design in the catalog");
});

test.afterAll(async () => {
  if (userId) {
    const id = sqlId(userId);
    d1(
      [
        `DELETE FROM api_tokens WHERE user_id = '${id}'`,
        `DELETE FROM bookmarks WHERE user_id = '${id}'`,
        `DELETE FROM licenses WHERE owner_user_id = '${id}'`,
        `DELETE FROM rate_limits WHERE key LIKE '%${id}%'`,
        `DELETE FROM users WHERE id = '${id}'`,
      ].join("; "),
    );
  }
  await deleteClerkUser(EMAIL);
});

test("a signed-in non-owner gets no Pro source, then a license unlocks it", async ({ page, request }) => {
  const design = PRO!;
  userId = sqlId(await signInAs(page, EMAIL));

  // Non-owner: the code API and the download refuse with 403.
  const code = await page.request.get(`/api/code/${design.slug}`);
  expect(code.status()).toBe(403);
  const download = await page.request.get(`/api/download/${design.slug}`);
  expect(download.status()).toBe(403);

  // Any signed-in user may hold a CLI token; without a license /r/ answers 403.
  const rotated = await page.request.post("/api/token/rotate");
  expect(rotated.status()).toBe(200);
  const { token } = (await rotated.json()) as { token: string };
  expect(token).toMatch(/^ilui_live_[0-9A-Za-z]{32}$/);
  const forbidden = await request.get(`/r/${design.slug}.json`, { headers: { authorization: `Bearer ${token}` } });
  expect(forbidden.status()).toBe(403);
  const forbiddenBody = await forbidden.text();
  expect(JSON.parse(forbiddenBody)).toMatchObject({ error: "Forbidden" });
  expect(forbiddenBody).toContain("/pricing");

  // The design page stays locked and says why.
  await designPage(page);
  await expect(page.getByRole("heading", { name: "This account has no Pro access yet" })).toBeVisible();
  await expect(page.locator("[data-code-viewer]")).toHaveCount(0);
  await expect(page.locator("[data-download]")).toHaveCount(0);

  const bodies = {
    code: await code.text(),
    download: await download.text(),
    registry: forbiddenBody,
    page: await page.content(),
  };
  for (const [name, body] of Object.entries(bodies)) {
    expect(leakedLines(body, design.lines), `Pro source in the ${name} response`).toEqual([]);
  }

  // Grant Pro the way fulfilment would: an active license row owned by this user.
  d1(
    `INSERT INTO licenses (id, owner_user_id, plan, currency, amount_minor, provider_payment_id, provider, status) ` +
      `VALUES ('lic_${userId}', '${userId}', 'pro', 'USD', 9900, 'access_e2e_${userId}', 'local', 'active')`,
  );

  // The page unlocks: real code, the AI prompt and a download button.
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "iloveui.theme",
      JSON.stringify({ accent: "#00AA55", neutral: "stone", radius: 4, font: "geist", density: "compact" }),
    );
  });
  await designPage(page);
  const viewer = page.locator("[data-code-viewer]").first();
  await expect(viewer).toBeVisible();
  const viewerText = await viewer.innerText();
  expect(leakedLines(viewerText, design.lines).length).toBeGreaterThan(0);
  await expect(page.getByRole("button", { name: "Copy AI prompt" })).toBeVisible();

  const downloadButton = page.locator("[data-download]");
  await expect(downloadButton).toBeVisible();
  const downloaded = page.waitForEvent("download");
  await downloadButton.click();
  const file = await downloaded;
  expect(file.suggestedFilename()).toBe(`iloveui-${design.slug}.zip`);
  const entries = readZip(new Uint8Array(readFileSync((await file.path())!)));
  const text = (name: string) =>
    new TextDecoder().decode(entries.find((entry) => entry.name.endsWith(`/${name}`))?.data);
  expect(text("theme.css")).toContain("--iu-accent: #00AA55;");
  expect(text("component.html")).toContain("--iu-accent: #00AA55;");
  expect(text("component.html")).toContain("--iu-radius: 4px;");
  expect(text("LICENSE.txt").length).toBeGreaterThan(100);

  // The CLI token now installs the Pro item, valid against the shadcn schema.
  const installed = await request.get(`/r/${design.slug}.json`, { headers: { authorization: `Bearer ${token}` } });
  expect(installed.status()).toBe(200);
  const parsed = registryItemSchema.safeParse(await installed.json());
  expect(parsed.success).toBe(true);
  expect(leakedLines(parsed.data?.files?.[0]?.content ?? "", design.lines).length).toBeGreaterThan(0);

  // A rotated token revokes the old one at once.
  const rotatedAgain = await page.request.post("/api/token/rotate");
  const { token: fresh } = (await rotatedAgain.json()) as { token: string };
  const revoked = await request.get(`/r/${design.slug}.json`, { headers: { authorization: `Bearer ${token}` } });
  expect(revoked.status()).toBe(401);
  const current = await request.get(`/r/${design.slug}.json`, { headers: { authorization: `Bearer ${fresh}` } });
  expect(current.status()).toBe(200);
});

test("bookmarks sync to the account while signed in", async ({ page }) => {
  const design = PRO!;
  await signInAs(page, EMAIL);
  await page.addInitScript(() => window.localStorage.removeItem("iloveui.bookmarks.merged"));
  await page.goto(`/designs/${design.category}/${design.slug}`);
  const button = page.getByRole("button", { name: /^Bookmark/ });
  await expect(button).toHaveAttribute("aria-pressed", "false");

  const added = page.waitForResponse((response) => response.url().endsWith("/api/bookmarks") && response.ok());
  await button.click();
  await expect(button).toHaveAttribute("aria-pressed", "true");
  await added;
  await expect
    .poll(async () => ((await (await page.request.get("/api/bookmarks")).json()) as { slugs: string[] }).slugs)
    .toContain(design.slug);

  const removed = page.waitForResponse(
    (response) => response.url().endsWith(`/api/bookmarks/${design.slug}`) && response.ok(),
  );
  await button.click();
  await expect(button).toHaveAttribute("aria-pressed", "false");
  await removed;
  const after = (await (await page.request.get("/api/bookmarks")).json()) as { slugs: string[] };
  expect(after.slugs).not.toContain(design.slug);
});
