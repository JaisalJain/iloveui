// The site's keyboard shortcuts, shown in tooltips and in the shortcuts dialog.
export type Shortcut = { id: "search" | "focus-search" | "theme" | "copy" | "help"; keys: string[]; label: string };

export const SHORTCUTS: readonly Shortcut[] = [
  { id: "search", keys: ["mod", "K"], label: "Search designs, categories and pages" },
  { id: "focus-search", keys: ["/"], label: "Focus the search field" },
  { id: "theme", keys: ["T"], label: "Toggle light and dark theme" },
  { id: "copy", keys: ["C"], label: "Copy the code tab you are viewing" },
  { id: "help", keys: ["?"], label: "Show keyboard shortcuts" },
];

/** True when a keystroke belongs to a text field and must not trigger single-key shortcuts. */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  if (tag === "TEXTAREA" || tag === "SELECT") return true;
  if (tag === "INPUT") {
    const type = (target as HTMLInputElement).type;
    return !["button", "checkbox", "radio", "range", "reset", "submit", "color"].includes(type);
  }
  return false;
}
