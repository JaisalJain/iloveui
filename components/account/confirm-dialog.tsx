"use client";

import type { ReactNode } from "react";
import { Dialog, DialogClose, DialogContent } from "@/components/ui/dialog";
import { buttonClasses } from "@/components/ui/button-classes";

/**
 * A confirmation for destructive or irreversible actions. The trigger stays outside so callers keep their own
 * button; `onConfirm` runs on the confirm press and the dialog closes at once, so the caller's pending state is
 * the feedback.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  destructive = false,
  onConfirm,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: () => void;
  children?: ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={title} description={description} showClose={false}>
        {children ? <div className="px-6 pt-4 text-14 text-muted">{children}</div> : null}
        <div className="flex flex-col-reverse gap-2 px-6 pt-6 pb-6 sm:flex-row sm:justify-end">
          <DialogClose className={buttonClasses({ variant: "outline", size: "md" })}>Cancel</DialogClose>
          <button
            type="button"
            onClick={() => {
              onOpenChange(false);
              onConfirm();
            }}
            className={
              destructive
                ? buttonClasses({
                    variant: "outline",
                    size: "md",
                    className: "border-danger/50 text-danger hover:border-danger",
                  })
                : buttonClasses({ variant: "primary", size: "md" })
            }
          >
            {confirmLabel}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
