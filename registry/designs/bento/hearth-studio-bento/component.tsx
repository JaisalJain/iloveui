"use client";

import { useId, useState, type KeyboardEvent, type ReactNode } from "react";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "motion/react";
import { AudioWaveform, Check, ListOrdered, Scissors, Upload } from "lucide-react";

export type HearthExportTarget = "podcast" | "video" | "shorts";

export type HearthChapter = { start: string; title: string; minutes: number };

export type HearthStudioBentoProps = {
  kicker?: string;
  headline?: string;
  subline?: string;
  episodeTitle?: string;
  /** Episode length in seconds, used by the silence trimmer. */
  episodeSeconds?: number;
  defaultStudioSound?: boolean;
  defaultTarget?: HearthExportTarget;
  /** Pause threshold in seconds, from 0.3 to 1.5. */
  defaultThreshold?: number;
  chapters?: HearthChapter[];
  onStudioSoundChange?: (enabled: boolean) => void;
  onTargetChange?: (target: HearthExportTarget) => void;
  onThresholdChange?: (seconds: number) => void;
  onChapterSelect?: (index: number) => void;
  className?: string;
};

const DEFAULT_CHAPTERS: HearthChapter[] = [
  { start: "00:00", title: "Cold open: the burnt bread", minutes: 4 },
  { start: "04:12", title: "Why Nadia left the restaurant", minutes: 13 },
  { start: "17:31", title: "Fermenting on a budget", minutes: 19 },
  { start: "36:48", title: "Listener questions", minutes: 15 },
];

const TARGETS: Record<
  HearthExportTarget,
  { label: string; width: number; height: number; format: string; loudness: string; ratio: string }
> = {
  podcast: {
    label: "Podcast",
    width: 132,
    height: 132,
    format: "MP3 · 128 kbps",
    loudness: "−16 LUFS",
    ratio: "Cover 1:1",
  },
  video: { label: "Video", width: 208, height: 117, format: "MP4 · 1080p", loudness: "−14 LUFS", ratio: "Frame 16:9" },
  shorts: {
    label: "Shorts",
    width: 84,
    height: 150,
    format: "MP4 · 1080×1920",
    loudness: "−14 LUFS",
    ratio: "Frame 9:16",
  },
};

const TARGET_ORDER: HearthExportTarget[] = ["podcast", "video", "shorts"];

/** 48 bars: speech envelopes separated by stretches of room noise. */
const BARS = Array.from({ length: 48 }, (_, index) => {
  const speaking = index % 16 < 11 && index % 16 > 1;
  const wobble = (Math.sin(index * 1.7) + Math.sin(index * 0.6 + 1)) / 4 + 0.5;
  const noise = 0.14 + ((index * 37) % 9) / 90;
  return { speaking, voice: 0.38 + wobble * 0.58, noise };
});

/** Original pauses in the sample timeline, in seconds. */
const PAUSES = [1.8, 0.9, 2.6, 0.6, 1.2, 3.1];
const WORDS = [3.2, 2.1, 4.4, 1.6, 2.8, 3.6, 2.4];

const cx = (...parts: (string | false | undefined)[]) => parts.filter(Boolean).join(" ");

const CARD =
  "relative flex flex-col overflow-hidden rounded-[max(var(--iu-radius),20px)] border border-(--iu-foreground)/8 bg-(--iu-surface) p-[calc(24px*var(--iu-density))] shadow-[inset_0_1px_0_color-mix(in_oklab,white_80%,transparent),0_1px_2px_color-mix(in_oklab,var(--iu-foreground)_6%,transparent),0_12px_32px_-12px_color-mix(in_oklab,var(--iu-foreground)_16%,transparent)] sm:p-[calc(28px*var(--iu-density))] dark:border-(--iu-foreground)/10 dark:bg-[color-mix(in_oklab,var(--iu-foreground)_4%,var(--iu-surface))] dark:shadow-none";

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--iu-accent)";

function formatClock(totalSeconds: number) {
  const whole = Math.max(0, Math.round(totalSeconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

function savedSeconds(threshold: number) {
  return Math.round(412 - (threshold - 0.3) * 260);
}

function CardHead({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <div className="flex items-start gap-4">
      <span
        aria-hidden="true"
        className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--iu-accent)_12%,var(--iu-surface))] text-(--iu-foreground)"
      >
        {icon}
      </span>
      <div>
        <h3 className="text-lg leading-snug font-semibold tracking-[-0.01em] text-balance">{title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-pretty text-(--iu-muted)">{body}</p>
      </div>
    </div>
  );
}

function StudioSound({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  const labelId = useId();
  const reduceMotion = useReducedMotion();
  const floor = enabled ? "−71 dB" : "−38 dB";
  return (
    <div className="mt-8 flex flex-1 flex-col gap-6">
      <div
        aria-hidden="true"
        className="flex h-44 items-center gap-[3px] rounded-[max(var(--iu-radius),16px)] bg-[color-mix(in_oklab,var(--iu-accent)_6%,var(--iu-surface))] px-5 sm:h-52 lg:h-auto lg:min-h-52 lg:flex-1 dark:bg-(--iu-foreground)/5"
      >
        {BARS.map((bar, index) => (
          <motion.span
            key={index}
            data-bar={bar.speaking ? `${bar.voice}` : `n${bar.noise}`}
            initial={false}
            animate={{ scaleY: bar.speaking ? bar.voice * (enabled ? 0.94 : 1) : enabled ? 0.03 : bar.noise }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { type: "spring", stiffness: 320, damping: 26, delay: (index % 16) * 0.012 }
            }
            className={cx("h-full flex-1 rounded-full", bar.speaking ? "bg-(--iu-accent)" : "bg-(--iu-foreground)/30")}
          />
        ))}
      </div>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-4">
        <div>
          <span id={labelId} className="block text-sm font-semibold">
            Studio sound
          </span>
          <span className="flex items-baseline gap-2 text-sm text-(--iu-muted)">
            Noise floor
            <span
              data-floor
              className="relative inline-block min-w-[6ch] font-mono text-(--iu-foreground) tabular-nums"
            >
              <AnimatePresence initial={false} mode="popLayout">
                <motion.span
                  key={floor}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="inline-block"
                >
                  {floor}
                </motion.span>
              </AnimatePresence>
            </span>
          </span>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-labelledby={labelId}
          onClick={onToggle}
          className={cx(
            "relative flex h-10 w-[68px] shrink-0 items-center rounded-full border p-1 transition-colors duration-200 motion-reduce:transition-none",
            enabled
              ? "border-transparent bg-(--iu-accent)"
              : "border-(--iu-foreground)/35 bg-(--iu-foreground)/8 shadow-[inset_0_2px_4px_color-mix(in_oklab,var(--iu-foreground)_12%,transparent)]",
            FOCUS,
          )}
        >
          <motion.span
            initial={false}
            animate={{ x: enabled ? 28 : 0 }}
            whileTap={{ scale: 0.92 }}
            className="block size-8 rounded-full bg-(--iu-surface) shadow-[0_1px_2px_color-mix(in_oklab,var(--iu-foreground)_20%,transparent),0_4px_10px_-2px_color-mix(in_oklab,var(--iu-foreground)_20%,transparent)] dark:bg-(--iu-foreground)"
          />
        </button>
      </div>

      <ul className="flex flex-wrap gap-2" aria-label="Noise sources">
        {["Room echo", "Laptop fan", "Street hiss"].map((source) => (
          <li
            key={source}
            data-chip
            className={cx(
              "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors duration-200 motion-reduce:transition-none",
              enabled
                ? "border-transparent bg-[color-mix(in_oklab,var(--iu-accent)_12%,var(--iu-surface))]"
                : "border-(--iu-foreground)/12 text-(--iu-muted)",
            )}
          >
            <AnimatePresence initial={false}>
              {enabled ? (
                <motion.span
                  key="check"
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 14, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  className="inline-flex overflow-hidden"
                >
                  <Check size={14} strokeWidth={2} aria-hidden="true" />
                </motion.span>
              ) : null}
            </AnimatePresence>
            {source}
            <span className="sr-only">{enabled ? ", removed" : ", present"}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ExportTargets({
  target,
  onChange,
  episodeTitle,
}: {
  target: HearthExportTarget;
  onChange: (next: HearthExportTarget) => void;
  episodeTitle: string;
}) {
  const groupId = useId();
  const spec = TARGETS[target];

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const index = TARGET_ORDER.indexOf(target);
    let next = index;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (index + 1) % TARGET_ORDER.length;
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp")
      next = (index - 1 + TARGET_ORDER.length) % TARGET_ORDER.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = TARGET_ORDER.length - 1;
    else return;
    event.preventDefault();
    const value = TARGET_ORDER[next] ?? "podcast";
    onChange(value);
    const button = event.currentTarget.querySelector<HTMLButtonElement>(`[data-value="${value}"]`);
    button?.focus();
  }

  return (
    <div className="mt-6 flex flex-col gap-5">
      <div
        role="radiogroup"
        aria-label="Export target"
        id={groupId}
        onKeyDown={onKeyDown}
        className="grid grid-cols-3 rounded-full bg-(--iu-foreground)/6 p-1 shadow-[inset_0_1px_3px_color-mix(in_oklab,var(--iu-foreground)_10%,transparent)] dark:bg-(--iu-foreground)/8"
      >
        {TARGET_ORDER.map((value) => {
          const selected = value === target;
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={selected}
              tabIndex={selected ? 0 : -1}
              data-value={value}
              onClick={() => onChange(value)}
              className={cx(
                "relative h-10 rounded-full text-sm font-medium transition-colors duration-200 motion-reduce:transition-none",
                selected ? "text-(--iu-foreground)" : "text-(--iu-muted) pointer-fine:hover:text-(--iu-foreground)",
                FOCUS,
              )}
            >
              {selected ? (
                <motion.span
                  layoutId={`${groupId}-thumb`}
                  aria-hidden="true"
                  className="absolute inset-0 rounded-full bg-(--iu-surface) shadow-[0_1px_2px_color-mix(in_oklab,var(--iu-foreground)_12%,transparent),0_4px_12px_-4px_color-mix(in_oklab,var(--iu-foreground)_18%,transparent)] dark:bg-(--iu-foreground)/14 dark:shadow-none"
                />
              ) : null}
              <span className="relative">{TARGETS[value].label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-5">
        <div aria-hidden="true" className="flex h-[156px] w-[212px] shrink-0 items-center justify-center">
          <motion.div
            initial={false}
            animate={{ width: spec.width, height: spec.height }}
            data-frame
            className="relative flex max-w-full flex-col justify-end overflow-hidden rounded-[max(var(--iu-radius),14px)] bg-[color-mix(in_oklab,var(--iu-accent)_14%,var(--iu-surface))] p-2.5 shadow-[0_1px_2px_color-mix(in_oklab,var(--iu-foreground)_8%,transparent),0_10px_24px_-10px_color-mix(in_oklab,var(--iu-foreground)_24%,transparent)] dark:bg-[color-mix(in_oklab,var(--iu-accent)_22%,var(--iu-surface))]"
          >
            <span className="absolute top-2.5 left-2.5 size-5 rounded-full bg-(--iu-accent)" />
            <span className="line-clamp-2 text-[11px] leading-tight font-semibold">{episodeTitle}</span>
            <span className="mt-1.5 block h-1 rounded-full bg-(--iu-foreground)/15">
              <span className="block h-1 w-2/5 rounded-full bg-(--iu-foreground)/70" />
            </span>
          </motion.div>
        </div>
        <dl className="flex min-w-0 flex-col gap-2 text-sm">
          {[
            ["Shape", spec.ratio],
            ["File", spec.format],
            ["Loudness", spec.loudness],
          ].map(([term, value]) => (
            <div key={term}>
              <dt className="text-xs text-(--iu-muted)">{term}</dt>
              <dd data-spec className="relative font-mono text-[13px] tabular-nums">
                <AnimatePresence initial={false} mode="popLayout">
                  <motion.span
                    key={value}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="inline-block"
                  >
                    {value}
                  </motion.span>
                </AnimatePresence>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

function SilenceTrimmer({
  threshold,
  onChange,
  episodeSeconds,
}: {
  threshold: number;
  onChange: (next: number) => void;
  episodeSeconds: number;
}) {
  const inputId = useId();
  const reduceMotion = useReducedMotion();
  const saved = savedSeconds(threshold);
  const fill = `${((threshold - 0.3) / 1.2) * 100}%`;
  return (
    <div className="mt-6 flex flex-col gap-5">
      <div aria-hidden="true" className="flex h-10 items-center gap-1">
        {WORDS.map((word, index) => (
          <span key={index} className="contents">
            <span
              className="h-8 rounded-full bg-[color-mix(in_oklab,var(--iu-accent)_30%,var(--iu-surface))] dark:bg-[color-mix(in_oklab,var(--iu-accent)_40%,var(--iu-surface))]"
              style={{ flexGrow: word }}
            />
            {index < PAUSES.length ? (
              <motion.span
                data-pause={PAUSES[index]}
                initial={false}
                animate={{ flexGrow: Math.min(PAUSES[index] ?? 0, threshold) }}
                transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 30 }}
                className="h-1 rounded-full bg-(--iu-foreground)/20"
              />
            ) : null}
          </span>
        ))}
      </div>

      <div>
        <div className="flex items-baseline justify-between gap-3">
          <label htmlFor={inputId} className="text-sm font-medium">
            Keep pauses up to
          </label>
          <output data-threshold htmlFor={inputId} className="font-mono text-sm tabular-nums">
            {threshold.toFixed(1)}s
          </output>
        </div>
        <input
          id={inputId}
          type="range"
          min={0.3}
          max={1.5}
          step={0.1}
          value={threshold}
          onChange={(event) => onChange(Number(event.target.value))}
          style={{ ["--fill" as string]: fill }}
          className={cx(
            "mt-2 h-10 w-full cursor-pointer appearance-none rounded-full bg-transparent",
            "[&::-webkit-slider-runnable-track]:h-3 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-[linear-gradient(to_right,var(--iu-accent)_var(--fill),color-mix(in_oklab,var(--iu-foreground)_12%,transparent)_var(--fill))]",
            "[&::-webkit-slider-thumb]:-mt-2.5 [&::-webkit-slider-thumb]:size-8 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-(--iu-foreground)/35 [&::-webkit-slider-thumb]:bg-(--iu-surface) [&::-webkit-slider-thumb]:shadow-[0_2px_6px_color-mix(in_oklab,var(--iu-foreground)_20%,transparent)] [&::-webkit-slider-thumb]:transition-transform active:[&::-webkit-slider-thumb]:scale-95",
            "[&::-moz-range-track]:h-3 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-[linear-gradient(to_right,var(--iu-accent)_var(--fill),color-mix(in_oklab,var(--iu-foreground)_12%,transparent)_var(--fill))]",
            "[&::-moz-range-thumb]:size-8 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-(--iu-foreground)/35 [&::-moz-range-thumb]:bg-(--iu-surface)",
            FOCUS,
          )}
        />
      </div>

      <p className="flex flex-wrap items-baseline gap-x-2 text-sm text-(--iu-muted)">
        <span className="text-[28px] leading-none font-semibold tracking-[-0.02em] text-(--iu-foreground) tabular-nums">
          <span data-saved>{formatClock(saved)}</span>
        </span>
        saved · episode runs <span data-runtime>{formatClock(episodeSeconds - saved)}</span>
      </p>
    </div>
  );
}

export function HearthStudioBento({
  kicker = "Hearth for podcasters",
  headline = "Sound like you booked a studio.",
  subline = "Record in your kitchen. Hearth cleans the room out of your voice, trims the long pauses and cuts every format you post to.",
  episodeTitle = "Ep. 41 · The slow kitchen",
  episodeSeconds = 3134,
  defaultStudioSound = false,
  defaultTarget = "podcast",
  defaultThreshold = 0.7,
  chapters = DEFAULT_CHAPTERS,
  onStudioSoundChange,
  onTargetChange,
  onThresholdChange,
  onChapterSelect,
  className = "",
}: HearthStudioBentoProps) {
  const reduceMotion = useReducedMotion();
  const headingId = useId();
  const chapterName = useId();
  const [studio, setStudio] = useState(defaultStudioSound);
  const [target, setTarget] = useState<HearthExportTarget>(defaultTarget);
  const [threshold, setThreshold] = useState(defaultThreshold);
  const [chapter, setChapter] = useState(1);
  const totalMinutes = chapters.reduce((sum, item) => sum + item.minutes, 0) || 1;

  return (
    <MotionConfig
      reducedMotion="user"
      transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 30 }}
    >
      <section
        aria-labelledby={headingId}
        className={cx("bg-(--iu-background) font-(family-name:--iu-font) text-(--iu-foreground)", className)}
      >
        <div className="mx-auto max-w-[1200px] px-4 py-16 sm:px-8 sm:py-24">
          <div className="max-w-[40rem]">
            <span className="inline-flex h-8 items-center rounded-full bg-[color-mix(in_oklab,var(--iu-accent)_12%,var(--iu-surface))] px-3.5 text-sm font-medium">
              {kicker}
            </span>
            <h2
              id={headingId}
              className="mt-5 text-[clamp(2.25rem,1.6rem+2.6vw,3.5rem)] leading-[1.05] font-semibold tracking-[-0.03em] text-balance"
            >
              {headline}
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-pretty text-(--iu-muted)">{subline}</p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-4 sm:mt-14 md:grid-cols-2 lg:grid-cols-6 lg:gap-5">
            <article className={cx(CARD, "md:row-span-2 lg:col-span-3")}>
              <CardHead
                icon={<AudioWaveform size={20} strokeWidth={1.5} />}
                title="Your voice, minus the room."
                body="Flip on Studio sound and the hum between your words drops away. The voice stays exactly as you said it."
              />
              <StudioSound
                enabled={studio}
                onToggle={() => {
                  const next = !studio;
                  setStudio(next);
                  onStudioSoundChange?.(next);
                }}
              />
            </article>

            <article className={cx(CARD, "lg:col-span-3")}>
              <CardHead
                icon={<Upload size={20} strokeWidth={1.5} />}
                title="One episode, every shape."
                body="Pick where it goes. Hearth reframes the cut and sets the loudness that platform expects."
              />
              <ExportTargets
                target={target}
                episodeTitle={episodeTitle}
                onChange={(next) => {
                  setTarget(next);
                  onTargetChange?.(next);
                }}
              />
            </article>

            <article className={cx(CARD, "lg:col-span-3")}>
              <CardHead
                icon={<Scissors size={20} strokeWidth={1.5} />}
                title="Long pauses, gently shortened."
                body="Choose how much breathing room to keep. Every gap longer than that is tightened, never cut mid-word."
              />
              <SilenceTrimmer
                threshold={threshold}
                episodeSeconds={episodeSeconds}
                onChange={(next) => {
                  setThreshold(next);
                  onThresholdChange?.(next);
                }}
              />
            </article>

            <article className={cx(CARD, "md:col-span-2 lg:col-span-6")}>
              <CardHead
                icon={<ListOrdered size={20} strokeWidth={1.5} />}
                title="Chapters, written for you."
                body="Hearth listens for topic changes and names each part. Pick one to jump there."
              />
              <fieldset className="mt-6">
                <legend className="sr-only">Chapters of {episodeTitle}</legend>
                <div aria-hidden="true" className="mb-4 flex h-2 gap-1">
                  {chapters.map((item, index) => (
                    <span
                      key={item.start}
                      data-segment
                      className={cx(
                        "rounded-full transition-colors duration-200 motion-reduce:transition-none",
                        index === chapter ? "bg-(--iu-accent)" : "bg-(--iu-foreground)/12",
                      )}
                      style={{ flexGrow: item.minutes / totalMinutes }}
                    />
                  ))}
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {chapters.map((item, index) => (
                    <label key={item.start} className="group relative block cursor-pointer">
                      <input
                        type="radio"
                        name={chapterName}
                        value={index}
                        checked={chapter === index}
                        onChange={() => {
                          setChapter(index);
                          onChapterSelect?.(index);
                        }}
                        className="peer sr-only"
                      />
                      <span
                        data-card
                        className={cx(
                          "flex h-full flex-col gap-3 rounded-[max(var(--iu-radius),16px)] border p-4 transition-[transform,background-color,border-color,box-shadow] duration-200 group-active:scale-[0.98] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-(--iu-accent) motion-reduce:transition-none",
                          chapter === index
                            ? "border-(--iu-accent)/50 bg-[color-mix(in_oklab,var(--iu-accent)_10%,var(--iu-surface))] shadow-[inset_0_2px_4px_color-mix(in_oklab,var(--iu-foreground)_8%,transparent)]"
                            : "border-(--iu-foreground)/10 bg-(--iu-surface) shadow-[0_1px_2px_color-mix(in_oklab,var(--iu-foreground)_6%,transparent)] dark:bg-transparent pointer-fine:group-hover:-translate-y-0.5",
                        )}
                      >
                        <span className="flex items-center justify-between">
                          <span className="font-mono text-xs text-(--iu-muted) tabular-nums">{item.start}</span>
                          <span className="text-xs text-(--iu-muted) tabular-nums">{item.minutes} min</span>
                        </span>
                        <span className="text-[15px] leading-snug font-medium text-balance">{item.title}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </article>
          </div>
        </div>
      </section>
    </MotionConfig>
  );
}

export default HearthStudioBento;
