"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type FocusEvent as ReactFocusEvent,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "motion/react";
import { ArrowRight, Check, ChevronDown, CircleAlert, Menu, ShoppingBag, User, X } from "lucide-react";

export type VaurelArt = "pen" | "pocket" | "ink" | "cahier" | "nib" | "converter";

export type VaurelNib = {
  id: string;
  /** Short grade printed on the selector, such as EF or M. */
  grade: string;
  name: string;
  /** Line width in millimetres. */
  widthMm: number;
  note: string;
};

export type VaurelPiece = {
  id: string;
  kind: string;
  name: string;
  detail: string;
  price: string;
  href: string;
  art: VaurelArt;
  /** Units in stock; 0 is sold out. */
  stock: number;
  /** Shown when stock is 0. */
  restock?: string;
};

export type VaurelMenuLink = { label: string; detail: string; href: string; art: VaurelArt };

export type VaurelMenu = { title: string; links: VaurelMenuLink[] };

export type VaurelStep = { title: string; body: string; time: string };

export type VaurelService = { id: string; name: string; price: string; turnaround: string; body: string };

export type VaurelEntry = {
  kind: string;
  title: string;
  excerpt: string;
  date: string;
  dateLabel: string;
  read: string;
  href: string;
};

export type VaurelLinkGroup = { title: string; links: { label: string; href: string }[] };

export type VaurelNewsletterStatus = "idle" | "loading" | "error" | "success";

export type VaurelPenHouseProps = {
  brand?: string;
  announcement?: string;
  menus?: VaurelMenu[];
  links?: { label: string; href: string }[];
  defaultBagCount?: number;
  /** Opens the Pens panel on first render (wide screens). */
  defaultMenuOpen?: boolean;
  headline?: string;
  /** Words of the headline set in italic. */
  emphasis?: string;
  subline?: string;
  ctaLabel?: string;
  ctaHref?: string;
  ctaNote?: string;
  nibs?: VaurelNib[];
  defaultNib?: string;
  pieces?: VaurelPiece[];
  steps?: VaurelStep[];
  services?: VaurelService[];
  defaultService?: string;
  journal?: VaurelEntry[];
  footerGroups?: VaurelLinkGroup[];
  defaultEmail?: string;
  /** Controls the newsletter form; leave undefined to let the component manage it. */
  newsletterStatus?: VaurelNewsletterStatus;
  onNavigate?: (href: string) => void;
  onAddToBag?: (pieceId: string) => void;
  onOpenBag?: () => void;
  onOpenAccount?: () => void;
  onSelectNib?: (nibId: string) => void;
  onBookService?: (serviceId: string) => void;
  onSubscribe?: (email: string) => void | Promise<void>;
  className?: string;
};

const DEFAULT_NIBS: VaurelNib[] = [
  { id: "ef", grade: "EF", name: "Extra fine", widthMm: 0.3, note: "For small hands, ledgers and thin paper." },
  { id: "f", grade: "F", name: "Fine", widthMm: 0.45, note: "Crisp on cheap paper, still smooth on good paper." },
  {
    id: "m",
    grade: "M",
    name: "Medium",
    widthMm: 0.6,
    note: "The house nib. Even on most papers, wet enough to show the ink.",
  },
  {
    id: "b",
    grade: "B",
    name: "Broad",
    widthMm: 0.8,
    note: "For signatures and large hands; shows shading in every ink.",
  },
  { id: "stub", grade: "1.1", name: "Stub", widthMm: 1.1, note: "Cut square. Broad downstrokes, fine crossings." },
];

const DEFAULT_MENUS: VaurelMenu[] = [
  {
    title: "Fountain pens",
    links: [
      { label: "No. 31 Ebonite", detail: "Hand-turned · 18k nib", href: "#no-31", art: "pen" },
      { label: "No. 31 Celluloid", detail: "Tortoise or ivory", href: "#no-31-celluloid", art: "pen" },
      { label: "No. 17 Pocket", detail: "Faceted · 11 cm capped", href: "#no-17", art: "pocket" },
    ],
  },
  {
    title: "Nibs and parts",
    links: [
      { label: "Spare nib units", detail: "Five grades, swapped by hand", href: "#nib-units", art: "nib" },
      { label: "Piston converters", detail: "1.2 ml · brass mechanism", href: "#converters", art: "converter" },
      { label: "Inks", detail: "Seven colours · 50 ml", href: "#inks", art: "ink" },
    ],
  },
];

const DEFAULT_LINKS = [
  { label: "Paper", href: "#paper" },
  { label: "Nib service", href: "#service" },
  { label: "Journal", href: "#journal" },
];

const DEFAULT_PIECES: VaurelPiece[] = [
  {
    id: "no-31",
    kind: "Fountain pen",
    name: "No. 31 Ebonite",
    detail: "Black ripple · 18k gold nib",
    price: "€690",
    href: "#no-31",
    art: "pen",
    stock: 14,
  },
  {
    id: "no-17",
    kind: "Fountain pen",
    name: "No. 17 Pocket",
    detail: "Faceted ebonite · steel nib",
    price: "€420",
    href: "#no-17",
    art: "pocket",
    stock: 2,
  },
  {
    id: "rhone-night",
    kind: "Ink",
    name: "Rhône Night",
    detail: "Blue-black · 50 ml glass",
    price: "€32",
    href: "#rhone-night",
    art: "ink",
    stock: 63,
  },
  {
    id: "cahier-120",
    kind: "Paper",
    name: "Cahier 120",
    detail: "Laid paper · 96 sheets",
    price: "€48",
    href: "#cahier-120",
    art: "cahier",
    stock: 0,
    restock: "Next binding leaves the bindery on 12 January.",
  },
];

const DEFAULT_STEPS: VaurelStep[] = [
  {
    title: "Turned",
    body: "Each barrel is cut from a single rod of ebonite, rested for a week, then turned again to size.",
    time: "3 h 10 min",
  },
  {
    title: "Ground",
    body: "The tipping is shaped on a brass wheel to one of five grades and the slit opened by hand.",
    time: "48 min",
  },
  {
    title: "Tuned",
    body: "The tuner writes on three papers, adjusts the flow and signs the test sheet that ships with the pen.",
    time: "35 min",
  },
];

const DEFAULT_SERVICES: VaurelService[] = [
  {
    id: "tune",
    name: "Tune",
    price: "Included",
    turnaround: "5 working days",
    body: "Flow and alignment adjusted, nib cleaned. Free for the life of the pen.",
  },
  {
    id: "regrind",
    name: "Regrind",
    price: "€60",
    turnaround: "10 working days",
    body: "Your nib reground to another grade, or to the angle you write at.",
  },
  {
    id: "restore",
    name: "Restoration",
    price: "€140",
    turnaround: "3 weeks",
    body: "Barrel repolished, piston resealed, nib unit replaced if it needs it.",
  },
];

const DEFAULT_JOURNAL: VaurelEntry[] = [
  {
    kind: "Atelier",
    title: "A morning at the grinding wheel with Hélène Margerit",
    excerpt: "Twenty-two years at the bench and still four nibs an hour. What she listens for before she looks.",
    date: "2026-10-14",
    dateLabel: "14 October 2026",
    read: "8 min read",
    href: "#journal-margerit",
  },
  {
    kind: "Inks",
    title: "Why Rhône Night shifts from blue to grey as it dries",
    excerpt: "Iron-gall chemistry, explained without the alchemy, and which papers show the change best.",
    date: "2026-09-02",
    dateLabel: "2 September 2026",
    read: "5 min read",
    href: "#journal-rhone-night",
  },
  {
    kind: "Care",
    title: "Flushing a pen that has sat in a drawer since spring",
    excerpt: "Warm water, a bulb syringe and patience. When to stop and post it to the atelier instead.",
    date: "2026-07-21",
    dateLabel: "21 July 2026",
    read: "4 min read",
    href: "#journal-flushing",
  },
];

const DEFAULT_FOOTER: VaurelLinkGroup[] = [
  {
    title: "Shop",
    links: [
      { label: "Fountain pens", href: "#pens" },
      { label: "Inks", href: "#inks" },
      { label: "Paper", href: "#paper" },
      { label: "Gift cards", href: "#gift-cards" },
    ],
  },
  {
    title: "Service",
    links: [
      { label: "Nib service", href: "#service" },
      { label: "Repairs", href: "#repairs" },
      { label: "Parts and converters", href: "#converters" },
      { label: "Care guide", href: "#care" },
    ],
  },
  {
    title: "House",
    links: [
      { label: "The atelier", href: "#craft" },
      { label: "Journal", href: "#journal" },
      { label: "Careers", href: "#careers" },
      { label: "Press office", href: "#press" },
    ],
  },
  {
    title: "Help",
    links: [
      { label: "Shipping", href: "#shipping" },
      { label: "Returns within 30 days", href: "#returns" },
      { label: "Contact", href: "#contact" },
      { label: "Accessibility", href: "#accessibility" },
    ],
  },
];

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--iu-accent)";
const LABEL = "text-[11px] font-medium tracking-[0.2em] uppercase";
const SURFACE_RADIUS = "rounded-[min(var(--iu-radius),2px)]";
const PILL = `h-11 items-center justify-center gap-2 rounded-full bg-(--iu-foreground) px-6 text-[13px] tracking-[0.04em] text-(--iu-background) transition-colors duration-300 motion-reduce:transition-none pointer-fine:hover:bg-[color-mix(in_oklab,var(--iu-foreground)_82%,var(--iu-background))] ${FOCUS}`;
const PILL_SOLID = `inline-flex ${PILL}`;
const EASE = [0.2, 0.8, 0.2, 1] as const;

function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

/** The tuner's test sheet: tall loops, small loops and a wave, written left to right as one stroke. */
function testLoops() {
  const r = (n: number) => Math.round(n * 10) / 10;
  const loops = (x0: number, b: number, count: number, w: number, h: number) => {
    let d = `M${x0} ${b}`;
    let x = x0;
    for (let i = 0; i < count; i++) {
      const hh = h * (1 + (((i * 37) % 7) - 3) / 40);
      d += ` C${r(x + w * 0.55)} ${r(b - hh * 0.25)} ${r(x + w * 0.95)} ${r(b - hh)} ${r(x + w * 0.62)} ${r(b - hh)}`;
      d += ` C${r(x + w * 0.3)} ${r(b - hh)} ${r(x + w * 0.28)} ${r(b - hh * 0.45)} ${r(x + w * 0.45)} ${b}`;
      x += w * 0.62;
    }
    return `${d} C${r(x + w * 0.1)} ${b + 3} ${r(x + w * 0.4)} ${b + 2} ${r(x + w * 0.6)} ${b - 4}`;
  };
  const wave = (x0: number, b: number, count: number, w: number, a: number) => {
    let d = `M${x0} ${b}`;
    for (let i = 0, x = x0; i < count; i++, x += w) {
      d += ` C${x + w * 0.25} ${b - a} ${x + w * 0.25} ${b - a} ${x + w * 0.5} ${b}`;
      d += ` C${x + w * 0.75} ${b + a} ${x + w * 0.75} ${b + a} ${x + w} ${b}`;
    }
    return d;
  };
  return [loops(12, 56, 19, 44, 38), loops(12, 112, 29, 29, 17), wave(12, 158, 9, 60, 12)].join(" ");
}

const TEST_LOOPS = testLoops();

const ARTS: VaurelArt[] = ["pen", "pocket", "nib", "converter", "ink", "cahier"];

/** Fine-line drawings at 200 × 240; the accent is one line per drawing. */
function Art({ art, className = "" }: { art: VaurelArt; className?: string }) {
  const accent = "stroke-(--iu-accent)";
  const line = { fill: "none", stroke: "currentColor", strokeWidth: 1, vectorEffect: "non-scaling-stroke" as const };
  return (
    <svg viewBox="0 0 200 240" aria-hidden="true" data-art={art} className={className}>
      <g {...line}>
        {art === "pen" ? (
          <>
            <rect x="88" y="22" width="24" height="98" rx="11" />
            <path d="M100 30v70" />
            <path d="M96 30h8v64l-4 6-4-6Z" />
            <path d="M88 104h24" className={accent} />
            <path d="M88 110h24" />
            <path d="M89 124h22v72H89Z" />
            <path d="M89 196l6 20h10l6-20" />
          </>
        ) : null}
        {art === "pocket" ? (
          <>
            <path d="M84 56h32v68H84Z" />
            <path d="M94 56v68M106 56v68" />
            <path d="M84 116h32" className={accent} />
            <path d="M86 128h28v48H86Z" />
            <path d="M96 128v48M104 128v48" />
            <path d="M86 176l8 14h12l8-14" />
          </>
        ) : null}
        {art === "ink" ? (
          <>
            <rect x="78" y="40" width="44" height="36" />
            <path d="M78 52h44M78 64h44" />
            <rect x="86" y="76" width="28" height="18" />
            <path d="M62 94h76v110H62Z" />
            <path d="M64 118h72" className={accent} />
            <rect x="76" y="136" width="48" height="40" />
            <path d="M86 150h28M90 160h20" />
          </>
        ) : null}
        {art === "cahier" ? (
          <>
            <rect x="52" y="36" width="96" height="168" rx="2" />
            <path d="M64 36v168" strokeDasharray="3 4" />
            <path d="M134 36v168" className={accent} />
            <rect x="78" y="76" width="44" height="26" />
            <path d="M86 86h28M90 94h20" />
            <path d="M52 204h96l-4 6H56Z" />
          </>
        ) : null}
        {art === "nib" ? (
          <>
            <path d="M74 40h52v62c0 44-16 84-26 116-10-32-26-72-26-116Z" />
            <path d="M100 218v-90" className={accent} />
            <circle cx="100" cy="122" r="5" />
            <path d="M84 70c10-10 22-10 32 0M88 84c8-6 16-6 24 0" />
          </>
        ) : null}
        {art === "converter" ? (
          <>
            <rect x="86" y="28" width="28" height="22" />
            <path d="M86 36h28M86 42h28" />
            <rect x="88" y="50" width="24" height="140" rx="3" />
            <path d="M100 50v74" />
            <path d="M90 124h20" className={accent} />
            <path d="M92 190v14h16v-14" />
          </>
        ) : null}
      </g>
    </svg>
  );
}

/** The No. 31, uncapped, drawn in profile. The slit of the nib is the accent line. */
function PenProfile({ className = "" }: { className?: string }) {
  const line = { fill: "none", stroke: "currentColor", strokeWidth: 1, vectorEffect: "non-scaling-stroke" as const };
  return (
    <svg viewBox="0 0 640 96" aria-hidden="true" className={className}>
      <g {...line}>
        <path d="M36 30h160v36H36c-10 0-16-8-16-18s6-18 16-18Z" />
        <path d="M176 30v36M182 30v36" />
        <path d="M46 30v-6h104c8 0 10 6 4 6" />
        <path d="M232 34h30v28h-30c-6 0-10-6-10-14s4-14 10-14Z" />
        <path d="M262 32h214v32H262Z" />
        <path d="M268 32v32" />
        <path d="M476 36h8v24h-8" />
        <path d="M484 38l56 4v12l-56 4Z" />
        <path d="M494 38.7v18.6" />
        <path d="M540 40l60 6c10 1 20 2 26 2-6 0-16 1-26 2l-60 6Z" />
        <circle cx="570" cy="48" r="2.4" />
        <path d="M550 44c6 2 6 6 0 8" />
      </g>
      <path
        d="M573 48h53"
        fill="none"
        strokeWidth={1}
        vectorEffect="non-scaling-stroke"
        className="stroke-(--iu-accent)"
      />
    </svg>
  );
}

function StoreHeader({
  defaultMenuOpen,
  brand,
  announcement,
  menus,
  links,
  bagCount,
  onNavigate,
  onOpenBag,
  onOpenAccount,
}: {
  defaultMenuOpen: boolean;
  brand: string;
  announcement: string;
  menus: VaurelMenu[];
  links: { label: string; href: string }[];
  bagCount: number;
  onNavigate?: (href: string) => void;
  onOpenBag?: () => void;
  onOpenAccount?: () => void;
}) {
  const uid = useId();
  const [open, setOpen] = useState(defaultMenuOpen);
  const firstLink = menus[0]?.links[0];
  const [subject, setSubject] = useState<VaurelMenuLink | undefined>(firstLink);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLDialogElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!panelRef.current?.contains(target) && !triggerRef.current?.contains(target)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open]);

  const panelLinks = () =>
    Array.from(panelRef.current?.querySelectorAll<HTMLAnchorElement>("a[data-panel-link]") ?? []);

  const onTriggerKey = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      requestAnimationFrame(() => panelLinks()[0]?.focus());
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  };

  const onPanelKey = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const items = panelLinks();
    const index = items.indexOf(document.activeElement as HTMLAnchorElement);
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const next = event.key === "ArrowDown" ? index + 1 : index - 1;
      items[(next + items.length) % items.length]?.focus();
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      (event.key === "Home" ? items[0] : items[items.length - 1])?.focus();
    }
  };

  const onPanelBlur = (event: ReactFocusEvent<HTMLDivElement>) => {
    const next = event.relatedTarget as Node | null;
    if (next && !panelRef.current?.contains(next) && !triggerRef.current?.contains(next)) setOpen(false);
  };

  const navigate = (href: string) => {
    setOpen(false);
    drawerRef.current?.close();
    onNavigate?.(href);
  };

  const navLink = cx(
    "inline-flex h-10 items-center text-[13px] tracking-[0.04em] text-(--iu-foreground)/80 transition-colors duration-300 motion-reduce:transition-none pointer-fine:hover:text-(--iu-foreground)",
    FOCUS,
  );
  const iconButton = cx(
    "relative inline-flex size-10 items-center justify-center rounded-full text-(--iu-foreground) transition-colors duration-300 motion-reduce:transition-none pointer-fine:hover:bg-(--iu-foreground)/6",
    FOCUS,
  );

  return (
    <header className="relative border-b border-(--iu-border)">
      <p className="border-b border-(--iu-border) px-5 py-2.5 text-center text-[11px] tracking-[0.16em] text-(--iu-muted) uppercase">
        {announcement}
      </p>
      <div className="mx-auto grid h-[72px] max-w-[1280px] grid-cols-[1fr_auto_1fr] items-center px-3 sm:px-8 lg:h-20 lg:px-10">
        <div className="flex items-center">
          <button
            ref={menuButtonRef}
            type="button"
            aria-label="Open menu"
            aria-haspopup="dialog"
            aria-controls={`${uid}-drawer`}
            onClick={() => drawerRef.current?.showModal()}
            className={cx(iconButton, "lg:hidden")}
          >
            <Menu size={20} strokeWidth={1.25} aria-hidden="true" />
          </button>
          <nav aria-label="Main" className="hidden lg:block">
            <ul className="flex items-center gap-8">
              {menus.length > 0 ? (
                <li>
                  <button
                    ref={triggerRef}
                    type="button"
                    aria-expanded={open}
                    aria-controls={`${uid}-panel`}
                    onClick={() => setOpen((value) => !value)}
                    onKeyDown={onTriggerKey}
                    className={cx(navLink, "gap-1.5")}
                  >
                    Pens
                    <ChevronDown
                      size={14}
                      strokeWidth={1.25}
                      aria-hidden="true"
                      className={cx(
                        "transition-transform duration-300 motion-reduce:transition-none",
                        open && "rotate-180",
                      )}
                    />
                  </button>
                </li>
              ) : null}
              {links.map((link) => (
                <li key={link.href}>
                  <a href={link.href} onClick={() => navigate(link.href)} className={navLink}>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <a
          href="#top"
          onClick={() => navigate("#top")}
          className={cx("font-serif text-[30px] leading-none tracking-[0.02em] lg:text-[34px]", FOCUS)}
        >
          {brand}
        </a>

        <div className="flex items-center justify-end gap-1">
          <button type="button" aria-label="Your account" onClick={onOpenAccount} className={iconButton}>
            <User size={20} strokeWidth={1.25} aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label={`Bag, ${bagCount} ${bagCount === 1 ? "item" : "items"}`}
            onClick={onOpenBag}
            className={iconButton}
          >
            <ShoppingBag size={20} strokeWidth={1.25} aria-hidden="true" />
            <span
              aria-hidden="true"
              className="absolute top-1.5 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-(--iu-foreground) px-1 text-[10px] text-(--iu-background) tabular-nums"
            >
              {bagCount}
            </span>
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            ref={panelRef}
            id={`${uid}-panel`}
            key="panel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            onKeyDown={onPanelKey}
            onBlur={onPanelBlur}
            className="absolute inset-x-0 top-full z-20 hidden border-b border-(--iu-border) bg-(--iu-background) lg:block"
          >
            <div className="mx-auto grid max-w-[1280px] grid-cols-[1fr_1fr_320px] gap-10 px-10 py-10">
              {menus.map((menu) => (
                <div key={menu.title}>
                  <p className={cx(LABEL, "text-(--iu-muted)")}>{menu.title}</p>
                  <ul className="mt-5 space-y-[calc(4px*var(--iu-density))]">
                    {menu.links.map((link) => (
                      <li key={link.href}>
                        <a
                          href={link.href}
                          data-panel-link
                          data-art-name={link.art}
                          data-label={link.label}
                          onClick={() => navigate(link.href)}
                          onFocus={() => setSubject(link)}
                          onPointerEnter={() => setSubject(link)}
                          className={cx(
                            "group flex flex-col py-[calc(8px*var(--iu-density))] transition-colors duration-300 motion-reduce:transition-none",
                            FOCUS,
                          )}
                        >
                          <span className="font-serif text-[22px] leading-tight">
                            <span className="bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_1px] bg-left-bottom bg-no-repeat transition-[background-size] duration-500 motion-reduce:transition-none pointer-fine:group-hover:bg-[length:100%_1px]">
                              {link.label}
                            </span>
                          </span>
                          <span className="mt-1 text-[13px] text-(--iu-muted)">{link.detail}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              <figure className={cx("relative border border-(--iu-border) p-1", SURFACE_RADIUS)}>
                <div
                  className={cx(
                    "flex h-full flex-col items-center border border-(--iu-border) px-6 pt-6 pb-5",
                    SURFACE_RADIUS,
                  )}
                >
                  <div className="grid w-full text-(--iu-foreground)/80">
                    {ARTS.filter((art) => menus.some((menu) => menu.links.some((item) => item.art === art))).map(
                      (art) => (
                        <Art
                          key={art}
                          art={art}
                          className={cx(
                            "col-start-1 row-start-1 mx-auto h-44 w-auto transition-[opacity,scale] duration-300 motion-reduce:transition-none",
                            subject?.art === art ? "scale-100 opacity-100" : "scale-[0.985] opacity-0",
                          )}
                        />
                      ),
                    )}
                  </div>
                  <figcaption className="mt-4 text-center">
                    <span className={cx(LABEL, "block text-(--iu-muted)")}>In the atelier</span>
                    <span data-subject className="mt-2 block font-serif text-lg">
                      {subject?.label}
                    </span>
                  </figcaption>
                </div>
              </figure>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <dialog
        ref={drawerRef}
        id={`${uid}-drawer`}
        aria-label="Menu"
        onClose={() => menuButtonRef.current?.focus()}
        onClick={(event) => {
          if (event.target === drawerRef.current) drawerRef.current?.close();
        }}
        className="m-0 h-dvh max-h-none w-[min(100vw,400px)] max-w-none bg-(--iu-background) p-0 text-(--iu-foreground) backdrop:bg-black/40"
      >
        <div className="flex h-full flex-col">
          <div className="flex h-[72px] items-center justify-between border-b border-(--iu-border) pr-3 pl-6">
            <span className="font-serif text-[26px]">{brand}</span>
            <button
              type="button"
              aria-label="Close menu"
              data-close
              onClick={() => drawerRef.current?.close()}
              className={iconButton}
            >
              <X size={20} strokeWidth={1.25} aria-hidden="true" />
            </button>
          </div>
          <nav aria-label="Main" className="flex-1 [scrollbar-gutter:stable] overflow-y-auto px-6 pt-6 pb-10">
            {menus.map((menu) => (
              <div key={menu.title} className="mb-8">
                <p className={cx(LABEL, "text-(--iu-muted)")}>{menu.title}</p>
                <ul className="mt-3">
                  {menu.links.map((link) => (
                    <li key={link.href} className="border-b border-(--iu-border)">
                      <a
                        href={link.href}
                        onClick={() => navigate(link.href)}
                        className={cx("flex min-h-12 items-center justify-between gap-4 py-2", FOCUS)}
                      >
                        <span className="font-serif text-xl">{link.label}</span>
                        <span className="text-right text-xs text-(--iu-muted)">{link.detail}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <ul className="border-t border-(--iu-foreground)/20 pt-2">
              {links.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    onClick={() => navigate(link.href)}
                    className={cx("flex min-h-12 items-center text-[15px]", FOCUS)}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </dialog>
    </header>
  );
}

function Hero({
  headline,
  emphasis,
  subline,
  ctaLabel,
  ctaHref,
  ctaNote,
  nibs,
  defaultNib,
  onNavigate,
  onSelectNib,
}: {
  headline: string;
  emphasis: string;
  subline: string;
  ctaLabel: string;
  ctaHref: string;
  ctaNote: string;
  nibs: VaurelNib[];
  defaultNib: string;
  onNavigate?: (href: string) => void;
  onSelectNib?: (nibId: string) => void;
}) {
  const uid = useId();
  const reduceMotion = useReducedMotion();
  const [nibId, setNibId] = useState(nibs.some((nib) => nib.id === defaultNib) ? defaultNib : (nibs[0]?.id ?? ""));
  const [draws, setDraws] = useState(0);
  const nib = nibs.find((item) => item.id === nibId) ?? nibs[0];
  const [before, after] = emphasis && headline.includes(emphasis) ? headline.split(emphasis) : [headline, undefined];

  const choose = (id: string) => {
    setNibId(id);
    setDraws((count) => count + 1);
    onSelectNib?.(id);
  };

  return (
    <section
      aria-labelledby={`${uid}-title`}
      className="mx-auto max-w-[1280px] px-5 pt-14 pb-20 sm:px-8 lg:px-10 lg:pt-20 lg:pb-28"
    >
      <div className="grid grid-cols-12 gap-x-6 gap-y-14">
        <div className="col-span-12 flex flex-col lg:col-span-5 lg:pt-10">
          <p className={cx(LABEL, "text-(--iu-muted)")}>No. 31 · The writing pen</p>
          <h1
            id={`${uid}-title`}
            className="mt-8 font-serif text-[clamp(3rem,2rem+4vw,5.75rem)] leading-[0.98] font-normal tracking-[-0.02em] text-balance"
          >
            {before}
            {after !== undefined ? <em className="italic">{emphasis}</em> : null}
            {after}
          </h1>
          <p className="mt-8 max-w-[30rem] text-[15px] leading-[1.7] text-pretty text-(--iu-muted) sm:text-base">
            {subline}
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4">
            <a href={ctaHref} onClick={() => onNavigate?.(ctaHref)} className={PILL_SOLID}>
              {ctaLabel}
              <ArrowRight size={16} strokeWidth={1.25} aria-hidden="true" />
            </a>
            <span className="text-[13px] text-(--iu-muted)">{ctaNote}</span>
          </div>
        </div>

        <figure className="col-span-12 lg:col-span-7">
          <div
            className={cx("border border-(--iu-foreground)/30 p-1 dark:border-(--iu-foreground)/25", SURFACE_RADIUS)}
          >
            <div
              className={cx("border border-(--iu-border) bg-(--iu-surface) dark:bg-(--iu-background)", SURFACE_RADIUS)}
            >
              <div className="flex items-baseline justify-between gap-4 border-b border-(--iu-border) px-5 py-3 sm:px-8">
                <span className={cx(LABEL, "text-(--iu-muted)")}>Test sheet</span>
                <span data-nib-width className="font-mono text-[11px] text-(--iu-muted) tabular-nums">
                  {nib ? `${nib.widthMm.toFixed(2)} mm` : ""}
                </span>
              </div>
              <div className="px-5 pt-8 sm:px-8 sm:pt-10">
                <PenProfile className="h-auto w-full text-(--iu-foreground)/80" />
              </div>
              <div className="relative mx-5 mt-6 sm:mx-8 sm:mt-8">
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-[repeating-linear-gradient(to_bottom,transparent_0,transparent_calc(33.333%-1px),var(--iu-border)_calc(33.333%-1px),var(--iu-border)_33.333%)]"
                />
                <svg viewBox="0 0 600 184" aria-hidden="true" className="relative h-auto w-full text-(--iu-foreground)">
                  <g transform="translate(28 0) skewX(-14)">
                    <motion.path
                      key={draws}
                      data-loops
                      d={TEST_LOOPS}
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={
                        draws === 0 || reduceMotion
                          ? false
                          : { pathLength: 0, strokeWidth: (nib?.widthMm ?? 0.6) * 3.2 }
                      }
                      animate={{ pathLength: 1, strokeWidth: (nib?.widthMm ?? 0.6) * 3.2 }}
                      transition={reduceMotion ? { duration: 0 } : { duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
                    />
                  </g>
                </svg>
              </div>
              <figcaption
                data-nib-caption
                className="px-5 pt-5 pb-1 text-[13px] leading-relaxed text-pretty text-(--iu-muted) sm:px-8"
              >
                <span className="font-serif text-[17px] text-(--iu-foreground) italic">{nib?.name}.</span> {nib?.note}
              </figcaption>
              <fieldset className="mt-5 border-t border-(--iu-border)">
                <legend className="sr-only">Nib grade</legend>
                <div className="grid grid-cols-5">
                  {nibs.map((item, index) => {
                    const checked = item.id === nibId;
                    return (
                      <label
                        key={item.id}
                        data-nib={item.id}
                        className={cx(
                          "relative flex min-h-[72px] cursor-pointer flex-col items-center justify-center gap-1 py-3 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-[-4px] has-[:focus-visible]:outline-(--iu-accent)",
                          index > 0 && "border-l border-(--iu-border)",
                        )}
                      >
                        <input
                          type="radio"
                          name={`${uid}-nib`}
                          value={item.id}
                          checked={checked}
                          onChange={() => choose(item.id)}
                          className="sr-only"
                        />
                        <span
                          className={cx(
                            "font-serif text-[22px] leading-none transition-colors duration-300 motion-reduce:transition-none sm:text-[26px]",
                            checked ? "text-(--iu-foreground)" : "text-(--iu-muted)",
                          )}
                        >
                          {item.grade}
                        </span>
                        <span className="font-mono text-[10px] text-(--iu-muted) tabular-nums">
                          {item.widthMm.toFixed(2)}
                          <span className="sr-only"> millimetres, {item.name}</span>
                        </span>
                        {checked ? (
                          <motion.span
                            layoutId={`${uid}-nib-mark`}
                            data-nib-mark
                            aria-hidden="true"
                            transition={{ duration: 0.4, ease: EASE }}
                            className="absolute inset-x-3 -top-px h-px bg-(--iu-accent) sm:inset-x-6"
                          />
                        ) : null}
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            </div>
          </div>
          <p data-nib-live aria-live="polite" className="sr-only">
            {draws > 0 && nib ? `${nib.name} nib, ${nib.widthMm.toFixed(2)} millimetre line` : ""}
          </p>
        </figure>
      </div>
    </section>
  );
}

function Collection({ pieces, onAdd }: { pieces: VaurelPiece[]; onAdd: (piece: VaurelPiece) => void }) {
  const uid = useId();
  const [added, setAdded] = useState<string[]>([]);
  return (
    <section id="pens" aria-labelledby={`${uid}-title`} className="border-t border-(--iu-border)">
      <div className="mx-auto max-w-[1280px] px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className={cx(LABEL, "text-(--iu-muted)")}>The collection</p>
            <h2
              id={`${uid}-title`}
              className="mt-5 font-serif text-[clamp(2.25rem,1.6rem+2.4vw,3.5rem)] leading-[1.05] font-normal tracking-[-0.01em] text-balance"
            >
              Four things for the desk.
            </h2>
          </div>
          <a
            href="#shop-all"
            className={cx(
              "inline-flex h-10 items-center gap-2 border-b border-(--iu-foreground)/40 text-[13px] tracking-[0.04em]",
              FOCUS,
            )}
          >
            Shop all pieces
            <ArrowRight size={14} strokeWidth={1.25} aria-hidden="true" />
          </a>
        </div>
        <ul className="mt-14 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {pieces.map((piece) => {
            const isAdded = added.includes(piece.id);
            const soldOut = piece.stock === 0;
            return (
              <li key={piece.id}>
                <article aria-labelledby={`${uid}-${piece.id}`} className="flex h-full flex-col">
                  <div className={cx("border border-(--iu-border) p-1", SURFACE_RADIUS)}>
                    <div
                      className={cx(
                        "flex aspect-[3/2] items-center justify-center border border-(--iu-border) bg-(--iu-surface) sm:aspect-[4/5] dark:bg-(--iu-foreground)/[0.03]",
                        SURFACE_RADIUS,
                      )}
                    >
                      <Art
                        art={piece.art}
                        className={cx("h-[78%] w-auto", soldOut ? "text-(--iu-muted)" : "text-(--iu-foreground)/80")}
                      />
                    </div>
                  </div>
                  <p className={cx(LABEL, "mt-5 text-(--iu-muted)")}>{piece.kind}</p>
                  <div className="mt-2 flex items-baseline justify-between gap-4">
                    <h3 id={`${uid}-${piece.id}`} className="font-serif text-2xl leading-tight">
                      <a href={piece.href} className={FOCUS}>
                        {piece.name}
                      </a>
                    </h3>
                    <p className="font-serif text-xl tabular-nums">{piece.price}</p>
                  </div>
                  <p className="mt-1 text-[13px] text-(--iu-muted)">{piece.detail}</p>
                  <p
                    id={`${uid}-${piece.id}-stock`}
                    className="mt-3 flex items-center gap-2 text-[13px] text-(--iu-muted)"
                  >
                    {soldOut ? (
                      <>{piece.restock ?? "Sold out"}</>
                    ) : piece.stock <= 3 ? (
                      <>
                        <span aria-hidden="true" className="size-1.5 rotate-45 bg-(--iu-accent)" />
                        Only {piece.stock} left
                      </>
                    ) : (
                      <>In stock · ships from Lyon in 2 days</>
                    )}
                  </p>
                  <div className="mt-auto pt-6">
                    <button
                      type="button"
                      disabled={soldOut}
                      data-add={piece.id}
                      aria-describedby={`${uid}-${piece.id}-stock`}
                      onClick={() => {
                        if (isAdded) return;
                        setAdded((list) => [...list, piece.id]);
                        onAdd(piece);
                      }}
                      className={cx(
                        "grid h-11 w-full place-items-center rounded-full border text-[13px] tracking-[0.04em] transition-colors duration-300 motion-reduce:transition-none",
                        soldOut
                          ? "cursor-not-allowed border-dashed border-(--iu-foreground)/35 text-(--iu-muted)"
                          : isAdded
                            ? "border-(--iu-foreground) bg-(--iu-foreground) text-(--iu-background)"
                            : "border-(--iu-foreground)/45 pointer-fine:hover:border-(--iu-foreground)",
                        FOCUS,
                      )}
                    >
                      <span
                        className={cx(
                          "col-start-1 row-start-1 inline-flex items-center gap-2",
                          (isAdded || soldOut) && "invisible",
                        )}
                      >
                        Add to bag
                      </span>
                      <span
                        className={cx(
                          "col-start-1 row-start-1 inline-flex items-center gap-2",
                          !isAdded && "invisible",
                        )}
                      >
                        <Check size={14} strokeWidth={1.5} aria-hidden="true" />
                        In your bag
                      </span>
                      <span className={cx("col-start-1 row-start-1", !soldOut && "invisible")}>Sold out</span>
                    </button>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

function Craft({ steps }: { steps: VaurelStep[] }) {
  const uid = useId();
  const parts = ["Tipping", "Slit", "Breather hole", "Shoulder"];
  const callouts: [number, number][] = [
    [140, 316],
    [140, 246],
    [140, 172],
    [188, 70],
  ];
  return (
    <section
      id="craft"
      aria-labelledby={`${uid}-title`}
      className="border-t border-(--iu-border) bg-(--iu-surface) dark:bg-(--iu-foreground)/[0.025]"
    >
      <div className="mx-auto grid max-w-[1280px] grid-cols-12 gap-x-6 gap-y-16 px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
        <div className="col-span-12 lg:col-span-6">
          <p className={cx(LABEL, "text-(--iu-muted)")}>The atelier · Lyon</p>
          <h2
            id={`${uid}-title`}
            className="mt-5 max-w-[16ch] font-serif text-[clamp(2.25rem,1.6rem+2.4vw,3.5rem)] leading-[1.05] font-normal tracking-[-0.01em] text-balance"
          >
            Ninety-one steps, four pairs of hands.
          </h2>
          <p className="mt-6 max-w-[34rem] text-[15px] leading-[1.7] text-pretty text-(--iu-muted)">
            Every No. 31 passes the same bench on the Quai Saint-Vincent. Three of the steps decide how it writes.
          </p>
          <ol className="mt-12 border-t border-(--iu-border)">
            {steps.map((step, index) => (
              <li
                key={step.title}
                className="grid grid-cols-[56px_1fr] gap-x-4 border-b border-(--iu-border) py-[calc(24px*var(--iu-density))] sm:grid-cols-[80px_1fr_auto]"
              >
                <span
                  aria-hidden="true"
                  className="font-serif text-[40px] leading-none text-(--iu-muted) tabular-nums sm:text-5xl"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="font-serif text-2xl leading-tight">{step.title}</h3>
                  <p className="mt-2 text-[14px] leading-[1.65] text-pretty text-(--iu-muted)">{step.body}</p>
                </div>
                <p className="col-start-2 mt-3 font-mono text-[11px] text-(--iu-muted) tabular-nums sm:col-start-3 sm:mt-1">
                  <span className="sr-only">Time at the bench: </span>
                  {step.time}
                </p>
              </li>
            ))}
          </ol>
        </div>
        <figure className="col-span-12 flex flex-col items-center lg:col-span-5 lg:col-start-8">
          <svg
            viewBox="0 0 280 340"
            aria-hidden="true"
            className="h-auto w-full max-w-[360px] text-(--iu-foreground)/80"
          >
            <g fill="none" stroke="currentColor" strokeWidth={1} vectorEffect="non-scaling-stroke">
              <path
                d="M90 44Q140 24 190 44v76c0 80-40 150-50 200-10-50-50-120-50-200Z"
                vectorEffect="non-scaling-stroke"
              />
              <circle cx="140" cy="172" r="7" vectorEffect="non-scaling-stroke" />
              <path
                d="M108 84c20-18 44-18 64 0M114 100c16-12 36-12 52 0M120 116c12-8 28-8 40 0"
                vectorEffect="non-scaling-stroke"
              />
              {callouts.map(([x, y], index) => (
                <path
                  key={parts[index]}
                  d={`M${x + 4} ${y}H232`}
                  strokeOpacity={0.5}
                  strokeDasharray="2 3"
                  vectorEffect="non-scaling-stroke"
                />
              ))}
            </g>
            <path
              d="M140 320V179"
              fill="none"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
              className="stroke-(--iu-accent)"
            />
            {callouts.map(([, y], index) => (
              <g key={parts[index]}>
                <circle
                  cx="246"
                  cy={y}
                  r="11"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1}
                  vectorEffect="non-scaling-stroke"
                />
                <text x="246" y={y + 4} textAnchor="middle" className="fill-current font-serif text-[12px]">
                  {index + 1}
                </text>
              </g>
            ))}
          </svg>
          <figcaption className="mt-8 w-full max-w-[360px]">
            <p className={cx(LABEL, "text-(--iu-muted)")}>Anatomy of the 18k nib</p>
            <ol className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-[14px]">
              {parts.map((part, index) => (
                <li key={part} className="flex items-baseline gap-3">
                  <span className="font-serif text-(--iu-muted) tabular-nums">{index + 1}</span>
                  {part}
                </li>
              ))}
            </ol>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}

function Service({
  services,
  defaultService,
  onBook,
}: {
  services: VaurelService[];
  defaultService: string;
  onBook?: (serviceId: string) => void;
}) {
  const uid = useId();
  const [serviceId, setServiceId] = useState(
    services.some((item) => item.id === defaultService) ? defaultService : (services[0]?.id ?? ""),
  );
  const index = Math.max(
    0,
    services.findIndex((item) => item.id === serviceId),
  );
  const service = services[index];
  return (
    <section id="service" aria-labelledby={`${uid}-title`} className="border-t border-(--iu-border)">
      <div className="mx-auto max-w-[1280px] px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
        <header className="mx-auto max-w-[40rem] text-center">
          <p className={cx(LABEL, "text-(--iu-muted)")}>Nib service</p>
          <h2
            id={`${uid}-title`}
            className="mt-5 font-serif text-[clamp(2.25rem,1.6rem+2.4vw,3.5rem)] leading-[1.05] font-normal tracking-[-0.01em] text-balance"
          >
            Kept writing for <em className="italic">as long</em> as you do.
          </h2>
          <p className="mx-auto mt-6 max-w-[32rem] text-[15px] leading-[1.7] text-pretty text-(--iu-muted)">
            Post any Vaurel pen to the atelier in the sleeve that came with it. The tuner who signed its test sheet
            works on it again when they can.
          </p>
        </header>
        <fieldset className="relative mt-14 min-w-0" style={{ ["--cols" as string]: services.length }}>
          <legend className="sr-only">Choose a service</legend>
          <motion.div
            aria-hidden="true"
            data-service-frame
            initial={false}
            animate={{ x: `${index * 100}%` }}
            transition={{ duration: 0.45, ease: EASE }}
            className="pointer-events-none absolute inset-y-0 left-0 hidden w-[calc(100%/var(--cols))] border border-(--iu-foreground)/45 md:block"
          >
            <span className="absolute inset-[3px] border border-(--iu-foreground)/15" />
            <span className="absolute -top-[4px] left-1/2 size-[7px] -translate-x-1/2 rotate-45 bg-(--iu-accent)" />
          </motion.div>
          <div className="grid gap-3 md:grid-cols-[repeat(var(--cols),minmax(0,1fr))] md:gap-0">
            {services.map((item) => {
              const checked = item.id === serviceId;
              return (
                <label
                  key={item.id}
                  data-service={item.id}
                  className={cx(
                    "relative flex cursor-pointer flex-col px-5 py-6 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-[-8px] has-[:focus-visible]:outline-(--iu-accent) md:items-center md:px-8 md:py-10 md:text-center",
                    "border md:border-0",
                    SURFACE_RADIUS,
                    checked ? "border-(--iu-foreground)/45" : "border-(--iu-border)",
                  )}
                >
                  <input
                    type="radio"
                    name={`${uid}-service`}
                    value={item.id}
                    checked={checked}
                    data-name={item.name}
                    onChange={() => setServiceId(item.id)}
                    className="sr-only"
                  />
                  {checked ? (
                    <span
                      aria-hidden="true"
                      data-diamond
                      className="absolute -top-[4px] left-6 size-[7px] rotate-45 bg-(--iu-accent) md:hidden"
                    />
                  ) : null}
                  <span className="flex items-baseline justify-between gap-4 md:flex-col md:items-center md:gap-0">
                    <span className="font-serif text-[28px] leading-none md:text-[32px]">{item.name}</span>
                    <span
                      data-price
                      className={cx(
                        "font-serif text-2xl leading-none tabular-nums transition-colors duration-300 motion-reduce:transition-none md:mt-6 md:text-[40px]",
                        checked ? "text-(--iu-foreground)" : "text-(--iu-muted)",
                      )}
                    >
                      {item.price}
                    </span>
                  </span>
                  <span className={cx(LABEL, "mt-3 text-(--iu-muted) md:mt-4")}>{item.turnaround}</span>
                  <span className="mt-4 text-[14px] leading-[1.65] text-pretty text-(--iu-muted) md:max-w-[17rem]">
                    {item.body}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
        <div className="mt-12 flex flex-col items-center gap-4 text-center">
          <button type="button" data-book onClick={() => service && onBook?.(service.id)} className={PILL_SOLID}>
            Book a {service?.name.toLowerCase()}
          </button>
          <p className="max-w-[30rem] text-[13px] leading-relaxed text-pretty text-(--iu-muted)">
            Return postage is prepaid inside the EU and the pen travels insured both ways. We confirm the price before
            any work begins.
          </p>
        </div>
      </div>
    </section>
  );
}

function Journal({ entries }: { entries: VaurelEntry[] }) {
  const uid = useId();
  return (
    <section id="journal" aria-labelledby={`${uid}-title`} className="border-t border-(--iu-border)">
      <div className="mx-auto max-w-[1280px] px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
        <div className="flex flex-wrap items-end justify-between gap-6 border-b border-(--iu-foreground)/20 pb-6">
          <h2
            id={`${uid}-title`}
            className="font-serif text-[clamp(2.25rem,1.6rem+2.4vw,3.5rem)] leading-none font-normal tracking-[-0.01em]"
          >
            Journal
          </h2>
          <a
            href="#journal-all"
            className={cx(
              "inline-flex h-10 items-center gap-2 border-b border-(--iu-foreground)/40 text-[13px] tracking-[0.04em]",
              FOCUS,
            )}
          >
            Every entry
            <ArrowRight size={14} strokeWidth={1.25} aria-hidden="true" />
          </a>
        </div>
        <ul className="grid md:grid-cols-3">
          {entries.map((entry, index) => (
            <li
              key={entry.href}
              className={cx(
                "border-b border-(--iu-border) py-8 md:border-b-0 md:py-10",
                index > 0 && "md:border-l md:pl-8",
                index < entries.length - 1 && "md:pr-8",
              )}
            >
              <article className="group relative flex h-full flex-col">
                <p className="flex items-center gap-3 text-[11px] tracking-[0.2em] text-(--iu-muted) uppercase">
                  <span>{entry.kind}</span>
                  <span aria-hidden="true" className="h-px w-6 bg-(--iu-border)" />
                  <time dateTime={entry.date}>{entry.dateLabel}</time>
                </p>
                <h3 className="mt-5 font-serif text-[26px] leading-[1.15] text-balance">
                  <a href={entry.href} className={cx("after:absolute after:inset-0", FOCUS)}>
                    <span className="bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_1px] bg-left-bottom bg-no-repeat transition-[background-size] duration-500 motion-reduce:transition-none pointer-fine:group-hover:bg-[length:100%_1px]">
                      {entry.title}
                    </span>
                  </a>
                </h3>
                <p className="mt-4 text-[14px] leading-[1.65] text-pretty text-(--iu-muted)">{entry.excerpt}</p>
                <p className="mt-auto pt-6 font-mono text-[11px] text-(--iu-muted)">{entry.read}</p>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Newsletter({
  defaultEmail,
  status: controlled,
  onSubscribe,
}: {
  defaultEmail: string;
  status?: VaurelNewsletterStatus;
  onSubscribe?: (email: string) => void | Promise<void>;
}) {
  const uid = useId();
  const reduceMotion = useReducedMotion();
  const [email, setEmail] = useState(defaultEmail);
  const [own, setOwn] = useState<VaurelNewsletterStatus>("idle");
  const [problem, setProblem] = useState("");
  const status = controlled ?? own;
  const loading = status === "loading";
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (status === "success" && submitted) headingRef.current?.focus();
  }, [status, submitted]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;
    const value = email.trim();
    if (!value) return setProblem("Enter your email address to receive the letters.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value))
      return setProblem("That address is missing an @ or a domain, such as name@studio.fr.");
    setProblem("");
    setSubmitted(true);
    setOwn("loading");
    try {
      await onSubscribe?.(value);
      setOwn("success");
    } catch {
      setOwn("error");
    }
  };

  const message =
    problem ||
    (status === "error"
      ? "The atelier's mail server did not answer. Your address was not saved; try again in a moment."
      : "");

  return (
    <section data-newsletter aria-labelledby={`${uid}-title`} className="border-t border-(--iu-border)">
      <div className="mx-auto max-w-[1280px] px-5 py-20 sm:px-8 lg:px-10 lg:py-24">
        <div className={cx("border border-(--iu-foreground)/30 p-1 dark:border-(--iu-foreground)/25", SURFACE_RADIUS)}>
          <div
            className={cx(
              "grid gap-10 border border-(--iu-border) px-6 py-10 sm:px-10 md:grid-cols-2 md:gap-16 lg:px-16 lg:py-14",
              SURFACE_RADIUS,
            )}
          >
            <div>
              <p className={cx(LABEL, "text-(--iu-muted)")}>Once a month</p>
              <h2
                id={`${uid}-title`}
                ref={headingRef}
                tabIndex={-1}
                className="mt-5 font-serif text-[clamp(2rem,1.5rem+2vw,3rem)] leading-[1.05] font-normal tracking-[-0.01em] text-balance focus:outline-none"
              >
                {status === "success" ? "You are on the list." : "Letters from the workshop."}
              </h2>
              <p data-news-intro className="mt-5 max-w-[28rem] text-[15px] leading-[1.7] text-pretty text-(--iu-muted)">
                {status === "success"
                  ? `The next letter leaves Lyon on 4 December and goes to ${email.trim() || defaultEmail}.`
                  : "New inks before they reach the shop, the tuner's notes and the atelier's open days. Nothing in between."}
              </p>
            </div>
            <div className="flex flex-col justify-end">
              {status === "success" ? (
                <div>
                  <motion.span
                    aria-hidden="true"
                    initial={reduceMotion || !submitted ? false : { scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.5, ease: EASE }}
                    className="block h-px origin-left bg-(--iu-accent)"
                  />
                  <p className="mt-5 flex items-center gap-3 font-serif text-xl italic">
                    <Check size={18} strokeWidth={1.25} aria-hidden="true" />
                    Subscribed
                  </p>
                  <p className="mt-2 text-[13px] text-(--iu-muted)">
                    Every letter ends with a one-click unsubscribe link.
                  </p>
                </div>
              ) : (
                <form noValidate onSubmit={submit}>
                  <label htmlFor={`${uid}-email`} className={cx(LABEL, "text-(--iu-muted)")}>
                    Email address
                  </label>
                  <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end">
                    <input
                      id={`${uid}-email`}
                      type="email"
                      name="email"
                      autoComplete="email"
                      inputMode="email"
                      value={email}
                      readOnly={loading}
                      aria-invalid={problem ? true : undefined}
                      aria-describedby={`${uid}-help`}
                      onChange={(event) => {
                        setEmail(event.target.value);
                        if (problem) setProblem("");
                      }}
                      placeholder="name@studio.fr"
                      className={cx(
                        "h-12 min-w-0 flex-1 border-0 border-b bg-transparent px-0 font-serif text-xl text-(--iu-foreground) placeholder:text-(--iu-muted) focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--iu-accent)",
                        problem ? "border-red-700 dark:border-red-400" : "border-(--iu-foreground)/45",
                      )}
                    />
                    <button
                      type="submit"
                      aria-disabled={loading || undefined}
                      className={cx(PILL, "grid shrink-0 px-7", loading && "cursor-progress")}
                    >
                      <span className={cx("col-start-1 row-start-1", loading && "invisible")}>
                        {status === "error" ? "Try again" : "Subscribe"}
                      </span>
                      <span className={cx("col-start-1 row-start-1 inline-flex items-center", !loading && "invisible")}>
                        Sending
                      </span>
                    </button>
                  </div>
                  <div className="relative mt-[-1px] h-px overflow-hidden" aria-hidden="true">
                    {loading ? (
                      <motion.span
                        data-loading-line
                        initial={reduceMotion ? false : { scaleX: 0.08 }}
                        animate={{ scaleX: 0.86 }}
                        transition={{ duration: reduceMotion ? 0 : 2.4, ease: "easeOut" }}
                        className="block h-px origin-left bg-(--iu-accent)"
                      />
                    ) : null}
                  </div>
                  <p
                    id={`${uid}-help`}
                    aria-live="polite"
                    className="mt-3 min-h-[40px] text-[13px] leading-relaxed text-pretty"
                  >
                    {message ? (
                      <span className="flex items-start gap-2 text-red-700 dark:text-red-400">
                        <CircleAlert size={16} strokeWidth={1.5} aria-hidden="true" className="mt-0.5 shrink-0" />
                        {message}
                      </span>
                    ) : (
                      <span className="text-(--iu-muted)">
                        {loading
                          ? "Adding you to the list."
                          : "One letter a month. Unsubscribe from any of them in one click."}
                      </span>
                    )}
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer({ brand, groups }: { brand: string; groups: VaurelLinkGroup[] }) {
  const link = cx(
    "inline-flex min-h-8 items-center text-[14px] text-(--iu-foreground)/80 transition-colors duration-300 motion-reduce:transition-none pointer-fine:hover:text-(--iu-foreground)",
    FOCUS,
  );
  return (
    <footer className="border-t border-(--iu-border)">
      <div className="mx-auto max-w-[1280px] px-5 pt-16 pb-10 sm:px-8 lg:px-10 lg:pt-20">
        <div className="grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-6">
          <div className="col-span-2">
            <p className="font-serif text-5xl leading-none">{brand}</p>
            <address className="mt-6 text-[14px] leading-[1.7] text-(--iu-muted) not-italic">
              Atelier and shop
              <br />
              27 quai Saint-Vincent, 69001 Lyon
              <br />
              Tuesday to Saturday, 10:00 to 18:30
              <br />
              <a href="tel:+33472411806" className={cx("text-(--iu-foreground)/80 tabular-nums", FOCUS)}>
                +33 4 72 41 18 06
              </a>
            </address>
          </div>
          {groups.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <p className={cx(LABEL, "text-(--iu-muted)")}>{group.title}</p>
              <ul className="mt-4 space-y-[calc(4px*var(--iu-density))]">
                {group.links.map((item) => (
                  <li key={item.href}>
                    <a href={item.href} className={link}>
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="mt-16 flex flex-col gap-4 border-t border-(--iu-border) pt-6 text-[12px] text-(--iu-muted) md:flex-row md:items-center md:justify-between">
          <p>© 2026 {brand} SAS, Lyon. Prices include French VAT.</p>
          <ul className="flex flex-wrap gap-x-6 gap-y-1">
            {["Privacy", "Terms of sale", "Cookies", "Legal notice"].map((label) => (
              <li key={label}>
                <a
                  href={`#${label.toLowerCase().replace(/\s+/g, "-")}`}
                  className={cx("inline-flex min-h-8 items-center", FOCUS)}
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}

export function VaurelPenHouse({
  brand = "Vaurel",
  announcement = "Every pen is tuned to your hand before it leaves Lyon",
  menus = DEFAULT_MENUS,
  links = DEFAULT_LINKS,
  defaultBagCount = 0,
  defaultMenuOpen = false,
  headline = "A pen tuned to your hand.",
  emphasis = "your hand",
  subline = "The No. 31 is turned from ebonite in our Lyon atelier and fitted with an 18k nib ground to one of five grades. Choose yours and see the line it writes.",
  ctaLabel = "Order the No. 31",
  ctaHref = "#no-31",
  ctaNote = "€690 · tuning included for life",
  nibs = DEFAULT_NIBS,
  defaultNib = "m",
  pieces = DEFAULT_PIECES,
  steps = DEFAULT_STEPS,
  services = DEFAULT_SERVICES,
  defaultService = "tune",
  journal = DEFAULT_JOURNAL,
  footerGroups = DEFAULT_FOOTER,
  defaultEmail = "",
  newsletterStatus,
  onNavigate,
  onAddToBag,
  onOpenBag,
  onOpenAccount,
  onSelectNib,
  onBookService,
  onSubscribe,
  className = "",
}: VaurelPenHouseProps) {
  const reduceMotion = useReducedMotion();
  const [bagCount, setBagCount] = useState(defaultBagCount);
  const [announce, setAnnounce] = useState("");
  return (
    <MotionConfig reducedMotion="user" transition={reduceMotion ? { duration: 0 } : { duration: 0.4, ease: EASE }}>
      <div
        id="top"
        className={cx("bg-(--iu-background) font-(family-name:--iu-font) text-(--iu-foreground)", className)}
      >
        <StoreHeader
          defaultMenuOpen={defaultMenuOpen}
          brand={brand}
          announcement={announcement}
          menus={menus}
          links={links}
          bagCount={bagCount}
          onNavigate={onNavigate}
          onOpenBag={onOpenBag}
          onOpenAccount={onOpenAccount}
        />
        <main>
          <Hero
            headline={headline}
            emphasis={emphasis}
            subline={subline}
            ctaLabel={ctaLabel}
            ctaHref={ctaHref}
            ctaNote={ctaNote}
            nibs={nibs}
            defaultNib={defaultNib}
            onNavigate={onNavigate}
            onSelectNib={onSelectNib}
          />
          <Collection
            pieces={pieces}
            onAdd={(piece) => {
              setBagCount((count) => count + 1);
              setAnnounce(`${piece.name} added to your bag.`);
              onAddToBag?.(piece.id);
            }}
          />
          <Craft steps={steps} />
          <Service services={services} defaultService={defaultService} onBook={onBookService} />
          <Journal entries={journal} />
          <Newsletter defaultEmail={defaultEmail} status={newsletterStatus} onSubscribe={onSubscribe} />
        </main>
        <Footer brand={brand} groups={footerGroups} />
        <p data-announce aria-live="polite" className="sr-only">
          {announce}
        </p>
      </div>
    </MotionConfig>
  );
}

export default VaurelPenHouse;
