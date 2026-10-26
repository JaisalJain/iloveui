import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// tailwind-merge has to know the custom scales in app/globals.css, otherwise it drops classes such as
// "text-28" when they are combined with a text color.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      color: [
        "canvas",
        "surface",
        "raised",
        "fg",
        "muted",
        "hairline",
        "control",
        "danger",
        "accent",
        "accent-fill",
        "accent-fg",
        "heart",
      ],
      text: ["12", "14", "16", "20", "28", "40", "64", "96"],
      radius: ["control", "card", "frame"],
      ease: ["site"],
      tracking: ["headline", "label"],
      leading: ["body"],
      container: ["site"],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
