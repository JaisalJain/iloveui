# Tessera invoice table

## Component

`TesseraInvoiceTable` is a dense, data-first invoices table for a billing or finance screen. A header states the outstanding and overdue totals, status filter chips carry live counts, and a search narrows by customer or invoice number. Below them sits a one-line selection strip: with nothing selected it reads the row count and current sort; select rows and it becomes the bulk action bar, rolling the selection's outstanding total to its new value as you check boxes or shift-click a range. The table has a sticky header inside its own scroll area, sortable columns with `aria-sort`, inline collected-amount bars, zebra rows, and real pagination. Under a 672px container it switches to stacked cards with a sort menu and the same selection model. Loading shows static skeleton rows, and the empty and error states each offer one action.

## Props

| Prop              | Type                                                          | Default                            | Description                                                          |
| ----------------- | ------------------------------------------------------------- | ---------------------------------- | -------------------------------------------------------------------- |
| `title`           | `string`                                                      | `"Invoices"`                       | Heading of the panel.                                                |
| `invoices`        | `TesseraInvoice[]`                                            | 24 sample invoices                 | Rows. An empty array renders the "No invoices yet" state.            |
| `today`           | `string` (ISO date)                                           | `"2026-10-27"`                     | Reference date for overdue and due-in figures. Pass today's date.    |
| `currency`        | `string`                                                      | `"USD"`                            | ISO 4217 code for `Intl.NumberFormat`.                               |
| `locale`          | `string`                                                      | `"en-US"`                          | Locale for money and dates.                                          |
| `pageSize`        | `number`                                                      | `8`                                | Rows per page.                                                       |
| `defaultSort`     | `{ key: "id" \| "customer" \| "due" \| "amount"; direction }` | `{ key: "id", direction: "desc" }` | Initial sort.                                                        |
| `defaultSelected` | `string[]`                                                    | `[]`                               | Invoice ids selected on first render.                                |
| `status`          | `"ready" \| "loading" \| "error"`                             | `"ready"`                          | Loading shows skeleton rows; error shows a retry panel.              |
| `onCreateInvoice` | `() => void`                                                  | none                               | The "New invoice" and empty-state action.                            |
| `onOpenInvoice`   | `(id: string) => void`                                        | none                               | Called when a customer name is clicked; otherwise it links to `#id`. |
| `onSendReminders` | `(ids: string[]) => void`                                     | none                               | Bulk action; receives the selected open and overdue invoice ids.     |
| `onMarkPaid`      | `(ids: string[]) => void`                                     | none                               | Bulk action; the rows are marked paid locally and flash once.        |
| `onExport`        | `(ids: string[]) => void`                                     | none                               | Bulk action; receives every selected id.                             |
| `onRetry`         | `() => void`                                                  | none                               | The error state's "Try again".                                       |
| `className`       | `string`                                                      | `""`                               | Extra classes for the `<section>`.                                   |

`TesseraInvoice` is `{ id: string; customer: string; issued: string; due: string; amount: number; paid: number; draft?: boolean }`; amounts are in minor units (cents). Status is derived: draft, paid when `paid >= amount`, overdue when the due date is before `today`, otherwise open.

## Tokens

Reads `--iu-surface` (panel and sticky header), `--iu-background` (inputs and monograms), `--iu-border` (hairline rules), `--iu-foreground` (text, zebra tint and control borders at 35%), `--iu-muted` (labels, dates, ids), `--iu-accent` (primary button, active filter, selected rows and their 2px marker, partial collection bars, focus rings), `--iu-accent-foreground`, `--iu-radius` (capped at 6 to 8px), `--iu-font` and `--iu-density` (row height). Overdue and paid use red and emerald with an icon and text, never color alone.

## Dependencies

`react`, `motion` (rolling total, strip cross-fade, collection bars) and `lucide-react` (icons). Tailwind CSS 4.1 or later with container queries (built in).

## Integration steps

1. Run `npx shadcn@latest add @iloveui/tessera-invoice-table` (or copy `component.tsx` into `components/iloveui/`).
2. Make sure the `--iu-*` tokens exist in your global CSS (`npx shadcn@latest add @iloveui/tokens`).
3. Map your invoices to `TesseraInvoice` with amounts in cents, and pass `today` from the server so overdue counts match your timezone.
4. Drive `status` from your query: `"loading"` while fetching, `"error"` with `onRetry` on failure.
5. Wire `onSendReminders`, `onMarkPaid` and `onExport` to your API. Mark-paid updates rows optimistically; refetch and pass new `invoices` to reconcile.
6. Place it in a column at least 672px wide to get the table; narrower columns get the card list automatically.

## Customization ideas

- Swap invoices for subscriptions: status becomes active, past due or cancelled, and the collected bar shows the billing cycle elapsed.
- Add a "Void" bulk action behind a confirmation dialog for drafts.
- Persist `filter`, `sort` and `page` in the URL by lifting them into props.
- Add a totals row pinned under the sticky header for the filtered set.
- Set `--iu-density: 0.8` for a 36px-row power-user view.
