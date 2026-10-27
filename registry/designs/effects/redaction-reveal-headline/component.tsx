"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";

export type RedactionPart = {
  text: string;
  /** Covered by a redaction bar that lifts once, as the words scroll into view. */
  redact?: boolean;
};

export type RedactionReceipt = {
  value: string;
  label: string;
  detail: string;
};

export type RedactionRevealHeadlineProps = {
  brand?: string;
  issue?: string;
  sticker?: string;
  statement?: RedactionPart[];
  body?: string;
  ctaLabel?: string;
  ctaHref?: string;
  receipts?: RedactionReceipt[];
  /** Fires once, after the last bar has lifted. */
  onRevealed?: () => void;
  className?: string;
};

const DEFAULT_STATEMENT: RedactionPart[] = [
  { text: "We count your visitors without " },
  { text: "cookies", redact: true },
  { text: ", without " },
  { text: "fingerprinting", redact: true },
  { text: " and without " },
  { text: "keeping a single IP address", redact: true },
  { text: "." },
];

const DEFAULT_RECEIPTS: RedactionReceipt[] = [
  { value: "0", label: "Cookies set", detail: "cookie API never called" },
  { value: "0", label: "Device signals", detail: "no canvas, font or audio probes" },
  { value: "0", label: "IPs stored", detail: "hashed in memory, dropped in 24h" },
];

type Word = { text: string; key: string; last: boolean };

function indexParts(statement: RedactionPart[]) {
  let count = -1;
  return statement.map((part) => ({ part, index: part.redact ? (count += 1) : -1 }));
}

function wordsOf(part: RedactionPart, partIndex: number): Word[] {
  const words = part.text.split(/\s+/).filter(Boolean);
  return words.map((text, index) => ({ text, key: `${partIndex}-${index}`, last: index === words.length - 1 }));
}

/**
 * One redacted word. Server markup shows the word uncovered (readable without JavaScript); after mount the bar
 * covers it and lifts once the word crosses the reading line, collapsing down onto the phrase's accent underline.
 */
function RedactedWord({ word, covered, delay }: { word: Word; covered: boolean; delay: number }) {
  return (
    <span className="relative inline-block underline decoration-(--iu-accent) [text-decoration-thickness:0.09em] underline-offset-[0.1em] [text-decoration-skip-ink:none]">
      {word.text}
      <span
        aria-hidden="true"
        data-covered={covered ? "" : undefined}
        style={{ transitionDelay: covered ? "0ms" : `${delay}ms` }}
        className={`absolute top-[0.12em] -bottom-[0.04em] origin-bottom scale-y-0 bg-(--iu-foreground) transition-transform duration-[160ms] ease-[steps(4,end)] data-covered:scale-y-100 motion-reduce:hidden motion-reduce:transition-none ${
          word.last ? "inset-x-[-0.04em]" : "-right-[0.3em] -left-[0.04em]"
        }`}
      />
    </span>
  );
}

export function RedactionRevealHeadline({
  brand = "Hushmark Analytics",
  issue = "Privacy ledger · rev 07",
  sticker = "Audited 14 Mar 2026",
  statement = DEFAULT_STATEMENT,
  body = "Hushmark is a 1.9 kB script that reports page views and referrers, and nothing about the person reading. An outside auditor read every line of it in March.",
  ctaLabel = "Read the script",
  ctaHref = "#script",
  receipts = DEFAULT_RECEIPTS,
  onRevealed,
  className = "",
}: RedactionRevealHeadlineProps) {
  const titleId = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const endRef = useRef<HTMLUListElement>(null);
  const redactedCount = statement.filter((part) => part.redact).length;
  // Indexes of redacted parts still covered. Empty on the server, so the statement is readable without JavaScript.
  const [covered, setCovered] = useState<Set<number>>(() => new Set());
  const onRevealedRef = useRef(onRevealed);
  useEffect(() => {
    onRevealedRef.current = onRevealed;
  }, [onRevealed]);

  useEffect(() => {
    const heading = headingRef.current;
    if (!heading || redactedCount === 0) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const targets = Array.from(heading.querySelectorAll<HTMLElement>("[data-redaction]"));
    // Words already scrolled past stay uncovered: the effect never hides what someone has read.
    const pending = new Set<number>();
    for (const target of targets) {
      if (target.getBoundingClientRect().bottom > 0) pending.add(Number(target.dataset.redaction));
    }
    if (pending.size === 0) return;

    const timers: number[] = [];
    let batch: number[] = [];
    let frame = 0;
    const flush = () => {
      frame = 0;
      const lifting = batch.sort((a, b) => a - b);
      batch = [];
      lifting.forEach((index, order) => {
        const timer = window.setTimeout(
          () => {
            pending.delete(index);
            setCovered((current) => {
              const next = new Set(current);
              next.delete(index);
              return next;
            });
            if (pending.size === 0) onRevealedRef.current?.();
          },
          320 + order * 260,
        );
        timers.push(timer);
      });
    };
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = Number((entry.target as HTMLElement).dataset.redaction);
          observer.unobserve(entry.target);
          if (pending.has(index)) batch.push(index);
        }
        if (batch.length > 0 && frame === 0) frame = window.requestAnimationFrame(flush);
      },
      { rootMargin: "0px 0px -20% 0px", threshold: 1 },
    );
    // Once the end of the section is on screen, lift whatever is still covered: no phrase stays hidden on short
    // pages or tall viewports where it could never reach the reading line.
    const end = endRef.current;
    const endObserver = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      endObserver.disconnect();
      for (const target of targets) {
        const index = Number(target.dataset.redaction);
        observer.unobserve(target);
        if (pending.has(index) && !batch.includes(index)) batch.push(index);
      }
      if (batch.length > 0 && frame === 0) frame = window.requestAnimationFrame(flush);
    });
    // Cover first, then start watching on the next frame so no bar lifts before it has covered.
    let watch = 0;
    const start = window.requestAnimationFrame(() => {
      setCovered(new Set(pending));
      watch = window.requestAnimationFrame(() => {
        for (const target of targets) observer.observe(target);
        if (end) endObserver.observe(end);
      });
    });
    return () => {
      window.cancelAnimationFrame(start);
      window.cancelAnimationFrame(watch);
      if (frame) window.cancelAnimationFrame(frame);
      observer.disconnect();
      endObserver.disconnect();
      for (const timer of timers) window.clearTimeout(timer);
    };
  }, [redactedCount]);

  const parts = indexParts(statement);

  return (
    <section
      aria-labelledby={titleId}
      className={`bg-(--iu-background) font-(family-name:--iu-font) text-(--iu-foreground) [--rr-shade:var(--iu-foreground)] dark:[--rr-shade:color-mix(in_oklab,var(--iu-foreground)_42%,var(--iu-background))] ${className}`}
    >
      <div className="mx-auto max-w-[1200px] px-6 pt-12 pb-16 sm:px-10 sm:pt-16 sm:pb-24">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-b-2 border-(--iu-foreground) pb-3">
          <span className="text-sm font-extrabold tracking-[0.06em] uppercase">{brand}</span>
          <span className="font-mono text-xs tracking-[0.08em] text-(--iu-muted) uppercase">{issue}</span>
        </div>

        <div className="relative mt-12 sm:mt-16">
          <span className="mb-8 inline-block -rotate-3 rounded-[min(var(--iu-radius),4px)] border-2 border-(--iu-foreground) bg-(--iu-surface) px-3 py-1.5 font-mono text-xs font-bold tracking-[0.08em] uppercase shadow-[3px_3px_0_var(--rr-shade)] lg:absolute lg:top-2 lg:right-0 lg:mb-0">
            {sticker}
          </span>
          <h2
            id={titleId}
            ref={headingRef}
            className="max-w-[17ch] text-[clamp(2.5rem,1.1rem+5.4vw,6rem)] leading-[1.02] font-extrabold tracking-[-0.04em] text-balance"
          >
            {parts.map(({ part, index }, partIndex) => {
              if (!part.redact) return <span key={partIndex}>{part.text}</span>;
              const isCovered = covered.has(index);
              return (
                <span
                  key={partIndex}
                  data-redaction={index}
                  className="underline decoration-(--iu-accent) [text-decoration-thickness:0.09em] underline-offset-[0.1em] [text-decoration-skip-ink:none]"
                >
                  {wordsOf(part, partIndex).map((word, wordIndex, all) => (
                    <span key={word.key}>
                      <RedactedWord word={word} covered={isCovered} delay={wordIndex * 70} />
                      {wordIndex < all.length - 1 ? " " : null}
                    </span>
                  ))}
                </span>
              );
            })}
          </h2>
        </div>

        <div className="mt-14 grid grid-cols-12 gap-x-6 gap-y-10 sm:mt-20">
          <div className="col-span-12 lg:col-span-5">
            <p className="max-w-[34rem] text-base leading-relaxed text-pretty text-(--iu-muted) sm:text-lg">{body}</p>
            <a
              href={ctaHref}
              className="mt-8 inline-flex h-12 items-center gap-2 rounded-[min(var(--iu-radius),4px)] border-2 border-(--iu-foreground) bg-(--iu-accent) px-5 text-sm font-extrabold tracking-[0.06em] text-(--iu-accent-foreground) uppercase shadow-[4px_4px_0_var(--rr-shade)] transition-[translate,box-shadow] duration-100 ease-linear focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--iu-accent) active:translate-x-1 active:translate-y-1 active:shadow-none motion-reduce:transition-none pointer-fine:hover:not-active:-translate-x-0.5 pointer-fine:hover:not-active:-translate-y-0.5 pointer-fine:hover:not-active:shadow-[6px_6px_0_var(--rr-shade)]"
            >
              {ctaLabel}
              <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
            </a>
          </div>

          <ul ref={endRef} className="col-span-12 grid gap-4 sm:grid-cols-3 lg:col-span-7">
            {receipts.map((receipt, index) => (
              <li
                key={receipt.label}
                className="flex flex-col rounded-[min(var(--iu-radius),4px)] border-2 border-(--iu-foreground) bg-(--iu-surface) shadow-[4px_4px_0_var(--rr-shade)]"
              >
                <div className="flex items-center justify-between border-b-2 border-(--iu-foreground) px-[calc(16px*var(--iu-density))] py-2 font-mono text-xs font-bold tracking-[0.08em] uppercase">
                  <span>{receipt.label}</span>
                  <span aria-hidden="true" className="text-(--iu-muted) tabular-nums">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-3 px-[calc(16px*var(--iu-density))] pt-[calc(12px*var(--iu-density))] pb-[calc(16px*var(--iu-density))]">
                  <span className="text-[64px] leading-none font-extrabold tracking-[-0.04em] tabular-nums">
                    {receipt.value}
                  </span>
                  <span className="mt-auto font-mono text-xs leading-snug text-(--iu-muted)">{receipt.detail}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export default RedactionRevealHeadline;
