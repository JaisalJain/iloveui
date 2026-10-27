# Plumbline mega header

## Usage notes

- Use it as the top of a marketing site with three to five sections, where each section has enough pages to need a panel. It is a full-width `sticky` header; the panel and its scrim cover the page below it.
- Keyboard follows the WAI-ARIA disclosure navigation pattern: Enter, Space or Arrow Down opens a section (Arrow Down also moves into it), Arrow Left and Right move between top-level items and keep the panel open on the new section, Home and End jump to the ends, Tab from an open trigger continues into its panel, Tab past the last panel link moves on to the next section and closes the panel, Shift+Tab from the first link returns to the trigger, and Escape closes and returns focus. Arrow Up and Down move through panel links.
- Pointer: hovering a section opens it after 90ms (instantly when another is already open) and leaving the header closes it after 180ms, so a diagonal move to the panel does not flicker. Touch opens on tap only.
- Current location: the section that holds `currentHref` has full-strength text and the accent marker at rest; the link itself carries `aria-current="page"` and a "You are here" label in the panel and the mobile sheet.
- Below 1024px the menu button opens a full-screen modal dialog. Focus lands on the first section, Tab stays inside, Escape or the close button returns focus to the menu button, and the section with the current page starts expanded. Page scroll is locked while it is open.
- Motion is 180ms ease-out with no springs: the marker slides, the panel morphs height and the content shifts 4px in the direction of travel. All of it is instant under reduced motion.
- `--iu-density` sets the height of every panel link row.

## Taste self-review

- One clear focal point: Yes. The accent marker under the open section is the only colored thing on screen and it points at the panel the eye should read; the featured miniature anchors the right edge.
- Spacing on the 4px scale: Yes. The header is 64px, panel padding is 32 and 40px, columns are separated by 24px gutters, link rows are 10px plus a 2px line gap scaled by density, and the sheet rows are 56px.
- Belongs in a Linear, Stripe or Vercel product: Yes. A morphing mega menu with numbered columns, one-line descriptions, a product miniature and a status line is the header those teams ship, kept monochrome with a single accent signal.
- Meets its category brief: Yes. Full keyboard support (disclosure pattern plus arrow keys), a visible current location (marker, aria-current, "You are here") and a designed mobile sheet with numbered display-size sections that expand in place rather than a collapsed list.
- Distinct from every other design in its category: Yes. It is the catalog's only Swiss-grid marketing header whose panel morphs between sections; the other navigation designs are a command palette, an app sidebar and a luxury storefront menu with a product drawing.
