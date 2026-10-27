"use client";

import { KeyRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { buttonClasses } from "@/components/ui/button-classes";
import { callApi } from "./api";
import { Panel } from "./account-section";
import { ConfirmDialog } from "./confirm-dialog";
import { CopyBlock } from "./copy-block";

export type TokenSummary = { createdAt: string; lastUsedAt: string | null } | null;

/**
 * The CLI token: created or rotated through POST /api/token/rotate, shown once, then only its dates. The snippets
 * below are the spec's components.json addition and .env line, built from NEXT_PUBLIC_SITE_URL on the server.
 */
export function TokenPanel({
  token,
  pro,
  envLine,
  componentsJson,
  installCommand,
}: {
  token: TokenSummary;
  pro: boolean;
  envLine: string;
  componentsJson: string;
  installCommand: string;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [fresh, setFresh] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function issue() {
    setPending(true);
    setError("");
    const result = await callApi<{ token: string }>("/api/token/rotate", { method: "POST" });
    setPending(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setFresh(result.data.token);
    router.refresh();
  }

  const exists = token !== null;
  return (
    <div className="flex flex-col gap-6">
      <Panel>
        <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex min-w-0 items-start gap-3">
            <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-control border border-hairline bg-canvas text-muted">
              <KeyRound size={16} strokeWidth={1.5} aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-16 font-semibold">{exists ? "Personal access token" : "No token yet"}</p>
              <p className="mt-1 font-mono text-12 text-muted tabular-nums" data-token-dates>
                {exists
                  ? `Created ${token.createdAt} · ${token.lastUsedAt ? `last used ${token.lastUsedAt}` : "never used"}`
                  : "Create one to install designs with the shadcn CLI."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => (exists ? setConfirming(true) : void issue())}
            disabled={pending}
            aria-busy={pending}
            className={buttonClasses({ variant: exists ? "outline" : "primary", size: "md", className: "min-w-36" })}
          >
            {pending ? "Creating token" : exists ? "Rotate token" : "Create token"}
          </button>
        </div>

        {fresh ? (
          <div className="border-t border-hairline px-5 py-5 sm:px-6" data-new-token>
            <p className="text-14 font-semibold text-fg">Your new token</p>
            <p className="mt-1 text-14 text-pretty text-muted">
              Copy it now and keep it somewhere safe.{" "}
              <strong className="font-semibold text-fg">You will not see it again</strong>; if you lose it, rotate to
              get a new one.
            </p>
            <div className="mt-3">
              <CopyBlock label="new CLI token" value={fresh} />
            </div>
          </div>
        ) : null}

        <p role="alert" className="border-t border-hairline px-5 py-3 text-14 text-danger empty:hidden sm:px-6">
          {error}
        </p>
      </Panel>

      {!pro ? (
        <p className="text-14 text-pretty text-muted">
          Free designs install without a token. Pro designs answer to your token once you have a Pro license.
        </p>
      ) : null}

      <ol className="flex flex-col gap-6">
        <li className="flex flex-col gap-2">
          <h3 className="text-14 font-semibold">
            <span className="mr-2 font-mono text-12 text-muted">01</span>Add the token to .env
          </h3>
          <CopyBlock label=".env line" value={envLine} />
        </li>
        <li className="flex flex-col gap-2">
          <h3 className="text-14 font-semibold">
            <span className="mr-2 font-mono text-12 text-muted">02</span>Add the registry to components.json
          </h3>
          <CopyBlock label="components.json registries" value={componentsJson} multiline />
        </li>
        <li className="flex flex-col gap-2">
          <h3 className="text-14 font-semibold">
            <span className="mr-2 font-mono text-12 text-muted">03</span>Install any design by its slug
          </h3>
          <CopyBlock label="install command" value={installCommand} />
        </li>
      </ol>

      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title="Rotate your token?"
        description="The current token stops working the moment the new one is created."
        confirmLabel="Rotate token"
        onConfirm={() => void issue()}
      >
        Update ILOVEUI_TOKEN everywhere you use it: on your machine and in CI.
      </ConfirmDialog>
    </div>
  );
}
