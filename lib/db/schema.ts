import { sql } from "drizzle-orm";
import { index, integer, primaryKey, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

// Epoch milliseconds computed by SQLite, so rows written by raw SQL get timestamps too.
const nowMs = sql`(cast(unixepoch('subsec') * 1000 as integer))`;
const createdAt = () => integer("created_at", { mode: "timestamp_ms" }).notNull().default(nowMs);

// Foreign keys use the default NO ACTION: D1 always enforces them, and cascades can silently delete rows
// when a future migration rebuilds a table.

export const users = sqliteTable("users", {
  id: text("id").primaryKey(), // Clerk user id
  email: text("email").notNull(),
  createdAt: createdAt(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().default(nowMs),
});

export const licenses = sqliteTable(
  "licenses",
  {
    id: text("id").primaryKey(),
    ownerUserId: text("owner_user_id")
      .notNull()
      .references(() => users.id),
    plan: text("plan", { enum: ["pro", "team"] }).notNull(),
    currency: text("currency", { enum: ["USD", "INR"] }).notNull(),
    amountMinor: integer("amount_minor").notNull(),
    providerPaymentId: text("provider_payment_id").notNull().unique(),
    provider: text("provider", { enum: ["dodo", "local"] }).notNull(),
    status: text("status", { enum: ["active", "refunded"] })
      .notNull()
      .default("active"),
    createdAt: createdAt(),
  },
  (t) => [index("licenses_owner_user_id_idx").on(t.ownerUserId)],
);

export const seats = sqliteTable(
  "seats",
  {
    id: text("id").primaryKey(),
    licenseId: text("license_id")
      .notNull()
      .references(() => licenses.id),
    email: text("email").notNull(),
    userId: text("user_id").references(() => users.id),
    status: text("status", { enum: ["invited", "active", "removed"] })
      .notNull()
      .default("invited"),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("seats_license_id_email_uq").on(t.licenseId, t.email),
    index("seats_email_idx").on(t.email),
    index("seats_user_id_idx").on(t.userId),
  ],
);

export const apiTokens = sqliteTable("api_tokens", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => users.id),
  tokenHash: text("token_hash").notNull().unique(),
  lastUsedAt: integer("last_used_at", { mode: "timestamp_ms" }),
  createdAt: createdAt(),
});

export const bookmarks = sqliteTable(
  "bookmarks",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    slug: text("slug").notNull(),
    createdAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.slug] })],
);

export const designMetrics = sqliteTable("design_metrics", {
  slug: text("slug").primaryKey(),
  copies: integer("copies").notNull().default(0),
  installs: integer("installs").notNull().default(0),
  downloads: integer("downloads").notNull().default(0),
});

export const webhookEvents = sqliteTable("webhook_events", {
  id: text("id").primaryKey(),
  provider: text("provider", { enum: ["dodo", "local", "clerk"] }).notNull(),
  eventId: text("event_id").notNull().unique(),
  receivedAt: integer("received_at", { mode: "timestamp_ms" }).notNull().default(nowMs),
});

export const rateLimits = sqliteTable(
  "rate_limits",
  {
    key: text("key").notNull(),
    windowStart: integer("window_start").notNull(), // epoch ms
    count: integer("count").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.key, t.windowStart] })],
);

export type User = typeof users.$inferSelect;
export type License = typeof licenses.$inferSelect;
export type Seat = typeof seats.$inferSelect;
export type ApiToken = typeof apiTokens.$inferSelect;
