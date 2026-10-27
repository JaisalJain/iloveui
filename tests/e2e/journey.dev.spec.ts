import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { registryItemSchema } from "shadcn/schema";
import { readZip } from "@/lib/zip";
import { clerkTestEmail, deleteClerkUser, signInAs, signOut } from "./clerk";
import { leakedLines, proDesigns } from "./pro-source";

// The Phase 4 journey (spec section 17) against `next dev`: sign in, buy Pro through the local test checkout, see
// the code unlock, install with the CLI token, download the zip, refund from /account and watch every door close.
// Then a Team purchase: the owner invites a second address, which gets Pro when that person signs in.

test.describe.configure({ mode: "serial" });

const PRO = proDesigns()[0]!;
const BUYER = clerkTestEmail("journey");
const OWNER = clerkTestEmail("team-owner");
const MEMBER = clerkTestEmail("team-member");
const userIds: string[] = [];

function d1(sql: string): string {
  return execFileSync(
    "pnpm",
    ["exec", "wrangler", "d1", "execute", "iloveui-db", "--local", "--json", "--command", sql],
    {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
}

/** Clerk ids are [A-Za-z0-9_]; refuse anything else before it reaches a SQL string. */
function sqlId(value: string): string {
  if (!/^[A-Za-z0-9_]+$/.test(value)) throw new Error(`unexpected id ${value}`);
  return value;
}

// The Clerk testing-token route retries requests a closing page cancels; drop it before the page goes.
test.afterEach(async ({ page }) => {
  await page.unrouteAll({ behavior: "ignoreErrors" });
});

test.afterAll(async () => {
  for (const raw of userIds) {
    const id = sqlId(raw);
    d1(
      [
        `DELETE FROM api_tokens WHERE user_id = '${id}'`,
        `DELETE FROM bookmarks WHERE user_id = '${id}'`,
        `DELETE FROM seats WHERE user_id = '${id}' OR license_id IN (SELECT id FROM licenses WHERE owner_user_id = '${id}')`,
        `DELETE FROM licenses WHERE owner_user_id = '${id}'`,
        `DELETE FROM rate_limits WHERE key LIKE '%${id}%'`,
        `DELETE FROM users WHERE id = '${id}'`,
      ].join("; "),
    );
  }
  for (const email of [BUYER, OWNER, MEMBER]) await deleteClerkUser(email);
});

async function buy(page: Page, plan: "Pro" | "Team") {
  await page.goto("/pricing");
  await page.getByRole("link", { name: `Get ${plan}` }).click();
  await expect(page).toHaveURL(/\/dev\/checkout\?session=/);
  await expect(page.getByText("Local test checkout").first()).toBeVisible();
  await page.getByRole("button", { name: /^Pay / }).click();
  await page.waitForURL(/\/account\?checkout=success/);
  await expect(page.locator("[data-checkout-status]")).toHaveAttribute("data-checkout-status", "active");
  await expect(page.getByText("Pro is active.")).toBeVisible();
}

async function openDesign(page: Page) {
  await page.goto(`/designs/${PRO.category}/${PRO.slug}`);
  await page.locator('section[aria-labelledby="code-heading"]').scrollIntoViewIfNeeded();
}

/** The real shadcn CLI, reading the components.json addition from /account and the token from the environment. */
function shadcnView(token: string): { ok: boolean; output: string } {
  const dir = mkdtempSync(join(tmpdir(), "iloveui-cli-"));
  try {
    writeFileSync(
      join(dir, "components.json"),
      JSON.stringify({
        $schema: "https://ui.shadcn.com/schema.json",
        style: "new-york",
        rsc: true,
        tsx: true,
        tailwind: { config: "", css: "app/globals.css", baseColor: "neutral", cssVariables: true },
        aliases: { components: "@/components", utils: "@/lib/utils" },
        registries: {
          "@iloveui": {
            url: "http://localhost:3000/r/{name}.json",
            headers: { Authorization: "Bearer ${ILOVEUI_TOKEN}" },
          },
        },
      }),
    );
    const output = execFileSync("pnpm", ["exec", "shadcn", "view", `@iloveui/${PRO.slug}`, "--cwd", dir], {
      encoding: "utf8",
      env: { ...process.env, ILOVEUI_TOKEN: token },
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 120_000,
    });
    return { ok: true, output };
  } catch (error) {
    const failed = error as { stdout?: string; stderr?: string };
    return { ok: false, output: `${failed.stdout ?? ""}${failed.stderr ?? ""}` };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test("buy Pro, install and download it, then a refund revokes everything", async ({ page, request }) => {
  userIds.push(sqlId(await signInAs(page, BUYER)));
  await buy(page, "Pro");
  await expect(page.locator("[data-license-status]")).toHaveAttribute("data-license-status", "pro");

  // The design page unlocks: the real source is in the code viewer.
  await openDesign(page);
  const viewer = page.locator("[data-code-viewer]").first();
  await expect(viewer).toBeVisible();
  expect(leakedLines(await viewer.innerText(), PRO.lines).length).toBeGreaterThan(0);

  // A CLI token from /account, shown once.
  await page.goto("/account");
  await page.getByRole("button", { name: "Create token" }).click();
  const fresh = page.locator("[data-new-token]");
  await expect(fresh).toContainText("You will not see it again");
  const token = (await fresh.locator("code").innerText()).trim();
  expect(token).toMatch(/^ilui_live_[0-9A-Za-z]{32}$/);
  await expect(page.locator("[data-token-dates]")).toContainText("Created");
  await expect(page.getByLabel("components.json registries", { exact: true })).toContainText(
    '"url": "http://localhost:3000/r/{name}.json"',
  );

  // Install: the registry endpoint and the real shadcn CLI both return the Pro item.
  const item = await request.get(`/r/${PRO.slug}.json`, { headers: { authorization: `Bearer ${token}` } });
  expect(item.status()).toBe(200);
  const parsed = registryItemSchema.safeParse(await item.json());
  expect(parsed.success).toBe(true);
  expect(leakedLines(parsed.data?.files?.[0]?.content ?? "", PRO.lines).length).toBeGreaterThan(0);
  const cli = shadcnView(token);
  expect(cli.ok, cli.output).toBe(true);
  const viewed = JSON.parse(cli.output) as unknown[];
  expect(registryItemSchema.safeParse(viewed[0]).success).toBe(true);

  // Download the zip from the design page.
  await openDesign(page);
  const downloaded = page.waitForEvent("download");
  await page.locator("[data-download]").click();
  const file = await downloaded;
  const entries = readZip(new Uint8Array(readFileSync((await file.path())!)));
  const tsx = entries.find((entry) => entry.name.endsWith("/component.tsx"));
  expect(leakedLines(new TextDecoder().decode(tsx?.data), PRO.lines).length).toBeGreaterThan(0);

  // Refund from /account, with its confirmation.
  await page.goto("/account");
  await page.getByRole("button", { name: "Request a refund" }).click();
  await page.getByRole("button", { name: "Refund and end access" }).click();
  await expect(page.locator("[data-license-status]")).toHaveAttribute("data-license-status", "free", {
    timeout: 30_000,
  });
  await expect(page.getByText("Refunded", { exact: true }).first()).toBeVisible();

  // Every door is closed again, and none of them leaks a Pro line.
  await openDesign(page);
  await expect(page.getByRole("heading", { name: "This account has no Pro access yet" })).toBeVisible();
  await expect(page.locator("[data-code-viewer]")).toHaveCount(0);
  const registry = await request.get(`/r/${PRO.slug}.json`, { headers: { authorization: `Bearer ${token}` } });
  expect([401, 403]).toContain(registry.status());
  const code = await page.request.get(`/api/code/${PRO.slug}`);
  expect(code.status()).toBe(403);
  const download = await page.request.get(`/api/download/${PRO.slug}`);
  expect(download.status()).toBe(403);
  const refused = shadcnView(token);
  expect(refused.ok).toBe(false);
  for (const body of [await registry.text(), await code.text(), await download.text(), refused.output]) {
    expect(leakedLines(body, PRO.lines)).toEqual([]);
  }
});

test("a Team owner invites a second address, which gets Pro on sign-in", async ({ page }) => {
  userIds.push(sqlId(await signInAs(page, OWNER)));
  await buy(page, "Team");
  await expect(page.locator("[data-seat-count]")).toHaveText("1 of 10 used");

  // Inline validation first, then the real invite.
  const field = page.getByLabel("Invite by email");
  await field.fill("not-an-email");
  await page.getByRole("button", { name: "Invite", exact: true }).click();
  await expect(page.getByText("Enter a valid email address")).toBeVisible();
  await field.fill(MEMBER);
  await page.getByRole("button", { name: "Invite", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: `Invited ${MEMBER}` })).toBeVisible();
  await expect(page.locator("[data-seat-count]")).toHaveText("2 of 10 used");
  await expect(page.getByRole("list", { name: "Team seats" })).toContainText(MEMBER);
  await signOut(page);

  userIds.push(sqlId(await signInAs(page, MEMBER)));
  await expect(page.locator("[data-license-status]")).toHaveAttribute("data-license-status", "pro");
  await expect(page.getByText(OWNER)).toBeVisible();
  const code = await page.request.get(`/api/code/${PRO.slug}`);
  expect(code.status()).toBe(200);
});
