"use client";

// Whether the page's first hydration has finished: the site shell marks it from its first effect. A component that
// renders before that is hydrating server HTML; one that renders after is a client navigation.
let hydrated = false;

export function markHydrated() {
  hydrated = true;
}

export function isHydrated() {
  return hydrated;
}
