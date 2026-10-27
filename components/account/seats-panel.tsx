"use client";

import { UserPlus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState, type FormEvent } from "react";
import { buttonClasses } from "@/components/ui/button-classes";
import { callApi } from "./api";
import { Panel } from "./account-section";
import { ConfirmDialog } from "./confirm-dialog";

export type SeatRow = { id: string; email: string; status: "invited" | "active"; since: string; isOwner: boolean };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Team seat management for owners: invite by email, see who joined, remove with confirmation. */
export function SeatsPanel({ seats, limit }: { seats: SeatRow[]; limit: number }) {
  const router = useRouter();
  const inputId = useId();
  const errorId = useId();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [inviting, setInviting] = useState(false);
  const [notice, setNotice] = useState("");
  const [removing, setRemoving] = useState<SeatRow | null>(null);
  const [pendingRemoval, setPendingRemoval] = useState<string | null>(null);

  const used = seats.length;
  const full = used >= limit;

  function validate(value: string): string {
    const trimmed = value.trim();
    if (!trimmed) return "Enter the email address to invite.";
    if (!EMAIL.test(trimmed)) return "Enter a valid email address, like dev@studio.com.";
    if (seats.some((seat) => seat.email === trimmed.toLowerCase()))
      return "That email already has a seat on this team.";
    return "";
  }

  async function invite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const problem = validate(email);
    setError(problem);
    setNotice("");
    if (problem) return;
    setInviting(true);
    const result = await callApi<{ seat: { email: string } }>("/api/team/seats", {
      method: "POST",
      body: JSON.stringify({ email: email.trim() }),
    });
    setInviting(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setEmail("");
    setNotice(`Invited ${result.data.seat.email}. The seat activates when they sign in with that address.`);
    router.refresh();
  }

  async function remove(seat: SeatRow) {
    setPendingRemoval(seat.id);
    setNotice("");
    const result = await callApi<{ removed: boolean }>(`/api/team/seats/${encodeURIComponent(seat.id)}`, {
      method: "DELETE",
    });
    if (!result.ok) {
      setPendingRemoval(null);
      setNotice(result.message);
      return;
    }
    setNotice(`Removed ${seat.email}. Their Pro access has ended.`);
    router.refresh();
  }

  return (
    <Panel>
      <div className="px-5 pt-5 sm:px-6 sm:pt-6">
        <div className="flex items-baseline justify-between gap-4">
          <p className="text-16 font-semibold">Seats</p>
          <p className="font-mono text-12 text-muted tabular-nums" data-seat-count>
            {used} of {limit} used
          </p>
        </div>
        <div
          role="meter"
          aria-label="Seats used"
          aria-valuemin={0}
          aria-valuemax={limit}
          aria-valuenow={used}
          className="mt-3 flex gap-1"
        >
          {Array.from({ length: limit }, (_, index) => (
            <span key={index} className={`h-1.5 flex-1 rounded-full ${index < used ? "bg-accent" : "bg-raised"}`} />
          ))}
        </div>

        <form onSubmit={invite} noValidate className="mt-6">
          <label htmlFor={inputId} className="text-14 font-medium">
            Invite by email
          </label>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <input
              id={inputId}
              type="email"
              inputMode="email"
              autoComplete="off"
              spellCheck={false}
              placeholder="teammate@studio.com"
              value={email}
              disabled={full}
              onChange={(event) => {
                setEmail(event.target.value);
                if (error) setError("");
              }}
              onBlur={() => email && setError(validate(email))}
              aria-invalid={error ? true : undefined}
              aria-describedby={errorId}
              className="h-10 min-w-0 flex-1 rounded-control border border-control bg-canvas px-3 text-14 text-fg placeholder:text-muted disabled:opacity-50 aria-invalid:border-danger"
            />
            <button
              type="submit"
              disabled={inviting || full}
              aria-busy={inviting}
              className={buttonClasses({ variant: "primary", size: "md", className: "min-w-28" })}
            >
              <UserPlus size={16} strokeWidth={1.5} aria-hidden />
              {inviting ? "Inviting" : "Invite"}
            </button>
          </div>
          <p id={errorId} className="mt-2 text-14 text-pretty">
            {error ? (
              <span className="text-danger">{error}</span>
            ) : full ? (
              <span className="text-muted">Every seat is taken. Remove one to invite someone else.</span>
            ) : (
              <span className="text-muted">They get Pro when they sign in to iloveui with this address.</span>
            )}
          </p>
        </form>
      </div>

      <p role="status" className="mx-5 mt-4 text-14 text-fg empty:hidden sm:mx-6">
        {notice}
      </p>

      <ul className="mt-5 divide-y divide-hairline border-t border-hairline" aria-label="Team seats">
        {seats.map((seat) => (
          <li key={seat.id} className="flex items-center gap-3 px-5 py-3 sm:px-6">
            <span
              aria-hidden
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-hairline bg-canvas font-mono text-12 text-muted uppercase"
            >
              {seat.email.slice(0, 1)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-mono text-14 text-fg">{seat.email}</p>
              <p className="text-12 text-muted">
                {seat.isOwner ? "Owner" : seat.status === "active" ? "Active" : "Invited"} · since {seat.since}
              </p>
            </div>
            {seat.isOwner ? null : (
              <button
                type="button"
                onClick={() => setRemoving(seat)}
                disabled={pendingRemoval === seat.id}
                aria-label={`Remove ${seat.email}`}
                className="inline-flex size-8 shrink-0 items-center justify-center rounded-control text-muted transition-colors duration-160 ease-site hover:bg-raised hover:text-fg disabled:opacity-50 pointer-coarse:size-10"
              >
                <X size={16} strokeWidth={1.5} aria-hidden />
              </button>
            )}
          </li>
        ))}
      </ul>
      {seats.length <= 1 ? (
        <p className="border-t border-hairline px-5 py-4 text-14 text-muted sm:px-6">
          Only you so far. Invite the people who build with you; each gets every Pro design.
        </p>
      ) : null}

      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(open) => !open && setRemoving(null)}
        title="Remove this seat?"
        description={removing ? `${removing.email} loses Pro access right away.` : ""}
        confirmLabel="Remove seat"
        destructive
        onConfirm={() => removing && void remove(removing)}
      >
        You can invite the same address again later.
      </ConfirmDialog>
    </Panel>
  );
}
