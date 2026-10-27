"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "motion/react";
import { ArrowRight, CircleDot, CornerDownLeft, FolderKanban, Plus, Search, SquareSlash } from "lucide-react";

export type BoxcarItemKind = "issue" | "project" | "person" | "action" | "page";

export type BoxcarItem = {
  id: string;
  label: string;
  kind: BoxcarItemKind;
  /** Secondary text in mono: an issue key, a team, a role. */
  meta?: string;
  /** Keys shown as chips, in order (for example ["G", "I"]). */
  shortcut?: string[];
};

export type BoxcarGroup = { id: string; label: string; items: BoxcarItem[] };

export type BoxcarScope = "all" | "commands" | "projects" | "people";

export type BoxcarCommandPaletteProps = {
  /** Shown first while the query is empty. */
  recent?: BoxcarItem[];
  /** Groups shown after Recent while the query is empty. */
  suggestions?: BoxcarGroup[];
  /** Everything the query searches. */
  index?: BoxcarItem[];
  /** Controlled open state; leave undefined to let the palette manage it. */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Initial query; a leading >, # or @ sets the scope. */
  defaultQuery?: string;
  /** "loading" shows skeleton rows while results are on their way. */
  status?: "idle" | "loading";
  /** Listen for Cmd+K / Ctrl+K on the window. */
  hotkey?: boolean;
  closeOnSelect?: boolean;
  onSelect?: (item: BoxcarItem) => void;
  /** Called from the empty state with the query, to create an issue from it. */
  onCreate?: (query: string) => void;
  triggerLabel?: string;
  className?: string;
};

const DEFAULT_RECENT: BoxcarItem[] = [
  { id: "box-1284", label: "Courier webhook retries double-charge", kind: "issue", meta: "BOX-1284" },
  { id: "field-app-v4", label: "Field app v4", kind: "project", meta: "Mobile · 62%" },
  { id: "ana", label: "Ana Oyelaran", kind: "person", meta: "Platform lead" },
];

const DEFAULT_SUGGESTIONS: BoxcarGroup[] = [
  {
    id: "actions",
    label: "Actions",
    items: [
      { id: "create-issue", label: "Create issue", kind: "action", shortcut: ["C"] },
      { id: "assign-me", label: "Assign to me", kind: "action", shortcut: ["I"] },
      { id: "change-status", label: "Change status", kind: "action", shortcut: ["S"] },
    ],
  },
  {
    id: "go",
    label: "Go to",
    items: [
      { id: "inbox", label: "Inbox", kind: "page", meta: "14 unread", shortcut: ["G", "I"] },
      { id: "my-issues", label: "My issues", kind: "page", meta: "9 open", shortcut: ["G", "M"] },
      { id: "cycles", label: "Cycles", kind: "page", meta: "Cycle 31", shortcut: ["G", "C"] },
    ],
  },
];

const DEFAULT_INDEX: BoxcarItem[] = [
  ...DEFAULT_RECENT,
  { id: "box-1291", label: "Invoice PDF missing VAT line", kind: "issue", meta: "BOX-1291" },
  { id: "box-1302", label: "Offline sync drops photo attachments", kind: "issue", meta: "BOX-1302" },
  { id: "box-1277", label: "Driver app crashes on rotate", kind: "issue", meta: "BOX-1277" },
  { id: "box-1310", label: "Invite flow loses team on refresh", kind: "issue", meta: "BOX-1310" },
  { id: "billing-migration", label: "Billing migration", kind: "project", meta: "Payments · 18%" },
  { id: "depot-scanner", label: "Depot scanner rollout", kind: "project", meta: "Ops · 81%" },
  { id: "mateo", label: "Mateo Ricci", kind: "person", meta: "iOS" },
  { id: "hana", label: "Hana Sato", kind: "person", meta: "Design" },
  ...DEFAULT_SUGGESTIONS.flatMap((group) => group.items),
  { id: "invite", label: "Invite teammate", kind: "action" },
  { id: "theme", label: "Switch theme", kind: "action", shortcut: ["⇧", "T"] },
];

const SCOPES: Record<string, BoxcarScope> = { ">": "commands", "#": "projects", "@": "people" };
const SCOPE_LABEL: Record<Exclude<BoxcarScope, "all">, string> = {
  commands: "Commands",
  projects: "Projects",
  people: "People",
};
const SCOPE_KINDS: Record<BoxcarScope, BoxcarItemKind[]> = {
  all: ["issue", "project", "person", "action", "page"],
  commands: ["action", "page"],
  projects: ["project"],
  people: ["person"],
};
const RESULT_GROUPS: { id: string; label: string; kinds: BoxcarItemKind[] }[] = [
  { id: "issues", label: "Issues", kinds: ["issue"] },
  { id: "projects", label: "Projects", kinds: ["project"] },
  { id: "people", label: "People", kinds: ["person"] },
  { id: "commands", label: "Commands", kinds: ["action", "page"] },
];

const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--iu-accent) focus-visible:outline-solid";
const CREATE_ID = "__create";

function parseQuery(value: string): { scope: BoxcarScope; text: string } {
  const scope = SCOPES[value.charAt(0)];
  return scope ? { scope, text: value.slice(1).trimStart() } : { scope: "all", text: value };
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function Highlight({ text, query }: { text: string; query: string }) {
  const at = query ? text.toLowerCase().indexOf(query.toLowerCase()) : -1;
  if (at < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, at)}
      <mark className="bg-transparent text-current underline decoration-2 underline-offset-[3px]">
        {text.slice(at, at + query.length)}
      </mark>
      {text.slice(at + query.length)}
    </>
  );
}

function KindIcon({ item }: { item: BoxcarItem }) {
  const box =
    "inline-flex size-8 shrink-0 items-center justify-center rounded-[min(var(--iu-radius),4px)] border-2 border-current";
  if (item.kind === "person") {
    return (
      <span aria-hidden="true" className={`${box} font-mono text-[11px] font-bold`}>
        {initials(item.label)}
      </span>
    );
  }
  const Icon =
    item.kind === "issue"
      ? CircleDot
      : item.kind === "project"
        ? FolderKanban
        : item.kind === "page"
          ? ArrowRight
          : item.id === CREATE_ID
            ? Plus
            : SquareSlash;
  return (
    <span aria-hidden="true" className={box}>
      <Icon size={16} strokeWidth={2} />
    </span>
  );
}

function Kbd({ children }: { children: string }) {
  return (
    <kbd className="inline-flex h-6 min-w-6 items-center justify-center rounded-[min(var(--iu-radius),4px)] border-2 border-current px-1 font-mono text-[11px] font-bold">
      {children}
    </kbd>
  );
}

const noopSubscribe = () => () => {};

export function BoxcarCommandPalette({
  recent = DEFAULT_RECENT,
  suggestions = DEFAULT_SUGGESTIONS,
  index = DEFAULT_INDEX,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  defaultQuery = "",
  status = "idle",
  hotkey = true,
  closeOnSelect = true,
  onSelect,
  onCreate,
  triggerLabel = "Search or jump to",
  className = "",
}: BoxcarCommandPaletteProps) {
  const reduceMotion = useReducedMotion();
  const baseId = useId();
  const listId = `${baseId}-list`;
  const titleId = `${baseId}-title`;
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const [innerOpen, setInnerOpen] = useState(defaultOpen);
  const open = openProp ?? innerOpen;
  const [scope, setScope] = useState<BoxcarScope>(() => parseQuery(defaultQuery).scope);
  const [text, setText] = useState(() => parseQuery(defaultQuery).text);
  const [activeIndex, setActiveIndex] = useState(0);
  const [stamped, setStamped] = useState<{ id: string; item: BoxcarItem; query: string } | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const modKey = useSyncExternalStore(
    noopSubscribe,
    () => (/Mac|iPhone|iPad/.test(navigator.platform) ? "⌘" : "Ctrl"),
    () => "⌘",
  );

  const setOpen = useCallback(
    (next: boolean) => {
      if (openProp === undefined) setInnerOpen(next);
      onOpenChange?.(next);
      if (!next) {
        setText("");
        setScope("all");
        setActiveIndex(0);
        setStamped(null);
        setAnnouncement("");
        triggerRef.current?.focus();
      }
    },
    [onOpenChange, openProp],
  );

  const query = text.trim();
  const groups: BoxcarGroup[] = useMemo(() => {
    if (status === "loading") return [];
    const kinds = SCOPE_KINDS[scope];
    if (!query) {
      if (scope !== "all") {
        return [{ id: scope, label: SCOPE_LABEL[scope], items: index.filter((item) => kinds.includes(item.kind)) }];
      }
      return [{ id: "recent", label: "Recent", items: recent }, ...suggestions].filter(
        (group) => group.items.length > 0,
      );
    }
    const needle = query.toLowerCase();
    const seen = new Set<string>();
    const matches = index.filter((item) => {
      if (seen.has(item.id) || !kinds.includes(item.kind)) return false;
      const hit = item.label.toLowerCase().includes(needle) || (item.meta ?? "").toLowerCase().includes(needle);
      if (hit) seen.add(item.id);
      return hit;
    });
    return RESULT_GROUPS.map((group) => ({
      id: group.id,
      label: group.label,
      items: matches.filter((item) => group.kinds.includes(item.kind)),
    })).filter((group) => group.items.length > 0);
  }, [index, query, recent, scope, status, suggestions]);

  const empty = status !== "loading" && !!query && groups.length === 0;
  const createItem: BoxcarItem = { id: CREATE_ID, label: `Create issue “${query}”`, kind: "action", shortcut: ["↵"] };
  const options = empty ? [createItem] : groups.flatMap((group) => group.items);
  const resultCount = groups.reduce((total, group) => total + group.items.length, 0);
  const active = options[Math.min(activeIndex, options.length - 1)];
  const optionId = (item: BoxcarItem) => `${baseId}-option-${item.id}`;

  // Open and close from anywhere with Cmd+K / Ctrl+K.
  useEffect(() => {
    if (!hotkey) return;
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(!open);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [hotkey, open, setOpen]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!active) return;
    document.getElementById(optionId(active))?.scrollIntoView({ block: "nearest" });
    // optionId is derived from baseId, which never changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.id]);

  // The row presses into its shadow first, so the choice is felt before the palette closes.
  useEffect(() => {
    if (!stamped) return;
    const timeout = setTimeout(
      () => {
        if (stamped.id === CREATE_ID) onCreate?.(stamped.query);
        else onSelect?.(stamped.item);
        if (closeOnSelect) setOpen(false);
        else setStamped(null);
      },
      reduceMotion ? 0 : 160,
    );
    return () => clearTimeout(timeout);
  }, [closeOnSelect, onCreate, onSelect, reduceMotion, setOpen, stamped]);

  function choose(item: BoxcarItem | undefined) {
    if (!item || stamped) return;
    setStamped({ id: item.id, item, query });
    setAnnouncement(item.id === CREATE_ID ? `Creating issue ${query}` : `Opening ${item.label}`);
  }

  function onInputKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    const count = options.length;
    if (event.key === "ArrowDown" && count) {
      event.preventDefault();
      setActiveIndex((current) => (Math.min(current, count - 1) + 1) % count);
    } else if (event.key === "ArrowUp" && count) {
      event.preventDefault();
      setActiveIndex((current) => (Math.min(current, count - 1) - 1 + count) % count);
    } else if (event.key === "Enter") {
      event.preventDefault();
      choose(active);
    } else if (event.key === "Escape") {
      event.preventDefault();
      if (text || scope !== "all") {
        setText("");
        setScope("all");
        setActiveIndex(0);
      } else setOpen(false);
    } else if (event.key === "Backspace" && !text && scope !== "all") {
      event.preventDefault();
      setScope("all");
      setActiveIndex(0);
    }
  }

  function onInputChange(value: string) {
    const prefix = SCOPES[value.charAt(0)];
    if (!text && scope === "all" && prefix) {
      setScope(prefix);
      setText(value.slice(1).trimStart());
    } else setText(value);
    setActiveIndex(0);
  }

  function onPanelKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape" && event.target !== inputRef.current) {
      event.preventDefault();
      setOpen(false);
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = Array.from(panelRef.current?.querySelectorAll<HTMLElement>("input, button") ?? []);
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!first || !last) return;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  const liveMessage =
    announcement ||
    (status === "loading"
      ? "Searching"
      : empty
        ? "No results"
        : query
          ? `${resultCount} result${resultCount === 1 ? "" : "s"}`
          : "");

  function renderOption(item: BoxcarItem) {
    const isActive = active?.id === item.id;
    const isStamped = stamped?.id === item.id;
    return (
      <div
        key={item.id}
        id={optionId(item)}
        role="option"
        aria-selected={isActive}
        onPointerMove={() => {
          const at = options.indexOf(item);
          if (at !== activeIndex) setActiveIndex(at);
        }}
        onClick={() => choose(item)}
        className={`relative flex min-h-10 cursor-default items-center gap-3 px-3 py-[calc(8px*var(--iu-density))] transition-transform duration-100 ease-linear select-none motion-reduce:transition-none ${
          isStamped ? "translate-x-1 translate-y-1" : ""
        } ${isActive ? "text-(--iu-accent-foreground)" : "text-(--iu-foreground)"}`}
      >
        {isActive ? (
          <motion.span
            layoutId={`${baseId}-active`}
            aria-hidden="true"
            className={`absolute inset-0 rounded-[min(var(--iu-radius),4px)] border-2 border-(--iu-foreground) bg-(--iu-accent) ${
              isStamped ? "" : "shadow-[4px_4px_0_0_var(--iu-foreground)]"
            }`}
          />
        ) : null}
        <span className="relative">
          <KindIcon item={item} />
        </span>
        <span className="relative min-w-0 flex-1">
          <span className="block truncate text-[15px] font-bold tracking-[-0.01em]">
            <Highlight text={item.label} query={item.id === CREATE_ID ? "" : query} />
          </span>
        </span>
        {item.meta ? (
          <span
            className={`relative hidden shrink-0 font-mono text-xs tabular-nums sm:block ${isActive ? "" : "text-(--iu-muted)"}`}
          >
            <Highlight text={item.meta} query={query} />
          </span>
        ) : null}
        {item.shortcut ? (
          <span
            className={`relative hidden shrink-0 items-center gap-1 sm:flex ${isActive ? "" : "text-(--iu-muted)"}`}
          >
            <span className="sr-only">Shortcut </span>
            {item.shortcut.map((key) => (
              <Kbd key={key}>{key}</Kbd>
            ))}
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <MotionConfig reducedMotion="user" transition={reduceMotion ? { duration: 0 } : { duration: 0.1, ease: "linear" }}>
      <div className={`font-(family-name:--iu-font) text-(--iu-foreground) ${className}`}>
        <button
          ref={triggerRef}
          type="button"
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => setOpen(true)}
          className={`group flex h-12 w-full max-w-[440px] items-center gap-3 rounded-[min(var(--iu-radius),4px)] border-2 border-(--iu-foreground) bg-(--iu-surface) px-4 text-left shadow-[4px_4px_0_0_var(--iu-foreground)] transition-[translate,box-shadow] duration-100 ease-linear active:translate-x-1 active:translate-y-1 active:shadow-none motion-reduce:transition-none ${FOCUS}`}
        >
          <Search size={18} strokeWidth={2} aria-hidden="true" />
          <span className="flex-1 truncate text-[15px] font-bold">{triggerLabel}</span>
          <span className="flex items-center gap-1 text-(--iu-muted)">
            <Kbd>{modKey}</Kbd>
            <Kbd>K</Kbd>
          </span>
        </button>

        <AnimatePresence initial={false}>
          {open ? (
            <div className="fixed inset-0 z-50 flex items-start justify-center px-3 pt-[8dvh] sm:px-6 sm:pt-[12dvh]">
              <motion.div
                aria-hidden="true"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setOpen(false)}
                className="absolute inset-0 bg-(--iu-background)/85 bg-[repeating-linear-gradient(135deg,color-mix(in_oklab,var(--iu-foreground)_14%,transparent)_0_2px,transparent_2px_12px)]"
              />
              <motion.div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                onKeyDown={onPanelKeyDown}
                initial={{ y: -8 }}
                animate={{ y: 0 }}
                exit={{ y: -8, opacity: 0 }}
                className="relative flex max-h-[84dvh] w-full max-w-[640px] flex-col overflow-hidden rounded-[min(var(--iu-radius),4px)] border-2 border-(--iu-foreground) bg-(--iu-surface) shadow-[8px_8px_0_0_var(--iu-foreground)]"
              >
                <div className="flex h-9 shrink-0 items-center justify-between bg-(--iu-foreground) pr-1 pl-4 text-(--iu-background)">
                  <h2 id={titleId} className="font-mono text-[11px] font-bold tracking-[0.08em] uppercase">
                    Boxcar / Jump to anything
                  </h2>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="inline-flex h-7 items-center rounded-[min(var(--iu-radius),4px)] px-2 font-mono text-[11px] font-bold uppercase focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-(--iu-accent) focus-visible:outline-solid pointer-coarse:min-h-10"
                  >
                    Esc<span className="sr-only"> to close the command palette</span>
                  </button>
                </div>

                <div className="flex min-h-16 shrink-0 items-center gap-3 border-b-2 border-(--iu-foreground) px-4">
                  <Search size={22} strokeWidth={2.25} aria-hidden="true" className="shrink-0" />
                  <AnimatePresence initial={false} mode="popLayout">
                    {scope !== "all" ? (
                      <motion.span
                        key={scope}
                        initial={{ scale: 1.2, rotate: -8 }}
                        animate={{ scale: 1, rotate: -3 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        className="inline-flex shrink-0 items-center gap-1 rounded-[min(var(--iu-radius),4px)] border-2 border-(--iu-foreground) bg-(--iu-foreground) px-2 py-0.5 font-mono text-[11px] font-bold tracking-[0.06em] text-(--iu-background) uppercase"
                      >
                        <span aria-hidden="true">{Object.keys(SCOPES).find((key) => SCOPES[key] === scope)}</span>
                        {SCOPE_LABEL[scope]}
                      </motion.span>
                    ) : null}
                  </AnimatePresence>
                  <input
                    ref={inputRef}
                    type="text"
                    role="combobox"
                    aria-expanded="true"
                    aria-controls={listId}
                    aria-autocomplete="list"
                    aria-activedescendant={active ? optionId(active) : undefined}
                    aria-label={scope === "all" ? "Search Boxcar" : `Search ${SCOPE_LABEL[scope]}`}
                    autoComplete="off"
                    spellCheck={false}
                    value={text}
                    onChange={(event) => onInputChange(event.target.value)}
                    onKeyDown={onInputKeyDown}
                    placeholder={
                      scope === "all" ? "Type a command or search" : `Search ${SCOPE_LABEL[scope].toLowerCase()}`
                    }
                    className="h-14 min-w-0 flex-1 bg-transparent text-lg font-bold tracking-[-0.01em] outline-none placeholder:text-(--iu-muted) sm:text-xl"
                  />
                </div>

                <div className="min-h-0 flex-1 [scrollbar-gutter:stable] overflow-y-auto overscroll-contain">
                  {status === "loading" ? (
                    <div className="p-2">
                      <p className="px-2 pt-2 pb-2 font-mono text-[11px] font-bold tracking-[0.08em] text-(--iu-muted) uppercase">
                        Searching issues, projects and people
                      </p>
                      {[68, 52, 74, 44, 60].map((width, row) => (
                        <div
                          key={row}
                          aria-hidden="true"
                          className="flex items-center gap-3 px-3 py-[calc(8px*var(--iu-density))]"
                        >
                          <span className="size-8 shrink-0 rounded-[min(var(--iu-radius),4px)] border-2 border-(--iu-foreground)/25" />
                          <span className="h-3.5 bg-(--iu-foreground)/15" style={{ width: `${width}%` }} />
                          <span className="ml-auto hidden h-3 w-16 bg-(--iu-foreground)/10 sm:block" />
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {empty ? (
                    <div className="flex items-center gap-5 border-b-2 border-dashed border-(--iu-foreground)/30 px-5 py-6">
                      <span
                        aria-hidden="true"
                        className="inline-flex size-16 shrink-0 -rotate-3 items-center justify-center rounded-[min(var(--iu-radius),4px)] border-2 border-(--iu-foreground) bg-(--iu-background) font-mono text-4xl font-extrabold shadow-[4px_4px_0_0_var(--iu-foreground)]"
                      >
                        0
                      </span>
                      <div className="min-w-0">
                        <p className="text-lg leading-tight font-extrabold tracking-[-0.02em] text-balance">
                          Nothing matches “{query}”.
                        </p>
                        <p className="mt-1 text-sm text-pretty text-(--iu-muted)">
                          Check the spelling or clear the scope with Backspace. Or turn it into an issue now.
                        </p>
                      </div>
                    </div>
                  ) : null}

                  <div
                    id={listId}
                    role="listbox"
                    aria-label="Results"
                    aria-busy={status === "loading" || undefined}
                    className={status === "loading" ? "" : "p-2"}
                  >
                    {empty
                      ? renderOption(createItem)
                      : groups.map((group) => (
                          <div key={group.id} role="group" aria-labelledby={`${baseId}-group-${group.id}`}>
                            <div
                              id={`${baseId}-group-${group.id}`}
                              className="flex items-center gap-2 px-2 pt-3 pb-1.5 font-mono text-[11px] font-bold tracking-[0.08em] text-(--iu-muted) uppercase"
                            >
                              {group.label}
                              <span className="tabular-nums">[{group.items.length}]</span>
                            </div>
                            {group.items.map((item) => renderOption(item))}
                          </div>
                        ))}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-4 border-t-2 border-(--iu-foreground) px-4 py-2 font-mono text-[11px] font-bold tracking-[0.04em] text-(--iu-muted) uppercase">
                  <span className="inline-flex items-center gap-1.5">
                    <Kbd>↑</Kbd>
                    <Kbd>↓</Kbd>
                    Move
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-[min(var(--iu-radius),4px)] border-2 border-current">
                      <CornerDownLeft size={12} strokeWidth={2.5} aria-hidden="true" />
                    </span>
                    Open
                  </span>
                  <span className="ml-auto hidden items-center gap-3 sm:inline-flex">
                    <span>&gt; Commands</span>
                    <span># Projects</span>
                    <span>@ People</span>
                  </span>
                </div>
                <p aria-live="polite" className="sr-only">
                  {liveMessage}
                </p>
              </motion.div>
            </div>
          ) : null}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}

export default BoxcarCommandPalette;
