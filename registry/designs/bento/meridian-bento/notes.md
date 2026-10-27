# Meridian scheduling bento

## Usage notes

- Use it as the features section of a scheduling, calendar or team-coordination product. It is a full-width section; on its own page it reads below the hero.
- Reading order follows the grid: heading, then 01 (the interactive finder, the widest cell), 02 (the tall booking card), 03 and 04, and 05 across the full width.
- The meeting block is a `role="slider"` with a visible label. Arrow keys move it by 30 minutes, Page Up and Page Down by an hour, Home and End jump to the ends. Its value text reads the time range and how many people are in working hours, so screen readers hear the result on every step. Pointer users drag anywhere on the track.
- The hour strips are decorative (`aria-hidden`); each row's name, local time and "In hours" or "Off hours" text carry the information, with a check or moon icon so status never relies on color.
- Layout: one column at 375px with each row's strip under its name, two columns at 768px, and a 12-column grid at 1024px and up where the booking card spans two rows. The strips and the slider share one grid template, so the bands and the block line up exactly.
- Motion: the block and bands glide for 150ms ease-out and local times cross-fade. Under reduced motion both are instant. Nothing loops.

## Taste self-review

- One clear focal point: Yes. The meeting block is the only accent on the page, and its bands line up through every row of the finder, so the eye goes straight to the one thing you can move.
- Spacing on the 4px scale: Yes. Cell padding is 24px or 32px times the density token, rows use 12px, gaps 8, 12, 16 and 24px; the cell grid is 1px rules on a 12-column grid.
- Belongs in a Linear, Stripe or Vercel product: Yes. Monochrome hairline cells, monospaced times, black primary fills and one restrained signal color read like a serious calendar tool's marketing page.
- Meets its category brief: Yes. Five cells in four sizes (8 columns, a tall 4-column card, two 4-column cells and a full-width row) in a clear numbered reading order, and every cell proves its feature with a mini UI: a time-zone finder, a booking card, a buffered day, a focus-hours chart and a sync list.
- Distinct from every other design in its category: Yes. It is the category's only strict Swiss ruled grid, and its interaction (dragging one meeting across several time zones) appears nowhere else in the catalog.
