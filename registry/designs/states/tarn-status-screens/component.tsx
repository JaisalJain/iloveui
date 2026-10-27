"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { ReactNode } from "react";
import { ArrowRight, Check, LoaderCircle, RotateCw, WifiOff } from "lucide-react";

export type TarnScreenKind = "not-found" | "server-error" | "maintenance" | "rate-limited" | "offline";

export type TarnStatusScreensProps = {
  kind?: TarnScreenKind;
  /** Request path that was not found (not-found). */
  path?: string;
  /** Closest existing slug to suggest (not-found). */
  suggestion?: string;
  requestId?: string;
  region?: string;
  /** ISO-like timestamp printed in the footer. */
  timestamp?: string;
  /** Seconds since the incident opened (server-error); ticks up. */
  incidentAgeSeconds?: number;
  /** Seconds until the rate limit resets (rate-limited); ticks down. */
  retryAfterSeconds?: number;
  /** Seconds until the next automatic reconnect attempt (offline); ticks down. */
  reconnectInSeconds?: number;
  onRetry?: () => void | Promise<void>;
  onReconnect?: () => void;
  className?: string;
};

type Screen = {
  code: string;
  label: string;
  title: string;
  body: string;
  tone: "neutral" | "failing" | "warning";
  status: string;
};

const SCREENS: Record<TarnScreenKind, Screen> = {
  "not-found": {
    code: "404",
    label: "HTTP 404 · Not found",
    title: "There is no project at this address.",
    body: "The slug in the URL doesn't match any project in the Northwind Labs team. It is one edit away from a project you do have.",
    tone: "neutral",
    status: "All systems normal",
  },
  "server-error": {
    code: "500",
    label: "HTTP 500 · Internal error",
    title: "This one is on us.",
    body: "Your request reached Tarn, but the database behind it reset the connection. On-call has been paged and the request was not applied, so retrying is safe.",
    tone: "failing",
    status: "Incident INC-2291",
  },
  maintenance: {
    code: "503",
    label: "HTTP 503 · Scheduled maintenance",
    title: "Writes are paused while we upgrade Postgres.",
    body: "Deployments and dashboards stay readable. New deploys, env changes and team edits resume when the window closes at 02:40 UTC.",
    tone: "warning",
    status: "Maintenance 02:00 to 02:40 UTC",
  },
  "rate-limited": {
    code: "429",
    label: "HTTP 429 · Too many requests",
    title: "This token hit its rate limit.",
    body: "Tokens can send 120 requests a minute. This one sent 143, most of them from one CI job polling the deployments endpoint. The limit resets on its own.",
    tone: "warning",
    status: "All systems normal",
  },
  offline: {
    code: "OFF",
    label: "Offline · No network",
    title: "You're offline. Your edits are safe.",
    body: "Tarn can't reach the network from this device. Three changes are queued locally and will sync, in order, as soon as the connection is back.",
    tone: "warning",
    status: "Status unknown while offline",
  },
};

function cx(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

function clock(seconds: number) {
  const whole = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(whole / 60)).padStart(2, "0")}:${String(whole % 60).padStart(2, "0")}`;
}

/** Counts once a second from `start` by `step`, stopping at `stop` when given. */
function useTicker(start: number, step: 1 | -1, active: boolean, stop?: number) {
  const [value, setValue] = useState(start);
  useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(() => {
      setValue((current) => (stop !== undefined && current === stop ? current : current + step));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [active, step, stop]);
  return [value, setValue] as const;
}

const toneDot = {
  neutral: "bg-(--iu-muted)",
  failing: "bg-red-500 dark:bg-red-400",
  warning: "bg-amber-500 dark:bg-amber-400",
};

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[112px_1fr] gap-3 py-1.5 @md:grid-cols-[140px_1fr]">
      <dt className="text-(--iu-muted)">{label}</dt>
      <dd className="min-w-0 break-words text-(--iu-foreground)">{children}</dd>
    </div>
  );
}

function Step({ state, children }: { state: "done" | "active" | "pending"; children: ReactNode }) {
  return (
    <li className="flex items-start gap-3 py-1.5">
      <span
        aria-hidden="true"
        className={cx(
          "mt-0.5 grid size-4 shrink-0 place-items-center rounded-[min(var(--iu-radius),4px)] border",
          state === "done" && "border-(--iu-foreground) bg-(--iu-foreground) text-(--iu-background)",
          state === "active" && "border-(--iu-accent)",
          state === "pending" && "border-dashed border-(--iu-muted)",
        )}
      >
        {state === "done" ? <Check size={11} strokeWidth={3} /> : null}
        {state === "active" ? <span className="size-1.5 rounded-full bg-(--iu-accent)" /> : null}
      </span>
      <span className={state === "pending" ? "text-(--iu-muted)" : "text-(--iu-foreground)"}>
        {children}
        <span className="sr-only">
          {state === "done" ? " (done)" : state === "active" ? " (in progress)" : " (pending)"}
        </span>
      </span>
    </li>
  );
}

const primary =
  "inline-flex h-10 min-w-[176px] items-center justify-center gap-2 rounded-[min(var(--iu-radius),8px)] bg-(--iu-accent) px-4 text-sm font-medium text-(--iu-accent-foreground) transition-[filter,opacity] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--iu-accent) aria-disabled:cursor-not-allowed aria-disabled:opacity-55 motion-reduce:transition-none pointer-fine:hover:not-aria-disabled:brightness-110";

export function TarnStatusScreens({
  kind = "not-found",
  path = "/northwind-labs/ingest-wrker",
  suggestion = "ingest-worker",
  requestId = "req_01JB7X4M2Q9TFA",
  region = "fra1",
  timestamp = "2026-10-27 14:06:52 UTC",
  incidentAgeSeconds = 252,
  retryAfterSeconds = 27,
  reconnectInSeconds = 8,
  onRetry,
  onReconnect,
  className = "",
}: TarnStatusScreensProps) {
  const titleId = useId();
  const screen = SCREENS[kind];
  const [incidentAge] = useTicker(incidentAgeSeconds, 1, kind === "server-error");
  const [retryIn] = useTicker(retryAfterSeconds, -1, kind === "rate-limited", 0);
  const [reconnectIn, setReconnectIn] = useTicker(reconnectInSeconds, -1, kind === "offline", 0);
  const [attempt, setAttempt] = useState(3);
  const [retrying, setRetrying] = useState(false);
  const [message, setMessage] = useState("");

  const limitReset = retryIn === 0;

  // Offline: try again when the countdown reaches zero, or as soon as the browser reports a connection.
  useEffect(() => {
    if (kind !== "offline") return;
    const online = () => {
      setMessage("Back online. Syncing 3 changes.");
      onReconnect?.();
    };
    window.addEventListener("online", online);
    return () => window.removeEventListener("online", online);
  }, [kind, onReconnect]);

  const reconnect = () => {
    if (navigator.onLine) {
      setMessage("Back online. Syncing 3 changes.");
      onReconnect?.();
      return;
    }
    setAttempt((value) => value + 1);
    setReconnectIn(Math.min(64, reconnectInSeconds * 2));
    setMessage(`Attempt ${attempt + 1} failed. Still offline.`);
  };

  // The countdown effect calls the latest reconnect through a ref, so it re-runs only when the countdown changes.
  const reconnectRef = useRef(reconnect);
  useEffect(() => {
    reconnectRef.current = reconnect;
  });
  useEffect(() => {
    if (kind !== "offline" || reconnectIn !== 0) return;
    const frame = window.requestAnimationFrame(() => reconnectRef.current());
    return () => window.cancelAnimationFrame(frame);
  }, [kind, reconnectIn]);

  const retry = async () => {
    if (retrying) return;
    setRetrying(true);
    setMessage("Retrying request");
    try {
      await onRetry?.();
    } finally {
      setRetrying(false);
      setMessage("");
    }
  };

  let action: ReactNode;
  let panel: ReactNode;
  if (kind === "not-found") {
    const typed = path.split("/").pop() ?? "";
    action = (
      <a href={`/northwind-labs/${suggestion}`} className={primary}>
        Open {suggestion}
        <ArrowRight size={16} strokeWidth={1.5} aria-hidden="true" />
      </a>
    );
    panel = (
      <>
        <p>
          <span className="text-(--iu-muted)">$ </span>GET {path}
        </p>
        <p className="text-(--iu-muted)">→ 404 no project with slug “{typed}”</p>
        <div className="mt-4 rounded-[min(var(--iu-radius),6px)] border border-dashed border-(--iu-border) p-3">
          <p className="text-[11px] tracking-[0.08em] text-(--iu-muted) uppercase">Closest match · 1 edit</p>
          <p className="mt-2 text-base">
            ingest-w
            <span className="rounded-[2px] bg-(--iu-accent) px-px text-(--iu-accent-foreground)">o</span>
            rker
            <span className="sr-only"> (missing letter o)</span>
          </p>
        </div>
        <dl className="mt-4">
          <Row label="Team">northwind-labs</Row>
          <Row label="Projects">ingest-worker, billing-api, edge-cache</Row>
        </dl>
      </>
    );
  } else if (kind === "server-error") {
    action = (
      <button type="button" onClick={retry} aria-disabled={retrying || undefined} className={primary}>
        <RotateCw
          size={16}
          strokeWidth={1.5}
          aria-hidden="true"
          className={retrying ? "animate-spin motion-reduce:animate-none" : ""}
        />
        {retrying ? "Retrying" : "Retry request"}
      </button>
    );
    panel = (
      <>
        <dl>
          <Row label="Upstream">billing-api → pg-primary</Row>
          <Row label="Error">ECONNRESET after 2,014 ms</Row>
          <Row label="Applied">No. Safe to retry.</Row>
        </dl>
        <p className="mt-4 text-[11px] tracking-[0.08em] text-(--iu-muted) uppercase">
          INC-2291 · open <span className="text-(--iu-foreground) tabular-nums">{clock(incidentAge)}</span>
        </p>
        <ol className="mt-2">
          <Step state="done">14:02:40 detected by health check</Step>
          <Step state="done">14:03:05 paged Ines Duarte, on call</Step>
          <Step state="active">failing over to pg-replica-2</Step>
          <Step state="pending">post-incident note</Step>
        </ol>
      </>
    );
  } else if (kind === "maintenance") {
    const done = 12;
    action = (
      <a href="#status" className={primary}>
        Follow on status page
        <ArrowRight size={16} strokeWidth={1.5} aria-hidden="true" />
      </a>
    );
    panel = (
      <>
        <div className="flex items-baseline justify-between text-[11px] tracking-[0.08em] text-(--iu-muted) uppercase">
          <span>Window 02:00 – 02:40 UTC</span>
          <span className="text-(--iu-foreground) tabular-nums">60%</span>
        </div>
        <div
          role="progressbar"
          aria-label="Maintenance progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={60}
          className="mt-2 grid grid-cols-20 gap-0.5"
        >
          {Array.from({ length: 20 }, (_, index) => (
            <span
              key={index}
              className={cx(
                "h-3 rounded-[1px]",
                index < done ? "bg-(--iu-foreground)" : index === done ? "bg-(--iu-accent)" : "bg-(--iu-foreground)/12",
              )}
            />
          ))}
        </div>
        <ol className="mt-4">
          <Step state="done">02:00 writes paused, snapshot taken</Step>
          <Step state="done">02:09 Postgres 16.4 → 17.2 upgraded</Step>
          <Step state="active">reindexing deployments (41 of 68 tables)</Step>
          <Step state="pending">02:40 writes resume</Step>
        </ol>
      </>
    );
  } else if (kind === "rate-limited") {
    action = (
      <button
        type="button"
        onClick={limitReset ? () => onRetry?.() : undefined}
        aria-disabled={!limitReset || undefined}
        className={primary}
      >
        <RotateCw size={16} strokeWidth={1.5} aria-hidden="true" />
        {limitReset ? "Retry now" : `Retry in ${retryIn}s`}
      </button>
    );
    // 60 one-second buckets: the last ones are where the CI job pushed the token over its limit.
    const buckets = [
      1, 2, 1, 1, 3, 2, 1, 2, 1, 2, 2, 1, 3, 2, 2, 1, 2, 2, 3, 2, 1, 2, 2, 3, 2, 2, 1, 2, 3, 2, 3, 3, 2, 3, 3, 4, 3, 3,
      4, 3, 3, 4, 4, 3, 4, 4, 3, 4, 4, 3, 4, 3, 4, 3, 4, 4, 3, 4, 3, 2,
    ];
    const totals = buckets.map((_, index) => buckets.slice(0, index + 1).reduce((sum, count) => sum + count, 0));
    panel = (
      <>
        <div className="flex items-baseline justify-between">
          <span className="text-[11px] tracking-[0.08em] text-(--iu-muted) uppercase">Resets in</span>
          <span className="text-3xl text-(--iu-foreground) tabular-nums">{clock(retryIn)}</span>
        </div>
        <div aria-hidden="true" className="relative mt-4 flex h-16 items-end gap-px">
          {buckets.map((count, index) => {
            const over = (totals[index] ?? 0) > 120;
            return (
              <span
                key={index}
                style={{ height: `${count * 25}%` }}
                className={cx(
                  "flex-1 rounded-t-[1px]",
                  over ? "bg-amber-500 dark:bg-amber-400" : "bg-(--iu-foreground)/35",
                )}
              />
            );
          })}
        </div>
        <p className="mt-2 flex justify-between text-[11px] text-(--iu-muted)">
          <span>−60s</span>
          <span>
            <span aria-hidden="true" className="mr-1 inline-block size-2 bg-amber-500 dark:bg-amber-400" />
            over limit
          </span>
          <span>now</span>
        </p>
        <dl className="mt-4">
          <Row label="Retry-After">{retryIn}</Row>
          <Row label="Limit">120 / min</Row>
          <Row label="Sent">143 in 60s</Row>
          <Row label="Top caller">GET /v1/deployments · 118</Row>
        </dl>
      </>
    );
  } else {
    action = (
      <button type="button" onClick={reconnect} className={primary}>
        <WifiOff size={16} strokeWidth={1.5} aria-hidden="true" />
        Reconnect now
      </button>
    );
    panel = (
      <>
        <dl>
          <Row label="Last sync">14:03:41 UTC</Row>
          <Row label="Next try">
            <span className="inline-flex items-center gap-2 tabular-nums">
              <LoaderCircle
                size={12}
                strokeWidth={2}
                aria-hidden="true"
                className="animate-spin text-(--iu-accent) motion-reduce:animate-none"
              />
              attempt {attempt + 1} in {reconnectIn}s
            </span>
          </Row>
        </dl>
        <p className="mt-4 text-[11px] tracking-[0.08em] text-(--iu-muted) uppercase">Queued locally · 3</p>
        <ol className="mt-2">
          <Step state="pending">env: set SENTRY_DSN on billing-api</Step>
          <Step state="pending">rename edge-cache → edge-cache-eu</Step>
          <Step state="pending">invite marta@northwind.dev</Step>
        </ol>
      </>
    );
  }

  return (
    <section
      aria-labelledby={titleId}
      className={cx(
        "@container flex min-h-[max(640px,100dvh)] flex-col bg-(--iu-background) font-(family-name:--iu-font) text-(--iu-foreground)",
        className,
      )}
    >
      <header className="flex items-center justify-between gap-4 border-b border-dashed border-(--iu-border) px-6 py-4 sm:px-10">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <svg viewBox="0 0 20 20" aria-hidden="true" className="size-5">
            <path
              d="M2 16 10 3l8 13z"
              className="fill-none stroke-(--iu-foreground)"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <path d="M6 16h8" className="stroke-(--iu-accent)" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Tarn
        </span>
        <a
          href="#status"
          className="inline-flex items-center gap-2 rounded-[min(var(--iu-radius),8px)] px-2 py-1 font-mono text-xs text-(--iu-muted) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--iu-accent) pointer-coarse:min-h-10 pointer-fine:hover:text-(--iu-foreground)"
        >
          <span aria-hidden="true" className={cx("size-1.5 rounded-full", toneDot[screen.tone])} />
          {screen.status}
        </a>
      </header>

      <div className="mx-auto grid w-full max-w-[1200px] flex-1 grid-cols-12 content-center gap-x-6 gap-y-10 px-6 py-12 sm:px-10">
        <div className="col-span-12 lg:col-span-6">
          <p className="font-mono text-[11px] tracking-[0.08em] text-(--iu-muted) uppercase">{screen.label}</p>
          <p
            aria-hidden="true"
            className="relative mt-4 inline-block font-mono text-[clamp(5rem,3rem+9vw,10rem)] leading-none font-medium tracking-[-0.06em] text-(--iu-foreground) tabular-nums"
          >
            {screen.code}
            <span className="absolute -top-2 -left-3 size-3 border-t border-l border-(--iu-muted)" />
            <span className="absolute -right-3 -bottom-2 size-3 border-r border-b border-(--iu-muted)" />
          </p>
          <h1
            id={titleId}
            className="mt-8 max-w-[22ch] text-[clamp(1.75rem,1.4rem+1.4vw,2.5rem)] leading-[1.1] font-semibold tracking-[-0.03em] text-balance"
          >
            {screen.title}
          </h1>
          <p className="mt-4 max-w-[52ch] text-[15px] leading-relaxed text-pretty text-(--iu-muted)">{screen.body}</p>
          <div className="mt-8">{action}</div>
          <p aria-live="polite" className="sr-only">
            {message}
          </p>
        </div>

        <div className="col-span-12 lg:col-span-6 lg:pt-8">
          <div className="relative rounded-[min(var(--iu-radius),8px)] border border-(--iu-border) bg-(--iu-surface) font-mono text-[13px] leading-relaxed">
            <div className="flex items-center justify-between border-b border-dashed border-(--iu-border) px-4 py-2.5 text-[11px] tracking-[0.08em] text-(--iu-muted) uppercase">
              <span>{kind === "offline" ? "local.log" : "request.log"}</span>
              <span className="inline-flex items-center gap-2">
                <span aria-hidden="true" className={cx("size-1.5 rounded-full", toneDot[screen.tone])} />
                {kind === "offline" ? "offline" : screen.code}
              </span>
            </div>
            <div className="p-[calc(16px*var(--iu-density))]">{panel}</div>
          </div>
        </div>
      </div>

      <footer className="flex flex-wrap items-center gap-x-6 gap-y-1 border-t border-dashed border-(--iu-border) px-6 py-3 font-mono text-[11px] text-(--iu-muted) sm:px-10">
        <span>{requestId}</span>
        <span>{region}</span>
        <span>{timestamp}</span>
      </footer>
    </section>
  );
}

export default TarnStatusScreens;
