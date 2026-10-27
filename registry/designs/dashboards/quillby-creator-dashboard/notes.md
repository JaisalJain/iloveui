# Quillby creator dashboard

## Usage notes

- Use it as the home of a creator, newsletter or small-business product: four headline metrics, one big chart of whichever metric the reader picks, a goal and the latest work. It renders as a full page (`min-h-dvh`).
- The KPI cards are a WAI-ARIA tablist with automatic activation: Tab lands on the selected card, arrow keys, Home and End move between cards and update the chart, and the chart panel is the `tabpanel` labelled by the selected card. A polite live region names the metric now shown.
- Each card reads as its label, value and delta ("+7.4% in 30 days, up from 4,294"). Deltas carry an arrow, a sign, a semantic color and text; rates change in points, counts and money in percent. Sparklines are decorative inside the card; the big chart is an image with a written summary of its range and end points.
- The chart morphs: the line, the fill and the end marker interpolate to the new series over 550ms while the gridlines and their labels snap to tidy values for the new range. Under reduced motion every change is instant.
- The sidebar toggle is a button with `aria-expanded` and `aria-controls`. Folded, every link keeps its accessible name (the label is visually hidden) and shows a tooltip on hover and keyboard focus. Below 1024px the sidebar becomes a top bar with a menu button that opens a native modal drawer: focus lands on the current page, Escape, the close button, the backdrop or a link close it, and focus returns to the menu button.
- Layout follows the content width with container queries: four cards in a row from 768px, two by two below it; the chart takes eight of twelve columns from 1024px with the goal and issues beside it, and stacks below.
- States: `loading` keeps every card, the chart frame, the ring and the list as static skeletons with `aria-busy`; `empty` shows zeros, a drawn envelope illustration and one action, "Write your first issue".
- `--iu-density` scales card and row padding.

## Taste self-review

- One clear focal point: Yes. The selected card and the chart it drives are the only large accent on a calm page; pressing a different card moves the accent and morphs the curve, so the eye always knows what is being measured.
- Spacing on the 4px scale: Yes. Cards sit 12px apart on phones and 16px on wider screens, pad 16 and 20px (24px for the chart from 672px), the sidebar pads 12px with 44px rows, and section gaps are 16, 24 and 32px.
- Belongs in a Linear, Stripe or Vercel product: Yes. Honest numbers with tabular figures, semantic deltas with written comparisons, a tidy-tick chart and a sidebar that folds without moving its icons read like a product people open every morning, with a soft material that suits a creator tool.
- Meets its category brief: Yes. Collapsible sidebar with a drawer on small screens, a breadcrumb with `aria-current`, realistic and internally consistent metrics (241 members at $7 is $1,687) with deltas, sparklines and a chart drawn in SVG, and designed empty and loading states.
- Distinct from every other design in its category: Yes. It is the catalog's soft, creator-facing dashboard, and the only one where the KPI cards are pressable tabs that morph a single large chart; the data-dense payments shell redraws every sparkline from a date range instead.
