"use client";

import { Suspense, useSyncExternalStore } from "react";
import { previewComponents } from "@/registry/generated/preview-loaders";
import type { DesignState } from "@/registry/definitions";
import { applyThemeCss, FRAME_SOURCE, isParentMessage } from "./protocol";

// The live preview inside an iframe: renders one design in the state the parent asks for, and applies Theme Lab
// tokens and light/dark sent by postMessage.

type Snapshot = { state: string; replay: number };

const SERVER_SNAPSHOT: Snapshot = { state: "default", replay: 0 };
let snapshot: Snapshot = SERVER_SNAPSHOT;
let started = false;
const listeners = new Set<() => void>();

function emit(next: Snapshot) {
  snapshot = next;
  for (const listener of listeners) listener();
}

function start() {
  if (started) return;
  started = true;
  const fromUrl = new URLSearchParams(window.location.search).get("state");
  if (fromUrl) snapshot = { ...snapshot, state: fromUrl };
  window.addEventListener("message", (event) => {
    if (event.origin !== window.location.origin || event.source !== window.parent) return;
    const message: unknown = event.data;
    if (!isParentMessage(message)) return;
    if (message.type === "state") emit({ ...snapshot, state: message.state });
    else if (message.type === "replay") emit({ ...snapshot, replay: snapshot.replay + 1 });
    else if (message.type === "mode") document.documentElement.classList.toggle("dark", message.mode === "dark");
    else if (message.type === "theme") applyThemeCss(message.css);
  });
  if (window.parent !== window) {
    window.parent.postMessage({ source: FRAME_SOURCE, type: "ready" }, window.location.origin);
  }
}

function subscribe(listener: () => void) {
  start();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function PreviewRuntime({ slug, states }: { slug: string; states: DesignState[] }) {
  const current = useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => SERVER_SNAPSHOT,
  );
  const Preview = previewComponents[slug];
  if (!Preview) return null;
  const state = (states as string[]).includes(current.state) ? (current.state as DesignState) : "default";
  return (
    <Suspense fallback={null}>
      <Preview key={`${state}:${current.replay}`} state={state} />
    </Suspense>
  );
}
