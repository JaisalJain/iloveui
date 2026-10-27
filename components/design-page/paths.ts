import type { Route } from "next";
import type { CategorySlug } from "@/registry/definitions";

// Routes the design page links to that other parts of Phase 3 to 5 own; typed here once.
export const DESIGNS_PATH = "/designs" as string as Route;
export const PRICING_PATH = "/pricing" as string as Route;

export function categoryPath(category: CategorySlug): Route {
  return `/designs/${category}` as Route;
}
