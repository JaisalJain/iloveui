# Aldermoor wealth dashboard

## Usage notes

- Use it as the landing page of a private bank, family office or wealth app, where one figure matters most and the rest of the page explains it. It renders as a full page (`min-h-dvh`).
- The chart is a WAI-ARIA slider over the weeks: Tab focuses it, Left and Right (or Up and Down) step one week, Page Up and Page Down step four, Home and End jump to the ends and Escape returns to the latest week. Its value text reads the date and net worth ("12 April 2026: $36,071,620"). With a mouse, moving across it scrubs and leaving it returns to today; on touch, dragging scrubs while vertical scrolling still works (`touch-action: pan-y`).
- Scrubbing updates the serif figure, the change and percentage since the start date, the date in the heading, the allocation bar, and the value, weight and drift of every class in the table, so the April drawdown can be read class by class. The accent hairline fades in only while you are away from today.
- The allocation table has real row headers and a caption that names the date; drift against target is written out ("+2.6 vs target"), never shown by color. Below 512px of width the Target column is dropped; the drift line still carries it.
- The sidebar toggle is a button with `aria-expanded` and `aria-controls`; folded links keep their names and show a label on hover and keyboard focus. Below 1024px a top bar opens the navigation in a native modal drawer that fades in; focus lands on the current page and returns to the menu button on close.
- States: `loading` (static blocks in the final layout, `aria-busy`), `empty` (a serif invitation with one action, Link a custodian, over a dashed baseline). The statement button is disabled until data is ready.
- `--iu-density` scales table and activity rows.

## Taste self-review

- One clear focal point: Yes. The serif net worth figure is the subject of the page; the hairline chart beneath it is its history, and the only accent is the fine mark that ties a week on the chart to the figure.
- Spacing on the 4px scale: Yes. Sections are separated by 48, 56 and 64px, table rows are 14px top and bottom (scaled by density), labels sit 12 to 20px from their rules, and the sidebar rows are 44px.
- Belongs in a Linear, Stripe or Vercel product: Yes. It has the restraint of a premium financial product: exact dollar amounts in tabular figures, internally consistent data (the four classes sum to the figure every week), and a single interaction that answers what the portfolio looked like on any given week.
- Meets its category brief: Yes. Collapsible sidebar with a mobile drawer, a breadcrumb with `aria-current`, realistic metrics with change and drift, a chart drawn in SVG, and designed loading and empty states.
- Distinct from every other design in its category: Yes. It is the catalog's luxury dashboard and the only one built around scrubbing time: the other dashboards redraw sparklines from a date range, morph one chart from pressable KPI cards, or isolate a source inside a bar chart.
