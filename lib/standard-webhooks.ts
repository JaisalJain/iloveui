// Standard Webhooks (https://www.standardwebhooks.com), the scheme Dodo Payments signs with, implemented with Web
// Crypto so it runs in Workers, Node and the browser-free dev server alike. LocalProvider signs with it; the local
// webhook route verifies with it; tests prove the Dodo SDK accepts its signatures.

const encoder = new TextEncoder();

/** Signatures older or newer than this many seconds are rejected (the standardwebhooks library uses 5 minutes). */
export const WEBHOOK_TOLERANCE_SECONDS = 300;

export class WebhookSignatureError extends Error {
  override name = "WebhookSignatureError";
}

function base64ToBytes(b64: string): Uint8Array<ArrayBuffer> {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
  return out;
}

function bytesToBase64(buffer: ArrayBuffer): string {
  let bin = "";
  for (const byte of new Uint8Array(buffer)) bin += String.fromCharCode(byte);
  return btoa(bin);
}

async function importKey(secret: string): Promise<CryptoKey> {
  // A malformed secret is a configuration error (500), not a bad signature (401), so atob may throw through.
  const raw = base64ToBytes(secret.startsWith("whsec_") ? secret.slice("whsec_".length) : secret);
  return crypto.subtle.importKey("raw", raw, { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

export type WebhookHeaders = {
  "webhook-id": string;
  "webhook-timestamp": string;
  "webhook-signature": string;
};

/** The `v1,<base64>` signature of `${id}.${timestamp}.${body}`. */
export async function signWebhook(secret: string, id: string, timestampSeconds: number, body: string) {
  const mac = await crypto.subtle.sign(
    "HMAC",
    await importKey(secret),
    encoder.encode(`${id}.${timestampSeconds}.${body}`),
  );
  return `v1,${bytesToBase64(mac)}`;
}

/** The three headers a sender attaches to a signed delivery. */
export async function webhookHeaders(
  secret: string,
  id: string,
  body: string,
  timestampSeconds = Math.floor(Date.now() / 1000),
): Promise<WebhookHeaders> {
  return {
    "webhook-id": id,
    "webhook-timestamp": String(timestampSeconds),
    "webhook-signature": await signWebhook(secret, id, timestampSeconds, body),
  };
}

/**
 * Verifies a delivery against the raw body and returns its webhook id, the idempotency key that stays the same on
 * every retry. Throws WebhookSignatureError for missing headers, a stale timestamp or no matching signature.
 */
export async function verifyWebhook(
  secret: string,
  headers: Headers,
  body: string,
  { now = Date.now(), toleranceSeconds = WEBHOOK_TOLERANCE_SECONDS }: { now?: number; toleranceSeconds?: number } = {},
): Promise<string> {
  const id = headers.get("webhook-id");
  const timestamp = headers.get("webhook-timestamp");
  const signatures = headers.get("webhook-signature");
  if (!id || !timestamp || !signatures) throw new WebhookSignatureError("Missing webhook headers.");
  const seconds = Number(timestamp);
  if (!Number.isInteger(seconds) || Math.abs(Math.floor(now / 1000) - seconds) > toleranceSeconds) {
    throw new WebhookSignatureError("Webhook timestamp is outside the tolerance window.");
  }
  const key = await importKey(secret);
  const signed = encoder.encode(`${id}.${seconds}.${body}`);
  for (const entry of signatures.split(" ")) {
    const [version, signature] = entry.split(",");
    if (version !== "v1" || !signature) continue;
    let bytes: Uint8Array<ArrayBuffer>;
    try {
      bytes = base64ToBytes(signature);
    } catch {
      continue;
    }
    // crypto.subtle.verify compares in constant time.
    if (await crypto.subtle.verify("HMAC", key, bytes, signed)) return id;
  }
  throw new WebhookSignatureError("No webhook signature matches.");
}
