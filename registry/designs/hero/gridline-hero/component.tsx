"use client";

import { useEffect, useId, useState } from "react";
import {
  AnimatePresence,
  MotionConfig,
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useTransform,
} from "motion/react";
import { ArrowRight, Check, RotateCcw } from "lucide-react";

export type GridlineRelease = {
  version: string;
  title: string;
  /** Full name, shown as a monogram. */
  owner: string;
  durationSeconds: number;
  status: "live" | "rolled-back" | "building";
};

export type GridlineStat = { value: string; label: string };

export type GridlineHeroProps = {
  eyebrow?: string;
  headline?: string;
  subline?: string;
  ctaLabel?: string;
  ctaHref?: string;
  note?: string;
  stats?: GridlineStat[];
  logTitle?: string;
  releases?: GridlineRelease[];
  /** Where the in-flight build starts, from 0 to 1 of its duration. */
  startProgress?: number;
  className?: string;
};

const DEFAULT_RELEASES: GridlineRelease[] = [
  { version: "v2.14.1", title: "Invoice PDF fonts", owner: "Mira Okafor", durationSeconds: 184, status: "building" },
  {
    version: "v2.14.0",
    title: "Retry failed card charges",
    owner: "Tomás Lindqvist",
    durationSeconds: 188,
    status: "live",
  },
  { version: "v2.13.9", title: "Faster CSV export", owner: "Priya Raman", durationSeconds: 171, status: "live" },
  {
    version: "v2.13.8",
    title: "Regional tax rounding",
    owner: "Jonah Weller",
    durationSeconds: 242,
    status: "rolled-back",
  },
];

const DEFAULT_STATS: GridlineStat[] = [
  { value: "3m 12s", label: "Median build" },
  { value: "99.4%", label: "Deploys kept" },
  { value: "38", label: "Releases this week" },
];

function formatDuration(seconds: number) {
  const whole = Math.max(0, Math.round(seconds));
  return `${Math.floor(whole / 60)}m ${String(whole % 60).padStart(2, "0")}s`;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function Monogram({ name }: { name: string }) {
  return (
    <span
      aria-hidden="true"
      className="inline-flex size-6 items-center justify-center rounded-full bg-(--iu-foreground)/8 text-[10px] font-semibold tracking-wide text-(--iu-foreground) dark:bg-(--iu-foreground)/12"
    >
      {initials(name)}
    </span>
  );
}

function StatusLabel({ status }: { status: GridlineRelease["status"] }) {
  if (status === "building") {
    return (
      <span className="inline-flex items-center gap-2 whitespace-nowrap text-(--iu-foreground)">
        <span aria-hidden="true" className="size-2 rounded-full bg-(--iu-accent)" />
        Building
      </span>
    );
  }
  if (status === "rolled-back") {
    return (
      <span className="inline-flex items-center gap-2 whitespace-nowrap text-(--iu-muted)">
        <RotateCcw size={14} strokeWidth={1.5} aria-hidden="true" />
        Reverted
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap text-(--iu-foreground)">
      <Check size={14} strokeWidth={1.75} aria-hidden="true" />
      Live
    </span>
  );
}

/** The in-flight row: elapsed time ticks and a hairline fills until the release goes live. */
function BuildingRow({ release, startProgress }: { release: GridlineRelease; startProgress: number }) {
  const reduceMotion = useReducedMotion();
  const progress = useMotionValue(startProgress);
  const elapsed = useTransform(progress, (value) => formatDuration(value * release.durationSeconds));
  const [live, setLive] = useState(false);

  useMotionValueEvent(progress, "change", (value) => {
    if (value >= 1) setLive(true);
  });

  useEffect(() => {
    const controls = animate(progress, 1, {
      duration: reduceMotion ? 0 : (1 - startProgress) * 6.5,
      ease: "linear",
      delay: reduceMotion ? 0 : 0.6,
    });
    return () => controls.stop();
  }, [progress, reduceMotion, startProgress]);

  return (
    <tr className="border-t border-(--iu-border)">
      <td className="px-3 py-[calc(12px*var(--iu-density))] align-top @md:px-4">
        <span className="block font-mono text-[11px] text-(--iu-muted) tabular-nums">{release.version}</span>
        <span className="mt-1 block truncate text-sm text-(--iu-foreground)">{release.title}</span>
      </td>
      <td className="hidden px-3 py-[calc(12px*var(--iu-density))] align-top @md:table-cell @md:px-4">
        <span className="inline-flex items-center gap-2">
          <Monogram name={release.owner} />
          <span className="sr-only">{release.owner}</span>
        </span>
      </td>
      <td className="px-3 py-[calc(12px*var(--iu-density))] align-top @md:px-4">
        <motion.span className="block font-mono text-[13px] whitespace-nowrap text-(--iu-foreground) tabular-nums @md:text-sm">
          {elapsed}
        </motion.span>
        <span
          aria-hidden="true"
          className="mt-2 block h-0.5 w-full overflow-hidden rounded-full bg-(--iu-foreground)/10"
        >
          <motion.span className="block h-0.5 origin-left bg-(--iu-accent)" style={{ scaleX: progress }} />
        </span>
      </td>
      <td className="px-3 py-[calc(12px*var(--iu-density))] align-top text-sm @md:px-4">
        <AnimatePresence initial={false} mode="wait">
          <motion.span
            key={live ? "live" : "building"}
            initial={{ opacity: 0, y: 2 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -2 }}
            transition={{ duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }}
            className="block"
          >
            <StatusLabel status={live ? "live" : "building"} />
          </motion.span>
        </AnimatePresence>
        <span aria-live="polite" className="sr-only">
          {live ? `${release.version} is live` : ""}
        </span>
      </td>
    </tr>
  );
}

export function GridlineHero({
  eyebrow = "Halden release desk",
  headline = "Releases you can read at a glance.",
  subline = "Every deploy, its diff, duration and owner on one quiet grid. Roll back from the same row in one keystroke.",
  ctaLabel = "Start a free workspace",
  ctaHref = "#start",
  note = "No card required. 14-day trial.",
  stats = DEFAULT_STATS,
  logTitle = "Production",
  releases = DEFAULT_RELEASES,
  startProgress = 0.38,
  className = "",
}: GridlineHeroProps) {
  const reduceMotion = useReducedMotion();
  const titleId = useId();
  return (
    <MotionConfig
      reducedMotion="user"
      transition={reduceMotion ? { duration: 0 } : { duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <section
        aria-labelledby={titleId}
        className={`bg-(--iu-background) font-(family-name:--iu-font) text-(--iu-foreground) ${className}`}
      >
        <div className="mx-auto max-w-[1200px] px-6 pt-12 pb-16 sm:px-10 sm:pt-16 sm:pb-24">
          <div className="flex items-baseline justify-between border-b border-(--iu-border) pb-3 text-[11px] font-medium tracking-[0.08em] text-(--iu-muted) uppercase">
            <span>{eyebrow}</span>
            <span className="tabular-nums">01 / Release log</span>
          </div>

          <div className="mt-12 grid grid-cols-12 gap-x-6 gap-y-14 sm:mt-16">
            <div className="col-span-12 lg:col-span-5">
              <h1
                id={titleId}
                className="text-[clamp(2.75rem,1.6rem+4.2vw,4.75rem)] leading-[0.98] font-semibold tracking-[-0.035em] text-balance"
              >
                {headline}
              </h1>
              <p className="mt-6 max-w-[34rem] text-base leading-relaxed text-pretty text-(--iu-muted) sm:text-lg">
                {subline}
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4">
                <a
                  href={ctaHref}
                  className="group inline-flex h-11 items-center gap-2 rounded-[min(var(--iu-radius),6px)] bg-(--iu-foreground) px-5 text-sm font-medium text-(--iu-background) transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--iu-accent) motion-reduce:transition-none pointer-fine:hover:bg-[color-mix(in_oklab,var(--iu-foreground)_84%,var(--iu-background))]"
                >
                  {ctaLabel}
                  <ArrowRight
                    size={16}
                    strokeWidth={1.5}
                    aria-hidden="true"
                    className="transition-transform duration-150 motion-reduce:transition-none pointer-fine:group-hover:translate-x-0.5"
                  />
                </a>
                <span className="text-sm text-(--iu-muted)">{note}</span>
              </div>
              <dl className="mt-14 grid grid-cols-3 border-t border-(--iu-border)">
                {stats.map((stat, index) => (
                  <div
                    key={stat.label}
                    className={`flex flex-col pt-4 ${index > 0 ? "border-l border-(--iu-border) pl-4" : "pr-4"} ${index === 1 ? "pr-4" : ""}`}
                  >
                    <dt className="text-[11px] font-medium tracking-[0.08em] text-(--iu-muted) uppercase">
                      {stat.label}
                    </dt>
                    <dd className="mt-auto pt-2 text-2xl font-semibold tracking-[-0.02em] tabular-nums">
                      {stat.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <figure className="@container col-span-12 lg:col-span-7">
              <div className="overflow-hidden rounded-[min(var(--iu-radius),6px)] border border-(--iu-border) bg-(--iu-surface) dark:border-(--iu-foreground)/12">
                <figcaption className="flex items-center justify-between gap-4 border-b border-(--iu-border) px-4 py-3 dark:border-(--iu-foreground)/10">
                  <span className="text-sm font-medium">{logTitle}</span>
                  <span className="font-mono text-[11px] text-(--iu-muted) tabular-nums">
                    {releases.length} releases · today
                  </span>
                </figcaption>
                <table className="w-full table-fixed text-left">
                  <caption className="sr-only">Recent production releases</caption>
                  <thead>
                    <tr className="text-[11px] font-medium tracking-[0.08em] text-(--iu-muted) uppercase">
                      <th scope="col" className="w-[42%] px-3 py-2 font-medium @md:w-[46%] @md:px-4">
                        Release
                      </th>
                      <th scope="col" className="hidden w-[18%] px-3 py-2 font-medium @md:table-cell @md:px-4">
                        Owner
                      </th>
                      <th scope="col" className="w-[26%] px-3 py-2 font-medium @md:w-[18%] @md:px-4">
                        Duration
                      </th>
                      <th scope="col" className="w-[32%] px-3 py-2 font-medium @md:w-[18%] @md:px-4">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {releases.map((release) =>
                      release.status === "building" ? (
                        <BuildingRow key={release.version} release={release} startProgress={startProgress} />
                      ) : (
                        <tr key={release.version} className="border-t border-(--iu-border)">
                          <td className="px-3 py-[calc(12px*var(--iu-density))] align-top @md:px-4">
                            <span className="block font-mono text-[11px] text-(--iu-muted) tabular-nums">
                              {release.version}
                            </span>
                            <span className="mt-1 block truncate text-sm text-(--iu-foreground)">{release.title}</span>
                          </td>
                          <td className="hidden px-3 py-[calc(12px*var(--iu-density))] align-top @md:table-cell @md:px-4">
                            <span className="inline-flex items-center gap-2">
                              <Monogram name={release.owner} />
                              <span className="sr-only">{release.owner}</span>
                            </span>
                          </td>
                          <td className="px-3 py-[calc(12px*var(--iu-density))] align-top font-mono text-[13px] whitespace-nowrap text-(--iu-muted) tabular-nums @md:px-4 @md:text-sm">
                            {formatDuration(release.durationSeconds)}
                          </td>
                          <td className="px-3 py-[calc(12px*var(--iu-density))] align-top text-sm @md:px-4">
                            <StatusLabel status={release.status} />
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            </figure>
          </div>
        </div>
      </section>
    </MotionConfig>
  );
}

export default GridlineHero;
