import { chromium } from "@playwright/test";
import clerkGlobalSetup from "./clerk";

// Global setup for the dev target (playwright.config.ts). It mints the Clerk Testing Token, then opens every page
// the dev specs drive once, so `next dev` has compiled their server and client code before a test clicks a button
// on a page that has not hydrated yet (a click before hydration does nothing).
const BASE_URL = "http://localhost:3000";
const WARM_ROUTES = [
  "/pricing",
  "/sign-in",
  "/sign-up",
  "/account",
  "/designs",
  "/designs/ecommerce/atelier-product-page",
  "/designs/forms/pillow-workspace-form",
  // An unsigned session renders the checkout's expired state, which loads the same client code as a real one.
  "/dev/checkout?session=warm-up",
];

export default async function globalSetup() {
  await clerkGlobalSetup();
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    for (const route of WARM_ROUTES) {
      // "load" waits for every script the page needs; Clerk keeps polling, so its pages never reach network idle.
      await page.goto(`${BASE_URL}${route}`, { waitUntil: "load", timeout: 180_000 });
    }
  } finally {
    await browser.close();
  }
}
