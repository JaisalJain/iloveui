import { clerk, clerkSetup } from "@clerk/testing/playwright";
import { expect, type Page } from "@playwright/test";
import { SIGNED_IN_HINT_COOKIE } from "@/components/auth/signed-in-hint";

// Clerk for the dev end-to-end target (playwright.config.ts runs the default export as global setup there).
// Test users are Clerk test addresses (`name+clerk_test@...`, verification code 424242): a development instance
// never sends them email, and the ticket sign-in below skips verification and device checks entirely.

export const CLERK_TEST_CODE = "424242";

/** Global setup: reads the Clerk keys from .env.local and mints a Testing Token for every worker. */
export default async function globalSetup() {
  await clerkSetup();
}

/** A unique Clerk test address for a spec that creates its own user. */
export function clerkTestEmail(name: string): string {
  const suffix = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  return `${name}-${suffix}+clerk_test@example.com`;
}

function assertTestEmail(email: string) {
  if (!/\+clerk_test@/.test(email)) throw new Error(`${email} is not a Clerk test address (name+clerk_test@...).`);
}

async function backendApi(path: string, init?: RequestInit) {
  const secret = process.env.CLERK_SECRET_KEY;
  if (!secret) throw new Error("CLERK_SECRET_KEY is missing; run pnpm run setup to provision Clerk keys.");
  const response = await fetch(`https://api.clerk.com/v1${path}`, {
    ...init,
    headers: { authorization: `Bearer ${secret}`, "content-type": "application/json", ...init?.headers },
  });
  if (!response.ok) throw new Error(`Clerk Backend API ${init?.method ?? "GET"} ${path}: HTTP ${response.status}`);
  return response;
}

/** The Clerk user id for a test address, creating the user when it does not exist yet. */
export async function ensureClerkUser(email: string): Promise<string> {
  assertTestEmail(email);
  const found = (await (await backendApi(`/users?email_address=${encodeURIComponent(email)}`)).json()) as {
    id: string;
  }[];
  if (found[0]) return found[0].id;
  const created = (await (
    await backendApi("/users", {
      method: "POST",
      body: JSON.stringify({ email_address: [email], skip_password_requirement: true }),
    })
  ).json()) as { id: string };
  return created.id;
}

/** Removes a test user from Clerk (development instances hold at most 100 users). */
export async function deleteClerkUser(email: string) {
  assertTestEmail(email);
  const found = (await (await backendApi(`/users?email_address=${encodeURIComponent(email)}`)).json()) as {
    id: string;
  }[];
  for (const user of found) await backendApi(`/users/${user.id}`, { method: "DELETE" });
}

/**
 * Signs the page in as `email` (created in Clerk when needed) and finishes on /account, so the middleware has set
 * the hint cookie and the app has created the user's D1 row. Returns the Clerk user id.
 */
export async function signInAs(page: Page, email: string): Promise<string> {
  const userId = await ensureClerkUser(email);
  await page.goto("/sign-in");
  await clerk.signIn({ page, emailAddress: email });
  await page.goto("/account");
  await expect(page).toHaveURL(/\/account$/);
  await expect(page.getByText(email.toLowerCase()).first()).toBeVisible();
  return userId;
}

/** Signs out through the account page's own control and waits until the hint cookie is gone. */
export async function signOut(page: Page) {
  await page.goto("/account");
  if (!/\/account$/.test(new URL(page.url()).pathname)) return; // already signed out: the middleware redirected
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL((url) => url.pathname === "/");
  await expect.poll(() => hasSignedInHint(page)).toBe(false);
}

export async function hasSignedInHint(page: Page): Promise<boolean> {
  const cookies = await page.context().cookies();
  return cookies.some((cookie) => cookie.name === SIGNED_IN_HINT_COOKIE && cookie.value === "1");
}
