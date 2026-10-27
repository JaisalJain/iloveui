# Loadstar app navigation

## Usage notes

- Use it as the root layout of a product people work in all day: many destinations, counts that change, and records reached by id. It fills the viewport (`h-dvh`) and scrolls only the content area.
- Keyboard: `/` or Cmd/Ctrl+J focuses the quick switcher (a combobox with grouped Pages and Shipments results, Arrow keys, Enter to go, Escape to clear then close); `[` collapses and expands the sidebar; section headers are disclosure buttons; the breadcrumb page segment is a menu button (Enter, Space or Arrow Down opens it, Arrow keys, Home and End move, Escape closes and returns focus) with radio items for its siblings.
- Current location is shown four ways: the accent bar and tint on the sidebar item, `aria-current="page"` on the link, the last breadcrumb segment (also `aria-current`) and the page title. Warning counts carry "needs attention" for screen readers and are never color alone.
- Collapsing removes the sidebar from the layout; touching the left edge with a mouse floats it back over the content until the pointer leaves. Keyboard and touch users expand it with the toggle.
- Below 1024px a menu button opens the sidebar as a modal drawer (focus lands on the current item, Tab is trapped, Escape and the backdrop close it and focus returns). Below 768px the switcher becomes an icon that expands across the top bar, and the breadcrumb keeps only its last two segments. The table drops carrier, ETA and weight columns as width shrinks.
- States: `loading` keeps the shell and swaps counts and rows for static skeletons with `aria-busy`; `empty` shows a drawn truck, honest copy and one Clear filters action, and an empty Saved views section offers to save the current filters.
- Motion is 140ms: the marker slides, crumbs rebuild with a 40ms stagger, menus fade 2px, the drawer slides. All instant under reduced motion. `--iu-density` sets every row height.

## Taste self-review

- One clear focal point: Yes. The accent marker on the current item is the only colored mark in the chrome, and the breadcrumb and title repeat it in type, so where you are always reads first.
- Spacing on the 4px scale: Yes. The top bar and sidebar header are both 48px so their hairlines meet, rows are 30px (density-scaled), gutters are 8, 12 and 20px, menus sit 6px below their trigger with 4px padding.
- Belongs in a Linear, Stripe or Vercel product: Yes. Sectioned sidebar with live tabular counts, switchable breadcrumbs, a quick switcher that finds records by id and a peeking collapsed sidebar are the conventions of the tools people live in.
- Meets its category brief: Yes. Full keyboard support (combobox, menu and disclosure patterns plus hotkeys), visible current location in four places, a designed mobile drawer and expanding switcher, and loading and empty states.
- Distinct from every other design in its category: Yes. It is the only full app shell in the category; the others are a marketing mega menu, a modal command palette and a storefront menu. Unlike the dashboard shell elsewhere in the catalog, it collapses to nothing and peeks back rather than to an icon rail.
