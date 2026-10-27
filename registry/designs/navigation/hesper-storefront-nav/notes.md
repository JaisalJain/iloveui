# Hesper storefront navigation

## Usage notes

- Use it as the header of a premium shop with a handful of collections and a small number of hero pieces. Every link in a panel is a product or a collection that can be drawn as the subject.
- Keyboard follows the WAI-ARIA disclosure navigation pattern: collection buttons carry `aria-expanded`; Enter, Space or Arrow Down opens a panel (Arrow Down and Tab move into it), Arrow Left and Right move along the bar, Arrow Up and Down move through panel links, Escape closes and returns focus. Focusing a piece makes it the subject, so keyboard users see the same preview as pointer users.
- Search is a combobox: suggestions while empty, live matches by name and detail, Arrow keys and Enter, Escape clears then closes, and an honest empty message.
- Current location: the collection that holds `currentHref` keeps a short accent dash under its label and the link carries `aria-current="page"`; in the drawer the current piece has the same dash.
- Below 1024px the menu button opens a modal drawer (focus trapped, Escape steps back a level and then closes, focus returns to the button); the search icon opens the same drawer with the field focused. Collections drill in with a back button that keeps focus in place.
- Motion is slow and quiet: 300 to 400ms fades, a 2% scale settle on the subject, sliding drawer levels. All instant under reduced motion; nothing loops.
- `--iu-density` sets the spacing between panel links.

## Taste self-review

- One clear focal point: Yes. The framed drawing of the piece under the cursor is the subject of the open panel; everything else is small tracked type on fine rules.
- Spacing on the 4px scale: Yes. The bar is 80px, panel padding is 48 and 56px, column gaps 32px, link rows 32px with 6px gaps scaled by density, and the drawer rows 56px.
- Belongs in a Linear, Stripe or Vercel product: Yes. It applies the same restraint those teams use to a luxury storefront: one accent used as a hairline, real hierarchy through scale and tracking, and keyboard parity for every preview.
- Meets its category brief: Yes. Full keyboard support on the disclosure and combobox patterns, visible current location, and a designed drill-down drawer instead of a collapsed list.
- Distinct from every other design in its category: Yes. It is the only centered-wordmark storefront header, and the only menu whose panel previews the hovered item as a drawn product; the others are a morphing Swiss header, a brutalist palette and a dense app sidebar.
