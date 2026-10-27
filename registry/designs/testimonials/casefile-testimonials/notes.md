# Casefile evidence

## Usage notes

- Use it on a customers page or late on a landing page for a product whose value is measurable: support, billing, infrastructure, analytics. It expects six to twelve stories with real before-and-after numbers; the defaults show the shape of the data.
- Filters are two groups of toggle buttons (`aria-pressed`), one per dimension, each with a live count of the stories it would show given the other filter. A polite live region announces the number of matching stories and the active filters. Sizes are shown as 1–200, 201–1k and 1k+ and read as full phrases.
- Each card is an `article` labelled by the person's name. The quote is a `blockquote`. The chart is an `img` with a sentence that states the metric, the period, the rollout week and the before and after values; the headline figure reads "4h 12m to 38m". Deltas are never color only: an arrow, a sign, emerald or red, and a spoken "an improvement" or "a decline".
- The KPI tiles are a description list recomputed from the visible stories (medians, so one outlier does not carry the claim). With no matches they show dashes and the grid becomes an empty state that names the filters and offers Clear filters.
- Layout follows its own width through container queries: one column of cards, two from 42rem, three from 64rem; KPI tiles go from two by two to four in a row. Filter chips wrap; they are 40px tall on touch screens.
- States: default, loading (static skeleton tiles and six skeleton cards in the final layout) and empty. Motion lasts 100 to 400ms (900ms for a chart reveal), plays only on filter changes and first view, and is off under reduced motion. `--iu-density` scales the card and tile padding.

## Taste self-review

- One clear focal point: Yes. The before-to-after figure and its chart on each card, with the accent reserved for the post-rollout line, so the eye reads every card from claim to proof.
- Spacing on the 4px scale: Yes. Card padding 16px scaled by density, grid gaps 16px, chip gaps 6px, tile padding 16px by 14px, section padding 48 and 64px.
- Belongs in a Linear, Stripe or Vercel product: Yes. It reads like a customers page backed by a metrics warehouse: mono figures, hairline tables, honest methodology and no stars.
- Meets its category brief: Yes. Invented but plausible people with roles and companies, monogram avatars, and evidence in place of star ratings.
- Distinct from every other design in its category: Yes. Margin notes is an editorial pull-quote spread; this is a filterable grid of measured outcomes with charts and recomputed medians.
