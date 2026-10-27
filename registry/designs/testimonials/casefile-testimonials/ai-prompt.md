# Casefile evidence

## Component

`CasefileTestimonials` is a social-proof section built on evidence instead of praise. Each customer story is a compact card: a monogram, name, role and company, industry and company size, a two-line quote, the metric that customer leads with (first response, CSAT or tickets resolved without an agent) as a before-to-after figure with a semantic delta, a twelve-week SVG chart with a dashed rollout marker, and a three-cell readout of their current numbers. Above the grid, industry and company-size filter chips (with live counts) narrow the stories, and four KPI tiles recompute the medians for the current selection, stepping to each new figure. Cards that stay glide to their new place, new ones fade in, and every chart reveals itself left to right once when it first comes into view.

## Props

| Prop              | Type                                   | Default                               | Description                                                            |
| ----------------- | -------------------------------------- | ------------------------------------- | ---------------------------------------------------------------------- |
| `product`         | `string`                               | `"Sorrel"`                            | Your product name, used in the kicker and the methodology note.        |
| `kicker`          | `string`                               | `"Customer evidence"`                 | Small mono label above the headline.                                   |
| `headline`        | `string`                               | `"Proof, measured before and after."` | Section heading.                                                       |
| `subline`         | `string`                               | Methodology sentence                  | Supporting sentence.                                                   |
| `stories`         | `CasefileStory[]`                      | Nine stories                          | See the type below.                                                    |
| `industries`      | `string[]`                             | derived from `stories`                | Industry chips, in order.                                              |
| `defaultIndustry` | `string`                               | `"all"`                               | Industry selected first.                                               |
| `defaultSize`     | `"all" \| "small" \| "mid" \| "large"` | `"all"`                               | Company size selected first (1–200, 201–1k, 1k+).                      |
| `weeks`           | `number`                               | `12`                                  | Weeks charted per story.                                               |
| `liveWeek`        | `number`                               | `4`                                   | Zero-based week of rollout, where the dashed marker sits.              |
| `status`          | `"ready" \| "loading"`                 | `"ready"`                             | `"loading"` shows static skeleton tiles and cards in the final layout. |
| `onOpenStory`     | `(id: string) => void`                 | none                                  | When set, each card gets a "Read the … story" button.                  |
| `className`       | `string`                               | `""`                                  | Extra classes for the `<section>`.                                     |

`CasefileStory` is `{ id; name; role; company; industry; size; quote; headline: "response" | "csat" | "deflection"; response: [beforeMinutes, afterMinutes]; csat: [before, after]; deflection: number; rolledOut: string; agents: number }`.

## Tokens

Reads `--iu-background` (section), `--iu-surface` (cards and KPI tiles), `--iu-border` (hairlines), `--iu-foreground` (text, monogram and skeleton tints), `--iu-muted` (labels, the pre-rollout line and the rollout marker), `--iu-accent` (active filter chips, the post-rollout line and its faint area, focus rings), `--iu-radius` (capped at 6px), `--iu-font` and `--iu-density` (card and tile padding). Deltas use emerald or red with an arrow, a sign and spoken text. Add the tokens with `npx shadcn@latest add @iloveui/tokens`.

## Dependencies

`react`, `motion` (layout reflow, KPI tickers and the chart reveal) and `lucide-react` (delta arrows and the clear-filters icon). Tailwind CSS 4.1 or later.

## Integration steps

1. Run `npx shadcn@latest add @iloveui/casefile-testimonials` (or copy `component.tsx` to `components/iloveui/casefile-testimonials.tsx`).
2. Make sure the `--iu-*` tokens exist in your global CSS.
3. Replace `stories` with real, approved customer numbers. Only publish figures customers have signed off, and keep the methodology note accurate.
4. Wire `onOpenStory` to your case study pages, or leave it unset to drop the button.
5. Render with `status="loading"` while stories load from your CMS.

## Customization ideas

- Swap the three metrics for your product's own (deploy frequency, build minutes, revenue recovered).
- Add a region filter group beside industry and size.
- Plot real weekly series from your warehouse instead of the generated curve.
- Sort cards by largest improvement when a filter is active.
- Add a "Share this view" link that writes the filters into the URL.
