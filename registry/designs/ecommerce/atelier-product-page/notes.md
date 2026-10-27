# Atelier product page

## Usage notes

- Use it as the product route of a premium shop where one product and its variants deserve the whole page: watches, jewellery, fragrance, leather goods. It brings its own header with the bag, so drop the header if your layout already has one and open the bag from yours with `defaultBagOpen` or your own state.
- It expects a product with finishes, sizes and one variant per combination, each with a SKU, a price, an optional compare-at price, live stock and a reason when it is sold out. Stock of 3 or less reads "Only N left" with an accent dot; 0 disables the size (or the finish when every size is gone) and prints the reason beside it, linked with `aria-describedby`.
- Finishes and sizes are native radio groups inside fieldsets, so arrow keys move between options and skip sold-out ones, and the legend reads the current finish. Selecting a finish where the current size is sold out moves to the nearest size in stock and says so in a polite live region, together with the new price and stock.
- Add to bag keeps its width while it loads (a slow hairline spinner that pauses offscreen), the quantity stepper stops at the variant's stock and the per-client limit, and a failed add shows an alert with honest copy and one action: the nearest variant in stock, or Try again.
- The bag is a modal dialog: focus moves into it when a person opens it, Tab and Shift+Tab stay inside, Escape, the scrim and the close button dismiss it, and focus returns to the control that opened it. The page behind is inert and its scroll is locked without a layout shift. From 640px it slides in from the right at 440px; below that it is a bottom sheet with the total and Checkout pinned.
- The discount code field validates format, unknown codes and empty submissions inline (`aria-invalid` plus a described error), then turns into an applied row with a Remove button that takes focus. The summary itemises the sale discount and the code before shipping and tax.
- Without JavaScript every state renders complete: the drawing, the price, the open bag in the success and empty states. Under reduced motion the cross-fades, the size fade-through, the drawer slide and the re-tint are instant.
- Responsive: one column with a full-bleed square plate on phones (callouts and plate labels hide, the caption carries the size), a 5:4 plate above the details at tablet widths, and a sticky 4:5 plate beside the details from 1024px.

## Taste self-review

- One clear focal point: Yes. The watch, drawn in hairlines on a deep plate, is the subject of the page; the only colour on it is the seconds hand until a finish is chosen, and the serif name and price beside it are the only large type.
- Spacing on the 4px scale: Yes. Gaps, paddings and offsets are 4px multiples (8, 12, 16, 20, 24, 28, 32, 36, 40, 64px), row padding scales from 14, 16 and 20px with the density token, and the drawing sits on its own 600 by 750 grid.
- Belongs in a Linear, Stripe or Vercel product: Yes. It has the restraint of the best commerce work those teams admire: one accent used as a fine line, exact tabular prices, a real dialog with a focus trap, and states (stock, sold out with a reason, a reservation race, code validation) that a production shop needs.
- Meets its category brief: Yes. Product page with finish and size variants; stock states (in stock, only N left, sold out with its reason, reserved during checkout); discount states (compare-at price with the saving, a validated code, both itemised); a cart drawer whose lines are compact product cards with thumbnails, quantity and removal; and a checkout summary with subtotal, discounts, shipping, tax and total.
- Distinct from every other design in its category: Yes. It is the catalog's only product page drawn as technical line art, the only one whose finish choice re-tints the product itself, and the only luxury-family commerce design.
