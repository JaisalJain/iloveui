# Sockpop shop grid

## Component

`SockpopShopGrid` is a playful storefront section: a header with a cart button, a headline and a grid of four product cards, each with its product drawn in SVG, a pattern picker (radio swatches that re-draw the product), a size picker that strikes through sold-out sizes, live stock notes ("Only 2 left in M"), sale stickers with compare-at prices, and Add to cart. Adding a pair flings a small copy of the product in an arc into the cart button, whose count springs. The cart opens as a drawer from the right (a bottom sheet on phones) with a free-shipping progress bar, line items with quantity steppers capped at stock, a discount code field with validation, and a checkout summary (subtotal, sale savings, code, shipping, total, VAT note) above the Checkout button.

## Props

| Prop               | Type                                                    | Default           | Description                                                                 |
| ------------------ | ------------------------------------------------------- | ----------------- | --------------------------------------------------------------------------- |
| `brand`            | `string`                                                | `"Sockpop"`       | Shop name in the header.                                                    |
| `products`         | `SockProduct[]`                                         | Four products     | `{ id, name, blurb, price, compareAt?, patterns, stock, restock? }`, pence. |
| `defaultCart`      | `SockLine[]`                                            | `[]`              | Lines in the cart on first render.                                          |
| `defaultCartOpen`  | `boolean`                                               | `false`           | Opens the drawer on first render without moving focus.                      |
| `defaultCode`      | `string \| null`                                        | `null`            | A discount code already applied.                                            |
| `freeShippingFrom` | `number`                                                | `4000`            | Free shipping threshold in pence, after discounts.                          |
| `shippingFee`      | `number`                                                | `395`             | Shipping below the threshold, in pence.                                     |
| `status`           | `"idle" \| "loading" \| "error" \| "success"`           | `undefined`       | Skeleton cards, a checkout failure or a placed order.                       |
| `checkoutError`    | `string`                                                | Stock change copy | Message for a failed checkout.                                              |
| `orderNumber`      | `string`                                                | `"SP-20418"`      | Shown after a successful order.                                             |
| `onAddToCart`      | `(line: SockLine) => void`                              | `undefined`       | Called for every add.                                                       |
| `onApplyCode`      | `(code: string) => void`                                | `undefined`       | Called when a valid code is applied.                                        |
| `onCheckout`       | `(lines: SockLine[], total: number) => void \| Promise` | `undefined`       | Return a promise to show Placing order; reject it to show the error.        |
| `onNotify`         | `(productId: string) => void`                           | `undefined`       | Called when someone asks to be told about a restock.                        |
| `className`        | `string`                                                | `""`              | Extra classes for the root.                                                 |

`SockLine` is `{ productId, pattern: "stripe" | "dot" | "plain", size: "S" | "M" | "L", qty }`. Codes live in the `CODES` map (`SOCKPOP15` is 15% off, `WINTER10` has expired); validate them on your server too.

## Tokens

Reads `--iu-background` (page and alternate plates), `--iu-surface` (cards, drawer, inputs), `--iu-foreground` (2px ink outlines, selected size, text), `--iu-muted` (secondary text), `--iu-accent` and `--iu-accent-foreground` (the product patterns, sale stickers, primary buttons, cart badge, low-stock dot, progress bar, focus rings; offset shadows and the single tint are mixed from it), `--iu-radius` (floored at 16 to 28px), `--iu-font` and `--iu-density` (card and line padding).

## Dependencies

`react`, `motion` (the flight into the cart, badge spring, pattern swap, drawer, line items and the drawn success check) and `lucide-react` (icons). Tailwind CSS 4.1 or later.

## Integration steps

1. Run `npx shadcn@latest add @iloveui/sockpop-shop-grid` (or copy `component.tsx` into `components/iloveui/`).
2. Make sure the `--iu-*` tokens exist in your global CSS (`npx shadcn@latest add @iloveui/tokens`).
3. Map your catalog to `SockProduct` (prices in minor units, stock per size) and render `<SockpopShopGrid products={products} onCheckout={startCheckout} />`. Replace the `Sock` drawing with your own SVG or a product illustration per pattern.
4. Make `onCheckout` create the order or a hosted checkout session and return its promise. Reject it when stock changed, and pass a specific `checkoutError`.
5. Move `CODES` to a server call inside `onApplyCode` when codes are dynamic, and sync `defaultCart` from your cart store.

## Customization ideas

- Add a "Bundle 3, save 10%" line to the summary when the cart holds three pairs or more.
- Replace the size radios with a fit finder ("UK 4 to 7") that maps shoe size to S, M or L.
- Show a mini cart popover under the cart button on desktop before opening the full drawer.
- Use the restock date to switch Notify me into a pre-order button.
- Swap the free-shipping bar for a gift-wrap threshold during the holidays.
