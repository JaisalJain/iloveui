"use client";

import type Fuse from "fuse.js";
import {
  ArrowRight,
  Clock,
  CornerDownLeft,
  FileText,
  Keyboard,
  LayoutTemplate,
  Search,
  Shapes,
  SunMoon,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Dialog as DialogPrimitive } from "radix-ui";
import { useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { toggleColorMode } from "@/lib/client/theme-mode";
import {
  ACTION_ENTRIES,
  MAX_RECENT,
  PAGE_ENTRIES,
  RECENT_STORAGE_KEY,
  type PaletteEntry,
  type PaletteGroup,
} from "@/lib/palette";
import { Kbd } from "@/components/ui/kbd";
import { createSearcher, loadFuse, matchesAllTokens, toFuseQuery } from "@/lib/search";
import { cn } from "@/lib/utils";

const GROUP_ORDER: PaletteGroup[] = ["Recent", "Designs", "Categories", "Pages", "Actions"];
const GROUP_ICONS: Record<PaletteGroup, LucideIcon> = {
  Recent: Clock,
  Designs: LayoutTemplate,
  Categories: Shapes,
  Pages: FileText,
  Actions: ArrowRight,
};

type Row = { entry: PaletteEntry; group: PaletteGroup; key: string };

function readRecent(): PaletteEntry[] {
  try {
    const raw = window.localStorage.getItem(RECENT_STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is PaletteEntry =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as PaletteEntry).id === "string" &&
        typeof (item as PaletteEntry).label === "string" &&
        typeof (item as PaletteEntry).href === "string",
    );
  } catch {
    return [];
  }
}

function rememberEntry(entry: PaletteEntry) {
  if (!entry.href) return;
  try {
    const next = [entry, ...readRecent().filter((item) => item.id !== entry.id)].slice(0, MAX_RECENT);
    window.localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Recent items are a convenience; failing to store them is harmless.
  }
}

function fallbackMatch(entries: PaletteEntry[], query: string) {
  return entries.filter((entry) => matchesAllTokens([entry.label, entry.hint, ...(entry.keywords ?? [])], query));
}

export function CommandPalette({
  open,
  onOpenChange,
  onShowShortcuts,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onShowShortcuts: () => void;
}) {
  const router = useRouter();
  const listboxId = useId();
  const optionPrefix = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [recent, setRecent] = useState<PaletteEntry[]>([]);
  const [fuse, setFuse] = useState<Fuse<PaletteEntry> | null>(null);

  const entries = useMemo(() => [...PAGE_ENTRIES, ...ACTION_ENTRIES], []);

  const rows = useMemo<Row[]>(() => {
    const trimmed = query.trim();
    let matches: { entry: PaletteEntry; group: PaletteGroup }[];
    if (!trimmed) {
      matches = [
        ...recent.map((entry) => ({ entry, group: "Recent" as const })),
        ...entries.map((entry) => ({ entry, group: entry.group })),
      ];
    } else {
      const found = fuse ? fuse.search(toFuseQuery(trimmed), { limit: 24 }).map((result) => result.item) : null;
      matches = (found ?? fallbackMatch(entries, trimmed)).map((entry) => ({ entry, group: entry.group }));
    }
    return GROUP_ORDER.flatMap((group) =>
      matches
        .filter((match) => match.group === group)
        .map((match) => ({ ...match, key: `${group}:${match.entry.id}` })),
    );
  }, [query, recent, entries, fuse]);

  const groups = useMemo(() => {
    const byGroup: { group: PaletteGroup; items: { row: Row; index: number }[] }[] = [];
    rows.forEach((row, index) => {
      const last = byGroup.at(-1);
      if (last && last.group === row.group) last.items.push({ row, index });
      else byGroup.push({ group: row.group, items: [{ row, index }] });
    });
    return byGroup;
  }, [rows]);

  const activeRow = rows[Math.min(activeIndex, rows.length - 1)];
  const optionId = (index: number) => `${optionPrefix}-option-${index}`;

  function prepare() {
    setRecent(readRecent());
    void loadFuse().then((FuseClass) => {
      setFuse(
        createSearcher(FuseClass, entries, [
          { name: "label", weight: 3 },
          { name: "keywords", weight: 2 },
          { name: "hint", weight: 1 },
        ]),
      );
    });
  }

  function select(row: Row) {
    const { entry } = row;
    if (entry.action === "toggle-theme") {
      toggleColorMode();
      onOpenChange(false);
      return;
    }
    if (entry.action === "show-shortcuts") {
      onShowShortcuts();
      return;
    }
    if (entry.href) {
      rememberEntry(entry);
      onOpenChange(false);
      router.push(entry.href);
    }
  }

  function moveTo(index: number) {
    if (rows.length === 0) return;
    const next = (index + rows.length) % rows.length;
    setActiveIndex(next);
    document.getElementById(optionId(next))?.scrollIntoView({ block: "nearest" });
  }

  function onInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveTo(activeIndex + 1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      moveTo(activeIndex - 1);
    } else if (event.key === "Home" && event.ctrlKey) {
      event.preventDefault();
      moveTo(0);
    } else if (event.key === "End" && event.ctrlKey) {
      event.preventDefault();
      moveTo(rows.length - 1);
    } else if (event.key === "Enter" && activeRow) {
      event.preventDefault();
      select(activeRow);
    }
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=closed]:animate-fade-out data-[state=open]:animate-fade-in dark:bg-black/60" />
        <DialogPrimitive.Content
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            prepare();
            inputRef.current?.focus();
          }}
          onCloseAutoFocus={() => {
            setQuery("");
            setActiveIndex(0);
          }}
          className={cn(
            "fixed top-[12vh] left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-160 -translate-x-1/2 flex-col overflow-hidden",
            "rounded-card border border-hairline bg-surface text-fg shadow-lg outline-hidden",
            "data-[state=closed]:animate-dialog-out data-[state=open]:animate-dialog-in",
          )}
        >
          <DialogPrimitive.Title className="sr-only">Search</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Search designs, categories and pages. Use the arrow keys to move between results and Enter to open one.
          </DialogPrimitive.Description>
          <div className="flex items-center gap-3 border-b border-hairline px-4 py-3">
            <Search size={16} strokeWidth={1.5} className="text-muted" aria-hidden />
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setActiveIndex(0);
              }}
              onKeyDown={onInputKeyDown}
              role="combobox"
              aria-expanded
              aria-controls={listboxId}
              aria-autocomplete="list"
              aria-activedescendant={activeRow ? optionId(rows.indexOf(activeRow)) : undefined}
              aria-label="Search"
              placeholder="Search designs, categories, pages"
              autoComplete="off"
              spellCheck={false}
              className="h-9 min-w-0 flex-1 rounded-control bg-transparent px-1 text-16 text-fg placeholder:text-muted"
            />
            <Kbd>esc</Kbd>
          </div>

          <div
            id={listboxId}
            role="listbox"
            aria-label="Results"
            className="max-h-[min(400px,55vh)] [scrollbar-gutter:stable] overflow-y-auto overscroll-contain p-2"
          >
            {rows.length === 0 ? (
              <div className="flex flex-col items-center gap-3 px-6 py-12 text-center" role="presentation">
                <p className="text-14 text-muted">
                  No matches for <span className="text-fg">“{query.trim()}”</span>.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    inputRef.current?.focus();
                  }}
                  className="inline-flex h-8 items-center rounded-control border border-hairline px-3 text-14 text-fg transition-colors hover:bg-raised pointer-coarse:h-10"
                >
                  Clear search
                </button>
              </div>
            ) : (
              groups.map(({ group, items }, groupIndex) => (
                <div key={group} role="group" aria-labelledby={`${optionPrefix}-${group}`}>
                  <div
                    id={`${optionPrefix}-${group}`}
                    role="presentation"
                    className={cn("px-3 pb-1 label-mono text-muted", groupIndex === 0 ? "pt-1" : "pt-3")}
                  >
                    {group}
                  </div>
                  {items.map(({ row, index }) => {
                    const Icon =
                      row.entry.action === "toggle-theme"
                        ? SunMoon
                        : row.entry.action === "show-shortcuts"
                          ? Keyboard
                          : GROUP_ICONS[row.group];
                    const active = row === activeRow;
                    return (
                      <div
                        key={row.key}
                        id={optionId(index)}
                        role="option"
                        aria-selected={active}
                        onPointerMove={() => {
                          if (activeIndex !== index) setActiveIndex(index);
                        }}
                        onClick={() => select(row)}
                        className={cn(
                          "relative flex h-10 cursor-pointer items-center gap-3 rounded-control px-3 text-14 text-fg",
                          active && "bg-raised",
                        )}
                      >
                        {active ? (
                          <span aria-hidden className="absolute top-2 bottom-2 left-0 w-0.5 rounded-full bg-accent" />
                        ) : null}
                        <Icon size={16} strokeWidth={1.5} className="text-muted" aria-hidden />
                        <span className="truncate">{row.entry.label}</span>
                        {row.entry.hint ? (
                          <span className="ml-auto shrink-0 font-mono text-12 text-muted">{row.entry.hint}</span>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          <div className="flex h-10 items-center gap-4 border-t border-hairline px-4 text-12 text-muted">
            <span className="flex items-center gap-1">
              <Kbd>
                <span aria-hidden>↑</span>
                <span className="sr-only">Up arrow</span>
              </Kbd>
              <Kbd>
                <span aria-hidden>↓</span>
                <span className="sr-only">Down arrow</span>
              </Kbd>
              to move
            </span>
            <span className="flex items-center gap-1">
              <Kbd>
                <CornerDownLeft size={12} strokeWidth={1.5} aria-hidden />
                <span className="sr-only">Enter</span>
              </Kbd>
              to open
            </span>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
