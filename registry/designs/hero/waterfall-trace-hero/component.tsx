"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import {
  AnimatePresence,
  MotionConfig,
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type MotionValue,
} from "motion/react";
import { ArrowRight, Lightbulb, RotateCcw } from "lucide-react";

export type TraceSpan = {
  id: string;
  service: string;
  name: string;
  /** Nesting level in the trace tree; 0 is the root span. */
  depth: number;
  /** Start offset from the beginning of the trace, in milliseconds. */
  start: number;
  /** Duration in milliseconds. */
  duration: number;
  attributes: { key: string; value: string }[];
  /** Optional finding shown when the span is selected. */
  insight?: string;
};

export type WaterfallTraceHeroProps = {
  kicker?: string;
  headline?: string;
  subline?: string;
  ctaLabel?: string;
  ctaHref?: string;
  installCommand?: string;
  method?: string;
  route?: string;
  traceId?: string;
  statusLabel?: string;
  region?: string;
  spans?: TraceSpan[];
  /** Milliseconds between ruler ticks. */
  tickEvery?: number;
  onSelectSpan?: (span: TraceSpan) => void;
  className?: string;
};

const DEFAULT_SPANS: TraceSpan[] = [
  {
    id: "s1",
    service: "gateway",
    name: "POST /api/checkout",
    depth: 0,
    start: 0,
    duration: 842,
    attributes: [
      { key: "http.method", value: "POST" },
      { key: "http.status_code", value: "200" },
      { key: "client.region", value: "eu-west-1" },
      { key: "user.plan", value: "growth" },
    ],
  },
  {
    id: "s2",
    service: "auth",
    name: "verify-session",
    depth: 1,
    start: 6,
    duration: 32,
    attributes: [
      { key: "auth.method", value: "jwt" },
      { key: "cache.hit", value: "true" },
    ],
  },
  {
    id: "s3",
    service: "cart",
    name: "load-cart",
    depth: 1,
    start: 40,
    duration: 82,
    attributes: [
      { key: "cart.items", value: "4" },
      { key: "redis.command", value: "HGETALL" },
    ],
  },
  {
    id: "s4",
    service: "pricing",
    name: "compute-tax",
    depth: 1,
    start: 124,
    duration: 72,
    attributes: [
      { key: "tax.country", value: "DE" },
      { key: "tax.rate", value: "0.19" },
    ],
  },
  {
    id: "s5",
    service: "postgres",
    name: "SELECT inventory",
    depth: 2,
    start: 198,
    duration: 413,
    attributes: [
      { key: "db.system", value: "postgresql" },
      { key: "db.statement", value: "SELECT sku, qty FROM inventory WHERE sku = ANY($1)" },
      { key: "db.rows_scanned", value: "12,482" },
      { key: "net.peer.name", value: "pg-primary-2" },
    ],
    insight: "Sequential scan over 12,482 rows. An index on inventory.sku brings this to about 9 ms.",
  },
  {
    id: "s6",
    service: "payments",
    name: "charge-card",
    depth: 1,
    start: 614,
    duration: 176,
    attributes: [
      { key: "payment.provider", value: "card" },
      { key: "payment.amount", value: "€184.20" },
      { key: "retry.count", value: "0" },
    ],
  },
  {
    id: "s7",
    service: "queue",
    name: "publish order.created",
    depth: 1,
    start: 792,
    duration: 38,
    attributes: [
      { key: "messaging.system", value: "nats" },
      { key: "messaging.destination", value: "orders" },
    ],
  },
];

function cx(...values: (string | false | undefined)[]) {
  return values.filter(Boolean).join(" ");
}

const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

function SpanBar({
  span,
  total,
  clock,
  critical,
}: {
  span: TraceSpan;
  total: number;
  clock: MotionValue<number>;
  critical: boolean;
}) {
  const scaleX = useTransform(clock, (now) => Math.min(1, Math.max(0, (now - span.start) / span.duration)));
  return (
    <motion.span
      aria-hidden="true"
      className={cx(
        "absolute top-1/2 h-2 origin-left -translate-y-1/2 rounded-[2px]",
        critical ? "bg-(--iu-accent)" : span.depth === 0 ? "bg-(--iu-foreground)/45" : "bg-(--iu-foreground)/25",
      )}
      style={{
        left: `${(span.start / total) * 100}%`,
        width: `max(2px, ${(span.duration / total) * 100}%)`,
        scaleX,
      }}
    />
  );
}

export function WaterfallTraceHero({
  kicker = "Spanline · distributed tracing",
  headline = "See where every millisecond went.",
  subline = "Spanline stitches each request across your services into one waterfall, then points at the span that cost you the most. OpenTelemetry in, answers out.",
  ctaLabel = "Instrument your first service",
  ctaHref = "#start",
  installCommand = "npm i @spanline/otel",
  method = "POST",
  route = "/api/checkout",
  traceId = "7f3a0e9c…c912",
  statusLabel = "200 OK",
  region = "prod · eu-west-1",
  spans = DEFAULT_SPANS,
  tickEvery = 200,
  onSelectSpan,
  className = "",
}: WaterfallTraceHeroProps) {
  const reduceMotion = useReducedMotion();
  const titleId = useId();
  const listId = useId();
  const total = Math.max(1, ...spans.map((span) => span.start + span.duration));
  const critical = spans
    .filter((span) => span.depth > 0)
    .reduce<TraceSpan | undefined>(
      (slowest, span) => (!slowest || span.duration > slowest.duration ? span : slowest),
      undefined,
    );

  // The clock starts complete so server-rendered markup shows the whole trace, then replays on mount.
  const clock = useMotionValue(total);
  const elapsed = useTransform(clock, (now) => `${Math.round(now)} ms`);
  const playheadLeft = useTransform(clock, (now) => `${(now / total) * 100}%`);
  const [done, setDone] = useState(true);
  const [run, setRun] = useState(0);
  const [selected, setSelected] = useState(critical?.id ?? spans[0]?.id ?? "");
  const touched = useRef(false);
  const figureRef = useRef<HTMLElement>(null);
  const optionRefs = useRef<(HTMLDivElement | null)[]>([]);

  useIsomorphicLayoutEffect(() => {
    if (reduceMotion) {
      clock.set(total);
      setDone(true);
      return;
    }
    clock.set(0);
    setDone(false);
    if (!touched.current) setSelected(spans[0]?.id ?? "");
    let controls: ReturnType<typeof animate> | undefined;
    const node = figureRef.current;
    const start = () => {
      controls = animate(clock, total, {
        duration: 2.4,
        ease: "linear",
        delay: 0.3,
        onComplete: () => {
          setDone(true);
          if (!touched.current && critical) setSelected(critical.id);
        },
      });
    };
    if (!node || typeof IntersectionObserver === "undefined") {
      start();
      return () => controls?.stop();
    }
    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      if (entry.isIntersecting) {
        if (controls) controls.play();
        else start();
      } else controls?.pause();
    });
    observer.observe(node);
    return () => {
      observer.disconnect();
      controls?.stop();
    };
  }, [run, reduceMotion]);

  const selectedSpan = spans.find((span) => span.id === selected) ?? spans[0];
  const selectedIndex = Math.max(
    0,
    spans.findIndex((span) => span.id === selected),
  );

  function choose(index: number, focus: boolean) {
    const span = spans[index];
    if (!span) return;
    touched.current = true;
    setSelected(span.id);
    onSelectSpan?.(span);
    if (focus) optionRefs.current[index]?.focus();
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>, index: number) {
    const last = spans.length - 1;
    const next =
      event.key === "ArrowDown"
        ? Math.min(last, index + 1)
        : event.key === "ArrowUp"
          ? Math.max(0, index - 1)
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? last
              : null;
    if (next === null) return;
    event.preventDefault();
    choose(next, true);
  }

  const ticks: number[] = [];
  for (let value = 0; value <= total; value += tickEvery) ticks.push(value);
  const share = critical ? Math.round((critical.duration / total) * 100) : 0;

  return (
    <MotionConfig
      reducedMotion="user"
      transition={reduceMotion ? { duration: 0 } : { duration: 0.16, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <section
        aria-labelledby={titleId}
        className={`bg-(--iu-background) font-(family-name:--iu-font) text-(--iu-foreground) ${className}`}
      >
        <div className="mx-auto max-w-[1240px] px-6 pt-12 pb-16 sm:px-10 sm:pt-16 sm:pb-24">
          <div className="grid grid-cols-12 gap-x-6 gap-y-8">
            <div className="col-span-12 lg:col-span-7">
              <p className="flex items-center gap-2 font-mono text-[11px] tracking-[0.08em] text-(--iu-muted) uppercase">
                <span aria-hidden="true" className="size-1.5 rounded-full bg-(--iu-accent)" />
                {kicker}
              </p>
              <h1
                id={titleId}
                className="mt-5 text-[clamp(2.75rem,1.7rem+4.4vw,5.25rem)] leading-[0.98] font-semibold tracking-[-0.04em] text-balance"
              >
                {headline}
              </h1>
            </div>
            <div className="col-span-12 flex flex-col justify-end lg:col-span-5">
              <p className="max-w-[34rem] text-base leading-relaxed text-pretty text-(--iu-muted) sm:text-[17px]">
                {subline}
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-4">
                <a
                  href={ctaHref}
                  className="group inline-flex h-11 items-center gap-2 rounded-[min(var(--iu-radius),8px)] bg-(--iu-accent) px-5 text-sm font-medium text-(--iu-accent-foreground) transition-[filter] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--iu-accent) motion-reduce:transition-none pointer-fine:hover:brightness-110"
                >
                  {ctaLabel}
                  <ArrowRight
                    size={16}
                    strokeWidth={1.5}
                    aria-hidden="true"
                    className="transition-transform duration-150 motion-reduce:transition-none pointer-fine:group-hover:translate-x-0.5"
                  />
                </a>
                <code className="font-mono text-[13px] text-(--iu-muted)">
                  <span aria-hidden="true" className="text-(--iu-foreground)/40">
                    ${" "}
                  </span>
                  {installCommand}
                </code>
              </div>
            </div>
          </div>

          <figure
            ref={figureRef}
            aria-label={`Trace of ${method} ${route}`}
            className="@container mt-14 overflow-hidden rounded-[min(var(--iu-radius),8px)] border border-(--iu-border) bg-(--iu-surface) sm:mt-20 dark:border-(--iu-foreground)/12"
          >
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-dashed border-(--iu-foreground)/15 px-4 py-[calc(12px*var(--iu-density))]">
              <span className="rounded-[min(var(--iu-radius),4px)] border border-(--iu-foreground)/25 px-1.5 py-0.5 font-mono text-[11px] font-medium">
                {method}
              </span>
              <span className="min-w-0 truncate font-mono text-[13px]">{route}</span>
              <span className="hidden font-mono text-[11px] text-(--iu-muted) @lg:inline">
                trace {traceId} · {region}
              </span>
              <span className="ml-auto flex items-center gap-4 font-mono text-[12px] tabular-nums">
                <span className="inline-flex items-center gap-1.5">
                  <span aria-hidden="true" className="size-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                  {statusLabel}
                </span>
                <motion.span className="min-w-[4.5rem] text-right">{elapsed}</motion.span>
                <button
                  type="button"
                  aria-label="Replay trace"
                  onClick={() => {
                    touched.current = false;
                    setRun((count) => count + 1);
                  }}
                  className="inline-flex size-8 items-center justify-center rounded-[min(var(--iu-radius),6px)] text-(--iu-muted) transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--iu-accent) motion-reduce:transition-none pointer-coarse:size-10 pointer-fine:hover:bg-(--iu-foreground)/8 pointer-fine:hover:text-(--iu-foreground)"
                >
                  <RotateCcw size={16} strokeWidth={1.5} aria-hidden="true" />
                </button>
              </span>
            </div>

            <div className="grid @4xl:grid-cols-[minmax(0,1fr)_300px]">
              <div className="relative [--dur-col:56px] [--name-col:42%] @2xl:[--name-col:34%]">
                {/* Ruler */}
                <div className="grid grid-cols-[var(--name-col)_minmax(0,1fr)_var(--dur-col)] border-b border-(--iu-border) font-mono text-[10px] tracking-[0.08em] text-(--iu-muted) uppercase">
                  <span className="px-4 py-2">Span</span>
                  <span className="relative mx-3 py-2" aria-hidden="true">
                    {ticks.map((tick) => (
                      <span
                        key={tick}
                        className={cx(
                          "absolute top-2 tracking-normal tabular-nums",
                          tick === 0 ? "" : "-translate-x-1/2",
                          tick !== 0 && tick % (tickEvery * 2) !== 0 ? "hidden @lg:inline" : "",
                        )}
                        style={{ left: `${(tick / total) * 100}%` }}
                      >
                        {tick}
                      </span>
                    ))}
                  </span>
                  <span className="px-3 py-2 text-right">ms</span>
                </div>

                <div className="relative">
                  {/* Tick lines and playhead, aligned with the timeline column */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-y-0 right-[calc(var(--dur-col)+12px)] left-[calc(var(--name-col)+12px)]"
                  >
                    {ticks.map((tick) => (
                      <span
                        key={tick}
                        className="absolute inset-y-0 border-l border-dashed border-(--iu-foreground)/10"
                        style={{ left: `${(tick / total) * 100}%` }}
                      />
                    ))}
                    <AnimatePresence initial={false}>
                      {!done ? (
                        <motion.span
                          key="playhead"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-y-0 z-10 w-px bg-(--iu-accent)"
                          style={{ left: playheadLeft }}
                        />
                      ) : null}
                    </AnimatePresence>
                  </div>

                  <div id={listId} role="listbox" aria-label="Spans in this trace" className="relative">
                    {spans.map((span, index) => {
                      const isSelected = span.id === selectedSpan?.id;
                      const isCritical = done && span.id === critical?.id;
                      return (
                        <div
                          key={span.id}
                          ref={(node) => {
                            optionRefs.current[index] = node;
                          }}
                          role="option"
                          aria-selected={isSelected}
                          tabIndex={index === selectedIndex ? 0 : -1}
                          onClick={() => choose(index, false)}
                          onKeyDown={(event) => onKeyDown(event, index)}
                          className={cx(
                            "relative grid cursor-default grid-cols-[var(--name-col)_minmax(0,1fr)_var(--dur-col)] items-center border-b border-(--iu-border) last:border-b-0 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-(--iu-accent)",
                            isSelected
                              ? "bg-(--iu-foreground)/[0.06]"
                              : "pointer-fine:hover:bg-(--iu-foreground)/[0.03]",
                          )}
                        >
                          {isSelected ? (
                            <span aria-hidden="true" className="absolute inset-y-0 left-0 w-0.5 bg-(--iu-accent)" />
                          ) : null}
                          <span
                            className="flex min-w-0 flex-col py-[calc(8px*var(--iu-density))] pr-2 pl-4"
                            style={{ paddingLeft: `${16 + span.depth * 12}px` }}
                          >
                            <span className="font-mono text-[10px] tracking-[0.04em] text-(--iu-muted)">
                              {span.service}
                            </span>
                            <span className="truncate font-mono text-[12px] leading-tight">{span.name}</span>
                          </span>
                          <span className="relative mx-3 h-7">
                            <SpanBar span={span} total={total} clock={clock} critical={isCritical} />
                          </span>
                          <span
                            className={cx(
                              "px-3 text-right font-mono text-[12px] tabular-nums",
                              isCritical ? "font-semibold text-(--iu-foreground)" : "text-(--iu-muted)",
                            )}
                          >
                            {span.duration}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <aside
                aria-label="Selected span"
                className="border-t border-(--iu-border) bg-(--iu-foreground)/[0.02] p-4 @4xl:border-t-0 @4xl:border-l dark:bg-(--iu-background)/40"
              >
                {selectedSpan ? (
                  <>
                    <p className="font-mono text-[10px] tracking-[0.08em] text-(--iu-muted) uppercase">
                      {selectedSpan.service}
                    </p>
                    <p className="mt-1 font-mono text-[13px] font-medium break-words">{selectedSpan.name}</p>
                    <dl className="mt-4 grid grid-cols-3 gap-px overflow-hidden rounded-[min(var(--iu-radius),6px)] border border-(--iu-border) bg-(--iu-border) font-mono">
                      {[
                        { label: "Start", value: `+${selectedSpan.start} ms` },
                        { label: "Duration", value: `${selectedSpan.duration} ms` },
                        { label: "Share", value: `${Math.round((selectedSpan.duration / total) * 100)}%` },
                      ].map((item) => (
                        <div key={item.label} className="bg-(--iu-surface) px-2.5 py-2">
                          <dt className="text-[10px] tracking-[0.06em] text-(--iu-muted) uppercase">{item.label}</dt>
                          <dd className="mt-0.5 text-[12px] tabular-nums">{item.value}</dd>
                        </div>
                      ))}
                    </dl>
                    <dl className="mt-4 space-y-2 border-t border-dashed border-(--iu-foreground)/15 pt-3 font-mono text-[11px]">
                      {selectedSpan.attributes.map((attribute) => (
                        <div key={attribute.key} className="grid grid-cols-[minmax(0,7rem)_minmax(0,1fr)] gap-3">
                          <dt className="truncate text-(--iu-muted)">{attribute.key}</dt>
                          <dd className="break-words">{attribute.value}</dd>
                        </div>
                      ))}
                    </dl>
                    {selectedSpan.insight ? (
                      <p className="mt-4 flex gap-2 rounded-[min(var(--iu-radius),6px)] border border-amber-600/40 bg-amber-500/8 p-2.5 text-[12px] leading-snug dark:border-amber-400/30">
                        <Lightbulb
                          size={14}
                          strokeWidth={1.5}
                          aria-hidden="true"
                          className="mt-px shrink-0 text-amber-700 dark:text-amber-300"
                        />
                        <span>
                          <span className="font-medium">Suggestion. </span>
                          {selectedSpan.insight}
                        </span>
                      </p>
                    ) : null}
                  </>
                ) : null}
              </aside>
            </div>

            <div className="flex min-h-11 flex-wrap items-center gap-x-3 gap-y-1 border-t border-dashed border-(--iu-foreground)/15 px-4 py-2.5 font-mono text-[12px]">
              <AnimatePresence initial={false} mode="wait">
                {done && critical ? (
                  <motion.span
                    key="verdict"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="inline-flex flex-wrap items-center gap-x-3 gap-y-1"
                  >
                    <span aria-hidden="true" className="h-2 w-4 rounded-[2px] bg-(--iu-accent)" />
                    <span>
                      Slowest span: <span className="font-semibold">{critical.name}</span>
                    </span>
                    <span className="text-(--iu-muted) tabular-nums">
                      {critical.duration} ms · {share}% of the request
                    </span>
                  </motion.span>
                ) : (
                  <motion.span
                    key="reading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-(--iu-muted)"
                  >
                    Reading {spans.length} spans…
                  </motion.span>
                )}
              </AnimatePresence>
              <span aria-live="polite" className="sr-only">
                {done && critical ? `Slowest span is ${critical.name}, ${critical.duration} milliseconds.` : ""}
              </span>
            </div>
          </figure>
        </div>
      </section>
    </MotionConfig>
  );
}

export default WaterfallTraceHero;
