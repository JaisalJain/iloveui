# Tessera invoice table

## Usage notes

- Use it as the main view of a billing, accounts receivable or finance screen, where people scan dozens of rows and act on several at once. It expects invoices with amounts in cents and ISO dates; status is derived from `paid`, `draft` and the `today` prop.
- Selection: every row has a native checkbox labelled with its invoice id and customer; the header checkbox selects the current page and shows the mixed state when part of it is selected. Shift-click selects or clears the range from the last row you touched. Selection survives paging, sorting and filtering, and the strip always counts the whole selection.
- Bulk actions: Send reminder and Mark paid act only on open and overdue invoices (Mark paid is disabled otherwise); Export takes everything. Reminder and Export swap their label to a check for 1.6s without changing width; Mark paid flashes the affected rows green once. Each action is announced through a polite live region.
- Sorting: column headers are buttons inside `th` elements that carry `aria-sort`; a second click reverses the direction. The caption states the current sort for screen readers.
- Sticky header: the table scrolls inside a 392px region with a stable scrollbar gutter, and the header stays pinned on the surface color.
- Responsive: container queries. Below 672px the table becomes stacked cards with a select-page checkbox and a native sort menu; the invoice column joins the customer cell below 896px and the collected bars drop below 768px. Bulk actions collapse to labelled icon buttons in narrow containers. Targets grow to 40px on touch.
- States: loading renders static skeleton rows in both layouts with totals replaced by dashes; empty (no invoices) offers "Create first invoice"; a filter with no match offers "Clear filters"; error explains the timeout and offers "Try again".
- Motion: the selection total rolls in 140ms, the strip cross-fades with a 4px rise, and collection bars resize when a row is paid. All of it is instant under reduced motion.

## Taste self-review

- One clear focal point: Yes. The selection strip: tinted, sitting right above the header, its rolling outstanding total is the one number that changes as you work, while the rows stay neutral and dense.
- Spacing on the 4px scale: Yes. Paddings and gaps are 4px multiples (4, 8, 12, 16, 20px); row height comes from 10px padding times the density token, and the 2px selection marker and 6px bars are hairline details.
- Belongs in a Linear, Stripe or Vercel product: Yes. Mono tabular amounts, a quiet zebra, one accent used only for selection and the primary action, and bulk actions that behave like Stripe's dashboard.
- Meets its category brief: Yes. Sorting with aria-sort, selection with shift-range and bulk actions, real pagination, a sticky header in its own scroll area, a card layout for mobile, skeleton loading and designed empty and error states.
- Distinct from every other design in its category: Yes. It is the category's dense, spreadsheet-like table: a status line that becomes the bulk bar with a rolling total, inline collection bars and range selection; the other table designs are an editorial list and a neo-brutalist order board.
