import type { ReactNode } from "react";

/**
 * A stage for components that are not full-width sections: fills the preview viewport with the theme background
 * and centers (or top-aligns) the component with comfortable padding. Used only by preview.tsx files.
 */
export function PreviewCanvas({
  children,
  align = "center",
  width = "auto",
}: {
  children: ReactNode;
  align?: "center" | "start";
  /** Caps the component's width the way a real layout column would. */
  width?: "auto" | "sm" | "md" | "lg" | "xl";
}) {
  const maxWidth = { auto: "", sm: "max-w-sm", md: "max-w-xl", lg: "max-w-3xl", xl: "max-w-5xl" }[width];
  return (
    <div
      className={`flex min-h-dvh w-full justify-center bg-(--iu-background) px-4 py-10 sm:px-8 sm:py-16 ${
        align === "center" ? "items-center" : "items-start"
      }`}
    >
      <div className={`w-full ${maxWidth}`}>{children}</div>
    </div>
  );
}
