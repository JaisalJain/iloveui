# Aldermoor wealth dashboard

## Component

`AldermoorWealthDashboard` is the overview page of a private wealth or family-office portal in a luxury style: a large serif net worth figure, a single hairline chart of the last twelve months, an allocation table, recent activity and the next review. A quiet sidebar (uppercase, wide-tracked labels with a fine accent mark on the current page) folds to an icon rail and becomes a drawer on small screens; a breadcrumb leads the page. The chart is a scrubbable slider: move a pointer across it, or focus it and use the arrow keys, and an accent hairline follows while the serif figure, the change since the start, the date, the allocation bar and every row of the allocation table rewind to that week. Loading and empty (no custodians linked) states are designed.

## Props

| Prop                  | Type                                    | Default                         | Description                                                     |
| --------------------- | --------------------------------------- | ------------------------------- | --------------------------------------------------------------- |
| `firm`                | `string`                                | `"Aldermoor"`                   | Wordmark in the sidebar and top bar.                            |
| `client`              | `string`                                | `"Ishikawa Family Trust"`       | Whose wealth is shown; used in the page heading.                |
| `breadcrumbs`         | `string[]`                              | Clients / client / Overview     | The last crumb is the current page.                             |
| `navigation`          | `AldermoorNavItem[]`                    | Six items                       | `{ id, label, icon, href }`.                                    |
| `currentNavId`        | `string`                                | `"overview"`                    | Marks the current link with `aria-current="page"`.              |
| `advisor`             | `{ name: string; role: string }`        | Elena Marchetti                 | Shown in the sidebar and the review card.                       |
| `startDate`           | `string` (ISO date)                     | `"2025-11-02"`                  | Date of the first weekly point.                                 |
| `assetClasses`        | `AldermoorAssetClass[]`                 | Four classes, 52 weeks          | `{ id, label, target, values }`; net worth is the sum per week. |
| `activity`            | `AldermoorActivity[]`                   | Four entries                    | `{ id, date, title, detail, amount }`, newest first.            |
| `nextReview`          | `string`                                | `"Thursday 12 November, 10:00"` | Next meeting, set in serif.                                     |
| `currency`            | `string`                                | `"USD"`                         | ISO currency for every amount.                                  |
| `status`              | `"ready" \| "loading" \| "empty"`       | `"ready"`                       | Data state.                                                     |
| `defaultCollapsed`    | `boolean`                               | `false`                         | Start with the sidebar folded.                                  |
| `onCollapsedChange`   | `(collapsed: boolean) => void`          | none                            | Persist the sidebar preference.                                 |
| `onNavigate`          | `(item, event) => void`                 | none                            | Route with your router.                                         |
| `onDownloadStatement` | `() => void`                            | none                            | The statement button (disabled until data is ready).            |
| `onLinkAccount`       | `() => void`                            | none                            | The empty state's only action.                                  |
| `onScrub`             | `(date: string, total: number) => void` | none                            | Called as the reader scrubs, for analytics or a linked view.    |
| `className`           | `string`                                | `""`                            | Extra classes on the root.                                      |

## Tokens

Reads `--iu-background` and `--iu-surface` (page, sidebar), `--iu-border` (hairlines), `--iu-foreground` (type, the chart line, allocation shades as foreground at four strengths), `--iu-muted` (labels), `--iu-accent` (only the current-page mark, the scrub hairline, the end dot and focus rings), `--iu-radius` (capped at 2px for the review frame; buttons are full pills by design), `--iu-font` and `--iu-density` (table and activity rows). The serif comes from your `font-serif`. Add the tokens with `npx shadcn@latest add @iloveui/tokens`.

## Dependencies

`react` and `lucide-react`. Motion is CSS only: 300ms fades for the hairline and links, 500ms width transitions for the allocation bar and the sidebar. Tailwind CSS 4.1 or later.

## Integration steps

1. Run `npx shadcn@latest add @iloveui/aldermoor-wealth-dashboard` (or copy `component.tsx` into `components/iloveui/`).
2. Add the `--iu-*` tokens to your global CSS (`npx shadcn@latest add @iloveui/tokens`) and make sure `font-serif` maps to a refined serif.
3. Render it as the whole page; it sets `min-h-dvh` and owns the sidebar.
4. Map your positions into `assetClasses`: one market value per week per class, all the same length, starting at `startDate`, with the policy `target` weight.
5. Use `status="loading"` while positions load and `status="empty"` for a client with no linked custodian; wire `onLinkAccount`, `onDownloadStatement` and `onNavigate`.

## Customization ideas

- Switch to daily points for a one-month view; the scrubber, figure and allocation follow any series length.
- Add a fifth class (real assets, art) and a fifth shade.
- Show realized and unrealized gains under the figure, driven by the same scrub index.
- Feed `onScrub` into the activity list to highlight the entries around the week on screen.
- Set `currency="EUR"` or `"GBP"` for European offices; every amount formats with `Intl`.
