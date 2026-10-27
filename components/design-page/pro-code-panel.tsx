"use client";

import { useEffect } from "react";
import { CodePanel, type CodeFiles } from "./code-panel";
import { LockedCodePanel } from "./locked-code-panel";
import { checkProAccess, proCodeUrl, useProAccess } from "./pro-access";

// A Pro design's code panel. Everyone gets the server-rendered locked panel; a signed-in visitor with Pro access
// gets the real code panel once /api/code answers, with copy, the C shortcut and Theme Lab tokens as for free code.

export function ProCodePanel({ slug, files }: { slug: string; files: CodeFiles }) {
  const access = useProAccess(slug);
  useEffect(() => checkProAccess(slug), [slug]);

  if (access === "unlocked") return <CodePanel slug={slug} codeUrl={proCodeUrl(slug)} files={files} />;
  return (
    <LockedCodePanel
      files={files}
      notice={access === "locked" ? undefined : access}
      onRetry={() => checkProAccess(slug)}
    />
  );
}
