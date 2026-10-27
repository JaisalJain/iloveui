"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FocusEvent as ReactFocusEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "motion/react";
import { ChevronLeft, ChevronRight, Menu, Search, User, X } from "lucide-react";

export type HesperArt = "bottle" | "candle" | "diffuser" | "set" | "tote" | "cardcase";

export type HesperPiece = {
  name: string;
  href: string;
  /** Collection and size, shown small under the name. */
  detail: string;
  price: string;
  art: HesperArt;
};

export type HesperColumn = { title: string; links: HesperPiece[] };

export type HesperMenu = { id: string; label: string; columns: HesperColumn[]; featured: HesperPiece };

export type HesperLink = { label: string; href: string };

export type HesperStorefrontNavProps = {
  brand?: string;
  brandHref?: string;
  announcement?: string;
  menus?: HesperMenu[];
  /** Top-level links without a panel; they sit around the menus in this order: first link, menus, the rest. */
  links?: HesperLink[];
  currentHref?: string;
  defaultOpenMenu?: string | null;
  bagCount?: number;
  /** Shown in search while the field is empty. */
  suggestions?: HesperPiece[];
  careLine?: string;
  onNavigate?: (href: string) => void;
  onSearch?: (query: string) => void;
  onOpenBag?: () => void;
  onOpenAccount?: () => void;
  className?: string;
};

const piece = (name: string, href: string, detail: string, price: string, art: HesperArt): HesperPiece => ({
  name,
  href,
  detail,
  price,
  art,
});

const VETIVER = piece("Vetiver Nocturne", "#vetiver-nocturne", "Eau de parfum · 100 ml", "€215", "bottle");
const TOTE = piece("The Market Tote", "#market-tote", "Vegetable-tanned calf", "€640", "tote");
const DISCOVERY = piece("Discovery set", "#discovery-set", "Six eaux de parfum · 6 × 2 ml", "€38", "set");

const DEFAULT_MENUS: HesperMenu[] = [
  {
    id: "fragrance",
    label: "Fragrance",
    columns: [
      {
        title: "Eaux de parfum",
        links: [
          VETIVER,
          piece("Fig & Cedar", "#fig-cedar", "Eau de parfum · 100 ml", "€215", "bottle"),
          piece("Salt Orris", "#salt-orris", "Eau de parfum · 50 ml", "€165", "bottle"),
          piece("Ambre Lent", "#ambre-lent", "Extrait · 50 ml", "€240", "bottle"),
        ],
      },
      {
        title: "For the home",
        links: [
          piece("Candles", "#candles", "Hand-poured · 60 hours", "from €78", "candle"),
          piece("Diffusers", "#diffusers", "Rattan reeds · 200 ml", "€96", "diffuser"),
          piece("Refills", "#refills", "Glass, returned and refilled", "from €54", "diffuser"),
        ],
      },
      {
        title: "Discover",
        links: [DISCOVERY, piece("Engraved flacons", "#engraving", "Initials, in store or online", "€25", "bottle")],
      },
    ],
    featured: VETIVER,
  },
  {
    id: "leather",
    label: "Leather",
    columns: [
      {
        title: "Bags",
        links: [
          TOTE,
          piece("Crossbody 22", "#crossbody", "Pebbled calf · 22 cm", "€520", "tote"),
          piece("Weekender", "#weekender", "Calf and waxed canvas", "€980", "tote"),
        ],
      },
      {
        title: "Small leather goods",
        links: [
          piece("Card case", "#card-case", "Saddle-stitched · 4 slots", "€145", "cardcase"),
          piece("Zip wallet", "#zip-wallet", "Calf · brass zip", "€260", "cardcase"),
          piece("Key ring", "#key-ring", "Bridle leather", "€70", "cardcase"),
        ],
      },
    ],
    featured: TOTE,
  },
];

const DEFAULT_LINKS: HesperLink[] = [
  { label: "New", href: "#new" },
  { label: "Home", href: "#home-objects" },
  { label: "Journal", href: "#journal" },
];

const FOCUS =
  "focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-(--iu-accent) focus-visible:outline-solid";
const LABEL = "text-[11px] font-medium tracking-[0.2em] uppercase";

function allPieces(menus: HesperMenu[]) {
  const seen = new Set<string>();
  return menus
    .flatMap((menu) => menu.columns.flatMap((column) => column.links))
    .filter((item) => (seen.has(item.href) ? false : (seen.add(item.href), true)));
}

/** Fine-line drawings of the pieces, drawn at 200 × 240. The accent is one line or mark per drawing. */
function Art({ art, className = "" }: { art: HesperArt; className?: string }) {
  const accent = "stroke-(--iu-accent)";
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1, vectorEffect: "non-scaling-stroke" as const };
  return (
    <svg viewBox="0 0 200 240" aria-hidden="true" className={className}>
      {art === "bottle" ? (
        <g {...common}>
          <rect x="82" y="28" width="36" height="30" />
          <path d="M82 40h36" />
          <rect x="92" y="58" width="16" height="12" />
          <rect x="52" y="70" width="96" height="140" rx="3" />
          <rect x="58" y="76" width="84" height="128" rx="2" />
          <path d="M58 112h84" className={accent} />
          <rect x="74" y="140" width="52" height="36" />
          <path d="M86 152h28M90 162h20" />
        </g>
      ) : null}
      {art === "candle" ? (
        <g {...common}>
          <path d="M100 74c-5-6-5-12 0-20 5 8 5 14 0 20Z" className={accent} />
          <path d="M100 74v14" />
          <path d="M54 92h92v108a10 10 0 0 1-10 10H64a10 10 0 0 1-10-10Z" />
          <ellipse cx="100" cy="92" rx="46" ry="6" />
          <rect x="70" y="132" width="60" height="40" />
          <path d="M82 146h36M88 156h24" />
        </g>
      ) : null}
      {art === "diffuser" ? (
        <g {...common}>
          <path d="M96 112 72 26M100 112V20M104 112l26-82" />
          <path d="M98 112 88 30" className={accent} />
          <rect x="88" y="112" width="24" height="14" />
          <rect x="58" y="126" width="84" height="84" rx="8" />
          <path d="M58 168h84" />
          <path d="M84 186h32" />
        </g>
      ) : null}
      {art === "set" ? (
        <g {...common}>
          {[44, 86, 128].map((x) => (
            <g key={x}>
              <rect x={x + 8} y="66" width="12" height="14" />
              <rect x={x} y="80" width="28" height="96" rx="2" />
              <path d={`M${x} 120h28`} />
            </g>
          ))}
          <rect x="28" y="176" width="144" height="26" />
          <path d="M36 189h128" className={accent} />
        </g>
      ) : null}
      {art === "tote" ? (
        <g {...common}>
          <path d="M70 104c0-58 60-58 60 0" />
          <path d="M78 104c0-46 44-46 44 0" />
          <path d="M40 104h120l12 106H28Z" />
          <path d="M44 114h112" className={accent} strokeDasharray="3 3" />
          <path d="M100 104v12" />
          <rect x="88" y="150" width="24" height="14" />
        </g>
      ) : null}
      {art === "cardcase" ? (
        <g {...common}>
          <rect x="56" y="70" width="88" height="56" rx="2" />
          <path d="M64 84h40M64 94h24" />
          <rect x="40" y="96" width="120" height="84" rx="4" />
          <rect x="46" y="102" width="108" height="72" rx="2" className={accent} strokeDasharray="3 3" />
          <path d="M40 138h120" />
        </g>
      ) : null}
    </svg>
  );
}

function Subject({ item, compact = false }: { item: HesperPiece; compact?: boolean }) {
  return (
    <figure className="flex h-full flex-col">
      <div
        className={`relative grid place-items-center overflow-hidden rounded-[min(var(--iu-radius),2px)] border border-(--iu-border) bg-(--iu-surface) ${compact ? "h-44" : "h-[300px]"}`}
      >
        <AnimatePresence initial={false} mode="popLayout">
          <motion.div
            key={item.art + item.name}
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
            className="text-(--iu-foreground)"
          >
            <Art art={item.art} className={compact ? "h-40 w-auto" : "h-64 w-auto"} />
          </motion.div>
        </AnimatePresence>
        <span aria-hidden="true" className={`absolute top-3 left-3 ${LABEL} text-(--iu-muted)`}>
          In focus
        </span>
      </div>
      <figcaption className="mt-4 flex items-baseline justify-between gap-4">
        <span className="min-w-0">
          <span className="block font-serif text-2xl leading-tight font-normal">{item.name}</span>
          <span className="mt-1 block text-[13px] text-(--iu-muted)">{item.detail}</span>
        </span>
        <span className="shrink-0 font-serif text-xl tabular-nums">{item.price}</span>
      </figcaption>
    </figure>
  );
}

function SearchBox({
  pieces,
  suggestions,
  onSearch,
  onFollow,
  wide = false,
  autoFocus = false,
}: {
  pieces: HesperPiece[];
  suggestions: HesperPiece[];
  onSearch?: (query: string) => void;
  onFollow: (href: string) => void;
  wide?: boolean;
  autoFocus?: boolean;
}) {
  const baseId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const needle = query.trim().toLowerCase();
  const results = needle
    ? pieces.filter((item) => `${item.name} ${item.detail}`.toLowerCase().includes(needle)).slice(0, 5)
    : suggestions;
  const current = results[Math.min(active, results.length - 1)];

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  function onKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" && results.length) {
      event.preventDefault();
      setOpen(true);
      setActive((value) => (Math.min(value, results.length - 1) + 1) % results.length);
    } else if (event.key === "ArrowUp" && results.length) {
      event.preventDefault();
      setActive((value) => (Math.min(value, results.length - 1) - 1 + results.length) % results.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (open && current) onFollow(current.href);
      else if (needle) onSearch?.(query.trim());
      setOpen(false);
    } else if (event.key === "Escape") {
      if (query) setQuery("");
      else setOpen(false);
    }
  }

  return (
    <div className={`relative ${wide ? "w-full" : ""}`}>
      <Search
        size={15}
        strokeWidth={1.25}
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-(--iu-muted)"
      />
      <input
        ref={inputRef}
        type="search"
        role="combobox"
        aria-label="Search Hesper"
        aria-expanded={open}
        aria-controls={`${baseId}-results`}
        aria-autocomplete="list"
        aria-activedescendant={open && current ? `${baseId}-${current.href}` : undefined}
        autoComplete="off"
        value={query}
        placeholder="Search"
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onChange={(event) => {
          setQuery(event.target.value);
          setActive(0);
          setOpen(true);
        }}
        onKeyDown={onKeyDown}
        className={`h-10 rounded-full border border-(--iu-foreground)/35 bg-transparent pr-4 pl-10 text-[13px] tracking-[0.02em] outline-none placeholder:text-(--iu-muted) focus-visible:border-(--iu-foreground) focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-(--iu-accent) focus-visible:outline-solid [&::-webkit-search-cancel-button]:hidden ${
          wide ? "w-full" : "w-40 transition-[width] duration-300 ease-out focus:w-64 motion-reduce:transition-none"
        }`}
      />
      {open ? (
        <div
          id={`${baseId}-results`}
          role="listbox"
          aria-label={needle ? "Pieces" : "Suggested pieces"}
          onPointerDown={(event) => event.preventDefault()}
          className={`absolute top-full z-50 mt-3 rounded-[min(var(--iu-radius),2px)] border border-(--iu-border) bg-(--iu-background) p-2 ${wide ? "inset-x-0" : "right-0 w-80"}`}
        >
          <p aria-hidden="true" className={`px-3 pt-2 pb-3 ${LABEL} text-(--iu-muted)`}>
            {needle ? `${results.length} ${results.length === 1 ? "piece" : "pieces"}` : "Often searched"}
          </p>
          {results.length === 0 ? (
            <p className="px-3 pb-3 text-[13px] leading-relaxed text-pretty text-(--iu-muted)">
              Nothing by that name. Try vetiver, tote or candle, or write to our client care.
            </p>
          ) : null}
          {results.map((item, index) => {
            const isActive = current?.href === item.href;
            return (
              <div
                key={item.href}
                id={`${baseId}-${item.href}`}
                role="option"
                aria-selected={isActive}
                onPointerMove={() => setActive(index)}
                onClick={() => {
                  onFollow(item.href);
                  setOpen(false);
                }}
                className={`flex cursor-default items-center gap-3 px-3 py-2 ${isActive ? "bg-(--iu-foreground)/5" : ""}`}
              >
                <span className="grid size-10 shrink-0 place-items-center border border-(--iu-border)">
                  <Art art={item.art} className="h-9 w-auto" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-serif text-[17px] leading-tight">{item.name}</span>
                  <span className="block truncate text-[12px] text-(--iu-muted)">{item.detail}</span>
                </span>
                <span className="font-serif text-[15px] tabular-nums">{item.price}</span>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function MobileDrawer({
  brand,
  menus,
  links,
  currentHref,
  pieces,
  suggestions,
  careLine,
  bagCount,
  focusSearch,
  onClose,
  onFollow,
  onSearch,
  onOpenBag,
  onOpenAccount,
}: {
  brand: string;
  menus: HesperMenu[];
  links: HesperLink[];
  currentHref?: string;
  pieces: HesperPiece[];
  suggestions: HesperPiece[];
  careLine: string;
  bagCount: number;
  focusSearch: boolean;
  onClose: () => void;
  onFollow: (href: string) => void;
  onSearch?: (query: string) => void;
  onOpenBag?: () => void;
  onOpenAccount?: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [level, setLevel] = useState<string | null>(null);
  const returnTo = useRef<string | null>(null);
  const menu = menus.find((candidate) => candidate.id === level) ?? null;

  useEffect(() => {
    if (focusSearch) return;
    const panel = panelRef.current;
    if (level) panel?.querySelector<HTMLElement>("[data-back]")?.focus();
    else if (returnTo.current) panel?.querySelector<HTMLElement>(`[data-level="${returnTo.current}"]`)?.focus();
    else panel?.querySelector<HTMLElement>("[data-drawer-item]")?.focus();
  }, [focusSearch, level]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  function onKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      if (level) setLevel(null);
      else onClose();
      return;
    }
    if (event.key !== "Tab") return;
    const items = Array.from(panelRef.current?.querySelectorAll<HTMLElement>("a[href], button, input") ?? []);
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

  const ordered: ({ kind: "link"; link: HesperLink } | { kind: "menu"; menu: HesperMenu })[] = [
    ...links.slice(0, 1).map((link) => ({ kind: "link" as const, link })),
    ...menus.map((item) => ({ kind: "menu" as const, menu: item })),
    ...links.slice(1).map((link) => ({ kind: "link" as const, link })),
  ];
  const itemClass = `flex min-h-14 w-full items-center justify-between py-2 text-left font-serif text-[30px] leading-tight font-normal ${FOCUS}`;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <motion.div
        aria-hidden="true"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 dark:bg-black/60"
      />
      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={`${brand} menu`}
        onKeyDown={onKeyDown}
        initial={{ x: "-100%" }}
        animate={{ x: 0 }}
        exit={{ x: "-100%" }}
        transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
        className="absolute inset-y-0 left-0 flex w-full max-w-[420px] flex-col overflow-hidden bg-(--iu-background)"
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-(--iu-border) px-5">
          <span className="font-serif text-xl tracking-[0.32em] uppercase">{brand}</span>
          <button
            type="button"
            aria-label="Close menu"
            onClick={onClose}
            className={`-mr-2 inline-flex size-10 items-center justify-center rounded-full ${FOCUS}`}
          >
            <X size={20} strokeWidth={1.25} aria-hidden="true" />
          </button>
        </div>
        <div className="shrink-0 px-5 pt-5">
          <SearchBox
            pieces={pieces}
            suggestions={suggestions}
            onSearch={onSearch}
            onFollow={onFollow}
            wide
            autoFocus={focusSearch}
          />
        </div>
        <div className="relative min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
          <AnimatePresence initial={false} mode="popLayout">
            {menu ? (
              <motion.nav
                key={menu.id}
                aria-label={menu.label}
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
                className="px-5 pt-4 pb-8"
              >
                <button
                  type="button"
                  data-back
                  onClick={() => setLevel(null)}
                  className={`-ml-1 inline-flex min-h-10 items-center gap-1 ${LABEL} text-(--iu-muted) ${FOCUS}`}
                >
                  <ChevronLeft size={16} strokeWidth={1.25} aria-hidden="true" />
                  All
                </button>
                <h2 className="mt-2 font-serif text-[40px] leading-none font-normal">{menu.label}</h2>
                {menu.columns.map((column) => (
                  <div key={column.title} className="mt-8">
                    <p className={`${LABEL} border-b border-(--iu-border) pb-2 text-(--iu-muted)`}>{column.title}</p>
                    <ul className="mt-1">
                      {column.links.map((link) => (
                        <li key={link.href}>
                          <a
                            href={link.href}
                            aria-current={link.href === currentHref ? "page" : undefined}
                            onClick={() => onFollow(link.href)}
                            className={`flex min-h-11 items-center justify-between gap-4 text-[15px] ${FOCUS}`}
                          >
                            <span className="flex items-center gap-2">
                              {link.href === currentHref ? (
                                <span aria-hidden="true" className="h-px w-3 bg-(--iu-accent)" />
                              ) : null}
                              {link.name}
                            </span>
                            <span className="font-serif text-[15px] text-(--iu-muted) tabular-nums">{link.price}</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                <div className="mt-10">
                  <Subject item={menu.featured} compact />
                </div>
              </motion.nav>
            ) : (
              <motion.nav
                key="root"
                aria-label="Main"
                initial={{ x: "-30%", opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: "-30%", opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
                className="px-5 pt-4 pb-8"
              >
                <ul>
                  {ordered.map((entry) =>
                    entry.kind === "menu" ? (
                      <li key={entry.menu.id} className="border-b border-(--iu-border)">
                        <button
                          type="button"
                          data-drawer-item
                          data-level={entry.menu.id}
                          onClick={() => {
                            returnTo.current = entry.menu.id;
                            setLevel(entry.menu.id);
                          }}
                          className={itemClass}
                        >
                          {entry.menu.label}
                          <ChevronRight size={20} strokeWidth={1} aria-hidden="true" className="text-(--iu-muted)" />
                        </button>
                      </li>
                    ) : (
                      <li key={entry.link.href} className="border-b border-(--iu-border)">
                        <a
                          href={entry.link.href}
                          data-drawer-item
                          aria-current={entry.link.href === currentHref ? "page" : undefined}
                          onClick={() => onFollow(entry.link.href)}
                          className={itemClass}
                        >
                          {entry.link.label}
                        </a>
                      </li>
                    ),
                  )}
                </ul>
              </motion.nav>
            )}
          </AnimatePresence>
        </div>
        <div className="flex shrink-0 items-center justify-between gap-4 border-t border-(--iu-border) px-5 py-4 text-[13px]">
          <span className="text-(--iu-muted)">{careLine}</span>
          <span className="flex items-center gap-1">
            <button
              type="button"
              onClick={onOpenAccount}
              aria-label="Account"
              className={`inline-flex size-10 items-center justify-center rounded-full ${FOCUS}`}
            >
              <User size={18} strokeWidth={1.25} aria-hidden="true" />
            </button>
            <button type="button" onClick={onOpenBag} className={`min-h-10 px-2 ${LABEL} ${FOCUS}`}>
              Bag ({bagCount})
            </button>
          </span>
        </div>
      </motion.div>
    </div>
  );
}

export function HesperStorefrontNav({
  brand = "Hesper",
  brandHref = "#maison",
  announcement = "Complimentary delivery over €250 · Engraving on every flacon",
  menus = DEFAULT_MENUS,
  links = DEFAULT_LINKS,
  currentHref = "#vetiver-nocturne",
  defaultOpenMenu = null,
  bagCount = 2,
  suggestions = [VETIVER, TOTE, DISCOVERY],
  careLine = "Client care · +33 1 84 88 20 40",
  onNavigate,
  onSearch,
  onOpenBag,
  onOpenAccount,
  className = "",
}: HesperStorefrontNavProps) {
  const reduceMotion = useReducedMotion();
  const baseId = useId();
  const panelId = `${baseId}-panel`;
  const headerRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [openId, setOpenId] = useState<string | null>(defaultOpenMenu);
  const [preview, setPreview] = useState<HesperPiece | null>(null);
  const [drawer, setDrawer] = useState<"menu" | "search" | null>(null);
  const pieces = allPieces(menus);
  const openMenu = menus.find((menu) => menu.id === openId) ?? null;
  const subject = preview ?? openMenu?.featured ?? null;

  const show = useCallback((id: string | null) => {
    if (timer.current) clearTimeout(timer.current);
    setOpenId(id);
    setPreview(null);
  }, []);
  const intend = (id: string | null, delay: number) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => show(id), delay);
  };

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  useEffect(() => {
    if (!openId) return;
    function onPointerDown(event: PointerEvent) {
      if (!headerRef.current?.contains(event.target as Node)) show(null);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [openId, show]);

  function follow(href: string) {
    show(null);
    setDrawer(null);
    onNavigate?.(href);
  }

  function closeDrawer() {
    setDrawer(null);
    menuButtonRef.current?.focus();
  }

  function panelLinks() {
    return Array.from(document.getElementById(panelId)?.querySelectorAll<HTMLElement>("a[href]") ?? []);
  }
  function topItems() {
    return Array.from(headerRef.current?.querySelectorAll<HTMLElement>("[data-top-item]") ?? []);
  }

  function onTopKeyDown(event: ReactKeyboardEvent<HTMLElement>, menuId: string | null) {
    const items = topItems();
    const index = items.indexOf(event.currentTarget);
    const move = (next: HTMLElement | undefined) => {
      if (!next) return;
      event.preventDefault();
      next.focus();
      if (openId) show(next.dataset.menuId ?? null);
    };
    if (event.key === "ArrowRight") move(items[(index + 1) % items.length]);
    else if (event.key === "ArrowLeft") move(items[(index - 1 + items.length) % items.length]);
    else if (event.key === "Home") move(items[0]);
    else if (event.key === "End") move(items[items.length - 1]);
    else if (event.key === "Escape" && openId) {
      event.preventDefault();
      show(null);
    } else if (menuId && (event.key === "ArrowDown" || (event.key === "Tab" && !event.shiftKey && openId === menuId))) {
      event.preventDefault();
      if (openId !== menuId) show(menuId);
      requestAnimationFrame(() => panelLinks()[0]?.focus());
    }
  }

  function onPanelKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    const items = panelLinks();
    const index = items.indexOf(document.activeElement as HTMLElement);
    const trigger = headerRef.current?.querySelector<HTMLElement>(`[data-menu-id="${openId}"]`);
    if (event.key === "Escape") {
      event.preventDefault();
      show(null);
      trigger?.focus();
    } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      items[(index + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length]?.focus();
    } else if (event.key === "Tab" && event.shiftKey && index === 0) {
      event.preventDefault();
      trigger?.focus();
    } else if (event.key === "Tab" && !event.shiftKey && index === items.length - 1) {
      const tops = topItems();
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

  const ordered: ({ kind: "link"; link: HesperLink } | { kind: "menu"; menu: HesperMenu })[] = [
    ...links.slice(0, 1).map((link) => ({ kind: "link" as const, link })),
    ...menus.map((menu) => ({ kind: "menu" as const, menu })),
    ...links.slice(1).map((link) => ({ kind: "link" as const, link })),
  ];
  const currentMenu = menus.find((menu) =>
    menu.columns.some((column) => column.links.some((link) => link.href === currentHref)),
  );
  const topClass = (active: boolean) =>
    `relative inline-flex h-10 items-center ${LABEL} transition-colors duration-300 motion-reduce:transition-none pointer-fine:hover:text-(--iu-foreground) ${active ? "text-(--iu-foreground)" : "text-(--iu-muted)"} ${FOCUS}`;

  return (
    <MotionConfig
      reducedMotion="user"
      transition={reduceMotion ? { duration: 0 } : { duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <header
        ref={headerRef}
        onBlur={onHeaderBlur}
        onPointerLeave={(event) => {
          if (event.pointerType === "mouse" && openId) intend(null, 220);
        }}
        className={`relative z-40 bg-(--iu-background) font-(family-name:--iu-font) text-(--iu-foreground) ${className}`}
      >
        <p className="border-b border-(--iu-border) px-5 py-2.5 text-center text-[11px] tracking-[0.16em] text-(--iu-muted) uppercase">
          {announcement}
        </p>
        <div className="mx-auto grid h-20 max-w-[1320px] grid-cols-[1fr_auto_1fr] items-center gap-4 px-5 sm:px-10">
          <div className="flex items-center">
            <button
              ref={menuButtonRef}
              type="button"
              aria-haspopup="dialog"
              aria-expanded={drawer !== null}
              onClick={() => setDrawer("menu")}
              className={`-ml-2 inline-flex min-h-10 items-center gap-2 rounded-full px-2 ${LABEL} lg:hidden ${FOCUS}`}
            >
              <Menu size={18} strokeWidth={1.25} aria-hidden="true" />
              <span className="max-sm:sr-only">Menu</span>
            </button>
            <nav aria-label="Main" className="hidden lg:block">
              <ul className="flex items-center gap-8">
                {ordered.map((entry) => {
                  if (entry.kind === "link") {
                    const current = entry.link.href === currentHref;
                    return (
                      <li key={entry.link.href}>
                        <a
                          href={entry.link.href}
                          data-top-item
                          aria-current={current ? "page" : undefined}
                          onClick={() => follow(entry.link.href)}
                          onPointerEnter={(event) => {
                            if (event.pointerType === "mouse" && openId) intend(null, 160);
                          }}
                          onKeyDown={(event) => onTopKeyDown(event, null)}
                          className={topClass(current)}
                        >
                          {entry.link.label}
                        </a>
                      </li>
                    );
                  }
                  const menu = entry.menu;
                  const open = openId === menu.id;
                  return (
                    <li key={menu.id}>
                      <button
                        type="button"
                        data-top-item
                        data-menu-id={menu.id}
                        aria-expanded={open}
                        aria-controls={open ? panelId : undefined}
                        onClick={() => show(open ? null : menu.id)}
                        onPointerEnter={(event) => {
                          if (event.pointerType === "mouse") intend(menu.id, openId ? 0 : 120);
                        }}
                        onKeyDown={(event) => onTopKeyDown(event, menu.id)}
                        className={topClass(open || currentMenu?.id === menu.id)}
                      >
                        {menu.label}
                        {currentMenu?.id === menu.id || open ? (
                          <span
                            aria-hidden="true"
                            className={`absolute -bottom-0.5 left-0 h-px bg-(--iu-accent) transition-[width] duration-300 motion-reduce:transition-none ${open ? "w-full" : "w-3"}`}
                          />
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>

          <a
            href={brandHref}
            onClick={() => follow(brandHref)}
            aria-label={`${brand}, home`}
            className={`justify-self-center px-1 font-serif text-[22px] leading-none font-normal tracking-[0.28em] uppercase sm:text-[30px] sm:tracking-[0.32em] ${FOCUS}`}
          >
            <span className="mr-[-0.28em] sm:mr-[-0.32em]">{brand}</span>
          </a>

          <div className="flex items-center justify-end gap-1 sm:gap-5">
            <div className="hidden lg:block">
              <SearchBox pieces={pieces} suggestions={suggestions} onSearch={onSearch} onFollow={follow} />
            </div>
            <button
              type="button"
              aria-label="Search"
              onClick={() => setDrawer("search")}
              className={`inline-flex size-10 items-center justify-center rounded-full lg:hidden ${FOCUS}`}
            >
              <Search size={18} strokeWidth={1.25} aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Account"
              onClick={onOpenAccount}
              className={`hidden size-10 items-center justify-center rounded-full sm:inline-flex ${FOCUS}`}
            >
              <User size={18} strokeWidth={1.25} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={onOpenBag}
              className={`-mr-2 min-h-10 rounded-full px-2 whitespace-nowrap ${LABEL} tabular-nums ${FOCUS}`}
            >
              Bag ({bagCount})
            </button>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {openMenu && subject ? (
            <motion.div
              key="panel"
              id={panelId}
              onKeyDown={onPanelKeyDown}
              onPointerEnter={() => {
                if (timer.current) clearTimeout(timer.current);
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-x-0 top-full hidden border-y border-(--iu-border) bg-(--iu-background) lg:block"
            >
              <div className="mx-auto grid max-w-[1320px] grid-cols-12 gap-x-8 px-10 pt-12 pb-14">
                <div className="col-span-7 grid grid-cols-3 gap-x-8">
                  {openMenu.columns.map((column) => (
                    <div key={column.title}>
                      <p className={`border-b border-(--iu-border) pb-3 ${LABEL} text-(--iu-muted)`}>{column.title}</p>
                      <ul className="mt-4 space-y-[calc(6px*var(--iu-density))]">
                        {column.links.map((link) => {
                          const current = link.href === currentHref;
                          const previewing = subject.href === link.href;
                          return (
                            <li key={link.href}>
                              <a
                                href={link.href}
                                aria-current={current ? "page" : undefined}
                                onClick={() => follow(link.href)}
                                onPointerEnter={() => setPreview(link)}
                                onFocus={() => setPreview(link)}
                                className={`group inline-flex min-h-8 items-center gap-2 text-[15px] transition-colors duration-300 motion-reduce:transition-none ${previewing ? "text-(--iu-foreground)" : "text-(--iu-muted)"} pointer-fine:hover:text-(--iu-foreground) ${FOCUS}`}
                              >
                                <span
                                  aria-hidden="true"
                                  className={`h-px bg-(--iu-accent) transition-[width] duration-300 motion-reduce:transition-none ${previewing ? "w-4" : "w-0"}`}
                                />
                                {link.name}
                                {current ? <span className="sr-only">(current page)</span> : null}
                              </a>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
                <div className="col-span-5 border-l border-(--iu-border) pl-8">
                  <a href={subject.href} onClick={() => follow(subject.href)} className={`block ${FOCUS}`}>
                    <Subject item={subject} />
                  </a>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <AnimatePresence>
          {drawer ? (
            <MobileDrawer
              brand={brand}
              menus={menus}
              links={links}
              currentHref={currentHref}
              pieces={pieces}
              suggestions={suggestions}
              careLine={careLine}
              bagCount={bagCount}
              focusSearch={drawer === "search"}
              onClose={closeDrawer}
              onFollow={follow}
              onSearch={onSearch}
              onOpenBag={onOpenBag}
              onOpenAccount={onOpenAccount}
            />
          ) : null}
        </AnimatePresence>
      </header>
    </MotionConfig>
  );
}

export default HesperStorefrontNav;
