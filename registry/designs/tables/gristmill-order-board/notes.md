# Gristmill order board

## Usage notes

- Use it for fulfilment queues where status changes all day: wholesale orders, print jobs, repair tickets. It expects a small fixed pipeline (four stages) and short item summaries.
- Inline status change: each rail is a `fieldset` with a hidden legend ("Stage for GM-1058, Corner Bloom Café") and four native radio inputs. Tab reaches the group; arrow keys move between stages and change it at once, as native radios do. The focused block shows the accent ring. Every change is announced through a polite live region.
- Selection: native checkboxes drawn as 2px boxes with a square check; the header box selects the page and shows a dash when partial. The bulk slab appears under the table with the count and the selection's value; Advance is disabled when every selected order has shipped.
- Sorting: header buttons in `th` elements with `aria-sort`; the caption states the sort. In the ticket layout the same sort buttons sit in a compact bar.
- Sticky header: the table scrolls inside a 452px area and its header stays pinned on the background color with a 2px rule.
- Responsive: container queries; tickets below 768px with the rail and sticker under the customer, stat blocks in a 2×2 grid. Rail blocks and controls grow to 40px on touch.
- States: loading draws outlined skeletons with empty rails; empty shows a drawn crate and "Add first order"; error is an outlined red block with the cause and "Try again".
- Motion is linear and short, as the family asks: blocks fill in 100ms with 40ms steps, stickers stamp in 120ms, buttons press into their shadow. All instant under reduced motion.

## Taste self-review

- One clear focal point: Yes. The column of stage rails: solid black blocks read the whole pipeline at a glance, and the stickers give each row its word.
- Spacing on the 4px scale: Yes. Paddings of 12, 16 and 24px, 4px gaps between blocks, 3 and 6px offset shadows that match the outline weight.
- Belongs in a Linear, Stripe or Vercel product: Yes. Loud, but every mark is functional: native radios as the status control, aria-sort headers, optimistic updates and a real bulk workflow.
- Meets its category brief: Yes. Sorting, selection with bulk Advance and Labels, pagination, a sticky header, a ticket layout on mobile, loading, empty and error states, plus inline status change.
- Distinct from every other design in its category: Yes. It is the category's only neo-brutalist board and the only one whose rows are edited in place through a stage rail; the others are a dense invoice table and an editorial review list.
