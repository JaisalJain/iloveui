"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { AnimatePresence, MotionConfig, motion, useInView, useReducedMotion } from "motion/react";
import { Check, CircleAlert, Minus, Plus, ShoppingBag, X } from "lucide-react";

export type AtelierFinish = {
  id: string;
  name: string;
  /** Any CSS color: case, lugs, crown, hands and strap lines of the drawing, and the swatch ring. */
  tone: string;
  /** Dial lines and the swatch center. Defaults to `tone`. */
  dialTone?: string;
};

export type AtelierSize = {
  id: string;
  label: string;
  /** Case diameter in millimetres. The drawing is drawn at 38 mm and scales to this. */
  diameter: number;
  thickness: string;
  fit: string;
};

export type AtelierVariant = {
  /** The SKU. */
  id: string;
  finishId: string;
  sizeId: string;
  price: number;
  /** The original price when the variant is discounted. */
  compareAtPrice?: number;
  stock: number;
  /** Why a sold-out variant is unavailable, shown beside it. */
  soldOutReason?: string;
};

export type AtelierDetail = { label: string; value: string };

export type AtelierProduct = {
  name: string;
  kicker: string;
  summary: string;
  /** Names the discount on compare-at prices, on the page and in the bag summary. */
  saleLabel: string;
  saleNote: string;
  finishes: AtelierFinish[];
  sizes: AtelierSize[];
  variants: AtelierVariant[];
  details: AtelierDetail[];
};

export type AtelierBagLine = {
  id: string;
  name: string;
  detail: string;
  price: number;
  compareAtPrice?: number;
  quantity: number;
  maxQuantity: number;
  thumbnail: "watch" | "strap";
  tone?: string;
  dialTone?: string;
};

export type AtelierTotals = {
  pieces: number;
  subtotal: number;
  saleDiscount: number;
  codeDiscount: number;
  shipping: number;
  tax: number;
  total: number;
  code?: string;
};

export type AtelierCodeResult = { ok: true; code: string; percentOff: number } | { ok: false; message: string };

export type AtelierProductPageProps = {
  /** Wordmark in the header. */
  maison?: string;
  product?: AtelierProduct;
  initialFinishId?: string;
  initialSizeId?: string;
  /** Lines already in the bag. */
  bag?: AtelierBagLine[];
  defaultBagOpen?: boolean;
  /** Marks a line as just added, for example after an add that happened on the server. */
  highlightLineId?: string;
  /** Set it to drive the add-to-bag request yourself; leave it unset to follow the promise from onAddToBag. */
  status?: "idle" | "loading" | "error";
  errorMessage?: string;
  currency?: string;
  locale?: string;
  taxRate?: number;
  taxLabel?: string;
  /** The most pieces of one variant a client can hold. */
  perClientLimit?: number;
  /** Codes and their percentage off, used when validateCode is not set. */
  discountCodes?: Record<string, number>;
  validateCode?: (code: string) => AtelierCodeResult | Promise<AtelierCodeResult>;
  checkoutHref?: string;
  onAddToBag?: (line: AtelierBagLine, variant: AtelierVariant) => void | Promise<void>;
  onBagChange?: (lines: AtelierBagLine[]) => void;
  onBagOpenChange?: (open: boolean) => void;
  onCheckout?: (lines: AtelierBagLine[], totals: AtelierTotals) => void;
  className?: string;
};

export const atelierProduct: AtelierProduct = {
  name: "Méridienne",
  kicker: "Maison Orvanne · Automatic",
  summary:
    "A self-winding watch with a 72-hour reserve, assembled and regulated by hand in our Geneva atelier, then worn for ten days before it leaves.",
  saleLabel: "Archive event",
  saleNote: "Archive price until 30 November",
  finishes: [
    { id: "steel", name: "Steel", tone: "var(--atelier-steel)" },
    { id: "graphite", name: "Graphite", tone: "var(--atelier-graphite)" },
    { id: "lacquer", name: "Lacquer", tone: "var(--atelier-steel)", dialTone: "var(--atelier-lacquer)" },
  ],
  sizes: [
    { id: "34", label: "34 mm", diameter: 34, thickness: "9.6 mm", fit: "Fits wrists 13.5 to 16 cm" },
    { id: "38", label: "38 mm", diameter: 38, thickness: "10.4 mm", fit: "Fits wrists 15 to 18 cm" },
    { id: "41", label: "41 mm", diameter: 41, thickness: "11.2 mm", fit: "Fits wrists 16.5 to 20 cm" },
  ],
  variants: [
    { id: "OV-3801-ST-34", finishId: "steel", sizeId: "34", price: 2176, compareAtPrice: 2560, stock: 8 },
    { id: "OV-3801-ST-38", finishId: "steel", sizeId: "38", price: 2176, compareAtPrice: 2560, stock: 12 },
    {
      id: "OV-3801-ST-41",
      finishId: "steel",
      sizeId: "41",
      price: 2176,
      compareAtPrice: 2560,
      stock: 0,
      soldOutReason: "The next pieces leave the atelier on 14 January.",
    },
    {
      id: "OV-3801-GR-34",
      finishId: "graphite",
      sizeId: "34",
      price: 2414,
      compareAtPrice: 2840,
      stock: 0,
      soldOutReason: "Graphite is no longer made in 34 mm.",
    },
    { id: "OV-3801-GR-38", finishId: "graphite", sizeId: "38", price: 2414, compareAtPrice: 2840, stock: 2 },
    { id: "OV-3801-GR-41", finishId: "graphite", sizeId: "41", price: 2414, compareAtPrice: 2840, stock: 5 },
    { id: "OV-3801-LQ-34", finishId: "lacquer", sizeId: "34", price: 3120, stock: 4 },
    { id: "OV-3801-LQ-38", finishId: "lacquer", sizeId: "38", price: 3120, stock: 1 },
    {
      id: "OV-3801-LQ-41",
      finishId: "lacquer",
      sizeId: "41",
      price: 3120,
      stock: 0,
      soldOutReason: "Lacquer dials in 41 mm are made to order from February.",
    },
  ],
  details: [
    {
      label: "Delivery",
      value: "Complimentary and insured. Order today to receive it between Thu 29 Oct and Mon 2 Nov.",
    },
    { label: "Returns", value: "Within 30 days, collected from your door at no cost." },
    { label: "Warranty", value: "Five years, with servicing at our Geneva atelier." },
  ],
};

export const atelierBag: AtelierBagLine[] = [
  {
    id: "OV-ST-INK-20",
    name: "Calfskin strap",
    detail: "Ink · 20 mm · quick release",
    price: 260,
    quantity: 1,
    maxQuantity: 3,
    thumbnail: "strap",
    tone: "var(--atelier-steel)",
  },
];

const DEFAULT_CODES: Record<string, number> = { ATELIER10: 10 };

const EASE: [number, number, number, number] = [0.2, 0.8, 0.2, 1];
const LOW_STOCK = 3;
const CODE_PATTERN = /^[A-Z0-9-]{4,16}$/;
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

// The drawing: a 600 x 750 plate with the case centred at (300, 375), drawn at 38 mm.
const VIEW_W = 600;
const VIEW_H = 750;
const CX = 300;
const CY = 375;
const BASE_DIAMETER = 38;

const r2 = (value: number) => Math.round(value * 100) / 100;
const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(" ");

function polar(radius: number, degrees: number, cx = CX, cy = CY) {
  const radians = ((degrees - 90) * Math.PI) / 180;
  return { x: r2(cx + radius * Math.cos(radians)), y: r2(cy + radius * Math.sin(radians)) };
}

function arc(radius: number, start: number, end: number) {
  const a = polar(radius, start);
  const b = polar(radius, end);
  return `M ${a.x} ${a.y} A ${radius} ${radius} 0 0 1 ${b.x} ${b.y}`;
}

/** A tapered lug that leaves the case on a curve and ends in a rounded tip beside the strap. */
function lug(flipX: boolean, flipY: boolean) {
  const x = (value: number) => r2(flipX ? VIEW_W - value : value);
  const y = (value: number) => r2(flipY ? VIEW_H - value : value);
  return `M ${x(192)} ${y(270.79)} C ${x(197.5)} ${y(254)} ${x(203.5)} ${y(234)} ${x(205.6)} ${y(214)} Q ${x(206.6)} ${y(204.5)} ${x(213.2)} ${y(204.5)} Q ${x(220.8)} ${y(204.5)} ${x(221)} ${y(212)} L ${x(221)} ${y(247.49)}`;
}

function dauphine(length: number, width: number, tail: number) {
  const shoulder = r2(CY - length * 0.11);
  return {
    outline: `M ${CX} ${CY - length} L ${CX + width} ${shoulder} L ${CX} ${CY + tail} L ${CX - width} ${shoulder} Z`,
    facet: `M ${CX} ${CY - length} L ${CX + width} ${shoulder} L ${CX} ${CY + tail} Z`,
    ridge: `M ${CX} ${CY - length} L ${CX} ${CY + tail}`,
  };
}

const LUGS = [lug(false, false), lug(true, false), lug(false, true), lug(true, true)];
const STRAP = [
  "M 223 246.27 L 227.5 0",
  "M 377 246.27 L 372.5 0",
  "M 223 503.73 L 227.5 750",
  "M 377 503.73 L 372.5 750",
];
const STITCHES = ["M 230.7 236 L 235 0", "M 369.3 236 L 365 0", "M 230.7 514 L 235 750", "M 369.3 514 L 365 750"];
const HOLES = [616, 640, 664, 688];
const MINUTE_TICKS = Array.from({ length: 60 }, (_, index) => {
  const major = index % 5 === 0;
  return { major, from: polar(major ? 120.5 : 124.5, index * 6), to: polar(129, index * 6) };
});
const RAYS = Array.from({ length: 72 }, (_, index) => ({ from: polar(13, index * 5), to: polar(53, index * 5) }));
const HOURS = [1, 2, 3, 4, 5, 7, 8, 9, 10, 11];
const SUB = { x: CX, y: CY + 68, r: 26 };
const SUB_TICKS = Array.from({ length: 12 }, (_, index) => {
  const major = index % 3 === 0;
  return { major, from: polar(major ? 18.5 : 21.5, index * 30, SUB.x, SUB.y), to: polar(25, index * 30, SUB.x, SUB.y) };
});
const HOUR_HAND = dauphine(88, 5.4, 13);
const MINUTE_HAND = dauphine(121, 4.6, 17);
const CALLOUTS = [
  { label: "Sapphire crystal", anchor: polar(136.5, 304), elbow: { x: 128, y: 236 }, end: 44 },
  { label: "Applied indices", anchor: polar(114, 60), elbow: { x: 472, y: 236 }, end: 556 },
  { label: "Small seconds", anchor: { x: SUB.x + SUB.r, y: SUB.y }, elbow: { x: 472, y: 528 }, end: 556 },
  { label: "Hand-stitched calfskin", anchor: { x: 232.4, y: 612 }, elbow: { x: 232.4, y: 612 }, end: 44 },
];

function useFade(duration: number) {
  const reduceMotion = useReducedMotion();
  return reduceMotion ? { duration: 0 } : { duration, ease: EASE };
}

function money(value: number, locale: string, currency: string, cents: boolean) {
  const digits = cents || !Number.isInteger(value) ? 2 : 0;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

function variantFor(product: AtelierProduct, finishId: string, sizeId: string) {
  return product.variants.find((variant) => variant.finishId === finishId && variant.sizeId === sizeId);
}

function inStock(product: AtelierProduct, finishId: string, sizeId: string) {
  return (variantFor(product, finishId, sizeId)?.stock ?? 0) > 0;
}

/** The wanted size when it is in stock in this finish, otherwise the nearest size that is. */
function pickSize(product: AtelierProduct, finishId: string, wantedId: string) {
  if (inStock(product, finishId, wantedId)) return wantedId;
  const wanted = Math.max(
    0,
    product.sizes.findIndex((size) => size.id === wantedId),
  );
  const candidates = product.sizes
    .map((size, index) => ({ size, distance: Math.abs(index - wanted) }))
    .filter(({ size }) => inStock(product, finishId, size.id))
    .sort((a, b) => a.distance - b.distance);
  return candidates[0]?.size.id ?? wantedId;
}

function totalsFor(lines: AtelierBagLine[], percentOff: number, taxRate: number, code?: string): AtelierTotals {
  let pieces = 0;
  let subtotal = 0;
  let saleDiscount = 0;
  for (const line of lines) {
    const listed = line.compareAtPrice ?? line.price;
    pieces += line.quantity;
    subtotal += listed * line.quantity;
    saleDiscount += (listed - line.price) * line.quantity;
  }
  const codeDiscount = r2(((subtotal - saleDiscount) * percentOff) / 100);
  const taxable = r2(subtotal - saleDiscount - codeDiscount);
  const tax = r2(taxable * taxRate);
  return { pieces, subtotal, saleDiscount, codeDiscount, shipping: 0, tax, total: r2(taxable + tax), code };
}

function pieceCount(count: number) {
  return `${count} ${count === 1 ? "piece" : "pieces"}`;
}

/** Cross-fades its content whenever swapKey changes; the old and new copies share one grid cell. */
function useCrossFade() {
  const enter = useFade(0.42);
  const leave = useFade(0.16);
  return {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: enter },
    exit: { opacity: 0, transition: leave },
  };
}

function Swap({
  swapKey,
  part,
  children,
  className,
}: {
  swapKey: string;
  part?: string;
  children: ReactNode;
  className?: string;
}) {
  const fade = useCrossFade();
  return (
    <span data-part={part} className={cx("inline-grid *:[grid-area:1/1]", className)}>
      <AnimatePresence initial={false}>
        <motion.span key={swapKey} {...fade}>
          {children}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function WatchDrawing({ finish, size, label }: { finish: AtelierFinish; size: AtelierSize; label: string }) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const transition = useFade(0.26);
  const scale = r2(size.diameter / BASE_DIAMETER);
  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label={label}
      data-part="drawing"
      fill="none"
      stroke="currentColor"
      strokeWidth={1}
      className="absolute inset-0 size-full transition-[color] duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] **:[vector-effect:non-scaling-stroke] motion-reduce:transition-none"
      style={{ color: finish.tone }}
    >
      <defs>
        <linearGradient id={`${uid}-fade`} x1="0" y1="0" x2="0" y2={VIEW_H} gradientUnits="userSpaceOnUse">
          <stop offset="0.02" stopColor="white" stopOpacity="0" />
          <stop offset="0.24" stopColor="white" />
          <stop offset="0.76" stopColor="white" />
          <stop offset="0.98" stopColor="white" stopOpacity="0" />
        </linearGradient>
        <mask id={`${uid}-strap`} maskUnits="userSpaceOnUse" x="0" y="0" width={VIEW_W} height={VIEW_H}>
          <rect width={VIEW_W} height={VIEW_H} fill={`url(#${uid}-fade)`} stroke="none" />
        </mask>
      </defs>
      <AnimatePresence initial={false} mode="wait">
        <motion.g
          key={size.id}
          data-part="figure"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={transition}
        >
          <g data-part="scale" transform={`translate(${CX} ${CY}) scale(${scale}) translate(${-CX} ${-CY})`}>
            <g mask={`url(#${uid}-strap)`}>
              {STRAP.map((d) => (
                <path key={d} d={d} />
              ))}
              {STITCHES.map((d) => (
                <path key={d} d={d} strokeDasharray="3 3.5" strokeOpacity={0.6} strokeWidth={0.75} />
              ))}
              {HOLES.map((y) => (
                <circle key={y} cx={CX} cy={y} r={2.6} strokeWidth={0.75} />
              ))}
            </g>

            {LUGS.map((d) => (
              <path key={d} d={d} strokeLinejoin="round" />
            ))}
            <circle cx={CX} cy={CY} r={150} strokeWidth={1.25} />
            <circle cx={CX} cy={CY} r={141} />
            <circle cx={CX} cy={CY} r={136.5} strokeOpacity={0.45} strokeWidth={0.75} />
            <path d={arc(145.5, 292, 338)} strokeOpacity={0.75} strokeWidth={1.5} strokeLinecap="round" />
            <path d={arc(145.5, 112, 158)} strokeOpacity={0.35} strokeWidth={1.5} strokeLinecap="round" />
            <rect x={449.5} y={CY - 5.5} width={3.5} height={11} />
            <rect x={453} y={CY - 13} width={16} height={26} rx={3} />
            {[457, 461, 465].map((x) => (
              <path key={x} d={`M ${x} ${CY - 10.5} L ${x} ${CY + 10.5}`} strokeOpacity={0.5} strokeWidth={0.75} />
            ))}

            <g
              data-part="dial"
              className="transition-[color] duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none"
              style={{ color: finish.dialTone ?? finish.tone }}
            >
              <circle
                data-part="wash"
                cx={CX}
                cy={CY}
                r={132}
                className="fill-current"
                fillOpacity={finish.dialTone ? 0.12 : 0.05}
              />
              <circle cx={CX} cy={CY} r={129} strokeOpacity={0.8} strokeWidth={0.75} />
              <circle cx={CX} cy={CY} r={124.5} strokeOpacity={0.5} strokeWidth={0.75} />
              {MINUTE_TICKS.map((tick) => (
                <line
                  key={`${tick.from.x}-${tick.from.y}`}
                  x1={tick.from.x}
                  y1={tick.from.y}
                  x2={tick.to.x}
                  y2={tick.to.y}
                  strokeWidth={tick.major ? 1 : 0.75}
                  strokeOpacity={tick.major ? 1 : 0.7}
                />
              ))}
              {RAYS.map((ray) => (
                <line
                  key={`${ray.to.x}-${ray.to.y}`}
                  x1={ray.from.x}
                  y1={ray.from.y}
                  x2={ray.to.x}
                  y2={ray.to.y}
                  strokeOpacity={0.2}
                  strokeWidth={0.75}
                />
              ))}
              <circle cx={CX} cy={CY} r={56} strokeOpacity={0.45} strokeWidth={0.75} />
              {HOURS.map((hour) => (
                <rect
                  key={hour}
                  x={CX - 1.8}
                  y={CY - 114}
                  width={3.6}
                  height={18}
                  rx={0.6}
                  transform={`rotate(${hour * 30} ${CX} ${CY})`}
                />
              ))}
              <rect x={CX - 5.8} y={CY - 116} width={3.6} height={20} rx={0.6} />
              <rect x={CX + 2.2} y={CY - 116} width={3.6} height={20} rx={0.6} />
              <text
                x={CX + 1.8}
                y={CY - 70}
                textAnchor="middle"
                fontSize={13}
                letterSpacing={3.6}
                stroke="none"
                className="fill-current font-serif"
              >
                ORVANNE
              </text>
              <text
                x={CX + 1.3}
                y={CY - 60}
                textAnchor="middle"
                fontSize={5.2}
                letterSpacing={2.6}
                stroke="none"
                fillOpacity={0.8}
                className="fill-current"
              >
                GENÈVE
              </text>
              <circle cx={SUB.x} cy={SUB.y} r={SUB.r} className="fill-(--atelier-plate)" />
              <circle
                data-part="wash"
                cx={SUB.x}
                cy={SUB.y}
                r={SUB.r}
                stroke="none"
                className="fill-current"
                fillOpacity={finish.dialTone ? 0.12 : 0.05}
              />
              <circle cx={SUB.x} cy={SUB.y} r={21.5} strokeOpacity={0.5} strokeWidth={0.75} />
              {[4, 8, 12, 16].map((radius) => (
                <circle key={radius} cx={SUB.x} cy={SUB.y} r={radius} strokeOpacity={0.25} strokeWidth={0.75} />
              ))}
              {SUB_TICKS.map((tick) => (
                <line
                  key={`${tick.to.x}-${tick.to.y}`}
                  x1={tick.from.x}
                  y1={tick.from.y}
                  x2={tick.to.x}
                  y2={tick.to.y}
                  strokeWidth={0.75}
                />
              ))}
            </g>

            {[
              { hand: HOUR_HAND, angle: 304.8 },
              { hand: MINUTE_HAND, angle: 57.6 },
            ].map(({ hand, angle }) => (
              <g key={angle} transform={`rotate(${angle} ${CX} ${CY})`}>
                <path d={hand.outline} strokeLinejoin="round" className="fill-(--atelier-plate)" />
                <path d={hand.facet} stroke="none" className="fill-current" fillOpacity={0.2} />
                <path d={hand.ridge} strokeOpacity={0.55} strokeWidth={0.75} />
              </g>
            ))}
            <circle cx={CX} cy={CY} r={5} className="fill-(--atelier-plate)" />
            <circle cx={CX} cy={CY} r={1.6} stroke="none" className="fill-current" />
            <g className="text-(--iu-accent)">
              <path
                d={`M ${SUB.x} ${SUB.y + 6} L ${SUB.x} ${SUB.y - 22}`}
                transform={`rotate(216 ${SUB.x} ${SUB.y})`}
                strokeLinecap="round"
              />
              <circle cx={SUB.x} cy={SUB.y} r={1.8} stroke="none" className="fill-current" />
            </g>

            <g className="text-(--atelier-caption) max-sm:hidden" strokeWidth={0.75}>
              {CALLOUTS.map((callout) => (
                <g key={callout.label}>
                  <path
                    d={`M ${callout.anchor.x} ${callout.anchor.y} L ${callout.elbow.x} ${callout.elbow.y} H ${callout.end}`}
                    strokeOpacity={0.7}
                  />
                  <circle cx={callout.anchor.x} cy={callout.anchor.y} r={2} stroke="none" className="fill-current" />
                  <text
                    x={callout.end}
                    y={callout.elbow.y - 7}
                    textAnchor={callout.end < CX ? "start" : "end"}
                    fontSize={8.5}
                    letterSpacing={1.8}
                    stroke="none"
                    className="fill-current uppercase"
                  >
                    {callout.label}
                  </text>
                </g>
              ))}
            </g>
          </g>
        </motion.g>
      </AnimatePresence>
    </svg>
  );
}

/** A small face-on drawing for bag lines: a watch head, or a strap with its buckle. */
function Thumbnail({ line }: { line: AtelierBagLine }) {
  return (
    <svg
      viewBox="140 155 320 440"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth={1}
      className="size-full **:[vector-effect:non-scaling-stroke]"
      style={{ color: line.tone ?? "var(--atelier-steel)" }}
    >
      {line.thumbnail === "strap" ? (
        <>
          <path d="M 246 155 L 246 595 M 354 155 L 354 595" />
          <path d="M 256 155 L 256 595 M 344 155 L 344 595" strokeDasharray="3 3.5" strokeOpacity={0.6} />
          <rect x={226} y={262} width={148} height={46} rx={14} />
          <path d="M 300 262 L 300 338" strokeLinecap="round" />
          <rect x={238} y={346} width={124} height={14} rx={2} />
          {[420, 452, 484, 516].map((y) => (
            <ellipse key={y} cx={300} cy={y} rx={4} ry={5.5} />
          ))}
        </>
      ) : (
        <>
          <path d="M 223 246.27 L 226 155 M 377 246.27 L 374 155 M 223 503.73 L 226 595 M 377 503.73 L 374 595" />
          {LUGS.map((d) => (
            <path key={d} d={d} strokeLinejoin="round" />
          ))}
          <circle cx={CX} cy={CY} r={150} />
          <circle cx={CX} cy={CY} r={141} strokeOpacity={0.6} />
          <rect x={453} y={CY - 13} width={16} height={26} rx={3} />
          <g style={{ color: line.dialTone ?? line.tone ?? "var(--atelier-steel)" }}>
            <circle cx={CX} cy={CY} r={132} className="fill-current" fillOpacity={0.08} />
            {[0, 30, 60, 90, 120, 150, 210, 240, 270, 300, 330].map((angle) => {
              const from = polar(100, angle);
              const to = polar(120, angle);
              return <line key={angle} x1={from.x} y1={from.y} x2={to.x} y2={to.y} />;
            })}
            <circle cx={SUB.x} cy={SUB.y} r={SUB.r} strokeOpacity={0.7} />
          </g>
          <path
            d={`M ${CX} ${CY} L ${polar(84, 304.8).x} ${polar(84, 304.8).y}`}
            strokeWidth={1.5}
            strokeLinecap="round"
          />
          <path
            d={`M ${CX} ${CY} L ${polar(118, 57.6).x} ${polar(118, 57.6).y}`}
            strokeWidth={1.5}
            strokeLinecap="round"
          />
        </>
      )}
    </svg>
  );
}

/** An open presentation box with nothing on its cushion. */
function EmptyBox({ maison }: { maison: string }) {
  return (
    <svg
      viewBox="0 0 160 120"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth={1}
      className="h-30 w-40 text-(--iu-muted)"
    >
      <path d="M 27 60 L 33 10 L 127 10 L 133 60" strokeLinejoin="round" />
      <path d="M 34 56 L 39 16 L 121 16 L 126 56" strokeOpacity={0.4} strokeLinejoin="round" />
      <text
        x={81}
        y={38}
        textAnchor="middle"
        fontSize={7.5}
        letterSpacing={2.4}
        stroke="none"
        className="fill-current font-serif uppercase"
      >
        {maison}
      </text>
      <path d="M 66 44 L 96 44" strokeOpacity={0.4} />
      <rect x={20} y={60} width={120} height={42} rx={1.5} />
      <path d="M 20 70 L 140 70" strokeOpacity={0.4} />
      <path d="M 56 70 C 56 58 104 58 104 70" />
      <path d="M 80 61 L 80 70" strokeOpacity={0.6} />
      <path d="M 12 108 L 148 108" strokeOpacity={0.3} />
    </svg>
  );
}

function Spinner() {
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref);
  return (
    <svg
      ref={ref}
      viewBox="0 0 16 16"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.25}
      className="size-4 animate-spin [animation-duration:1.4s] motion-reduce:animate-none"
      style={{ animationPlayState: inView ? "running" : "paused" }}
    >
      <circle cx="8" cy="8" r="6.5" strokeOpacity={0.3} />
      <path d="M 8 1.5 A 6.5 6.5 0 0 1 14.5 8" strokeLinecap="round" />
    </svg>
  );
}

const LABEL = "text-[11px] font-medium tracking-[0.2em] text-(--iu-muted) uppercase";
const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--iu-accent)";
const INK_PILL = `inline-flex items-center justify-center gap-3 rounded-full bg-(--iu-foreground) text-xs font-medium tracking-[0.18em] text-(--iu-background) uppercase transition-colors duration-300 motion-reduce:transition-none ${FOCUS}`;

type CodeState =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "error"; message: string }
  | { kind: "applied"; code: string; percentOff: number };

export function AtelierProductPage({
  maison = "Orvanne",
  product = atelierProduct,
  initialFinishId,
  initialSizeId,
  bag = atelierBag,
  defaultBagOpen = false,
  highlightLineId,
  status,
  errorMessage,
  currency = "USD",
  locale = "en-US",
  taxRate = 0.08875,
  taxLabel = "Estimated tax · NY",
  perClientLimit = 3,
  discountCodes = DEFAULT_CODES,
  validateCode,
  checkoutHref = "#checkout",
  onAddToBag,
  onBagChange,
  onBagOpenChange,
  onCheckout,
  className = "",
}: AtelierProductPageProps) {
  const reduceMotion = useReducedMotion();
  const fade = useCrossFade();
  const uid = useId();
  const titleId = `${uid}title`;
  const finishName = `${uid}finish`;
  const sizeName = `${uid}size`;
  const qtyId = `${uid}qty`;
  const qtyHintId = `${uid}qty-hint`;
  const bagTitleId = `${uid}bag-title`;
  const dialogId = `${uid}bag`;
  const codeId = `${uid}code`;
  const codeHintId = `${uid}code-hint`;

  const [finishId, setFinishId] = useState(() => initialFinishId ?? product.finishes[0]?.id ?? "");
  const [sizeId, setSizeId] = useState(() => {
    const middle = product.sizes[Math.floor(product.sizes.length / 2)]?.id ?? "";
    return initialSizeId ?? pickSize(product, initialFinishId ?? product.finishes[0]?.id ?? "", middle);
  });
  const [quantity, setQuantity] = useState(1);
  const [internalStatus, setInternalStatus] = useState<"idle" | "loading" | "error">("idle");
  const [internalError, setInternalError] = useState<string | null>(null);
  const [dismissedError, setDismissedError] = useState<string | null>(null);
  const [lines, setLines] = useState<AtelierBagLine[]>(bag);
  const [bagOpen, setBagOpen] = useState(defaultBagOpen);
  const [highlight, setHighlight] = useState<{ id: string; fresh: boolean } | null>(
    highlightLineId ? { id: highlightLineId, fresh: true } : null,
  );
  const [codeInput, setCodeInput] = useState("");
  const [codeState, setCodeState] = useState<CodeState>({ kind: "idle" });
  const [announcement, setAnnouncement] = useState("");

  const addRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const codeInputRef = useRef<HTMLInputElement>(null);
  const codeRemoveRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const focusOnOpenRef = useRef(false);
  const wasOpenRef = useRef(defaultBagOpen);
  const linesRef = useRef(lines);
  const openChangeRef = useRef(onBagOpenChange);

  const finish = product.finishes.find((item) => item.id === finishId) ?? product.finishes[0]!;
  const size = product.sizes.find((item) => item.id === sizeId) ?? product.sizes[0]!;
  const variant = variantFor(product, finish.id, size.id);
  const stock = variant?.stock ?? 0;
  const soldOut = stock <= 0;
  const maxQuantity = Math.max(1, Math.min(stock, perClientLimit));
  const qty = Math.min(quantity, maxQuantity);
  const currentStatus = status ?? internalStatus;
  const busy = currentStatus === "loading";

  const format = (value: number, cents = false) => money(value, locale, currency, cents);
  const alternative = soldOut
    ? (() => {
        const sameFinish = pickSize(product, finish.id, size.id);
        if (sameFinish !== size.id) return { finishId: finish.id, sizeId: sameFinish };
        const other = product.finishes.find((item) => inStock(product, item.id, size.id));
        return other ? { finishId: other.id, sizeId: size.id } : null;
      })()
    : null;
  const alternativeLabel = alternative
    ? `${product.finishes.find((item) => item.id === alternative.finishId)?.name ?? ""} ${
        product.sizes.find((item) => item.id === alternative.sizeId)?.label ?? ""
      }`
    : "";
  const errorText =
    currentStatus === "error"
      ? ((status === "error" ? errorMessage : (internalError ?? errorMessage)) ??
        (soldOut
          ? `The last ${finish.name} ${size.label} was reserved by another client a moment ago. Nothing was charged.`
          : "The atelier did not confirm the hold, so nothing was reserved or charged. Please try again."))
      : null;
  const showError = errorText !== null && dismissedError !== errorText;

  const percentOff = codeState.kind === "applied" ? codeState.percentOff : 0;
  const totals = useMemo(
    () => totalsFor(lines, percentOff, taxRate, codeState.kind === "applied" ? codeState.code : undefined),
    [lines, percentOff, taxRate, codeState],
  );
  const bagCount = totals.pieces;

  useEffect(() => {
    linesRef.current = lines;
  }, [lines]);

  useEffect(() => {
    openChangeRef.current = onBagOpenChange;
  }, [onBagOpenChange]);

  // Open: lock the page scroll without a layout shift, close on Escape, and move focus in when a person opened it.
  useEffect(() => {
    if (!bagOpen) return;
    const root = document.documentElement;
    const body = document.body;
    const previous = { overflow: root.style.overflow, padding: body.style.paddingRight };
    const width = root.clientWidth;
    root.style.overflow = "hidden";
    const scrollbar = root.clientWidth - width;
    if (scrollbar > 0) {
      body.style.paddingRight = `${(Number.parseFloat(getComputedStyle(body).paddingRight) || 0) + scrollbar}px`;
    }
    if (focusOnOpenRef.current) panelRef.current?.focus({ preventScroll: true });
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setBagOpen(false);
        setHighlight(null);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      root.style.overflow = previous.overflow;
      body.style.paddingRight = previous.padding;
    };
  }, [bagOpen]);

  // Report open and close, and on close hand focus back to whatever opened the bag.
  useEffect(() => {
    if (wasOpenRef.current !== bagOpen) openChangeRef.current?.(bagOpen);
    if (wasOpenRef.current && !bagOpen) {
      const target = returnFocusRef.current?.isConnected ? returnFocusRef.current : addRef.current;
      target?.focus({ preventScroll: true });
      returnFocusRef.current = null;
      focusOnOpenRef.current = false;
    }
    wasOpenRef.current = bagOpen;
  }, [bagOpen]);

  // A just-added line keeps its accent rule; its tint settles after a moment.
  useEffect(() => {
    if (!highlight?.fresh) return;
    const timer = window.setTimeout(() => setHighlight((current) => current && { ...current, fresh: false }), 2600);
    return () => window.clearTimeout(timer);
  }, [highlight]);

  function updateLines(next: AtelierBagLine[]) {
    setLines(next);
    onBagChange?.(next);
  }

  function openBag(from: HTMLElement | null) {
    returnFocusRef.current = from;
    focusOnOpenRef.current = true;
    setBagOpen(true);
  }

  function closeBag() {
    setBagOpen(false);
    setHighlight(null);
  }

  function describe(nextFinish: AtelierFinish, nextSize: AtelierSize) {
    const next = variantFor(product, nextFinish.id, nextSize.id);
    const nextStock = next?.stock ?? 0;
    const price = next
      ? next.compareAtPrice
        ? `${format(next.price)}, was ${format(next.compareAtPrice)}`
        : format(next.price)
      : "";
    const stockText = nextStock <= 0 ? "Sold out." : nextStock <= LOW_STOCK ? `Only ${nextStock} left.` : "In stock.";
    return `${nextFinish.name}, ${nextSize.label}. ${price}. ${stockText}`;
  }

  function selectFinish(id: string) {
    const nextFinish = product.finishes.find((item) => item.id === id);
    if (!nextFinish) return;
    const nextSizeId = pickSize(product, id, size.id);
    const nextSize = product.sizes.find((item) => item.id === nextSizeId) ?? size;
    setFinishId(id);
    setSizeId(nextSizeId);
    setDismissedError(errorText);
    setAnnouncement(
      `${nextSizeId !== size.id ? `${size.label} is not available in ${nextFinish.name}. ` : ""}${describe(nextFinish, nextSize)}`,
    );
  }

  function selectSize(id: string) {
    const nextSize = product.sizes.find((item) => item.id === id);
    if (!nextSize) return;
    setSizeId(id);
    setDismissedError(errorText);
    setAnnouncement(describe(finish, nextSize));
  }

  function chooseAlternative() {
    if (!alternative) {
      addRef.current?.focus();
      return;
    }
    const nextFinish = product.finishes.find((item) => item.id === alternative.finishId) ?? finish;
    const nextSize = product.sizes.find((item) => item.id === alternative.sizeId) ?? size;
    setFinishId(nextFinish.id);
    setSizeId(nextSize.id);
    setDismissedError(errorText);
    setAnnouncement(describe(nextFinish, nextSize));
    addRef.current?.focus();
  }

  function setQty(value: number) {
    setQuantity(Math.min(maxQuantity, Math.max(1, Number.isFinite(value) ? Math.round(value) : 1)));
  }

  async function addToBag(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !variant || soldOut) return;
    const line: AtelierBagLine = {
      id: variant.id,
      name: product.name,
      detail: `${finish.name} · ${size.label}`,
      price: variant.price,
      compareAtPrice: variant.compareAtPrice,
      quantity: qty,
      maxQuantity,
      thumbnail: "watch",
      tone: finish.tone,
      dialTone: finish.dialTone,
    };
    const trigger = addRef.current;
    setDismissedError(null);
    setInternalError(null);
    setInternalStatus("loading");
    try {
      await onAddToBag?.(line, variant);
    } catch (error) {
      setInternalError(error instanceof Error && error.message ? error.message : null);
      setInternalStatus("error");
      return;
    }
    const current = linesRef.current;
    const existing = current.find((item) => item.id === line.id);
    const merged = existing
      ? { ...existing, quantity: Math.min(existing.quantity + line.quantity, line.maxQuantity) }
      : line;
    updateLines([merged, ...current.filter((item) => item.id !== line.id)]);
    setInternalStatus("idle");
    setHighlight({ id: line.id, fresh: true });
    setQuantity(1);
    openBag(trigger);
  }

  function changeLineQuantity(id: string, delta: number) {
    updateLines(
      lines.map((line) =>
        line.id === id ? { ...line, quantity: Math.min(line.maxQuantity, Math.max(1, line.quantity + delta)) } : line,
      ),
    );
  }

  function removeLine(id: string) {
    const removed = lines.find((line) => line.id === id);
    updateLines(lines.filter((line) => line.id !== id));
    if (highlight?.id === id) setHighlight(null);
    setAnnouncement(removed ? `${removed.name} removed from your bag.` : "");
    panelRef.current?.focus({ preventScroll: true });
  }

  async function applyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = codeInput.trim().toUpperCase();
    if (!code) {
      setCodeState({ kind: "error", message: "Enter a code first." });
      return;
    }
    if (!CODE_PATTERN.test(code)) {
      setCodeState({ kind: "error", message: "Codes are 4 to 16 letters or numbers." });
      return;
    }
    setCodeState({ kind: "checking" });
    const result = validateCode
      ? await validateCode(code)
      : discountCodes[code] !== undefined
        ? { ok: true as const, code, percentOff: discountCodes[code] }
        : {
            ok: false as const,
            message: `${code} isn’t a code we recognise. Check the spelling, or ask your client advisor.`,
          };
    if (result.ok) {
      setCodeState({ kind: "applied", code: result.code, percentOff: result.percentOff });
      setCodeInput("");
      setAnnouncement(`${result.code} applied: ${result.percentOff}% off.`);
      window.requestAnimationFrame(() => codeRemoveRef.current?.focus());
    } else {
      setCodeState({ kind: "error", message: result.message });
    }
  }

  function removeCode() {
    setCodeState({ kind: "idle" });
    setAnnouncement("Discount code removed.");
    window.requestAnimationFrame(() => codeInputRef.current?.focus());
  }

  function trapFocus(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Tab" || !panelRef.current) return;
    const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (item) => item.getClientRects().length > 0,
    );
    const first = items[0];
    const last = items[items.length - 1];
    if (!first || !last) {
      event.preventDefault();
      return;
    }
    const active = document.activeElement;
    if (event.shiftKey && (active === first || active === panelRef.current)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  const saving = variant?.compareAtPrice ? variant.compareAtPrice - variant.price : 0;
  const savingPercent = variant?.compareAtPrice ? Math.round((saving / variant.compareAtPrice) * 100) : 0;
  const soldOutSizes = product.sizes.filter((item) => item.id !== size.id && !inStock(product, finish.id, item.id));
  const reasonId = (id: string) => `${uid}reason-${id}`;

  return (
    <MotionConfig reducedMotion="user" transition={reduceMotion ? { duration: 0 } : { duration: 0.4, ease: EASE }}>
      <div
        data-atelier=""
        data-part="root"
        className={`relative bg-(--iu-background) font-(family-name:--iu-font) text-(--iu-foreground) [--atelier-caption:color-mix(in_oklab,var(--atelier-ink)_66%,var(--atelier-plate))] [--atelier-graphite:color-mix(in_oklab,var(--atelier-ink)_46%,var(--atelier-plate))] [--atelier-ink:var(--iu-background)] [--atelier-lacquer:color-mix(in_oklab,var(--iu-accent)_88%,var(--atelier-ink))] [--atelier-plate:var(--iu-foreground)] [--atelier-steel:color-mix(in_oklab,var(--atelier-ink)_84%,var(--atelier-plate))] dark:[--atelier-ink:var(--iu-foreground)] dark:[--atelier-plate:color-mix(in_oklab,var(--iu-surface)_72%,var(--iu-background))] ${className}`.trim()}
      >
        <div data-part="page" inert={bagOpen}>
          <header className="border-b border-(--iu-border)">
            <div className="mx-auto flex h-16 max-w-[1320px] items-center justify-between gap-6 px-5 sm:px-8 lg:px-12">
              <a
                href="#"
                className={`-mx-1 inline-flex h-10 items-center rounded-[min(var(--iu-radius),2px)] px-1 font-serif text-[22px] tracking-[0.34em] uppercase ${FOCUS}`}
              >
                {maison}
              </a>
              <button
                type="button"
                aria-haspopup="dialog"
                aria-expanded={bagOpen}
                aria-controls={dialogId}
                data-part="bag-button"
                onClick={(event) => openBag(event.currentTarget)}
                className={`-mr-3 inline-flex h-10 items-center gap-2.5 rounded-full px-3 text-xs font-medium tracking-[0.18em] uppercase transition-colors duration-300 motion-reduce:transition-none pointer-fine:hover:bg-(--iu-foreground)/6 ${FOCUS}`}
              >
                <ShoppingBag size={16} strokeWidth={1.5} aria-hidden="true" />
                Bag
                <Swap swapKey={String(bagCount)} part="bag-count" className="tabular-nums">
                  <span aria-hidden="true">({bagCount})</span>
                </Swap>
                <span className="sr-only">, {pieceCount(bagCount)}</span>
              </button>
            </div>
          </header>

          <article aria-labelledby={titleId} className="mx-auto max-w-[1320px] px-5 pb-20 sm:px-8 sm:pb-28 lg:px-12">
            <nav aria-label="Breadcrumb" className="py-4 sm:py-5">
              <ol className={`flex flex-wrap items-center gap-x-3 ${LABEL}`}>
                <li>
                  <a
                    href="#"
                    className={`inline-flex min-h-6 items-center rounded-[min(var(--iu-radius),2px)] transition-colors duration-300 motion-reduce:transition-none pointer-fine:hover:text-(--iu-foreground) ${FOCUS}`}
                  >
                    Watches
                  </a>
                </li>
                <li aria-hidden="true" className="text-(--iu-foreground)/30">
                  /
                </li>
                <li>
                  <span aria-current="page" className="text-(--iu-foreground)">
                    {product.name}
                  </span>
                </li>
              </ol>
            </nav>

            <div className="grid gap-x-16 gap-y-10 lg:grid-cols-[minmax(0,1.22fr)_minmax(0,1fr)]">
              <figure className="-mx-5 self-start sm:mx-0 lg:sticky lg:top-6">
                <div className="relative aspect-square overflow-hidden border-y border-(--iu-border) bg-(--atelier-plate) sm:aspect-[5/4] sm:rounded-[min(var(--iu-radius),2px)] sm:border lg:aspect-[4/5] dark:border-(--iu-foreground)/10">
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-2.5 border border-(--atelier-caption)/25 sm:inset-3"
                  />
                  <WatchDrawing
                    finish={finish}
                    size={size}
                    label={`Line drawing of the ${product.name} in ${finish.name}, ${size.label}, face on.`}
                  />
                  <div className="pointer-events-none absolute inset-x-8 top-8 flex items-start justify-between gap-4 text-[10px] font-medium tracking-[0.22em] text-(--atelier-caption) uppercase tabular-nums max-sm:hidden">
                    <Swap swapKey={variant?.id ?? size.id} part="sku">
                      Ref. {variant?.id ?? "—"}
                    </Swap>
                    <Swap swapKey={size.id} part="dims">
                      Ø {size.diameter} mm · {size.thickness}
                    </Swap>
                  </div>
                </div>
                <figcaption className={`mt-4 text-center ${LABEL}`}>
                  <Swap swapKey={`${finish.id}-${size.id}`} part="shown">
                    Shown in {finish.name}
                    <span className="sm:hidden"> · {size.label}</span>
                  </Swap>
                </figcaption>
              </figure>

              <div className="min-w-0 lg:pt-4">
                <p className={LABEL}>{product.kicker}</p>
                <h1
                  id={titleId}
                  className="mt-4 font-serif text-[clamp(3.5rem,2.6rem+3.4vw,6rem)] leading-[0.92] font-normal tracking-[-0.015em] text-balance"
                >
                  {product.name}
                </h1>
                <p className="mt-6 max-w-[32rem] text-[15px] leading-[1.7] text-pretty text-(--iu-muted)">
                  {product.summary}
                </p>

                <div data-part="price" className="mt-8 grid border-t border-(--iu-border) pt-7 *:[grid-area:1/1]">
                  <AnimatePresence initial={false}>
                    <motion.div key={`${variant?.id ?? size.id}-${soldOut ? "out" : "in"}`} {...fade}>
                      <p className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
                        <span className="font-serif text-[2.75rem] leading-none tracking-[-0.01em] tabular-nums">
                          {variant ? format(variant.price) : "—"}
                        </span>
                        {variant?.compareAtPrice ? (
                          <>
                            <del className="text-[15px] text-(--iu-muted) tabular-nums decoration-1">
                              <span className="sr-only">Was </span>
                              {format(variant.compareAtPrice)}
                            </del>
                            <span className="inline-flex h-6 items-center self-center rounded-full border border-(--iu-accent) px-2.5 text-[10px] font-medium tracking-[0.2em] uppercase tabular-nums">
                              Save {format(saving)} · {savingPercent}%
                            </span>
                          </>
                        ) : null}
                      </p>
                      <p className="mt-3 text-[13px] text-(--iu-muted)">
                        {variant?.compareAtPrice ? product.saleNote : "Full price · new this season"}
                      </p>
                      <p className="mt-5 flex items-start gap-3 text-sm">
                        {soldOut ? (
                          <span aria-hidden="true" className="mt-2.5 h-px w-3 shrink-0 bg-(--iu-foreground)" />
                        ) : stock <= LOW_STOCK ? (
                          <span
                            aria-hidden="true"
                            className="mt-[7px] size-1.5 shrink-0 rounded-full bg-(--iu-accent)"
                          />
                        ) : (
                          <Check size={14} strokeWidth={1.5} aria-hidden="true" className="mt-[3px] shrink-0" />
                        )}
                        <span>
                          {soldOut
                            ? `Sold out in ${finish.name}, ${size.label}.`
                            : stock <= LOW_STOCK
                              ? `Only ${stock} left in ${size.label}`
                              : "In stock, ships within 2 days"}
                          {soldOut && variant?.soldOutReason ? (
                            <span className="text-(--iu-muted)"> {variant.soldOutReason}</span>
                          ) : null}
                        </span>
                      </p>
                    </motion.div>
                  </AnimatePresence>
                </div>

                <form data-part="form" onSubmit={addToBag} noValidate className="mt-9">
                  <fieldset>
                    <legend className="w-full">
                      <span className={`flex items-baseline justify-between ${LABEL}`}>
                        <span>Finish</span>
                        <Swap swapKey={finish.id} part="finish-name" className="text-(--iu-foreground)">
                          {finish.name}
                        </Swap>
                      </span>
                    </legend>
                    <div className="mt-5 flex flex-wrap gap-x-7 gap-y-4">
                      {product.finishes.map((item) => {
                        const available = product.sizes.some((option) => inStock(product, item.id, option.id));
                        return (
                          <label
                            key={item.id}
                            className="group/finish relative flex w-14 cursor-pointer flex-col items-center gap-3 has-disabled:cursor-not-allowed"
                          >
                            <input
                              type="radio"
                              name={finishName}
                              value={item.id}
                              checked={item.id === finish.id}
                              disabled={!available}
                              onChange={() => selectFinish(item.id)}
                              className="peer sr-only"
                            />
                            <span className="grid size-11 place-items-center rounded-full ring-(--iu-foreground) ring-offset-[3px] ring-offset-(--iu-background) transition-shadow duration-300 group-has-checked/finish:ring-1 group-has-focus-visible/finish:outline-2 group-has-focus-visible/finish:outline-offset-[6px] group-has-focus-visible/finish:outline-(--iu-accent) group-has-disabled/finish:opacity-40 motion-reduce:transition-none pointer-fine:group-hover/finish:ring-1 pointer-fine:group-hover/finish:ring-(--iu-foreground)/35 pointer-fine:group-has-checked/finish:group-hover/finish:ring-(--iu-foreground)">
                              <svg viewBox="0 0 44 44" aria-hidden="true" className="size-11">
                                <circle
                                  cx="22"
                                  cy="22"
                                  r="21.5"
                                  className="fill-(--atelier-plate) stroke-(--iu-foreground)/15"
                                />
                                <circle
                                  cx="22"
                                  cy="22"
                                  r="13"
                                  fill="none"
                                  strokeWidth="1.5"
                                  style={{ stroke: item.tone }}
                                />
                                <circle cx="22" cy="22" r="7" style={{ fill: item.dialTone ?? item.tone }} />
                              </svg>
                            </span>
                            <span className="text-xs text-(--iu-muted) transition-colors duration-300 group-has-checked/finish:text-(--iu-foreground) motion-reduce:transition-none">
                              {item.name}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </fieldset>

                  <fieldset className="mt-9">
                    <legend className={LABEL}>Case size</legend>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {product.sizes.map((item) => {
                        const available = inStock(product, finish.id, item.id);
                        const selected = item.id === size.id;
                        return (
                          <label
                            key={item.id}
                            className="group/size relative cursor-pointer has-disabled:cursor-not-allowed"
                          >
                            <input
                              type="radio"
                              name={sizeName}
                              value={item.id}
                              checked={selected}
                              disabled={!available}
                              aria-describedby={!available && !selected ? reasonId(item.id) : undefined}
                              onChange={() => selectSize(item.id)}
                              className="peer sr-only"
                            />
                            <span className="inline-flex h-10 min-w-[4.75rem] items-center justify-center rounded-full border border-(--iu-foreground)/35 px-4 text-[13px] tabular-nums transition-colors duration-300 group-has-checked/size:border-(--iu-foreground) group-has-checked/size:bg-(--iu-foreground) group-has-checked/size:text-(--iu-background) group-has-focus-visible/size:outline-2 group-has-focus-visible/size:outline-offset-2 group-has-focus-visible/size:outline-(--iu-accent) group-has-disabled/size:border-dashed group-has-disabled/size:text-(--iu-muted) group-has-disabled/size:line-through group-has-[:disabled:checked]/size:border-(--iu-foreground) group-has-[:disabled:checked]/size:bg-transparent group-has-[:disabled:checked]/size:text-(--iu-foreground) motion-reduce:transition-none pointer-fine:group-has-enabled/size:group-hover/size:border-(--iu-foreground)">
                              {item.label}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                    <div data-part="size-notes">
                      <p className="mt-3 flex flex-wrap items-center gap-x-3 text-[13px] text-(--iu-muted)">
                        <span data-part="fit">{size.fit}.</span>
                        <a
                          href="#size-guide"
                          className={`inline-flex min-h-6 items-center rounded-[min(var(--iu-radius),2px)] text-(--iu-foreground) underline decoration-(--iu-foreground)/30 underline-offset-4 transition-colors duration-300 motion-reduce:transition-none pointer-fine:hover:decoration-(--iu-foreground) ${FOCUS}`}
                        >
                          Size guide
                        </a>
                      </p>
                      {soldOutSizes.map((item) => (
                        <p key={item.id} id={reasonId(item.id)} className="mt-1 text-[13px] text-(--iu-muted)">
                          <span className="text-(--iu-foreground)">{item.label}</span> sold out in {finish.name}.{" "}
                          {variantFor(product, finish.id, item.id)?.soldOutReason ?? ""}
                        </p>
                      ))}
                    </div>
                  </fieldset>

                  <div className="mt-9 grid grid-cols-[auto_minmax(0,1fr)] items-end gap-3">
                    <div>
                      <label htmlFor={qtyId} className={`block ${LABEL}`}>
                        Quantity
                      </label>
                      <div className="mt-3 flex h-12 items-center rounded-full border border-(--iu-foreground)/35 has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-(--iu-accent)">
                        <button
                          type="button"
                          aria-label="Decrease quantity"
                          data-part="qty-dec"
                          disabled={qty <= 1 || soldOut}
                          onClick={() => setQty(qty - 1)}
                          className={`grid size-12 place-items-center rounded-full transition-colors duration-300 disabled:text-(--iu-foreground)/30 motion-reduce:transition-none pointer-fine:enabled:hover:bg-(--iu-foreground)/6 ${FOCUS}`}
                        >
                          <Minus size={14} strokeWidth={1.5} aria-hidden="true" />
                        </button>
                        <input
                          id={qtyId}
                          type="number"
                          inputMode="numeric"
                          min={1}
                          max={maxQuantity}
                          value={qty}
                          disabled={soldOut}
                          aria-describedby={qtyHintId}
                          onChange={(event) => setQty(event.currentTarget.valueAsNumber)}
                          className="w-7 [appearance:textfield] bg-transparent text-center text-sm tabular-nums outline-none disabled:text-(--iu-muted) [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        />
                        <button
                          type="button"
                          aria-label="Increase quantity"
                          data-part="qty-inc"
                          disabled={qty >= maxQuantity || soldOut}
                          onClick={() => setQty(qty + 1)}
                          className={`grid size-12 place-items-center rounded-full transition-colors duration-300 disabled:text-(--iu-foreground)/30 motion-reduce:transition-none pointer-fine:enabled:hover:bg-(--iu-foreground)/6 ${FOCUS}`}
                        >
                          <Plus size={14} strokeWidth={1.5} aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                    <button
                      ref={addRef}
                      type="submit"
                      data-part="add"
                      disabled={soldOut}
                      aria-disabled={busy || undefined}
                      aria-describedby={qtyHintId}
                      className={`h-12 px-6 whitespace-nowrap disabled:cursor-not-allowed disabled:border disabled:border-dashed disabled:border-(--iu-foreground)/35 disabled:bg-transparent disabled:text-(--iu-muted) pointer-fine:enabled:hover:bg-[color-mix(in_oklab,var(--iu-foreground)_84%,var(--iu-background))] ${INK_PILL}`}
                    >
                      {busy ? (
                        <>
                          <Spinner />
                          Adding to bag
                        </>
                      ) : soldOut ? (
                        "Sold out"
                      ) : (
                        <>
                          Add to bag
                          <span aria-hidden="true" className="h-3 w-px bg-current opacity-35 max-sm:hidden" />
                          <span className="tabular-nums max-sm:hidden">
                            {variant ? format(variant.price * qty) : ""}
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                  <p id={qtyHintId} className="mt-3 min-h-5 text-[13px] text-(--iu-muted)">
                    {soldOut
                      ? ""
                      : qty >= maxQuantity && maxQuantity > 1
                        ? `Limit of ${maxQuantity} for this piece.`
                        : maxQuantity === 1
                          ? "One per client for this piece."
                          : ""}
                  </p>

                  {showError ? (
                    <div
                      role="alert"
                      data-part="error"
                      className="mt-4 flex gap-3.5 rounded-[min(var(--iu-radius),2px)] border border-(--iu-border) bg-(--iu-surface) p-5"
                    >
                      <CircleAlert
                        size={16}
                        strokeWidth={1.5}
                        aria-hidden="true"
                        className="mt-0.5 shrink-0 text-red-700 dark:text-red-400"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium">Not added to your bag</p>
                        <p
                          data-part="error-message"
                          className="mt-1.5 text-sm leading-relaxed text-pretty text-(--iu-muted)"
                        >
                          {errorText}
                        </p>
                        <button
                          type="button"
                          data-part="error-action"
                          onClick={chooseAlternative}
                          className={`mt-4 inline-flex min-h-6 items-center rounded-[min(var(--iu-radius),2px)] text-xs font-medium tracking-[0.16em] uppercase underline decoration-(--iu-foreground)/30 underline-offset-[6px] transition-colors duration-300 motion-reduce:transition-none pointer-fine:hover:decoration-(--iu-foreground) ${FOCUS}`}
                        >
                          {alternative ? `Choose ${alternativeLabel} instead` : "Try again"}
                        </button>
                      </div>
                    </div>
                  ) : null}
                </form>

                <dl className="mt-7 border-t border-(--iu-border)">
                  {product.details.map((detail) => (
                    <div
                      key={detail.label}
                      className="grid gap-1 border-b border-(--iu-border) py-[calc(16px*var(--iu-density))] sm:grid-cols-[7.5rem_minmax(0,1fr)] sm:gap-6"
                    >
                      <dt className={`${LABEL} sm:pt-[3px]`}>{detail.label}</dt>
                      <dd className="text-sm leading-relaxed text-pretty">{detail.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </article>
        </div>

        <BagDrawer
          open={bagOpen}
          maison={maison}
          dialogId={dialogId}
          titleId={bagTitleId}
          panelRef={panelRef}
          lines={lines}
          highlight={highlight}
          totals={totals}
          productName={product.name}
          saleLabel={product.saleLabel}
          taxLabel={taxLabel}
          taxRate={taxRate}
          checkoutHref={checkoutHref}
          format={format}
          codeId={codeId}
          codeHintId={codeHintId}
          codeInput={codeInput}
          codeState={codeState}
          codeInputRef={codeInputRef}
          codeRemoveRef={codeRemoveRef}
          onCodeInput={(value) => {
            setCodeInput(value);
            if (codeState.kind === "error") setCodeState({ kind: "idle" });
          }}
          onApplyCode={applyCode}
          onRemoveCode={removeCode}
          onClose={closeBag}
          onKeyDown={trapFocus}
          onQuantity={changeLineQuantity}
          onRemove={removeLine}
          onCheckout={() => onCheckout?.(lines, totals)}
        />
        <p aria-live="polite" data-part="live" className="sr-only">
          {announcement}
        </p>
      </div>
    </MotionConfig>
  );
}

type BagDrawerProps = {
  open: boolean;
  maison: string;
  dialogId: string;
  titleId: string;
  panelRef: RefObject<HTMLDivElement | null>;
  lines: AtelierBagLine[];
  highlight: { id: string; fresh: boolean } | null;
  totals: AtelierTotals;
  productName: string;
  saleLabel: string;
  taxLabel: string;
  taxRate: number;
  checkoutHref: string;
  format: (value: number, cents?: boolean) => string;
  codeId: string;
  codeHintId: string;
  codeInput: string;
  codeState: CodeState;
  codeInputRef: RefObject<HTMLInputElement | null>;
  codeRemoveRef: RefObject<HTMLButtonElement | null>;
  onCodeInput: (value: string) => void;
  onApplyCode: (event: FormEvent<HTMLFormElement>) => void;
  onRemoveCode: () => void;
  onClose: () => void;
  onKeyDown: (event: ReactKeyboardEvent<HTMLDivElement>) => void;
  onQuantity: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  onCheckout: () => void;
};

function BagDrawer({
  open,
  maison,
  dialogId,
  titleId,
  panelRef,
  lines,
  highlight,
  totals,
  productName,
  saleLabel,
  taxLabel,
  taxRate,
  checkoutHref,
  format,
  codeId,
  codeHintId,
  codeInput,
  codeState,
  codeInputRef,
  codeRemoveRef,
  onCodeInput,
  onApplyCode,
  onRemoveCode,
  onClose,
  onKeyDown,
  onQuantity,
  onRemove,
  onCheckout,
}: BagDrawerProps) {
  const transition = useFade(0.35);
  const empty = lines.length === 0;
  const codeError = codeState.kind === "error";
  return (
    <div
      data-part="drawer"
      data-open={open}
      inert={!open}
      className="group/bag invisible fixed inset-0 z-50 transition-[visibility] duration-500 data-[open=true]:visible data-[open=true]:duration-0 motion-reduce:transition-none"
    >
      <div
        aria-hidden="true"
        data-part="scrim"
        onClick={onClose}
        className="absolute inset-0 bg-black/30 opacity-0 transition-opacity duration-500 group-data-[open=true]/bag:opacity-100 motion-reduce:transition-none dark:bg-black/60"
      />
      <div
        ref={panelRef}
        id={dialogId}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        data-part="panel"
        onKeyDown={onKeyDown}
        className="absolute inset-x-0 bottom-0 flex max-h-[92dvh] translate-y-full [scrollbar-gutter:stable_both-edges] flex-col overflow-y-auto overscroll-contain rounded-t-[min(var(--iu-radius),4px)] border-t border-(--iu-border) bg-(--iu-surface) transition-[translate] duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] outline-none *:shrink-0 group-data-[open=true]/bag:translate-y-0 motion-reduce:transition-none sm:inset-y-0 sm:right-0 sm:left-auto sm:max-h-none sm:w-[440px] sm:translate-x-full sm:translate-y-0 sm:rounded-none sm:border-t-0 sm:border-l sm:group-data-[open=true]/bag:translate-x-0 dark:border-(--iu-foreground)/10"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-(--iu-border) bg-(--iu-surface) px-5 pt-5 pb-4 sm:px-8 sm:pt-8 sm:pb-6">
          <div>
            <h2 id={titleId} className="font-serif text-[1.75rem] leading-none tracking-[-0.01em] sm:text-[2rem]">
              Your bag
            </h2>
            <p data-part="bag-note" className={`mt-3 ${LABEL}`}>
              {empty ? "Nothing held yet" : `${pieceCount(totals.pieces)} · held for 30 minutes`}
            </p>
          </div>
          <button
            type="button"
            aria-label="Close bag"
            data-part="close"
            onClick={onClose}
            className={`-mt-1.5 -mr-2 grid size-10 shrink-0 place-items-center rounded-full text-(--iu-muted) transition-colors duration-300 motion-reduce:transition-none pointer-fine:hover:bg-(--iu-foreground)/6 pointer-fine:hover:text-(--iu-foreground) ${FOCUS}`}
          >
            <X size={18} strokeWidth={1.25} aria-hidden="true" />
          </button>
        </div>

        {empty ? (
          <div
            data-part="empty"
            className="flex flex-1 flex-col items-center justify-center px-8 pt-12 pb-14 text-center"
          >
            <EmptyBox maison={maison} />
            <p className="mt-8 font-serif text-[1.75rem] leading-tight">Your bag is empty</p>
            <p className="mt-3 max-w-[17rem] text-sm leading-relaxed text-pretty text-(--iu-muted)">
              Pieces you add are held for 30 minutes while you decide.
            </p>
            <button
              type="button"
              data-part="continue"
              onClick={onClose}
              className={`mt-8 inline-flex h-11 items-center justify-center rounded-full border border-(--iu-foreground)/35 px-6 text-xs font-medium tracking-[0.18em] uppercase transition-colors duration-300 motion-reduce:transition-none pointer-fine:hover:border-(--iu-foreground) ${FOCUS}`}
            >
              Continue with {productName}
            </button>
          </div>
        ) : (
          <div data-part="filled" className="contents *:shrink-0">
            <ul data-part="lines">
              <AnimatePresence initial={false}>
                {lines.map((line) => {
                  const marked = highlight?.id === line.id;
                  return (
                    <motion.li
                      key={line.id}
                      data-part="line"
                      data-id={line.id}
                      initial={false}
                      exit={{ opacity: 0, height: 0 }}
                      transition={transition}
                      className="overflow-hidden"
                    >
                      <div
                        data-fresh={marked && highlight?.fresh === true}
                        className="relative grid grid-cols-[3rem_minmax(0,1fr)] gap-4 border-b border-(--iu-border) px-5 py-[calc(14px*var(--iu-density))] transition-colors duration-1000 data-[fresh=true]:bg-(--iu-foreground)/[0.04] motion-reduce:transition-none sm:grid-cols-[3.5rem_minmax(0,1fr)] sm:gap-5 sm:px-8 sm:py-[calc(20px*var(--iu-density))]"
                      >
                        {marked ? (
                          <span
                            aria-hidden="true"
                            data-part="mark"
                            className="absolute inset-y-0 left-0 w-0.5 bg-(--iu-accent)"
                          />
                        ) : null}
                        <div
                          data-part="thumb"
                          className="h-16 w-12 overflow-hidden rounded-[min(var(--iu-radius),2px)] bg-(--atelier-plate) sm:h-20 sm:w-14"
                        >
                          <Thumbnail line={line} />
                        </div>
                        <div className="min-w-0">
                          {marked ? (
                            <p
                              data-part="added"
                              className="mb-1.5 flex items-center gap-1.5 text-[10px] font-medium tracking-[0.2em] uppercase sm:mb-2"
                            >
                              <Check size={12} strokeWidth={1.75} aria-hidden="true" />
                              Just added
                            </p>
                          ) : null}
                          <div className="flex items-baseline justify-between gap-3">
                            <p data-part="name" className="truncate font-serif text-xl leading-tight">
                              {line.name}
                            </p>
                            <p data-part="line-price" className="text-sm tabular-nums">
                              {format(line.price * line.quantity)}
                            </p>
                          </div>
                          <div className="mt-1 flex items-baseline justify-between gap-3 text-xs text-(--iu-muted)">
                            <p data-part="detail" className="truncate">
                              {line.detail}
                            </p>
                            {line.compareAtPrice ? (
                              <del data-part="line-was" className="tabular-nums">
                                <span className="sr-only">Was </span>
                                {format(line.compareAtPrice * line.quantity)}
                              </del>
                            ) : null}
                          </div>
                          <div className="mt-2.5 flex items-center justify-between gap-3 sm:mt-3">
                            <div
                              role="group"
                              aria-label={`Quantity of ${line.name}`}
                              className="flex h-8 items-center rounded-full border border-(--iu-foreground)/35 pointer-coarse:h-10"
                            >
                              <button
                                type="button"
                                aria-label={`Decrease quantity of ${line.name}`}
                                data-part="line-dec"
                                disabled={line.quantity <= 1}
                                onClick={() => onQuantity(line.id, -1)}
                                className={`grid size-8 place-items-center rounded-full transition-colors duration-300 disabled:text-(--iu-foreground)/30 motion-reduce:transition-none pointer-coarse:size-10 pointer-fine:enabled:hover:bg-(--iu-foreground)/6 ${FOCUS}`}
                              >
                                <Minus size={12} strokeWidth={1.5} aria-hidden="true" />
                              </button>
                              <span
                                aria-live="polite"
                                data-part="line-qty"
                                className="w-5 text-center text-[13px] tabular-nums"
                              >
                                {line.quantity}
                              </span>
                              <button
                                type="button"
                                aria-label={`Increase quantity of ${line.name}`}
                                data-part="line-inc"
                                disabled={line.quantity >= line.maxQuantity}
                                onClick={() => onQuantity(line.id, 1)}
                                className={`grid size-8 place-items-center rounded-full transition-colors duration-300 disabled:text-(--iu-foreground)/30 motion-reduce:transition-none pointer-coarse:size-10 pointer-fine:enabled:hover:bg-(--iu-foreground)/6 ${FOCUS}`}
                              >
                                <Plus size={12} strokeWidth={1.5} aria-hidden="true" />
                              </button>
                            </div>
                            <button
                              type="button"
                              data-part="remove"
                              onClick={() => onRemove(line.id)}
                              className={`inline-flex min-h-6 items-center rounded-[min(var(--iu-radius),2px)] text-xs text-(--iu-muted) underline decoration-(--iu-foreground)/25 underline-offset-4 transition-colors duration-300 motion-reduce:transition-none pointer-coarse:min-h-10 pointer-fine:hover:text-(--iu-foreground) pointer-fine:hover:decoration-(--iu-foreground) ${FOCUS}`}
                            >
                              Remove<span className="sr-only"> {line.name}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>

            <form data-part="code-form" onSubmit={onApplyCode} noValidate className="px-5 py-5 sm:px-8 sm:py-6">
              <label htmlFor={codeId} className={`block ${LABEL}`}>
                Discount code
              </label>
              {codeState.kind === "applied" ? (
                <div className="mt-3 flex h-10 items-center justify-between gap-3 rounded-[min(var(--iu-radius),2px)] border border-(--iu-border) px-3">
                  <p className="flex min-w-0 items-center gap-2 text-sm">
                    <Check size={14} strokeWidth={1.5} aria-hidden="true" className="shrink-0" />
                    <span data-part="code-name" className="truncate tracking-[0.12em] uppercase">
                      {codeState.code}
                    </span>
                    <span data-part="code-off" className="shrink-0 text-(--iu-muted)">
                      · {codeState.percentOff}% off
                    </span>
                  </p>
                  <button
                    ref={codeRemoveRef}
                    type="button"
                    onClick={onRemoveCode}
                    className={`inline-flex min-h-6 shrink-0 items-center rounded-[min(var(--iu-radius),2px)] text-xs text-(--iu-muted) underline decoration-(--iu-foreground)/25 underline-offset-4 pointer-fine:hover:text-(--iu-foreground) ${FOCUS}`}
                  >
                    Remove<span className="sr-only"> code {codeState.code}</span>
                  </button>
                </div>
              ) : (
                <div className="mt-3 flex gap-2">
                  <input
                    ref={codeInputRef}
                    id={codeId}
                    name="code"
                    value={codeInput}
                    autoComplete="off"
                    autoCapitalize="characters"
                    spellCheck={false}
                    placeholder="Enter code"
                    aria-invalid={codeError || undefined}
                    aria-describedby={codeHintId}
                    onChange={(event) => onCodeInput(event.currentTarget.value)}
                    className={`h-10 min-w-0 flex-1 rounded-[min(var(--iu-radius),2px)] border border-(--iu-foreground)/35 bg-transparent px-3 text-sm tracking-[0.12em] uppercase placeholder:tracking-normal placeholder:text-(--iu-muted) placeholder:normal-case aria-invalid:border-red-700 dark:aria-invalid:border-red-400 ${FOCUS}`}
                  />
                  <button
                    type="submit"
                    data-part="apply"
                    aria-disabled={codeState.kind === "checking" || undefined}
                    className={`inline-flex h-10 min-w-[5.5rem] items-center justify-center rounded-full border border-(--iu-foreground)/35 px-5 text-xs font-medium tracking-[0.18em] uppercase transition-colors duration-300 motion-reduce:transition-none pointer-fine:hover:border-(--iu-foreground) ${FOCUS}`}
                  >
                    {codeState.kind === "checking" ? <Spinner /> : "Apply"}
                  </button>
                </div>
              )}
              <p
                id={codeHintId}
                aria-live="polite"
                className={`mt-2.5 flex gap-1.5 text-xs leading-relaxed ${codeError ? "text-red-700 dark:text-red-400" : "text-(--iu-muted)"}`}
              >
                {codeError ? (
                  <CircleAlert size={14} strokeWidth={1.5} aria-hidden="true" className="mt-px shrink-0" />
                ) : null}
                {codeState.kind === "error"
                  ? codeState.message
                  : codeState.kind === "applied"
                    ? "Applied before tax. One code per order."
                    : "One code per order, applied before tax."}
              </p>
            </form>

            <dl
              data-part="totals"
              className="mt-auto grid grid-cols-[minmax(0,1fr)_auto] gap-x-6 gap-y-1.5 border-t border-(--iu-border) px-5 pt-4 pb-1 text-sm sm:gap-y-2 sm:px-8 sm:pt-6"
            >
              <dt className="text-(--iu-muted)">Subtotal</dt>
              <dd className="text-right tabular-nums">{format(totals.subtotal, true)}</dd>
              {totals.saleDiscount > 0 ? (
                <>
                  <dt className="text-(--iu-muted)">Discount · {saleLabel}</dt>
                  <dd className="text-right tabular-nums">−{format(totals.saleDiscount, true)}</dd>
                </>
              ) : null}
              {totals.codeDiscount > 0 ? (
                <>
                  <dt className="text-(--iu-muted)">Discount · {totals.code}</dt>
                  <dd className="text-right tabular-nums">−{format(totals.codeDiscount, true)}</dd>
                </>
              ) : null}
              <dt className="text-(--iu-muted)">Shipping</dt>
              <dd className="text-right">Complimentary</dd>
              <dt className="text-(--iu-muted)">
                {taxLabel} {+(taxRate * 100).toFixed(3)}%
              </dt>
              <dd className="text-right tabular-nums">{format(totals.tax, true)}</dd>
            </dl>

            <div className="sticky bottom-0 bg-(--iu-surface) px-5 pt-3 pb-5 sm:px-8 sm:pt-4 sm:pb-8">
              <div className="flex items-baseline justify-between gap-6 border-t border-(--iu-border) pt-4 sm:pt-5">
                <span className={LABEL}>Total</span>
                <span data-part="total" className="font-serif text-[2rem] leading-none tabular-nums">
                  {format(totals.total, true)}
                </span>
              </div>
              <a
                href={checkoutHref}
                data-part="checkout"
                onClick={onCheckout}
                className={`mt-4 flex h-12 w-full px-6 sm:mt-5 pointer-fine:hover:bg-[color-mix(in_oklab,var(--iu-foreground)_84%,var(--iu-background))] ${INK_PILL}`}
              >
                Checkout
              </a>
              <p className="mt-3 text-center text-xs text-(--iu-muted)">Duties included · returns within 30 days</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AtelierProductPage;
