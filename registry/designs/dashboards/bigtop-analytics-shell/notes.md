# Bigtop analytics shell

## Usage notes

- Use it as the main traffic page of a web analytics, link or newsletter product where people want to know where a spike came from. It renders as a full page (`min-h-dvh`).
- The Sources list is a set of toggle buttons (`aria-pressed`). Pressing one isolates it; pressing it again, or another source, changes the selection. The chart is an image whose label is rewritten for the selection ("Hacker News visitors per day ... peaking at 1,684 on Oct 21, 47% of that day's visitors") and a polite live region says "Showing Hacker News only".
- Isolating keeps the scale of all visitors, so each accent segment shows the source's real share of the day: the Oct 21 spike visibly belongs to Hacker News. Segments rise in four steps over 100ms with an 18ms stagger left to right; under reduced motion the change is instant.
- Deltas are stickers with an arrow, a sign, a semantic color and screen reader text that says whether the change is an improvement (bounce rate going down is green).
- The sidebar toggle is a button with `aria-expanded` and `aria-controls`; collapsed links keep their names and show a sticker tooltip on hover and keyboard focus. Below 1024px a top bar opens the navigation as a native modal sheet that drops from the top: focus lands on the current page, Escape, the close button, the backdrop or a link close it, and focus returns to the menu button.
- Container queries: four KPI blocks from 896px and two by two below; from 1024px the chart takes eight columns and grows to the height of the Sources and Top pages column beside it.
- States: `loading` (static skeleton blocks in the final layout, `aria-busy`), `empty` (zeros, dashed flat lines and the tracking snippet with one Copy action), `error` (an alert with the reason and one Try again action). Export is disabled until data is ready.
- `--iu-density` scales block padding and table rows.

## Taste self-review

- One clear focal point: Yes. The ink bar chart is the heaviest object on the page, the peak sticker names its tallest bar, and the only accent fill appears when a source is pressed, inside those same bars.
- Spacing on the 4px scale: Yes. Blocks sit 16 and 24px apart with 16 and 24px padding, source rows are 44px with 8px gaps, offset shadows are 3 and 4px, and outlines are 2px.
- Belongs in a Linear, Stripe or Vercel product: Yes. Under the loud styling it is an honest analytics page: tabular figures, deltas with stated comparisons, one control that answers the real question (where did that spike come from) and full keyboard and screen reader support.
- Meets its category brief: Yes. Collapsible sidebar with a mobile sheet, slash breadcrumb with `aria-current`, consistent metrics (24,844 visitors equal the sum of the five sources), stepped SVG sparklines and a bold chart, and designed loading, empty and error states.
- Distinct from every other design in its category: Yes. It is the catalog's neo-brutalist dashboard and the only one whose interaction isolates a segment inside a bar chart; the other dashboards redraw sparklines from a date range or morph one chart from pressable KPI cards.
