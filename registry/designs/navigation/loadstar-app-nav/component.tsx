"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "motion/react";
import {
  Bell,
  ChartBar,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  FileText,
  Inbox,
  Menu,
  Package,
  PanelLeft,
  Plus,
  Route,
  Search,
  Settings,
  TriangleAlert,
  Truck,
  Warehouse,
  X,
} from "lucide-react";

type IconType = ComponentType<{ size?: number; strokeWidth?: number; className?: string; "aria-hidden"?: boolean }>;

export type LoadstarNavItem = {
  id: string;
  label: string;
  count?: number;
  /** "warning" marks counts that need attention (shown with an icon and text, never color alone). */
  tone?: "default" | "warning";
  icon?: IconType;
  /** Which shipments the default content shows for this item. */
  filter?: LoadstarShipment["status"][];
};

export type LoadstarNavSection = { id: string; label: string; items: LoadstarNavItem[] };

export type LoadstarShipment = {
  id: string;
  origin: string;
  destination: string;
  carrier: string;
  eta: string;
  status: "on-time" | "delayed" | "exception";
  weight: string;
};

export type LoadstarLocation = { itemId: string; detail?: string };

export type LoadstarAppNavProps = {
  workspace?: string;
  region?: string;
  sections?: LoadstarNavSection[];
  savedViews?: LoadstarNavItem[];
  shipments?: LoadstarShipment[];
  defaultLocation?: LoadstarLocation;
  defaultCollapsed?: boolean;
  status?: "idle" | "loading";
  syncedLabel?: string;
  unreadNotifications?: number;
  userName?: string;
  /** Replaces the default shipments table with your page. */
  children?: ReactNode;
  onNavigate?: (location: LoadstarLocation) => void;
  onSaveView?: () => void;
  onClearFilters?: () => void;
  onOpenNotifications?: () => void;
  className?: string;
};

export const LOADSTAR_DEFAULT_SECTIONS: LoadstarNavSection[] = [
  {
    id: "operations",
    label: "Operations",
    items: [
      { id: "inbox", label: "Inbox", count: 12, icon: Inbox },
      { id: "shipments", label: "Shipments", count: 1284, icon: Package },
      { id: "exceptions", label: "Exceptions", count: 7, tone: "warning", icon: TriangleAlert, filter: ["exception"] },
      { id: "docks", label: "Dock schedule", count: 18, icon: Warehouse },
      { id: "carriers", label: "Carriers", count: 342, icon: Truck },
    ],
  },
  {
    id: "planning",
    label: "Planning",
    items: [
      { id: "lanes", label: "Lanes", count: 96, icon: Route },
      { id: "rates", label: "Rate cards", count: 14, icon: FileText },
      { id: "forecasts", label: "Forecasts", icon: ChartBar },
    ],
  },
];

const DEFAULT_VIEWS: LoadstarNavItem[] = [
  { id: "eu-uk-late", label: "EU → UK, running late", count: 23, filter: ["delayed"] },
  { id: "reefer", label: "Reefer over 48h", count: 5, filter: ["exception", "delayed"] },
  { id: "awaiting-pod", label: "Awaiting POD", count: 41, filter: ["on-time"] },
];

const DEFAULT_SHIPMENTS: LoadstarShipment[] = [
  {
    id: "SHP-48213",
    origin: "Rotterdam",
    destination: "Leeds",
    carrier: "Norlake Haulage",
    eta: "Oct 28, 14:20",
    status: "delayed",
    weight: "18.4 t",
  },
  {
    id: "SHP-48207",
    origin: "Antwerp",
    destination: "Lyon",
    carrier: "Brisa Transportes",
    eta: "Oct 27, 21:05",
    status: "on-time",
    weight: "22.1 t",
  },
  {
    id: "SHP-48199",
    origin: "Hamburg",
    destination: "Gdańsk",
    carrier: "Vistula Freight",
    eta: "Oct 28, 06:40",
    status: "exception",
    weight: "9.7 t",
  },
  {
    id: "SHP-48188",
    origin: "Le Havre",
    destination: "Madrid",
    carrier: "Brisa Transportes",
    eta: "Oct 29, 11:15",
    status: "on-time",
    weight: "24.0 t",
  },
  {
    id: "SHP-48176",
    origin: "Felixstowe",
    destination: "Dublin",
    carrier: "Norlake Haulage",
    eta: "Oct 27, 18:30",
    status: "delayed",
    weight: "12.2 t",
  },
  {
    id: "SHP-48164",
    origin: "Genoa",
    destination: "Munich",
    carrier: "Alpenroute",
    eta: "Oct 28, 09:50",
    status: "on-time",
    weight: "16.8 t",
  },
  {
    id: "SHP-48151",
    origin: "Valencia",
    destination: "Bordeaux",
    carrier: "Brisa Transportes",
    eta: "Oct 28, 17:35",
    status: "exception",
    weight: "7.3 t",
  },
  {
    id: "SHP-48142",
    origin: "Gdynia",
    destination: "Aarhus",
    carrier: "Vistula Freight",
    eta: "Oct 29, 08:00",
    status: "on-time",
    weight: "19.5 t",
  },
];

const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--iu-accent) focus-visible:outline-solid";
const FOCUS_INSET =
  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-(--iu-accent) focus-visible:outline-solid";
const ROW = "h-[calc(30px*var(--iu-density))] pointer-coarse:min-h-10";
const RADIUS = "rounded-[min(var(--iu-radius),6px)]";

const formatCount = (value: number) => value.toLocaleString("en-US");

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function StatusCell({ status }: { status: LoadstarShipment["status"] }) {
  if (status === "exception") {
    return (
      <span className="inline-flex items-center gap-1.5 text-red-700 dark:text-red-400">
        <TriangleAlert size={13} strokeWidth={1.75} aria-hidden={true} />
        Exception
      </span>
    );
  }
  if (status === "delayed") {
    return (
      <span className="inline-flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
        <Clock size={13} strokeWidth={1.75} aria-hidden={true} />
        Delayed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-(--iu-muted)">
      <Check size={13} strokeWidth={1.75} aria-hidden={true} />
      On time
    </span>
  );
}

type FlatItem = LoadstarNavItem & { sectionLabel: string };

function SidebarBody({
  workspace,
  region,
  sections,
  savedViews,
  currentId,
  loading,
  syncedLabel,
  markerId,
  onSelect,
  onSaveView,
}: {
  workspace: string;
  region: string;
  sections: LoadstarNavSection[];
  savedViews: LoadstarNavItem[];
  currentId: string;
  loading: boolean;
  syncedLabel: string;
  markerId: string;
  onSelect: (itemId: string) => void;
  onSaveView?: () => void;
}) {
  const baseId = useId();
  const [closed, setClosed] = useState<string[]>([]);
  const allSections = [...sections, { id: "views", label: "Saved views", items: savedViews }];

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-12 shrink-0 items-center gap-2.5 border-b border-(--iu-border) px-3">
        <span
          aria-hidden="true"
          className={`inline-flex size-6 items-center justify-center bg-(--iu-foreground) text-(--iu-background) ${RADIUS}`}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 10.5h10M3.5 10.5V5l3.5-2.5L10.5 5v5.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M5.5 10.5V7.5h3v3" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </span>
        <span className="min-w-0 leading-tight">
          <span className="block truncate text-[13px] font-semibold">{workspace}</span>
          <span className="block font-mono text-[11px] text-(--iu-muted)">{region}</span>
        </span>
      </div>

      <nav aria-label="Workspace" className="min-h-0 flex-1 [scrollbar-gutter:stable] overflow-y-auto px-2 py-2">
        {allSections.map((section) => {
          const open = !closed.includes(section.id);
          const listId = `${baseId}-${section.id}`;
          return (
            <div key={section.id} className="mb-2">
              <button
                type="button"
                aria-expanded={open}
                aria-controls={listId}
                onClick={() =>
                  setClosed((current) => (open ? [...current, section.id] : current.filter((id) => id !== section.id)))
                }
                className={`group flex w-full items-center gap-1 px-2 ${ROW} text-[11px] font-medium tracking-[0.06em] text-(--iu-muted) uppercase ${RADIUS} pointer-fine:hover:text-(--iu-foreground) ${FOCUS_INSET}`}
              >
                <ChevronRight
                  size={12}
                  strokeWidth={2}
                  aria-hidden={true}
                  className={`transition-transform duration-150 motion-reduce:transition-none ${open ? "rotate-90" : ""}`}
                />
                {section.label}
                {section.id === "views" ? (
                  <span className="ml-auto font-mono tabular-nums">{savedViews.length}</span>
                ) : null}
              </button>
              {open ? (
                <ul id={listId} className="mt-0.5">
                  {section.items.map((item) => {
                    const current = item.id === currentId;
                    const Icon = item.icon;
                    return (
                      <li key={item.id} className="relative">
                        {markerId === item.id ? (
                          <motion.span
                            layoutId={`${baseId}-marker`}
                            aria-hidden="true"
                            className={`absolute inset-0 bg-(--iu-foreground)/[0.07] dark:bg-(--iu-foreground)/10 ${RADIUS}`}
                          >
                            <span className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-(--iu-accent)" />
                          </motion.span>
                        ) : null}
                        <a
                          href={`#${item.id}`}
                          aria-current={current ? "page" : undefined}
                          onClick={(event) => {
                            event.preventDefault();
                            onSelect(item.id);
                          }}
                          className={`relative flex items-center gap-2.5 px-2 ${ROW} text-[13px] ${current ? "font-medium text-(--iu-foreground)" : "text-(--iu-muted)"} ${RADIUS} transition-colors duration-100 motion-reduce:transition-none pointer-fine:hover:bg-(--iu-foreground)/5 pointer-fine:hover:text-(--iu-foreground) ${FOCUS_INSET}`}
                        >
                          {Icon ? (
                            <Icon size={15} strokeWidth={1.5} aria-hidden={true} className="shrink-0" />
                          ) : (
                            <span aria-hidden="true" className="flex size-[15px] shrink-0 items-center justify-center">
                              <span className="size-1.5 rounded-[1px] border border-current" />
                            </span>
                          )}
                          <span className="min-w-0 flex-1 truncate">{item.label}</span>
                          {loading && item.count !== undefined ? (
                            <span aria-hidden="true" className="h-2.5 w-7 rounded-[2px] bg-(--iu-foreground)/10" />
                          ) : item.count !== undefined ? (
                            <span
                              className={`inline-flex items-center gap-1 font-mono text-[11px] tabular-nums ${item.tone === "warning" ? "text-amber-700 dark:text-amber-400" : ""}`}
                            >
                              {item.tone === "warning" ? <span className="sr-only">needs attention,</span> : null}
                              {formatCount(item.count)}
                            </span>
                          ) : null}
                        </a>
                      </li>
                    );
                  })}
                  {section.id === "views" && section.items.length === 0 ? (
                    <li className="px-2 py-2">
                      <p className="text-[12px] leading-snug text-pretty text-(--iu-muted)">
                        No saved views yet. Filter a list, then keep it here.
                      </p>
                      <button
                        type="button"
                        onClick={onSaveView}
                        className={`mt-2 inline-flex h-7 items-center gap-1.5 border border-(--iu-foreground)/35 px-2 text-[12px] font-medium pointer-coarse:min-h-10 ${RADIUS} pointer-fine:hover:bg-(--iu-foreground)/5 ${FOCUS}`}
                      >
                        <Plus size={13} strokeWidth={1.75} aria-hidden={true} />
                        Save current filters
                      </button>
                    </li>
                  ) : null}
                </ul>
              ) : null}
            </div>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-(--iu-border) px-2 py-2">
        <a
          href="#settings"
          onClick={(event) => {
            event.preventDefault();
            onSelect("settings");
          }}
          aria-current={currentId === "settings" ? "page" : undefined}
          className={`flex items-center gap-2.5 px-2 ${ROW} text-[13px] text-(--iu-muted) ${RADIUS} pointer-fine:hover:bg-(--iu-foreground)/5 pointer-fine:hover:text-(--iu-foreground) ${FOCUS_INSET}`}
        >
          <Settings size={15} strokeWidth={1.5} aria-hidden={true} />
          Settings
        </a>
        <p className="mt-1 flex items-center gap-2 px-2 font-mono text-[11px] text-(--iu-muted)">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
          {syncedLabel}
        </p>
      </div>
    </div>
  );
}

export function LoadstarAppNav({
  workspace = "Loadstar · EU Freight",
  region = "eu-west · 4 depots",
  sections = LOADSTAR_DEFAULT_SECTIONS,
  savedViews = DEFAULT_VIEWS,
  shipments = DEFAULT_SHIPMENTS,
  defaultLocation = { itemId: "shipments" },
  defaultCollapsed = false,
  status = "idle",
  syncedLabel = "Synced 12s ago",
  unreadNotifications = 3,
  userName = "Rosa Lindqvist",
  children,
  onNavigate,
  onSaveView,
  onClearFilters,
  onOpenNotifications,
  className = "",
}: LoadstarAppNavProps) {
  const reduceMotion = useReducedMotion();
  const baseId = useId();
  const sidebarId = `${baseId}-sidebar`;
  const loading = status === "loading";

  const [location, setLocation] = useState<LoadstarLocation>(defaultLocation);
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [peek, setPeek] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [crumbMenu, setCrumbMenu] = useState(false);
  const [query, setQuery] = useState("");
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [switcherIndex, setSwitcherIndex] = useState(0);
  const [mobileSearch, setMobileSearch] = useState(false);

  const switcherRef = useRef<HTMLInputElement>(null);
  const crumbButtonRef = useRef<HTMLButtonElement>(null);
  const crumbMenuRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const refocusCrumb = useRef(false);

  const flatItems: FlatItem[] = useMemo(
    () => [
      ...sections.flatMap((section) => section.items.map((item) => ({ ...item, sectionLabel: section.label }))),
      ...savedViews.map((item) => ({ ...item, sectionLabel: "Saved views" })),
      { id: "settings", label: "Settings", icon: Settings, sectionLabel: "Workspace" },
    ],
    [sections, savedViews],
  );
  const currentItem = flatItems.find((item) => item.id === location.itemId) ?? flatItems[0];
  const siblings = flatItems.filter((item) => item.sectionLabel === currentItem?.sectionLabel);

  const navigate = useCallback(
    (next: LoadstarLocation) => {
      setLocation(next);
      setDrawerOpen(false);
      setCrumbMenu(false);
      onNavigate?.(next);
    },
    [onNavigate],
  );

  // Quick switcher results: pages first, then shipments by id, lane or carrier.
  const needle = query.trim().toLowerCase();
  const pageResults = flatItems
    .filter((item) => !needle || item.label.toLowerCase().includes(needle))
    .slice(0, needle ? 4 : 5);
  const shipmentResults = needle
    ? shipments
        .filter((shipment) =>
          `${shipment.id} ${shipment.origin} ${shipment.destination} ${shipment.carrier}`
            .toLowerCase()
            .includes(needle),
        )
        .slice(0, 4)
    : shipments.slice(0, 3);
  const results = [
    ...pageResults.map((item) => ({ key: `page-${item.id}`, kind: "page" as const, item })),
    ...shipmentResults.map((shipment) => ({ key: `shp-${shipment.id}`, kind: "shipment" as const, shipment })),
  ];
  const activeResult = results[Math.min(switcherIndex, results.length - 1)];
  const resultId = (key: string) => `${baseId}-result-${key}`;

  function chooseResult(result: (typeof results)[number] | undefined) {
    if (!result) return;
    if (result.kind === "page") navigate({ itemId: result.item.id });
    else navigate({ itemId: "shipments", detail: result.shipment.id });
    setQuery("");
    setSwitcherOpen(false);
    setMobileSearch(false);
    switcherRef.current?.blur();
  }

  // Cmd/Ctrl+J or / focuses the switcher; [ toggles the sidebar.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const typing = !!target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
      if (((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "j") || (event.key === "/" && !typing)) {
        event.preventDefault();
        if (window.matchMedia("(max-width: 767px)").matches) setMobileSearch(true);
        setSwitcherOpen(true);
        requestAnimationFrame(() => switcherRef.current?.focus());
      } else if (event.key === "[" && !typing && !event.metaKey && !event.ctrlKey) {
        setCollapsed((value) => !value);
        setPeek(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!crumbMenu) return;
    const checked = crumbMenuRef.current?.querySelector<HTMLElement>('[aria-checked="true"]');
    (checked ?? crumbMenuRef.current?.querySelector<HTMLElement>("[role=menuitemradio]"))?.focus();
    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (!crumbMenuRef.current?.contains(target) && !crumbButtonRef.current?.contains(target)) setCrumbMenu(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [crumbMenu]);

  // The breadcrumb segment remounts with the new location; keep keyboard focus on it.
  useEffect(() => {
    if (!refocusCrumb.current) return;
    refocusCrumb.current = false;
    crumbButtonRef.current?.focus();
  }, [location]);

  useEffect(() => {
    if (!drawerOpen) return;
    drawerRef.current?.querySelector<HTMLElement>('[aria-current="page"]')?.focus();
  }, [drawerOpen]);

  function onCrumbMenuKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    const items = Array.from(crumbMenuRef.current?.querySelectorAll<HTMLElement>("[role=menuitemradio]") ?? []);
    const index = items.indexOf(document.activeElement as HTMLElement);
    const focusAt = (at: number) => items[(at + items.length) % items.length]?.focus();
    if (event.key === "ArrowDown") {
      event.preventDefault();
      focusAt(index + 1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      focusAt(index - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      focusAt(0);
    } else if (event.key === "End") {
      event.preventDefault();
      focusAt(items.length - 1);
    } else if (event.key === "Escape") {
      event.preventDefault();
      setCrumbMenu(false);
      crumbButtonRef.current?.focus();
    } else if (event.key === "Tab") {
      setCrumbMenu(false);
    }
  }

  function onSwitcherKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    const count = results.length;
    if (event.key === "ArrowDown" && count) {
      event.preventDefault();
      setSwitcherOpen(true);
      setSwitcherIndex((value) => (Math.min(value, count - 1) + 1) % count);
    } else if (event.key === "ArrowUp" && count) {
      event.preventDefault();
      setSwitcherIndex((value) => (Math.min(value, count - 1) - 1 + count) % count);
    } else if (event.key === "Enter") {
      event.preventDefault();
      chooseResult(activeResult);
    } else if (event.key === "Escape") {
      event.preventDefault();
      if (query) setQuery("");
      else {
        setSwitcherOpen(false);
        setMobileSearch(false);
        switcherRef.current?.blur();
      }
    }
  }

  function onDrawerKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      setDrawerOpen(false);
      menuButtonRef.current?.focus();
      return;
    }
    if (event.key !== "Tab") return;
    const items = Array.from(drawerRef.current?.querySelectorAll<HTMLElement>("a[href], button") ?? []);
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }

  const visibleRows = currentItem?.filter
    ? shipments.filter((shipment) => currentItem.filter?.includes(shipment.status))
    : shipments;
  const detailShipment = location.detail ? shipments.find((shipment) => shipment.id === location.detail) : undefined;

  const crumbs: { key: string; node: ReactNode }[] = [
    { key: "workspace", node: <span className="truncate text-(--iu-muted)">{workspace.split(" · ").pop()}</span> },
    {
      key: `section-${currentItem?.sectionLabel}`,
      node: <span className="text-(--iu-muted)">{currentItem?.sectionLabel}</span>,
    },
    {
      key: `item-${currentItem?.id}`,
      node: (
        <span className="relative">
          <button
            ref={crumbButtonRef}
            type="button"
            aria-haspopup="menu"
            aria-expanded={crumbMenu}
            aria-controls={crumbMenu ? `${baseId}-crumb-menu` : undefined}
            aria-current={location.detail ? undefined : "page"}
            onClick={() => setCrumbMenu((value) => !value)}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setCrumbMenu(true);
              }
            }}
            className={`-mx-1.5 inline-flex h-7 items-center gap-1 px-1.5 ${location.detail ? "text-(--iu-muted)" : "font-medium text-(--iu-foreground)"} ${RADIUS} pointer-coarse:min-h-10 pointer-fine:hover:bg-(--iu-foreground)/5 pointer-fine:hover:text-(--iu-foreground) ${FOCUS}`}
          >
            {currentItem?.label}
            <ChevronDown size={13} strokeWidth={1.75} aria-hidden={true} />
          </button>
          <AnimatePresence>
            {crumbMenu ? (
              <motion.div
                ref={crumbMenuRef}
                id={`${baseId}-crumb-menu`}
                role="menu"
                aria-label={`Switch within ${currentItem?.sectionLabel}`}
                onKeyDown={onCrumbMenuKeyDown}
                initial={{ opacity: 0, y: -2 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -2 }}
                className={`absolute top-full left-0 z-40 mt-1.5 w-56 origin-top-left border border-(--iu-border) bg-(--iu-surface) p-1 shadow-lg shadow-black/10 dark:border-(--iu-foreground)/15 dark:shadow-black/40 ${RADIUS}`}
              >
                {siblings.map((item) => {
                  const Icon = item.icon;
                  const checked = item.id === currentItem?.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="menuitemradio"
                      aria-checked={checked}
                      tabIndex={-1}
                      onClick={() => {
                        refocusCrumb.current = true;
                        navigate({ itemId: item.id });
                      }}
                      className={`flex w-full items-center gap-2.5 px-2 ${ROW} text-left text-[13px] ${RADIUS} focus-visible:bg-(--iu-foreground)/5 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-(--iu-accent) focus-visible:outline-solid pointer-fine:hover:bg-(--iu-foreground)/5`}
                    >
                      {Icon ? (
                        <Icon size={14} strokeWidth={1.5} aria-hidden={true} className="text-(--iu-muted)" />
                      ) : null}
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.count !== undefined ? (
                        <span className="font-mono text-[11px] text-(--iu-muted) tabular-nums">
                          {formatCount(item.count)}
                        </span>
                      ) : null}
                      <Check
                        size={13}
                        strokeWidth={2}
                        aria-hidden={true}
                        className={checked ? "text-(--iu-foreground)" : "invisible"}
                      />
                    </button>
                  );
                })}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </span>
      ),
    },
  ];
  if (location.detail) {
    crumbs.push({
      key: `detail-${location.detail}`,
      node: (
        <span aria-current="page" className="font-mono text-[12px] font-medium text-(--iu-foreground)">
          {location.detail}
        </span>
      ),
    });
  }

  const sidebarProps = {
    workspace,
    region,
    sections,
    savedViews,
    currentId: currentItem?.id ?? "",
    loading,
    syncedLabel,
    onSelect: (itemId: string) => navigate({ itemId }),
    onSaveView,
  };

  const switcher = (
    <div className={`relative ${mobileSearch ? "flex-1" : "hidden md:block"}`}>
      <Search
        size={14}
        strokeWidth={1.75}
        aria-hidden={true}
        className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-(--iu-muted)"
      />
      <input
        ref={switcherRef}
        type="text"
        role="combobox"
        aria-label="Quick switcher: jump to a page or shipment"
        aria-expanded={switcherOpen}
        aria-controls={`${baseId}-switcher`}
        aria-autocomplete="list"
        aria-activedescendant={switcherOpen && activeResult ? resultId(activeResult.key) : undefined}
        autoComplete="off"
        spellCheck={false}
        value={query}
        placeholder="Jump to page or SHP-…"
        onFocus={() => setSwitcherOpen(true)}
        onBlur={() => {
          setSwitcherOpen(false);
          setMobileSearch(false);
        }}
        onChange={(event) => {
          setQuery(event.target.value);
          setSwitcherIndex(0);
          setSwitcherOpen(true);
        }}
        onKeyDown={onSwitcherKeyDown}
        className={`h-8 w-full border border-(--iu-foreground)/25 bg-(--iu-background) pr-12 pl-8 text-[13px] outline-none placeholder:text-(--iu-muted) focus-visible:border-(--iu-accent) focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-(--iu-accent) focus-visible:outline-solid md:w-72 pointer-coarse:h-10 ${RADIUS}`}
      />
      <kbd className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 rounded-[3px] border border-(--iu-border) px-1 font-mono text-[10px] text-(--iu-muted)">
        ⌘J
      </kbd>
      {switcherOpen ? (
        <div
          id={`${baseId}-switcher`}
          role="listbox"
          aria-label="Jump to"
          onPointerDown={(event) => event.preventDefault()}
          className={`absolute top-full right-0 left-0 z-40 mt-1.5 max-h-[360px] overflow-y-auto border border-(--iu-border) bg-(--iu-surface) p-1 shadow-lg shadow-black/10 md:left-auto md:w-[400px] dark:border-(--iu-foreground)/15 dark:shadow-black/40 ${RADIUS}`}
        >
          {results.length === 0 ? (
            <p className="px-2 py-3 text-[13px] text-(--iu-muted)">No page or shipment matches “{query}”.</p>
          ) : null}
          {(["page", "shipment"] as const).map((kind) => {
            const group = results.filter((result) => result.kind === kind);
            if (group.length === 0) return null;
            return (
              <div key={kind} role="group" aria-labelledby={`${baseId}-switcher-${kind}`}>
                <div
                  id={`${baseId}-switcher-${kind}`}
                  className="px-2 pt-2 pb-1 text-[11px] font-medium tracking-[0.06em] text-(--iu-muted) uppercase"
                >
                  {kind === "page" ? "Pages" : "Shipments"}
                </div>
                {group.map((result) => {
                  const active = activeResult?.key === result.key;
                  return (
                    <div
                      key={result.key}
                      id={resultId(result.key)}
                      role="option"
                      aria-selected={active}
                      onPointerMove={() => setSwitcherIndex(results.indexOf(result))}
                      onClick={() => chooseResult(result)}
                      className={`flex cursor-default items-center gap-2.5 px-2 ${ROW} text-[13px] ${RADIUS} ${active ? "bg-(--iu-foreground)/[0.07] dark:bg-(--iu-foreground)/10" : ""}`}
                    >
                      {result.kind === "page" ? (
                        <>
                          <span className="flex-1 truncate">{result.item.label}</span>
                          <span className="text-[12px] text-(--iu-muted)">{result.item.sectionLabel}</span>
                        </>
                      ) : (
                        <>
                          <span className="font-mono text-[12px] tabular-nums">{result.shipment.id}</span>
                          <span className="min-w-0 flex-1 truncate text-(--iu-muted)">
                            {result.shipment.origin} → {result.shipment.destination}
                          </span>
                          <span className="hidden text-[12px] sm:inline">
                            <StatusCell status={result.shipment.status} />
                          </span>
                        </>
                      )}
                      {active ? <span className="sr-only">, press Enter to open</span> : null}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );

  return (
    <MotionConfig
      reducedMotion="user"
      transition={reduceMotion ? { duration: 0 } : { duration: 0.14, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <div
        className={`relative flex h-dvh min-h-[560px] overflow-hidden bg-(--iu-background) font-(family-name:--iu-font) text-(--iu-foreground) ${className}`}
      >
        {/* Desktop sidebar: in the layout when expanded, a floating peek layer when collapsed. */}
        <div
          className={`relative hidden shrink-0 transition-[width] duration-150 ease-out motion-reduce:transition-none lg:block ${collapsed ? "w-0" : "w-60"}`}
        >
          <aside
            id={sidebarId}
            aria-label="Sidebar"
            onPointerLeave={() => setPeek(false)}
            className={`absolute inset-y-0 left-0 z-30 w-60 border-r border-(--iu-border) bg-(--iu-surface) transition-[translate,box-shadow] duration-150 ease-out motion-reduce:transition-none dark:bg-(--iu-background) ${
              collapsed
                ? peek
                  ? "translate-x-0 shadow-lg shadow-black/15 dark:border-(--iu-foreground)/15"
                  : "invisible -translate-x-full"
                : ""
            }`}
          >
            <SidebarBody {...sidebarProps} markerId={currentItem?.id ?? ""} />
          </aside>
        </div>
        {collapsed && !peek ? (
          <div
            aria-hidden="true"
            onPointerEnter={(event) => {
              if (event.pointerType === "mouse") setPeek(true);
            }}
            className="absolute inset-y-0 left-0 z-20 hidden w-2 lg:block"
          />
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="relative flex h-12 shrink-0 items-center gap-2 border-b border-(--iu-border) px-2 sm:px-3">
            <button
              ref={menuButtonRef}
              type="button"
              aria-label="Open navigation"
              aria-haspopup="dialog"
              aria-expanded={drawerOpen}
              onClick={() => setDrawerOpen(true)}
              className={`inline-flex size-10 items-center justify-center text-(--iu-muted) lg:hidden ${RADIUS} ${FOCUS}`}
            >
              <Menu size={18} strokeWidth={1.5} aria-hidden={true} />
            </button>
            <button
              type="button"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={`${collapsed ? "Expand" : "Collapse"} sidebar ( [ )`}
              aria-expanded={!collapsed}
              aria-controls={sidebarId}
              onClick={() => {
                setCollapsed((value) => !value);
                setPeek(false);
              }}
              className={`hidden size-8 items-center justify-center text-(--iu-muted) lg:inline-flex ${RADIUS} pointer-fine:hover:bg-(--iu-foreground)/5 pointer-fine:hover:text-(--iu-foreground) ${FOCUS}`}
            >
              <PanelLeft size={16} strokeWidth={1.5} aria-hidden={true} />
            </button>

            {mobileSearch ? null : (
              <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
                <ol className="flex min-w-0 items-center gap-1.5 text-[13px]">
                  <AnimatePresence initial={false} mode="popLayout">
                    {crumbs.map((crumb, index) => (
                      <motion.li
                        key={crumb.key}
                        layout="position"
                        initial={{ opacity: 0, x: -4 }}
                        animate={{ opacity: 1, x: 0, transition: { delay: reduceMotion ? 0 : index * 0.04 } }}
                        exit={{ opacity: 0 }}
                        className={`flex min-w-0 items-center gap-1.5 ${index < crumbs.length - 2 ? "max-sm:hidden" : ""}`}
                      >
                        {index > 0 ? (
                          <span
                            aria-hidden="true"
                            className={`text-(--iu-foreground)/25 ${index === crumbs.length - 2 ? "max-sm:hidden" : ""}`}
                          >
                            /
                          </span>
                        ) : null}
                        {crumb.node}
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ol>
              </nav>
            )}

            <div className={`flex items-center gap-1.5 ${mobileSearch ? "flex-1" : "ml-auto"}`}>
              {switcher}
              {mobileSearch ? null : (
                <button
                  type="button"
                  aria-label="Quick switcher"
                  onClick={() => {
                    setMobileSearch(true);
                    setSwitcherOpen(true);
                    requestAnimationFrame(() => switcherRef.current?.focus());
                  }}
                  className={`inline-flex size-10 items-center justify-center text-(--iu-muted) md:hidden ${RADIUS} ${FOCUS}`}
                >
                  <Search size={17} strokeWidth={1.5} aria-hidden={true} />
                </button>
              )}
              <button
                type="button"
                aria-label={`Notifications, ${unreadNotifications} unread`}
                onClick={onOpenNotifications}
                className={`relative inline-flex size-10 items-center justify-center text-(--iu-muted) md:size-8 ${RADIUS} pointer-fine:hover:bg-(--iu-foreground)/5 pointer-fine:hover:text-(--iu-foreground) ${FOCUS} ${mobileSearch ? "max-md:hidden" : ""}`}
              >
                <Bell size={16} strokeWidth={1.5} aria-hidden={true} />
                {unreadNotifications > 0 ? (
                  <span
                    aria-hidden="true"
                    className="absolute top-1.5 right-1.5 min-w-3.5 rounded-full bg-(--iu-accent) px-0.5 font-mono text-[9px] leading-3.5 text-(--iu-accent-foreground) tabular-nums md:top-0.5 md:right-0.5"
                  >
                    {unreadNotifications}
                  </span>
                ) : null}
              </button>
              <span
                title={userName}
                className={`ml-1 hidden size-7 items-center justify-center rounded-full bg-(--iu-foreground)/10 text-[11px] font-semibold sm:inline-flex ${mobileSearch ? "max-md:hidden" : ""}`}
              >
                <span aria-hidden="true">{initials(userName)}</span>
                <span className="sr-only">Signed in as {userName}</span>
              </span>
            </div>
          </header>

          <main className="min-h-0 flex-1 [scrollbar-gutter:stable] overflow-y-auto">
            {children ?? (
              <div className="px-3 py-4 sm:px-5" aria-busy={loading || undefined}>
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h1 className="text-[17px] font-semibold tracking-[-0.01em]">
                    {detailShipment
                      ? `${detailShipment.id} · ${detailShipment.origin} → ${detailShipment.destination}`
                      : currentItem?.label}
                  </h1>
                  {!detailShipment && currentItem?.count !== undefined && !loading && visibleRows.length > 0 ? (
                    <span className="font-mono text-[12px] text-(--iu-muted) tabular-nums">
                      {formatCount(currentItem.count)} total · showing {visibleRows.length}
                    </span>
                  ) : null}
                </div>
                {detailShipment ? (
                  <dl className="mt-4 grid grid-cols-2 border-t border-l border-(--iu-border) text-[13px] sm:grid-cols-4">
                    {[
                      ["Carrier", detailShipment.carrier],
                      ["ETA", detailShipment.eta],
                      ["Weight", detailShipment.weight],
                    ].map(([label, value]) => (
                      <div key={label} className="border-r border-b border-(--iu-border) px-3 py-2.5">
                        <dt className="text-[11px] tracking-[0.06em] text-(--iu-muted) uppercase">{label}</dt>
                        <dd className="mt-1 font-mono tabular-nums">{value}</dd>
                      </div>
                    ))}
                    <div className="border-r border-b border-(--iu-border) px-3 py-2.5">
                      <dt className="text-[11px] tracking-[0.06em] text-(--iu-muted) uppercase">Status</dt>
                      <dd className="mt-1">
                        <StatusCell status={detailShipment.status} />
                      </dd>
                    </div>
                  </dl>
                ) : loading ? (
                  <div aria-hidden="true" className="mt-4 border-t border-(--iu-border)">
                    {[72, 58, 80, 64, 70, 52].map((width, row) => (
                      <div
                        key={row}
                        className="flex h-[calc(36px*var(--iu-density))] items-center gap-4 border-b border-(--iu-border)"
                      >
                        <span className="h-2.5 w-20 rounded-[2px] bg-(--iu-foreground)/10" />
                        <span
                          className="h-2.5 rounded-[2px] bg-(--iu-foreground)/10"
                          style={{ width: `${width / 3}%` }}
                        />
                        <span className="ml-auto h-2.5 w-16 rounded-[2px] bg-(--iu-foreground)/10" />
                      </div>
                    ))}
                    <span className="sr-only">Loading shipments</span>
                  </div>
                ) : visibleRows.length === 0 ? (
                  <div className="mt-4 flex flex-col items-start gap-3 border border-dashed border-(--iu-foreground)/25 px-5 py-8 sm:flex-row sm:items-center sm:gap-5">
                    <svg
                      aria-hidden="true"
                      width="56"
                      height="40"
                      viewBox="0 0 56 40"
                      fill="none"
                      className="text-(--iu-muted)"
                    >
                      <rect x="1" y="9" width="34" height="22" rx="2" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M35 15h10l8 8v8H35z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                      <circle
                        cx="12"
                        cy="33"
                        r="4"
                        fill="var(--iu-background)"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                      <circle
                        cx="44"
                        cy="33"
                        r="4"
                        fill="var(--iu-background)"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                      <path d="M9 20h18" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 3" />
                    </svg>
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-medium">No shipments in {currentItem?.label}.</p>
                      <p className="mt-0.5 text-[13px] text-pretty text-(--iu-muted)">
                        Nothing matches these filters right now. New loads appear here as carriers confirm them.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={onClearFilters}
                      className={`inline-flex h-8 items-center border border-(--iu-foreground)/35 px-3 text-[13px] font-medium pointer-coarse:min-h-10 ${RADIUS} pointer-fine:hover:bg-(--iu-foreground)/5 ${FOCUS}`}
                    >
                      Clear filters
                    </button>
                  </div>
                ) : (
                  <table className="mt-4 w-full table-fixed border-t border-(--iu-border) text-left text-[13px]">
                    <caption className="sr-only">{currentItem?.label}: latest shipments</caption>
                    <thead className="sticky top-0 bg-(--iu-background)">
                      <tr className="text-[11px] tracking-[0.06em] text-(--iu-muted) uppercase">
                        <th scope="col" className="w-[30%] py-2 pr-3 font-medium sm:w-[16%]">
                          Shipment
                        </th>
                        <th scope="col" className="py-2 pr-3 font-medium">
                          Lane
                        </th>
                        <th scope="col" className="hidden py-2 pr-3 font-medium xl:table-cell">
                          Carrier
                        </th>
                        <th scope="col" className="hidden w-[16%] py-2 pr-3 font-medium md:table-cell">
                          ETA
                        </th>
                        <th scope="col" className="w-[30%] py-2 pr-3 font-medium sm:w-[16%]">
                          Status
                        </th>
                        <th scope="col" className="hidden w-[10%] py-2 text-right font-medium sm:table-cell">
                          Weight
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleRows.map((shipment, row) => (
                        <tr
                          key={shipment.id}
                          className={`h-[calc(36px*var(--iu-density))] border-t border-(--iu-border) ${row % 2 === 1 ? "bg-(--iu-foreground)/[0.025]" : ""}`}
                        >
                          <td className="pr-3">
                            <a
                              href={`#${shipment.id}`}
                              onClick={(event) => {
                                event.preventDefault();
                                navigate({ itemId: "shipments", detail: shipment.id });
                              }}
                              className={`font-mono text-[12px] tabular-nums underline-offset-2 ${RADIUS} pointer-fine:hover:underline ${FOCUS}`}
                            >
                              {shipment.id}
                            </a>
                          </td>
                          <td className="truncate pr-3">
                            {shipment.origin} <span className="text-(--iu-muted)">→</span> {shipment.destination}
                          </td>
                          <td className="hidden truncate pr-3 text-(--iu-muted) xl:table-cell">{shipment.carrier}</td>
                          <td className="hidden pr-3 font-mono text-[12px] whitespace-nowrap text-(--iu-muted) tabular-nums md:table-cell">
                            {shipment.eta}
                          </td>
                          <td className="pr-3 text-[12px] whitespace-nowrap">
                            <StatusCell status={shipment.status} />
                          </td>
                          <td className="hidden text-right font-mono text-[12px] tabular-nums sm:table-cell">
                            {shipment.weight}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </main>
        </div>

        <AnimatePresence>
          {drawerOpen ? (
            <div className="fixed inset-0 z-50 lg:hidden">
              <motion.div
                aria-hidden="true"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                  setDrawerOpen(false);
                  menuButtonRef.current?.focus();
                }}
                className="absolute inset-0 bg-black/30 dark:bg-black/60"
              />
              <motion.div
                ref={drawerRef}
                role="dialog"
                aria-modal="true"
                aria-label="Navigation"
                onKeyDown={onDrawerKeyDown}
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                className="absolute inset-y-0 left-0 w-[min(300px,86vw)] border-r border-(--iu-border) bg-(--iu-surface) shadow-lg shadow-black/20 dark:border-(--iu-foreground)/15"
              >
                <button
                  type="button"
                  aria-label="Close navigation"
                  onClick={() => {
                    setDrawerOpen(false);
                    menuButtonRef.current?.focus();
                  }}
                  className={`absolute top-1 right-1 z-10 inline-flex size-10 items-center justify-center text-(--iu-muted) ${RADIUS} ${FOCUS}`}
                >
                  <X size={18} strokeWidth={1.5} aria-hidden={true} />
                </button>
                <SidebarBody {...sidebarProps} markerId={currentItem?.id ?? ""} />
              </motion.div>
            </div>
          ) : null}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}

export default LoadstarAppNav;
