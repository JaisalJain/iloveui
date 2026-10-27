# Tidewater submissions

## Usage notes

- Use it where a small team reads items in depth and decides on them in batches: a literary or editorial queue, applications, grant proposals, documentation reviews. It is a list, not a grid of cells: one item per line with its title as the hero.
- Selection: each numeral is a real checkbox laid over the number (the input fills the 40px target and is invisible), labelled "Select “title” by author". Focus draws the accent ring around the numeral. Selected entries show a check and an accent rule in the margin.
- Sorting: the "Order by" bar is a labelled group of toggle buttons with `aria-pressed`; the active one is set in italic serif with an accent underline and a direction arrow that screen readers hear as "ascending" or "descending". The bar sticks to the top of the 560px scroll area.
- Bulk actions: the colophon under the list sums the selection in words a reader understands (spelled-out count, total words, reading time) and is a polite live region. Shortlist marks entries with the accent diamond; Decline removes them; both confirm in a status message with Undo for 8 seconds.
- Pagination: serif page numbers with `aria-current="page"`, plus Newer and Older; the list is an `<ol>` whose `start` follows the page, so numbers continue across pages.
- Responsive: container queries. From 672px the form, length and status sit in their own columns; below it they fold into the byline and a status line under the title. Touch targets are at least 40px.
- States: loading shows static skeleton lines in the final layout; empty has a drawn tray, an honest line and one action; success is the post-action confirmation with Undo.
- Motion: entries glide to their new position in 320ms when the order changes, the margin rule draws down in 300ms and the colophon cross-fades with a 6px rise. Everything is instant under reduced motion.

## Taste self-review

- One clear focal point: Yes. The column of serif titles, read top to bottom; the only accent marks are the margin rules of what you have chosen and the active sort.
- Spacing on the 4px scale: Yes. Entry padding is 20px times density, columns gap 16 to 24px, the masthead uses 8, 24, 32 and 40px; the 3px margin rule and double rules are typographic details.
- Belongs in a Linear, Stripe or Vercel product: Yes. It is restrained and exact: real list semantics, aria-pressed sorting, optimistic actions with Undo, and typography doing the work instead of chrome.
- Meets its category brief: Yes. Sorting on four keys, selection with bulk Shortlist and Decline, pagination, a sticky sort header, a mobile layout that folds metadata into the byline, and loading and empty states.
- Distinct from every other design in its category: Yes. It is the category's editorial list: numerals that become checkboxes, a reorder that glides, and a selection summed in prose; the others are a dense invoice table and a neo-brutalist order board.
