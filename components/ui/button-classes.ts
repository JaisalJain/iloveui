import { clsx } from "clsx";

const base =
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-control font-medium whitespace-nowrap select-none " +
  "transition-[background-color,color,border-color,box-shadow,transform] duration-160 ease-site " +
  "active:translate-y-px disabled:pointer-events-none disabled:opacity-50 " +
  "[&_svg]:pointer-events-none [&_svg]:shrink-0";

const variants = {
  // The one accent fill on the site: primary actions only.
  primary: "bg-accent-fill text-accent-fg shadow-sm hover:bg-[color-mix(in_oklab,var(--color-accent-fill)_86%,black)]",
  outline: "border border-hairline bg-surface text-fg shadow-sm hover:bg-raised",
  ghost: "text-muted hover:bg-raised hover:text-fg",
} as const;

const sizes = {
  sm: "h-8 px-3 text-14 pointer-coarse:h-10",
  md: "h-10 px-4 text-14",
  lg: "h-12 px-6 text-16",
  icon: "size-8 text-14 pointer-coarse:size-10",
} as const;

export type ButtonVariant = keyof typeof variants;
export type ButtonSize = keyof typeof sizes;

/**
 * Button classes for links and Radix triggers. Joined with clsx, not cn(), so the client islands that use it keep
 * tailwind-merge out of their first load: `className` may only add classes (layout, margins, responsive display),
 * never override the base, variant or size. The Button component merges with cn() for overrides.
 */
export function buttonClasses({
  variant = "outline",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}) {
  return clsx(base, variants[variant], sizes[size], className);
}
