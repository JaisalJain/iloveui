import { setupClerkTestingToken } from "@clerk/testing/playwright";
import { expect, test, type Page } from "@playwright/test";
import { CLERK_TEST_CODE, clerkTestEmail, deleteClerkUser, hasSignedInHint, signInAs, signOut } from "./clerk";
import { expectNoAxeViolations, expectNoHorizontalOverflow } from "./helpers";

// Runs against `pnpm dev` with the accountless Clerk development keys from .env.local.

const MEMBER = "auth-e2e+clerk_test@example.com";

/** Our own /sign-in page, not Clerk's hosted Account Portal. */
const onSignInPage = (url: URL) => url.origin === "http://localhost:3000" && url.pathname.startsWith("/sign-in");

const headerLink = (page: Page, name: "Sign in" | "Account") =>
  page.getByRole("banner").getByRole("link", { name, exact: true });

async function waitForClerkForm(page: Page) {
  await expect(page.locator(".cl-cardBox")).toBeVisible({ timeout: 20_000 });
}

test.describe("signed out", () => {
  test("/account sends the visitor to sign in and the header offers it", async ({ page }) => {
    await page.goto("/designs");
    await expect(headerLink(page, "Sign in")).toHaveAttribute("href", "/sign-in");

    await page.goto("/account");
    await expect(page).toHaveURL(onSignInPage);
    await waitForClerkForm(page);
    expect(await hasSignedInHint(page)).toBe(false);
  });

  test("/account/refresh continues to the page without asking a signed-out visitor to sign in", async ({ page }) => {
    await page.goto(`/account/refresh?next=${encodeURIComponent("/designs?tier=pro")}`);
    await expect(page).toHaveURL((url) => url.pathname + url.search === "/designs?tier=pro");
    await page.goto(`/account/refresh?next=${encodeURIComponent("//evil.example")}`);
    await expect(page).toHaveURL(onSignInPage);
  });

  for (const scheme of ["light", "dark"] as const) {
    for (const path of ["/sign-in", "/sign-up"]) {
      test(`${path} is accessible in ${scheme} mode`, async ({ page }) => {
        await page.emulateMedia({ colorScheme: scheme });
        await page.setViewportSize({ width: 375, height: 900 });
        await page.goto(path);
        await waitForClerkForm(page);
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        await expectNoHorizontalOverflow(page);
        await expectNoAxeViolations(page);
      });
    }
  }
});

test.describe("signed in", () => {
  test("header, account page and sign out follow the session", async ({ page }) => {
    await signInAs(page, MEMBER);
    await expect(page.getByRole("heading", { level: 1, name: "Your account." })).toBeVisible();
    await expect(headerLink(page, "Account")).toBeVisible();
    expect(await hasSignedInHint(page)).toBe(true);

    // Public pages read only the hint cookie, never Clerk.
    await page.goto("/designs");
    await expect(headerLink(page, "Account")).toHaveAttribute("href", "/account");

    await signOut(page);
    await expect(headerLink(page, "Sign in")).toBeVisible();
    await page.reload();
    await expect(headerLink(page, "Sign in")).toBeVisible();

    await page.goto("/account");
    await expect(page).toHaveURL(onSignInPage);
  });

  test("/account/refresh continues only to same-site paths", async ({ page }) => {
    await signInAs(page, MEMBER);
    const cases: [string, string][] = [
      ["/designs?tier=pro", "/designs?tier=pro"],
      ["//evil.example/steal", "/account"],
      ["https://evil.example/", "/account"],
      ["/\\evil.example", "/account"],
      ["javascript:alert(1)", "/account"],
    ];
    for (const [next, expected] of cases) {
      await page.goto(`/account/refresh?next=${encodeURIComponent(next)}`);
      await expect(page).toHaveURL(
        (url) => url.origin === "http://localhost:3000" && url.pathname + url.search === expected,
      );
    }
    await page.goto("/account/refresh");
    await expect(page).toHaveURL((url) => url.pathname === "/account");
  });
});

test("a new visitor signs up with an email code and lands on their account", async ({ page }) => {
  const email = clerkTestEmail("signup");
  try {
    await setupClerkTestingToken({ page });
    await page.goto("/sign-up");
    await waitForClerkForm(page);
    await page.getByLabel("Email address").fill(email);
    const password = page.getByLabel("Password", { exact: true });
    if (await password.isVisible()) await password.fill(`Iu-${crypto.randomUUID()}`);
    await page.getByRole("button", { name: "Continue", exact: true }).click();

    // Verification step: Clerk test addresses accept 424242 and never receive mail.
    const code = page.getByRole("textbox", { name: /enter verification code/i });
    await expect(code).toBeVisible({ timeout: 20_000 });
    await code.pressSequentially(CLERK_TEST_CODE);

    await expect(page).toHaveURL((url) => url.pathname === "/account", { timeout: 20_000 });
    await expect(page.getByText(email).first()).toBeVisible();
    await expect(headerLink(page, "Account")).toBeVisible();
    await signOut(page);
  } finally {
    // Stops the testing-token route from retrying Clerk requests that the closing page cancels.
    await page.unrouteAll({ behavior: "ignoreErrors" });
    await deleteClerkUser(email);
  }
});
