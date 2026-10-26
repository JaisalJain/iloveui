"use client";

import { Dialog as DialogPrimitive } from "radix-ui";
import { X } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export function DialogContent({
  className,
  children,
  title,
  description,
  hideTitle = false,
  showClose = true,
  ...props
}: ComponentProps<typeof DialogPrimitive.Content> & {
  title: ReactNode;
  description?: ReactNode;
  hideTitle?: boolean;
  showClose?: boolean;
}) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=closed]:animate-fade-out data-[state=open]:animate-fade-in dark:bg-black/60" />
      <DialogPrimitive.Content
        {...(description ? {} : { "aria-describedby": undefined })}
        onOpenAutoFocus={(event) => {
          // Focus the dialog itself (announced by its title) rather than ringing the first button on open.
          event.preventDefault();
          (event.currentTarget as HTMLElement | null)?.focus();
        }}
        className={cn(
          "fixed top-[12vh] left-1/2 z-50 flex max-h-[76vh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 flex-col",
          "overflow-hidden rounded-card border border-hairline bg-surface text-fg shadow-lg outline-hidden",
          "data-[state=closed]:animate-dialog-out data-[state=open]:animate-dialog-in",
          className,
        )}
        {...props}
      >
        <DialogPrimitive.Title className={hideTitle ? "sr-only" : "px-6 pt-6 text-20 font-semibold"}>
          {title}
        </DialogPrimitive.Title>
        {description ? (
          <DialogPrimitive.Description className={hideTitle ? "sr-only" : "px-6 pt-1 text-14 text-muted"}>
            {description}
          </DialogPrimitive.Description>
        ) : null}
        {children}
        {showClose ? (
          <DialogPrimitive.Close
            aria-label="Close"
            className="absolute top-4 right-4 inline-flex size-8 items-center justify-center rounded-control text-muted transition-colors hover:bg-raised hover:text-fg pointer-coarse:size-10"
          >
            <X size={16} strokeWidth={1.5} aria-hidden />
          </DialogPrimitive.Close>
        ) : null}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
