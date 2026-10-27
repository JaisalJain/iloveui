# Kestrel signal bento

## Usage notes

- Use it as the features section of an observability, finance or operations product, or as the overview screen itself. It is a full-width section that wants at least 1024px to show all five panels side by side.
- The chart is a `role="slider"` labelled "Inspect minute" with a value text that reads the time, p95 and error rate. Arrow keys move one minute, Page Up and Page Down ten, Home and End jump to the ends. A mouse scrubs on hover; touch and pen scrub by dragging while vertical page scroll still works.
- The other panels update in place without live-region chatter: the slider's value text carries the summary, and every panel keeps its own heading so screen reader users can jump to it. The endpoints are a real table with a caption and row headers; deltas carry an arrow, a sign, a color and a spoken comparison.
- The log filter is a toggle button (`aria-pressed`). When a minute has no errors or warnings, an empty state explains it and offers one action: show all lines.
- Layout: one column at 375px with the KPIs in a 2 by 2 grid, a full-width chart and KPI row of four at 768px, and a 12-column wall at 1024px and up.
- Motion: 100ms transitions on the cursor, dots and bars only; instant under reduced motion. Nothing loops.
- `status="loading"` keeps every panel and header in place and fills them with static skeletons in the final layout.

## Taste self-review

- One clear focal point: Yes. The chart is the largest panel and holds the only accent: the cursor line and its dots, which the eye follows into every other panel through the matching accent markers on the sparklines.
- Spacing on the 4px scale: Yes. Panels sit 8px apart with 12px padding, rows use 6 and 8px times density, header bars are 40px; type steps between 11, 12, 15, 22 and 28px.
- Belongs in a Linear, Stripe or Vercel product: Yes. Hairline panels, tabular mono figures, honest SVG charts with a deploy marker and an incident window read like a tool an on-call engineer trusts at 3am.
- Meets its category brief: Yes. Five cells in four sizes (8, 4, 5, 4 and 3 columns) with a clear reading order from symptom to cause, and every cell proves a feature with a working mini UI: chart, KPI tiles, log tail, ranked table and budget gauge.
- Distinct from every other design in its category: Yes. It is the only data-dense bento, and its interaction (one time cursor driving five panels at once) appears nowhere else in the catalog.
