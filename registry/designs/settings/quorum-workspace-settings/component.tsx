"use client";

import { useId, useState } from "react";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "motion/react";
import {
  ArrowRight,
  Check,
  Copy,
  KeyRound,
  LoaderCircle,
  Plus,
  ShieldAlert,
  ShieldCheck,
  TriangleAlert,
  UserMinus,
  Undo2,
} from "lucide-react";

export type QuorumRole = "owner" | "admin" | "member" | "viewer";

export type QuorumMember = {
  id: string;
  name: string;
  email: string;
  role: QuorumRole;
  lastActive: string;
  twoFactor: boolean;
  invited?: boolean;
};

export type QuorumApiKey = {
  id: string;
  name: string;
  prefix: string;
  scopes: string;
  created: string;
  lastUsed: string;
  stale?: boolean;
};

export type QuorumMeter = { label: string; used: number; limit: number; unit: string; projected: number };

export type QuorumInvoice = { id: string; period: string; amount: number; status: "Paid" | "Due" };

export type QuorumChange = {
  memberId: string;
  role?: QuorumRole;
  remove?: boolean;
  /** The role before the change; filled in when changes are applied. */
  from?: QuorumRole;
  /** Name kept for removed members, so applied lines can still show it. */
  name?: string;
};

export type QuorumWorkspaceSettingsProps = {
  workspace?: string;
  plan?: string;
  seatLimit?: number;
  basePrice?: number;
  seatPrice?: number;
  members?: QuorumMember[];
  apiKeys?: QuorumApiKey[];
  meters?: QuorumMeter[];
  invoices?: QuorumInvoice[];
  nextInvoiceDate?: string;
  /** "loading" shows skeleton rows; "error" and "success" show the result of applying `pendingChanges`. */
  status?: "idle" | "loading" | "error" | "success";
  errorMessage?: string;
  appliedAt?: string;
  pendingChanges?: QuorumChange[];
  onApply?: (changes: QuorumChange[]) => Promise<void> | void;
  onInvite?: () => void;
  onCreateKey?: () => void;
  onRevokeKey?: (keyId: string) => void;
  onCopyKey?: (key: string) => void;
  className?: string;
};

const DEFAULT_MEMBERS: QuorumMember[] = [
  { id: "m1", name: "Priya Natarajan", email: "priya@fernhill.dev", role: "owner", lastActive: "Now", twoFactor: true },
  {
    id: "m2",
    name: "Jonas Åberg",
    email: "jonas@fernhill.dev",
    role: "admin",
    lastActive: "12 min ago",
    twoFactor: true,
  },
  { id: "m3", name: "Noor Haddad", email: "noor@fernhill.dev", role: "viewer", lastActive: "2 h ago", twoFactor: true },
  {
    id: "m4",
    name: "Tomasz Wilk",
    email: "tomasz@fernhill.dev",
    role: "member",
    lastActive: "Yesterday",
    twoFactor: false,
  },
  { id: "m5", name: "Ama Owusu", email: "ama@fernhill.dev", role: "member", lastActive: "Mon 26 Oct", twoFactor: true },
  {
    id: "m6",
    name: "Felix Brandt",
    email: "felix@fernhill.dev",
    role: "member",
    lastActive: "3 weeks ago",
    twoFactor: false,
  },
  {
    id: "m7",
    name: "Rei Takahashi",
    email: "rei@fernhill.dev",
    role: "viewer",
    lastActive: "Invited 24 Oct",
    twoFactor: false,
    invited: true,
  },
];

const DEFAULT_KEYS: QuorumApiKey[] = [
  {
    id: "k1",
    name: "ci-deploy",
    prefix: "qk_live_7F2a",
    scopes: "deploy, read",
    created: "12 Mar 2026",
    lastUsed: "4 min ago",
  },
  {
    id: "k2",
    name: "analytics-export",
    prefix: "qk_live_b91C",
    scopes: "read",
    created: "2 Jun 2026",
    lastUsed: "Yesterday",
  },
  {
    id: "k3",
    name: "legacy-zapier",
    prefix: "qk_live_0dE4",
    scopes: "read, write",
    created: "18 Nov 2025",
    lastUsed: "64 days ago",
    stale: true,
  },
];

const DEFAULT_METERS: QuorumMeter[] = [
  { label: "API requests", used: 1_842_310, limit: 2_500_000, unit: "", projected: 2_210_000 },
  { label: "Storage", used: 38.2, limit: 50, unit: "GB", projected: 41.6 },
  { label: "Build minutes", used: 4_210, limit: 6_000, unit: "min", projected: 5_620 },
];

const DEFAULT_INVOICES: QuorumInvoice[] = [
  { id: "INV-2026-0010", period: "Oct 2026", amount: 119, status: "Paid" },
  { id: "INV-2026-0009", period: "Sep 2026", amount: 105, status: "Paid" },
  { id: "INV-2026-0008", period: "Aug 2026", amount: 105, status: "Paid" },
];

const ROLES: { value: QuorumRole; label: string }[] = [
  { value: "owner", label: "Owner" },
  { value: "admin", label: "Admin" },
  { value: "member", label: "Member" },
  { value: "viewer", label: "Viewer" },
];

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--iu-accent)";
const R = "rounded-[min(var(--iu-radius),6px)]";
const LABEL = "text-[11px] font-medium tracking-[0.06em] text-(--iu-muted) uppercase";
const BUTTON = `inline-flex h-7 cursor-pointer items-center justify-center gap-1.5 border border-(--iu-foreground)/30 bg-(--iu-surface) px-2.5 text-[12px] font-medium transition-colors duration-100 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none pointer-coarse:h-10 pointer-fine:hover:not-disabled:border-(--iu-foreground) ${R} ${FOCUS}`;
const PANEL = `border border-(--iu-border) bg-(--iu-surface) dark:border-(--iu-foreground)/12 ${R}`;
const CELL = "px-3 py-[calc(8px*var(--iu-density))]";
/** Columns that collapse to zero width in narrow containers. Cells stay in the table so columns keep their order. */
const WIDE_CELL =
  "invisible overflow-hidden p-0 whitespace-nowrap @2xl:visible @2xl:px-3 @2xl:py-[calc(8px*var(--iu-density))]";

function cx(...values: (string | false | null | undefined)[]) {
  return values.filter(Boolean).join(" ");
}

function money(value: number) {
  const sign = value < 0 ? "−" : "";
  return `${sign}$${Math.abs(value).toFixed(2)}`;
}

function delta(value: number) {
  if (value === 0) return "±$0.00";
  return value > 0 ? `+${money(value)}` : money(value);
}

function compact(value: number, unit: string) {
  if (unit) return `${value.toLocaleString("en-US", { maximumFractionDigits: 1 })} ${unit}`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}k`;
  return String(value);
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const isPaid = (role: QuorumRole) => role !== "viewer";
const roleLabel = (role: QuorumRole) => ROLES.find((item) => item.value === role)?.label ?? role;

function nowTime() {
  const date = new Date();
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  }
}

function Skeleton({ className }: { className: string }) {
  return <span aria-hidden="true" className={cx("block bg-(--iu-foreground)/8", R, className)} />;
}

export function QuorumWorkspaceSettings({
  workspace = "Fernhill Robotics",
  plan = "Team · billed monthly",
  seatLimit = 15,
  basePrice = 49,
  seatPrice = 14,
  members: initialMembers = DEFAULT_MEMBERS,
  apiKeys: initialKeys = DEFAULT_KEYS,
  meters = DEFAULT_METERS,
  invoices = DEFAULT_INVOICES,
  nextInvoiceDate = "1 Nov 2026",
  status: initialStatus = "idle",
  errorMessage = "Couldn't apply 2 changes. Seat changes are locked while the October invoice is being finalized; try again after 18:00 UTC.",
  appliedAt = "14:32",
  pendingChanges = [],
  onApply,
  onInvite,
  onCreateKey,
  onRevokeKey,
  onCopyKey,
  className = "",
}: QuorumWorkspaceSettingsProps) {
  const reduceMotion = useReducedMotion();
  const ids = useId();
  const [members, setMembers] = useState(initialMembers);
  const [changes, setChanges] = useState<Record<string, QuorumChange>>(() =>
    Object.fromEntries(pendingChanges.map((change) => [change.memberId, change])),
  );
  const [status, setStatus] = useState<"idle" | "loading" | "applying" | "error" | "success">(initialStatus);
  const [error, setError] = useState(initialStatus === "error" ? errorMessage : "");
  const [applied, setApplied] = useState<{ lines: QuorumChange[]; at: string }>(() => ({
    lines: initialStatus === "success" ? pendingChanges : [],
    at: appliedAt,
  }));
  const [keys, setKeys] = useState(initialKeys);
  const [confirmingKey, setConfirmingKey] = useState<string | null>(null);
  const [newKey, setNewKey] = useState<{ id: string; secret: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  const baseMembers = members;

  const loading = status === "loading";
  const applying = status === "applying";
  const pending = Object.values(changes).filter((change) => {
    const member = baseMembers.find((item) => item.id === change.memberId);
    return member && (change.remove || (change.role && change.role !== member.role));
  });
  const paidSeats = (list: QuorumMember[], overrides: Record<string, QuorumChange>) =>
    list.filter((member) => {
      const change = overrides[member.id];
      if (change?.remove) return false;
      return isPaid(change?.role ?? member.role);
    }).length;
  const currentPaid = paidSeats(baseMembers, {});
  const nextPaid = paidSeats(baseMembers, changes);
  const currentBill = basePrice + currentPaid * seatPrice;
  const nextBill = basePrice + nextPaid * seatPrice;
  const seatsUsed = baseMembers.filter((member) => !changes[member.id]?.remove).length;

  const setRole = (member: QuorumMember, role: QuorumRole) => {
    setChanges((current) => {
      const next = { ...current };
      if (role === member.role && !current[member.id]?.remove) delete next[member.id];
      else next[member.id] = { memberId: member.id, role };
      return next;
    });
    if (status === "success" || status === "error") setStatus("idle");
    setAnnouncement(`${member.name}: ${roleLabel(role)} pending`);
  };

  const toggleRemove = (member: QuorumMember) => {
    setChanges((current) => {
      const next = { ...current };
      if (current[member.id]?.remove) delete next[member.id];
      else next[member.id] = { memberId: member.id, remove: true };
      return next;
    });
    if (status === "success" || status === "error") setStatus("idle");
    setAnnouncement(changes[member.id]?.remove ? `${member.name} kept` : `${member.name} will be removed`);
  };

  const apply = async () => {
    if (pending.length === 0 || applying) return;
    setStatus("applying");
    setError("");
    try {
      await onApply?.(pending);
      setMembers((list) =>
        list
          .filter((member) => !changes[member.id]?.remove)
          .map((member) =>
            changes[member.id]?.role ? { ...member, role: changes[member.id]?.role ?? member.role } : member,
          ),
      );
      setApplied({
        lines: pending.map((change) => {
          const member = members.find((item) => item.id === change.memberId);
          return { ...change, from: member?.role, name: member?.name };
        }),
        at: nowTime(),
      });
      setChanges({});
      setStatus("success");
      setAnnouncement(`Applied ${pending.length} ${pending.length === 1 ? "change" : "changes"}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Couldn't apply the changes. Try again.");
      setStatus("error");
    }
  };

  const discard = () => {
    setChanges({});
    setError("");
    setStatus("idle");
    setAnnouncement("Changes discarded");
  };

  const createKey = () => {
    const id = `k${Date.now()}`;
    const secret = "qk_live_Hq3vN8xT2mLs9RcW4yJb6KeP0aZd";
    setKeys((list) => [
      { id, name: "new-key", prefix: secret.slice(0, 12), scopes: "read", created: "Today", lastUsed: "Never" },
      ...list,
    ]);
    setNewKey({ id, secret });
    setAnnouncement("Key created. Copy it now; it is shown once.");
    onCreateKey?.();
  };

  const revoke = (key: QuorumApiKey) => {
    setKeys((list) => list.filter((item) => item.id !== key.id));
    setConfirmingKey(null);
    if (newKey?.id === key.id) setNewKey(null);
    setAnnouncement(`${key.name} revoked`);
    onRevokeKey?.(key.id);
  };

  const trayLines = status === "success" ? applied.lines : pending;

  return (
    <MotionConfig
      reducedMotion="user"
      transition={reduceMotion ? { duration: 0 } : { duration: 0.14, ease: "easeOut" }}
    >
      <section
        aria-label={`${workspace} workspace settings`}
        className={cx(
          "@container w-full font-(family-name:--iu-font) text-[13px] leading-[1.4] text-(--iu-foreground)",
          className,
        )}
      >
        {/* Workspace header */}
        <header className="flex flex-wrap items-center gap-x-4 gap-y-2 pb-4">
          <span
            aria-hidden="true"
            className={cx(
              "inline-flex size-9 items-center justify-center bg-(--iu-foreground) text-[13px] font-semibold text-(--iu-background)",
              R,
            )}
          >
            {initials(workspace)}
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-[18px] leading-tight font-semibold tracking-[-0.01em]">{workspace}</h2>
            <p className="text-[12px] text-(--iu-muted)">Workspace settings · {plan}</p>
          </div>
          <dl className="flex gap-6 font-mono text-[12px] tabular-nums">
            <div>
              <dt className={LABEL}>Seats</dt>
              <dd className="mt-0.5">
                {seatsUsed} / {seatLimit}
              </dd>
            </div>
            <div>
              <dt className={LABEL}>Monthly</dt>
              <dd className="mt-0.5">{money(currentBill)}</dd>
            </div>
          </dl>
        </header>

        <div className="grid grid-cols-1 gap-4 @5xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="flex min-w-0 flex-col gap-4">
            {/* Members */}
            <div className={PANEL}>
              <div className="flex items-center gap-3 border-b border-(--iu-border) px-3 py-2.5 dark:border-(--iu-foreground)/10">
                <h3 className="text-[13px] font-semibold">Members</h3>
                <span className="font-mono text-[11px] text-(--iu-muted) tabular-nums">
                  {currentPaid} paid · {baseMembers.length - currentPaid} free
                </span>
                <button type="button" onClick={onInvite} className={cx(BUTTON, "ml-auto")}>
                  <Plus size={12} strokeWidth={2} aria-hidden="true" />
                  Invite
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full table-fixed border-collapse text-left">
                  <caption className="sr-only">
                    Workspace members and roles. Role changes apply together from the tray below.
                  </caption>
                  <colgroup>
                    <col />
                    <col className="w-0 @2xl:w-[120px]" />
                    <col className="w-[112px]" />
                    <col className="w-0 @2xl:w-[56px]" />
                    <col className="w-[44px]" />
                  </colgroup>
                  <thead className="sticky top-0 bg-(--iu-surface)">
                    <tr className={cx(LABEL, "border-b border-(--iu-border) dark:border-(--iu-foreground)/10")}>
                      <th scope="col" className={cx(CELL, "font-medium")}>
                        Member
                      </th>
                      <th scope="col" className={cx(WIDE_CELL, "font-medium")}>
                        Last active
                      </th>
                      <th scope="col" className={cx(CELL, "font-medium")}>
                        Role
                      </th>
                      <th scope="col" className={cx(WIDE_CELL, "font-medium")}>
                        2FA
                      </th>
                      <th scope="col" className={cx(CELL, "font-medium")}>
                        <span className="sr-only">Remove</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading
                      ? Array.from({ length: 6 }, (_, index) => (
                          <tr
                            key={index}
                            className="border-b border-(--iu-border) last:border-b-0 dark:border-(--iu-foreground)/8"
                          >
                            <td className={CELL}>
                              <span className="flex items-center gap-2">
                                <Skeleton className="size-6 shrink-0" />
                                <Skeleton className="h-3 w-32" />
                              </span>
                            </td>
                            <td className={WIDE_CELL}>
                              <Skeleton className="h-3 w-16" />
                            </td>
                            <td className={CELL}>
                              <Skeleton className="h-7 w-full" />
                            </td>
                            <td className={WIDE_CELL}>
                              <Skeleton className="h-3 w-6" />
                            </td>
                            <td className={CELL} />
                          </tr>
                        ))
                      : baseMembers.map((member, index) => {
                          const change = changes[member.id];
                          const removing = Boolean(change?.remove);
                          const role = change?.role ?? member.role;
                          const changed = removing || role !== member.role;
                          return (
                            <tr
                              key={member.id}
                              className={cx(
                                "border-b border-(--iu-border) last:border-b-0 dark:border-(--iu-foreground)/8",
                                index % 2 === 1 && "bg-(--iu-foreground)/[0.025]",
                                changed && "shadow-[inset_2px_0_0_var(--iu-accent)]",
                              )}
                            >
                              <th scope="row" className={cx(CELL, "font-normal")}>
                                <span className="flex min-w-0 items-center gap-2">
                                  <span
                                    aria-hidden="true"
                                    className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-(--iu-foreground)/8 text-[10px] font-semibold"
                                  >
                                    {initials(member.name)}
                                  </span>
                                  <span className="min-w-0">
                                    <span
                                      className={cx(
                                        "block truncate text-[13px] font-medium",
                                        removing && "text-(--iu-muted) line-through",
                                      )}
                                    >
                                      {member.name}
                                      {member.invited && (
                                        <span className="ml-1.5 font-mono text-[10px] font-normal text-(--iu-muted) no-underline">
                                          INVITED
                                        </span>
                                      )}
                                    </span>
                                    <span className="block truncate font-mono text-[11px] text-(--iu-muted)">
                                      {member.email}
                                    </span>
                                  </span>
                                </span>
                              </th>
                              <td className={cx(WIDE_CELL, "text-[12px] text-(--iu-muted) tabular-nums")}>
                                {member.lastActive}
                              </td>
                              <td className={CELL}>
                                <label className="sr-only" htmlFor={`${ids}-role-${member.id}`}>
                                  Role for {member.name}
                                </label>
                                <select
                                  id={`${ids}-role-${member.id}`}
                                  value={role}
                                  disabled={member.role === "owner" || removing || applying}
                                  onChange={(event) => setRole(member, event.target.value as QuorumRole)}
                                  className={cx(
                                    "h-7 w-full cursor-pointer border bg-(--iu-surface) px-1.5 text-[12px] disabled:cursor-not-allowed disabled:opacity-60 pointer-coarse:h-10",
                                    role !== member.role ? "border-(--iu-accent)" : "border-(--iu-foreground)/30",
                                    R,
                                    FOCUS,
                                  )}
                                >
                                  {ROLES.filter((item) => item.value !== "owner" || member.role === "owner").map(
                                    (item) => (
                                      <option key={item.value} value={item.value}>
                                        {item.label}
                                      </option>
                                    ),
                                  )}
                                </select>
                              </td>
                              <td className={WIDE_CELL}>
                                {member.twoFactor ? (
                                  <span className="inline-flex items-center gap-1 text-[12px]">
                                    <ShieldCheck
                                      size={14}
                                      strokeWidth={1.75}
                                      aria-hidden="true"
                                      className="text-emerald-700 dark:text-emerald-400"
                                    />
                                    <span className="sr-only">On</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[12px] text-amber-800 dark:text-amber-300">
                                    <ShieldAlert size={14} strokeWidth={1.75} aria-hidden="true" />
                                    <span className="sr-only">Off</span>
                                  </span>
                                )}
                              </td>
                              <td className="px-1 text-right">
                                {member.role !== "owner" && (
                                  <button
                                    type="button"
                                    aria-label={removing ? `Keep ${member.name}` : `Remove ${member.name}`}
                                    aria-pressed={removing}
                                    disabled={applying}
                                    onClick={() => toggleRemove(member)}
                                    className={cx(
                                      "inline-flex size-7 cursor-pointer items-center justify-center text-(--iu-muted) disabled:cursor-not-allowed pointer-coarse:size-10 pointer-fine:hover:bg-(--iu-foreground)/6 pointer-fine:hover:text-(--iu-foreground)",
                                      R,
                                      FOCUS,
                                    )}
                                  >
                                    {removing ? (
                                      <Undo2 size={14} strokeWidth={1.75} aria-hidden="true" />
                                    ) : (
                                      <UserMinus size={14} strokeWidth={1.75} aria-hidden="true" />
                                    )}
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                  </tbody>
                </table>
              </div>

              {/* Pending changes tray */}
              <div
                aria-labelledby={`${ids}-tray`}
                role="region"
                className="border-t border-(--iu-border) bg-(--iu-background) px-3 py-3 dark:border-(--iu-foreground)/10"
              >
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <h4 id={`${ids}-tray`} className={LABEL}>
                    {status === "success" ? `Applied at ${applied.at}` : "Pending changes"}
                  </h4>
                  <span className="font-mono text-[11px] text-(--iu-muted) tabular-nums">
                    {status === "success"
                      ? `${applied.lines.length} applied`
                      : pending.length === 0
                        ? "none"
                        : `${pending.length} to apply`}
                  </span>
                </div>
                {trayLines.length === 0 ? (
                  <p className="mt-1.5 text-[12px] text-(--iu-muted)">
                    Change a role or remove someone above. Changes apply together, so the bill only changes once.
                  </p>
                ) : (
                  <ul className="mt-2 font-mono text-[12px] tabular-nums">
                    <AnimatePresence initial={false}>
                      {trayLines.map((line) => {
                        const member = members.find((item) => item.id === line.memberId);
                        const before = line.from ?? member?.role ?? "viewer";
                        const name = line.name ?? member?.name ?? line.memberId;
                        const d =
                          (line.remove ? 0 : isPaid(line.role ?? before) ? seatPrice : 0) -
                          (isPaid(before) ? seatPrice : 0);
                        return (
                          <motion.li
                            key={line.memberId}
                            initial={{ opacity: 0, y: -2 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="grid grid-cols-[16px_minmax(0,1fr)_auto] items-center gap-2 py-0.5"
                          >
                            <span aria-hidden="true" className={status === "success" ? "text-(--iu-muted)" : ""}>
                              {status === "success" ? <Check size={12} strokeWidth={2} /> : line.remove ? "−" : "~"}
                            </span>
                            <span className="min-w-0 truncate">
                              {name}{" "}
                              {line.remove ? (
                                <span className="text-(--iu-muted)">removed</span>
                              ) : (
                                <span className="text-(--iu-muted)">
                                  {roleLabel(before)}{" "}
                                  <ArrowRight
                                    size={10}
                                    strokeWidth={2}
                                    aria-label="to"
                                    className="inline align-[-1px]"
                                  />{" "}
                                  <span className="text-(--iu-foreground)">{roleLabel(line.role ?? before)}</span>
                                </span>
                              )}
                            </span>
                            <span className={d === 0 ? "text-(--iu-muted)" : ""}>{delta(d)}/mo</span>
                          </motion.li>
                        );
                      })}
                    </AnimatePresence>
                  </ul>
                )}

                {status !== "success" && pending.length > 0 && (
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-dashed border-(--iu-border) pt-2">
                    <span className="font-mono text-[12px] tabular-nums">
                      Next invoice {money(currentBill)}{" "}
                      <ArrowRight size={10} strokeWidth={2} aria-label="becomes" className="inline align-[-1px]" />{" "}
                      <span className="font-semibold">{money(nextBill)}</span>{" "}
                      <span className="text-(--iu-muted)">({delta(nextBill - currentBill)})</span>
                    </span>
                    <span className="ml-auto flex gap-2">
                      <button type="button" onClick={discard} disabled={applying} className={BUTTON}>
                        Discard
                      </button>
                      <button
                        type="button"
                        onClick={() => void apply()}
                        disabled={applying}
                        className={cx(
                          "inline-flex h-7 min-w-[112px] cursor-pointer items-center justify-center gap-1.5 bg-(--iu-accent) px-2.5 text-[12px] font-semibold text-(--iu-accent-foreground) disabled:cursor-wait pointer-coarse:h-10",
                          R,
                          FOCUS,
                        )}
                      >
                        {applying && (
                          <LoaderCircle
                            size={12}
                            strokeWidth={2}
                            aria-hidden="true"
                            className="animate-spin motion-reduce:animate-none"
                          />
                        )}
                        {applying ? "Applying" : status === "error" ? "Retry apply" : "Apply changes"}
                      </button>
                    </span>
                  </div>
                )}
                {status === "error" && error && (
                  <p role="alert" className="mt-2 flex items-start gap-1.5 text-[12px] text-red-800 dark:text-red-300">
                    <TriangleAlert size={14} strokeWidth={1.75} aria-hidden="true" className="mt-px shrink-0" />
                    {error}
                  </p>
                )}
              </div>
            </div>

            {/* API keys */}
            <div className={PANEL}>
              <div className="flex items-center gap-3 border-b border-(--iu-border) px-3 py-2.5 dark:border-(--iu-foreground)/10">
                <h3 className="text-[13px] font-semibold">API keys</h3>
                <span className="font-mono text-[11px] text-(--iu-muted) tabular-nums">{keys.length} active</span>
                <button type="button" onClick={createKey} disabled={loading} className={cx(BUTTON, "ml-auto")}>
                  <Plus size={12} strokeWidth={2} aria-hidden="true" />
                  Create key
                </button>
              </div>
              {keys.length === 0 && !loading ? (
                <div className="flex flex-col items-start gap-2 px-3 py-6">
                  <KeyRound size={20} strokeWidth={1.5} aria-hidden="true" className="text-(--iu-muted)" />
                  <p className="text-[13px] font-medium">No API keys yet</p>
                  <p className="max-w-[48ch] text-[12px] text-pretty text-(--iu-muted)">
                    Keys let CI and scripts call the Quorum API as this workspace. Each one can be scoped and revoked on
                    its own.
                  </p>
                  <button type="button" onClick={createKey} className={cx(BUTTON, "mt-1")}>
                    <Plus size={12} strokeWidth={2} aria-hidden="true" />
                    Create your first key
                  </button>
                </div>
              ) : (
                <ul>
                  {loading
                    ? Array.from({ length: 3 }, (_, index) => (
                        <li
                          key={index}
                          className="flex items-center gap-3 border-b border-(--iu-border) px-3 py-3 last:border-b-0 dark:border-(--iu-foreground)/8"
                        >
                          <Skeleton className="h-3 w-28" />
                          <Skeleton className="h-3 w-24" />
                          <Skeleton className="ml-auto h-7 w-16" />
                        </li>
                      ))
                    : keys.map((key) => {
                        const confirming = confirmingKey === key.id;
                        const fresh = newKey?.id === key.id;
                        return (
                          <li
                            key={key.id}
                            className={cx(
                              "border-b border-(--iu-border) px-3 py-[calc(8px*var(--iu-density))] last:border-b-0 dark:border-(--iu-foreground)/8",
                              confirming && "bg-red-700/5 dark:bg-red-400/8",
                            )}
                          >
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                              <span className="min-w-0 flex-1">
                                <span className="flex items-center gap-2">
                                  <span className="font-mono text-[12px] font-medium">{key.name}</span>
                                  {key.stale && (
                                    <span className="inline-flex items-center gap-1 text-[11px] text-amber-800 dark:text-amber-300">
                                      <TriangleAlert size={12} strokeWidth={1.75} aria-hidden="true" />
                                      Unused 60+ days
                                    </span>
                                  )}
                                </span>
                                <span className="block font-mono text-[11px] text-(--iu-muted) tabular-nums">
                                  {key.prefix}•••• · {key.scopes} · created {key.created} · used {key.lastUsed}
                                </span>
                              </span>
                              {!confirming && (
                                <button type="button" onClick={() => setConfirmingKey(key.id)} className={BUTTON}>
                                  Revoke
                                </button>
                              )}
                            </div>
                            {fresh && newKey && (
                              <div
                                className={cx(
                                  "mt-2 flex flex-wrap items-center gap-2 border border-dashed border-(--iu-foreground)/30 bg-(--iu-background) p-2",
                                  R,
                                )}
                              >
                                <code className="min-w-0 flex-1 font-mono text-[12px] break-all">{newKey.secret}</code>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (!(await copyText(newKey.secret))) return;
                                    setCopied(true);
                                    setAnnouncement("Key copied");
                                    onCopyKey?.(newKey.secret);
                                    window.setTimeout(() => setCopied(false), 1500);
                                  }}
                                  className={BUTTON}
                                >
                                  {copied ? (
                                    <Check size={12} strokeWidth={2} aria-hidden="true" />
                                  ) : (
                                    <Copy size={12} strokeWidth={1.75} aria-hidden="true" />
                                  )}
                                  {copied ? "Copied" : "Copy"}
                                </button>
                                <span className="w-full text-[11px] text-(--iu-muted)">
                                  Shown once. Store it in your secrets manager now.
                                </span>
                              </div>
                            )}
                            {confirming && (
                              <div
                                role="group"
                                aria-labelledby={`${ids}-revoke-${key.id}`}
                                className="mt-2 flex flex-wrap items-center gap-2"
                              >
                                <p id={`${ids}-revoke-${key.id}`} className="min-w-0 flex-1 text-[12px] text-pretty">
                                  Revoke <span className="font-mono font-medium">{key.name}</span>? Requests using it
                                  fail immediately. This can&apos;t be undone.
                                </p>
                                <button
                                  type="button"
                                  autoFocus
                                  onClick={() => setConfirmingKey(null)}
                                  className={BUTTON}
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={() => revoke(key)}
                                  className={cx(
                                    "inline-flex h-7 cursor-pointer items-center gap-1.5 bg-red-700 px-2.5 text-[12px] font-semibold text-white dark:bg-red-600 pointer-coarse:h-10",
                                    R,
                                    FOCUS,
                                  )}
                                >
                                  Revoke key
                                </button>
                              </div>
                            )}
                          </li>
                        );
                      })}
                </ul>
              )}
            </div>
          </div>

          {/* Billing and usage */}
          <aside aria-label="Billing and usage" className="flex flex-col gap-4">
            <div className={PANEL}>
              <div className="border-b border-(--iu-border) px-3 py-2.5 dark:border-(--iu-foreground)/10">
                <h3 className="text-[13px] font-semibold">Usage this period</h3>
                <p className="text-[11px] text-(--iu-muted)">1–31 Oct · resets in 4 days</p>
              </div>
              <ul className="px-3">
                {meters.map((meter) => {
                  const ratio = Math.min(1, meter.used / meter.limit);
                  const projected = Math.min(1, meter.projected / meter.limit);
                  const warn = projected >= 0.9;
                  return (
                    <li
                      key={meter.label}
                      className="border-b border-(--iu-border) py-3 last:border-b-0 dark:border-(--iu-foreground)/8"
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-[12px] font-medium">{meter.label}</span>
                        <span className="font-mono text-[12px] tabular-nums">
                          {compact(meter.used, meter.unit)}{" "}
                          <span className="text-(--iu-muted)">/ {compact(meter.limit, meter.unit)}</span>
                        </span>
                      </div>
                      <div
                        role="meter"
                        aria-label={meter.label}
                        aria-valuemin={0}
                        aria-valuemax={meter.limit}
                        aria-valuenow={meter.used}
                        aria-valuetext={`${compact(meter.used, meter.unit)} of ${compact(meter.limit, meter.unit)}, ${Math.round(ratio * 100)}%, projected ${compact(meter.projected, meter.unit)}`}
                        className="relative mt-2 h-1.5 bg-(--iu-foreground)/8"
                      >
                        <span
                          className={cx(
                            "absolute inset-y-0 left-0",
                            warn ? "bg-amber-600 dark:bg-amber-400" : "bg-(--iu-foreground)/75",
                          )}
                          style={{ width: `${ratio * 100}%` }}
                        />
                        <span
                          aria-hidden="true"
                          className="absolute -inset-y-1 w-0 border-l border-dashed border-(--iu-foreground)/60"
                          style={{ left: `${projected * 100}%` }}
                        />
                      </div>
                      <p
                        className={cx(
                          "mt-1.5 flex items-center gap-1 font-mono text-[11px] tabular-nums",
                          warn ? "text-amber-800 dark:text-amber-300" : "text-(--iu-muted)",
                        )}
                      >
                        {warn && <TriangleAlert size={12} strokeWidth={1.75} aria-hidden="true" />}
                        {Math.round(ratio * 100)}% · projected {Math.round(projected * 100)}% by 31 Oct
                      </p>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className={PANEL}>
              <div className="border-b border-(--iu-border) px-3 py-2.5 dark:border-(--iu-foreground)/10">
                <h3 className="text-[13px] font-semibold">Billing</h3>
              </div>
              <dl className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1.5 px-3 py-3 text-[12px]">
                <dt className="text-(--iu-muted)">Base plan</dt>
                <dd className="text-right font-mono tabular-nums">{money(basePrice)}</dd>
                <dt className="text-(--iu-muted)">
                  {nextPaid} paid seats × {money(seatPrice)}
                </dt>
                <dd className="text-right font-mono tabular-nums">{money(nextPaid * seatPrice)}</dd>
                <dt className="border-t border-(--iu-border) pt-1.5 font-medium dark:border-(--iu-foreground)/10">
                  Next invoice · {nextInvoiceDate}
                </dt>
                <dd className="border-t border-(--iu-border) pt-1.5 text-right font-mono font-semibold tabular-nums dark:border-(--iu-foreground)/10">
                  <AnimatePresence initial={false} mode="popLayout">
                    <motion.span
                      key={nextBill}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="inline-block"
                    >
                      {money(nextBill)}
                    </motion.span>
                  </AnimatePresence>
                </dd>
              </dl>
              <table className="w-full border-collapse border-t border-(--iu-border) text-left text-[12px] dark:border-(--iu-foreground)/10">
                <caption className="sr-only">Recent invoices</caption>
                <thead>
                  <tr className={LABEL}>
                    <th scope="col" className="px-3 pt-2.5 pb-1 font-medium">
                      Invoice
                    </th>
                    <th scope="col" className="px-3 pt-2.5 pb-1 text-right font-medium">
                      Amount
                    </th>
                    <th scope="col" className="px-3 pt-2.5 pb-1 text-right font-medium">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr key={invoice.id}>
                      <th scope="row" className="px-3 py-1 font-normal">
                        <span className="block">{invoice.period}</span>
                        <span className="block font-mono text-[10px] text-(--iu-muted)">{invoice.id}</span>
                      </th>
                      <td className="px-3 py-1 text-right font-mono tabular-nums">{money(invoice.amount)}</td>
                      <td className="px-3 py-1 text-right">
                        <span className="inline-flex items-center gap-1 text-[11px]">
                          <Check
                            size={12}
                            strokeWidth={2}
                            aria-hidden="true"
                            className="text-emerald-700 dark:text-emerald-400"
                          />
                          {invoice.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="h-2" />
            </div>
          </aside>
        </div>

        <p aria-live="polite" className="sr-only">
          {announcement}
        </p>
      </section>
    </MotionConfig>
  );
}

export default QuorumWorkspaceSettings;
