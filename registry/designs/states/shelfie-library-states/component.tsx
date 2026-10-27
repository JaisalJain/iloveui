"use client";

import { useId, useState } from "react";
import type { ReactNode } from "react";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "motion/react";
import { Check, LoaderCircle, Plus, RotateCw, Search } from "lucide-react";

export type ShelfieStatus = "no-results" | "empty" | "error" | "loading";

export type ShelfieLibraryStatesProps = {
  status?: ShelfieStatus;
  /** The search that found nothing (no-results). */
  query?: string;
  /** Books on the reader's shelf, used in copy. */
  bookCount?: number;
  /** Shown under the error copy so support can find the request. */
  errorReference?: string;
  onAddBook?: () => void;
  /** May return a promise; the button keeps its width and spins until it settles. */
  onRetry?: () => void | Promise<void>;
  onSearchEverywhere?: (query: string) => void;
  className?: string;
};

const BOUNCY = { type: "spring", stiffness: 400, damping: 16 } as const;

function cx(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

const STROKE = "stroke-(--iu-foreground)";
const TINT = "fill-[color-mix(in_oklab,var(--iu-accent)_22%,var(--iu-surface))]";

/** The shelf every illustration stands on: a plank and two brackets. */
function Shelf({ tilt = 0 }: { tilt?: number }) {
  return (
    <g transform={`rotate(${tilt} 120 132)`}>
      <rect
        x="20"
        y="128"
        width="200"
        height="10"
        rx="4"
        className={cx("fill-(--iu-surface)", STROKE)}
        strokeWidth="2"
      />
      <path d="M44 138v14h10" className={cx("fill-none", STROKE)} strokeWidth="2" strokeLinecap="round" />
      <path d="M196 138v14h-10" className={cx("fill-none", STROKE)} strokeWidth="2" strokeLinecap="round" />
    </g>
  );
}

function EmptyShelf({ dropped }: { dropped: boolean }) {
  return (
    <svg viewBox="0 0 240 164" aria-hidden="true" className="h-auto w-full overflow-visible">
      <Shelf />
      {/* Slots where books will go */}
      {[52, 80, 104].map((x, index) => (
        <rect
          key={x}
          x={x}
          y={index === 1 ? 74 : 64}
          width={index === 2 ? 20 : 24}
          height={index === 1 ? 54 : 64}
          rx="4"
          className="fill-none stroke-(--iu-muted)"
          strokeWidth="2"
          strokeDasharray="5 5"
        />
      ))}
      {/* Bookend */}
      <path
        d="M140 128V84h8v36h18v8z"
        className={cx("fill-(--iu-foreground)", STROKE)}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Plant */}
      <path d="M180 128l-4-24h28l-4 24z" className={cx(TINT, STROKE)} strokeWidth="2" strokeLinejoin="round" />
      <path
        d="M190 104c0-12-8-18-16-20 0 10 6 18 16 20zm0 0c0-14 8-22 18-24 0 12-8 22-18 24z"
        className={cx("fill-(--iu-accent)", STROKE)}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <AnimatePresence initial={false}>
        {dropped ? (
          <motion.g
            key="book"
            initial={{ y: -90, rotate: -14, opacity: 0 }}
            animate={{ y: 0, rotate: 0, opacity: 1 }}
            transition={BOUNCY}
            style={{ originX: "64px", originY: "128px" }}
          >
            <rect
              x="52"
              y="64"
              width="24"
              height="64"
              rx="4"
              className={cx("fill-(--iu-accent)", STROKE)}
              strokeWidth="2"
            />
            <path d="M58 76h12M58 82h8" className={cx("fill-none", STROKE)} strokeWidth="2" strokeLinecap="round" />
          </motion.g>
        ) : null}
      </AnimatePresence>
    </svg>
  );
}

function SearchShelf() {
  return (
    <svg viewBox="0 0 240 164" aria-hidden="true" className="h-auto w-full overflow-visible">
      <Shelf />
      <rect x="40" y="70" width="22" height="58" rx="4" className={cx(TINT, STROKE)} strokeWidth="2" />
      <rect x="64" y="60" width="26" height="68" rx="4" className={cx("fill-(--iu-accent)", STROKE)} strokeWidth="2" />
      <rect x="92" y="78" width="18" height="50" rx="4" className={cx("fill-(--iu-surface)", STROKE)} strokeWidth="2" />
      <rect x="150" y="70" width="22" height="58" rx="4" className={cx(TINT, STROKE)} strokeWidth="2" />
      <path
        d="M176 128l12-58 20 4-12 58z"
        className={cx("fill-(--iu-surface)", STROKE)}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* The magnifier finds a gap */}
      <circle cx="128" cy="78" r="26" className={cx("fill-(--iu-background)", STROKE)} strokeWidth="2" />
      <path
        d="M118 78h20"
        className="fill-none stroke-(--iu-muted)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="4 4"
      />
      <path d="M147 97l18 18" className={cx("fill-none", STROKE)} strokeWidth="6" strokeLinecap="round" />
    </svg>
  );
}

function BrokenShelf() {
  return (
    <svg viewBox="0 0 240 164" aria-hidden="true" className="h-auto w-full overflow-visible">
      <Shelf tilt={8} />
      {/* Books slid to the low end, one leaning, one on the floor */}
      <g transform="rotate(8 120 132)">
        <rect
          x="150"
          y="66"
          width="24"
          height="62"
          rx="4"
          className={cx("fill-(--iu-accent)", STROKE)}
          strokeWidth="2"
        />
        <rect x="176" y="74" width="20" height="54" rx="4" className={cx(TINT, STROKE)} strokeWidth="2" />
        <rect
          x="126"
          y="72"
          width="22"
          height="56"
          rx="4"
          transform="rotate(-18 148 128)"
          className={cx("fill-(--iu-surface)", STROKE)}
          strokeWidth="2"
        />
      </g>
      <rect x="32" y="146" width="54" height="16" rx="4" className={cx(TINT, STROKE)} strokeWidth="2" />
      {/* Snapped bracket */}
      <path
        d="M50 120l6 8-5 6 6 8"
        className="fill-none stroke-red-600 dark:stroke-red-400"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Skeleton() {
  return (
    <ul aria-hidden="true" className="grid w-full gap-3 @lg:grid-cols-2">
      {[0, 1, 2, 3].map((index) => (
        <li
          key={index}
          className="flex items-center gap-4 rounded-[max(var(--iu-radius),16px)] border-2 border-(--iu-foreground)/15 p-[calc(12px*var(--iu-density))]"
        >
          <span className="h-16 w-12 shrink-0 rounded-[10px] bg-(--iu-foreground)/10" />
          <span className="grid flex-1 gap-2">
            <span className={cx("h-3.5 rounded-full bg-(--iu-foreground)/12", index % 2 ? "w-3/5" : "w-4/5")} />
            <span className="h-3 w-2/5 rounded-full bg-(--iu-foreground)/8" />
            <span className="mt-1 h-2 w-full rounded-full bg-(--iu-foreground)/8" />
          </span>
        </li>
      ))}
    </ul>
  );
}

const buttonBase =
  "inline-flex h-12 items-center justify-center gap-2 rounded-full border-2 border-(--iu-foreground) px-6 text-sm font-bold shadow-[4px_4px_0_var(--sf-shade)] transition-[translate,box-shadow] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--iu-accent) active:translate-x-1 active:translate-y-1 active:shadow-none motion-reduce:transition-none";

export function ShelfieLibraryStates({
  status = "no-results",
  query = "the left hand of darkness",
  bookCount = 214,
  errorReference = "504 · req 7f3a-19c2",
  onAddBook,
  onRetry,
  onSearchEverywhere,
  className = "",
}: ShelfieLibraryStatesProps) {
  const reduceMotion = useReducedMotion();
  const titleId = useId();
  const [dropped, setDropped] = useState(false);
  const [retrying, setRetrying] = useState(false);

  const addBook = () => {
    if (dropped) return;
    setDropped(true);
    // Let the book land before the app moves on.
    window.setTimeout(() => onAddBook?.(), reduceMotion ? 0 : 520);
  };

  const retry = async () => {
    if (retrying) return;
    setRetrying(true);
    try {
      await onRetry?.();
    } finally {
      setRetrying(false);
    }
  };

  const tabs = ["Reading", "Want to read", "Finished"];

  let body: ReactNode;
  if (status === "loading") {
    body = (
      <div className="w-full">
        <p className="mb-4 flex items-center gap-2 text-sm font-bold">
          <LoaderCircle
            size={16}
            strokeWidth={2}
            aria-hidden="true"
            className="animate-spin text-(--iu-accent) motion-reduce:animate-none"
          />
          Loading {bookCount.toLocaleString("en-US")} books
        </p>
        <Skeleton />
      </div>
    );
  } else {
    const copy = {
      "no-results": {
        art: <SearchShelf />,
        title: (
          <>
            No books match <span className="text-(--iu-muted)">“{query}”</span>
          </>
        ),
        text: `We checked titles, authors and your notes across all ${bookCount.toLocaleString("en-US")} books on your shelf. It may simply not be on it yet.`,
      },
      empty: {
        art: <EmptyShelf dropped={dropped} />,
        title: dropped ? "First book, shelved." : "Your shelf is waiting",
        text: "Add the book you are reading now and Shelfie will keep your page, your streak and every quote you save.",
      },
      error: {
        art: <BrokenShelf />,
        title: "Your shelf didn't load",
        text: "Our server took more than 10 seconds to answer. Your books and notes are safe, and nothing was changed.",
      },
    }[status];

    body = (
      <div className="flex w-full flex-col items-center text-center">
        <motion.div
          className="w-[min(100%,300px)]"
          whileHover={reduceMotion ? undefined : { rotate: [0, -3, 3, 0], transition: { duration: 0.5 } }}
        >
          {copy.art}
        </motion.div>
        <h3
          id={titleId}
          className="mt-6 max-w-[26ch] text-2xl leading-tight font-extrabold tracking-[-0.03em] text-balance"
        >
          {copy.title}
        </h3>
        <p className="mt-3 max-w-[44ch] text-[15px] leading-relaxed text-pretty text-(--iu-muted)">{copy.text}</p>

        <div className="mt-7">
          {status === "no-results" ? (
            <button
              type="button"
              onClick={() => onSearchEverywhere?.(query)}
              className={cx(buttonBase, "bg-(--iu-accent) text-(--iu-accent-foreground)")}
            >
              <Search size={16} strokeWidth={2} aria-hidden="true" />
              Search all of Shelfie
            </button>
          ) : null}
          {status === "empty" ? (
            <button
              type="button"
              onClick={addBook}
              aria-disabled={dropped || undefined}
              className={cx(buttonBase, "min-w-[200px] bg-(--iu-accent) text-(--iu-accent-foreground)")}
            >
              {dropped ? (
                <Check size={16} strokeWidth={2.5} aria-hidden="true" />
              ) : (
                <Plus size={16} strokeWidth={2.5} aria-hidden="true" />
              )}
              {dropped ? "Opening search" : "Add your first book"}
            </button>
          ) : null}
          {status === "error" ? (
            <button
              type="button"
              onClick={retry}
              aria-disabled={retrying || undefined}
              className={cx(buttonBase, "min-w-[160px] bg-(--iu-accent) text-(--iu-accent-foreground)")}
            >
              <RotateCw
                size={16}
                strokeWidth={2}
                aria-hidden="true"
                className={retrying ? "animate-spin motion-reduce:animate-none" : ""}
              />
              {retrying ? "Trying" : "Try again"}
            </button>
          ) : null}
        </div>
        {status === "error" ? <p className="mt-4 font-mono text-xs text-(--iu-muted)">Error {errorReference}</p> : null}
      </div>
    );
  }

  const announcement =
    status === "loading"
      ? "Loading your shelf"
      : status === "empty" && dropped
        ? "Book added. Opening search."
        : retrying
          ? "Trying again"
          : "";

  return (
    <MotionConfig reducedMotion="user" transition={reduceMotion ? { duration: 0 } : BOUNCY}>
      <section
        aria-labelledby={status === "loading" ? undefined : titleId}
        aria-label={status === "loading" ? "Your shelf, loading" : undefined}
        aria-busy={status === "loading" || retrying || undefined}
        className={cx(
          "@container overflow-hidden rounded-[max(var(--iu-radius),24px)] border-2 border-(--iu-foreground) bg-(--iu-surface) font-(family-name:--iu-font) text-(--iu-foreground) shadow-[6px_6px_0_var(--sf-shade)] [--sf-shade:color-mix(in_oklab,var(--iu-accent)_30%,var(--iu-foreground))] dark:[--sf-shade:color-mix(in_oklab,var(--iu-accent)_32%,var(--iu-background))]",
          className,
        )}
      >
        <header className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-(--iu-foreground) px-[calc(20px*var(--iu-density))] py-[calc(14px*var(--iu-density))]">
          <span className="flex items-center gap-2 text-lg font-extrabold tracking-[-0.02em]">
            <svg viewBox="0 0 24 24" aria-hidden="true" className="size-6">
              <rect
                x="3"
                y="4"
                width="6"
                height="16"
                rx="2"
                className="fill-(--iu-accent) stroke-(--iu-foreground)"
                strokeWidth="2"
              />
              <rect
                x="11"
                y="7"
                width="5"
                height="13"
                rx="2"
                className="fill-(--iu-surface) stroke-(--iu-foreground)"
                strokeWidth="2"
              />
              <path d="M17.5 8.5l3.5-1 2 12-3.5 1z" className="fill-(--iu-foreground)" />
            </svg>
            Shelfie
          </span>
          <div
            className={cx(
              "flex h-10 min-w-0 flex-1 items-center gap-2 rounded-full border-2 border-(--iu-foreground)/35 px-3 text-sm @lg:max-w-[280px]",
              status === "no-results" ? "border-(--iu-foreground) text-(--iu-foreground)" : "text-(--iu-muted)",
            )}
          >
            <Search size={16} strokeWidth={2} aria-hidden="true" className="shrink-0" />
            <span className="truncate">{status === "no-results" ? query : "Search your shelf"}</span>
          </div>
        </header>
        <nav aria-label="Shelves" className="flex gap-1 overflow-x-auto px-[calc(16px*var(--iu-density))] pt-4">
          {tabs.map((tab, index) => (
            <a
              key={tab}
              href={`#${tab.toLowerCase().replace(/\s+/g, "-")}`}
              aria-current={index === 0 ? "page" : undefined}
              className="inline-flex h-9 shrink-0 items-center rounded-full border-2 border-transparent px-3 text-sm font-bold text-(--iu-muted) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--iu-accent) aria-[current=page]:border-(--iu-foreground) aria-[current=page]:bg-(--iu-foreground) aria-[current=page]:text-(--iu-surface) pointer-fine:hover:text-(--iu-foreground)"
            >
              {tab}
            </a>
          ))}
        </nav>
        <div className="flex min-h-[420px] items-center justify-center px-[calc(24px*var(--iu-density))] py-[calc(36px*var(--iu-density))]">
          <AnimatePresence initial={false} mode="wait">
            <motion.div
              key={status}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="flex w-full justify-center"
            >
              {body}
            </motion.div>
          </AnimatePresence>
        </div>
        <p aria-live="polite" className="sr-only">
          {announcement}
        </p>
      </section>
    </MotionConfig>
  );
}

export default ShelfieLibraryStates;
