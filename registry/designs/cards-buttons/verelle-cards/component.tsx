"use client";

import { useEffect, useId, useState } from "react";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, Check } from "lucide-react";

export type VerelleForceState = "hover" | "focus" | "active";
export type VerelleStatus = "idle" | "loading" | "success";

export type VerelleProduct = {
  house: string;
  name: string;
  reference: string;
  details: string[];
  price: string;
  allocation: string;
};

export type VerelleAdvisor = {
  name: string;
  role: string;
  location: string;
  responseTime: string;
  nextSlot: string;
};

export type VerelleCardsProps = {
  product?: VerelleProduct;
  advisor?: VerelleAdvisor;
  engraving?: string;
  /** Controlled reservation status; omit to let the button manage it from `onReserve`'s promise. */
  status?: VerelleStatus;
  disabled?: boolean;
  /** Renders an interaction state statically, for previews and documentation. */
  forceState?: VerelleForceState;
  onReserve?: () => void | Promise<void>;
  onBook?: () => void;
  onEngravingStyles?: () => void;
  className?: string;
};

const DEFAULT_PRODUCT: VerelleProduct = {
  house: "Maison Verelle",
  name: "Phase de Lune",
  reference: "Ref. V9-38-ST",
  details: ["38 mm steel", "Hand-wound calibre V.9", "72 h reserve"],
  price: "€14,800",
  allocation: "Edition of 120 · 9 remain",
};

const DEFAULT_ADVISOR: VerelleAdvisor = {
  name: "Céline Marchetti",
  role: "Private client advisor",
  location: "Geneva atelier",
  responseTime: "Replies within two hours",
  nextSlot: "Thursday 30 October, 11:00",
};

const EASE = [0.2, 0.8, 0.2, 1] as const;
const ring =
  "focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-(--iu-accent) data-[force-state=focus]:outline-2 data-[force-state=focus]:outline-offset-3 data-[force-state=focus]:outline-(--iu-accent)";
const label = "text-[10px] font-medium tracking-[0.22em] text-(--iu-muted) uppercase";

function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

/** The watch, drawn: case, lugs, crown, a sector dial with a moonphase aperture, hands at 10:09. */
function Watch() {
  const ticks = Array.from({ length: 60 }, (_, index) => index);
  return (
    <svg viewBox="0 0 240 300" aria-hidden="true" className="h-full w-auto overflow-visible">
      <path d="M92 24h56l6 46H86z" className="fill-(--iu-surface) stroke-(--iu-foreground)" strokeWidth="1" />
      <path d="M86 230h68l-6 46H92z" className="fill-(--iu-surface) stroke-(--iu-foreground)" strokeWidth="1" />
      <path d="M100 24v-8M140 24v-8M100 276v8M140 276v8" className="stroke-(--iu-foreground)" strokeOpacity="0.4" />
      <rect x="204" y="141" width="14" height="18" rx="2" className="fill-(--iu-surface) stroke-(--iu-foreground)" />
      <circle cx="120" cy="150" r="86" className="fill-(--iu-surface) stroke-(--iu-foreground)" strokeWidth="1.25" />
      <circle
        cx="120"
        cy="150"
        r="78"
        className="fill-(--iu-background) stroke-(--iu-foreground)"
        strokeOpacity="0.35"
      />
      <circle cx="120" cy="150" r="58" fill="none" className="stroke-(--iu-foreground)" strokeOpacity="0.2" />
      {ticks.map((tick) => {
        const angle = (tick / 60) * Math.PI * 2;
        const major = tick % 5 === 0;
        const r1 = major ? 66 : 72;
        return (
          <line
            key={tick}
            x1={120 + Math.sin(angle) * r1}
            y1={150 - Math.cos(angle) * r1}
            x2={120 + Math.sin(angle) * 76}
            y2={150 - Math.cos(angle) * 76}
            className="stroke-(--iu-foreground)"
            strokeOpacity={major ? 0.9 : 0.35}
            strokeWidth={major ? 1.5 : 0.6}
          />
        );
      })}
      <path
        d="M96 196a24 24 0 0 1 48 0z"
        className="fill-(--iu-surface) stroke-(--iu-foreground)"
        strokeOpacity="0.5"
      />
      <circle cx="113" cy="190" r="7" className="fill-(--iu-accent)" />
      <circle cx="117" cy="188" r="7" className="fill-(--iu-surface)" />
      <text
        x="120"
        y="112"
        textAnchor="middle"
        className="fill-(--iu-foreground) font-serif"
        fontSize="11"
        letterSpacing="2"
      >
        VERELLE
      </text>
      <line
        x1="120"
        y1="150"
        x2="88"
        y2="128"
        className="stroke-(--iu-foreground)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <line
        x1="120"
        y1="150"
        x2="164"
        y2="118"
        className="stroke-(--iu-foreground)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line x1="120" y1="164" x2="120" y2="84" className="stroke-(--iu-accent)" strokeWidth="0.75" />
      <circle cx="120" cy="150" r="3" className="fill-(--iu-foreground)" />
    </svg>
  );
}

/** A pill button that traces a hairline around its edge while it works, keeping its width throughout. */
function ReserveButton({
  status,
  disabled,
  forceState,
  onClick,
}: {
  status: VerelleStatus;
  disabled: boolean;
  forceState?: VerelleForceState;
  onClick: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const busy = status !== "idle";
  const trace = status === "success" ? 1 : status === "loading" ? 0.86 : 0;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-disabled={busy || undefined}
      data-force-state={forceState}
      className={cx(
        "relative inline-grid h-12 min-w-44 place-items-center rounded-full bg-(--iu-foreground) px-8 text-[11px] font-medium tracking-[0.22em] text-(--iu-background) uppercase transition-[background-color,scale] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none",
        "data-[force-state=hover]:bg-[color-mix(in_oklab,var(--iu-foreground)_86%,var(--iu-background))] pointer-fine:enabled:hover:bg-[color-mix(in_oklab,var(--iu-foreground)_86%,var(--iu-background))]",
        "enabled:active:scale-[0.98] data-[force-state=active]:scale-[0.98]",
        "disabled:cursor-not-allowed disabled:bg-transparent disabled:text-(--iu-muted) disabled:ring-1 disabled:ring-(--iu-muted) disabled:ring-inset",
        busy && "cursor-default",
        ring,
      )}
    >
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute -inset-[5px] size-[calc(100%+10px)] overflow-visible"
      >
        <motion.rect
          width="100%"
          height="100%"
          rx="29"
          fill="none"
          className="stroke-(--iu-accent)"
          strokeWidth="1"
          initial={false}
          animate={{ pathLength: trace }}
          transition={
            reduceMotion ? { duration: 0 } : { pathLength: { duration: status === "loading" ? 1.4 : 0.4, ease: EASE } }
          }
        />
      </svg>
      {(["idle", "loading", "success"] as const).map((key) => (
        <span
          key={key}
          aria-hidden={status !== key}
          className={cx(
            "col-start-1 row-start-1 inline-flex items-center gap-2 transition-opacity duration-300 motion-reduce:transition-none",
            status === key ? "opacity-100" : "opacity-0",
          )}
        >
          {key === "success" && <Check size={14} strokeWidth={1.5} aria-hidden="true" />}
          {key === "idle" ? (disabled ? "Allocation closed" : "Reserve") : key === "loading" ? "Reserving" : "Reserved"}
        </span>
      ))}
    </button>
  );
}

export function VerelleCards({
  product = DEFAULT_PRODUCT,
  advisor = DEFAULT_ADVISOR,
  engraving = "C. & A. · MMXXVI",
  status,
  disabled = false,
  forceState,
  onReserve,
  onBook,
  onEngravingStyles,
  className = "",
}: VerelleCardsProps) {
  const reduceMotion = useReducedMotion();
  const headingId = useId();
  const [internal, setInternal] = useState<VerelleStatus>("idle");
  const current = status ?? internal;

  useEffect(() => {
    if (status !== undefined || internal !== "success") return;
    const timer = setTimeout(() => setInternal("idle"), 4000);
    return () => clearTimeout(timer);
  }, [internal, status]);

  async function reserve() {
    if (disabled || current !== "idle") return;
    const result = onReserve?.();
    if (status !== undefined) return;
    setInternal("loading");
    try {
      await result;
      setInternal("success");
    } catch {
      setInternal("idle");
    }
  }

  const initials = advisor.name
    .split(/\s+/)
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2);
  const cardFrame =
    "group relative rounded-[min(var(--iu-radius),2px)] border border-(--iu-border) bg-(--iu-surface) transition-[border-color] duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none pointer-fine:hover:border-(--iu-foreground)/40 data-[force-state=hover]:border-(--iu-foreground)/40";
  const innerRule =
    "pointer-events-none absolute inset-2 border border-(--iu-foreground)/0 transition-[border-color] duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none pointer-fine:group-hover:border-(--iu-foreground)/25 group-data-[force-state=hover]:border-(--iu-foreground)/25";

  return (
    <MotionConfig reducedMotion="user" transition={reduceMotion ? { duration: 0 } : { duration: 0.4, ease: EASE }}>
      <section
        aria-labelledby={headingId}
        className={cx("@container font-(family-name:--iu-font) text-(--iu-foreground)", className)}
      >
        <h2 id={headingId} className="sr-only">
          {product.house}: {product.name}
        </h2>
        <div className="grid gap-[calc(16px*var(--iu-density))] @3xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] @3xl:grid-rows-[auto_auto]">
          {/* Product */}
          <article
            data-force-state={forceState === "hover" ? "hover" : undefined}
            className={cx(cardFrame, "flex flex-col @3xl:row-span-2")}
          >
            <span aria-hidden="true" className={innerRule} />
            <div className="flex items-baseline justify-between gap-4 px-6 pt-6 @lg:px-8 @lg:pt-8">
              <p className={label}>{product.house}</p>
              <p className="font-mono text-[11px] text-(--iu-muted)">{product.reference}</p>
            </div>
            <div className="relative mx-6 mt-6 flex h-64 items-center justify-center bg-[color-mix(in_oklab,var(--iu-foreground)_3%,var(--iu-surface))] @lg:mx-8 @lg:h-80 dark:bg-[color-mix(in_oklab,var(--iu-foreground)_5%,var(--iu-surface))]">
              <div
                className={cx(
                  "h-[82%] transition-transform duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] group-data-[force-state=hover]:scale-[1.02] motion-reduce:transition-none pointer-fine:group-hover:scale-[1.02]",
                  disabled && "opacity-60",
                )}
              >
                <Watch />
              </div>
              <span
                className="absolute bottom-3 left-1/2 h-px w-10 -translate-x-1/2 bg-(--iu-accent)"
                aria-hidden="true"
              />
            </div>
            <div className="flex flex-1 flex-col px-6 pt-8 pb-6 text-center @lg:px-8 @lg:pb-8">
              <h3 className="font-serif text-[40px] leading-none font-normal tracking-[-0.01em] text-balance">
                {product.name}
              </h3>
              <ul className="mt-4 flex flex-wrap justify-center gap-x-3 gap-y-1 text-[13px] text-(--iu-muted)">
                {product.details.map((detail, index) => (
                  <li key={detail} className="flex items-center gap-3">
                    {index > 0 && <span aria-hidden="true" className="size-[3px] rounded-full bg-(--iu-muted)" />}
                    {detail}
                  </li>
                ))}
              </ul>
              <div className="mx-auto mt-6 w-full max-w-72 border-y border-double border-(--iu-border) py-3">
                <p className="font-serif text-[28px] leading-none tabular-nums">{product.price}</p>
                <p className="mt-2 text-[11px] tracking-[0.14em] text-(--iu-muted) uppercase">
                  {disabled ? "Edition of 120 · allocated" : product.allocation}
                </p>
              </div>
              <div className="mt-8 flex flex-col items-center gap-3">
                <ReserveButton status={current} disabled={disabled} forceState={forceState} onClick={reserve} />
                <p aria-live="polite" className="min-h-5 text-[12px] text-(--iu-muted)">
                  <AnimatePresence initial={false} mode="wait">
                    <motion.span
                      key={disabled ? "closed" : current}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="block"
                    >
                      {disabled
                        ? "Join the waiting list for the next edition"
                        : current === "loading"
                          ? "Confirming your allocation"
                          : current === "success"
                            ? "Held for you for 48 hours. A confirmation is on its way."
                            : "No payment until your fitting"}
                    </motion.span>
                  </AnimatePresence>
                </p>
              </div>
            </div>
          </article>

          {/* Feature: engraving */}
          <article
            data-force-state={forceState === "hover" ? "hover" : undefined}
            className={cx(cardFrame, "grid items-center gap-6 p-6 @md:grid-cols-[minmax(0,1fr)_auto] @lg:p-8")}
          >
            <span aria-hidden="true" className={innerRule} />
            <div>
              <p className={label}>Complimentary</p>
              <h3 className="mt-3 font-serif text-[28px] leading-[1.05] font-normal text-balance">Engraved by hand</h3>
              <p className="mt-3 max-w-[30ch] text-[13px] leading-relaxed text-pretty text-(--iu-muted)">
                Every caseback is cut in our Geneva atelier, up to 24 characters in roman or script.
              </p>
              <button
                type="button"
                onClick={onEngravingStyles}
                disabled={disabled}
                data-force-state={forceState}
                className={cx(
                  "mt-5 inline-flex h-10 items-center gap-2 border-b border-(--iu-foreground)/40 text-[11px] font-medium tracking-[0.2em] whitespace-nowrap uppercase transition-[border-color,gap] duration-300 disabled:cursor-not-allowed disabled:text-(--iu-muted) motion-reduce:transition-none",
                  "enabled:active:opacity-70 data-[force-state=active]:opacity-70 data-[force-state=hover]:gap-3 data-[force-state=hover]:border-(--iu-accent) pointer-fine:enabled:hover:gap-3 pointer-fine:enabled:hover:border-(--iu-accent)",
                  ring,
                )}
              >
                Engraving styles
                <ArrowUpRight size={14} strokeWidth={1.25} aria-hidden="true" />
              </button>
            </div>
            <svg viewBox="0 0 120 120" aria-hidden="true" className="order-first w-24 @md:order-none @md:w-28 @lg:w-32">
              <circle
                cx="60"
                cy="60"
                r="56"
                className="fill-(--iu-background) stroke-(--iu-foreground)"
                strokeOpacity="0.5"
              />
              <circle
                cx="60"
                cy="60"
                r="44"
                fill="none"
                className="stroke-(--iu-foreground)"
                strokeOpacity="0.2"
                strokeDasharray="1 3"
              />
              <path id={`${headingId}-arc`} d="M24 60a36 36 0 0 1 72 0" fill="none" />
              <text className="fill-(--iu-foreground) font-serif italic" fontSize="13">
                <textPath href={`#${headingId}-arc`} startOffset="50%" textAnchor="middle">
                  {engraving}
                </textPath>
              </text>
              <text
                x="60"
                y="80"
                textAnchor="middle"
                className="fill-(--iu-muted) font-mono"
                fontSize="6"
                letterSpacing="1"
              >
                Nº 047 / 120
              </text>
            </svg>
          </article>

          {/* Profile: advisor */}
          <article
            data-force-state={forceState === "hover" ? "hover" : undefined}
            className={cx(cardFrame, "flex flex-col p-6 @lg:p-8")}
          >
            <span aria-hidden="true" className={innerRule} />
            <div className="flex items-center gap-4">
              <span
                aria-hidden="true"
                className="inline-flex size-14 shrink-0 items-center justify-center rounded-full border border-(--iu-foreground)/30 font-serif text-[22px] italic"
              >
                {initials}
              </span>
              <div className="min-w-0">
                <p className={label}>Your advisor</p>
                <h3 className="mt-1 font-serif text-[24px] leading-tight font-normal">{advisor.name}</h3>
                <p className="text-[13px] text-(--iu-muted)">
                  {advisor.role}, {advisor.location}
                </p>
              </div>
            </div>
            <dl className="mt-6 grid grid-cols-2 border-t border-(--iu-border) pt-4 text-[13px]">
              <div>
                <dt className={label}>Next opening</dt>
                <dd className="mt-1.5 pr-4 text-pretty">{disabled ? "Fully booked this week" : advisor.nextSlot}</dd>
              </div>
              <div className="border-l border-(--iu-border) pl-4">
                <dt className={label}>Response</dt>
                <dd className="mt-1.5 text-pretty">{advisor.responseTime}</dd>
              </div>
            </dl>
            <button
              type="button"
              onClick={onBook}
              disabled={disabled}
              data-force-state={forceState}
              className={cx(
                "mt-6 inline-flex h-11 items-center justify-center rounded-full border border-(--iu-foreground)/50 px-6 text-[11px] font-medium tracking-[0.2em] uppercase transition-[background-color,border-color,scale] duration-300 disabled:cursor-not-allowed disabled:border-dashed disabled:border-(--iu-muted) disabled:text-(--iu-muted) motion-reduce:transition-none",
                "enabled:active:scale-[0.98] data-[force-state=active]:scale-[0.98] data-[force-state=hover]:border-(--iu-foreground) data-[force-state=hover]:bg-(--iu-foreground)/5 pointer-fine:enabled:hover:border-(--iu-foreground) pointer-fine:enabled:hover:bg-(--iu-foreground)/5",
                ring,
              )}
            >
              {disabled ? "Appointments full" : "Book a private appointment"}
            </button>
          </article>
        </div>
      </section>
    </MotionConfig>
  );
}

export default VerelleCards;
