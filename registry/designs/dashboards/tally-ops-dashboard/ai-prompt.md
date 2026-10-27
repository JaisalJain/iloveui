# Tally ops dashboard

## Component

`TallyOpsDashboard` is a complete payments operations shell: a collapsible sidebar (full width or a 56px icon rail), a top bar with a breadcrumb and a date-range segmented control, four KPI tiles and a compact Recent payouts table. Each tile shows a figure with its cents or unit set in a quiet tail, a delta with an arrow, a sign, a semantic color and a written comparison, and an SVG sparkline that ends in an accent dot marking the latest value. Changing the date range is the signature moment: every sparkline wipes in from the left over 400ms while its dot rides the tip of the curve, and every figure counts from what is on screen to its new value with tabular figures, so line, dot and number land together. Under reduced motion the new range appears at once. Below 1024px the sidebar becomes a top bar with a menu drawer (a native modal `<dialog>`), tiles go to a 2 by 2 grid and then one column, and the table becomes a stacked list.

## Props

| Prop                  | Type                                                                 | Default                                                 | Description                                                                                                           |
| --------------------- | -------------------------------------------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `account`             | `{ name: string; detail: string }`                                   | `{ name: "Larkspur Market", detail: "Fivebar · Live" }` | Account switcher label and the line under it.                                                                         |
| `user`                | `{ name: string; role: string }`                                     | `{ name: "Noor Haddad", role: "Payments ops" }`         | Signed-in person, shown as a monogram at the foot of the sidebar.                                                     |
| `navigation`          | `TallyNavGroup[]`                                                    | Payments and Business groups                            | Sidebar groups. Each item has `id`, `label`, `href`, a lucide `icon` and an optional `badge` count.                   |
| `secondaryNavigation` | `TallyNavItem[]`                                                     | Settings                                                | Links pinned to the bottom of the sidebar.                                                                            |
| `currentNavId`        | `string`                                                             | `"overview"`                                            | The item marked with `aria-current="page"` and the accent marker.                                                     |
| `breadcrumbs`         | `TallyBreadcrumb[]`                                                  | Payments / Overview                                     | Trail in the top bar. The last item is the current page and also the page heading.                                    |
| `metrics`             | `TallyMetric[]`                                                      | Gross volume, Net revenue, Failed charges, Dispute rate | Tile definitions: `id`, `label`, `format` (`"currency"`, `"count"` or `"percent"`) and `better` (`"up"` or `"down"`). |
| `ranges`              | `TallyRange[]`                                                       | 7D, 30D, 90D and 12M from one simulated ledger          | Segments of the range control, each with its dates, comparison label and figures keyed by metric id.                  |
| `range`               | `string`                                                             | `undefined`                                             | Controlled range id. Leave it out to let the component manage the selection.                                          |
| `defaultRange`        | `string`                                                             | `"30d"`                                                 | Initial range when uncontrolled.                                                                                      |
| `onRangeChange`       | `(rangeId: string) => void`                                          | `undefined`                                             | Called on every range change, by pointer or arrow keys.                                                               |
| `payouts`             | `TallyPayout[]`                                                      | Seven payouts                                           | Rows of the Recent payouts table, newest first.                                                                       |
| `currency`            | `string`                                                             | `"USD"`                                                 | ISO 4217 code for money figures and amounts.                                                                          |
| `locale`              | `string`                                                             | `"en-US"`                                               | Locale for number formatting.                                                                                         |
| `status`              | `"ready" \| "loading" \| "empty"`                                    | `"ready"`                                               | `loading` renders static skeletons in the final layout; `empty` means the selected range has no data.                 |
| `emptyActionRange`    | `string`                                                             | `"90d"`                                                 | The wider range the empty state's single action switches to.                                                          |
| `onSelectPayout`      | `(payout: TallyPayout) => void`                                      | `undefined`                                             | Called when a payout row is clicked or activated from the keyboard.                                                   |
| `viewAllHref`         | `string`                                                             | `"#payouts"`                                            | Target of the View all link.                                                                                          |
| `defaultCollapsed`    | `boolean`                                                            | `false`                                                 | Start with the icon rail.                                                                                             |
| `onCollapsedChange`   | `(collapsed: boolean) => void`                                       | `undefined`                                             | Called when the rail is toggled; persist the preference here.                                                         |
| `onNavigate`          | `(item: TallyNavItem, event: MouseEvent<HTMLAnchorElement>) => void` | `undefined`                                             | Called on sidebar and drawer link clicks. Call `event.preventDefault()` to route on the client.                       |
| `onAccountClick`      | `() => void`                                                         | `undefined`                                             | Called by the account switcher button.                                                                                |
| `className`           | `string`                                                             | `""`                                                    | Extra classes for the root element.                                                                                   |

`TallyRange` is `{ id: string; short: string; label: string; period: string; previous: string; comparison: string; bucket: string; payoutCount: number; figures: Record<string, TallyFigure> }`. `short` is the segment label ("30D"), `comparison` follows each delta ("prior 30 days") and `bucket` names one sparkline point in the screen reader summary ("day").

`TallyFigure` is `{ value: number; delta: number; series: number[] }`. `delta` is a percent change for currency and count metrics and a change in percentage points for percent metrics; `series` holds one value per bucket, oldest first, with at least two points.

`TallyPayout` is `{ id: string; recipient: string; status: "paid" | "in-transit" | "scheduled" | "on-hold" | "failed"; destination: string; arrival: string | null; amount: number }`. Use `arrival: null` for held and failed payouts.

## Tokens

Reads `--iu-background` (page, sidebar and top bars, and the text on ink fills), `--iu-surface` (KPI tiles, the payouts panel and the drawer), `--iu-border` (every hairline, including the dividers between KPI tiles), `--iu-foreground` (text, sparkline ink and its wash, the selected range chip and the empty state's button), `--iu-muted` (labels, cents and units, comparisons, secondary columns), `--iu-accent` (the sparkline markers, the active navigation marker, the fifth stroke of the logo and focus rings), `--iu-radius` (capped at 6px for panels and controls and 4px for pills), `--iu-font` and `--iu-density` (tile padding and table row height). No text sits on an accent fill, so `--iu-accent-foreground` is not read. Status pills and deltas use emerald, amber and red only to mean success, warning and error, always beside an icon and a word. Add the tokens once with `npx shadcn@latest add @iloveui/tokens`.

## Dependencies

`react`, `motion` (the redraw, the count-up and the short fades) and `lucide-react` (navigation, delta, status and panel icons). Tailwind CSS 4.1 or later. The mobile drawer is a native `<dialog>` opened with `showModal()`, so focus containment, Escape and the backdrop come from the browser.

## Integration steps

1. Run `npx shadcn@latest add @iloveui/tally-ops-dashboard` (or copy `component.tsx` to `components/iloveui/tally-ops-dashboard.tsx`).
2. Make sure the `--iu-*` tokens exist in your global CSS (`npx shadcn@latest add @iloveui/tokens` adds them).
3. Render `<TallyOpsDashboard />` as the payments home page and check it with the demo data before wiring anything.
4. Build `ranges` from your reporting API: for each range return the total, the change against the previous period of the same length and one bucketed series per metric. Keep the four metric ids in `metrics` and `figures` identical.
5. Control the range with `range` and `onRangeChange`. Switch `range` only once that range's figures are in `ranges` (fetch all four up front or keep the previous range selected until the response lands), so the redraw always plays with real numbers.
6. Pass `status="loading"` for the first load only, `status="empty"` when the selected range has no activity, and leave it at `"ready"` while refetching so the screen never flashes skeletons.
7. Map your payouts to `TallyPayout` (newest first, masked destinations, `arrival: null` while held or after a failure) and open the payout detail from `onSelectPayout`.
8. Route sidebar clicks with `onNavigate` (`event.preventDefault()` plus your router), set `currentNavId` and `breadcrumbs` per page, and persist the rail with `defaultCollapsed` and `onCollapsedChange`.

## Customization ideas

- Swap a metric: replace the dispute rate with a refund rate (`format: "percent"`, `better: "down"`) by changing its entry in `metrics` and its key in each range's `figures`; three or five tiles also lay out cleanly.
- Add a Today range with 24 hourly buckets; the segmented control grows by one 44px segment and the redraw works unchanged.
- Replace Recent payouts with disputes awaiting a response: statuses become needs response, under review, won and lost, and the arrival column becomes the evidence due date.
- Turn the shell into a layout: accept `children` and render them in place of the overview content, keeping the sidebar, top bar and range control shared across pages.
- Set `--iu-density` to `0.8` for an operations wall display; tiles and rows tighten while the type scale stays the same.
