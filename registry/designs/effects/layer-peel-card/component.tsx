"use client";

import { useId, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent } from "react";
import { AnimatePresence, MotionConfig, motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import { ArrowRight, Layers } from "lucide-react";

export type PeelLayer = {
  /** Short name shown on the layer sheet and in the list. */
  name: string;
  /** The component the layer exports as. */
  exportName: string;
  note: string;
};

export type LayerPeelCardProps = {
  brand?: string;
  headline?: string;
  subline?: string;
  ctaLabel?: string;
  ctaHref?: string;
  /** Exactly four layers, bottom to top: frame, chart, balance card, toast. */
  layers?: PeelLayer[];
  /** Start pulled apart (useful for docs pages). */
  defaultExploded?: boolean;
  onExplodedChange?: (exploded: boolean) => void;
  onLayerSelect?: (index: number | null) => void;
  className?: string;
};

const DEFAULT_LAYERS: PeelLayer[] = [
  { name: "Frame", exportName: "<AppFrame />", note: "Header, nav and safe areas" },
  { name: "Chart", exportName: "<SavingsChart />", note: "Seven bars, drawn from data" },
  { name: "Balance", exportName: "<BalanceCard />", note: "Reads your --brand token" },
  { name: "Toast", exportName: "<RoundUpToast />", note: "Ships with its own timer" },
];

const BARS = [
  { day: "M", value: 0.42 },
  { day: "T", value: 0.68 },
  { day: "W", value: 0.35 },
  { day: "T", value: 0.81 },
  { day: "F", value: 0.57 },
  { day: "S", value: 0.94 },
  { day: "S", value: 0.62 },
];

const BOUNCY = { type: "spring", stiffness: 400, damping: 18 } as const;
const MAX_TILT = 12;

function cx(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

/** The dashed sheet and its sticker label, visible only when the stack is pulled apart. */
function Sheet({ index, name, exploded }: { index: number; name: string; exploded: boolean }) {
  return (
    <AnimatePresence initial={false}>
      {exploded ? (
        <motion.span
          key="sheet"
          aria-hidden="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="absolute inset-0"
        >
          <span className="absolute inset-0 rounded-[max(var(--iu-radius),20px)] border-2 border-dashed border-(--iu-foreground)/45" />
          <motion.span
            initial={{ scale: 0.6 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.6 }}
            transition={BOUNCY}
            className="absolute -top-3 -left-3 z-10 rounded-full border-2 border-(--iu-foreground) bg-(--iu-accent) px-2.5 py-0.5 font-mono text-[11px] font-bold whitespace-nowrap text-(--iu-accent-foreground) shadow-[2px_2px_0_var(--iu-foreground)]"
          >
            {String(index + 1).padStart(2, "0")} {name}
          </motion.span>
        </motion.span>
      ) : null}
    </AnimatePresence>
  );
}

export function LayerPeelCard({
  brand = "Mallow",
  headline = "Every screen is a stack. Pull this one apart.",
  subline = "Mallow exports each layer of your design as its own component, so the toast you drew is the toast you ship, timer and all.",
  ctaLabel = "Try it on your file",
  ctaHref = "#import",
  layers = DEFAULT_LAYERS,
  defaultExploded = false,
  onExplodedChange,
  onLayerSelect,
  className = "",
}: LayerPeelCardProps) {
  const reduceMotion = useReducedMotion();
  const titleId = useId();
  const [exploded, setExploded] = useState(defaultExploded);
  const [focused, setFocused] = useState<number | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);
  const rotateX = useSpring(tiltX, { stiffness: 300, damping: 22 });
  const rotateY = useSpring(tiltY, { stiffness: 300, damping: 22 });

  const toggle = () => {
    const next = !exploded;
    setExploded(next);
    onExplodedChange?.(next);
  };

  const select = (index: number | null) => {
    setFocused(index);
    onLayerSelect?.(index);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (reduceMotion || event.pointerType !== "mouse") return;
    const box = stageRef.current?.getBoundingClientRect();
    if (!box) return;
    const px = (event.clientX - box.left) / box.width - 0.5;
    const py = (event.clientY - box.top) / box.height - 0.5;
    tiltY.set(px * MAX_TILT * 2);
    tiltX.set(-py * MAX_TILT * 2);
  };

  const onPointerLeave = () => {
    tiltX.set(0);
    tiltY.set(0);
  };

  // Arrow keys move between layers in the list, as a roving group.
  const onListKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    const keys = ["ArrowDown", "ArrowUp", "Home", "End"];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    const current = focused ?? -1;
    const last = layers.length - 1;
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? last
          : event.key === "ArrowDown"
            ? Math.min(last, current + 1)
            : Math.max(0, current - 1);
    const buttons = event.currentTarget.querySelectorAll<HTMLButtonElement>("button");
    buttons[next]?.focus();
  };

  // Resting stack: small depth steps so a tilt reads as parallax. Pulled apart: a tipped, spaced-out stack.
  const layerMotion = (index: number) => {
    const lift = focused === index ? 28 : 0;
    const dim = focused !== null && focused !== index ? 0.45 : 1;
    if (reduceMotion && exploded) {
      // Flat fallback: the sheets fan out diagonally with no 3D at all.
      return { x: index * 26, y: index * -26, z: 0, opacity: dim };
    }
    return { x: 0, y: 0, z: exploded ? index * 64 + lift : index * 14 + lift / 2, opacity: dim };
  };

  return (
    <MotionConfig reducedMotion="user" transition={reduceMotion ? { duration: 0 } : BOUNCY}>
      <section
        aria-labelledby={titleId}
        className={cx(
          "overflow-hidden bg-(--iu-background) font-(family-name:--iu-font) text-(--iu-foreground) [--lp-shade:color-mix(in_oklab,var(--iu-accent)_32%,var(--iu-foreground))] dark:[--lp-shade:color-mix(in_oklab,var(--iu-accent)_30%,var(--iu-background))]",
          className,
        )}
      >
        <div className="mx-auto grid max-w-[1200px] grid-cols-12 items-center gap-x-6 gap-y-12 px-6 py-14 sm:px-10 sm:py-20">
          <div className="col-span-12 lg:col-span-5">
            <span className="inline-flex -rotate-2 items-center gap-1.5 rounded-full border-2 border-(--iu-foreground) bg-(--iu-surface) px-3 py-1 text-xs font-bold">
              <Layers size={14} strokeWidth={2} aria-hidden="true" />
              {brand} layers
            </span>
            <h2
              id={titleId}
              className="mt-6 text-[clamp(2.25rem,1.5rem+3vw,3.75rem)] leading-[1.02] font-extrabold tracking-[-0.035em] text-balance"
            >
              {headline}
            </h2>
            <p className="mt-5 max-w-[30rem] text-base leading-relaxed text-pretty text-(--iu-muted) sm:text-lg">
              {subline}
            </p>

            <ul
              aria-label="Layers in this screen"
              onKeyDown={onListKeyDown}
              className="mt-8 grid gap-2"
              onMouseLeave={() => select(null)}
            >
              {[...layers].reverse().map((layer, reversedIndex) => {
                const index = layers.length - 1 - reversedIndex;
                return (
                  <li key={layer.name}>
                    <button
                      type="button"
                      aria-pressed={focused === index}
                      onFocus={() => select(index)}
                      onBlur={() => select(null)}
                      onMouseEnter={() => select(index)}
                      onClick={() => select(focused === index ? null : index)}
                      className="group flex w-full items-center gap-3 rounded-[max(var(--iu-radius),16px)] border-2 border-(--iu-foreground) bg-(--iu-surface) px-[calc(14px*var(--iu-density))] py-[calc(10px*var(--iu-density))] text-left shadow-[3px_3px_0_var(--lp-shade)] transition-[translate,box-shadow] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--iu-accent) aria-pressed:-translate-x-0.5 aria-pressed:-translate-y-0.5 aria-pressed:shadow-[5px_5px_0_var(--lp-shade)] motion-reduce:transition-none"
                    >
                      <span
                        aria-hidden="true"
                        className="grid size-8 shrink-0 place-items-center rounded-full border-2 border-(--iu-foreground) font-mono text-xs font-bold group-aria-pressed:bg-(--iu-accent) group-aria-pressed:text-(--iu-accent-foreground)"
                      >
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-bold">{layer.name}</span>
                        <span className="block truncate text-xs text-(--iu-muted)">{layer.note}</span>
                      </span>
                      <code className="hidden font-mono text-xs text-(--iu-foreground) sm:block">
                        {layer.exportName}
                      </code>
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                type="button"
                aria-pressed={exploded}
                onClick={toggle}
                className="inline-flex h-12 items-center gap-2 rounded-full border-2 border-(--iu-foreground) bg-(--iu-surface) px-5 text-sm font-bold shadow-[4px_4px_0_var(--lp-shade)] transition-[translate,box-shadow] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--iu-accent) active:translate-x-1 active:translate-y-1 active:shadow-none motion-reduce:transition-none"
              >
                <Layers size={16} strokeWidth={2} aria-hidden="true" />
                {exploded ? "Stack it back" : "Pull it apart"}
              </button>
              <a
                href={ctaHref}
                className="group inline-flex h-12 items-center gap-2 rounded-full border-2 border-(--iu-foreground) bg-(--iu-accent) px-5 text-sm font-bold text-(--iu-accent-foreground) shadow-[4px_4px_0_var(--iu-foreground)] transition-[translate,box-shadow] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--iu-accent) active:translate-x-1 active:translate-y-1 active:shadow-none motion-reduce:transition-none"
              >
                {ctaLabel}
                <ArrowRight
                  size={16}
                  strokeWidth={2}
                  aria-hidden="true"
                  className="transition-transform duration-150 motion-reduce:transition-none pointer-fine:group-hover:translate-x-0.5"
                />
              </a>
            </div>
            <p aria-live="polite" className="sr-only">
              {exploded ? `Layers pulled apart: ${layers.map((layer) => layer.name).join(", ")}.` : "Layers stacked."}
            </p>
          </div>

          <div
            ref={stageRef}
            onPointerMove={onPointerMove}
            onPointerLeave={onPointerLeave}
            className="col-span-12 grid min-h-[540px] place-items-center [perspective:1400px] sm:min-h-[620px] lg:col-span-7"
          >
            <motion.div
              role="img"
              aria-label={`A savings app screen built from ${layers.length} layers: ${layers.map((layer) => layer.name).join(", ")}.`}
              style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
              className="relative"
            >
              <motion.div
                initial={false}
                animate={
                  exploded && !reduceMotion
                    ? { rotateX: 54, rotateZ: -32, y: 56, scale: 0.86 }
                    : { rotateX: 0, rotateZ: 0, y: 0, scale: 1 }
                }
                style={{ transformStyle: "preserve-3d" }}
                className="relative h-[460px] w-[290px] sm:h-[500px] sm:w-[340px]"
              >
                {/* 01 Frame */}
                <motion.div
                  initial={false}
                  animate={layerMotion(0)}
                  className="absolute inset-0 overflow-visible rounded-[max(var(--iu-radius),20px)] border-2 border-(--iu-foreground) bg-(--iu-surface) shadow-[6px_6px_0_var(--lp-shade)]"
                >
                  <Sheet index={0} name={layers[0]?.name ?? "Frame"} exploded={exploded} />
                  <div className="relative flex items-center justify-between px-5 pt-5">
                    <span className="flex items-center gap-2">
                      <span className="grid size-8 place-items-center rounded-full bg-(--iu-foreground) text-[11px] font-bold text-(--iu-background)">
                        NA
                      </span>
                      <span className="text-sm leading-tight font-bold">
                        Nadia
                        <span className="block text-[11px] font-medium text-(--iu-muted)">Rainy-day pot</span>
                      </span>
                    </span>
                    <span className="flex gap-1">
                      <span className="size-1.5 rounded-full bg-(--iu-foreground)" />
                      <span className="size-1.5 rounded-full bg-(--iu-foreground)/30" />
                      <span className="size-1.5 rounded-full bg-(--iu-foreground)/30" />
                    </span>
                  </div>
                  <div className="absolute inset-x-5 bottom-5 flex justify-between border-t-2 border-(--iu-foreground)/15 pt-3 text-[11px] font-bold text-(--iu-muted)">
                    <span className="text-(--iu-foreground)">Home</span>
                    <span>Pots</span>
                    <span>Cards</span>
                    <span>You</span>
                  </div>
                </motion.div>

                {/* 02 Chart */}
                <motion.div initial={false} animate={layerMotion(1)} className="absolute inset-0">
                  <Sheet index={1} name={layers[1]?.name ?? "Chart"} exploded={exploded} />
                  <div className="absolute inset-x-5 bottom-[72px] h-[120px] sm:h-[140px]">
                    <div className="flex items-baseline justify-between text-[11px] font-bold">
                      <span>This week</span>
                      <span className="font-mono text-(--iu-muted) tabular-nums">$48.20</span>
                    </div>
                    <div className="mt-2 flex h-[88px] items-end gap-2 sm:h-[108px]">
                      {BARS.map((bar, index) => (
                        <span key={index} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                          <span
                            className={cx(
                              "w-full rounded-full border-2 border-(--iu-foreground)",
                              index === 5
                                ? "bg-(--iu-accent)"
                                : "bg-[color-mix(in_oklab,var(--iu-accent)_22%,var(--iu-surface))]",
                            )}
                            style={{ height: `${Math.round(bar.value * 80)}%` }}
                          />
                          <span className="text-[10px] font-bold text-(--iu-muted)">{bar.day}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>

                {/* 03 Balance card */}
                <motion.div initial={false} animate={layerMotion(2)} className="absolute inset-0">
                  <Sheet index={2} name={layers[2]?.name ?? "Balance"} exploded={exploded} />
                  <div className="absolute inset-x-5 top-[76px] rounded-[max(var(--iu-radius),18px)] border-2 border-(--iu-foreground) bg-(--iu-accent) p-4 text-(--iu-accent-foreground) shadow-[4px_4px_0_var(--iu-foreground)]">
                    <span className="text-xs font-bold">Saved this month</span>
                    <span className="mt-1 block text-[34px] leading-none font-extrabold tracking-[-0.03em] tabular-nums">
                      $412.60
                    </span>
                    <span className="mt-3 flex items-center justify-between text-xs font-bold">
                      <span>Goal $600 by 30 Nov</span>
                      <span className="font-mono tabular-nums">69%</span>
                    </span>
                    <span className="mt-2 block h-2.5 overflow-hidden rounded-full border-2 border-(--iu-accent-foreground)">
                      <span className="block h-full w-[69%] bg-(--iu-accent-foreground)" />
                    </span>
                  </div>
                </motion.div>

                {/* 04 Toast */}
                <motion.div initial={false} animate={layerMotion(3)} className="absolute inset-0">
                  <Sheet index={3} name={layers[3]?.name ?? "Toast"} exploded={exploded} />
                  <div className="absolute top-[204px] -right-6 flex rotate-[-4deg] items-center gap-2 rounded-full border-2 border-(--iu-foreground) bg-(--iu-surface) py-2 pr-4 pl-2 shadow-[3px_3px_0_var(--iu-foreground)] sm:top-[210px]">
                    <span className="grid size-7 place-items-center rounded-full bg-(--iu-accent) text-xs font-extrabold text-(--iu-accent-foreground)">
                      +
                    </span>
                    <span className="text-xs leading-tight font-bold">
                      Rounded up $0.80
                      <span className="block font-medium text-(--iu-muted)">Oat flat white</span>
                    </span>
                  </div>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>
    </MotionConfig>
  );
}

export default LayerPeelCard;
