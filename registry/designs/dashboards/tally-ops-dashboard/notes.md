# Tally ops dashboard

## Usage notes

- Use it as the home of a payments, billing or finance product: the KPI strip summarizes one period against the previous one, and the table shows the latest money moving out. It renders as a full page (`min-h-dvh`), so give it the whole viewport rather than a column.
- Each range carries one figure per metric: the value, its change (percent for money and counts, percentage points for rates) and a bucketed series, oldest first. `better` decides whether a delta reads as an improvement, so failed charges falling shows in green with a down arrow.
- Deltas never rely on color: each has an arrow, a sign, a semantic color and a written comparison, and screen readers also hear "an improvement" or "a deterioration". Sparklines are images with a summary ("Gross volume per day, last 30 days: low $37,052, high $48,981").
- Keyboard and screen readers: the sidebar toggle is a button with `aria-expanded` and `aria-controls`; in the rail each link keeps its name (the label is visually hidden, not removed) and shows a tooltip on hover and keyboard focus. The breadcrumb is a `nav` with `aria-current="page"` on the current page. The date range is a native radio group (Tab in, arrow keys move the selection), and a polite live region announces the new range. Each payout row is one button target with a focus ring around the whole row.
- Below 1024px the sidebar becomes a top bar with the account and a menu button. The drawer is a native modal dialog: focus lands on the current page, Tab stays inside, Escape, the close button, the backdrop or a link close it, and focus returns to the menu button.
- Layout follows the content width through container queries: four tiles at 896px, a 2 by 2 grid from 576px and one column below it, where each sparkline sits beside its figures. The table shows destination and payout id from 896px and becomes a stacked list below 672px.
- Motion: the range redraw (400ms, the clip, the riding marker and the count-up share one curve), 150ms fades for deltas and dates, a 150ms rail width change and a 200ms drawer slide. Everything is interruptible and instant under reduced motion; nothing loops.
- States: `loading` keeps the shell and draws static skeletons in the final layout with `aria-busy`; `empty` shows zeros, flat lines and one action that widens the range.
- `--iu-density` sets tile padding and row height, so a compact theme tightens the data without touching the type scale.

## Taste self-review

- One clear focal point: Yes. The KPI strip leads: four large tabular figures over ink sparklines, each ending in a single accent dot that marks now, while the sidebar, top bar and table stay quiet and monochrome around it.
- Spacing on the 4px scale: Yes. Gaps and paddings are 4, 8, 12, 16, 20 and 24px (only the 2px inset inside the range control sits below it); tile padding and row padding scale from 16px and 8px with the density token; the sidebar header and top bar share 56px so their hairlines meet, and every sidebar label starts on the same 48px line.
- Belongs in a Linear, Stripe or Vercel product: Yes. A hairline-divided KPI strip, cents set in a quiet tail, monospaced amounts and bank masks, restrained status pills with icons, a segmented range control and a rail that keeps every icon in place read like a tool people run payments on all day.
- Meets its category brief: Yes. The sidebar collapses to a rail with `aria-expanded`, the breadcrumb marks the current page, the metrics are realistic and internally consistent across ranges with arrow, sign, color and text deltas, the sparklines are drawn in SVG, and the empty and loading states are designed.
- Distinct from every other design in its category: Yes. It is the catalog's payments operations shell, and the only dashboard whose date range redraws every sparkline with a marker riding the curve while each figure tallies to its new value in step.
