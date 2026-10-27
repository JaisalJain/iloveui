# Boxcar command palette

## Usage notes

- Use it as the global jump-to and command surface of a work tool. It expects a flat index of items with a kind; grouping, matching and scoping happen inside. Results match the label and the meta text (so issue keys such as `BOX-1302` work).
- Keyboard: Cmd+K or Ctrl+K toggles it anywhere; Arrow Up and Down move the active row (wrapping), Enter chooses it, Escape clears the query first and closes on the second press, Backspace on an empty query removes the scope, and `>`, `#` and `@` typed first scope the search. Tab cycles between the field and the close button only, and focus returns to the trigger on close.
- Screen readers: the field is a combobox that points at the active option with `aria-activedescendant`; groups are labelled with their name and count; shortcut chips are announced as "Shortcut C"; a polite live region reports the result count, "No results" and the item being opened.
- Pointer: moving over a row makes it active (moving, not entering, so scrolling under a still pointer does not steal the selection); clicking chooses it; clicking the hatched backdrop closes.
- Responsive: at 375px the panel spans the width minus 12px gutters, meta text and shortcut chips hide, and the list scrolls inside a panel capped at 84% of the viewport height.
- States: `loading` keeps the field usable and shows five static skeleton rows with a "Searching" label and `aria-busy`; `empty` shows an oversized 0 sticker, the query, honest advice and one Create issue option that Enter triggers.
- Motion is 100ms and linear: the active block snaps between rows, the scope sticker stamps in, and Enter presses the row 4px into its shadow before closing. All instant under reduced motion; `--iu-density` sets row height.

## Taste self-review

- One clear focal point: Yes. The accent block with its hard shadow is the only color in the panel and always sits on the row Enter will run.
- Spacing on the 4px scale: Yes. The title strip is 36px, the field row 64px, rows are 8px padded with 32px icon boxes, groups have 12px tops, panel gutters are 16px and every shadow offsets 4 or 8px.
- Belongs in a Linear, Stripe or Vercel product: Yes. Grouped results, recent items, issue keys, shortcut chips and prefix scopes are how the best tools ship a palette; the brutalist outline gives it a voice without losing any of that function.
- Meets its category brief: Yes. Full keyboard support on the combobox pattern, groups with counts, recent items, shortcut chips on every action, a scope sticker that shows where you are searching, plus designed empty and loading states.
- Distinct from every other design in its category: Yes. It is the only modal palette in the category; the other navigation designs are a Swiss marketing header, an app sidebar with an inline quick switcher, and a luxury storefront menu.
