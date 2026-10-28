import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { GET as registryItem } from "@/app/r/[name]/route";
import { GET as download } from "@/app/api/download/[slug]/route";
import { GET as proCode } from "@/app/api/code/[slug]/route";
import { GET as bookmarksGet } from "@/app/api/bookmarks/route";
import { POST as checkout } from "@/app/api/checkout/route";
import { POST as refund } from "@/app/api/refund/route";
import { POST as inviteSeat } from "@/app/api/team/seats/route";
import { POST as rotateToken } from "@/app/api/token/rotate/route";
import { POST as clerkWebhook } from "@/app/api/webhooks/clerk/route";
import { POST as dodoWebhook } from "@/app/api/webhooks/dodo/route";
import { POST as localWebhook } from "@/app/api/webhooks/local/route";
import { GET as checkoutPage } from "@/app/checkout/route";
import { getDesign as realGetDesign, getAllDesigns } from "@/lib/catalog";
import { licenses, users } from "@/lib/db/schema";
import { effectiveTier, monetizationEnabled } from "@/lib/monetization";
import { issueToken } from "@/lib/tokens";
import { createZip } from "@/lib/zip";
import { createTestDb, resetTestDb, type TestDb } from "./helpers/d1";

// MONETIZATION_ENABLED in both states, through the real route handlers. Off (the default): every design is free and
// served anonymously, and every account, payment and Pro route is a 404. On: a Pro design's source reaches only a
// token or session with an active license; signed-out and non-owner requests receive none of it.

const PRO_SOURCE = "export function VaultLedger() { return <table data-pro-source-marker /> }";
const SLUG = getAllDesigns()[0]!.slug;

const state = vi.hoisted(() => ({
  db: null as unknown,
  viewer: null as { id: string; email: string } | null,
}));

vi.mock("@/lib/db", () => ({ getDb: () => state.db }));
vi.mock("@/lib/auth", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/auth")>()),
  getViewer: async () => state.viewer,
}));
// The design's tier is what scripts/build-registry.ts would write to the catalog for a meta.json tier of "pro".
vi.mock("@/lib/catalog", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/catalog")>();
  const { effectiveTier: tierFor } = await import("@/lib/monetization");
  return {
    ...actual,
    getDesign: (slug: string) => {
      const design = actual.getDesign(slug);
      return design && { ...design, tier: tierFor("pro") };
    },
  };
});
vi.mock("@/lib/private-design", () => ({
  getPrivateDesign: async (slug: string) => ({
    registryItem: { name: slug, files: [{ path: "component.tsx", content: PRO_SOURCE }] },
    code: { files: [{ name: "component.tsx", code: PRO_SOURCE, lines: 1 }] },
  }),
  getDesignZip: async () =>
    createZip([{ name: "component.tsx", data: new TextEncoder().encode(PRO_SOURCE) }]) as Uint8Array,
}));

let t: TestDb;
const owner = { id: "user_owner", email: "noor.haddad@pinecrest.dev" };
const stranger = { id: "user_stranger", email: "ilse.marchetti@tidewater.io" };
const previousPepper = process.env.TOKEN_PEPPER;

beforeAll(async () => {
  process.env.TOKEN_PEPPER = "unit-test-pepper";
  t = await createTestDb();
  state.db = t.db;
});

afterAll(async () => {
  process.env.TOKEN_PEPPER = previousPepper;
  await t?.dispose();
});

beforeEach(async () => {
  state.viewer = null;
  await resetTestDb(t.db);
  await t.db.insert(users).values([owner, stranger]);
  await t.db.insert(licenses).values({
    id: "lic_owner",
    ownerUserId: owner.id,
    plan: "pro",
    currency: "USD",
    amountMinor: 9900,
    providerPaymentId: "pay_owner",
    provider: "local",
    status: "active",
  });
});

const registry = (token?: string) =>
  registryItem(
    new Request(`http://localhost:3000/r/${SLUG}.json`, {
      headers: token ? { authorization: `Bearer ${token}` } : {},
    }),
    { params: Promise.resolve({ name: `${SLUG}.json` }) },
  );
const zip = () =>
  download(new Request(`http://localhost:3000/api/download/${SLUG}`), { params: Promise.resolve({ slug: SLUG }) });
const code = () =>
  proCode(new Request(`http://localhost:3000/api/code/${SLUG}`), { params: Promise.resolve({ slug: SLUG }) });

async function expectNoSource(response: Response) {
  expect(Buffer.from(await response.arrayBuffer()).toString("latin1")).not.toContain("data-pro-source-marker");
}

describe("with MONETIZATION_ENABLED off (the default)", () => {
  it("is off unless set to true", () => {
    expect(monetizationEnabled()).toBe(false);
    vi.stubEnv("MONETIZATION_ENABLED", "1");
    expect(monetizationEnabled()).toBe(false);
    expect(effectiveTier("pro")).toBe("free");
  });

  it("serves every design's registry item anonymously", async () => {
    const response = await registry();
    expect(response.status).toBe(200);
    expect(JSON.stringify(await response.json())).toContain("data-pro-source-marker");
  });

  it("serves every design's zip anonymously", async () => {
    const response = await zip();
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/zip");
  });

  it("answers 404 on every account, payment and Pro route", async () => {
    const post = (path: string) => new Request(`http://localhost:3000${path}`, { method: "POST", body: "{}" });
    const responses = await Promise.all([
      code(),
      bookmarksGet(),
      checkout(post("/api/checkout")),
      refund(post("/api/refund")),
      inviteSeat(post("/api/team/seats")),
      rotateToken(),
      clerkWebhook(post("/api/webhooks/clerk") as Parameters<typeof clerkWebhook>[0]),
      dodoWebhook(post("/api/webhooks/dodo")),
      localWebhook(post("/api/webhooks/local")),
      checkoutPage(new Request("http://localhost:3000/checkout?plan=pro")),
    ]);
    expect(responses.map((response) => response.status)).toEqual(responses.map(() => 404));
  });

  it("never asks Clerk who is signed in", async () => {
    const { getViewer } = await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth");
    await expect(getViewer()).resolves.toBeNull();
  });

  it("keeps the real catalog all free", () => {
    expect(getAllDesigns().filter((design) => design.tier !== "free")).toEqual([]);
    expect(realGetDesign(SLUG)?.tier).toBe("free");
  });
});

describe("with MONETIZATION_ENABLED on", () => {
  beforeEach(() => {
    vi.stubEnv("MONETIZATION_ENABLED", "true");
  });

  it("uses the tier from meta.json", () => {
    expect(effectiveTier("pro")).toBe("pro");
    expect(effectiveTier("free")).toBe("free");
  });

  it("registry: 401 without a token or with an invalid one, 403 without a license, the item with one", async () => {
    const anonymous = await registry();
    expect(anonymous.status).toBe(401);
    await expectNoSource(anonymous);

    const invalid = await registry("ilui_live_0000000000000000000000000000ZZZZ");
    expect(invalid.status).toBe(401);
    await expectNoSource(invalid);

    const unlicensed = await registry(await issueToken(t.db, stranger.id));
    expect(unlicensed.status).toBe(403);
    await expectNoSource(unlicensed);

    const licensed = await registry(await issueToken(t.db, owner.id));
    expect(licensed.status).toBe(200);
    expect(JSON.stringify(await licensed.json())).toContain("data-pro-source-marker");
  });

  it("download: 401 signed out, 403 without a license, the zip with one", async () => {
    const signedOut = await zip();
    expect(signedOut.status).toBe(401);
    await expectNoSource(signedOut);

    state.viewer = stranger;
    const unlicensed = await zip();
    expect(unlicensed.status).toBe(403);
    await expectNoSource(unlicensed);

    state.viewer = owner;
    const licensed = await zip();
    expect(licensed.status).toBe(200);
    expect(licensed.headers.get("content-type")).toBe("application/zip");
  });

  it("code panel: 401 signed out, 403 without a license, the source with one", async () => {
    const signedOut = await code();
    expect(signedOut.status).toBe(401);
    await expectNoSource(signedOut);

    state.viewer = stranger;
    const unlicensed = await code();
    expect(unlicensed.status).toBe(403);
    await expectNoSource(unlicensed);

    state.viewer = owner;
    const licensed = await code();
    expect(licensed.status).toBe(200);
    expect(JSON.stringify(await licensed.json())).toContain("data-pro-source-marker");
  });

  it("opens the account routes again (a signed-out caller gets 401, not 404)", async () => {
    expect((await bookmarksGet()).status).toBe(401);
    expect((await rotateToken()).status).toBe(401);
  });
});
