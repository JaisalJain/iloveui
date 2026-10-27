"use client";

import { useSyncExternalStore } from "react";
import { FORMAT_STORAGE_KEY, isCodeFormat, type CodeFormat } from "@/lib/code";

// The visitor's preferred code format (React or HTML), shared with the browse page's format filter through
// localStorage "iloveui.format".

const listeners = new Set<() => void>();
let memory: CodeFormat | null = null;

function read(): CodeFormat {
  if (memory) return memory;
  try {
    const stored = window.localStorage.getItem(FORMAT_STORAGE_KEY);
    return isCodeFormat(stored) ? stored : "react";
  } catch {
    return "react";
  }
}

export function setCodeFormat(format: CodeFormat) {
  memory = format;
  try {
    window.localStorage.setItem(FORMAT_STORAGE_KEY, format);
  } catch {
    // Storage can be unavailable; the choice still holds on this page.
  }
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useCodeFormat(): CodeFormat {
  return useSyncExternalStore(subscribe, read, () => "react");
}
