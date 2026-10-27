"use client";

import { useId, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, CircleAlert, CircleCheck, Rocket, TriangleAlert } from "lucide-react";

export type KestrelMinute = {
  p50: number;
  p95: number;
  p99: number;
  rpm: number;
  errorRate: number;
  apdex: number;
  cpu: number;
};

export type KestrelLogLine = { time: string; level: "ERROR" | "WARN" | "INFO"; service: string; message: string };

export type KestrelEndpoint = { method: string; path: string; weight: number; incidentWeight: number; share: number };

export type KestrelSignalBentoProps = {
  kicker?: string;
  headline?: string;
  subline?: string;
  /** One entry per minute, oldest first. Defaults to a generated hour with an incident after a deploy. */
  minutes?: KestrelMinute[];
  /** Label of the first minute, as HH:MM. */
  startTime?: string;
  defaultMinute?: number;
  deploy?: { minute: number; version: string };
  incident?: { from: number; to: number; id: string };
  endpoints?: KestrelEndpoint[];
  /** Error budget remaining for the 30-day window, 0 to 100. */
  budgetRemaining?: number;
  status?: "idle" | "loading";
  onMinuteChange?: (index: number) => void;
  className?: string;
};

function spike(index: number) {
  return index >= 37 && index <= 47 ? Math.round(520 * Math.exp(-((index - 41) ** 2) / 8)) : 0;
}

const DEFAULT_MINUTES: KestrelMinute[] = Array.from({ length: 60 }, (_, index) => {
  const extra = spike(index);
  const heat = extra / 520;
  return {
    p50: Math.round(88 + 6 * Math.sin(index / 5) + extra * 0.4),
    p95: Math.round(212 + 18 * Math.sin(index / 4 + 1) + ((index * 7) % 11) + extra),
    p99: Math.round(384 + 30 * Math.sin(index / 3) + ((index * 13) % 23) + extra * 1.7),
    rpm: Math.round(18400 + 900 * Math.sin(index / 7) + ((index * 53) % 400) - heat * 2100),
    errorRate: Number((0.18 + ((index * 17) % 9) / 100 + heat * 3.2).toFixed(2)),
    apdex: Number((0.97 - ((index * 5) % 3) / 100 - heat * 0.24).toFixed(2)),
    cpu: Math.round(52 + 8 * Math.sin(index / 6) + heat * 36),
  };
});

const DEFAULT_ENDPOINTS: KestrelEndpoint[] = [
  { method: "POST", path: "/v2/checkout", weight: 1.35, incidentWeight: 2.1, share: 0.12 },
  { method: "GET", path: "/v2/orders", weight: 0.9, incidentWeight: 1.1, share: 0.31 },
  { method: "GET", path: "/v2/catalog/search", weight: 1.12, incidentWeight: 0.9, share: 0.27 },
  { method: "GET", path: "/v2/inventory/:sku", weight: 0.62, incidentWeight: 1.6, share: 0.19 },
  { method: "POST", path: "/v2/auth/token", weight: 0.48, incidentWeight: 0.5, share: 0.11 },
];

const INFO_LINES = [
  ["api-gateway", "200 GET /v2/orders 84ms"],
  ["checkout", "payment intent created pi_8KQ2 amount=4,290"],
  ["search", "query served from cache hit_ratio=0.93"],
  ["inventory", "reservation released sku=TR-2214"],
  ["api-gateway", "200 POST /v2/auth/token 41ms"],
  ["worker", "job email.receipt finished in 312ms"],
  ["checkout", "order ord_51Hx confirmed"],
] as const;

const INCIDENT_LINES: [KestrelLogLine["level"], string, string][] = [
  ["ERROR", "checkout", "upstream timeout after 2000ms host=pg-primary-2"],
  ["WARN", "inventory", "connection pool exhausted 64/64, queueing"],
  ["ERROR", "api-gateway", "504 POST /v2/checkout 2,013ms"],
  ["WARN", "worker", "retry 2/5 for job stock.sync"],
  ["ERROR", "inventory", "query cancelled: statement timeout 1500ms"],
];

const cx = (...parts: (string | false | undefined)[]) => parts.filter(Boolean).join(" ");

function clockAt(start: string, minute: number, second = 0) {
  const [h = "0", m = "0"] = start.split(":");
  const total = Number(h) * 60 + Number(m) + minute;
  const base = `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
  return second ? `${base}:${String(second).padStart(2, "0")}` : base;
}

function logsFor(index: number, data: KestrelMinute[], start: string): KestrelLogLine[] {
  const minute = data[index];
  const hot = minute ? minute.errorRate > 1 : false;
  return Array.from({ length: 6 }, (_, line) => {
    const second = 58 - line * 9 - ((index * 7 + line * 3) % 6);
    const time = clockAt(start, index, Math.max(1, second));
    if (hot && line % 3 !== 2) {
      const [level, service, message] = INCIDENT_LINES[(index + line) % INCIDENT_LINES.length] ?? INCIDENT_LINES[0]!;
      return { time, level, service, message };
    }
    const [service, message] = INFO_LINES[(index * 3 + line) % INFO_LINES.length] ?? INFO_LINES[0];
    return { time, level: "INFO", service, message };
  });
}

const number = new Intl.NumberFormat("en-US");

const LABEL = "font-mono text-[11px] font-medium tracking-[0.08em] text-(--iu-muted) uppercase";
const PANEL =
  "flex min-w-0 flex-col overflow-hidden rounded-[min(var(--iu-radius),6px)] border border-(--iu-border) bg-(--iu-surface) dark:border-(--iu-foreground)/10";
const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--iu-accent)";

function Panel({
  label,
  meta,
  className,
  children,
  busy,
}: {
  label: string;
  meta?: ReactNode;
  className?: string;
  children: ReactNode;
  busy?: boolean;
}) {
  return (
    <section aria-label={label} aria-busy={busy || undefined} className={cx(PANEL, className)}>
      <header className="flex min-h-10 items-center justify-between gap-3 border-b border-(--iu-border) px-3 dark:border-(--iu-foreground)/10">
        <h3 className={LABEL}>{label}</h3>
        {meta ? <div className="font-mono text-[11px] text-(--iu-muted) tabular-nums">{meta}</div> : null}
      </header>
      {children}
    </section>
  );
}

function Skeleton({ className }: { className?: string }) {
  return <span aria-hidden="true" className={cx("block rounded-[3px] bg-(--iu-foreground)/8", className)} />;
}

function Delta({
  value,
  average,
  better,
  unit,
}: {
  value: number;
  average: number;
  better: "up" | "down";
  unit: string;
}) {
  const change = average === 0 ? 0 : ((value - average) / average) * 100;
  const up = change >= 0;
  const good = (up && better === "up") || (!up && better === "down") || Math.abs(change) < 0.5;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cx(
        "inline-flex items-center gap-0.5 font-mono text-[11px] tabular-nums",
        good ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400",
      )}
    >
      <Icon size={12} strokeWidth={2} aria-hidden="true" />
      {up ? "+" : "−"}
      {Math.abs(change).toFixed(1)}%
      <span className="sr-only">
        {" "}
        versus the hour average of {average.toFixed(2)}
        {unit}, {good ? "healthy" : "a regression"}
      </span>
    </span>
  );
}

function Sparkline({ values, index, label }: { values: number[]; index: number; label: string }) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;
  const y = (value: number) => 22 - ((value - min) / span) * 20;
  const x = (i: number) => (i / (values.length - 1)) * 100;
  const points = values.map((value, i) => `${x(i).toFixed(2)},${y(value).toFixed(2)}`).join(" ");
  return (
    <span className="relative mt-3 block h-8" role="img" aria-label={`${label} over the hour, ${min} to ${max}`}>
      <svg viewBox="0 0 100 24" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible">
        <polyline
          points={points}
          fill="none"
          vectorEffect="non-scaling-stroke"
          strokeWidth={1.25}
          strokeLinejoin="round"
          className="stroke-(--iu-foreground)/55"
        />
      </svg>
      <span
        aria-hidden="true"
        className="absolute size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-(--iu-accent) transition-[left,top] duration-100 motion-reduce:transition-none"
        style={{ left: `${x(index)}%`, top: `${(y(values[index] ?? 0) / 24) * 100}%` }}
      />
    </span>
  );
}

export function KestrelSignalBento({
  kicker = "Kestrel observability",
  headline = "Scrub one minute. Every panel follows.",
  subline = "Latency, throughput, logs and error budget share one time cursor, so the cause sits next to the symptom.",
  minutes = DEFAULT_MINUTES,
  startTime = "14:00",
  defaultMinute = 42,
  deploy = { minute: 37, version: "v4.18.2" },
  incident = { from: 38, to: 46, id: "INC-2291" },
  endpoints = DEFAULT_ENDPOINTS,
  budgetRemaining = 61.4,
  status = "idle",
  onMinuteChange,
  className = "",
}: KestrelSignalBentoProps) {
  const headingId = useId();
  const chartLabelId = useId();
  const chartRef = useRef<HTMLDivElement>(null);
  const last = Math.max(0, minutes.length - 1);
  const [index, setIndex] = useState(Math.min(defaultMinute, last));
  const [errorsOnly, setErrorsOnly] = useState(false);
  const loading = status === "loading";

  const current = minutes[index] ?? minutes[0]!;
  const averages = useMemo(() => {
    const sum = (key: keyof KestrelMinute) => minutes.reduce((total, m) => total + m[key], 0) / (minutes.length || 1);
    return { rpm: sum("rpm"), errorRate: sum("errorRate"), apdex: sum("apdex"), cpu: sum("cpu"), p95: sum("p95") };
  }, [minutes]);
  const ceiling = Math.ceil(Math.max(...minutes.map((m) => m.p99)) / 250) * 250;
  const xPct = (i: number) => (last === 0 ? 0 : (i / last) * 100);
  const yPct = (ms: number) => 100 - (ms / ceiling) * 100;
  const path = (key: "p50" | "p95" | "p99") =>
    minutes.map((m, i) => `${xPct(i).toFixed(2)},${yPct(m[key]).toFixed(2)}`).join(" ");

  const logs = logsFor(index, minutes, startTime);
  const visibleLogs = errorsOnly ? logs.filter((line) => line.level !== "INFO") : logs;
  const inIncident = index >= incident.from && index <= incident.to;
  const burn = current.errorRate / 0.1;
  const endpointRows = endpoints.map((endpoint) => ({
    ...endpoint,
    p95: Math.round(current.p95 * (inIncident ? endpoint.incidentWeight : endpoint.weight)),
    rps: Math.round((current.rpm / 60) * endpoint.share),
  }));
  const slowest = Math.max(...endpointRows.map((row) => row.p95), 1);
  const time = clockAt(startTime, index);
  const spentSinceDeploy = minutes
    .slice(deploy.minute, index + 1)
    .reduce((total, m) => total + Math.max(0, m.errorRate - 0.1) * 0.012, 0);
  const exhaustHours = ((budgetRemaining / 100) * 30 * 24) / Math.max(burn, 0.01);

  function select(next: number) {
    const clamped = Math.min(last, Math.max(0, next));
    if (clamped === index) return;
    setIndex(clamped);
    onMinuteChange?.(clamped);
  }

  function fromPointer(clientX: number) {
    const rect = chartRef.current?.getBoundingClientRect();
    if (!rect) return;
    select(Math.round(((clientX - rect.left) / rect.width) * last));
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const steps: Record<string, number> = {
      ArrowRight: 1,
      ArrowUp: 1,
      ArrowLeft: -1,
      ArrowDown: -1,
      PageUp: 10,
      PageDown: -10,
    };
    let next: number | null = null;
    if (event.key in steps) next = index + (steps[event.key] ?? 0);
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = last;
    if (next === null) return;
    event.preventDefault();
    select(next);
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse" || event.currentTarget.hasPointerCapture(event.pointerId))
      fromPointer(event.clientX);
  }

  const kpis = [
    {
      label: "Requests / min",
      key: "rpm" as const,
      value: number.format(current.rpm),
      unit: "",
      better: "up" as const,
    },
    {
      label: "Error rate",
      key: "errorRate" as const,
      value: `${current.errorRate.toFixed(2)}%`,
      unit: "%",
      better: "down" as const,
    },
    { label: "Apdex", key: "apdex" as const, value: current.apdex.toFixed(2), unit: "", better: "up" as const },
    { label: "CPU, pool avg", key: "cpu" as const, value: `${current.cpu}%`, unit: "%", better: "down" as const },
  ];

  return (
    <section
      aria-labelledby={headingId}
      className={cx("bg-(--iu-background) font-(family-name:--iu-font) text-(--iu-foreground)", className)}
    >
      <div className="mx-auto max-w-[1280px] px-4 py-14 sm:px-6 sm:py-20">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-[40rem]">
            <p className={LABEL}>{kicker}</p>
            <h2
              id={headingId}
              className="mt-3 text-[clamp(1.75rem,1.3rem+1.8vw,2.5rem)] leading-[1.1] font-semibold tracking-[-0.025em] text-balance"
            >
              {headline}
            </h2>
            <p className="mt-3 text-[15px] leading-normal text-pretty text-(--iu-muted)">{subline}</p>
          </div>
          <p className="flex items-center gap-2 font-mono text-xs text-(--iu-muted)">
            <kbd className="rounded-[3px] border border-(--iu-foreground)/25 px-1.5 py-0.5">←</kbd>
            <kbd className="rounded-[3px] border border-(--iu-foreground)/25 px-1.5 py-0.5">→</kbd>
            scrub the chart · Tue 27 Oct 2026, UTC
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-2 md:grid-cols-6 lg:grid-cols-12">
          {/* Latency chart: the shared time cursor */}
          <Panel
            busy={loading}
            label="Latency, checkout cluster"
            className="md:col-span-6 lg:col-span-8"
            meta={
              loading ? null : (
                <span data-meta className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="text-(--iu-foreground)">{time}</span>
                  <span>p50 {current.p50}ms</span>
                  <span className="text-(--iu-foreground)">p95 {current.p95}ms</span>
                  <span>p99 {current.p99}ms</span>
                </span>
              )
            }
          >
            <div className="flex flex-1 flex-col p-3 pt-4">
              {loading ? (
                <Skeleton className="h-56 w-full sm:h-64" />
              ) : (
                <div className="grid flex-1 grid-cols-[2.75rem_minmax(0,1fr)] gap-x-2">
                  <div
                    aria-hidden="true"
                    className="relative h-56 font-mono text-[10px] text-(--iu-muted) tabular-nums sm:h-64"
                  >
                    {[0, 0.25, 0.5, 0.75, 1].map((step) => (
                      <span key={step} className="absolute right-0 -translate-y-1/2" style={{ top: `${step * 100}%` }}>
                        {Math.round(ceiling * (1 - step))}
                      </span>
                    ))}
                  </div>
                  <div
                    ref={chartRef}
                    role="slider"
                    tabIndex={0}
                    aria-labelledby={chartLabelId}
                    aria-valuemin={0}
                    aria-valuemax={last}
                    aria-valuenow={index}
                    aria-valuetext={`${time}, p95 ${current.p95} milliseconds, error rate ${current.errorRate.toFixed(2)} percent`}
                    onKeyDown={onKeyDown}
                    onPointerDown={(event) => {
                      event.currentTarget.setPointerCapture(event.pointerId);
                      fromPointer(event.clientX);
                    }}
                    onPointerMove={onPointerMove}
                    className={cx("relative h-56 cursor-crosshair touch-pan-y select-none sm:h-64", FOCUS)}
                  >
                    <span id={chartLabelId} className="sr-only">
                      Inspect minute
                    </span>
                    {[0, 0.25, 0.5, 0.75, 1].map((step) => (
                      <span
                        key={step}
                        aria-hidden="true"
                        className="absolute inset-x-0 border-t border-dashed border-(--iu-foreground)/10"
                        style={{ top: `${step * 100}%` }}
                      />
                    ))}
                    <span
                      aria-hidden="true"
                      className="absolute inset-y-0 bg-red-500/8 dark:bg-red-400/10"
                      style={{ left: `${xPct(incident.from)}%`, width: `${xPct(incident.to) - xPct(incident.from)}%` }}
                    />
                    <span
                      aria-hidden="true"
                      className="absolute top-1 flex items-center gap-1 font-mono text-[10px] text-red-700 dark:text-red-400"
                      style={{ left: `calc(${xPct(incident.from)}% + 4px)` }}
                    >
                      <TriangleAlert size={11} strokeWidth={2} />
                      {incident.id}
                    </span>
                    <span
                      aria-hidden="true"
                      className="absolute inset-y-0 border-l border-dashed border-(--iu-foreground)/45"
                      style={{ left: `${xPct(deploy.minute)}%` }}
                    />
                    <span
                      aria-hidden="true"
                      className="absolute bottom-1 flex -translate-x-full items-center gap-1 pr-1 font-mono text-[10px] text-(--iu-muted)"
                      style={{ left: `${xPct(deploy.minute)}%` }}
                    >
                      <Rocket size={11} strokeWidth={1.75} />
                      {deploy.version}
                    </span>
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 100 100"
                      preserveAspectRatio="none"
                      className="absolute inset-0 h-full w-full overflow-visible"
                    >
                      <polyline
                        points={path("p99")}
                        fill="none"
                        vectorEffect="non-scaling-stroke"
                        strokeWidth={1}
                        strokeDasharray="3 3"
                        className="stroke-(--iu-foreground)/40"
                      />
                      <polyline
                        points={path("p95")}
                        fill="none"
                        vectorEffect="non-scaling-stroke"
                        strokeWidth={1.75}
                        strokeLinejoin="round"
                        className="stroke-(--iu-foreground)"
                      />
                      <polyline
                        points={path("p50")}
                        fill="none"
                        vectorEffect="non-scaling-stroke"
                        strokeWidth={1}
                        className="stroke-(--iu-foreground)/55"
                      />
                    </svg>
                    <span
                      aria-hidden="true"
                      data-cursor
                      className="absolute inset-y-0 w-px bg-(--iu-accent) transition-[left] duration-100 motion-reduce:transition-none"
                      style={{ left: `${xPct(index)}%` }}
                    />
                    {(["p99", "p95", "p50"] as const).map((key) => (
                      <span
                        key={key}
                        aria-hidden="true"
                        data-dot={key}
                        className="absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-(--iu-accent) bg-(--iu-surface) transition-[left,top] duration-100 motion-reduce:transition-none"
                        style={{ left: `${xPct(index)}%`, top: `${yPct(current[key])}%` }}
                      />
                    ))}
                  </div>
                  <div
                    aria-hidden="true"
                    className="col-start-2 mt-2 flex justify-between font-mono text-[10px] text-(--iu-muted) tabular-nums"
                  >
                    {[0, 15, 30, 45, 60].map((m) => (
                      <span key={m}>{clockAt(startTime, m)}</span>
                    ))}
                  </div>
                </div>
              )}
              <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-(--iu-muted)">
                <li className="flex items-center gap-1.5">
                  <span aria-hidden="true" className="h-px w-4 border-t border-dashed border-(--iu-foreground)/60" />
                  p99
                </li>
                <li className="flex items-center gap-1.5">
                  <span aria-hidden="true" className="h-0.5 w-4 bg-(--iu-foreground)" />
                  p95
                </li>
                <li className="flex items-center gap-1.5">
                  <span aria-hidden="true" className="h-px w-4 bg-(--iu-foreground)/55" />
                  p50
                </li>
                <li className="flex items-center gap-1.5">
                  <Rocket size={11} strokeWidth={1.75} aria-hidden="true" />
                  deploy
                </li>
              </ul>
            </div>
          </Panel>

          {/* KPI tiles */}
          <Panel
            busy={loading}
            label="Golden signals"
            meta={loading ? null : <span data-kpi-time>at {time}</span>}
            className="md:col-span-6 lg:col-span-4"
          >
            <dl className="grid flex-1 grid-cols-2 md:grid-cols-4 lg:grid-cols-2">
              {kpis.map((kpi, i) => (
                <div
                  key={kpi.label}
                  className={cx(
                    "flex flex-col justify-between border-(--iu-border) p-[calc(12px*var(--iu-density))] dark:border-(--iu-foreground)/10",
                    i % 2 === 0 && "border-r",
                    i < 2 && "border-b md:border-b-0 lg:border-b",
                    i === 1 && "md:border-r lg:border-r-0",
                  )}
                >
                  <dt className="text-xs text-(--iu-muted)">{kpi.label}</dt>
                  {loading ? (
                    <dd className="mt-2 flex flex-col gap-2">
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-3 w-14" />
                      <Skeleton className="h-6 w-full" />
                    </dd>
                  ) : (
                    <dd data-kpi={kpi.key} className="mt-1">
                      <span className="block text-[22px] leading-tight font-semibold tracking-[-0.01em] tabular-nums">
                        {kpi.value}
                      </span>
                      <Delta value={current[kpi.key]} average={averages[kpi.key]} better={kpi.better} unit={kpi.unit} />
                      <Sparkline values={minutes.map((m) => m[kpi.key])} index={index} label={kpi.label} />
                    </dd>
                  )}
                </div>
              ))}
            </dl>
          </Panel>

          {/* Logs */}
          <Panel
            busy={loading}
            label="Log tail"
            className="md:col-span-6 lg:col-span-5"
            meta={
              <button
                type="button"
                aria-pressed={errorsOnly}
                disabled={loading}
                onClick={() => setErrorsOnly((value) => !value)}
                className={cx(
                  "inline-flex h-6 items-center rounded-[min(var(--iu-radius),4px)] border px-2 font-mono text-[11px] transition-colors duration-100 disabled:opacity-50 motion-reduce:transition-none pointer-coarse:h-10",
                  errorsOnly
                    ? "border-(--iu-accent) bg-(--iu-accent) text-(--iu-accent-foreground)"
                    : "border-(--iu-foreground)/35 text-(--iu-foreground) pointer-fine:hover:bg-(--iu-foreground)/6",
                  FOCUS,
                )}
              >
                Errors and warnings
              </button>
            }
          >
            <div data-logs className="flex flex-1 flex-col">
              {loading ? (
                <div className="flex flex-col gap-2 p-3">
                  {Array.from({ length: 6 }, (_, i) => (
                    <Skeleton key={i} className="h-4 w-full" />
                  ))}
                </div>
              ) : visibleLogs.length === 0 ? (
                <div className="flex flex-1 flex-col items-start justify-center gap-2 p-4">
                  <p className="text-sm">No errors or warnings at {time}.</p>
                  <button
                    type="button"
                    onClick={() => setErrorsOnly(false)}
                    className={cx(
                      "inline-flex h-8 items-center rounded-[min(var(--iu-radius),4px)] border border-(--iu-foreground)/35 px-2.5 text-xs font-medium pointer-coarse:h-10",
                      FOCUS,
                    )}
                  >
                    Show all {logs.length} lines
                  </button>
                </div>
              ) : (
                <ol className="flex-1 overflow-hidden font-mono text-[11.5px] leading-[1.35]">
                  {visibleLogs.map((line, i) => (
                    <li
                      key={`${line.time}-${i}`}
                      className="grid grid-cols-[3.75rem_2.75rem_minmax(0,1fr)] gap-x-2 border-b border-(--iu-border) px-3 py-[calc(6px*var(--iu-density))] last:border-b-0 odd:bg-(--iu-foreground)/[0.025] dark:border-(--iu-foreground)/8"
                    >
                      <span className="text-(--iu-muted) tabular-nums">{line.time}</span>
                      <span
                        className={cx(
                          "font-semibold",
                          line.level === "ERROR" && "text-red-700 dark:text-red-400",
                          line.level === "WARN" && "text-amber-700 dark:text-amber-400",
                          line.level === "INFO" && "text-(--iu-muted)",
                        )}
                      >
                        {line.level}
                      </span>
                      <span className="min-w-0 truncate">
                        <span className="text-(--iu-muted)">{line.service} </span>
                        {line.message}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </Panel>

          {/* Endpoints */}
          <Panel
            busy={loading}
            label="Slowest endpoints"
            meta={loading ? null : "p95 · req/s"}
            className="md:col-span-3 lg:col-span-4"
          >
            <table className="w-full text-left text-xs">
              <caption className="sr-only">Endpoints by p95 latency at {time}</caption>
              <thead className="sr-only">
                <tr>
                  <th scope="col">Endpoint</th>
                  <th scope="col">p95</th>
                  <th scope="col">Requests per second</th>
                </tr>
              </thead>
              <tbody data-endpoints>
                {loading
                  ? endpoints.map((endpoint) => (
                      <tr
                        key={endpoint.path}
                        className="border-b border-(--iu-border) last:border-b-0 dark:border-(--iu-foreground)/8"
                      >
                        <td colSpan={3} className="px-3 py-[calc(8px*var(--iu-density))]">
                          <Skeleton className="h-3 w-3/5" />
                          <Skeleton className="mt-2 h-1 w-full" />
                        </td>
                      </tr>
                    ))
                  : endpointRows
                      .slice()
                      .sort((a, b) => b.p95 - a.p95)
                      .map((row) => (
                        <tr
                          key={row.path}
                          className="border-b border-(--iu-border) last:border-b-0 dark:border-(--iu-foreground)/8"
                        >
                          <th scope="row" className="w-full max-w-0 px-3 py-[calc(8px*var(--iu-density))] font-normal">
                            <span className="block truncate font-mono text-[11.5px]">
                              <span className="text-(--iu-muted)">{row.method} </span>
                              {row.path}
                            </span>
                            <span aria-hidden="true" className="mt-1.5 block h-1 rounded-full bg-(--iu-foreground)/8">
                              <span
                                className={cx(
                                  "block h-1 rounded-full transition-[width] duration-150 motion-reduce:transition-none",
                                  row.p95 > 600 ? "bg-red-600 dark:bg-red-400" : "bg-(--iu-foreground)/55",
                                )}
                                style={{ width: `${(row.p95 / slowest) * 100}%` }}
                              />
                            </span>
                          </th>
                          <td className="py-[calc(8px*var(--iu-density))] text-right font-mono whitespace-nowrap tabular-nums">
                            {row.p95}
                            <span className="text-(--iu-muted)">ms</span>
                          </td>
                          <td className="px-3 py-[calc(8px*var(--iu-density))] text-right font-mono whitespace-nowrap text-(--iu-muted) tabular-nums">
                            {row.rps}
                          </td>
                        </tr>
                      ))}
              </tbody>
            </table>
          </Panel>

          {/* Error budget */}
          <Panel busy={loading} label="Error budget" meta="SLO 99.9%" className="md:col-span-3 lg:col-span-3">
            <div data-budget className="flex flex-1 flex-col gap-3 p-3">
              {loading ? (
                <>
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-2 w-full" />
                  <Skeleton className="h-10 w-full" />
                </>
              ) : (
                <>
                  <p className="flex items-baseline gap-2">
                    <span className="text-[28px] leading-none font-semibold tabular-nums">
                      {budgetRemaining.toFixed(1)}%
                    </span>
                    <span className="text-xs text-(--iu-muted)">left, 30 days</span>
                  </p>
                  <span aria-hidden="true" className="flex h-2 gap-px">
                    {Array.from({ length: 30 }, (_, day) => (
                      <span
                        key={day}
                        className={cx(
                          "flex-1 rounded-[1px]",
                          day < Math.round(30 - (budgetRemaining / 100) * 30)
                            ? "bg-(--iu-foreground)/55"
                            : "bg-(--iu-foreground)/12",
                        )}
                      />
                    ))}
                  </span>
                  <dl className="mt-1 flex flex-col text-xs">
                    {[
                      ["Spent since " + deploy.version, `${spentSinceDeploy.toFixed(2)}%`],
                      ["Burn rate at " + time, `${burn.toFixed(1)}×`],
                      [
                        "Exhausts in",
                        exhaustHours < 48 ? `${exhaustHours.toFixed(1)} h` : `${(exhaustHours / 24).toFixed(1)} days`,
                      ],
                    ].map(([term, value]) => (
                      <div
                        key={term}
                        className="flex justify-between gap-2 border-t border-(--iu-border) py-[calc(6px*var(--iu-density))] dark:border-(--iu-foreground)/8"
                      >
                        <dt className="text-(--iu-muted)">{term}</dt>
                        <dd className="font-mono tabular-nums">{value}</dd>
                      </div>
                    ))}
                  </dl>
                  <div
                    className={cx(
                      "mt-auto flex items-start gap-2 rounded-[min(var(--iu-radius),4px)] border p-2.5 text-xs",
                      burn >= 6
                        ? "border-red-600/40 text-red-700 dark:border-red-400/40 dark:text-red-400"
                        : "border-emerald-700/30 text-emerald-700 dark:border-emerald-400/30 dark:text-emerald-400",
                    )}
                  >
                    {burn >= 6 ? (
                      <CircleAlert size={14} strokeWidth={1.75} aria-hidden="true" className="mt-px shrink-0" />
                    ) : (
                      <CircleCheck size={14} strokeWidth={1.75} aria-hidden="true" className="mt-px shrink-0" />
                    )}
                    <span>
                      <span className="block font-medium">{burn >= 6 ? "Burning fast" : "Within budget"}</span>
                      <span>{burn >= 6 ? "Paging the checkout on-call." : "No alert would fire."}</span>
                    </span>
                  </div>
                </>
              )}
            </div>
          </Panel>
        </div>
      </div>
    </section>
  );
}

export default KestrelSignalBento;
