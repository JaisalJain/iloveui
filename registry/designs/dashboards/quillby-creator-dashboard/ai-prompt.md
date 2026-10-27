# Quillby creator dashboard

## Component

`QuillbyCreatorDashboard` is the home screen of a newsletter or creator product, built from soft, pressable material. A floating sidebar folds down to an icon dock; a breadcrumb and greeting lead into four KPI cards (subscribers, open rate, paid members, revenue), each with a delta chip and an SVG sparkline. The cards are tabs: pressing one sinks it into the surface and the large area chart below morphs its curve, gridlines and end marker to that metric. Beside the chart, a goal ring and a list of recent issues with open-rate bars. It has designed loading (static skeletons in the final layout) and empty (first issue not sent yet) states.

## Props

| Prop                | Type                               | Default                       | Description                                                                  |
| ------------------- | ---------------------------------- | ----------------------------- | ---------------------------------------------------------------------------- |
| `product`           | `string`                           | `"Quillby"`                   | Product name in the sidebar and empty-state copy.                            |
| `publication`       | `{ name: string; detail: string }` | Slow Kettle, weekly           | Publication card at the foot of the sidebar.                                 |
| `author`            | `string`                           | `"Noor Haddad"`               | Signed-in person; drives the monogram.                                       |
| `greeting`          | `string`                           | `"Good morning, Noor"`        | Page heading.                                                                |
| `summary`           | `string`                           | Next-issue sentence           | Sentence under the heading.                                                  |
| `navigation`        | `QuillbyNavItem[]`                 | Six items                     | Sidebar links: `{ id, label, icon, href, count? }`.                          |
| `currentNavId`      | `string`                           | `"home"`                      | Marks the current link with `aria-current="page"`.                           |
| `breadcrumbs`       | `string[]`                         | `["Slow Kettle", "Overview"]` | The last crumb is the current page.                                          |
| `metrics`           | `QuillbyMetric[]`                  | Four metrics, 30 days         | `{ id, label, icon, format, value, previous, series, description }`.         |
| `defaultMetricId`   | `string`                           | first metric                  | The card selected on first render.                                           |
| `startDate`         | `string` (ISO date)                | `"2026-09-28"`                | Date of the first point in every series; drives axis labels.                 |
| `goal`              | `{ target; label; byDate }`        | 5,000 by New Year             | Goal ring, measured against the `subscribers` metric.                        |
| `issues`            | `QuillbyIssue[]`                   | Three issues                  | Recent issues with open rate and send date.                                  |
| `status`            | `"ready" \| "loading" \| "empty"`  | `"ready"`                     | Data state.                                                                  |
| `defaultCollapsed`  | `boolean`                          | `false`                       | Start with the sidebar folded to icons.                                      |
| `onCollapsedChange` | `(collapsed: boolean) => void`     | none                          | Persist the sidebar preference.                                              |
| `onMetricChange`    | `(metricId: string) => void`       | none                          | Called when a KPI card is selected.                                          |
| `onNavigate`        | `(item, event) => void`            | none                          | Route with your router; call `event.preventDefault()` for client navigation. |
| `onWriteIssue`      | `() => void`                       | none                          | The primary action (and the empty state's only action).                      |
| `onOpenIssue`       | `(issue: QuillbyIssue) => void`    | none                          | Opens an issue from the recent list.                                         |
| `className`         | `string`                           | `""`                          | Extra classes on the root.                                                   |

## Tokens

Reads `--iu-background` (page), `--iu-surface` (cards, sidebar), `--iu-border` (card edges), `--iu-foreground` and `--iu-muted` (text, tints, gridlines), `--iu-accent` and `--iu-accent-foreground` (primary button, selected card tint and icon, chart line and fill, goal ring, open-rate bars, focus rings), `--iu-radius` (floored at 20px for cards and 14px for rows), `--iu-font` and `--iu-density` (card and row padding). Add them once with `npx shadcn@latest add @iloveui/tokens`.

## Dependencies

`react`, `motion` (path morph, card press, value cross-fade) and `lucide-react` (navigation and metric icons). Tailwind CSS 4.1 or later.

## Integration steps

1. Run `npx shadcn@latest add @iloveui/quillby-creator-dashboard` (or copy `component.tsx` into `components/iloveui/`).
2. Make sure the `--iu-*` tokens exist in your global CSS (`npx shadcn@latest add @iloveui/tokens`).
3. Render it as the whole page: `<QuillbyCreatorDashboard />` sets `min-h-dvh` and owns the sidebar.
4. Map your analytics into `metrics`: one value per day, oldest first, all series the same length; `previous` is the value at the start of the range. Use `format: "percent"` for rates (deltas show in points).
5. Pass `status="loading"` while fetching and `status="empty"` before the first send; wire `onWriteIssue` to your editor.
6. Wire `onNavigate` to your router and pass `currentNavId` and `breadcrumbs` per route; store `onCollapsedChange` in user preferences.

## Customization ideas

- Swap the four metrics for a fitness or shop product (sessions, minutes, streak, revenue); the cards, chart and ring follow the data.
- Add a range control above the chart and recompute `series` and `previous` per range.
- Replace the goal ring with a payout card that shows the next transfer date and amount.
- Add a fifth card for unsubscribes and set `previous` higher than `value` to show a down delta.
- Set `defaultCollapsed` on smaller laptops to give the chart more width.
