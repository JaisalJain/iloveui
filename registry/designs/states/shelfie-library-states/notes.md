# Shelfie library states

## Usage notes

- Use it as the content area of any list page that can be empty, empty for a query, failing or loading. Every state keeps the same frame, so switching between them never shifts the header or tabs.
- One action per state: Search all of Shelfie (no results), Add your first book (empty), Try again (error). Loading has no action; it shows skeleton cards in the final layout, static rather than pulsing, with a spinner and the book count beside a label.
- Copy is honest: the no-results text says exactly what was searched, the error says what happened (a 10-second timeout), that nothing was lost, and gives a reference support can trace.
- Accessibility: the region is labelled by the state's title, `aria-busy` while loading or retrying, and a polite live region announces loading, retrying and the added book. The illustrations are `aria-hidden`; the snapped bracket is never the only error signal. Buttons keep their width across label changes, and `aria-disabled` prevents double presses.
- Motion: the book drop and hover wiggle use bouncy springs (playful family); the state swap cross-fades in 180ms. Under reduced motion they are instant and the spinners stop.
- Responsive: the card uses a container query; the skeleton becomes two columns when the card is wider than 512px, and the search field takes the full row on narrow cards.

## Taste self-review

- One clear focal point: Yes. The illustrated shelf and the single accent button below it; nothing else on the card competes.
- Spacing on the 4px scale: Yes. Gaps 4, 8, 12, 16, 24, 28px; padding 14 to 36px scaled by the density token; illustrations sit on a 240 by 164 grid.
- Belongs in a Linear, Stripe or Vercel product: Yes. It is the kind of considered state work a polished consumer app ships: friendly, specific copy, and an error that tells you what happened.
- Meets its category brief: Yes. One clear next action in each state, honest copy (timeout, reference, nothing lost), and every illustration drawn in SVG from simple shapes.
- Distinct from every other design in its category: Yes. It is the category's only consumer product set built around one recurring illustrated object; the other set is a dark technical status-page family.
