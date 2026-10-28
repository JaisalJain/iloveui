import { eq } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { WebhookEvent } from "@clerk/nextjs/webhooks";
import { handleClerkEvent, primaryEmail } from "@/lib/clerk-webhook";
import type { Db } from "@/lib/db/create";
import { apiTokens, bookmarks, licenses, seats, users, webhookEvents } from "@/lib/db/schema";
import { safeNextPath } from "@/app/(site)/(clerk)/account/refresh/safe-next";
import { createTestDb, resetTestDb, type TestDb } from "./helpers/d1";

const state: { db: Db | null } = { db: null };
vi.mock("@/lib/db", () => ({
  getDb: () => {
    if (!state.db) throw new Error("test database not ready");
    return state.db;
  },
}));

const SECRET = `whsec_${btoa("iloveui clerk webhook test secret")}`;

let t: TestDb;

beforeAll(async () => {
  t = await createTestDb();
  state.db = t.db;
});

afterAll(async () => {
  await t?.dispose();
});

beforeEach(async () => {
  await resetTestDb(t.db);
});

const T0 = Date.UTC(2026, 9, 20, 9, 0, 0);

function userEvent(
  type: "user.created" | "user.updated",
  {
    id = "user_ana",
    email = "Ana.Ruiz@Fieldnote.dev",
    updatedAt = T0,
  }: { id?: string; email?: string; updatedAt?: number } = {},
): WebhookEvent {
  return {
    type,
    object: "event",
    timestamp: updatedAt,
    instance_id: "ins_test",
    event_attributes: { http_request: { client_ip: "203.0.113.7", user_agent: "vitest" } },
    data: {
      object: "user",
      id,
      created_at: T0,
      updated_at: updatedAt,
      primary_email_address_id: "idn_primary",
      email_addresses: [
        { id: "idn_other", email_address: "old@fieldnote.dev" },
        { id: "idn_primary", email_address: email },
      ],
    },
  } as unknown as WebhookEvent;
}

function deletedEvent(id: string | undefined, timestamp: number): WebhookEvent {
  return {
    type: "user.deleted",
    object: "event",
    timestamp,
    instance_id: "ins_test",
    event_attributes: { http_request: { client_ip: "203.0.113.7", user_agent: "vitest" } },
    data: { object: "user", id, deleted: true },
  } as unknown as WebhookEvent;
}

const userRow = (id = "user_ana") => t.db.select().from(users).where(eq(users.id, id)).get();

describe("primaryEmail", () => {
  it("picks the primary address, lowercased, and falls back to the first one", () => {
    const addresses = [
      { id: "a", email_address: "First@Example.dev" },
      { id: "b", email_address: "Second@Example.dev" },
    ] as never;
    expect(primaryEmail({ email_addresses: addresses, primary_email_address_id: "b" })).toBe("second@example.dev");
    expect(primaryEmail({ email_addresses: addresses, primary_email_address_id: null })).toBe("first@example.dev");
    expect(primaryEmail({ email_addresses: [], primary_email_address_id: null })).toBe("");
  });
});

describe("handleClerkEvent", () => {
  it("creates the user with the primary email and records the event", async () => {
    expect(await handleClerkEvent(t.db, "msg_1", userEvent("user.created"))).toBe("processed");
    expect(await userRow()).toMatchObject({ email: "ana.ruiz@fieldnote.dev", updatedAt: new Date(T0) });
    expect(await t.db.select().from(webhookEvents).all()).toMatchObject([{ provider: "clerk", eventId: "msg_1" }]);
  });

  it("ignores a retried delivery with the same svix id", async () => {
    await handleClerkEvent(t.db, "msg_1", userEvent("user.created"));
    const retry = userEvent("user.updated", { email: "changed@fieldnote.dev", updatedAt: T0 + 1_000 });
    expect(await handleClerkEvent(t.db, "msg_1", retry)).toBe("duplicate");
    expect((await userRow())?.email).toBe("ana.ruiz@fieldnote.dev");
  });

  it("applies an update only when it is newer than the stored row", async () => {
    await handleClerkEvent(
      t.db,
      "msg_1",
      userEvent("user.updated", { email: "new@fieldnote.dev", updatedAt: T0 + 5_000 }),
    );
    // Delivered late: older than what is stored.
    await handleClerkEvent(t.db, "msg_2", userEvent("user.created", { email: "old@fieldnote.dev", updatedAt: T0 }));
    expect(await userRow()).toMatchObject({ email: "new@fieldnote.dev", updatedAt: new Date(T0 + 5_000) });

    await handleClerkEvent(
      t.db,
      "msg_3",
      userEvent("user.updated", { email: "newest@fieldnote.dev", updatedAt: T0 + 9_000 }),
    );
    expect((await userRow())?.email).toBe("newest@fieldnote.dev");
  });

  it("keeps licenses on delete, drops the token and bookmarks, frees held seats and blocks late updates", async () => {
    await handleClerkEvent(t.db, "msg_1", userEvent("user.created"));
    await t.db.insert(users).values({ id: "user_owner", email: "owner@fieldnote.dev" });
    await t.db.insert(licenses).values([
      {
        id: "lic_own",
        ownerUserId: "user_ana",
        plan: "pro",
        currency: "USD",
        amountMinor: 9900,
        providerPaymentId: "pay_own",
        provider: "local",
      },
      {
        id: "lic_team",
        ownerUserId: "user_owner",
        plan: "team",
        currency: "USD",
        amountMinor: 29900,
        providerPaymentId: "pay_team",
        provider: "local",
      },
    ]);
    await t.db.insert(seats).values({
      id: "seat_1",
      licenseId: "lic_team",
      email: "ana.ruiz@fieldnote.dev",
      userId: "user_ana",
      status: "active",
    });
    await t.db.insert(apiTokens).values({ id: "tok_1", userId: "user_ana", tokenHash: "hash_1" });
    await t.db.insert(bookmarks).values({ userId: "user_ana", slug: "gridline-hero" });

    expect(await handleClerkEvent(t.db, "msg_2", deletedEvent("user_ana", T0 + 60_000))).toBe("processed");

    expect(await userRow()).toMatchObject({ email: "", updatedAt: new Date(T0 + 60_000) });
    expect(await t.db.select().from(licenses).where(eq(licenses.ownerUserId, "user_ana")).all()).toHaveLength(1);
    expect(await t.db.select().from(apiTokens).all()).toEqual([]);
    expect(await t.db.select().from(bookmarks).all()).toEqual([]);
    expect(await t.db.select({ status: seats.status }).from(seats).get()).toEqual({ status: "removed" });

    // A user.updated that was sent before the deletion but delivered after it does not bring the email back.
    await handleClerkEvent(t.db, "msg_3", userEvent("user.updated", { updatedAt: T0 + 30_000 }));
    expect((await userRow())?.email).toBe("");
  });

  it("leaves a tombstone for a user it never saw, so a late create cannot add them", async () => {
    await handleClerkEvent(t.db, "msg_1", deletedEvent("user_ghost", T0 + 60_000));
    await handleClerkEvent(t.db, "msg_2", userEvent("user.created", { id: "user_ghost" }));
    expect((await userRow("user_ghost"))?.email).toBe("");
  });

  it("records events it does not act on", async () => {
    expect(await handleClerkEvent(t.db, "msg_1", deletedEvent(undefined, T0))).toBe("ignored");
    const session = { ...userEvent("user.created"), type: "session.created" } as unknown as WebhookEvent;
    expect(await handleClerkEvent(t.db, "msg_2", session)).toBe("ignored");
    expect(await t.db.$count(webhookEvents)).toBe(2);
    expect(await t.db.$count(users)).toBe(0);
  });
});

async function signedHeaders(body: string, id: string, ts = Math.floor(Date.now() / 1000)) {
  const raw = Uint8Array.from(atob(SECRET.replace(/^whsec_/, "")), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey("raw", raw, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${id}.${ts}.${body}`)));
  return {
    "content-type": "application/json",
    "svix-id": id,
    "svix-timestamp": String(ts),
    "svix-signature": `v1,${btoa(String.fromCharCode(...mac))}`,
  };
}

describe("POST /api/webhooks/clerk", () => {
  async function post(body: string, headers: Record<string, string>) {
    vi.stubEnv("CLERK_WEBHOOK_SIGNING_SECRET", SECRET);
    // The webhook exists only with accounts, that is with monetization on.
    vi.stubEnv("MONETIZATION_ENABLED", "true");
    const { POST } = await import("@/app/api/webhooks/clerk/route");
    const { NextRequest } = await import("next/server");
    const response = await POST(
      new NextRequest("http://localhost:3000/api/webhooks/clerk", { method: "POST", body, headers }),
    );
    vi.unstubAllEnvs();
    return response;
  }

  it("verifies the signature, then stores the user", async () => {
    const body = JSON.stringify(userEvent("user.created"));
    const response = await post(body, await signedHeaders(body, "msg_signed"));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({ received: true, result: "processed" });
    expect((await userRow())?.email).toBe("ana.ruiz@fieldnote.dev");

    const again = await post(body, await signedHeaders(body, "msg_signed"));
    expect(await again.json()).toEqual({ received: true, result: "duplicate" });
  });

  it("answers 400 to a forged, tampered, stale or unsigned delivery and writes nothing", async () => {
    const body = JSON.stringify(userEvent("user.created"));
    const headers = await signedHeaders(body, "msg_forged");
    const tampered = body.replace("Ana.Ruiz", "Mallory");
    expect(tampered).not.toBe(body);
    expect((await post(tampered, headers)).status).toBe(400);
    expect((await post(body, { ...headers, "svix-signature": "v1,AAAA" })).status).toBe(400);
    const stale = await signedHeaders(body, "msg_stale", Math.floor(Date.now() / 1000) - 60 * 60);
    expect((await post(body, stale)).status).toBe(400);
    expect((await post(body, { "content-type": "application/json" })).status).toBe(400);
    expect(await t.db.$count(users)).toBe(0);
    expect(await t.db.$count(webhookEvents)).toBe(0);
  });
});

describe("safeNextPath for /account/refresh", () => {
  it("keeps same-site paths with their query and hash", () => {
    expect(safeNextPath("/designs/hero-sections/gridline-hero")).toBe("/designs/hero-sections/gridline-hero");
    expect(safeNextPath("/designs?tier=pro#grid")).toBe("/designs?tier=pro#grid");
  });

  it("falls back to /account for anything that could leave the site", () => {
    for (const value of [
      null,
      "",
      "designs",
      "//evil.example",
      "/\\evil.example",
      "\\\\evil.example",
      "/designs\\..\\x",
      "https://evil.example/",
      "javascript:alert(1)",
      "/\tevil",
      " /designs",
    ]) {
      expect(safeNextPath(value)).toBe("/account");
    }
  });
});
