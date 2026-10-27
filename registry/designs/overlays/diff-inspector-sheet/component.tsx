"use client";

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "motion/react";
import { Check, CircleAlert, X } from "lucide-react";

export type DiffTerms = "15" | "30" | "45" | "60";
export type DiffCurrency = "GBP" | "EUR" | "USD";

export type DiffSupplierValues = {
  legalName: string;
  email: string;
  terms: DiffTerms;
  currency: DiffCurrency;
  /** Whole units, digits only. */
  creditLimit: string;
  holdAboveLimit: boolean;
};

export type DiffSupplier = {
  id: string;
  code: string;
  city: string;
  since: string;
  spendYtd: number;
  status: "active" | "hold";
  values: DiffSupplierValues;
};

export type DiffInspectorSheetProps = {
  title?: string;
  suppliers?: DiffSupplier[];
  /** Opens the inspector for this supplier on first render (focus moves in only when a person opens it). */
  defaultOpenId?: string | null;
  /** Unsaved edits already in the form when it first opens. */
  defaultEdits?: Partial<DiffSupplierValues>;
  /** Forces the save state, for loading, error and success screens. */
  status?: "idle" | "saving" | "error" | "saved";
  errorMessage?: string;
  savedAt?: string;
  approvalLimit?: number;
  /** Return a promise to show Saving; reject it to keep the edits and show the error. */
  onSave?: (id: string, values: DiffSupplierValues) => void | Promise<void>;
  onDiscard?: (id: string) => void;
  onOpenChange?: (open: boolean) => void;
  className?: string;
};

export const DIFF_SUPPLIERS: DiffSupplier[] = [
  {
    id: "sup-0418",
    code: "SUP-0418",
    city: "Leeds, UK",
    since: "Mar 2023",
    spendYtd: 182410,
    status: "active",
    values: {
      legalName: "Brightwater Textiles Ltd",
      email: "ap@brightwater-textiles.co.uk",
      terms: "30",
      currency: "GBP",
      creditLimit: "40000",
      holdAboveLimit: true,
    },
  },
  {
    id: "sup-0377",
    code: "SUP-0377",
    city: "Lagos, NG",
    since: "Aug 2022",
    spendYtd: 64902,
    status: "active",
    values: {
      legalName: "Okonkwo Packaging Ltd",
      email: "accounts@okonkwopack.ng",
      terms: "45",
      currency: "USD",
      creditLimit: "25000",
      holdAboveLimit: false,
    },
  },
  {
    id: "sup-0352",
    code: "SUP-0352",
    city: "Bergen, NO",
    since: "Jan 2022",
    spendYtd: 231775,
    status: "hold",
    values: {
      legalName: "Halvorsen Freight AS",
      email: "faktura@halvorsenfreight.no",
      terms: "15",
      currency: "EUR",
      creditLimit: "120000",
      holdAboveLimit: true,
    },
  },
  {
    id: "sup-0441",
    code: "SUP-0441",
    city: "Lyon, FR",
    since: "Jun 2024",
    spendYtd: 48130,
    status: "active",
    values: {
      legalName: "Mirelle Dyeworks SAS",
      email: "compta@mirelle-dyeworks.fr",
      terms: "60",
      currency: "EUR",
      creditLimit: "30000",
      holdAboveLimit: false,
    },
  },
  {
    id: "sup-0459",
    code: "SUP-0459",
    city: "Osaka, JP",
    since: "Feb 2025",
    spendYtd: 97066,
    status: "active",
    values: {
      legalName: "Tanaka Thread Co.",
      email: "billing@tanakathread.jp",
      terms: "30",
      currency: "USD",
      creditLimit: "60000",
      holdAboveLimit: true,
    },
  },
];

const TERMS: DiffTerms[] = ["15", "30", "45", "60"];
const CURRENCIES: { code: DiffCurrency; symbol: string; name: string }[] = [
  { code: "GBP", symbol: "£", name: "Pound sterling" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "USD", symbol: "$", name: "US dollar" },
];
const FIELD_ORDER: (keyof DiffSupplierValues)[] = [
  "legalName",
  "email",
  "terms",
  "currency",
  "creditLimit",
  "holdAboveLimit",
];
const FIELD_LABEL: Record<keyof DiffSupplierValues, string> = {
  legalName: "Legal name",
  email: "Accounts payable email",
  terms: "Payment terms",
  currency: "Currency",
  creditLimit: "Credit limit",
  holdAboveLimit: "Hold orders above limit",
};

const FIELD_INDEX: Record<keyof DiffSupplierValues, string> = {
  legalName: "1.1",
  email: "1.2",
  terms: "2.1",
  currency: "2.2",
  creditLimit: "3.1",
  holdAboveLimit: "3.2",
};

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--iu-accent)";
const LABEL = "text-[11px] font-medium tracking-[0.08em] text-(--iu-muted) uppercase";
const INPUT = [
  "h-[max(40px,calc(40px*var(--iu-density)))] w-full rounded-[min(var(--iu-radius),6px)] border border-(--iu-foreground)/35 bg-(--iu-surface) px-3 text-sm text-(--iu-foreground)",
  "transition-colors duration-150 motion-reduce:transition-none pointer-fine:hover:border-(--iu-foreground)/60",
  "aria-invalid:border-red-600 dark:aria-invalid:border-red-400 disabled:opacity-60",
  FOCUS,
].join(" ");
const BUTTON = [
  "inline-flex h-10 items-center justify-center rounded-[min(var(--iu-radius),6px)] px-4 text-sm font-medium",
  "transition-colors duration-150 motion-reduce:transition-none disabled:opacity-60",
  FOCUS,
].join(" ");
const PRIMARY = `${BUTTON} bg-(--iu-foreground) text-(--iu-background) pointer-fine:hover:bg-[color-mix(in_oklab,var(--iu-foreground)_84%,var(--iu-background))]`;
const SECONDARY = `${BUTTON} border border-(--iu-foreground)/35 text-(--iu-foreground) pointer-fine:hover:bg-(--iu-foreground)/5`;

function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

function money(value: number | string, currency: DiffCurrency = "GBP") {
  const amount = typeof value === "number" ? value : Number(value || 0);
  const symbol = CURRENCIES.find((entry) => entry.code === currency)?.symbol ?? "";
  return `${symbol}${amount.toLocaleString("en-GB")}`;
}

function display(key: keyof DiffSupplierValues, values: DiffSupplierValues) {
  const value = values[key];
  if (key === "terms") return `Net ${String(value)}`;
  if (key === "creditLimit") return money(String(value), values.currency);
  if (key === "holdAboveLimit") return value ? "On" : "Off";
  return String(value);
}

function validate(values: DiffSupplierValues, approvalLimit: number) {
  const errors: Partial<Record<keyof DiffSupplierValues, string>> = {};
  if (!values.legalName.trim()) errors.legalName = "Enter the supplier’s registered name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()))
    errors.email = "Use a full address, like ap@brightwater-textiles.co.uk.";
  const limit = Number(values.creditLimit || 0);
  if (!values.creditLimit) errors.creditLimit = "Enter a limit, or 0 for prepaid only.";
  else if (limit > approvalLimit)
    errors.creditLimit = `Limits above ${money(approvalLimit, values.currency)} need finance approval.`;
  return errors;
}

function useSmallScreen() {
  const [small, setSmall] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 639px)");
    const update = () => setSmall(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return small;
}

/** A field row whose left gutter carries the change marker and whose label carries the previous value. */
function Field({
  index,
  label,
  htmlFor,
  changed,
  was,
  error,
  errorId,
  children,
}: {
  index: string;
  label: string;
  htmlFor?: string;
  changed: boolean;
  was: string;
  error?: string;
  errorId: string;
  children: ReactNode;
}) {
  return (
    <div className="relative grid grid-cols-[28px_1fr] gap-x-3 py-[calc(14px*var(--iu-density))]">
      <span
        aria-hidden="true"
        className={cx(
          "absolute top-[calc(14px*var(--iu-density))] bottom-[calc(14px*var(--iu-density))] -left-6 w-0.5 origin-top bg-(--iu-accent) transition-[scale] duration-200 ease-out motion-reduce:transition-none sm:-left-8",
          changed ? "scale-y-100" : "scale-y-0",
        )}
      />
      <span
        aria-hidden="true"
        className={cx(
          "pt-px font-mono text-[11px] tabular-nums transition-colors duration-150 motion-reduce:transition-none",
          changed ? "text-(--iu-foreground)" : "text-(--iu-muted)",
        )}
      >
        {index}
      </span>
      <div className="min-w-0">
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          {htmlFor ? (
            <label htmlFor={htmlFor} className="text-sm font-medium">
              {label}
            </label>
          ) : (
            <span className="text-sm font-medium">{label}</span>
          )}
          <AnimatePresence initial={false}>
            {changed ? (
              <motion.span
                key="was"
                initial={{ opacity: 0, y: 2 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="max-w-full truncate font-mono text-[11px] text-(--iu-muted)"
              >
                was <span className="line-through decoration-1">{was}</span>
              </motion.span>
            ) : null}
          </AnimatePresence>
        </div>
        {children}
        {error ? (
          <p id={errorId} className="mt-2 flex items-start gap-1.5 text-[13px]/5 text-red-700 dark:text-red-400">
            <CircleAlert size={14} strokeWidth={1.75} aria-hidden="true" className="mt-[3px] shrink-0" />
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function DiffInspectorSheet({
  title = "Suppliers",
  suppliers: initialSuppliers = DIFF_SUPPLIERS,
  defaultOpenId = null,
  defaultEdits,
  status,
  errorMessage = "Couldn’t save. The ledger didn’t answer within 10 seconds; your edits are still here.",
  savedAt = "14:32",
  approvalLimit = 250000,
  onSave,
  onDiscard,
  onOpenChange,
  className = "",
}: DiffInspectorSheetProps) {
  const reduceMotion = useReducedMotion();
  const small = useSmallScreen();
  const uid = useId();
  const titleId = `${uid}-title`;

  const [suppliers, setSuppliers] = useState(initialSuppliers);
  const [openId, setOpenId] = useState<string | null>(defaultOpenId);
  const opened = suppliers.find((supplier) => supplier.id === openId) ?? null;
  const [values, setValues] = useState<DiffSupplierValues | null>(() =>
    opened ? { ...opened.values, ...defaultEdits } : null,
  );
  const [phase, setPhase] = useState<"idle" | "saving" | "error" | "saved">(status ?? "idle");
  const [syncedStatus, setSyncedStatus] = useState(status);
  if (syncedStatus !== status) {
    setSyncedStatus(status);
    setPhase(status ?? "idle");
  }
  const [showErrors, setShowErrors] = useState(status === "error");
  const [confirming, setConfirming] = useState(false);
  const [lastSaved, setLastSaved] = useState(status === "saved" ? savedAt : "");
  const [announcement, setAnnouncement] = useState("");

  const panelRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const keepEditingRef = useRef<HTMLButtonElement>(null);
  const triggers = useRef<Record<string, HTMLButtonElement | null>>({});
  const returnTo = useRef<HTMLElement | null>(null);
  const movedIn = useRef(false);

  const original = opened?.values ?? null;
  const changes = values && original ? FIELD_ORDER.filter((key) => values[key] !== original[key]) : [];
  const errors = values ? validate(values, approvalLimit) : {};
  const visibleErrors = showErrors ? errors : {};
  const open = opened !== null && values !== null;

  const finishClose = useCallback(() => {
    const target = returnTo.current ?? (openId ? triggers.current[openId] : null);
    setOpenId(null);
    setValues(null);
    setConfirming(false);
    setShowErrors(false);
    onOpenChange?.(false);
    returnTo.current = null;
    requestAnimationFrame(() => target?.focus());
  }, [onOpenChange, openId]);

  const requestClose = useCallback(() => {
    if (phase === "saving") return;
    if (changes.length > 0) {
      setConfirming(true);
      requestAnimationFrame(() => keepEditingRef.current?.focus());
      return;
    }
    finishClose();
  }, [changes.length, finishClose, phase]);

  const openSupplier = (supplier: DiffSupplier, trigger: HTMLElement) => {
    returnTo.current = trigger;
    movedIn.current = true;
    setOpenId(supplier.id);
    setValues({ ...supplier.values });
    setPhase("idle");
    setShowErrors(false);
    setConfirming(false);
    setLastSaved("");
    onOpenChange?.(true);
  };

  const save = useCallback(async () => {
    if (!opened || !values || phase === "saving" || changes.length === 0) return;
    if (Object.keys(validate(values, approvalLimit)).length > 0) {
      setShowErrors(true);
      const firstInvalid = FIELD_ORDER.find((key) => key in validate(values, approvalLimit));
      requestAnimationFrame(() => panelRef.current?.querySelector<HTMLElement>(`[name="${firstInvalid}"]`)?.focus());
      setAnnouncement("Fix the highlighted fields to save.");
      return;
    }
    try {
      const result = onSave?.(opened.id, values);
      if (result instanceof Promise) {
        setPhase("saving");
        await result;
      }
      const count = changes.length;
      setSuppliers((current) =>
        current.map((supplier) => (supplier.id === opened.id ? { ...supplier, values: { ...values } } : supplier)),
      );
      setPhase("saved");
      setLastSaved(savedAt);
      setConfirming(false);
      setAnnouncement(`Saved ${count} ${count === 1 ? "change" : "changes"} to ${values.legalName}.`);
    } catch {
      setPhase("error");
    }
  }, [approvalLimit, changes.length, onSave, opened, phase, savedAt, values]);

  useEffect(() => {
    if (!open || !movedIn.current) return;
    movedIn.current = false;
    const frame = requestAnimationFrame(() => firstFieldRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [open]);

  // Escape asks before discarding; Tab stays inside; Cmd/Ctrl+S saves.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      const panel = panelRef.current;
      if (!panel) return;
      if (event.key === "Escape") {
        event.preventDefault();
        if (confirming) {
          setConfirming(false);
          requestAnimationFrame(() => firstFieldRef.current?.focus());
        } else requestClose();
        return;
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void save();
        return;
      }
      if (event.key !== "Tab") return;
      const nodes = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (node) => !(node instanceof HTMLInputElement && node.type === "radio" && !node.checked),
      );
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (!first || !last) return;
      const active = document.activeElement;
      if (!panel.contains(active)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, confirming, requestClose, save]);

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

  const update = <K extends keyof DiffSupplierValues>(key: K, value: DiffSupplierValues[K]) => {
    setValues((current) => (current ? { ...current, [key]: value } : current));
    if (phase === "saved" || phase === "error") setPhase("idle");
    setConfirming(false);
  };

  const revert = () => {
    if (!original) return;
    setValues({ ...original });
    setShowErrors(false);
    setPhase("idle");
    setAnnouncement("All changes reverted.");
    requestAnimationFrame(() => firstFieldRef.current?.focus());
  };

  const discard = () => {
    if (openId) onDiscard?.(openId);
    finishClose();
  };

  const busy = phase === "saving";
  const currency = CURRENCIES.find((entry) => entry.code === values?.currency) ?? CURRENCIES[0]!;
  const describedBy = (key: keyof DiffSupplierValues) => (visibleErrors[key] ? `${uid}-${key}-error` : undefined);
  const changeCount = String(changes.length).padStart(2, "0");

  return (
    <MotionConfig
      reducedMotion="user"
      transition={reduceMotion ? { duration: 0 } : { duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <div
        className={cx(
          "relative min-h-dvh bg-(--iu-background) font-(family-name:--iu-font) text-(--iu-foreground)",
          className,
        )}
      >
        <div inert={open} className="mx-auto max-w-[1200px] px-4 pt-8 pb-24 sm:px-10 sm:pt-12">
          <div className="flex items-baseline justify-between border-b border-(--iu-border) pb-3">
            <span className={LABEL}>Quayside procurement</span>
            <span className={cx(LABEL, "tabular-nums")}>{suppliers.length} records</span>
          </div>
          <h1 className="mt-10 text-[clamp(2.25rem,1.6rem+2.6vw,3.5rem)] leading-none font-semibold tracking-[-0.035em]">
            {title}
          </h1>
          <div className="mt-8 border-t border-(--iu-foreground)">
            <table className="w-full table-fixed text-left text-sm">
              <caption className="sr-only">Suppliers and their payment terms</caption>
              <thead>
                <tr className={LABEL}>
                  <th scope="col" className="w-[52%] py-3 pr-3 font-medium sm:w-[40%]">
                    Supplier
                  </th>
                  <th scope="col" className="hidden py-3 pr-3 font-medium sm:table-cell">
                    Code
                  </th>
                  <th scope="col" className="py-3 pr-3 font-medium">
                    Terms
                  </th>
                  <th scope="col" className="hidden py-3 pr-3 text-right font-medium md:table-cell">
                    Spend YTD
                  </th>
                  <th scope="col" className="hidden py-3 font-medium md:table-cell md:pl-6">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map((supplier) => {
                  const selected = supplier.id === openId;
                  return (
                    <tr
                      key={supplier.id}
                      className={cx(
                        "border-t border-(--iu-border)",
                        selected && "bg-(--iu-foreground)/[0.04] dark:bg-(--iu-foreground)/[0.06]",
                      )}
                    >
                      <td className="py-[calc(14px*var(--iu-density))] pr-3">
                        <button
                          ref={(node) => {
                            triggers.current[supplier.id] = node;
                          }}
                          type="button"
                          aria-haspopup="dialog"
                          onClick={(event) => openSupplier(supplier, event.currentTarget)}
                          className={cx(
                            "-mx-1 block max-w-full truncate rounded-[min(var(--iu-radius),4px)] px-1 text-left font-medium underline-offset-4 pointer-coarse:min-h-10 pointer-fine:hover:underline",
                            FOCUS,
                          )}
                        >
                          {supplier.values.legalName}
                        </button>
                        <span className="block text-[13px] text-(--iu-muted)">{supplier.city}</span>
                      </td>
                      <td className="hidden py-[calc(14px*var(--iu-density))] pr-3 font-mono text-[13px] text-(--iu-muted) sm:table-cell">
                        {supplier.code}
                      </td>
                      <td className="py-[calc(14px*var(--iu-density))] pr-3 tabular-nums">
                        Net {supplier.values.terms}
                      </td>
                      <td className="hidden py-[calc(14px*var(--iu-density))] pr-3 text-right font-mono text-[13px] tabular-nums md:table-cell">
                        {money(supplier.spendYtd, supplier.values.currency)}
                      </td>
                      <td className="hidden py-[calc(14px*var(--iu-density))] md:table-cell md:pl-6">
                        <span className="inline-flex items-center gap-2">
                          <span
                            aria-hidden="true"
                            className={cx(
                              "size-1.5 rounded-full",
                              supplier.status === "active" ? "bg-(--iu-foreground)" : "bg-amber-600 dark:bg-amber-400",
                            )}
                          />
                          {supplier.status === "active" ? "Active" : "On hold"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {opened && values && original ? (
            <div key="sheet" className="fixed inset-0 z-50 flex items-end sm:items-stretch sm:justify-end">
              <motion.div
                aria-hidden="true"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={requestClose}
                className="absolute inset-0 bg-black/25 dark:bg-black/60"
              />
              <motion.div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                initial={small ? { opacity: 0, y: 4 } : { opacity: 0, x: 4 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                exit={small ? { opacity: 0, y: 4 } : { opacity: 0, x: 4 }}
                className="relative flex max-h-[90dvh] w-full flex-col border-t border-(--iu-foreground) bg-(--iu-surface) sm:max-h-none sm:w-[520px] sm:border-t-0 sm:border-l dark:border-(--iu-foreground)/40"
              >
                <header className="flex items-start gap-4 border-b border-(--iu-border) px-6 pt-5 pb-5 sm:px-8 sm:pt-8">
                  <div className="min-w-0 flex-1">
                    <p className={cx(LABEL, "font-mono tracking-[0.04em]")}>{opened.code}</p>
                    <h2 id={titleId} className="mt-2 truncate text-2xl leading-tight font-semibold tracking-[-0.025em]">
                      {original.legalName}
                    </h2>
                    <p className="mt-1 text-[13px] text-(--iu-muted)">
                      {opened.city} · supplier since {opened.since}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={requestClose}
                    disabled={busy}
                    aria-label="Close inspector"
                    className={cx(
                      "-mt-1 -mr-2 grid size-10 shrink-0 place-items-center rounded-[min(var(--iu-radius),6px)] text-(--iu-muted) transition-colors duration-150 motion-reduce:transition-none pointer-fine:hover:bg-(--iu-foreground)/6 pointer-fine:hover:text-(--iu-foreground)",
                      FOCUS,
                    )}
                  >
                    <X size={18} strokeWidth={1.5} aria-hidden="true" />
                  </button>
                </header>

                <form
                  noValidate
                  inert={confirming}
                  onSubmit={(event) => {
                    event.preventDefault();
                    void save();
                  }}
                  aria-label={`${original.legalName} details`}
                  aria-busy={busy}
                  tabIndex={busy ? 0 : undefined}
                  className={cx(
                    "flex-1 [scrollbar-gutter:stable] overflow-y-auto px-6 outline-offset-[-2px] focus-visible:outline-2 focus-visible:outline-(--iu-accent) sm:px-8",
                  )}
                  id={`${uid}-form`}
                >
                  <fieldset disabled={busy} className="py-4">
                    <legend className={cx(LABEL, "float-left w-full pt-2")}>01 Identity</legend>
                    <div className="clear-both divide-y divide-(--iu-border)">
                      <Field
                        index="1.1"
                        label={FIELD_LABEL.legalName}
                        htmlFor={`${uid}-legalName`}
                        changed={values.legalName !== original.legalName}
                        was={display("legalName", original)}
                        error={visibleErrors.legalName}
                        errorId={`${uid}-legalName-error`}
                      >
                        <input
                          ref={firstFieldRef}
                          id={`${uid}-legalName`}
                          name="legalName"
                          value={values.legalName}
                          onChange={(event) => update("legalName", event.target.value)}
                          aria-invalid={visibleErrors.legalName ? true : undefined}
                          aria-describedby={describedBy("legalName")}
                          autoComplete="organization"
                          className={INPUT}
                        />
                      </Field>
                      <Field
                        index="1.2"
                        label={FIELD_LABEL.email}
                        htmlFor={`${uid}-email`}
                        changed={values.email !== original.email}
                        was={display("email", original)}
                        error={visibleErrors.email}
                        errorId={`${uid}-email-error`}
                      >
                        <input
                          id={`${uid}-email`}
                          name="email"
                          type="email"
                          value={values.email}
                          onChange={(event) => update("email", event.target.value)}
                          onBlur={() => errors.email && setShowErrors(true)}
                          aria-invalid={visibleErrors.email ? true : undefined}
                          aria-describedby={describedBy("email")}
                          autoComplete="email"
                          className={cx(INPUT, "font-mono text-[13px]")}
                        />
                      </Field>
                    </div>
                  </fieldset>

                  <fieldset disabled={busy} className="border-t border-(--iu-foreground)/80 py-4">
                    <legend className={cx(LABEL, "float-left w-full pt-4")}>02 Billing</legend>
                    <div className="clear-both divide-y divide-(--iu-border)">
                      <Field
                        index="2.1"
                        label={FIELD_LABEL.terms}
                        changed={values.terms !== original.terms}
                        was={display("terms", original)}
                        errorId={`${uid}-terms-error`}
                      >
                        <div
                          role="radiogroup"
                          aria-label={FIELD_LABEL.terms}
                          className="grid grid-cols-4 border border-(--iu-foreground)/35"
                        >
                          {TERMS.map((term, index) => (
                            <label
                              key={term}
                              className={cx(
                                "relative flex h-[max(40px,calc(40px*var(--iu-density)))] cursor-pointer items-center justify-center text-sm tabular-nums transition-colors duration-150 motion-reduce:transition-none",
                                "has-checked:bg-(--iu-foreground) has-checked:text-(--iu-background) pointer-fine:hover:bg-(--iu-foreground)/5 pointer-fine:has-checked:hover:bg-(--iu-foreground)",
                                "has-focus-visible:z-10 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-(--iu-accent)",
                                index > 0 && "border-l border-(--iu-foreground)/35",
                              )}
                            >
                              <input
                                type="radio"
                                name="terms"
                                value={term}
                                checked={values.terms === term}
                                onChange={() => update("terms", term)}
                                className="sr-only"
                              />
                              Net {term}
                            </label>
                          ))}
                        </div>
                      </Field>
                      <Field
                        index="2.2"
                        label={FIELD_LABEL.currency}
                        htmlFor={`${uid}-currency`}
                        changed={values.currency !== original.currency}
                        was={display("currency", original)}
                        errorId={`${uid}-currency-error`}
                      >
                        <select
                          id={`${uid}-currency`}
                          name="currency"
                          value={values.currency}
                          onChange={(event) => update("currency", event.target.value as DiffCurrency)}
                          className={cx(INPUT, "appearance-auto")}
                        >
                          {CURRENCIES.map((entry) => (
                            <option key={entry.code} value={entry.code}>
                              {entry.code} · {entry.name}
                            </option>
                          ))}
                        </select>
                      </Field>
                    </div>
                  </fieldset>

                  <fieldset disabled={busy} className="border-t border-(--iu-foreground)/80 py-4">
                    <legend className={cx(LABEL, "float-left w-full pt-4")}>03 Limits</legend>
                    <div className="clear-both divide-y divide-(--iu-border)">
                      <Field
                        index="3.1"
                        label={FIELD_LABEL.creditLimit}
                        htmlFor={`${uid}-creditLimit`}
                        changed={values.creditLimit !== original.creditLimit}
                        was={display("creditLimit", original)}
                        error={visibleErrors.creditLimit}
                        errorId={`${uid}-creditLimit-error`}
                      >
                        <div className="relative">
                          <span
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-(--iu-muted)"
                          >
                            {currency.symbol}
                          </span>
                          <input
                            id={`${uid}-creditLimit`}
                            name="creditLimit"
                            inputMode="numeric"
                            value={Number(values.creditLimit || 0).toLocaleString("en-GB")}
                            onChange={(event) => update("creditLimit", event.target.value.replace(/\D/g, ""))}
                            onBlur={() => errors.creditLimit && setShowErrors(true)}
                            aria-invalid={visibleErrors.creditLimit ? true : undefined}
                            aria-describedby={cx(`${uid}-limit-help`, describedBy("creditLimit")) || undefined}
                            className={cx(INPUT, "pl-7 font-mono tabular-nums")}
                          />
                        </div>
                        {!visibleErrors.creditLimit ? (
                          <p id={`${uid}-limit-help`} className="mt-2 text-[13px] text-(--iu-muted)">
                            Finance approves anything above {money(approvalLimit, values.currency)}.
                          </p>
                        ) : null}
                      </Field>
                      <Field
                        index="3.2"
                        label={FIELD_LABEL.holdAboveLimit}
                        changed={values.holdAboveLimit !== original.holdAboveLimit}
                        was={display("holdAboveLimit", original)}
                        errorId={`${uid}-hold-error`}
                      >
                        <label className="flex cursor-pointer items-start gap-3 text-[13px] text-(--iu-muted)">
                          <span className="relative mt-px grid size-5 shrink-0 place-items-center">
                            <input
                              type="checkbox"
                              name="holdAboveLimit"
                              checked={values.holdAboveLimit}
                              onChange={(event) => update("holdAboveLimit", event.target.checked)}
                              className={cx(
                                "peer absolute inset-0 cursor-pointer appearance-none rounded-[min(var(--iu-radius),3px)] border border-(--iu-foreground)/50 bg-(--iu-surface) checked:border-(--iu-foreground) checked:bg-(--iu-foreground)",
                                FOCUS,
                              )}
                            />
                            <Check
                              size={14}
                              strokeWidth={2.25}
                              aria-hidden="true"
                              className="pointer-events-none relative text-(--iu-background) opacity-0 peer-checked:opacity-100"
                            />
                          </span>
                          New purchase orders that would push spend past the credit limit wait for approval.
                        </label>
                      </Field>
                    </div>
                  </fieldset>
                </form>

                {phase === "error" ? (
                  <div
                    role="alert"
                    className="mx-6 mb-3 flex items-start gap-2 border-l-2 border-red-600 bg-red-600/6 px-3 py-2.5 text-[13px]/5 text-red-800 sm:mx-8 dark:border-red-400 dark:bg-red-400/10 dark:text-red-200"
                  >
                    <CircleAlert size={16} strokeWidth={1.5} aria-hidden="true" className="mt-0.5 shrink-0" />
                    {errorMessage}
                  </div>
                ) : null}

                <footer className="border-t border-(--iu-foreground) px-6 pt-4 pb-[max(16px,env(safe-area-inset-bottom))] sm:px-8 sm:pb-6 dark:border-(--iu-foreground)/40">
                  {confirming ? (
                    <div
                      role="alertdialog"
                      aria-modal="false"
                      aria-labelledby={`${uid}-confirm`}
                      className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <p id={`${uid}-confirm`} className="text-sm text-pretty">
                        <span className="font-semibold">
                          Discard {changes.length} {changes.length === 1 ? "change" : "changes"}?
                        </span>{" "}
                        <span className="text-(--iu-muted)">They haven’t been saved.</span>
                      </p>
                      <div className="flex gap-2">
                        <button
                          ref={keepEditingRef}
                          type="button"
                          onClick={() => {
                            setConfirming(false);
                            requestAnimationFrame(() => firstFieldRef.current?.focus());
                          }}
                          className={cx(SECONDARY, "flex-1 sm:flex-none")}
                        >
                          Keep editing
                        </button>
                        <button
                          type="button"
                          onClick={discard}
                          className={cx(
                            BUTTON,
                            "flex-1 bg-red-700 text-white sm:flex-none dark:bg-red-500 dark:text-black pointer-fine:hover:bg-red-800 dark:pointer-fine:hover:bg-red-400",
                          )}
                        >
                          Discard
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-3">
                        {phase === "saved" && changes.length === 0 ? (
                          <p className="flex items-center gap-2 text-sm">
                            <Check size={16} strokeWidth={1.75} aria-hidden="true" />
                            All changes saved · <span className="font-mono tabular-nums">{lastSaved}</span>
                          </p>
                        ) : (
                          <>
                            <span className="relative h-8 overflow-hidden">
                              <AnimatePresence initial={false} mode="popLayout">
                                <motion.span
                                  key={changeCount}
                                  initial={{ opacity: 0, y: 4 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -4 }}
                                  className="block text-[28px] leading-8 font-semibold tracking-[-0.03em] tabular-nums"
                                >
                                  {changeCount}
                                </motion.span>
                              </AnimatePresence>
                            </span>
                            <div className="min-w-0">
                              <p className={LABEL}>
                                {changes.length === 1 ? "Change" : "Changes"}
                                {changes.length > 0 ? (
                                  <span className="ml-2 font-mono tracking-normal normal-case tabular-nums">
                                    {changes.map((key) => FIELD_INDEX[key]).join(" ")}
                                  </span>
                                ) : null}
                              </p>
                              {changes.length > 0 ? (
                                <button
                                  type="button"
                                  onClick={revert}
                                  disabled={busy}
                                  className={cx(
                                    "text-[13px] font-medium underline underline-offset-4 disabled:opacity-60 pointer-coarse:min-h-10",
                                    FOCUS,
                                  )}
                                >
                                  Revert all
                                </button>
                              ) : (
                                <p className="text-[13px] text-(--iu-muted)">Nothing to save</p>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                      <button
                        type="submit"
                        form={`${uid}-form`}
                        disabled={busy || changes.length === 0}
                        aria-keyshortcuts="Meta+S Control+S"
                        className={cx(PRIMARY, "inline-grid shrink-0 gap-2")}
                      >
                        <span
                          aria-hidden={busy}
                          className={cx(
                            "col-start-1 row-start-1 inline-flex items-center gap-2 transition-opacity duration-150 motion-reduce:transition-none",
                            busy && "opacity-0",
                          )}
                        >
                          Save changes
                          <kbd aria-hidden="true" className="hidden font-mono text-[11px] opacity-70 sm:inline">
                            ⌘S
                          </kbd>
                        </span>
                        <span
                          aria-hidden={!busy}
                          className={cx(
                            "col-start-1 row-start-1 transition-opacity duration-150 motion-reduce:transition-none",
                            !busy && "opacity-0",
                          )}
                        >
                          Saving
                        </span>
                      </button>
                    </div>
                  )}
                </footer>
              </motion.div>
            </div>
          ) : null}
        </AnimatePresence>
        <p role="status" className="sr-only">
          {announcement}
        </p>
      </div>
    </MotionConfig>
  );
}

export default DiffInspectorSheet;
