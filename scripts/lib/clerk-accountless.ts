import { mkdirSync, writeFileSync } from "node:fs";

// Clerk removed keyless mode from @clerk/nextjs in 7.8. The supported no-account path is an accountless development
// instance: one unauthenticated request returns working dev keys, and the app can be claimed into a real Clerk
// account later without changing them (`pnpm dlx clerk@latest auth login` reads the breadcrumb written here).

type AccountlessApp = { publishable_key: string; secret_key: string; claim_url: string };

export async function provisionAccountlessClerk(): Promise<{ publishableKey: string; secretKey: string }> {
  const response = await fetch("https://api.clerk.com/v1/accountless_applications", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      // The claim page then shows the Next.js variable names.
      "Clerk-Framework": "nextjs",
    },
    body: new URLSearchParams({ source: "iloveui-setup" }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) {
    throw new Error(
      `Clerk accountless provisioning failed (HTTP ${response.status}). Retry, or run: pnpm dlx clerk@latest init --accountless`,
    );
  }
  const app = (await response.json()) as AccountlessApp;
  const claimToken = new URL(app.claim_url).searchParams.get("token");
  if (claimToken) {
    // The same breadcrumb the Clerk CLI writes; .clerk/ is gitignored. The claim URL itself is never printed.
    mkdirSync(".clerk", { recursive: true });
    writeFileSync(
      ".clerk/keyless.json",
      `${JSON.stringify({ claimToken, createdAt: new Date().toISOString() }, null, 2)}\n`,
      { mode: 0o600 },
    );
  }
  return { publishableKey: app.publishable_key, secretKey: app.secret_key };
}
