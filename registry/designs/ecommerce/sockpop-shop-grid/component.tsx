"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "motion/react";
import { CircleAlert, Minus, Plus, ShoppingBag, Tag, Trash2, Truck, X } from "lucide-react";

export type SockPattern = "stripe" | "dot" | "plain";
export type SockSize = "S" | "M" | "L";

export type SockProduct = {
  id: string;
  name: string;
  blurb: string;
  /** Pence. */
  price: number;
  compareAt?: number;
  patterns: SockPattern[];
  stock: Record<SockSize, number>;
  /** Shown when every size is sold out. */
  restock?: string;
};

export type SockLine = { productId: string; pattern: SockPattern; size: SockSize; qty: number };

export type SockpopShopGridProps = {
  brand?: string;
  products?: SockProduct[];
  defaultCart?: SockLine[];
  defaultCartOpen?: boolean;
  defaultCode?: string | null;
  /** Free shipping from this subtotal, in pence. */
  freeShippingFrom?: number;
  shippingFee?: number;
  /** Forces a state: product skeletons, a checkout failure or a placed order. */
  status?: "idle" | "loading" | "error" | "success";
  checkoutError?: string;
  orderNumber?: string;
  onAddToCart?: (line: SockLine) => void;
  onApplyCode?: (code: string) => void;
  /** Return a promise to show Placing order; reject it to show the error. */
  onCheckout?: (lines: SockLine[], total: number) => void | Promise<void>;
  onNotify?: (productId: string) => void;
  className?: string;
};

const PRODUCTS: SockProduct[] = [
  {
    id: "lazy-sunday",
    name: "Lazy Sunday",
    blurb: "Cushioned crew, combed cotton",
    price: 1400,
    patterns: ["stripe", "dot", "plain"],
    stock: { S: 12, M: 3, L: 0 },
  },
  {
    id: "commuter",
    name: "Commuter",
    blurb: "Ankle socks that stay up",
    price: 1200,
    compareAt: 1500,
    patterns: ["dot", "stripe", "plain"],
    stock: { S: 8, M: 14, L: 6 },
  },
  {
    id: "trail-hopper",
    name: "Trail Hopper",
    blurb: "Merino hiking, reinforced heel",
    price: 1800,
    patterns: ["plain", "stripe", "dot"],
    stock: { S: 0, M: 2, L: 9 },
  },
  {
    id: "night-owl",
    name: "Night Owl",
    blurb: "Fluffy bed socks with grips",
    price: 1600,
    patterns: ["dot", "plain", "stripe"],
    stock: { S: 0, M: 0, L: 0 },
    restock: "Back 14 Nov",
  },
];

const SIZES: SockSize[] = ["S", "M", "L"];
const PATTERN_LABEL: Record<SockPattern, string> = { stripe: "Stripes", dot: "Dots", plain: "Plain" };
const CODES: Record<string, { percent: number } | { expired: string }> = {
  SOCKPOP15: { percent: 15 },
  WINTER10: { expired: "31 Jan" },
};
const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

const MATERIAL = [
  "[--sp-tint:color-mix(in_oklab,var(--iu-accent)_14%,var(--iu-surface))]",
  "[--sp-ink:var(--iu-foreground)]",
  "[--sp-shadow:color-mix(in_oklab,var(--iu-accent)_32%,var(--iu-foreground))]",
  "dark:[--sp-tint:color-mix(in_oklab,var(--iu-accent)_22%,var(--iu-surface))]",
  "dark:[--sp-ink:color-mix(in_oklab,var(--iu-foreground)_80%,var(--iu-surface))]",
  "dark:[--sp-shadow:color-mix(in_oklab,var(--iu-accent)_55%,black)]",
].join(" ");

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--iu-accent)";
const PRESS =
  "border-2 border-(--sp-ink) shadow-[4px_4px_0_var(--sp-shadow)] transition-[translate,box-shadow] duration-100 ease-linear motion-reduce:transition-none active:translate-x-[3px] active:translate-y-[3px] active:shadow-[1px_1px_0_var(--sp-shadow)]";
const PRIMARY = [
  "inline-flex h-12 items-center justify-center gap-2 rounded-full bg-(--iu-accent) px-6 text-[15px] font-extrabold text-(--iu-accent-foreground)",
  PRESS,
  "pointer-fine:hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-55 disabled:active:translate-0",
  FOCUS,
].join(" ");
const SECONDARY = [
  "inline-flex h-11 items-center justify-center gap-2 rounded-full bg-(--iu-surface) px-5 text-sm font-bold text-(--iu-foreground)",
  PRESS,
  "pointer-fine:hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-55",
  FOCUS,
].join(" ");
const ICON_BUTTON =
  "grid size-8 place-items-center rounded-full border-2 border-(--sp-ink) bg-(--iu-surface) disabled:cursor-not-allowed disabled:opacity-40 pointer-fine:hover:bg-(--sp-tint) pointer-coarse:size-10 " +
  FOCUS;

function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

function gbp(pence: number) {
  return `£${(pence / 100).toFixed(2)}`;
}

function totalStock(product: SockProduct) {
  return SIZES.reduce((sum, size) => sum + product.stock[size], 0);
}

function lineKey(line: Pick<SockLine, "productId" | "pattern" | "size">) {
  return `${line.productId}:${line.pattern}:${line.size}`;
}

function useSmallScreen() {
  const [small, setSmall] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 639px)");
    const update = () => setSmall(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return small;
}

/** A sock drawn in SVG; the pattern fills the leg and foot, the cuff, heel and toe stay ink. */
function Sock({ pattern, className = "" }: { pattern: SockPattern; className?: string }) {
  const id = useId().replace(/:/g, "");
  const fill = pattern === "plain" ? "var(--iu-accent)" : `url(#${id}-${pattern})`;
  return (
    <svg aria-hidden="true" viewBox="0 0 120 140" className={className}>
      <defs>
        <pattern id={`${id}-stripe`} width="12" height="12" patternUnits="userSpaceOnUse">
          <rect width="12" height="12" className="fill-(--iu-surface)" />
          <rect width="12" height="6" className="fill-(--iu-accent)" />
        </pattern>
        <pattern id={`${id}-dot`} width="12" height="12" patternUnits="userSpaceOnUse">
          <rect width="12" height="12" className="fill-(--iu-surface)" />
          <circle cx="6" cy="6" r="3" className="fill-(--iu-accent)" />
        </pattern>
      </defs>
      <path
        d="M38 12h40v60c0 7 3 11 9 15l15 10c11 7 12 22 1 29-7 5-16 5-23 1L45 108c-5-3-7-8-7-14Z"
        style={{ fill }}
        className="stroke-(--sp-ink)"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <rect
        x="38"
        y="12"
        width="40"
        height="14"
        rx="3"
        className="fill-(--iu-surface) stroke-(--sp-ink)"
        strokeWidth="3"
      />
      <path d="M44 17v4M52 17v4M60 17v4M68 17v4" className="stroke-(--sp-ink)" strokeWidth="2" strokeLinecap="round" />
      <path d="M90 98c8 5 11 14 7 22" className="fill-none stroke-(--sp-ink)" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function ProductCard({
  product,
  index,
  inCart,
  onAdd,
  onNotify,
}: {
  product: SockProduct;
  index: number;
  inCart: (pattern: SockPattern, size: SockSize) => number;
  onAdd: (line: SockLine, from: DOMRect | null) => void;
  onNotify: (product: SockProduct) => void;
}) {
  const uid = useId();
  const [pattern, setPattern] = useState<SockPattern>(product.patterns[0] ?? "plain");
  const firstInStock = SIZES.find((size) => product.stock[size] > 0) ?? null;
  const [size, setSize] = useState<SockSize | null>(firstInStock);
  const [notified, setNotified] = useState(false);
  const plateRef = useRef<HTMLDivElement>(null);
  const soldOut = totalStock(product) === 0;
  const left = size ? product.stock[size] - inCart(pattern, size) : 0;
  const saving = product.compareAt ? Math.round((1 - product.price / product.compareAt) * 100) : 0;

  return (
    <article
      aria-labelledby={`${uid}-name`}
      className="flex flex-col overflow-hidden rounded-[max(var(--iu-radius),24px)] border-2 border-(--sp-ink) bg-(--iu-surface) shadow-[6px_6px_0_var(--sp-shadow)]"
    >
      <div
        ref={plateRef}
        className={cx(
          "relative grid aspect-[5/4] place-items-center border-b-2 border-(--sp-ink)",
          index % 2 === 0 ? "bg-(--sp-tint)" : "bg-(--iu-background)",
        )}
      >
        <AnimatePresence initial={false} mode="popLayout">
          <motion.div
            key={pattern}
            initial={{ rotate: -14, scale: 0.85, opacity: 0 }}
            animate={{ rotate: -8, scale: 1, opacity: 1 }}
            exit={{ rotate: 6, scale: 0.85, opacity: 0, transition: { duration: 0.12 } }}
            className={cx("w-[46%]", soldOut && "opacity-45 grayscale")}
          >
            <Sock pattern={pattern} className="size-full" />
          </motion.div>
        </AnimatePresence>
        {saving > 0 ? (
          <span className="absolute top-3 left-3 rotate-[-8deg] rounded-full border-2 border-(--sp-ink) bg-(--iu-accent) px-2.5 py-0.5 text-[13px] font-extrabold text-(--iu-accent-foreground)">
            −{saving}%
          </span>
        ) : null}
        {soldOut ? (
          <span className="absolute top-3 right-3 rotate-[6deg] rounded-full border-2 border-(--sp-ink) bg-(--iu-surface) px-2.5 py-0.5 text-[13px] font-extrabold">
            Sold out
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-[calc(14px*var(--iu-density))] p-[calc(16px*var(--iu-density))]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 id={`${uid}-name`} className="text-lg/6 font-extrabold tracking-[-0.02em]">
              {product.name}
            </h3>
            <p className="text-[13px] text-(--iu-muted)">{product.blurb}</p>
          </div>
          <p className="shrink-0 text-right">
            <span className="block text-lg/6 font-extrabold tabular-nums">{gbp(product.price)}</span>
            {product.compareAt ? (
              <span className="block text-[13px] text-(--iu-muted) tabular-nums">
                <span className="sr-only">was </span>
                <s>{gbp(product.compareAt)}</s>
              </span>
            ) : null}
          </p>
        </div>

        <fieldset disabled={soldOut}>
          <legend className="mb-1.5 text-[12px] font-bold text-(--iu-muted)">
            Pattern: <span className="text-(--iu-foreground)">{PATTERN_LABEL[pattern]}</span>
          </legend>
          <div className="flex gap-2">
            {product.patterns.map((option) => (
              <label
                key={option}
                className="grid size-10 cursor-pointer place-items-center rounded-full border-2 border-(--iu-foreground)/30 bg-(--iu-surface) has-checked:border-(--sp-ink) has-checked:shadow-[2px_2px_0_var(--sp-shadow)] has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-(--iu-accent) has-disabled:cursor-not-allowed"
              >
                <input
                  type="radio"
                  name={`${uid}-pattern`}
                  value={option}
                  checked={pattern === option}
                  onChange={() => setPattern(option)}
                  aria-label={PATTERN_LABEL[option]}
                  className="sr-only"
                />
                <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6 overflow-hidden rounded-full">
                  <defs>
                    <clipPath id={`${uid}-${option}-clip`}>
                      <circle cx="12" cy="12" r="11" />
                    </clipPath>
                  </defs>
                  <g clipPath={`url(#${uid}-${option}-clip)`}>
                    <rect
                      width="24"
                      height="24"
                      className={option === "plain" ? "fill-(--iu-accent)" : "fill-(--iu-surface)"}
                    />
                    {option === "stripe"
                      ? [0, 8, 16].map((y) => (
                          <rect key={y} y={y} width="24" height="4" className="fill-(--iu-accent)" />
                        ))
                      : null}
                    {option === "dot"
                      ? [
                          [6, 6],
                          [18, 6],
                          [12, 13],
                          [6, 20],
                          [18, 20],
                        ].map(([x, y]) => (
                          <circle key={`${x}-${y}`} cx={x} cy={y} r="2.4" className="fill-(--iu-accent)" />
                        ))
                      : null}
                  </g>
                </svg>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset disabled={soldOut}>
          <legend className="mb-1.5 text-[12px] font-bold text-(--iu-muted)">Size</legend>
          <div className="grid grid-cols-3 gap-2">
            {SIZES.map((option) => {
              const out = product.stock[option] === 0;
              return (
                <label
                  key={option}
                  className={cx(
                    "relative flex h-10 cursor-pointer items-center justify-center rounded-full border-2 text-sm font-extrabold transition-colors duration-100 motion-reduce:transition-none",
                    "border-(--iu-foreground)/30 has-checked:border-(--sp-ink) has-checked:bg-(--iu-foreground) has-checked:text-(--iu-background)",
                    "has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-(--iu-accent)",
                    out && "cursor-not-allowed border-dashed text-(--iu-muted) line-through",
                  )}
                >
                  <input
                    type="radio"
                    name={`${uid}-size`}
                    value={option}
                    checked={size === option}
                    disabled={out}
                    onChange={() => setSize(option)}
                    aria-label={`${option}${out ? ", sold out" : ""}`}
                    className="sr-only"
                  />
                  {option}
                </label>
              );
            })}
          </div>
        </fieldset>

        <p aria-live="polite" className="min-h-5 text-[13px] font-semibold">
          {soldOut ? (
            <span className="text-(--iu-muted)">{product.restock ?? "Sold out in every size"}</span>
          ) : size && left <= 0 ? (
            <span className="text-(--iu-muted)">You have every {size} we’ve got</span>
          ) : size && left <= 3 ? (
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden="true" className="size-2 rounded-full bg-(--iu-accent)" />
              Only {left} left in {size}
            </span>
          ) : (
            <span className="text-(--iu-muted)">In stock · ships tomorrow</span>
          )}
        </p>

        <div className="mt-auto">
          {soldOut ? (
            <button
              type="button"
              disabled={notified}
              onClick={() => {
                setNotified(true);
                onNotify(product);
              }}
              className={cx(SECONDARY, "w-full")}
            >
              {notified ? "We’ll email you" : "Notify me"}
            </button>
          ) : (
            <button
              type="button"
              disabled={!size || left <= 0}
              onClick={() =>
                size &&
                onAdd(
                  { productId: product.id, pattern, size, qty: 1 },
                  plateRef.current?.getBoundingClientRect() ?? null,
                )
              }
              className={cx(PRIMARY, "w-full")}
            >
              <ShoppingBag size={16} strokeWidth={2.25} aria-hidden="true" />
              Add to cart
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function SkeletonCard() {
  return (
    <div
      aria-hidden="true"
      className="flex flex-col overflow-hidden rounded-[max(var(--iu-radius),24px)] border-2 border-(--iu-foreground)/15 bg-(--iu-surface)"
    >
      <div className="aspect-[5/4] bg-(--iu-foreground)/6" />
      <div className="flex flex-col gap-3.5 p-4">
        <div className="h-5 w-1/2 rounded-full bg-(--iu-foreground)/10" />
        <div className="h-3.5 w-3/4 rounded-full bg-(--iu-foreground)/8" />
        <div className="flex gap-2">
          {[0, 1, 2].map((dot) => (
            <div key={dot} className="size-10 rounded-full bg-(--iu-foreground)/8" />
          ))}
        </div>
        <div className="h-10 rounded-full bg-(--iu-foreground)/8" />
        <div className="h-12 rounded-full bg-(--iu-foreground)/10" />
      </div>
    </div>
  );
}

type Flyer = { id: number; pattern: SockPattern; x: number; y: number; dx: number; dy: number };

export function SockpopShopGrid({
  brand = "Sockpop",
  products = PRODUCTS,
  defaultCart = [],
  defaultCartOpen = false,
  defaultCode = null,
  freeShippingFrom = 4000,
  shippingFee = 395,
  status,
  checkoutError = "Commuter in Dots, M sold out while it was in your cart. We’ve set it to the 2 we can still send.",
  orderNumber = "SP-20418",
  onAddToCart,
  onApplyCode,
  onCheckout,
  onNotify,
  className = "",
}: SockpopShopGridProps) {
  const reduceMotion = useReducedMotion();
  const small = useSmallScreen();
  const uid = useId();
  const [cart, setCart] = useState<SockLine[]>(defaultCart);
  const [open, setOpen] = useState(defaultCartOpen);
  const [code, setCode] = useState<string | null>(defaultCode);
  const [codeInput, setCodeInput] = useState("");
  const [codeError, setCodeError] = useState("");
  const [phase, setPhase] = useState<"idle" | "placing" | "error" | "success">(
    status === "error" ? "error" : status === "success" ? "success" : "idle",
  );
  const [bump, setBump] = useState(0);
  const [flyers, setFlyers] = useState<Flyer[]>([]);
  const [announcement, setAnnouncement] = useState("");

  const cartButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const flyerSeq = useRef(0);
  const movedIn = useRef(false);

  const loading = status === "loading";
  const productById = (id: string) => products.find((product) => product.id === id);
  const count = cart.reduce((sum, line) => sum + line.qty, 0);
  const subtotal = cart.reduce((sum, line) => sum + (productById(line.productId)?.price ?? 0) * line.qty, 0);
  const saleSavings = cart.reduce((sum, line) => {
    const product = productById(line.productId);
    return sum + (product?.compareAt ? (product.compareAt - product.price) * line.qty : 0);
  }, 0);
  const codeRule = code ? CODES[code] : undefined;
  const codeDiscount = codeRule && "percent" in codeRule ? Math.round((subtotal * codeRule.percent) / 100) : 0;
  const afterDiscount = subtotal - codeDiscount;
  const shipping = afterDiscount >= freeShippingFrom || cart.length === 0 ? 0 : shippingFee;
  const total = afterDiscount + shipping;
  const toFree = Math.max(0, freeShippingFrom - afterDiscount);
  const placing = phase === "placing";

  const inCartFor = (productId: string) => (pattern: SockPattern, size: SockSize) =>
    cart.find((line) => lineKey(line) === lineKey({ productId, pattern, size }))?.qty ?? 0;

  const openCart = () => {
    movedIn.current = true;
    setOpen(true);
  };

  const closeCart = useCallback(() => {
    if (placing) return;
    setOpen(false);
    requestAnimationFrame(() => cartButtonRef.current?.focus());
  }, [placing]);

  useEffect(() => {
    if (!open || !movedIn.current) return;
    movedIn.current = false;
    const frame = requestAnimationFrame(() => closeRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      const drawer = drawerRef.current;
      if (!drawer) return;
      if (event.key === "Escape") {
        event.preventDefault();
        closeCart();
        return;
      }
      if (event.key !== "Tab") return;
      const nodes = Array.from(drawer.querySelectorAll<HTMLElement>(FOCUSABLE));
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (!first || !last) return;
      const current = document.activeElement;
      if (!drawer.contains(current)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && current === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && current === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, closeCart]);

  useEffect(() => {
    if (!open) return;
    const { body, documentElement } = document;
    const gap = window.innerWidth - documentElement.clientWidth;
    const previous = { overflow: body.style.overflow, paddingRight: body.style.paddingRight };
    body.style.overflow = "hidden";
    if (gap > 0) body.style.paddingRight = `${gap}px`;
    return () => {
      body.style.overflow = previous.overflow;
      body.style.paddingRight = previous.paddingRight;
    };
  }, [open]);

  const addLine = (line: SockLine, from: DOMRect | null) => {
    const product = productById(line.productId);
    if (!product) return;
    setCart((current) => {
      const existing = current.find((entry) => lineKey(entry) === lineKey(line));
      if (existing) {
        return current.map((entry) =>
          lineKey(entry) === lineKey(line)
            ? { ...entry, qty: Math.min(entry.qty + 1, product.stock[line.size]) }
            : entry,
        );
      }
      return [...current, line];
    });
    if (phase === "success" || phase === "error") setPhase("idle");
    onAddToCart?.(line);
    setAnnouncement(`${product.name}, ${PATTERN_LABEL[line.pattern]}, size ${line.size} added to your cart.`);
    const to = cartButtonRef.current?.getBoundingClientRect();
    if (reduceMotion || !from || !to) {
      setBump((value) => value + 1);
      return;
    }
    flyerSeq.current += 1;
    const x = from.left + from.width / 2 - 28;
    const y = from.top + from.height / 2 - 28;
    setFlyers((current) => [
      ...current,
      {
        id: flyerSeq.current,
        pattern: line.pattern,
        x,
        y,
        dx: to.left + to.width / 2 - 28 - x,
        dy: to.top + to.height / 2 - 28 - y,
      },
    ]);
  };

  const setQty = (line: SockLine, qty: number) => {
    const product = productById(line.productId);
    if (!product) return;
    if (qty <= 0) {
      setCart((current) => current.filter((entry) => lineKey(entry) !== lineKey(line)));
      setAnnouncement(`${product.name} removed from your cart.`);
      requestAnimationFrame(() => closeRef.current?.focus());
      return;
    }
    const next = Math.min(qty, product.stock[line.size]);
    setCart((current) => current.map((entry) => (lineKey(entry) === lineKey(line) ? { ...entry, qty: next } : entry)));
    setAnnouncement(`${product.name} quantity ${next}.`);
  };

  const applyCode = () => {
    const value = codeInput.trim().toUpperCase();
    if (!value) {
      setCodeError("Type a code first.");
      return;
    }
    const rule = CODES[value];
    if (!rule) {
      setCodeError(`We don’t recognise “${value}”. Codes are on your receipt email.`);
      return;
    }
    if ("expired" in rule) {
      setCodeError(`${value} ended on ${rule.expired}.`);
      return;
    }
    setCode(value);
    setCodeInput("");
    setCodeError("");
    onApplyCode?.(value);
    setAnnouncement(`${value} applied: ${rule.percent}% off.`);
  };

  const checkout = async () => {
    if (placing || cart.length === 0) return;
    try {
      const result = onCheckout?.(cart, total);
      if (result instanceof Promise) {
        setPhase("placing");
        await result;
      }
      setPhase("success");
      setCart([]);
      setCode(null);
      setAnnouncement(`Order ${orderNumber} placed.`);
    } catch {
      setPhase("error");
    }
  };

  const showSuccess = phase === "success";

  return (
    <MotionConfig
      reducedMotion="user"
      transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 400, damping: 18 }}
    >
      <div
        className={cx(
          "relative min-h-dvh bg-(--iu-background) font-(family-name:--iu-font) text-(--iu-foreground)",
          MATERIAL,
          className,
        )}
      >
        <div inert={open} className="mx-auto max-w-[1200px] px-4 pt-6 pb-20 sm:px-8 sm:pt-8">
          <header className="flex items-center justify-between gap-4">
            <span className="inline-flex items-center gap-2 text-xl font-extrabold tracking-[-0.03em]">
              <Sock pattern="stripe" className="size-9 -rotate-12" />
              {brand}
            </span>
            <button
              ref={cartButtonRef}
              type="button"
              aria-haspopup="dialog"
              onClick={openCart}
              className={cx(SECONDARY, "relative h-11 px-4")}
            >
              <ShoppingBag size={18} strokeWidth={2.25} aria-hidden="true" />
              <span className="max-sm:sr-only">Cart</span>
              <motion.span
                key={`${count}-${bump}`}
                aria-hidden="true"
                initial={bump > 0 && !reduceMotion ? { scale: 1.5 } : false}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 12 }}
                className="grid h-6 min-w-6 place-items-center rounded-full bg-(--iu-accent) px-1.5 text-[12px] font-extrabold text-(--iu-accent-foreground) tabular-nums"
              >
                {count}
              </motion.span>
              <span className="sr-only">
                , {count} {count === 1 ? "item" : "items"}
              </span>
            </button>
          </header>

          <div className="mt-10 flex flex-wrap items-end justify-between gap-4 sm:mt-14">
            <div>
              <p className="inline-block -rotate-2 rounded-full border-2 border-(--sp-ink) bg-(--sp-tint) px-3 py-0.5 text-[12px] font-extrabold tracking-wide uppercase">
                Autumn drop · 4 styles
              </p>
              <h1 className="mt-3 text-[clamp(2.25rem,1.5rem+3vw,3.75rem)] leading-[1] font-extrabold tracking-[-0.04em] text-balance">
                Socks with opinions.
              </h1>
            </div>
            <p className="flex items-center gap-2 text-sm font-semibold text-(--iu-muted)">
              <Truck size={16} strokeWidth={2} aria-hidden="true" />
              Free UK shipping over {gbp(freeShippingFrom)}
            </p>
          </div>

          <section
            aria-label="Products"
            aria-busy={loading}
            className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
          >
            {loading
              ? [0, 1, 2, 3].map((card) => <SkeletonCard key={card} />)
              : products.map((product, index) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    index={index}
                    inCart={inCartFor(product.id)}
                    onAdd={addLine}
                    onNotify={(item) => {
                      onNotify?.(item.id);
                      setAnnouncement(`We’ll email you when ${item.name} is back.`);
                    }}
                  />
                ))}
          </section>
          {loading ? <p className="sr-only">Loading products</p> : null}
        </div>

        {flyers.map((flyer) => (
          <motion.div
            key={flyer.id}
            aria-hidden="true"
            initial={{ x: 0, y: 0, scale: 1, rotate: -10 }}
            animate={{
              x: [0, flyer.dx * 0.5, flyer.dx],
              y: [0, Math.min(flyer.dy, 0) - 90, flyer.dy],
              scale: [1, 0.9, 0.35],
              rotate: [-10, 20, 40],
            }}
            transition={{ duration: 0.62, ease: "easeInOut", times: [0, 0.4, 1] }}
            onAnimationComplete={() => {
              setFlyers((current) => current.filter((entry) => entry.id !== flyer.id));
              setBump((value) => value + 1);
            }}
            style={{ left: flyer.x, top: flyer.y }}
            className="pointer-events-none fixed z-[70] size-14"
          >
            <Sock pattern={flyer.pattern} className="size-full" />
          </motion.div>
        ))}

        <AnimatePresence initial={false}>
          {open ? (
            <div key="cart" className="fixed inset-0 z-50 flex items-end sm:items-stretch sm:justify-end">
              <motion.div
                aria-hidden="true"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.16 }}
                onClick={closeCart}
                className="absolute inset-0 bg-(--iu-foreground)/25 dark:bg-black/60"
              />
              <motion.div
                ref={drawerRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={`${uid}-cart`}
                initial={small ? { y: "100%" } : { x: "100%" }}
                animate={small ? { y: 0 } : { x: 0 }}
                exit={small ? { y: "100%" } : { x: "100%" }}
                transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 400, damping: 34 }}
                className="relative flex max-h-[92dvh] w-full flex-col rounded-t-[max(var(--iu-radius),28px)] border-2 border-b-0 border-(--sp-ink) bg-(--iu-surface) sm:m-3 sm:max-h-none sm:w-[440px] sm:rounded-[max(var(--iu-radius),28px)] sm:border-b-2 sm:shadow-[6px_6px_0_var(--sp-shadow)]"
              >
                <span
                  aria-hidden="true"
                  className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-(--iu-foreground)/25 sm:hidden"
                />
                <div className="flex items-center justify-between gap-4 border-b-2 border-(--sp-ink) px-5 py-4 sm:px-6">
                  <h2 id={`${uid}-cart`} className="text-xl font-extrabold tracking-[-0.02em]">
                    {showSuccess ? "Order placed" : "Your cart"}{" "}
                    {!showSuccess ? (
                      <span className="font-mono text-sm font-medium text-(--iu-muted) tabular-nums">{count}</span>
                    ) : null}
                  </h2>
                  <button
                    ref={closeRef}
                    type="button"
                    onClick={closeCart}
                    disabled={placing}
                    aria-label="Close cart"
                    className={cx(ICON_BUTTON, "size-10 pointer-coarse:size-10")}
                  >
                    <X size={18} strokeWidth={2.25} aria-hidden="true" />
                  </button>
                </div>

                {showSuccess ? (
                  <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-10 text-center">
                    <svg aria-hidden="true" viewBox="0 0 160 120" className="w-44">
                      <circle cx="80" cy="62" r="44" className="fill-(--sp-tint) stroke-(--sp-ink)" strokeWidth="3" />
                      <motion.path
                        d="M60 63l14 14 28-30"
                        className="fill-none stroke-(--sp-ink)"
                        strokeWidth="7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={{ pathLength: reduceMotion ? 1 : 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: reduceMotion ? 0 : 0.4, delay: reduceMotion ? 0 : 0.15 }}
                      />
                      <rect
                        x="18"
                        y="20"
                        width="12"
                        height="12"
                        rx="3"
                        transform="rotate(20 24 26)"
                        className="fill-(--iu-accent)"
                      />
                      <circle cx="136" cy="30" r="6" className="fill-(--iu-accent)" />
                      <path
                        d="M128 96l10 6M22 92l-8 8"
                        className="stroke-(--sp-ink)"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                    </svg>
                    <p className="text-2xl font-extrabold tracking-[-0.03em]">Your socks are on the way.</p>
                    <p className="max-w-[18rem] text-sm text-pretty text-(--iu-muted)">
                      Order <span className="font-mono font-semibold text-(--iu-foreground)">{orderNumber}</span> ships
                      tomorrow. A receipt is on its way to your inbox.
                    </p>
                    <button type="button" onClick={closeCart} className={SECONDARY}>
                      Keep browsing
                    </button>
                  </div>
                ) : cart.length === 0 ? (
                  <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-12 text-center">
                    <svg aria-hidden="true" viewBox="0 0 160 110" className="w-40">
                      <path d="M20 96h120" className="stroke-(--sp-ink)" strokeWidth="3" strokeLinecap="round" />
                      <path
                        d="M46 44h68l-8 52H54Z"
                        className="fill-(--sp-tint) stroke-(--sp-ink)"
                        strokeWidth="3"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M62 44c0-14 8-22 18-22s18 8 18 22"
                        className="fill-none stroke-(--sp-ink)"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                      <circle cx="68" cy="66" r="3" className="fill-(--sp-ink)" />
                      <circle cx="92" cy="66" r="3" className="fill-(--sp-ink)" />
                      <path
                        d="M70 80c6-4 14-4 20 0"
                        className="fill-none stroke-(--sp-ink)"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                    </svg>
                    <p className="text-lg font-extrabold">Your cart is sock-free.</p>
                    <p className="max-w-[17rem] text-sm text-pretty text-(--iu-muted)">
                      Pick a pattern and a size, then add a pair. Everything ships tomorrow.
                    </p>
                    <button type="button" onClick={closeCart} className={PRIMARY}>
                      Browse the drop
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 [scrollbar-gutter:stable] overflow-y-auto px-5 sm:px-6">
                      <div className="mt-4 rounded-[max(var(--iu-radius),18px)] border-2 border-(--sp-ink) bg-(--sp-tint) p-3">
                        <p className="flex items-center gap-2 text-[13px] font-bold">
                          <Truck size={16} strokeWidth={2} aria-hidden="true" />
                          {toFree > 0 ? `${gbp(toFree)} away from free shipping` : "Free shipping unlocked"}
                        </p>
                        <div
                          role="progressbar"
                          aria-label="Progress to free shipping"
                          aria-valuemin={0}
                          aria-valuemax={freeShippingFrom}
                          aria-valuenow={Math.min(afterDiscount, freeShippingFrom)}
                          aria-valuetext={toFree > 0 ? `${gbp(toFree)} to go` : "Unlocked"}
                          className="mt-2 h-3 overflow-hidden rounded-full border-2 border-(--sp-ink) bg-(--iu-surface)"
                        >
                          <motion.div
                            initial={false}
                            animate={{ scaleX: Math.min(1, afterDiscount / freeShippingFrom) }}
                            className="h-full origin-left bg-(--iu-accent)"
                          />
                        </div>
                      </div>

                      <ul className="divide-y-2 divide-dashed divide-(--iu-foreground)/15">
                        <AnimatePresence initial={false}>
                          {cart.map((line) => {
                            const product = productById(line.productId);
                            if (!product) return null;
                            const max = product.stock[line.size];
                            return (
                              <motion.li
                                key={lineKey(line)}
                                layout
                                initial={{ opacity: 0, x: 24 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -24, transition: { duration: 0.14 } }}
                                className="flex gap-3 py-[calc(14px*var(--iu-density))]"
                              >
                                <span className="grid size-16 shrink-0 place-items-center rounded-[max(var(--iu-radius),16px)] border-2 border-(--sp-ink) bg-(--sp-tint)">
                                  <Sock pattern={line.pattern} className="size-12 -rotate-6" />
                                </span>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-start justify-between gap-2">
                                    <p className="truncate text-sm font-extrabold">{product.name}</p>
                                    <p className="shrink-0 text-sm font-extrabold tabular-nums">
                                      {gbp(product.price * line.qty)}
                                    </p>
                                  </div>
                                  <p className="text-[12px] text-(--iu-muted)">
                                    {PATTERN_LABEL[line.pattern]} · Size {line.size}
                                    {product.compareAt ? (
                                      <span className="ml-1.5 font-bold text-(--iu-foreground)">
                                        Sale −{gbp((product.compareAt - product.price) * line.qty)}
                                      </span>
                                    ) : null}
                                  </p>
                                  <div className="mt-2 flex items-center justify-between gap-2">
                                    <div
                                      role="group"
                                      aria-label={`Quantity of ${product.name}`}
                                      className="flex items-center gap-2"
                                    >
                                      <button
                                        type="button"
                                        disabled={placing}
                                        onClick={() => setQty(line, line.qty - 1)}
                                        aria-label={
                                          line.qty === 1 ? `Remove ${product.name}` : `One fewer ${product.name}`
                                        }
                                        className={ICON_BUTTON}
                                      >
                                        <Minus size={14} strokeWidth={2.5} aria-hidden="true" />
                                      </button>
                                      <span className="w-6 text-center text-sm font-extrabold tabular-nums">
                                        {line.qty}
                                      </span>
                                      <button
                                        type="button"
                                        disabled={placing || line.qty >= max}
                                        onClick={() => setQty(line, line.qty + 1)}
                                        aria-label={`One more ${product.name}`}
                                        className={ICON_BUTTON}
                                      >
                                        <Plus size={14} strokeWidth={2.5} aria-hidden="true" />
                                      </button>
                                      {line.qty >= max ? (
                                        <span className="text-[12px] font-semibold text-(--iu-muted)">Max {max}</span>
                                      ) : null}
                                    </div>
                                    <button
                                      type="button"
                                      disabled={placing}
                                      onClick={() => setQty(line, 0)}
                                      aria-label={`Remove ${product.name} from cart`}
                                      className={cx(
                                        "grid size-8 place-items-center rounded-full text-(--iu-muted) pointer-coarse:size-10 pointer-fine:hover:bg-(--iu-foreground)/8 pointer-fine:hover:text-(--iu-foreground)",
                                        FOCUS,
                                      )}
                                    >
                                      <Trash2 size={16} strokeWidth={2} aria-hidden="true" />
                                    </button>
                                  </div>
                                </div>
                              </motion.li>
                            );
                          })}
                        </AnimatePresence>
                      </ul>

                      <div className="border-t-2 border-dashed border-(--iu-foreground)/15 py-4">
                        {code ? (
                          <div className="flex items-center justify-between gap-3 rounded-full border-2 border-(--sp-ink) bg-(--sp-tint) py-1 pr-1 pl-3">
                            <span className="inline-flex items-center gap-2 text-sm font-extrabold">
                              <Tag size={16} strokeWidth={2} aria-hidden="true" />
                              {code}
                              <span className="font-semibold text-(--iu-muted)">
                                {codeRule && "percent" in codeRule ? `${codeRule.percent}% off` : ""}
                              </span>
                            </span>
                            <button
                              type="button"
                              disabled={placing}
                              onClick={() => {
                                setCode(null);
                                setAnnouncement(`${code} removed.`);
                              }}
                              className={cx(
                                "h-8 rounded-full px-3 text-[13px] font-bold pointer-coarse:h-10 pointer-fine:hover:bg-(--iu-foreground)/8",
                                FOCUS,
                              )}
                            >
                              Remove
                            </button>
                          </div>
                        ) : (
                          <form
                            noValidate
                            onSubmit={(event) => {
                              event.preventDefault();
                              applyCode();
                            }}
                          >
                            <label htmlFor={`${uid}-code`} className="mb-1.5 block text-[13px] font-bold">
                              Discount code
                            </label>
                            <div className="flex gap-2">
                              <input
                                id={`${uid}-code`}
                                value={codeInput}
                                disabled={placing}
                                onChange={(event) => {
                                  setCodeInput(event.target.value);
                                  setCodeError("");
                                }}
                                aria-invalid={codeError ? true : undefined}
                                aria-describedby={codeError ? `${uid}-code-error` : undefined}
                                autoComplete="off"
                                placeholder="Enter a code"
                                className={cx(
                                  "h-11 min-w-0 flex-1 rounded-full border-2 bg-(--iu-surface) px-4 font-mono text-sm uppercase placeholder:text-(--iu-muted) placeholder:normal-case",
                                  codeError ? "border-red-600 dark:border-red-400" : "border-(--iu-foreground)/45",
                                  FOCUS,
                                )}
                              />
                              <button type="submit" disabled={placing} className={cx(SECONDARY, "px-4")}>
                                Apply
                              </button>
                            </div>
                            {codeError ? (
                              <p
                                id={`${uid}-code-error`}
                                className="mt-2 flex items-start gap-1.5 text-[13px] font-semibold text-red-700 dark:text-red-400"
                              >
                                <CircleAlert size={16} strokeWidth={2} aria-hidden="true" className="shrink-0" />
                                {codeError}
                              </p>
                            ) : null}
                          </form>
                        )}
                      </div>
                    </div>

                    <div className="border-t-2 border-(--sp-ink) px-5 pt-4 pb-[max(16px,env(safe-area-inset-bottom))] sm:px-6 sm:pb-6">
                      <dl className="flex flex-col gap-1.5 text-sm tabular-nums">
                        <div className="flex justify-between gap-4">
                          <dt className="text-(--iu-muted)">Subtotal</dt>
                          <dd className="font-bold">{gbp(subtotal)}</dd>
                        </div>
                        {saleSavings > 0 ? (
                          <div className="flex justify-between gap-4">
                            <dt className="text-(--iu-muted)">Sale savings (included)</dt>
                            <dd className="font-bold">−{gbp(saleSavings)}</dd>
                          </div>
                        ) : null}
                        {codeDiscount > 0 ? (
                          <div className="flex justify-between gap-4">
                            <dt className="text-(--iu-muted)">Code {code}</dt>
                            <dd className="font-bold">−{gbp(codeDiscount)}</dd>
                          </div>
                        ) : null}
                        <div className="flex justify-between gap-4">
                          <dt className="text-(--iu-muted)">Shipping</dt>
                          <dd className="font-bold">{shipping === 0 ? "Free" : gbp(shipping)}</dd>
                        </div>
                        <div className="mt-1 flex items-baseline justify-between gap-4 border-t-2 border-dashed border-(--iu-foreground)/15 pt-2">
                          <dt className="font-extrabold">Total</dt>
                          <dd className="text-2xl font-extrabold tracking-[-0.03em]">{gbp(total)}</dd>
                        </div>
                      </dl>
                      <p className="mt-1 text-[12px] text-(--iu-muted)">VAT included · 30-day free returns</p>
                      {phase === "error" ? (
                        <div
                          role="alert"
                          className="mt-3 flex items-start gap-2 rounded-[max(var(--iu-radius),16px)] border-2 border-red-700 bg-red-600/8 p-3 text-[13px]/5 font-semibold text-red-800 dark:border-red-400 dark:bg-red-400/10 dark:text-red-200"
                        >
                          <CircleAlert size={16} strokeWidth={2} aria-hidden="true" className="mt-0.5 shrink-0" />
                          {checkoutError}
                        </div>
                      ) : null}
                      <button
                        type="button"
                        onClick={checkout}
                        disabled={placing}
                        className={cx(PRIMARY, "mt-4 inline-grid w-full")}
                      >
                        <span aria-hidden={placing} className={cx("col-start-1 row-start-1", placing && "invisible")}>
                          {phase === "error" ? "Review and pay" : `Checkout · ${gbp(total)}`}
                        </span>
                        <span
                          aria-hidden={!placing}
                          className={cx(
                            "col-start-1 row-start-1 inline-flex items-center justify-center gap-1",
                            !placing && "invisible",
                          )}
                        >
                          Placing order
                          <span aria-hidden="true" className="inline-flex gap-0.5">
                            {[0, 1, 2].map((dot) => (
                              <span
                                key={dot}
                                className="size-1.5 animate-bounce rounded-full bg-current motion-reduce:animate-none"
                                style={{ animationDelay: `${dot * 120}ms` }}
                              />
                            ))}
                          </span>
                        </span>
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            </div>
          ) : null}
        </AnimatePresence>
        <p role="status" className="sr-only">
          {announcement}
        </p>
      </div>
    </MotionConfig>
  );
}

export default SockpopShopGrid;
