"use client";

import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { AnimatePresence, MotionConfig, animate, motion, useMotionValue, useReducedMotion } from "motion/react";
import { CircleAlert, Globe, Link2, Lock, Send, UserPlus, X } from "lucide-react";

export type KiteRole = "edit" | "comment" | "view";

export type KitePerson = { name: string; email: string; title?: string; guest?: boolean };

export type KiteMember = KitePerson & { role: KiteRole | "owner"; pending?: boolean };

export type KiteToast = { id: string; text: string; kind: "copy" | "invite" | "info" };

export type KiteShareDialogProps = {
  boardName?: string;
  link?: string;
  directory?: KitePerson[];
  members?: KiteMember[];
  /** People already picked in the invite field. */
  defaultInvitees?: KitePerson[];
  defaultRole?: KiteRole;
  defaultAccess?: "link" | "invited";
  /** Opens the dialog on first render (focus moves in only when a person opens it). */
  defaultOpen?: boolean;
  /** Text already typed into the invite field. */
  defaultQuery?: string;
  /** Forces the invite request state. */
  status?: "idle" | "sending" | "error";
  errorMessage?: string;
  initialToast?: KiteToast | null;
  /** Return a promise to show Sending; reject it to show the error. */
  onInvite?: (people: KitePerson[], role: KiteRole) => void | Promise<void>;
  onCopyLink?: (link: string) => void;
  onAccessChange?: (access: "link" | "invited") => void;
  onOpenChange?: (open: boolean) => void;
  className?: string;
};

const DIRECTORY: KitePerson[] = [
  { name: "Bruno Castellanos", email: "bruno@kitebook.design", title: "Motion designer" },
  { name: "Chiara Benedetti", email: "chiara@lumenfold.studio", title: "Lumenfold Studio", guest: true },
  { name: "Dev Raghunathan", email: "dev@kitebook.design", title: "Brand lead" },
  { name: "Elif Kaya", email: "elif@kitebook.design", title: "Copywriter" },
  { name: "Farah Haddad", email: "farah@northpier.co", title: "Northpier", guest: true },
  { name: "Ivo Lindahl", email: "ivo@kitebook.design", title: "Producer" },
];

const MEMBERS: KiteMember[] = [
  { name: "Noa Feld", email: "noa@kitebook.design", role: "owner" },
  { name: "Amara Osei", email: "amara@kitebook.design", role: "edit" },
  { name: "Tomasz Wrona", email: "tomasz@kitebook.design", role: "comment" },
];

const ROLE_LABEL: Record<KiteRole, string> = { edit: "Can edit", comment: "Can comment", view: "Can view" };
const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* Playful material: 2px ink outlines, chunky offset shadows tinted from the accent, one tint level. */
const MATERIAL = [
  "[--ks-tint:color-mix(in_oklab,var(--iu-accent)_14%,var(--iu-surface))]",
  "[--ks-ink:var(--iu-foreground)]",
  "[--ks-shadow:color-mix(in_oklab,var(--iu-accent)_32%,var(--iu-foreground))]",
  "dark:[--ks-tint:color-mix(in_oklab,var(--iu-accent)_22%,var(--iu-surface))]",
  "dark:[--ks-ink:color-mix(in_oklab,var(--iu-foreground)_80%,var(--iu-surface))]",
  "dark:[--ks-shadow:color-mix(in_oklab,var(--iu-accent)_55%,black)]",
].join(" ");

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--iu-accent)";
const CHUNK =
  "border-2 border-(--ks-ink) shadow-[4px_4px_0_var(--ks-shadow)] transition-[translate,box-shadow] duration-100 ease-linear motion-reduce:transition-none active:translate-x-[3px] active:translate-y-[3px] active:shadow-[1px_1px_0_var(--ks-shadow)]";
const PRIMARY = [
  "inline-flex h-12 items-center justify-center gap-2 rounded-full bg-(--iu-accent) px-6 text-[15px] font-extrabold text-(--iu-accent-foreground)",
  CHUNK,
  "pointer-fine:hover:-translate-y-0.5 pointer-fine:hover:shadow-[5px_6px_0_var(--ks-shadow)] disabled:cursor-not-allowed disabled:opacity-55 disabled:active:translate-0",
  FOCUS,
].join(" ");
const SECONDARY = [
  "inline-flex h-11 items-center justify-center gap-2 rounded-full bg-(--iu-surface) px-5 text-sm font-bold text-(--iu-foreground)",
  CHUNK,
  "pointer-fine:hover:-translate-y-0.5",
  FOCUS,
].join(" ");
const SELECT =
  "h-9 cursor-pointer appearance-auto rounded-full border-2 border-(--iu-foreground)/40 bg-(--iu-surface) pr-2 pl-3 text-[13px] font-bold text-(--iu-foreground) pointer-coarse:h-10 disabled:opacity-60 " +
  FOCUS;

function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function personFromText(text: string): KitePerson | null {
  const email = text.trim().toLowerCase();
  if (!EMAIL.test(email)) return null;
  const local = email.split("@")[0] ?? email;
  const name = local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
  return { name: name || email, email, guest: true };
}

function Avatar({ name, index, size = "md" }: { name: string; index: number; size?: "sm" | "md" }) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        "grid shrink-0 place-items-center rounded-full border-2 border-(--ks-ink) font-extrabold text-(--iu-foreground)",
        size === "sm" ? "size-8 text-[11px]" : "size-10 text-[13px]",
        index % 2 === 0 ? "bg-(--ks-tint)" : "bg-(--iu-surface)",
      )}
    >
      {initials(name)}
    </span>
  );
}

function KiteMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 32 32" className="size-8">
      <path
        d="M16 3 27 14 16 29 5 14Z"
        className="fill-(--iu-accent) stroke-(--ks-ink)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M5 14h22M16 3v26" className="stroke-(--ks-ink)" strokeWidth="2" />
    </svg>
  );
}

/** A sticker toast that waits while hovered or focused, with a fuse that burns down underneath. */
function StickerToast({ toast, onDone }: { toast: KiteToast; onDone: () => void }) {
  const fuse = useMotionValue(1);
  const [paused, setPaused] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (paused) return;
    const controls = animate(fuse, 0, { duration: fuse.get() * 4.2, ease: "linear", onComplete: onDone });
    return () => controls.stop();
  }, [paused, fuse, onDone]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 28, rotate: -8, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, rotate: -2, scale: 1 }}
      exit={{ opacity: 0, y: 16, scale: 0.9, transition: { duration: 0.14 } }}
      transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 400, damping: 16 }}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="pointer-events-auto relative flex items-center gap-3 overflow-hidden rounded-full border-2 border-(--ks-ink) bg-(--iu-surface) py-2 pr-2 pl-2 shadow-[4px_4px_0_var(--ks-shadow)]"
    >
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-(--iu-accent) text-(--iu-accent-foreground)">
        {toast.kind === "copy" ? (
          <Link2 size={16} strokeWidth={2.25} aria-hidden="true" />
        ) : (
          <Send size={15} strokeWidth={2.25} aria-hidden="true" />
        )}
      </span>
      <span className="text-sm font-bold">{toast.text}</span>
      <span className="font-mono text-[11px] font-medium text-(--iu-muted)">{paused ? "paused" : ""}</span>
      <button
        type="button"
        onClick={onDone}
        aria-label="Dismiss notification"
        className={cx(
          "grid size-8 place-items-center rounded-full text-(--iu-muted) pointer-coarse:size-10 pointer-fine:hover:bg-(--iu-foreground)/8 pointer-fine:hover:text-(--iu-foreground)",
          FOCUS,
        )}
      >
        <X size={16} strokeWidth={2} aria-hidden="true" />
      </button>
      <motion.span
        aria-hidden="true"
        style={{ scaleX: fuse }}
        className="absolute inset-x-4 bottom-0 h-[3px] origin-left rounded-full bg-(--iu-accent)"
      />
    </motion.div>
  );
}

export function KiteShareDialog({
  boardName = "Spring launch moodboard",
  link = "kitebook.app/b/spring-launch-7Kq2",
  directory = DIRECTORY,
  members: initialMembers = MEMBERS,
  defaultInvitees = [],
  defaultRole = "comment",
  defaultAccess = "link",
  defaultOpen = false,
  defaultQuery = "",
  status,
  errorMessage = "Invites didn’t go out: Kitebook couldn’t reach the mail service. Nobody was added; try again.",
  initialToast = null,
  onInvite,
  onCopyLink,
  onAccessChange,
  onOpenChange,
  className = "",
}: KiteShareDialogProps) {
  const reduceMotion = useReducedMotion();
  const uid = useId();
  const [open, setOpen] = useState(defaultOpen);
  const [members, setMembers] = useState(initialMembers);
  const [invitees, setInvitees] = useState<KitePerson[]>(defaultInvitees);
  const [query, setQuery] = useState(defaultQuery);
  const [listOpen, setListOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [role, setRole] = useState<KiteRole>(defaultRole);
  const [access, setAccess] = useState(defaultAccess);
  const [phase, setPhase] = useState<"idle" | "sending" | "error">(status ?? "idle");
  const [syncedStatus, setSyncedStatus] = useState(status);
  if (syncedStatus !== status) {
    setSyncedStatus(status);
    setPhase(status ?? "idle");
  }
  const [fieldError, setFieldError] = useState("");
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<KiteToast | null>(initialToast);
  const [announcement, setAnnouncement] = useState("");

  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const movedIn = useRef(false);
  const toastSeq = useRef(0);
  const copyTimer = useRef<number | undefined>(undefined);

  const taken = new Set([...members, ...invitees].map((person) => person.email));
  const needle = query.trim().toLowerCase();
  const suggestions = directory
    .filter((person) => !taken.has(person.email))
    .filter(
      (person) => !needle || person.name.toLowerCase().includes(needle) || person.email.toLowerCase().includes(needle),
    )
    .slice(0, 5);
  const typed = needle && suggestions.length === 0 ? personFromText(needle) : null;
  const options: KitePerson[] = typed && !taken.has(typed.email) ? [typed] : suggestions;
  const expanded = listOpen && options.length > 0;
  const activeIndex = Math.min(active, Math.max(options.length - 1, 0));
  const busy = phase === "sending";

  const showToast = (next: Omit<KiteToast, "id">) => {
    toastSeq.current += 1;
    const id = `${next.kind}-${toastSeq.current}`;
    setToast({ ...next, id });
    setAnnouncement(next.text);
  };
  const clearToast = useCallback(() => setToast(null), []);

  const close = useCallback(() => {
    if (busy) return;
    setOpen(false);
    setListOpen(false);
    onOpenChange?.(false);
    requestAnimationFrame(() => triggerRef.current?.focus());
  }, [busy, onOpenChange]);

  const openDialog = () => {
    movedIn.current = true;
    setOpen(true);
    setPhase("idle");
    onOpenChange?.(true);
  };

  useEffect(() => {
    if (!open || !movedIn.current) return;
    movedIn.current = false;
    const frame = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [open]);

  useEffect(() => () => window.clearTimeout(copyTimer.current), []);

  // Escape closes the suggestions first, then the dialog; Tab stays inside.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      const dialog = dialogRef.current;
      if (!dialog) return;
      if (event.key === "Escape") {
        if (event.defaultPrevented) return;
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== "Tab") return;
      const nodes = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (node) => !(node instanceof HTMLInputElement && node.type === "radio" && !node.checked),
      );
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (!first || !last) return;
      const current = document.activeElement;
      if (!dialog.contains(current)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && current === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && current === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  useEffect(() => {
    if (!open) return;
    const { body, documentElement } = document;
    const gap = window.innerWidth - documentElement.clientWidth;
    const previous = { overflow: body.style.overflow, paddingRight: body.style.paddingRight };
    body.style.overflow = "hidden";
    if (gap > 0) body.style.paddingRight = `${gap}px`;
    return () => {
      body.style.overflow = previous.overflow;
      body.style.paddingRight = previous.paddingRight;
    };
  }, [open]);

  const addPerson = (person: KitePerson) => {
    setInvitees((current) => [...current, person]);
    setQuery("");
    setActive(0);
    setFieldError("");
    if (phase === "error") setPhase("idle");
    setAnnouncement(`${person.name} added.`);
  };

  const removePerson = (person: KitePerson) => {
    setInvitees((current) => current.filter((entry) => entry.email !== person.email));
    setAnnouncement(`${person.name} removed.`);
    inputRef.current?.focus();
  };

  const onInputKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setListOpen(true);
      setActive((index) => (expanded ? (index + 1) % options.length : 0));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setListOpen(true);
      setActive((index) => (index - 1 + options.length) % Math.max(options.length, 1));
    } else if (event.key === "Enter" || event.key === ",") {
      if (!needle && event.key === "Enter") return;
      event.preventDefault();
      const pick = expanded ? options[activeIndex] : personFromText(needle);
      if (pick) addPerson(pick);
      else setFieldError(`“${query.trim()}” isn’t an email address or a teammate.`);
    } else if (event.key === "Escape" && expanded) {
      event.preventDefault();
      setListOpen(false);
    } else if (event.key === "Backspace" && !query && invitees.length > 0) {
      const last = invitees[invitees.length - 1];
      if (last) removePerson(last);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard?.writeText(`${window.location.protocol === "http:" ? "http:" : "https:"}//${link}`);
    } catch {
      // Clipboard can be blocked in embedded frames; the link stays visible and selectable.
    }
    onCopyLink?.(link);
    setCopied(true);
    window.clearTimeout(copyTimer.current);
    copyTimer.current = window.setTimeout(() => setCopied(false), 1800);
    showToast({ kind: "copy", text: access === "link" ? "Link copied. Anyone with it can view." : "Link copied." });
  };

  const send = async () => {
    if (busy) return;
    if (invitees.length === 0) {
      setFieldError("Add at least one person to invite.");
      inputRef.current?.focus();
      return;
    }
    try {
      const result = onInvite?.(invitees, role);
      if (result instanceof Promise) {
        setPhase("sending");
        await result;
      }
      const sent = invitees;
      setMembers((current) => [...current, ...sent.map((person) => ({ ...person, role, pending: true }))]);
      setInvitees([]);
      setPhase("idle");
      showToast({
        kind: "invite",
        text: sent.length === 1 ? `Invite sent to ${sent[0]?.name.split(" ")[0]}` : `${sent.length} invites sent`,
      });
      inputRef.current?.focus();
    } catch {
      setPhase("error");
    }
  };

  const stack = [...members, ...invitees];
  const listId = `${uid}-list`;

  return (
    <MotionConfig
      reducedMotion="user"
      transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 400, damping: 18 }}
    >
      <div
        className={cx(
          "relative min-h-dvh bg-(--iu-background) font-(family-name:--iu-font) text-(--iu-foreground)",
          MATERIAL,
          className,
        )}
      >
        <div inert={open} className="mx-auto flex max-w-[1080px] flex-col gap-8 px-4 pt-6 pb-32 sm:px-8 sm:pt-10">
          <header className="flex items-center justify-between gap-4">
            <span className="inline-flex items-center gap-2.5 text-lg font-extrabold tracking-[-0.02em]">
              <KiteMark />
              Kitebook
            </span>
            <button
              ref={triggerRef}
              type="button"
              aria-haspopup="dialog"
              onClick={openDialog}
              className={cx(SECONDARY, "h-10 px-4")}
            >
              <UserPlus size={16} strokeWidth={2} aria-hidden="true" />
              Share
            </button>
          </header>
          <div>
            <p className="inline-block -rotate-2 rounded-full border-2 border-(--ks-ink) bg-(--ks-tint) px-3 py-0.5 text-[12px] font-extrabold tracking-wide uppercase">
              Board · 38 pins
            </p>
            <h1 className="mt-3 text-[clamp(2rem,1.4rem+2.8vw,3.25rem)] leading-[1.02] font-extrabold tracking-[-0.035em] text-balance">
              {boardName}
            </h1>
          </div>
          <div aria-hidden="true" className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[0, 1, 2, 3].map((tile) => (
              <div
                key={tile}
                className={cx(
                  "relative aspect-[4/5] overflow-hidden rounded-[max(var(--iu-radius),20px)] border-2 border-(--ks-ink)",
                  tile % 2 === 0 ? "bg-(--ks-tint)" : "bg-(--iu-surface)",
                )}
              >
                <svg viewBox="0 0 100 125" className="absolute inset-0 size-full">
                  {tile === 0 ? <circle cx="50" cy="56" r="28" className="fill-(--iu-accent)" /> : null}
                  {tile === 1 ? (
                    <path
                      d="M14 98 50 30l36 68Z"
                      className="fill-(--iu-foreground)/12 stroke-(--ks-ink)"
                      strokeWidth="2"
                    />
                  ) : null}
                  {tile === 2 ? (
                    <rect
                      x="22"
                      y="30"
                      width="56"
                      height="56"
                      rx="14"
                      className="fill-(--iu-surface) stroke-(--ks-ink)"
                      strokeWidth="2"
                      transform="rotate(12 50 58)"
                    />
                  ) : null}
                  {tile === 3 ? (
                    <path
                      d="M10 70c16-22 30-22 40 0s24 22 40 0"
                      className="fill-none stroke-(--iu-accent)"
                      strokeWidth="6"
                      strokeLinecap="round"
                    />
                  ) : null}
                </svg>
              </div>
            ))}
          </div>
        </div>

        <AnimatePresence initial={false}>
          {open ? (
            <div key="dialog" className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
              <motion.div
                aria-hidden="true"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.16 }}
                onClick={close}
                className="absolute inset-0 bg-(--iu-foreground)/30 dark:bg-black/65"
              />
              <motion.div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={`${uid}-title`}
                aria-describedby={`${uid}-desc`}
                initial={{ opacity: 0, y: 40, rotate: -1.5, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
                exit={{ opacity: 0, y: 24, scale: 0.97, transition: { duration: 0.14 } }}
                className="relative flex max-h-[92dvh] w-full flex-col rounded-t-[max(var(--iu-radius),28px)] border-2 border-b-0 border-(--ks-ink) bg-(--iu-surface) sm:max-h-[min(90dvh,780px)] sm:max-w-[560px] sm:rounded-[max(var(--iu-radius),28px)] sm:border-b-2 sm:shadow-[8px_8px_0_var(--ks-shadow)]"
              >
                <span
                  aria-hidden="true"
                  className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-(--iu-foreground)/25 sm:hidden"
                />
                <div className="flex items-start gap-4 px-5 pt-4 sm:px-7 sm:pt-7">
                  <div className="min-w-0 flex-1">
                    <h2 id={`${uid}-title`} className="text-2xl/7 font-extrabold tracking-[-0.03em] text-balance">
                      Share this board
                    </h2>
                    <p id={`${uid}-desc`} className="mt-1 text-sm text-pretty text-(--iu-muted)">
                      Invite people to “{boardName}” or send them the link.
                    </p>
                  </div>
                  <div aria-hidden="true" className="hidden items-center sm:flex">
                    <AnimatePresence initial={false}>
                      {stack.slice(0, 5).map((person, index) => (
                        <motion.span
                          key={person.email}
                          layout
                          initial={{ scale: 0, rotate: -20 }}
                          animate={{ scale: 1, rotate: 0 }}
                          exit={{ scale: 0 }}
                          className={cx("relative", index > 0 && "-ml-3")}
                          style={{ zIndex: 10 - index }}
                        >
                          <Avatar name={person.name} index={index} size="sm" />
                        </motion.span>
                      ))}
                    </AnimatePresence>
                    {stack.length > 5 ? (
                      <span className="-ml-3 grid size-8 place-items-center rounded-full border-2 border-(--ks-ink) bg-(--iu-foreground) text-[11px] font-extrabold text-(--iu-background)">
                        +{stack.length - 5}
                      </span>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={close}
                    disabled={busy}
                    aria-label="Close"
                    className={cx(
                      "-mt-1 -mr-2 grid size-10 shrink-0 place-items-center rounded-full border-2 border-transparent text-(--iu-foreground) disabled:opacity-50 pointer-fine:hover:border-(--ks-ink)",
                      FOCUS,
                    )}
                  >
                    <X size={20} strokeWidth={2} aria-hidden="true" />
                  </button>
                </div>

                <div className="flex [scrollbar-gutter:stable] flex-col gap-[calc(24px*var(--iu-density))] overflow-y-auto px-5 pt-5 pb-6 sm:px-7">
                  <div>
                    <label htmlFor={`${uid}-input`} className="mb-2 block text-sm font-extrabold">
                      Invite people
                    </label>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
                      <div className="relative min-w-0 flex-1">
                        <div
                          onClick={() => inputRef.current?.focus()}
                          className={cx(
                            "flex min-h-12 flex-wrap items-center gap-1.5 rounded-[max(var(--iu-radius),24px)] border-2 bg-(--iu-surface) py-1.5 pr-2 pl-2 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-(--iu-accent)",
                            fieldError ? "border-red-600 dark:border-red-400" : "border-(--ks-ink)",
                          )}
                        >
                          <AnimatePresence initial={false}>
                            {invitees.map((person, index) => (
                              <motion.span
                                key={person.email}
                                layout
                                initial={{ scale: 0.4, opacity: 0, rotate: -6 }}
                                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                                exit={{ scale: 0.4, opacity: 0, transition: { duration: 0.12 } }}
                                className="inline-flex h-8 items-center gap-1.5 rounded-full border-2 border-(--ks-ink) bg-(--ks-tint) pr-1 pl-1 text-[13px] font-bold"
                              >
                                <span
                                  aria-hidden="true"
                                  className="grid size-5 place-items-center rounded-full bg-(--iu-surface) text-[9px] font-extrabold"
                                >
                                  {initials(person.name)}
                                </span>
                                <span className="max-w-[10rem] truncate">{person.name}</span>
                                {person.guest ? (
                                  <span className="text-[11px] font-semibold text-(--iu-muted)">guest</span>
                                ) : null}
                                <button
                                  type="button"
                                  onClick={() => removePerson(person)}
                                  disabled={busy}
                                  aria-label={`Remove ${person.name}`}
                                  className={cx(
                                    "grid size-6 place-items-center rounded-full pointer-fine:hover:bg-(--iu-foreground)/10",
                                    FOCUS,
                                  )}
                                  data-index={index}
                                >
                                  <X size={12} strokeWidth={2.5} aria-hidden="true" />
                                </button>
                              </motion.span>
                            ))}
                          </AnimatePresence>
                          <input
                            ref={inputRef}
                            id={`${uid}-input`}
                            role="combobox"
                            aria-expanded={expanded}
                            aria-controls={listId}
                            aria-autocomplete="list"
                            aria-activedescendant={expanded ? `${listId}-${activeIndex}` : undefined}
                            aria-invalid={fieldError ? true : undefined}
                            aria-describedby={fieldError ? `${uid}-error` : `${uid}-hint`}
                            autoComplete="off"
                            disabled={busy}
                            value={query}
                            placeholder={invitees.length ? "Add another" : "Name or email"}
                            onChange={(event) => {
                              setQuery(event.target.value);
                              setListOpen(true);
                              setActive(0);
                              setFieldError("");
                            }}
                            onFocus={() => setListOpen(true)}
                            onBlur={() => setListOpen(false)}
                            onKeyDown={onInputKeyDown}
                            className="h-8 min-w-[8rem] flex-1 bg-transparent px-2 text-sm font-medium outline-none placeholder:text-(--iu-muted)"
                          />
                        </div>
                        <ul
                          id={listId}
                          role="listbox"
                          aria-label="Suggestions"
                          hidden={!expanded}
                          className="absolute inset-x-0 top-full z-20 mt-2 flex flex-col gap-0.5 rounded-[max(var(--iu-radius),20px)] border-2 border-(--ks-ink) bg-(--iu-surface) p-1.5 shadow-[4px_4px_0_var(--ks-shadow)]"
                        >
                          {options.map((person, index) => (
                            <li
                              key={person.email}
                              id={`${listId}-${index}`}
                              role="option"
                              aria-selected={index === activeIndex}
                              onPointerDown={(event) => event.preventDefault()}
                              onClick={() => addPerson(person)}
                              onPointerMove={() => setActive(index)}
                              className="flex cursor-pointer items-center gap-3 rounded-[max(var(--iu-radius),14px)] px-2 py-1.5 aria-selected:bg-(--ks-tint)"
                            >
                              <Avatar name={person.name} index={index} size="sm" />
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-bold">{person.name}</span>
                                <span className="block truncate text-[12px] text-(--iu-muted)">{person.email}</span>
                              </span>
                              {person.guest ? (
                                <span className="rounded-full border-2 border-(--ks-ink) px-2 text-[11px] font-extrabold">
                                  Guest
                                </span>
                              ) : null}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <select
                        aria-label="Role for new people"
                        value={role}
                        disabled={busy}
                        onChange={(event) => setRole(event.target.value as KiteRole)}
                        className={cx(SELECT, "h-12 self-start border-(--ks-ink) pointer-coarse:h-12")}
                      >
                        {(Object.keys(ROLE_LABEL) as KiteRole[]).map((key) => (
                          <option key={key} value={key}>
                            {ROLE_LABEL[key]}
                          </option>
                        ))}
                      </select>
                    </div>
                    {fieldError ? (
                      <p
                        id={`${uid}-error`}
                        className="mt-2 flex items-start gap-1.5 text-[13px] font-semibold text-red-700 dark:text-red-400"
                      >
                        <CircleAlert size={16} strokeWidth={2} aria-hidden="true" className="shrink-0" />
                        {fieldError}
                      </p>
                    ) : (
                      <p id={`${uid}-hint`} className="mt-2 text-[13px] text-(--iu-muted)">
                        Press Enter or comma to add. Guests outside kitebook.design can comment but not export.
                      </p>
                    )}
                  </div>

                  {phase === "error" ? (
                    <div
                      role="alert"
                      className="flex items-start gap-3 rounded-[max(var(--iu-radius),18px)] border-2 border-red-700 bg-red-600/8 p-3 text-[13px]/5 font-semibold text-red-800 dark:border-red-400 dark:bg-red-400/10 dark:text-red-200"
                    >
                      <CircleAlert size={18} strokeWidth={2} aria-hidden="true" className="shrink-0" />
                      {errorMessage}
                    </div>
                  ) : null}

                  <section aria-labelledby={`${uid}-people`}>
                    <h3 id={`${uid}-people`} className="mb-2 text-sm font-extrabold">
                      People with access{" "}
                      <span className="font-mono text-[12px] font-medium text-(--iu-muted) tabular-nums">
                        {members.length}
                      </span>
                    </h3>
                    <ul className="flex flex-col gap-[calc(8px*var(--iu-density))]">
                      <AnimatePresence initial={false}>
                        {members.map((member, index) => (
                          <motion.li
                            key={member.email}
                            layout
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-3"
                          >
                            <Avatar name={member.name} index={index} />
                            <div className="min-w-0 flex-1">
                              <p className="flex min-w-0 items-center gap-2 text-sm font-bold">
                                <span className="truncate">{member.name}</span>
                                {member.role === "owner" ? (
                                  <span className="shrink-0 font-medium text-(--iu-muted)">(you)</span>
                                ) : null}
                                {member.pending ? (
                                  <span className="shrink-0 rounded-full bg-(--iu-accent) px-2 text-[11px] font-extrabold text-(--iu-accent-foreground)">
                                    Invited
                                  </span>
                                ) : null}
                              </p>
                              <p className="truncate text-[12px] text-(--iu-muted)">{member.email}</p>
                            </div>
                            {member.role === "owner" ? (
                              <span className="pr-3 text-[13px] font-bold text-(--iu-muted)">Owner</span>
                            ) : (
                              <select
                                aria-label={`Access for ${member.name}`}
                                value={member.role}
                                disabled={busy}
                                onChange={(event) => {
                                  const next = event.target.value as KiteRole | "remove";
                                  if (next === "remove") {
                                    setMembers((current) => current.filter((entry) => entry.email !== member.email));
                                    showToast({
                                      kind: "info",
                                      text: `${member.name.split(" ")[0]} removed from the board`,
                                    });
                                    return;
                                  }
                                  setMembers((current) =>
                                    current.map((entry) =>
                                      entry.email === member.email ? { ...entry, role: next } : entry,
                                    ),
                                  );
                                }}
                                className={SELECT}
                              >
                                {(Object.keys(ROLE_LABEL) as KiteRole[]).map((key) => (
                                  <option key={key} value={key}>
                                    {ROLE_LABEL[key]}
                                  </option>
                                ))}
                                <option value="remove">Remove</option>
                              </select>
                            )}
                          </motion.li>
                        ))}
                      </AnimatePresence>
                    </ul>
                  </section>

                  <fieldset disabled={busy}>
                    <legend className="mb-2 text-sm font-extrabold">General access</legend>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {(
                        [
                          { value: "link", title: "Anyone with the link", body: "Can view, no sign-in", Icon: Globe },
                          { value: "invited", title: "Only invited people", body: "Link asks to sign in", Icon: Lock },
                        ] as const
                      ).map(({ value, title, body, Icon }) => (
                        <label
                          key={value}
                          className="flex cursor-pointer items-center gap-3 rounded-[max(var(--iu-radius),18px)] border-2 border-(--iu-foreground)/30 p-3 transition-[translate,box-shadow,border-color] duration-100 ease-linear has-checked:border-(--ks-ink) has-checked:bg-(--ks-tint) has-checked:shadow-[3px_3px_0_var(--ks-shadow)] has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-(--iu-accent) motion-reduce:transition-none"
                        >
                          <input
                            type="radio"
                            name={`${uid}-access`}
                            value={value}
                            checked={access === value}
                            onChange={() => {
                              setAccess(value);
                              onAccessChange?.(value);
                            }}
                            className="sr-only"
                          />
                          <span className="grid size-9 shrink-0 place-items-center rounded-full border-2 border-(--ks-ink) bg-(--iu-surface)">
                            <Icon size={16} strokeWidth={2} aria-hidden="true" />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-sm font-bold">{title}</span>
                            <span className="block text-[12px] text-(--iu-muted)">{body}</span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  <div className="flex items-center gap-2 rounded-full border-2 border-dashed border-(--iu-foreground)/40 py-1.5 pr-1.5 pl-4">
                    <Link2 size={16} strokeWidth={2} aria-hidden="true" className="shrink-0 text-(--iu-muted)" />
                    <span className="min-w-0 flex-1 truncate font-mono text-[13px]">{link}</span>
                    <button
                      type="button"
                      onClick={copyLink}
                      aria-label={copied ? "Link copied" : "Copy link"}
                      className={cx(SECONDARY, "relative h-10 min-w-[7.5rem] shrink-0 px-4")}
                    >
                      <AnimatePresence initial={false} mode="popLayout">
                        {copied ? (
                          <motion.span
                            key="done"
                            initial={{ scale: 0.6, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.6, opacity: 0 }}
                            className="inline-flex items-center gap-1.5"
                          >
                            <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4">
                              <motion.path
                                d="M4 12.5 9.5 18 20 6"
                                fill="none"
                                className="stroke-current"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                initial={{ pathLength: reduceMotion ? 1 : 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: reduceMotion ? 0 : 0.28, ease: "easeOut" }}
                              />
                            </svg>
                            Copied
                          </motion.span>
                        ) : (
                          <motion.span
                            key="copy"
                            initial={{ scale: 0.6, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.6, opacity: 0 }}
                          >
                            Copy link
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </button>
                  </div>
                </div>

                <div className="flex flex-col-reverse gap-3 border-t-2 border-(--ks-ink) px-5 pt-4 pb-[max(20px,env(safe-area-inset-bottom))] sm:flex-row sm:items-center sm:justify-between sm:px-7 sm:pb-6">
                  <p className="text-[13px] text-(--iu-muted)">
                    <span className="font-bold text-(--iu-foreground) tabular-nums">{members.length}</span> people ·{" "}
                    {access === "link" ? "link on" : "link off"}
                  </p>
                  <button type="button" onClick={send} disabled={busy} className={cx(PRIMARY, "inline-grid")}>
                    <span
                      aria-hidden={busy}
                      className={cx("col-start-1 row-start-1 inline-flex items-center gap-2", busy && "invisible")}
                    >
                      <Send size={16} strokeWidth={2.25} aria-hidden="true" />
                      {phase === "error"
                        ? "Try again"
                        : invitees.length > 1
                          ? `Invite ${invitees.length} people`
                          : "Send invite"}
                    </span>
                    <span
                      aria-hidden={!busy}
                      className={cx(
                        "col-start-1 row-start-1 inline-flex items-center justify-center gap-1",
                        !busy && "invisible",
                      )}
                    >
                      Sending
                      <span aria-hidden="true" className="inline-flex gap-0.5">
                        {[0, 1, 2].map((dot) => (
                          <span
                            key={dot}
                            className="size-1.5 animate-bounce rounded-full bg-current motion-reduce:animate-none"
                            style={{ animationDelay: `${dot * 120}ms` }}
                          />
                        ))}
                      </span>
                    </span>
                  </button>
                </div>
              </motion.div>
            </div>
          ) : null}
        </AnimatePresence>

        <div className="pointer-events-none fixed inset-x-4 top-4 z-[60] flex justify-center sm:top-6">
          <AnimatePresence initial={false}>
            {toast ? <StickerToast key={toast.id} toast={toast} onDone={clearToast} /> : null}
          </AnimatePresence>
        </div>
        <p role="status" className="sr-only">
          {announcement}
        </p>
      </div>
    </MotionConfig>
  );
}

export default KiteShareDialog;
