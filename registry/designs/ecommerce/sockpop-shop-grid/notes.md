# Sockpop shop grid

## Usage notes

- Use it as the collection page of a small, characterful shop: a handful of products with variants, honest stock and a cart that opens in place. Each card needs a price, optional compare-at price, patterns and stock per size.
- Patterns and sizes are native radio groups inside fieldsets, so arrows move between options, sold-out sizes are skipped and announced as "sold out", and the legend reads the current pattern. A product with no stock disables both groups, greys its drawing, shows its restock date and offers Notify me instead of Add to cart.
- Stock notes update politely: in stock, "Only N left in M" (counting what is already in the cart), "You have every M we’ve got", or the restock date. Add to cart disables when nothing is left to add.
- Adding a pair flies a copy of the product in an arc to the cart button and springs the count; under reduced motion the count changes at once. The cart button's name includes the item count.
- The cart is a modal dialog: focus moves to Close when a person opens it, Tab cycles inside, Escape and the scrim close it, and focus returns to the cart button. The page is inert and its scroll locked without a shift. It slides from the right from 640px and is a bottom sheet below.
- Quantity steppers are labelled per product, stop at stock (with "Max N") and the minus button becomes Remove at one. The discount field validates empty, unknown and expired codes inline with `aria-invalid`, then becomes an applied row with Remove.
- The summary itemises the subtotal, sale savings already in the prices, the code discount, shipping against the free-shipping threshold (also shown as a labelled progress bar) and the total, with VAT and returns stated.
- States: default (cart open with two lines and a code), loading (skeleton cards that match the layout), empty (cart open with an illustrated empty state and one action), error (checkout failed because stock changed) and success (order placed, drawn check).

## Taste self-review

- One clear focal point: Yes. Each card leads with its big drawn product on a tinted plate; the vermilion Add to cart and the cart badge are the only filled accents, and the flight between them ties the two together.
- Spacing on the 4px scale: Yes. Cards pad 16px with 14px stacks (density scaled), the grid gaps are 24px, controls are 40 and 48px tall, and the drawer pads 20 and 24px.
- Belongs in a Linear, Stripe or Vercel product: Yes. Under the playful outlines it is a careful commerce surface: real stock logic, a validated code, an itemised total with tax and returns stated, and a cart with proper focus handling.
- Meets its category brief: Yes. Product cards with pattern and size variants; stock states (in stock, low, at cart limit, sold out per size, sold out with restock); discount states (sale stickers with compare-at prices, valid, unknown and expired codes); a cart drawer; and a checkout summary with error and success.
- Distinct from every other design in its category: Yes. It is the catalog's only product grid, the only playful commerce design and the only one where adding to cart flies the product into the cart, unlike the luxury single-product page.
