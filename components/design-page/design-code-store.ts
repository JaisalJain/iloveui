"use client";

import { useSyncExternalStore } from "react";
import type { DesignCode } from "@/lib/catalog-types";

// A free design's code (static JSON at design.codeUrl), fetched once per page and shared by the code panel and the
// Copy AI Prompt button. Pro designs never use this: their code has no public URL.

export type CodeState =
  { status: "idle" } | { status: "loading" } | { status: "ready"; code: DesignCode } | { status: "error" };

const IDLE: CodeState = { status: "idle" };
const states = new Map<string, CodeState>();
const pending = new Map<string, Promise<DesignCode>>();
const listeners = new Set<() => void>();

function set(url: string, state: CodeState) {
  states.set(url, state);
  for (const listener of listeners) listener();
}

/** Starts (or joins) the fetch of a design's code; resolves with it or rejects when it cannot be loaded. */
export function loadDesignCode(url: string): Promise<DesignCode> {
  const current = states.get(url);
  if (current?.status === "ready") return Promise.resolve(current.code);
  const inFlight = pending.get(url);
  if (inFlight) return inFlight;
  set(url, { status: "loading" });
  const request = fetch(url)
    .then(async (response) => {
      if (!response.ok) throw new Error(`Code request failed with ${response.status}`);
      const code = (await response.json()) as DesignCode;
      set(url, { status: "ready", code });
      return code;
    })
    .catch((error: unknown) => {
      set(url, { status: "error" });
      throw error;
    })
    .finally(() => pending.delete(url));
  pending.set(url, request);
  return request;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useDesignCode(url: string): CodeState {
  return useSyncExternalStore(
    subscribe,
    () => states.get(url) ?? IDLE,
    () => IDLE,
  );
}
