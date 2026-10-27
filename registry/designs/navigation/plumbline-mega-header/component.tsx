"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FocusEvent as ReactFocusEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "motion/react";
import { ArrowRight, ChevronDown, Menu, X } from "lucide-react";

export type PlumblineLink = { label: string; href: string; description?: string };

export type PlumblineColumn = { title: string; links: PlumblineLink[] };

export type PlumblineFeatured = {
  kicker: string;
  title: string;
  description: string;
  href: string;
  /** Which miniature to draw: a spend chart against a budget line, one oversized figure, or a CLI session. */
  visual: "budget" | "figure" | "terminal";
  /** The oversized figure for the "figure" visual. */
  figure?: string;
  /** Lines of the CLI session for the "terminal" visual; lines starting with "$ " are commands. */
  lines?: string[];
};

export type PlumblineMenu = { id: string; label: string; columns: PlumblineColumn[]; featured: PlumblineFeatured };

export type PlumblineMegaHeaderProps = {
  brand?: string;
  brandHref?: string;
  menus?: PlumblineMenu[];
  /** Top-level links without a panel. */
  links?: PlumblineLink[];
  /** The href of the page the visitor is on; its section gets the marker and the link gets aria-current. */
  currentHref?: string;
  /** Open one menu on first render (by id), for demos and docs. */
  defaultOpenMenu?: string | null;
  statusLabel?: string;
  statusHref?: string;
  signInLabel?: string;
  signInHref?: string;
  ctaLabel?: string;
  ctaHref?: string;
  /** Called with the href whenever a link in the header is followed. */
  onNavigate?: (href: string) => void;
  className?: string;
};

const DEFAULT_MENUS: PlumblineMenu[] = [
  {
    id: "product",
    label: "Product",
    columns: [
      {
        title: "Observe",
        links: [
          { label: "Query monitor", href: "#query-monitor", description: "Every warehouse query, ranked by cost" },
          { label: "Lineage", href: "#lineage", description: "Trace a column from source to dashboard" },
          { label: "Alerts", href: "#alerts", description: "Page the owner before the bill lands" },
        ],
      },
      {
        title: "Control",
        links: [
          { label: "Query budgets", href: "#budgets", description: "Hard caps per team and per model" },
          { label: "Access policies", href: "#policies", description: "Row-level rules, written once" },
          { label: "Audit log", href: "#audit", description: "Who ran what, kept for 400 days" },
        ],
      },
      {
        title: "Connect",
        links: [
          { label: "Warehouses", href: "#warehouses", description: "Connected in under four minutes" },
          { label: "Orchestrators", href: "#orchestrators", description: "Costs tagged to the job that ran them" },
          { label: "Webhooks and API", href: "#api", description: "Stream every event to your stack" },
        ],
      },
    ],
    featured: {
      kicker: "New in 4.2",
      title: "Query budgets",
      description: "Cap spend per team. Plumbline pauses runaway jobs at 92% and tells the owner why.",
      href: "#budgets",
      visual: "budget",
    },
  },
  {
    id: "solutions",
    label: "Solutions",
    columns: [
      {
        title: "By team",
        links: [
          { label: "Data platform", href: "#platform", description: "One bill, split by owner" },
          { label: "Analytics engineering", href: "#analytics", description: "Catch the model that doubled" },
          { label: "Finance", href: "#finance", description: "Forecast warehouse spend by month" },
          { label: "Security", href: "#security", description: "Prove who touched customer data" },
        ],
      },
      {
        title: "By stage",
        links: [
          { label: "Startups", href: "#startups", description: "Free up to 2 TB scanned a month" },
          { label: "Scale-ups", href: "#scale-ups", description: "Budgets before the first surprise" },
          { label: "Enterprise", href: "#enterprise", description: "SSO, residency and a named engineer" },
          { label: "Public sector", href: "#public-sector", description: "Hosted in your region, audited yearly" },
        ],
      },
    ],
    featured: {
      kicker: "Case study",
      title: "How Northvale cut warehouse spend",
      description: "Forty analysts, one budget per squad, and a bill that fell for five straight months.",
      href: "#northvale",
      visual: "figure",
      figure: "31%",
    },
  },
  {
    id: "developers",
    label: "Developers",
    columns: [
      {
        title: "Build",
        links: [
          { label: "Documentation", href: "#docs", description: "Guides from install to policy" },
          { label: "API reference", href: "#reference", description: "REST and GraphQL, versioned" },
        ],
      },
      {
        title: "Follow",
        links: [
          { label: "Changelog", href: "#changelog", description: "Shipped every Tuesday" },
          { label: "Status", href: "#status", description: "Uptime by region, 90 days" },
        ],
      },
    ],
    featured: {
      kicker: "CLI",
      title: "Budgets from your terminal",
      description: "Set, check and lift caps without leaving the repo.",
      href: "#cli",
      visual: "terminal",
      lines: ["$ plumbline cap set growth 4200", "saved  alerts at 80% and 92%", "$ plumbline cap ls"],
    },
  },
];

const DEFAULT_LINKS: PlumblineLink[] = [
  { label: "Customers", href: "#customers" },
  { label: "Pricing", href: "#pricing" },
];

const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--iu-accent) focus-visible:outline-solid";

function pad(index: number) {
  return String(index + 1).padStart(2, "0");
}

function menuHasHref(menu: PlumblineMenu, href: string | undefined) {
  return !!href && menu.columns.some((column) => column.links.some((link) => link.href === href));
}

function focusables(container: HTMLElement | null) {
  if (!container) return [];
  return Array.from(container.querySelectorAll<HTMLElement>("a[href], button:not([disabled])"));
}

function Logo({ brand }: { brand: string }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M10 1v7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M10 8 15 13 10 19 5 13Z" fill="currentColor" />
      </svg>
      <span className="text-[17px] font-semibold tracking-[-0.03em]">{brand}</span>
    </span>
  );
}

function BudgetChart() {
  const weeks = [2.6, 3.1, 2.8, 3.4, 3.9, 3.5, 3.2, 3.0];
  const cap = 4.2;
  const height = 72;
  const scale = (value: number) => (value / 4.8) * height;
  return (
    <figure className="mt-5">
      <svg
        viewBox="0 0 224 84"
        className="h-auto w-full"
        role="img"
        aria-label="Weekly spend for eight weeks, every week under the $4,200 cap"
      >
        <line
          x1="0"
          x2="224"
          y1={height - scale(cap)}
          y2={height - scale(cap)}
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="3 3"
          className="text-(--iu-foreground)/45"
        />
        {weeks.map((value, index) => (
          <rect
            key={index}
            x={index * 28 + 4}
            y={height - scale(value)}
            width="18"
            height={scale(value)}
            className={index === 4 ? "fill-(--iu-foreground)" : "fill-(--iu-foreground)/18"}
          />
        ))}
        <line
          x1="0"
          x2="224"
          y1={height + 0.5}
          y2={height + 0.5}
          stroke="currentColor"
          strokeWidth="1"
          className="text-(--iu-border)"
        />
      </svg>
      <figcaption className="mt-2 flex justify-between font-mono text-[11px] text-(--iu-muted) tabular-nums">
        <span>Peak $3,900 · wk 38</span>
        <span>Cap $4,200</span>
      </figcaption>
    </figure>
  );
}

function FeaturedVisual({ featured }: { featured: PlumblineFeatured }) {
  if (featured.visual === "figure") {
    return (
      <p className="mt-4 flex items-baseline gap-1 text-[64px] leading-none font-semibold tracking-[-0.05em] tabular-nums">
        <span aria-hidden="true" className="text-[40px] tracking-normal">
          −
        </span>
        <span className="sr-only">down </span>
        {featured.figure}
      </p>
    );
  }
  if (featured.visual === "terminal") {
    return (
      <pre className="mt-5 overflow-hidden rounded-[min(var(--iu-radius),6px)] border border-(--iu-border) bg-(--iu-background) p-3 font-mono text-[11px] leading-[1.7] text-(--iu-muted)">
        {(featured.lines ?? []).map((line, index) => (
          <span key={index} className={`block truncate ${line.startsWith("$") ? "text-(--iu-foreground)" : ""}`}>
            {line}
          </span>
        ))}
      </pre>
    );
  }
  return <BudgetChart />;
}

// Content shifts 4px in the direction of travel, so moving right reads as moving right.
const PANEL_VARIANTS = {
  enter: (direction: number) => ({ opacity: 0, x: direction * 4 }),
  center: { opacity: 1, x: 0 },
  exit: (direction: number) => ({ opacity: 0, x: direction * -4 }),
};

function PanelContent({
  menu,
  currentHref,
  onFollow,
  direction,
}: {
  menu: PlumblineMenu;
  currentHref?: string;
  onFollow: (href: string) => void;
  direction: number;
}) {
  const columnSpan = menu.columns.length >= 3 ? "lg:col-span-3" : "lg:col-span-4";
  return (
    <motion.div
      variants={PANEL_VARIANTS}
      custom={direction}
      initial="enter"
      animate="center"
      exit="exit"
      className="mx-auto grid max-w-[1200px] grid-cols-12 gap-x-6 px-10 pt-8 pb-10"
    >
      {menu.columns.map((column, columnIndex) => (
        <div key={column.title} className={`col-span-12 ${columnSpan}`}>
          <p className="flex items-baseline gap-3 border-b border-(--iu-border) pb-3 text-[11px] font-medium tracking-[0.08em] text-(--iu-muted) uppercase">
            <span className="tabular-nums">{pad(columnIndex)}</span>
            {column.title}
          </p>
          <ul className="mt-2">
            {column.links.map((link) => {
              const current = link.href === currentHref;
              return (
                <li key={link.href}>
                  <a
                    href={link.href}
                    aria-current={current ? "page" : undefined}
                    onClick={() => onFollow(link.href)}
                    className={`group -mx-3 block rounded-[min(var(--iu-radius),6px)] px-3 py-[calc(10px*var(--iu-density))] transition-colors duration-150 motion-reduce:transition-none pointer-fine:hover:bg-(--iu-foreground)/5 ${FOCUS}`}
                  >
                    <span className="flex items-center gap-2 text-sm font-medium text-(--iu-foreground)">
                      {current ? <span aria-hidden="true" className="h-3.5 w-0.5 bg-(--iu-foreground)" /> : null}
                      {link.label}
                      {current ? (
                        <span className="text-[11px] font-normal tracking-[0.08em] text-(--iu-muted) uppercase">
                          You are here
                        </span>
                      ) : null}
                    </span>
                    {link.description ? (
                      <span className="mt-0.5 block text-[13px] text-(--iu-muted)">{link.description}</span>
                    ) : null}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      <div className="col-span-12 border-l border-(--iu-border) pl-6 lg:col-span-3 lg:col-start-10">
        <a
          href={menu.featured.href}
          onClick={() => onFollow(menu.featured.href)}
          className={`group block rounded-[min(var(--iu-radius),6px)] ${FOCUS}`}
        >
          <span className="block text-[11px] font-medium tracking-[0.08em] text-(--iu-muted) uppercase">
            {menu.featured.kicker}
          </span>
          <span className="mt-3 block text-lg leading-snug font-semibold tracking-[-0.02em] text-balance">
            {menu.featured.title}
          </span>
          <span className="mt-1.5 block text-[13px] leading-relaxed text-pretty text-(--iu-muted)">
            {menu.featured.description}
          </span>
          <FeaturedVisual featured={menu.featured} />
          <span className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-medium">
            Read more
            <ArrowRight
              size={14}
              strokeWidth={1.5}
              aria-hidden="true"
              className="transition-transform duration-150 motion-reduce:transition-none pointer-fine:group-hover:translate-x-0.5"
            />
          </span>
        </a>
      </div>
    </motion.div>
  );
}

function MobileSheet({
  brand,
  menus,
  links,
  currentHref,
  statusLabel,
  signInLabel,
  signInHref,
  ctaLabel,
  ctaHref,
  onClose,
  onFollow,
}: {
  brand: string;
  menus: PlumblineMenu[];
  links: PlumblineLink[];
  currentHref?: string;
  statusLabel: string;
  signInLabel: string;
  signInHref: string;
  ctaLabel: string;
  ctaHref: string;
  onClose: () => void;
  onFollow: (href: string) => void;
}) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const baseId = useId();
  const [expanded, setExpanded] = useState<string | null>(
    () => menus.find((menu) => menuHasHref(menu, currentHref))?.id ?? null,
  );

  useEffect(() => {
    const sheet = sheetRef.current;
    const first = sheet?.querySelector<HTMLElement>("[data-sheet-item]");
    first?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  function onKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== "Tab") return;
    const items = focusables(sheetRef.current);
    const first = items[0];
    const last = items[items.length - 1];
    if (!first || !last) return;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  const rows: { key: string; node: ReactNode }[] = [];
  menus.forEach((menu, index) => {
    const open = expanded === menu.id;
    const current = menuHasHref(menu, currentHref);
    const regionId = `${baseId}-${menu.id}`;
    rows.push({
      key: menu.id,
      node: (
        <>
          <button
            type="button"
            data-sheet-item
            aria-expanded={open}
            aria-controls={open ? regionId : undefined}
            onClick={() => setExpanded(open ? null : menu.id)}
            className={`relative flex min-h-14 w-full items-center gap-4 py-3 text-left ${FOCUS}`}
          >
            {current ? (
              <span
                aria-hidden="true"
                className="absolute top-1/2 -left-6 h-6 w-0.5 -translate-y-1/2 bg-(--iu-accent)"
              />
            ) : null}
            <span className="w-6 text-[11px] font-medium text-(--iu-muted) tabular-nums">{pad(index)}</span>
            <span className="flex-1 text-[28px] leading-tight font-semibold tracking-[-0.035em]">{menu.label}</span>
            <ChevronDown
              size={20}
              strokeWidth={1.5}
              aria-hidden="true"
              className={`text-(--iu-muted) transition-transform duration-200 motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
            />
          </button>
          <AnimatePresence initial={false}>
            {open ? (
              <motion.div
                id={regionId}
                role="region"
                aria-label={menu.label}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 gap-x-6 gap-y-5 pt-1 pb-6 pl-10 min-[480px]:grid-cols-2">
                  {menu.columns.map((column) => (
                    <div key={column.title}>
                      <p className="text-[11px] font-medium tracking-[0.08em] text-(--iu-muted) uppercase">
                        {column.title}
                      </p>
                      <ul className="mt-1">
                        {column.links.map((link) => (
                          <li key={link.href}>
                            <a
                              href={link.href}
                              aria-current={link.href === currentHref ? "page" : undefined}
                              onClick={() => onFollow(link.href)}
                              className={`flex min-h-10 items-center gap-2 text-base ${link.href === currentHref ? "font-semibold" : ""} ${FOCUS}`}
                            >
                              {link.label}
                              {link.href === currentHref ? (
                                <span className="text-[11px] font-normal tracking-[0.08em] text-(--iu-muted) uppercase">
                                  You are here
                                </span>
                              ) : null}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </>
      ),
    });
  });
  links.forEach((link, index) => {
    const current = link.href === currentHref;
    rows.push({
      key: link.href,
      node: (
        <a
          href={link.href}
          data-sheet-item
          aria-current={current ? "page" : undefined}
          onClick={() => onFollow(link.href)}
          className={`relative flex min-h-14 items-center gap-4 py-3 ${FOCUS}`}
        >
          {current ? (
            <span aria-hidden="true" className="absolute top-1/2 -left-6 h-6 w-0.5 -translate-y-1/2 bg-(--iu-accent)" />
          ) : null}
          <span className="w-6 text-[11px] font-medium text-(--iu-muted) tabular-nums">
            {pad(menus.length + index)}
          </span>
          <span className="text-[28px] leading-tight font-semibold tracking-[-0.035em]">{link.label}</span>
        </a>
      ),
    });
  });

  return (
    <motion.div
      ref={sheetRef}
      role="dialog"
      aria-modal="true"
      aria-label={`${brand} menu`}
      onKeyDown={onKeyDown}
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      className="fixed inset-0 z-50 flex [scrollbar-gutter:stable] flex-col overflow-y-auto bg-(--iu-background) lg:hidden"
    >
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-(--iu-border) px-6">
        <Logo brand={brand} />
        <button
          type="button"
          aria-label="Close menu"
          onClick={onClose}
          className={`-mr-2 inline-flex size-10 items-center justify-center rounded-[min(var(--iu-radius),6px)] ${FOCUS}`}
        >
          <X size={20} strokeWidth={1.5} aria-hidden="true" />
        </button>
      </div>
      <nav aria-label="Main" className="flex-1 px-6">
        <p className="flex justify-between border-b border-(--iu-border) py-3 text-[11px] font-medium tracking-[0.08em] text-(--iu-muted) uppercase">
          <span>Menu</span>
          <span className="tabular-nums">{pad(rows.length - 1)} sections</span>
        </p>
        <ul>
          {rows.map((row) => (
            <li key={row.key} className="border-b border-(--iu-border)">
              {row.node}
            </li>
          ))}
        </ul>
      </nav>
      <div className="sticky bottom-0 border-t border-(--iu-border) bg-(--iu-background) px-6 pt-4 pb-6">
        <p className="flex items-center gap-2 text-[13px] text-(--iu-muted)">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
          {statusLabel}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <a
            href={signInHref}
            onClick={() => onFollow(signInHref)}
            className={`inline-flex h-11 items-center justify-center rounded-[min(var(--iu-radius),6px)] border border-(--iu-foreground)/35 text-sm font-medium ${FOCUS}`}
          >
            {signInLabel}
          </a>
          <a
            href={ctaHref}
            onClick={() => onFollow(ctaHref)}
            className={`inline-flex h-11 items-center justify-center rounded-[min(var(--iu-radius),6px)] bg-(--iu-foreground) text-sm font-medium text-(--iu-background) ${FOCUS}`}
          >
            {ctaLabel}
          </a>
        </div>
      </div>
    </motion.div>
  );
}

export function PlumblineMegaHeader({
  brand = "Plumbline",
  brandHref = "#home",
  menus = DEFAULT_MENUS,
  links = DEFAULT_LINKS,
  currentHref = "#alerts",
  defaultOpenMenu = null,
  statusLabel = "All systems normal · 99.98% uptime",
  statusHref = "#status",
  signInLabel = "Sign in",
  signInHref = "#sign-in",
  ctaLabel = "Start free",
  ctaHref = "#start",
  onNavigate,
  className = "",
}: PlumblineMegaHeaderProps) {
  const reduceMotion = useReducedMotion();
  const baseId = useId();
  const panelId = `${baseId}-panel`;
  const headerRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const focusPanelOnOpen = useRef(false);

  const [openId, setOpenId] = useState<string | null>(defaultOpenMenu);
  const [direction, setDirection] = useState(0);
  const [panelHeight, setPanelHeight] = useState<number | "auto">("auto");
  const [mobileOpen, setMobileOpen] = useState(false);

  const openMenu = menus.find((menu) => menu.id === openId) ?? null;
  const currentMenuId = menus.find((menu) => menuHasHref(menu, currentHref))?.id ?? null;
  const markerId = openId ?? currentMenuId ?? (links.some((link) => link.href === currentHref) ? currentHref : null);

  const clearTimer = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, []);

  const openIdRef = useRef(openId);
  const show = useCallback(
    (id: string | null) => {
      clearTimer();
      const previous = openIdRef.current;
      if (previous === id) return;
      const from = menus.findIndex((menu) => menu.id === previous);
      const to = menus.findIndex((menu) => menu.id === id);
      setDirection(previous && id ? Math.sign(to - from) : 0);
      openIdRef.current = id;
      setOpenId(id);
    },
    [clearTimer, menus],
  );

  function follow(href: string) {
    show(null);
    setMobileOpen(false);
    onNavigate?.(href);
  }

  // The panel follows its content's height so moving between sections morphs instead of jumping.
  useEffect(() => {
    const content = contentRef.current;
    if (!content || !openId) return;
    const observer = new ResizeObserver(() => setPanelHeight(content.getBoundingClientRect().height));
    observer.observe(content);
    return () => observer.disconnect();
  }, [openId]);

  useEffect(() => {
    if (!openId) return;
    if (focusPanelOnOpen.current) {
      focusPanelOnOpen.current = false;
      focusables(document.getElementById(panelId))[0]?.focus();
    }
    function onPointerDown(event: PointerEvent) {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) show(null);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [openId, panelId, show]);

  useEffect(() => clearTimer, [clearTimer]);

  useEffect(() => {
    if (!mobileOpen) return;
    const query = window.matchMedia("(min-width: 1024px)");
    function onChange() {
      if (query.matches) setMobileOpen(false);
    }
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, [mobileOpen]);

  function closeMobile() {
    setMobileOpen(false);
    menuButtonRef.current?.focus();
  }

  function topLevelItems() {
    return Array.from(headerRef.current?.querySelectorAll<HTMLElement>("[data-top-item]") ?? []);
  }

  function onTopKeyDown(event: ReactKeyboardEvent<HTMLElement>, menuId: string | null) {
    const items = topLevelItems();
    const index = items.indexOf(event.currentTarget);
    const moveTo = (next: HTMLElement | undefined) => {
      if (!next) return;
      event.preventDefault();
      next.focus();
      if (openId) show(next.dataset.menuId ?? null);
    };
    switch (event.key) {
      case "ArrowRight":
        moveTo(items[(index + 1) % items.length]);
        break;
      case "ArrowLeft":
        moveTo(items[(index - 1 + items.length) % items.length]);
        break;
      case "Home":
        moveTo(items[0]);
        break;
      case "End":
        moveTo(items[items.length - 1]);
        break;
      case "ArrowDown":
        if (menuId) {
          event.preventDefault();
          if (openId === menuId) focusables(document.getElementById(panelId))[0]?.focus();
          else {
            focusPanelOnOpen.current = true;
            show(menuId);
          }
        }
        break;
      case "Escape":
        if (openId) {
          event.preventDefault();
          show(null);
        }
        break;
      case "Tab":
        // Tab from an open trigger continues into its panel, as if the panel followed the button.
        if (menuId && openId === menuId && !event.shiftKey) {
          const first = focusables(document.getElementById(panelId))[0];
          if (first) {
            event.preventDefault();
            first.focus();
          }
        }
        break;
    }
  }

  function onPanelKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    const items = focusables(document.getElementById(panelId));
    const index = items.indexOf(document.activeElement as HTMLElement);
    const trigger = headerRef.current?.querySelector<HTMLElement>(`[data-menu-id="${openId}"]`);
    if (event.key === "Escape") {
      event.preventDefault();
      show(null);
      trigger?.focus();
    } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      items[(index + step + items.length) % items.length]?.focus();
    } else if (event.key === "Tab" && event.shiftKey && index === 0) {
      event.preventDefault();
      trigger?.focus();
    } else if (event.key === "Tab" && !event.shiftKey && index === items.length - 1) {
      const tops = topLevelItems();
      const next = trigger ? tops[tops.indexOf(trigger) + 1] : undefined;
      if (next) {
        event.preventDefault();
        show(null);
        next.focus();
      }
    }
  }

  function onHeaderBlur(event: ReactFocusEvent<HTMLElement>) {
    if (openId && !event.currentTarget.contains(event.relatedTarget as Node | null)) show(null);
  }

  function intend(id: string | null, delay: number) {
    clearTimer();
    timer.current = setTimeout(() => show(id), delay);
  }

  return (
    <MotionConfig
      reducedMotion="user"
      transition={reduceMotion ? { duration: 0 } : { duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <header
        ref={headerRef}
        onBlur={onHeaderBlur}
        onPointerLeave={(event) => {
          if (event.pointerType === "mouse" && openId) intend(null, 180);
        }}
        className={`sticky top-0 z-40 border-b border-(--iu-border) bg-(--iu-background) font-(family-name:--iu-font) text-(--iu-foreground) ${className}`}
      >
        <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-8 px-6 sm:px-10">
          <a
            href={brandHref}
            aria-label={`${brand} home`}
            onClick={() => follow(brandHref)}
            className={`-m-1 rounded-[min(var(--iu-radius),6px)] p-1 ${FOCUS}`}
          >
            <Logo brand={brand} />
          </a>

          <nav aria-label="Main" className="hidden h-full lg:block">
            <ul className="flex h-full items-center">
              {menus.map((menu) => {
                const open = openId === menu.id;
                return (
                  <li key={menu.id} className="relative flex h-full items-center">
                    <button
                      type="button"
                      data-top-item
                      data-menu-id={menu.id}
                      aria-expanded={open}
                      aria-controls={open ? panelId : undefined}
                      onClick={() => show(open ? null : menu.id)}
                      onPointerEnter={(event) => {
                        if (event.pointerType === "mouse") intend(menu.id, openId ? 0 : 90);
                      }}
                      onKeyDown={(event) => onTopKeyDown(event, menu.id)}
                      className={`inline-flex h-9 items-center gap-1 rounded-[min(var(--iu-radius),6px)] px-3 text-sm font-medium transition-colors duration-150 motion-reduce:transition-none pointer-fine:hover:text-(--iu-foreground) ${open || currentMenuId === menu.id ? "text-(--iu-foreground)" : "text-(--iu-muted)"} ${FOCUS}`}
                    >
                      {menu.label}
                      <ChevronDown
                        size={14}
                        strokeWidth={1.5}
                        aria-hidden="true"
                        className={`transition-transform duration-150 motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
                      />
                    </button>
                    {markerId === menu.id ? (
                      <motion.span
                        layoutId={`${baseId}-marker`}
                        aria-hidden="true"
                        className="absolute inset-x-3 -bottom-px h-0.5 bg-(--iu-accent)"
                      />
                    ) : null}
                  </li>
                );
              })}
              {links.map((link) => {
                const current = link.href === currentHref;
                return (
                  <li key={link.href} className="relative flex h-full items-center">
                    <a
                      href={link.href}
                      data-top-item
                      aria-current={current ? "page" : undefined}
                      onClick={() => follow(link.href)}
                      onPointerEnter={(event) => {
                        if (event.pointerType === "mouse" && openId) intend(null, 120);
                      }}
                      onKeyDown={(event) => onTopKeyDown(event, null)}
                      className={`inline-flex h-9 items-center rounded-[min(var(--iu-radius),6px)] px-3 text-sm font-medium transition-colors duration-150 motion-reduce:transition-none pointer-fine:hover:text-(--iu-foreground) ${current ? "text-(--iu-foreground)" : "text-(--iu-muted)"} ${FOCUS}`}
                    >
                      {link.label}
                    </a>
                    {markerId === link.href ? (
                      <motion.span
                        layoutId={`${baseId}-marker`}
                        aria-hidden="true"
                        className="absolute inset-x-3 -bottom-px h-0.5 bg-(--iu-accent)"
                      />
                    ) : null}
                  </li>
                );
              })}
            </ul>

            <AnimatePresence initial={false}>
              {openMenu ? (
                <motion.div
                  key="scrim"
                  aria-hidden="true"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="pointer-events-none fixed inset-x-0 top-16 bottom-0 -z-10 bg-black/10 dark:bg-black/50"
                />
              ) : null}
            </AnimatePresence>
            <AnimatePresence initial={false}>
              {openMenu ? (
                <motion.div
                  key="panel"
                  id={panelId}
                  onKeyDown={onPanelKeyDown}
                  onPointerEnter={clearTimer}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute inset-x-0 top-full mt-px"
                >
                  <motion.div
                    initial={false}
                    animate={{ height: panelHeight }}
                    className="relative overflow-hidden border-b border-(--iu-border) bg-(--iu-background)"
                  >
                    <div ref={contentRef} className="relative">
                      <AnimatePresence initial={false} mode="popLayout" custom={direction}>
                        <PanelContent
                          key={openMenu.id}
                          menu={openMenu}
                          currentHref={currentHref}
                          onFollow={follow}
                          direction={direction}
                        />
                      </AnimatePresence>
                    </div>
                  </motion.div>
                  <div className="border-b border-(--iu-border) bg-(--iu-background)">
                    <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-6 px-10 py-3 text-[13px] text-(--iu-muted)">
                      <a
                        href={statusHref}
                        onClick={() => follow(statusHref)}
                        className={`inline-flex items-center gap-2 rounded-[min(var(--iu-radius),6px)] pointer-fine:hover:text-(--iu-foreground) ${FOCUS}`}
                      >
                        <span aria-hidden="true" className="size-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                        {statusLabel}
                      </a>
                      <span className="font-mono text-[11px] tabular-nums">
                        Esc to close · ← → to move between sections
                      </span>
                    </div>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </nav>

          <div className="ml-auto flex items-center gap-2 sm:gap-4">
            <a
              href={signInHref}
              onClick={() => follow(signInHref)}
              className={`hidden h-9 items-center rounded-[min(var(--iu-radius),6px)] px-3 text-sm font-medium text-(--iu-muted) transition-colors duration-150 motion-reduce:transition-none sm:inline-flex pointer-fine:hover:text-(--iu-foreground) ${FOCUS}`}
            >
              {signInLabel}
            </a>
            <a
              href={ctaHref}
              onClick={() => follow(ctaHref)}
              className={`inline-flex h-10 items-center gap-2 rounded-[min(var(--iu-radius),6px)] bg-(--iu-foreground) px-4 text-sm font-medium text-(--iu-background) transition-colors duration-150 motion-reduce:transition-none lg:h-9 pointer-fine:hover:bg-[color-mix(in_oklab,var(--iu-foreground)_84%,var(--iu-background))] ${FOCUS}`}
            >
              {ctaLabel}
            </a>
            <button
              ref={menuButtonRef}
              type="button"
              aria-label="Open menu"
              aria-haspopup="dialog"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen(true)}
              className={`-mr-2 inline-flex size-10 items-center justify-center rounded-[min(var(--iu-radius),6px)] lg:hidden ${FOCUS}`}
            >
              <Menu size={20} strokeWidth={1.5} aria-hidden="true" />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileOpen ? (
            <MobileSheet
              brand={brand}
              menus={menus}
              links={links}
              currentHref={currentHref}
              statusLabel={statusLabel}
              signInLabel={signInLabel}
              signInHref={signInHref}
              ctaLabel={ctaLabel}
              ctaHref={ctaHref}
              onClose={closeMobile}
              onFollow={follow}
            />
          ) : null}
        </AnimatePresence>
      </header>
    </MotionConfig>
  );
}

export default PlumblineMegaHeader;
