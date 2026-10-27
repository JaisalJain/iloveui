"use client";

import { useId, useRef, useState, type FormEvent, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import {
  Check,
  ChevronsUpDown,
  CircleAlert,
  CircleCheck,
  Hash,
  LoaderCircle,
  Siren,
  Webhook,
  X,
  type LucideIcon,
} from "lucide-react";

export type TripwireMetric = { id: string; label: string; unit: string; step: number; description: string };
export type TripwireService = { id: string; team: string };
export type TripwireChannel = "slack" | "pagerduty" | "webhook";

export type TripwireValues = {
  name: string;
  metric: string;
  operator: "above" | "below";
  threshold: string;
  duration: string;
  services: string[];
  severity: "sev1" | "sev2" | "sev3";
  channel: TripwireChannel;
  slackChannel: string;
  routingKey: string;
  webhookUrl: string;
  signRequests: boolean;
  mute: boolean;
  muteStart: string;
  muteEnd: string;
};

export type TripwireField = Exclude<keyof TripwireValues, "signRequests" | "mute">;
export type TripwireErrors = Partial<Record<TripwireField, string>>;

export type TripwireAlertRuleFormProps = {
  metrics?: TripwireMetric[];
  services?: TripwireService[];
  /** Rule names that already exist, for the uniqueness check. */
  existingNames?: string[];
  defaultValues?: Partial<TripwireValues>;
  errors?: TripwireErrors;
  status?: "idle" | "saving" | "saved" | "failed";
  savedAt?: string;
  version?: number;
  disabled?: boolean;
  disabledReason?: string;
  /** 24 hours of 10-minute samples per metric id, oldest first. Defaults to generated demo data. */
  history?: Record<string, number[]>;
  /** Time of the last sample, "HH:MM". */
  now?: string;
  onSave?: (values: TripwireValues) => Promise<void> | void;
  onDiscard?: () => void;
  className?: string;
};

const DEFAULT_METRICS: TripwireMetric[] = [
  {
    id: "http.p95_latency",
    label: "http.p95_latency",
    unit: "ms",
    step: 10,
    description: "95th percentile response time",
  },
  {
    id: "http.error_rate",
    label: "http.error_rate",
    unit: "%",
    step: 0.1,
    description: "5xx responses / all responses",
  },
  { id: "queue.depth", label: "queue.depth", unit: "jobs", step: 50, description: "Jobs waiting across workers" },
  { id: "host.cpu", label: "host.cpu", unit: "%", step: 1, description: "Mean CPU across instances" },
];

const DEFAULT_SERVICES: TripwireService[] = [
  { id: "checkout-api", team: "payments" },
  { id: "payments-worker", team: "payments" },
  { id: "ledger-sync", team: "payments" },
  { id: "search-api", team: "discovery" },
  { id: "edge-gateway", team: "platform" },
  { id: "auth-service", team: "identity" },
  { id: "notifications", team: "growth" },
  { id: "media-resizer", team: "platform" },
];

const DEFAULTS: TripwireValues = {
  name: "",
  metric: "http.p95_latency",
  operator: "above",
  threshold: "",
  duration: "10",
  services: [],
  severity: "sev2",
  channel: "slack",
  slackChannel: "",
  routingKey: "",
  webhookUrl: "",
  signRequests: true,
  mute: false,
  muteStart: "",
  muteEnd: "",
};

const ORDER: TripwireField[] = [
  "name",
  "metric",
  "threshold",
  "duration",
  "services",
  "slackChannel",
  "routingKey",
  "webhookUrl",
  "muteStart",
  "muteEnd",
];

const CHANNELS: Array<{ id: TripwireChannel; label: string; icon: LucideIcon }> = [
  { id: "slack", label: "Slack", icon: Hash },
  { id: "pagerduty", label: "PagerDuty", icon: Siren },
  { id: "webhook", label: "Webhook", icon: Webhook },
];

const SEVERITIES: Array<{ id: TripwireValues["severity"]; label: string; hint: string }> = [
  { id: "sev1", label: "SEV1", hint: "Page now" },
  { id: "sev2", label: "SEV2", hint: "Within 30 min" },
  { id: "sev3", label: "SEV3", hint: "Next workday" },
];

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-(--iu-accent)";
const CONTROL = cx(
  "h-8 w-full rounded-[min(var(--iu-radius),6px)] border border-(--iu-foreground)/35 bg-(--iu-surface) px-2.5 text-[13px] text-(--iu-foreground) transition-colors duration-100 placeholder:text-(--iu-muted) disabled:cursor-not-allowed disabled:bg-(--iu-foreground)/5 disabled:text-(--iu-muted) aria-invalid:border-rose-600 motion-reduce:transition-none dark:aria-invalid:border-rose-400 pointer-coarse:h-10 pointer-fine:hover:border-(--iu-foreground)/60",
  FOCUS,
);
const MONO = "font-mono tabular-nums";

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

/** Deterministic demo history: 144 ten-minute samples with the incidents a real day has. */
function demoSeries(kind: string) {
  let seed =
    ({ "http.p95_latency": 7, "http.error_rate": 11, "queue.depth": 13, "host.cpu": 17 } as Record<string, number>)[
      kind
    ] ?? 5;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const out: number[] = [];
  for (let i = 0; i < 144; i++) {
    const day = Math.sin((i / 144) * Math.PI * 2 - 1.2);
    let v: number;
    if (kind === "http.p95_latency") {
      v = 430 + 90 * day + rand() * 70;
      if (i >= 52 && i <= 57) v = 880 + rand() * 260;
      if (i >= 98 && i <= 99) v = 820 + rand() * 120;
      if (i === 121) v = 960;
    } else if (kind === "http.error_rate") {
      v = 0.32 + 0.12 * day + rand() * 0.14;
      if (i >= 53 && i <= 56) v = 1.9 + rand() * 0.8;
      if (i === 121) v = 1.2;
    } else if (kind === "queue.depth") {
      v = 140 + 60 * day + rand() * 50;
      if (i >= 100 && i <= 110) v = 900 + (i - 100) * 180 + rand() * 120;
      if (i > 110 && i <= 113) v = 600 - (i - 110) * 150;
    } else {
      v = 48 + 20 * day + rand() * 8;
      if (i >= 99 && i <= 111) v = 82 + rand() * 9;
    }
    out.push(kind === "http.error_rate" ? Math.round(v * 100) / 100 : Math.round(v));
  }
  return out;
}

/** Runs of samples past the threshold; a run fires when it lasts at least the window. */
function backtest(series: number[], operator: "above" | "below", threshold: number, minutes: number) {
  const runs: Array<{ start: number; end: number; peak: number; fires: boolean }> = [];
  let start = -1;
  series.forEach((value, index) => {
    const past = operator === "above" ? value > threshold : value < threshold;
    if (past && start < 0) start = index;
    if ((!past || index === series.length - 1) && start >= 0) {
      const end = past ? index : index - 1;
      const slice = series.slice(start, end + 1);
      const peak = operator === "above" ? Math.max(...slice) : Math.min(...slice);
      runs.push({ start, end, peak, fires: (end - start + 1) * 10 >= minutes });
      start = -1;
    }
  });
  return runs;
}

function clock(now: string, samplesAgo: number) {
  const [h = 0, m = 0] = now.split(":").map(Number);
  const total = (((h * 60 + m - samplesAgo * 10) % 1440) + 1440) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function daysBetween(start: string, end: string) {
  return (Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86_400_000;
}

function validate(v: TripwireValues, existing: string[]): TripwireErrors {
  const e: TripwireErrors = {};
  if (!v.name.trim()) e.name = "Name the rule.";
  else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v.name)) e.name = "Use lowercase letters, numbers and dashes.";
  else if (existing.includes(v.name)) e.name = `“${v.name}” already exists. Pick another name.`;
  if (!v.metric) e.metric = "Choose a metric.";
  const threshold = Number(v.threshold);
  if (v.threshold.trim() === "" || Number.isNaN(threshold)) e.threshold = "Enter a number.";
  else if (threshold <= 0) e.threshold = "Must be greater than 0.";
  const duration = Number(v.duration);
  if (!Number.isInteger(duration) || duration < 1 || duration > 60) e.duration = "1 to 60 minutes.";
  if (v.services.length === 0) e.services = "Pick at least one service.";
  if (v.channel === "slack" && !/^#[a-z0-9][a-z0-9_-]{1,79}$/.test(v.slackChannel))
    e.slackChannel = "Start with # and use lowercase, for example #oncall-payments.";
  if (v.channel === "pagerduty" && !/^[a-f0-9]{32}$/.test(v.routingKey))
    e.routingKey = "Routing keys are 32 hexadecimal characters.";
  if (v.channel === "webhook" && !/^https:\/\/[^\s/]+\.[^\s]+$/.test(v.webhookUrl))
    e.webhookUrl = "Use a full https address.";
  if (v.mute) {
    if (!v.muteStart) e.muteStart = "Choose a start date.";
    if (!v.muteEnd) e.muteEnd = "Choose an end date.";
    if (v.muteStart && v.muteEnd) {
      const span = daysBetween(v.muteStart, v.muteEnd);
      if (span < 0) e.muteEnd = "The end is before the start.";
      else if (span > 14) e.muteEnd = `Mute windows are at most 14 days; this is ${span}.`;
    }
  }
  return e;
}

function Row({
  label,
  htmlFor,
  labelId,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  labelId?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-1.5 border-t border-(--iu-border) py-[calc(12px*var(--iu-density))] @2xl:grid-cols-[176px_minmax(0,1fr)] @2xl:gap-4">
      <div>
        <label htmlFor={htmlFor} id={labelId} className="block text-[13px] font-medium text-(--iu-foreground)">
          {label}
        </label>
        {hint ? <p className="mt-0.5 hidden text-xs leading-snug text-(--iu-muted) @2xl:block">{hint}</p> : null}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function Help({ id, error, children }: { id: string; error?: string; children?: ReactNode }) {
  if (!error && !children) return null;
  return (
    <p
      id={id}
      className={cx(
        "mt-1.5 flex items-start gap-1.5 text-xs leading-snug",
        error ? "text-rose-700 dark:text-rose-300" : "text-(--iu-muted)",
      )}
    >
      {error ? <CircleAlert size={14} strokeWidth={1.5} aria-hidden="true" className="mt-px shrink-0" /> : null}
      <span>{error ?? children}</span>
    </p>
  );
}

export function TripwireAlertRuleForm({
  metrics = DEFAULT_METRICS,
  services = DEFAULT_SERVICES,
  existingNames = ["checkout-p95-latency", "ledger-sync-lag", "edge-5xx-burst"],
  defaultValues,
  errors: forcedErrors,
  status: forcedStatus,
  savedAt = "14:32",
  version = 4,
  disabled = false,
  disabledReason = "You have viewer access to this project. Ask a project admin to change alert rules.",
  history,
  now = "14:30",
  onSave,
  onDiscard,
  className = "",
}: TripwireAlertRuleFormProps) {
  const uid = `tw${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const id = (name: string) => `${uid}-${name}`;
  const initial = { ...DEFAULTS, ...defaultValues };
  const [saved, setSaved] = useState<TripwireValues>(initial);
  const [values, setValues] = useState<TripwireValues>(initial);
  const [errors, setErrors] = useState<TripwireErrors>(forcedErrors ?? {});
  const [internalStatus, setInternalStatus] = useState<"idle" | "saving" | "saved" | "failed">("idle");
  const [savedTime, setSavedTime] = useState(savedAt);
  const [savedVersion, setSavedVersion] = useState(version);
  const [announce, setAnnounce] = useState("");
  const status = forcedStatus ?? internalStatus;
  const locked = disabled || status === "saving";

  // Metric select (select-only combobox)
  const [metricOpen, setMetricOpen] = useState(false);
  const [metricActive, setMetricActive] = useState(0);
  // Services multi-select combobox
  const [serviceQuery, setServiceQuery] = useState("");
  const [serviceOpen, setServiceOpen] = useState(false);
  const [serviceActive, setServiceActive] = useState(0);
  const serviceInput = useRef<HTMLInputElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  const metric = metrics.find((candidate) => candidate.id === values.metric) ?? metrics[0];
  const series = (metric && (history?.[metric.id] ?? demoSeries(metric.id))) || [];
  const threshold = Number(values.threshold);
  const minutes = Number(values.duration) || 0;
  const thresholdValid = values.threshold.trim() !== "" && !Number.isNaN(threshold);
  const runs = thresholdValid ? backtest(series, values.operator, threshold, minutes) : [];
  const fired = runs.filter((run) => run.fires);
  const firedMinutes = fired.reduce((sum, run) => sum + (run.end - run.start + 1) * 10, 0);
  const lo = Math.min(...series, thresholdValid ? threshold : Infinity) * 0.9;
  const hi = Math.max(...series, thresholdValid ? threshold : -Infinity) * 1.08;
  const y = (value: number) => (1 - (value - lo) / (hi - lo || 1)) * 100;
  const x = (index: number) => (index / Math.max(series.length - 1, 1)) * 100;
  const line = series
    .map((value, index) => `${index ? "L" : "M"}${x(index).toFixed(2)},${y(value).toFixed(2)}`)
    .join(" ");
  const format = (value: number) =>
    `${metric?.unit === "%" ? value.toFixed(value < 10 ? 2 : 0) : Math.round(value).toLocaleString("en-US")}${metric?.unit === "%" ? "%" : ` ${metric?.unit}`}`;

  const dirtyFields = (Object.keys(values) as Array<keyof TripwireValues>).filter(
    (key) => JSON.stringify(values[key]) !== JSON.stringify(saved[key]),
  );
  const dirty = dirtyFields.length > 0;

  const set = <K extends keyof TripwireValues>(field: K, value: TripwireValues[K]) => {
    const next = { ...values, [field]: value };
    setValues(next);
    if (status === "saved" || status === "failed") setInternalStatus("idle");
    const fresh = validate(next, existingNames);
    setErrors((current) => {
      const updated = { ...current };
      for (const key of Object.keys(current) as TripwireField[]) if (!fresh[key]) delete updated[key];
      return updated;
    });
  };

  const blur = (field: TripwireField) => {
    const value = values[field];
    const filled = Array.isArray(value) ? value.length > 0 : String(value).trim() !== "";
    if (filled) setErrors((current) => ({ ...current, [field]: validate(values, existingNames)[field] }));
  };

  const a11y = (field: TripwireField) => ({
    "aria-invalid": errors[field] ? true : undefined,
    "aria-describedby": id(`${field}-help`),
  });

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (locked) return;
    const found = validate(values, existingNames);
    setErrors(found);
    const bad = ORDER.filter((field) => found[field]);
    if (bad.length) {
      setAnnounce(`Not saved. ${bad.length} ${bad.length === 1 ? "field needs" : "fields need"} attention.`);
      const first = bad[0]!;
      const target =
        first === "services"
          ? serviceInput.current
          : document.getElementById(id(first === "metric" ? "metric" : first));
      target?.focus();
      return;
    }
    setInternalStatus("saving");
    setAnnounce("Saving rule.");
    try {
      await onSave?.(values);
      const time = new Date();
      setSavedTime(`${String(time.getHours()).padStart(2, "0")}:${String(time.getMinutes()).padStart(2, "0")}`);
      setSavedVersion((current) => current + 1);
      setSaved(values);
      setInternalStatus("saved");
      setAnnounce("Rule saved.");
    } catch {
      setInternalStatus("failed");
      setAnnounce("Saving failed. Your changes are still here.");
    }
  };

  const discard = () => {
    setValues(saved);
    setErrors({});
    setInternalStatus("idle");
    onDiscard?.();
  };

  // ---- metric select ----
  const metricIndex = Math.max(
    0,
    metrics.findIndex((candidate) => candidate.id === values.metric),
  );
  const chooseMetric = (index: number) => {
    const next = metrics[index];
    if (next && next.id !== values.metric) {
      const sample = history?.[next.id] ?? demoSeries(next.id);
      const peak = Math.max(...sample);
      const suggested = Math.round((peak * 0.75) / next.step) * next.step;
      setValues((current) => ({ ...current, metric: next.id, threshold: String(Number(suggested.toFixed(2))) }));
    }
    setMetricOpen(false);
  };
  const onMetricKey = (event: KeyboardEvent<HTMLButtonElement>) => {
    const last = metrics.length - 1;
    if (!metricOpen) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
        event.preventDefault();
        setMetricOpen(true);
        setMetricActive(metricIndex);
      }
      return;
    }
    if (event.key === "ArrowDown") setMetricActive((current) => Math.min(last, current + 1));
    else if (event.key === "ArrowUp") setMetricActive((current) => Math.max(0, current - 1));
    else if (event.key === "Home") setMetricActive(0);
    else if (event.key === "End") setMetricActive(last);
    else if (event.key === "Enter" || event.key === " ") chooseMetric(metricActive);
    else if (event.key === "Escape") setMetricOpen(false);
    else if (event.key === "Tab") {
      chooseMetric(metricActive);
      return;
    } else return;
    event.preventDefault();
  };

  // ---- services multi-select ----
  const serviceMatches = services.filter((service) =>
    `${service.id} ${service.team}`.includes(serviceQuery.trim().toLowerCase()),
  );
  const toggleService = (serviceId: string) => {
    const next = values.services.includes(serviceId)
      ? values.services.filter((candidate) => candidate !== serviceId)
      : [...values.services, serviceId];
    set("services", next);
    setAnnounce(`${serviceId} ${values.services.includes(serviceId) ? "removed" : "added"}. ${next.length} selected.`);
  };
  const onServiceKey = (event: KeyboardEvent<HTMLInputElement>) => {
    const last = serviceMatches.length - 1;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setServiceOpen(true);
      setServiceActive((current) => (serviceOpen ? (current >= last ? 0 : current + 1) : 0));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setServiceOpen(true);
      setServiceActive((current) => (current <= 0 ? last : current - 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const match = serviceMatches[serviceActive];
      if (serviceOpen && match) {
        toggleService(match.id);
        setServiceQuery("");
      }
    } else if (event.key === "Escape") {
      if (serviceOpen) setServiceOpen(false);
      else setServiceQuery("");
    } else if (event.key === "Backspace" && serviceQuery === "" && values.services.length) {
      toggleService(values.services[values.services.length - 1]!);
    }
  };

  // ---- threshold handle: drag on the chart to set the number ----
  const fromPointer = (event: PointerEvent<HTMLElement>) => {
    const rect = chartRef.current?.getBoundingClientRect();
    if (!rect || !metric) return;
    const ratio = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
    const raw = hi - ratio * (hi - lo);
    const stepped = Math.max(metric.step, Math.round(raw / metric.step) * metric.step);
    set("threshold", String(Number(stepped.toFixed(2))));
  };

  const rule = [
    `rule ${values.name || "untitled"}`,
    `  when ${metric?.id ?? "metric"} ${values.operator === "above" ? ">" : "<"} ${values.threshold || "?"}${metric?.unit === "%" || metric?.unit === "ms" ? metric.unit : ` ${metric?.unit ?? ""}`}`,
    `  for ${values.duration || "?"}m`,
    `  on [${values.services.join(", ")}]`,
    `  severity ${values.severity.toUpperCase()}`,
    `  notify ${
      values.channel === "slack"
        ? values.slackChannel || "#?"
        : values.channel === "pagerduty"
          ? `pagerduty:${values.routingKey ? `${values.routingKey.slice(0, 6)}…` : "?"}`
          : values.webhookUrl || "webhook:?"
    }`,
    ...(values.mute ? [`  mute ${values.muteStart || "?"} .. ${values.muteEnd || "?"}`] : []),
  ].join("\n");

  return (
    <section
      data-tripwire-form
      aria-labelledby={id("heading")}
      className={cx(
        "@container mx-auto w-full max-w-[1180px] overflow-visible rounded-[min(var(--iu-radius),6px)] border border-(--iu-border) bg-(--iu-surface) font-(family-name:--iu-font) text-[13px] leading-[1.4] text-(--iu-foreground)",
        className,
      )}
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-(--iu-border) px-4 py-3">
        <div className="min-w-0">
          <p className={cx("text-[11px] text-(--iu-muted)", MONO)}>alerts / payments / {saved.name || "new rule"}</p>
          <h2 id={id("heading")} className="mt-0.5 text-base font-semibold">
            {saved.name ? "Edit alert rule" : "New alert rule"}
          </h2>
        </div>
        <span
          className={cx(
            "inline-flex h-6 items-center gap-1.5 rounded-[min(var(--iu-radius),4px)] border border-(--iu-border) px-2 text-[11px] text-(--iu-muted)",
            MONO,
          )}
        >
          v{savedVersion} · {disabled ? "read only" : "editing"}
        </span>
      </header>

      {disabled ? (
        <p
          id={id("readonly")}
          className="flex items-start gap-2 border-b border-(--iu-border) bg-(--iu-foreground)/4 px-4 py-2.5 text-xs"
        >
          <CircleAlert size={14} strokeWidth={1.5} aria-hidden="true" className="mt-px shrink-0" />
          {disabledReason}
        </p>
      ) : null}

      <div className="grid @4xl:grid-cols-[minmax(0,1fr)_380px]">
        <form noValidate onSubmit={save} aria-describedby={disabled ? id("readonly") : undefined} className="min-w-0">
          <fieldset disabled={locked} className="m-0 min-w-0 border-0 px-4 pb-2">
            <legend className="sr-only">Rule settings</legend>
            <Row label="Rule name" htmlFor={id("name")} hint="Shown in notifications and the incident log.">
              <input
                id={id("name")}
                value={values.name}
                spellCheck={false}
                autoComplete="off"
                onChange={(event) => set("name", event.target.value)}
                onBlur={() => blur("name")}
                {...a11y("name")}
                className={cx(CONTROL, MONO)}
              />
              <Help id={id("name-help")} error={errors.name}>
                Lowercase, numbers and dashes.
              </Help>
            </Row>

            <Row label="Metric" labelId={id("metric-label")} htmlFor={id("metric")} hint="Sampled every 10 seconds.">
              <div className="relative">
                <button
                  type="button"
                  id={id("metric")}
                  role="combobox"
                  aria-haspopup="listbox"
                  aria-expanded={metricOpen}
                  aria-controls={id("metric-list")}
                  aria-labelledby={`${id("metric-label")} ${id("metric")}`}
                  aria-activedescendant={metricOpen ? id(`metric-${metricActive}`) : undefined}
                  onClick={() => {
                    setMetricOpen((open) => !open);
                    setMetricActive(metricIndex);
                  }}
                  onKeyDown={onMetricKey}
                  onBlur={() => setMetricOpen(false)}
                  {...a11y("metric")}
                  className={cx(CONTROL, "flex items-center justify-between gap-2 text-left")}
                >
                  <span data-tw-metric-value className="min-w-0 truncate">
                    <span className={MONO}>{metric?.label}</span>
                    <span className="text-(--iu-muted)"> · {metric?.unit}</span>
                  </span>
                  <ChevronsUpDown
                    size={14}
                    strokeWidth={1.5}
                    aria-hidden="true"
                    className="shrink-0 text-(--iu-muted)"
                  />
                </button>
                <ul
                  id={id("metric-list")}
                  role="listbox"
                  aria-labelledby={id("metric-label")}
                  hidden={!metricOpen}
                  className="absolute inset-x-0 top-full z-30 mt-1 rounded-[min(var(--iu-radius),6px)] border border-(--iu-foreground)/20 bg-(--iu-surface) p-1 shadow-[0_8px_24px_color-mix(in_oklab,black_12%,transparent)]"
                >
                  {metrics.map((option, index) => (
                    <li
                      key={option.id}
                      id={id(`metric-${index}`)}
                      role="option"
                      aria-selected={option.id === values.metric}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => chooseMetric(index)}
                      onMouseMove={() => setMetricActive(index)}
                      className={cx(
                        "flex cursor-pointer items-center gap-2 rounded-[min(var(--iu-radius),4px)] px-2 py-1.5",
                        index === metricActive && "bg-(--iu-foreground)/6",
                      )}
                    >
                      <span className="min-w-0 flex-1">
                        <span className={cx("block", MONO)}>{option.label}</span>
                        <span className="block truncate text-xs text-(--iu-muted)">{option.description}</span>
                      </span>
                      <span className={cx("text-xs text-(--iu-muted)", MONO)}>{option.unit}</span>
                      <Check
                        size={14}
                        strokeWidth={1.5}
                        aria-hidden="true"
                        className={option.id === values.metric ? "" : "invisible"}
                      />
                    </li>
                  ))}
                </ul>
              </div>
              <Help id={id("metric-help")} error={errors.metric}>
                {metric?.description}
              </Help>
            </Row>

            <Row label="Condition" htmlFor={id("operator")} hint="Fires when the metric stays past the threshold.">
              <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2 @md:grid-cols-[auto_minmax(0,1fr)_auto_96px]">
                <select
                  id={id("operator")}
                  value={values.operator}
                  onChange={(event) => set("operator", event.target.value as TripwireValues["operator"])}
                  aria-label="Comparison"
                  className={cx(CONTROL, "w-auto pr-7")}
                >
                  <option value="above">Above</option>
                  <option value="below">Below</option>
                </select>
                <div className="relative">
                  <input
                    id={id("threshold")}
                    inputMode="decimal"
                    aria-label={`Threshold in ${metric?.unit}`}
                    value={values.threshold}
                    onChange={(event) => set("threshold", event.target.value)}
                    onBlur={() => blur("threshold")}
                    {...a11y("threshold")}
                    className={cx(CONTROL, MONO, "pr-12")}
                  />
                  <span
                    aria-hidden="true"
                    className={cx(
                      "pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-xs text-(--iu-muted)",
                      MONO,
                    )}
                  >
                    {metric?.unit}
                  </span>
                </div>
                <label htmlFor={id("duration")} className="text-xs whitespace-nowrap text-(--iu-muted)">
                  for at least
                </label>
                <div className="relative">
                  <input
                    id={id("duration")}
                    inputMode="numeric"
                    value={values.duration}
                    onChange={(event) => set("duration", event.target.value)}
                    onBlur={() => blur("duration")}
                    {...a11y("duration")}
                    className={cx(CONTROL, MONO, "pr-10")}
                  />
                  <span
                    aria-hidden="true"
                    className={cx(
                      "pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-xs text-(--iu-muted)",
                      MONO,
                    )}
                  >
                    min
                  </span>
                </div>
              </div>
              <Help id={id("threshold-help")} error={errors.threshold}>
                Drag the line on the backtest to tune it.
              </Help>
              {errors.duration ? (
                <Help id={id("duration-help")} error={errors.duration} />
              ) : (
                <span id={id("duration-help")} hidden />
              )}
            </Row>

            <Row
              label="Services"
              labelId={id("services-label")}
              htmlFor={id("services")}
              hint="The rule evaluates each service on its own."
            >
              <div className="relative">
                <div
                  data-tw-services-box
                  className={cx(
                    "flex min-h-8 flex-wrap items-center gap-1 rounded-[min(var(--iu-radius),6px)] border bg-(--iu-surface) p-1 pointer-coarse:min-h-10",
                    errors.services ? "border-rose-600 dark:border-rose-400" : "border-(--iu-foreground)/35",
                    locked && "bg-(--iu-foreground)/5",
                  )}
                  onClick={() => serviceInput.current?.focus()}
                >
                  <ul data-tw-chips aria-label="Selected services" className="contents">
                    {values.services.map((serviceId) => (
                      <li
                        key={serviceId}
                        className={cx(
                          "inline-flex h-6 items-center gap-1 rounded-[min(var(--iu-radius),4px)] bg-(--iu-foreground)/8 pl-2 text-xs",
                          MONO,
                        )}
                      >
                        {serviceId}
                        <button
                          type="button"
                          aria-label={`Remove ${serviceId}`}
                          onClick={(event) => {
                            event.stopPropagation();
                            toggleService(serviceId);
                          }}
                          className={cx(
                            "relative inline-flex size-6 items-center justify-center rounded-[min(var(--iu-radius),4px)] text-(--iu-muted) after:absolute after:-inset-2 pointer-coarse:after:-inset-2 pointer-fine:hover:text-(--iu-foreground)",
                            FOCUS,
                          )}
                        >
                          <X size={12} strokeWidth={1.75} aria-hidden="true" />
                        </button>
                      </li>
                    ))}
                  </ul>
                  <input
                    ref={serviceInput}
                    id={id("services")}
                    role="combobox"
                    aria-autocomplete="list"
                    aria-expanded={serviceOpen}
                    aria-controls={id("services-list")}
                    aria-activedescendant={
                      serviceOpen && serviceMatches[serviceActive] ? id(`service-${serviceActive}`) : undefined
                    }
                    autoComplete="off"
                    spellCheck={false}
                    placeholder={values.services.length ? "Add more" : "Search services"}
                    value={serviceQuery}
                    onChange={(event) => {
                      setServiceQuery(event.target.value);
                      setServiceOpen(true);
                      setServiceActive(0);
                    }}
                    onFocus={() => setServiceOpen(true)}
                    onBlur={() => {
                      setServiceOpen(false);
                      blur("services");
                    }}
                    onKeyDown={onServiceKey}
                    {...a11y("services")}
                    className={cx(
                      "h-6 min-w-24 flex-1 bg-transparent px-1 text-[13px] outline-none placeholder:text-(--iu-muted) disabled:cursor-not-allowed",
                      MONO,
                    )}
                  />
                </div>
                <ul
                  id={id("services-list")}
                  role="listbox"
                  aria-multiselectable="true"
                  aria-labelledby={id("services-label")}
                  hidden={!serviceOpen}
                  className="absolute inset-x-0 top-full z-30 mt-1 max-h-56 [scrollbar-gutter:stable] overflow-y-auto rounded-[min(var(--iu-radius),6px)] border border-(--iu-foreground)/20 bg-(--iu-surface) p-1 shadow-[0_8px_24px_color-mix(in_oklab,black_12%,transparent)]"
                >
                  {serviceMatches.map((service, index) => {
                    const selected = values.services.includes(service.id);
                    return (
                      <li
                        key={service.id}
                        id={id(`service-${index}`)}
                        role="option"
                        aria-selected={selected}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => {
                          toggleService(service.id);
                          setServiceQuery("");
                        }}
                        onMouseMove={() => setServiceActive(index)}
                        className={cx(
                          "flex cursor-pointer items-center gap-2 rounded-[min(var(--iu-radius),4px)] px-2 py-1.5",
                          index === serviceActive && "bg-(--iu-foreground)/6",
                        )}
                      >
                        <span
                          aria-hidden="true"
                          className={cx(
                            "inline-flex size-3.5 items-center justify-center rounded-[3px] border",
                            selected
                              ? "border-(--iu-accent) bg-(--iu-accent) text-(--iu-accent-foreground)"
                              : "border-(--iu-foreground)/40",
                          )}
                        >
                          {selected ? <Check size={10} strokeWidth={2.5} /> : null}
                        </span>
                        <span className={cx("flex-1", MONO)}>{service.id}</span>
                        <span className="text-xs text-(--iu-muted)">{service.team}</span>
                      </li>
                    );
                  })}
                  {serviceMatches.length === 0 ? (
                    <li role="presentation" className="px-2 py-1.5 text-(--iu-muted)">
                      No service matches “{serviceQuery}”.
                    </li>
                  ) : null}
                </ul>
              </div>
              <Help id={id("services-help")} error={errors.services}>
                {values.services.length} selected. Backspace removes the last one.
              </Help>
            </Row>

            <Row label="Severity" labelId={id("severity-label")} hint="Sets who is paged and how fast.">
              <div role="radiogroup" aria-labelledby={id("severity-label")} className="grid grid-cols-3 gap-1">
                {SEVERITIES.map((option) => (
                  <label
                    key={option.id}
                    className="flex cursor-pointer items-center gap-2 rounded-[min(var(--iu-radius),6px)] border border-(--iu-foreground)/25 px-2 py-1.5 has-[:checked]:border-(--iu-accent) has-[:checked]:bg-[color-mix(in_oklab,var(--iu-accent)_8%,var(--iu-surface))] has-[:disabled]:cursor-not-allowed has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-1 has-[:focus-visible]:outline-(--iu-accent) pointer-coarse:min-h-10"
                  >
                    <input
                      type="radio"
                      name={id("severity")}
                      value={option.id}
                      checked={values.severity === option.id}
                      onChange={() => set("severity", option.id)}
                      className="sr-only"
                    />
                    <span className={cx("text-xs font-semibold", MONO)}>{option.label}</span>
                    <span className="hidden truncate text-xs text-(--iu-muted) @md:inline">{option.hint}</span>
                  </label>
                ))}
              </div>
            </Row>

            <Row label="Notify" labelId={id("channel-label")} hint="Where the alert is sent.">
              <div role="radiogroup" aria-labelledby={id("channel-label")} className="grid grid-cols-3 gap-1">
                {CHANNELS.map((option) => {
                  const Icon = option.icon;
                  return (
                    <label
                      key={option.id}
                      className="flex cursor-pointer items-center justify-center gap-1.5 rounded-[min(var(--iu-radius),6px)] border border-(--iu-foreground)/25 px-2 py-1.5 text-xs has-[:checked]:border-(--iu-accent) has-[:checked]:bg-[color-mix(in_oklab,var(--iu-accent)_8%,var(--iu-surface))] has-[:disabled]:cursor-not-allowed has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-1 has-[:focus-visible]:outline-(--iu-accent) pointer-coarse:min-h-10"
                    >
                      <input
                        type="radio"
                        name={id("channel")}
                        value={option.id}
                        checked={values.channel === option.id}
                        onChange={() => set("channel", option.id)}
                        className="sr-only"
                      />
                      <Icon size={14} strokeWidth={1.5} aria-hidden="true" />
                      {option.label}
                    </label>
                  );
                })}
              </div>

              {/* Conditional fields for the chosen channel */}
              <div
                data-tw-channel-fields
                className="mt-2 rounded-[min(var(--iu-radius),6px)] bg-(--iu-foreground)/4 p-2.5"
              >
                {values.channel === "slack" ? (
                  <>
                    <label htmlFor={id("slackChannel")} className="block text-xs font-medium">
                      Slack channel
                    </label>
                    <input
                      id={id("slackChannel")}
                      value={values.slackChannel}
                      spellCheck={false}
                      placeholder="#oncall-payments"
                      onChange={(event) => set("slackChannel", event.target.value)}
                      onBlur={() => blur("slackChannel")}
                      {...a11y("slackChannel")}
                      className={cx(CONTROL, MONO, "mt-1")}
                    />
                    <Help id={id("slackChannel-help")} error={errors.slackChannel}>
                      Tripwire must be invited to private channels.
                    </Help>
                  </>
                ) : values.channel === "pagerduty" ? (
                  <>
                    <label htmlFor={id("routingKey")} className="block text-xs font-medium">
                      Routing key
                    </label>
                    <input
                      id={id("routingKey")}
                      value={values.routingKey}
                      spellCheck={false}
                      onChange={(event) => set("routingKey", event.target.value.trim())}
                      onBlur={() => blur("routingKey")}
                      {...a11y("routingKey")}
                      className={cx(CONTROL, MONO, "mt-1")}
                    />
                    <Help id={id("routingKey-help")} error={errors.routingKey}>
                      From the Events API v2 integration of your PagerDuty service.
                    </Help>
                  </>
                ) : (
                  <>
                    <label htmlFor={id("webhookUrl")} className="block text-xs font-medium">
                      Endpoint
                    </label>
                    <input
                      id={id("webhookUrl")}
                      type="url"
                      value={values.webhookUrl}
                      spellCheck={false}
                      onChange={(event) => set("webhookUrl", event.target.value)}
                      onBlur={() => blur("webhookUrl")}
                      {...a11y("webhookUrl")}
                      className={cx(CONTROL, MONO, "mt-1")}
                    />
                    <Help id={id("webhookUrl-help")} error={errors.webhookUrl}>
                      We POST JSON and retry 3 times.
                    </Help>
                    <label className="mt-2 flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={values.signRequests}
                        onChange={(event) => set("signRequests", event.target.checked)}
                        className={cx("size-4 accent-(--iu-accent)", FOCUS)}
                      />
                      Sign requests with an HMAC header
                    </label>
                  </>
                )}
              </div>
            </Row>

            <Row label="Mute window" labelId={id("mute-label")} hint="Planned work; alerts are logged, not sent.">
              <label className="flex items-center gap-2">
                <input
                  id={id("mute")}
                  type="checkbox"
                  checked={values.mute}
                  onChange={(event) => set("mute", event.target.checked)}
                  className={cx("size-4 accent-(--iu-accent)", FOCUS)}
                />
                <span>Schedule a mute window</span>
              </label>
              <div data-tw-mute-slot>
                {values.mute ? (
                  <fieldset className="mt-2 grid gap-2 border-0 p-0 @md:grid-cols-2">
                    <legend className="sr-only">Mute window dates</legend>
                    <div>
                      <label htmlFor={id("muteStart")} className="block text-xs text-(--iu-muted)">
                        From
                      </label>
                      <input
                        id={id("muteStart")}
                        type="date"
                        value={values.muteStart}
                        onChange={(event) => set("muteStart", event.target.value)}
                        onBlur={() => blur("muteStart")}
                        {...a11y("muteStart")}
                        className={cx(CONTROL, MONO, "mt-1")}
                      />
                      <Help id={id("muteStart-help")} error={errors.muteStart} />
                    </div>
                    <div>
                      <label htmlFor={id("muteEnd")} className="block text-xs text-(--iu-muted)">
                        Until
                      </label>
                      <input
                        id={id("muteEnd")}
                        type="date"
                        value={values.muteEnd}
                        min={values.muteStart || undefined}
                        onChange={(event) => set("muteEnd", event.target.value)}
                        onBlur={() => blur("muteEnd")}
                        {...a11y("muteEnd")}
                        className={cx(CONTROL, MONO, "mt-1")}
                      />
                      <Help id={id("muteEnd-help")} error={errors.muteEnd} />
                    </div>
                    <p className="text-xs text-(--iu-muted) @md:col-span-2">
                      Up to 14 days.{" "}
                      {values.muteStart && values.muteEnd && daysBetween(values.muteStart, values.muteEnd) >= 0
                        ? `${daysBetween(values.muteStart, values.muteEnd) + 1} days selected.`
                        : null}
                    </p>
                  </fieldset>
                ) : null}
              </div>
            </Row>
          </fieldset>

          {/* Save bar */}
          <div className="sticky bottom-0 z-20 flex flex-wrap items-center justify-between gap-2 border-t border-(--iu-border) bg-(--iu-surface) px-4 py-2.5">
            <p data-tw-status className="flex min-w-0 items-center gap-2 text-xs" aria-hidden="true">
              {status === "saving" ? (
                <span className="text-(--iu-muted)">Saving…</span>
              ) : status === "saved" && !dirty ? (
                <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
                  <CircleCheck size={14} strokeWidth={1.5} />
                  Saved at {savedTime} · v{savedVersion}
                </span>
              ) : status === "failed" ? (
                <span className="inline-flex items-center gap-1.5 text-rose-700 dark:text-rose-300">
                  <CircleAlert size={14} strokeWidth={1.5} />
                  Not saved. Check your connection and retry.
                </span>
              ) : Object.values(errors).some(Boolean) ? (
                <span className="inline-flex items-center gap-1.5 text-rose-700 dark:text-rose-300">
                  <CircleAlert size={14} strokeWidth={1.5} />
                  {Object.values(errors).filter(Boolean).length} fields need attention
                </span>
              ) : dirty ? (
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-(--iu-accent)" />
                  {dirtyFields.length} unsaved {dirtyFields.length === 1 ? "change" : "changes"}
                </span>
              ) : (
                <span className="text-(--iu-muted)">No changes · v{savedVersion}</span>
              )}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                data-tw-discard
                onClick={discard}
                disabled={locked || !dirty}
                className={cx(
                  "h-8 rounded-[min(var(--iu-radius),6px)] px-3 text-[13px] text-(--iu-foreground) disabled:cursor-not-allowed disabled:text-(--iu-muted) pointer-coarse:h-10 pointer-fine:hover:bg-(--iu-foreground)/6",
                  FOCUS,
                )}
              >
                Discard
              </button>
              <button
                type="submit"
                data-tw-save
                // Keep focus where it is on press, so blur validation cannot shift the button away mid-click.
                onMouseDown={(event) => event.preventDefault()}
                disabled={disabled || status === "saving"}
                className={cx(
                  "inline-flex h-8 min-w-28 items-center justify-center gap-1.5 rounded-[min(var(--iu-radius),6px)] px-3 text-[13px] font-medium transition-colors duration-100 disabled:cursor-not-allowed motion-reduce:transition-none pointer-coarse:h-10",
                  disabled
                    ? "border border-dashed border-(--iu-foreground)/35 text-(--iu-muted)"
                    : "bg-(--iu-accent) text-(--iu-accent-foreground) pointer-fine:hover:bg-[color-mix(in_oklab,var(--iu-accent)_88%,var(--iu-foreground))]",
                  FOCUS,
                )}
              >
                {status === "saving" ? (
                  <>
                    <LoaderCircle
                      size={14}
                      strokeWidth={1.5}
                      aria-hidden="true"
                      className="animate-spin motion-reduce:animate-none"
                    />
                    Saving
                  </>
                ) : status === "failed" ? (
                  "Retry save"
                ) : (
                  "Save rule"
                )}
              </button>
            </div>
          </div>
          <p data-tw-live aria-live="polite" className="sr-only">
            {announce}
          </p>
        </form>

        {/* Backtest preview */}
        <aside
          aria-labelledby={id("preview")}
          className="min-w-0 border-t border-(--iu-border) bg-(--iu-background) p-4 @4xl:border-t-0 @4xl:border-l"
        >
          <div className="@4xl:sticky @4xl:top-4">
            <div className="flex items-baseline justify-between gap-2">
              <h3 id={id("preview")} className="text-xs font-semibold tracking-[0.06em] uppercase">
                Backtest · last 24 h
              </h3>
              <span className={cx("text-[11px] text-(--iu-muted)", MONO)}>{metric?.id}</span>
            </div>
            <p data-tw-summary className="mt-2 text-sm" aria-live="polite">
              {!thresholdValid ? (
                <span className="text-(--iu-muted)">Enter a threshold to backtest.</span>
              ) : fired.length ? (
                <>
                  Would have fired <strong className="font-semibold tabular-nums">{fired.length}</strong>{" "}
                  {fired.length === 1 ? "time" : "times"} · <span className="tabular-nums">{firedMinutes} min</span> in
                  alert
                </>
              ) : (
                <>Would not have fired in the last 24 h.</>
              )}
            </p>

            <div
              ref={chartRef}
              data-tw-chart
              className="relative mt-3 h-40 rounded-[min(var(--iu-radius),6px)] border border-(--iu-border) bg-(--iu-surface)"
            >
              <svg
                role="img"
                aria-label={`${metric?.label} over the last 24 hours, from ${format(Math.min(...series))} to ${format(Math.max(...series))}.`}
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                className="absolute inset-0 size-full"
              >
                <g data-tw-runs>
                  {runs.map((run) => (
                    <rect
                      key={run.start}
                      x={x(run.start) - 0.35}
                      width={Math.max(x(run.end) - x(run.start), 0) + 0.7}
                      y="0"
                      height="100"
                      className={run.fires ? "fill-rose-500/20 dark:fill-rose-400/25" : "fill-(--iu-foreground)/6"}
                    />
                  ))}
                </g>
                <path
                  data-tw-line
                  d={line}
                  fill="none"
                  vectorEffect="non-scaling-stroke"
                  strokeWidth="1.25"
                  strokeLinejoin="round"
                  className="stroke-(--iu-foreground)"
                />
              </svg>
              {thresholdValid ? (
                <div
                  data-tw-threshold
                  aria-hidden="true"
                  className={cx(
                    "absolute inset-x-0 h-0 border-t border-dashed border-(--iu-accent)",
                    dragging ? "" : "transition-[top] duration-150 motion-reduce:transition-none",
                  )}
                  style={{ top: `${Math.min(100, Math.max(0, y(threshold)))}%` }}
                >
                  <span
                    data-tw-handle
                    onPointerDown={(event) => {
                      if (locked) return;
                      event.currentTarget.setPointerCapture(event.pointerId);
                      setDragging(true);
                    }}
                    onPointerMove={(event) => {
                      if (dragging) fromPointer(event);
                    }}
                    onPointerUp={() => setDragging(false)}
                    onPointerCancel={() => setDragging(false)}
                    className={cx(
                      "absolute right-1 -translate-y-1/2 touch-none rounded-[min(var(--iu-radius),4px)] bg-(--iu-accent) px-1.5 py-0.5 text-[11px] text-(--iu-accent-foreground) select-none",
                      locked ? "cursor-not-allowed" : "cursor-ns-resize",
                      MONO,
                    )}
                  >
                    {format(threshold)}
                  </span>
                </div>
              ) : null}
            </div>
            <div aria-hidden="true" className={cx("mt-1.5 flex justify-between text-[11px] text-(--iu-muted)", MONO)}>
              {[143, 108, 72, 36, 0].map((ago) => (
                <span key={ago}>{ago === 0 ? "now" : clock(now, ago)}</span>
              ))}
            </div>

            <div data-tw-fired>
              {fired.length ? (
                <table className="mt-3 w-full text-left text-xs">
                  <caption className="sr-only">Times the rule would have fired</caption>
                  <thead className="text-[11px] text-(--iu-muted)">
                    <tr>
                      <th scope="col" className="py-1 font-medium">
                        Window
                      </th>
                      <th scope="col" className="py-1 text-right font-medium">
                        Length
                      </th>
                      <th scope="col" className="py-1 text-right font-medium">
                        Peak
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {fired.map((run) => (
                      <tr key={run.start} className="border-t border-(--iu-border)">
                        <td className={cx("py-1.5", MONO)}>
                          {clock(now, series.length - 1 - run.start)}–{clock(now, series.length - 2 - run.end)}
                        </td>
                        <td className={cx("py-1.5 text-right", MONO)}>{(run.end - run.start + 1) * 10} min</td>
                        <td className={cx("py-1.5 text-right", MONO)}>{format(run.peak)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : null}
            </div>

            <pre
              data-tw-rule
              aria-label="Rule definition"
              className={cx(
                "mt-4 overflow-x-auto rounded-[min(var(--iu-radius),6px)] border border-(--iu-border) bg-(--iu-surface) p-3 text-[11px] leading-[1.6] break-all whitespace-pre-wrap text-(--iu-foreground)",
                MONO,
              )}
            >
              {rule}
            </pre>
          </div>
        </aside>
      </div>
    </section>
  );
}

export default TripwireAlertRuleForm;
