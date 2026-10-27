import { execFileSync } from "node:child_process";
import { expect, test, type Page } from "@playwright/test";
import { clerkTestEmail, deleteClerkUser, signInAs } from "./clerk";

// The local purchase journey against `next dev` (spec sections 0 and 11): pricing → /checkout → the local test
// checkout → a signed webhook → fulfilment. Fail leaves no license; Pay creates exactly one; a refund from the API
// revokes it through the same webhook path.

test.describe.configure({ mode: "serial" });

const EMAIL = clerkTestEmail("checkout");
let userId = "";

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

function sqlId(value: string): string {
  if (!/^[A-Za-z0-9_]+$/.test(value)) throw new Error(`unexpected id ${value}`);
  return value;
}

type LicenseRow = {
  id: string;
  plan: string;
  currency: string;
  amount_minor: number;
  status: string;
  provider: string;
};

function licenses(): LicenseRow[] {
  const output = JSON.parse(
    d1(
      `SELECT id, plan, currency, amount_minor, status, provider FROM licenses WHERE owner_user_id = '${sqlId(userId)}'`,
    ),
  ) as { results: LicenseRow[] }[];
  return output[0]?.results ?? [];
}

async function openCheckout(page: Page) {
  await page.goto("/pricing");
  await page.getByRole("link", { name: "Get Pro" }).click();
  await expect(page).toHaveURL(/\/dev\/checkout\?session=/);
  await expect(page.getByText("Local test checkout").first()).toBeVisible();
}

test.afterAll(async () => {
  if (userId) {
    const id = sqlId(userId);
    d1(
      [
        `DELETE FROM api_tokens WHERE user_id = '${id}'`,
        `DELETE FROM seats WHERE license_id IN (SELECT id FROM licenses WHERE owner_user_id = '${id}')`,
        `DELETE FROM licenses WHERE owner_user_id = '${id}'`,
        `DELETE FROM rate_limits WHERE key LIKE '%${id}%'`,
        `DELETE FROM bookmarks WHERE user_id = '${id}'`,
        `DELETE FROM users WHERE id = '${id}'`,
      ].join("; "),
    );
  }
  await deleteClerkUser(EMAIL);
});

test("Fail leaves no license, Pay grants exactly one, and a refund revokes it", async ({ page }) => {
  userId = sqlId(await signInAs(page, EMAIL));

  await openCheckout(page);
  await page.getByRole("button", { name: "Fail payment" }).click();
  await expect(page.getByText("Payment declined")).toBeVisible();
  expect(licenses()).toEqual([]);

  await openCheckout(page);
  await page.getByRole("button", { name: /^Pay / }).click();
  await expect(page.getByText("Payment received")).toBeVisible();
  await page.waitForURL(/\/account\?checkout=success/);
  const rows = licenses();
  expect(rows).toHaveLength(1);
  expect(rows[0]).toMatchObject({ plan: "pro", status: "active", provider: "local" });

  // Buying the same plan again goes to the account page instead of charging twice.
  await page.goto("/checkout?plan=pro");
  await expect(page).toHaveURL(/\/account$/);

  const invoice = await page.request.get(`/api/invoice/${rows[0]!.id}`);
  expect(invoice.status()).toBe(200);
  expect(await invoice.text()).toContain("Local test receipt");

  const refund = await page.request.post("/api/refund", { data: { licenseId: rows[0]!.id } });
  expect(refund.status()).toBe(202);
  expect(licenses()[0]?.status).toBe("refunded");
  const again = await page.request.post("/api/refund", { data: { licenseId: rows[0]!.id } });
  expect(again.status()).toBe(409);
});

test("an unknown plan goes back to pricing with an explanation", async ({ page }) => {
  await signInAs(page, EMAIL);
  await page.goto("/checkout?plan=gold");
  await expect(page).toHaveURL(/\/pricing\?checkout_error=invalid_plan/);
  await expect(page.getByRole("alert").filter({ hasText: "Checkout did not start" })).toBeVisible();
});
