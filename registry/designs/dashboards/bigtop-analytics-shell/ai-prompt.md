# Bigtop analytics shell

## Component

`BigtopAnalyticsShell` is a full-page web analytics screen in a neo-brutalist style: 2px ink outlines, hard offset shadows, uppercase type and mono labels. A sidebar collapses to a 76px icon strip (a drop-down sheet on small screens), a slash breadcrumb sits over an oversized page title, and four KPI blocks show a value, a tilted delta sticker and a stepped SVG sparkline. The centre is a chunky bar chart of visitors per day with a peak sticker. Pressing a traffic source in the Sources list isolates it: every bar empties to an outline and the source's share rises through them in a stepped cascade, while the total, the share chip and the peak sticker switch to that source. A top-pages table with inline bars completes the page. Loading, empty (tracking snippet with a copy button) and error (retry) states are designed.

## Props

| Prop                | Type                                         | Default                               | Description                                                             |
| ------------------- | -------------------------------------------- | ------------------------------------- | ----------------------------------------------------------------------- |
| `site`              | `string`                                     | `"lowtide.dev"`                       | The tracked site, shown in the sidebar, top bar and empty state.        |
| `breadcrumbs`       | `string[]`                                   | `["Sites", "lowtide.dev", "Traffic"]` | The last crumb is the current page.                                     |
| `navigation`        | `BigtopNavItem[]`                            | Six items                             | `{ id, label, icon, href }`.                                            |
| `currentNavId`      | `string`                                     | `"traffic"`                           | Marks the current link with `aria-current="page"`.                      |
| `kpis`              | `BigtopKpi[]`                                | Four KPIs                             | `{ id, label, value, change, unit, higherIsBetter, series }`.           |
| `sources`           | `BigtopSource[]`                             | Five sources, 14 days                 | `{ id, label, daily }`; bar heights are the sum of all sources per day. |
| `startDate`         | `string` (ISO date)                          | `"2026-10-14"`                        | First day of every `daily` series.                                      |
| `pages`             | `BigtopPage[]`                               | Five pages                            | `{ path, visitors }`, sorted by you.                                    |
| `status`            | `"ready" \| "loading" \| "empty" \| "error"` | `"ready"`                             | Data state.                                                             |
| `errorMessage`      | `string`                                     | Timeout sentence                      | Body of the error panel.                                                |
| `snippet`           | `string`                                     | Script tag                            | Tracking tag shown and copied in the empty state.                       |
| `defaultSourceId`   | `string \| null`                             | `null`                                | Source isolated on first render.                                        |
| `defaultCollapsed`  | `boolean`                                    | `false`                               | Start with the sidebar as an icon strip.                                |
| `onCollapsedChange` | `(collapsed: boolean) => void`               | none                                  | Persist the sidebar preference.                                         |
| `onSourceChange`    | `(sourceId: string \| null) => void`         | none                                  | Called when a source is isolated or released.                           |
| `onNavigate`        | `(item, event) => void`                      | none                                  | Route with your router.                                                 |
| `onExport`          | `() => void`                                 | none                                  | Export CSV (disabled unless data is ready).                             |
| `onRetry`           | `() => void`                                 | none                                  | The error state's only action.                                          |
| `onCopySnippet`     | `(snippet: string) => void`                  | none                                  | Called after the snippet is copied to the clipboard.                    |
| `className`         | `string`                                     | `""`                                  | Extra classes on the root.                                              |

## Tokens

Reads `--iu-foreground` (every outline, ink bars, hard shadows and text), `--iu-background` and `--iu-surface` (page and blocks), `--iu-muted` (labels; `--iu-border` is unused because outlines are ink), `--iu-accent` and `--iu-accent-foreground` (the isolated source, its share in the bars, the share chip, the logo and the empty and error actions), `--iu-radius` (capped at 4px), `--iu-font` and `--iu-density` (block and row padding). In dark mode the hard shadows soften to a 38% ink so white outlines do not double up. Add the tokens with `npx shadcn@latest add @iloveui/tokens`.

## Dependencies

`react` and `lucide-react`. All motion is CSS (100ms linear presses, a stepped height transition with an 18ms stagger per bar). Tailwind CSS 4.1 or later.

## Integration steps

1. Run `npx shadcn@latest add @iloveui/bigtop-analytics-shell` (or copy `component.tsx` into `components/iloveui/`).
2. Add the `--iu-*` tokens to your global CSS (`npx shadcn@latest add @iloveui/tokens`).
3. Render `<BigtopAnalyticsShell />` as the whole page; it sets `min-h-dvh` and owns the sidebar.
4. Feed `sources` from your analytics API as daily visitor counts per source, all the same length, starting at `startDate`. Format KPI `value` strings yourself and pass `change` with `unit` and `higherIsBetter` so bounce rate falling reads as good news.
5. Use `status="loading"` while fetching, `"error"` with `onRetry` when the request fails and `"empty"` for a site with no visits; wire `onExport`, `onNavigate` and `onSourceChange` (for example to sync `?source=hn` in the URL).

## Customization ideas

- Swap visitors for signups or revenue; sources become plans or countries and the isolate interaction still explains the peak.
- Add a range control beside the date sticker and refetch `sources` per range.
- Let Top pages follow the isolated source by passing `pages` per source from `onSourceChange`.
- Replace the stepped sparklines with bar sparklines for a heavier look.
- Raise `--iu-radius` to 4px for slightly softened blocks; the family caps it there.
