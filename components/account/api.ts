"use client";

import { site } from "@/lib/site";

export type ApiResult<T> = { ok: true; status: number; data: T } | { ok: false; status: number; message: string };

const OFFLINE = `The request did not reach iloveui. Check your connection and try again, or write to ${site.supportEmail}.`;

/** JSON calls to our own /api routes with same-origin cookies; errors carry the route's human message. */
export async function callApi<T>(url: string, init?: RequestInit): Promise<ApiResult<T>> {
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      credentials: "same-origin",
      headers: init?.body ? { "content-type": "application/json", ...init.headers } : init?.headers,
    });
  } catch {
    return { ok: false, status: 0, message: OFFLINE };
  }
  const body: unknown = response.status === 204 ? null : await response.json().catch(() => null);
  if (response.ok) return { ok: true, status: response.status, data: body as T };
  if (response.status === 401) {
    return { ok: false, status: 401, message: "Your session ended. Reload the page to sign in again." };
  }
  const message =
    typeof body === "object" && body !== null && typeof (body as { message?: unknown }).message === "string"
      ? (body as { message: string }).message
      : `Something went wrong (HTTP ${response.status}). Try again, or write to ${site.supportEmail}.`;
  return { ok: false, status: response.status, message };
}
