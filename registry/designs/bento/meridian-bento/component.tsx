"use client";

import { useId, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "motion/react";
import { Check, Moon } from "lucide-react";

export type MeridianPerson = {
  name: string;
  city: string;
  /** Hours from UTC on the meeting day, for example -4 for New York in October. */
  utcOffset: number;
  /** Local working hours, 24-hour clock. */
  workStart: number;
  workEnd: number;
};

export type MeridianSlot = { time: string; selected?: boolean };

export type MeridianBentoProps = {
  kicker?: string;
  headline?: string;
  subline?: string;
  people?: MeridianPerson[];
  /** Meeting start in half hours from 00:00 UTC (28 is 14:00). */
  defaultSlot?: number;
  /** Meeting length in half hours. */
  meetingLength?: number;
  bookingTitle?: string;
  bookingHost?: string;
  bookingSlots?: MeridianSlot[];
  focusHours?: number[];
  calendars?: { name: string; detail: string; synced: string }[];
  onSlotChange?: (startHalfHour: number) => void;
  className?: string;
};

const DEFAULT_PEOPLE: MeridianPerson[] = [
  { name: "Ines Duarte", city: "Lisbon", utcOffset: 0, workStart: 9, workEnd: 18 },
  { name: "Lukas Brandt", city: "Berlin", utcOffset: 1, workStart: 8, workEnd: 17 },
  { name: "Camila Rocha", city: "São Paulo", utcOffset: -3, workStart: 9, workEnd: 18 },
  { name: "Owen Achebe", city: "New York", utcOffset: -4, workStart: 9, workEnd: 18 },
];

const DEFAULT_SLOTS: MeridianSlot[] = [
  { time: "09:00" },
  { time: "09:30" },
  { time: "10:00" },
  { time: "11:30", selected: true },
  { time: "13:00" },
  { time: "14:00" },
  { time: "15:30" },
  { time: "16:00" },
];

const DEFAULT_FOCUS = [2.5, 1.5, 3, 2, 2.5];

const DEFAULT_CALENDARS = [
  { name: "Work", detail: "ines@tidewater.io", synced: "12s ago" },
  { name: "Personal", detail: "Private feed, busy only", synced: "2m ago" },
  { name: "Team holidays", detail: "14 events this quarter", synced: "1h ago" },
];

const WEEK = [
  { day: "Mon", date: 26 },
  { day: "Tue", date: 27 },
  { day: "Wed", date: 28 },
  { day: "Thu", date: 29 },
  { day: "Fri", date: 30 },
];

const BUFFER_DAY = [
  { kind: "meeting", label: "Design review", time: "09:30", minutes: 45 },
  { kind: "buffer", label: "Buffer", time: "10:15", minutes: 15 },
  { kind: "meeting", label: "1:1 with Lukas", time: "10:30", minutes: 30 },
  { kind: "buffer", label: "Buffer", time: "11:00", minutes: 15 },
  { kind: "meeting", label: "Customer call, Harbor & Vine", time: "11:15", minutes: 45 },
] as const;

const cx = (...parts: (string | false | undefined)[]) => parts.filter(Boolean).join(" ");

function formatHalfHour(halfHours: number) {
  const wrapped = ((halfHours % 48) + 48) % 48;
  return `${String(Math.floor(wrapped / 2)).padStart(2, "0")}:${wrapped % 2 ? "30" : "00"}`;
}

function localStart(person: MeridianPerson, slot: number) {
  return slot + person.utcOffset * 2;
}

function isAvailable(person: MeridianPerson, slot: number, length: number) {
  const start = ((localStart(person, slot) % 48) + 48) % 48;
  return start >= person.workStart * 2 && start + length <= person.workEnd * 2;
}

function dayShift(person: MeridianPerson, slot: number) {
  const raw = localStart(person, slot);
  if (raw < 0) return "−1d";
  if (raw >= 48) return "+1d";
  return "";
}

function workingHour(person: MeridianPerson, utcHour: number) {
  const local = (((utcHour + person.utcOffset) % 24) + 24) % 24;
  return local >= person.workStart && local < person.workEnd;
}

const LABEL = "text-[11px] font-medium tracking-[0.08em] text-(--iu-muted) uppercase";
const CELL = "flex flex-col bg-(--iu-surface) p-[calc(24px*var(--iu-density))] sm:p-[calc(32px*var(--iu-density))]";

function CellHead({ index, label, title, body }: { index: string; label: string; title: string; body: string }) {
  return (
    <div>
      <div className={cx(LABEL, "flex items-baseline gap-3")}>
        <span className="font-mono tabular-nums">{index}</span>
        <span>{label}</span>
      </div>
      <h3 className="mt-4 text-xl leading-tight font-semibold tracking-[-0.02em] text-balance">{title}</h3>
      <p className="mt-2 max-w-[36rem] text-sm leading-relaxed text-pretty text-(--iu-muted)">{body}</p>
    </div>
  );
}

/** Rows of working hours on a shared UTC axis, plus the meeting block that slides across them. */
function TimeZoneFinder({
  people,
  slot,
  length,
  onChange,
}: {
  people: MeridianPerson[];
  slot: number;
  length: number;
  onChange: (next: number) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const labelId = useId();
  const max = 48 - length;
  const available = people.filter((person) => isAvailable(person, slot, length)).length;
  const left = `${(slot / 48) * 100}%`;
  const width = `${(length / 48) * 100}%`;

  function fromPointer(clientX: number) {
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const ratio = (clientX - rect.left) / rect.width;
    onChange(Math.min(max, Math.max(0, Math.round(ratio * 48 - length / 2))));
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const steps: Record<string, number> = {
      ArrowRight: 1,
      ArrowUp: 1,
      ArrowLeft: -1,
      ArrowDown: -1,
      PageUp: 2,
      PageDown: -2,
    };
    let next: number | null = null;
    if (event.key in steps) next = slot + (steps[event.key] ?? 0);
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = max;
    if (next === null) return;
    event.preventDefault();
    onChange(Math.min(max, Math.max(0, next)));
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    fromPointer(event.clientX);
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) fromPointer(event.clientX);
  }

  const ROW =
    "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 @lg:grid-cols-[8.5rem_minmax(0,1fr)_5.5rem]";
  const STRIP = "relative col-span-2 h-5 @lg:col-span-1 @lg:col-start-2 @lg:row-start-1";
  const END = "col-start-2 row-start-1 text-right @lg:col-start-3";

  return (
    <div className="@container mt-8">
      <ul className="flex flex-col">
        {people.map((person) => {
          const ok = isAvailable(person, slot, length);
          const time = formatHalfHour(localStart(person, slot));
          const shift = dayShift(person, slot);
          return (
            <li
              key={person.name}
              className={cx(ROW, "border-t border-(--iu-border) py-[calc(12px*var(--iu-density))]")}
            >
              <div className="min-w-0">
                <span className="block truncate text-sm font-medium">{person.name}</span>
                <span className="block truncate text-xs text-(--iu-muted)">{person.city}</span>
              </div>
              <div aria-hidden="true" className={STRIP}>
                <div className="absolute inset-0 flex gap-px">
                  {Array.from({ length: 24 }, (_, hour) => (
                    <span
                      key={hour}
                      className={cx(
                        "h-full flex-1",
                        workingHour(person, hour)
                          ? "bg-(--iu-foreground)/14 dark:bg-(--iu-foreground)/20"
                          : "bg-(--iu-foreground)/4 dark:bg-(--iu-foreground)/6",
                      )}
                    />
                  ))}
                </div>
                <span
                  data-band
                  className="absolute inset-y-[-3px] border-2 border-(--iu-accent) bg-(--iu-accent)/15 transition-[left] duration-150 ease-out motion-reduce:transition-none"
                  style={{ left, width }}
                />
              </div>
              <div className={END}>
                <span className="inline-flex items-center justify-end gap-1.5 font-mono text-sm tabular-nums">
                  <span data-icon className="inline-flex">
                    {ok ? (
                      <Check size={14} strokeWidth={1.75} aria-hidden="true" />
                    ) : (
                      <Moon size={14} strokeWidth={1.5} aria-hidden="true" className="text-(--iu-muted)" />
                    )}
                  </span>
                  <span data-time className="relative inline-block w-[5ch] text-left">
                    <AnimatePresence initial={false} mode="popLayout">
                      <motion.span
                        key={time}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={cx("inline-block", !ok && "text-(--iu-muted)")}
                      >
                        {time}
                      </motion.span>
                    </AnimatePresence>
                  </span>
                </span>
                <span data-hours className="block font-mono text-[11px] text-(--iu-muted)">
                  {ok ? "In hours" : "Off hours"}
                  {shift ? ` ${shift}` : ""}
                </span>
              </div>
            </li>
          );
        })}
      </ul>

      <div className={cx(ROW, "border-t border-(--iu-border) pt-4")}>
        <span id={labelId} className={cx(LABEL, "self-start")}>
          Meeting, UTC
        </span>
        <div className={cx(STRIP, "h-auto")}>
          <div
            ref={trackRef}
            role="slider"
            tabIndex={0}
            aria-labelledby={labelId}
            aria-valuemin={0}
            aria-valuemax={max}
            aria-valuenow={slot}
            aria-valuetext={`${formatHalfHour(slot)} to ${formatHalfHour(slot + length)} UTC, ${available} of ${people.length} in working hours`}
            onKeyDown={onKeyDown}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            className="relative h-10 cursor-ew-resize touch-none rounded-[min(var(--iu-radius),6px)] select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--iu-accent)"
          >
            <span aria-hidden="true" className="absolute inset-x-0 top-1/2 h-px bg-(--iu-border)" />
            {[0, 12, 24, 36, 48].map((tick) => (
              <span
                key={tick}
                aria-hidden="true"
                className="absolute top-[calc(50%-4px)] h-2 w-px bg-(--iu-foreground)/30"
                style={{ left: `${(tick / 48) * 100}%` }}
              />
            ))}
            <span
              aria-hidden="true"
              data-band
              className="absolute inset-y-1.5 flex items-center justify-center rounded-[min(var(--iu-radius),4px)] bg-(--iu-accent) transition-[left] duration-150 ease-out motion-reduce:transition-none"
              style={{ left, width }}
            >
              <span className="flex gap-0.5">
                <span className="h-3 w-px bg-(--iu-accent-foreground)/60" />
                <span className="h-3 w-px bg-(--iu-accent-foreground)/60" />
              </span>
            </span>
          </div>
          <div
            aria-hidden="true"
            className="mt-1 flex justify-between font-mono text-[11px] text-(--iu-muted) tabular-nums"
          >
            <span>00</span>
            <span>06</span>
            <span>12</span>
            <span>18</span>
            <span>24</span>
          </div>
        </div>
        <div className={cx(END, "self-start")}>
          <span data-start className="block font-mono text-sm tabular-nums">
            {formatHalfHour(slot)}
          </span>
          <span data-free className="block font-mono text-[11px] text-(--iu-muted) tabular-nums">
            {available}/{people.length} free
          </span>
        </div>
      </div>
    </div>
  );
}

export function MeridianBento({
  kicker = "Meridian scheduling",
  headline = "Meetings land where every calendar agrees.",
  subline = "Meridian reads each calendar, time zone and focus rule on your team, then offers only the slots that work for everyone in the room.",
  people = DEFAULT_PEOPLE,
  defaultSlot = 28,
  meetingLength = 2,
  bookingTitle = "Intro call, 30 min",
  bookingHost = "Ines Duarte",
  bookingSlots = DEFAULT_SLOTS,
  focusHours = DEFAULT_FOCUS,
  calendars = DEFAULT_CALENDARS,
  onSlotChange,
  className = "",
}: MeridianBentoProps) {
  const reduceMotion = useReducedMotion();
  const headingId = useId();
  const [slot, setSlot] = useState(defaultSlot);
  const focusTotal = focusHours.reduce((sum, hours) => sum + hours, 0);
  const focusPeak = Math.max(...focusHours, 1);
  const selectedSlot = bookingSlots.find((item) => item.selected) ?? bookingSlots[0];

  function changeSlot(next: number) {
    if (next === slot) return;
    setSlot(next);
    onSlotChange?.(next);
  }

  return (
    <MotionConfig
      reducedMotion="user"
      transition={reduceMotion ? { duration: 0 } : { duration: 0.15, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <section
        aria-labelledby={headingId}
        className={cx("bg-(--iu-background) font-(family-name:--iu-font) text-(--iu-foreground)", className)}
      >
        <div className="mx-auto max-w-[1200px] px-6 py-16 sm:px-10 sm:py-24">
          <div className={cx(LABEL, "flex items-baseline justify-between border-b border-(--iu-border) pb-3")}>
            <span>{kicker}</span>
            <span className="tabular-nums">02 / Features</span>
          </div>

          <div className="mt-10 grid grid-cols-12 gap-x-6 gap-y-6 sm:mt-14">
            <h2
              id={headingId}
              className="col-span-12 text-[clamp(2.25rem,1.4rem+3vw,3.5rem)] leading-[1.02] font-semibold tracking-[-0.035em] text-balance lg:col-span-7"
            >
              {headline}
            </h2>
            <p className="col-span-12 max-w-[30rem] self-end text-base leading-relaxed text-pretty text-(--iu-muted) lg:col-span-4 lg:col-start-9">
              {subline}
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-px border border-(--iu-border) bg-(--iu-border) sm:mt-16 md:grid-cols-2 lg:grid-cols-12">
            {/* 01: the interactive time-zone finder */}
            <article className={cx(CELL, "md:col-span-2 lg:col-span-8")}>
              <CellHead
                index="01"
                label="Time zones"
                title="Find the hour everyone is awake."
                body="Drag the meeting across the day, or focus it and use the arrow keys. Each row shows who would be inside their working hours."
              />
              <TimeZoneFinder people={people} slot={slot} length={meetingLength} onChange={changeSlot} />
            </article>

            {/* 02: booking link */}
            <article className={cx(CELL, "lg:col-span-4 lg:row-span-2")}>
              <CellHead
                index="02"
                label="Booking links"
                title="One link, only real openings."
                body="Guests see the times your calendars leave open, already converted to their zone."
              />
              <figure className="mt-8 flex flex-1 flex-col border border-(--iu-border) lg:mt-auto">
                <figcaption className="border-b border-(--iu-border) px-4 py-3">
                  <span className="block text-sm font-medium">{bookingTitle}</span>
                  <span className="block text-xs text-(--iu-muted)">with {bookingHost} · video call</span>
                </figcaption>
                <div className="grid grid-cols-5 border-b border-(--iu-border)">
                  {WEEK.map((day) => (
                    <div
                      key={day.date}
                      className={cx(
                        "flex flex-col items-center py-[calc(10px*var(--iu-density))]",
                        day.date === 27 ? "bg-(--iu-foreground) text-(--iu-background)" : "text-(--iu-foreground)",
                      )}
                    >
                      <span className={cx("text-[11px]", day.date === 27 ? "opacity-80" : "text-(--iu-muted)")}>
                        {day.day}
                      </span>
                      <span className="font-mono text-sm tabular-nums">{day.date}</span>
                    </div>
                  ))}
                </div>
                <ul className="grid grid-cols-2 gap-2 p-4 lg:grid-cols-1">
                  {bookingSlots.map((item) => (
                    <li
                      key={item.time}
                      className={cx(
                        "flex items-center justify-between border px-3 py-[calc(8px*var(--iu-density))] font-mono text-sm tabular-nums",
                        item.selected
                          ? "border-(--iu-foreground) text-(--iu-foreground)"
                          : "border-(--iu-border) text-(--iu-muted)",
                      )}
                    >
                      {item.time}
                      {item.selected ? <Check size={14} strokeWidth={1.75} aria-label="Selected" /> : null}
                    </li>
                  ))}
                </ul>
                <div className="mt-auto flex flex-col gap-3 border-t border-(--iu-border) p-4">
                  <span className="text-xs text-(--iu-muted)">
                    Tue 27 Oct, {selectedSlot?.time ?? "11:30"} · Lisbon time
                  </span>
                  <span className="flex h-10 items-center justify-center rounded-[min(var(--iu-radius),6px)] bg-(--iu-foreground) text-sm font-medium text-(--iu-background)">
                    Confirm {selectedSlot?.time ?? "11:30"}
                  </span>
                </div>
              </figure>
            </article>

            {/* 03: buffers */}
            <article className={cx(CELL, "lg:col-span-4")}>
              <CellHead
                index="03"
                label="Buffers"
                title="Fifteen minutes between calls."
                body="Back-to-back requests get pushed, never stacked."
              />
              <ol className="mt-8 flex flex-col">
                {BUFFER_DAY.map((item) => (
                  <li
                    key={item.time}
                    className="grid grid-cols-[3.25rem_1fr] items-stretch gap-3 font-mono text-[11px] text-(--iu-muted) tabular-nums"
                  >
                    <span className="pt-1.5">{item.time}</span>
                    {item.kind === "buffer" ? (
                      <span
                        className="flex h-6 items-center [background-image:repeating-linear-gradient(135deg,var(--iu-border)_0_1px,transparent_1px_6px)] px-2"
                        style={{ height: item.minutes * 1.6 }}
                      >
                        {item.minutes}m buffer
                      </span>
                    ) : (
                      <span
                        className="mb-px flex items-start justify-between gap-2 border-l-2 border-(--iu-foreground) bg-(--iu-foreground)/5 px-2 py-1.5 font-sans text-xs text-(--iu-foreground) dark:bg-(--iu-foreground)/8"
                        style={{ minHeight: item.minutes * 1.2 }}
                      >
                        <span className="truncate">{item.label}</span>
                        <span className="shrink-0 font-mono text-[11px] text-(--iu-muted)">{item.minutes}m</span>
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            </article>

            {/* 04: focus time */}
            <article className={cx(CELL, "lg:col-span-4")}>
              <CellHead
                index="04"
                label="Focus time"
                title="Deep work, defended."
                body="Two-hour blocks are held until someone books around them."
              />
              <div className="mt-8 flex items-end justify-between gap-6 lg:mt-auto">
                <p className="leading-none">
                  <span className="text-[64px] font-semibold tracking-[-0.04em] tabular-nums">{focusTotal}</span>
                  <span className="ml-1 text-xl font-medium text-(--iu-muted)">h</span>
                  <span className="mt-2 block text-xs text-(--iu-muted)">protected this week</span>
                </p>
                <svg
                  role="img"
                  aria-label={`Focus hours per weekday: ${focusHours.join(", ")}`}
                  viewBox="0 0 100 64"
                  className="h-16 w-28 shrink-0"
                >
                  {focusHours.map((hours, index) => {
                    const height = (hours / focusPeak) * 56;
                    return (
                      <rect
                        key={index}
                        x={index * 20 + 4}
                        y={64 - height}
                        width={12}
                        height={height}
                        className="fill-(--iu-foreground)/80"
                      />
                    );
                  })}
                </svg>
              </div>
            </article>

            {/* 05: calendar sync */}
            <article className={cx(CELL, "lg:col-span-12 lg:grid lg:grid-cols-12 lg:gap-x-6")}>
              <div className="lg:col-span-4">
                <CellHead
                  index="05"
                  label="Calendar sync"
                  title="Two-way sync, every 15 seconds."
                  body="Every connected calendar writes back, so nobody books the hour you just took."
                />
              </div>
              <ul className="mt-8 flex flex-col lg:col-span-7 lg:col-start-6 lg:mt-0">
                {calendars.map((calendar, index) => (
                  <li
                    key={calendar.name}
                    className={cx(
                      "grid grid-cols-[2rem_1fr_auto] items-baseline gap-3 py-[calc(12px*var(--iu-density))]",
                      index > 0 && "border-t border-(--iu-border)",
                    )}
                  >
                    <span className="font-mono text-[11px] text-(--iu-muted) tabular-nums">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-medium">{calendar.name}</span>
                      <span className="block truncate text-xs text-(--iu-muted)">{calendar.detail}</span>
                    </span>
                    <span className="font-mono text-[11px] whitespace-nowrap text-(--iu-muted) tabular-nums">
                      Synced {calendar.synced}
                    </span>
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </div>
      </section>
    </MotionConfig>
  );
}

export default MeridianBento;
