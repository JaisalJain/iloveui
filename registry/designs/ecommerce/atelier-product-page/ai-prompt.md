# Atelier product page

## Component

`AtelierProductPage` is a complete luxury product page for a fictional maison, Orvanne, selling the Méridienne watch: a minimal header with the bag, a breadcrumb, a large plate on which the watch is drawn face on in fine SVG lines with technical callouts, and a column with the serif product name, the price with its compare-at price and saving, finish swatches, case-size pills with stock states, a quantity stepper, Add to bag, and delivery, returns and warranty rows. Add to bag opens the bag: a modal drawer on the right from 640px and a bottom sheet on phones, with line items, a discount code field with validation and a checkout summary (subtotal, discounts, shipping, tax, total).

The signature moment: choosing a finish re-tints the drawing's lines (Lacquer turns the dial to the brand accent while the steel case stays), and the price and stock line cross-fades to the new variant. Choosing a size redraws the watch at its true relative diameter. Adding to bag slides the drawer in with the new line marked by a fine accent rule and a "Just added" label. Everything is instant under reduced motion and fully visible without JavaScript.

## Props

| Prop              | Type                                                                       | Default                               | Description                                                                                                          |
| ----------------- | -------------------------------------------------------------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `maison`          | `string`                                                                   | `"Orvanne"`                           | Wordmark in the header, also printed inside the empty-bag box.                                                       |
| `product`         | `AtelierProduct`                                                           | `atelierProduct` (the Méridienne)     | Name, kicker, summary, sale label and note, finishes, sizes, variants and the detail rows.                           |
| `initialFinishId` | `string`                                                                   | first finish                          | Finish selected on first render.                                                                                     |
| `initialSizeId`   | `string`                                                                   | middle size that is in stock          | Size selected on first render. It is kept even when sold out, so a reservation that just failed can be shown.        |
| `bag`             | `AtelierBagLine[]`                                                         | `atelierBag` (one calfskin strap)     | Lines already in the bag.                                                                                            |
| `defaultBagOpen`  | `boolean`                                                                  | `false`                               | Opens the bag on first render without moving focus into it.                                                          |
| `highlightLineId` | `string`                                                                   | none                                  | Marks a line as just added, for example after an add that happened on the server.                                    |
| `status`          | `"idle" \| "loading" \| "error"`                                           | follows the promise from `onAddToBag` | Drive the add-to-bag request yourself. Leave it unset to let the component show loading and errors on its own.       |
| `errorMessage`    | `string`                                                                   | sold-out or retry copy                | Message in the error panel under Add to bag.                                                                         |
| `currency`        | `string`                                                                   | `"USD"`                               | ISO 4217 code for every price.                                                                                       |
| `locale`          | `string`                                                                   | `"en-US"`                             | Locale for price formatting.                                                                                         |
| `taxRate`         | `number`                                                                   | `0.08875`                             | Estimated tax on the subtotal after discounts.                                                                       |
| `taxLabel`        | `string`                                                                   | `"Estimated tax · NY"`                | Label of the tax row; the rate is appended.                                                                          |
| `perClientLimit`  | `number`                                                                   | `3`                                   | Most pieces of one variant a client can hold. The stepper also stops at the variant's stock.                         |
| `discountCodes`   | `Record<string, number>`                                                   | `{ ATELIER10: 10 }`                   | Codes and their percentage off, used when `validateCode` is not set.                                                 |
| `validateCode`    | `(code: string) => AtelierCodeResult \| Promise<AtelierCodeResult>`        | local lookup in `discountCodes`       | Validate a code on your server. Return `{ ok: true, code, percentOff }` or `{ ok: false, message }`.                 |
| `checkoutHref`    | `string`                                                                   | `"#checkout"`                         | Where the Checkout link goes.                                                                                        |
| `onAddToBag`      | `(line: AtelierBagLine, variant: AtelierVariant) => void \| Promise<void>` | none                                  | Hold the piece in your cart. Return a promise to show the loading state; reject with an `Error` to show its message. |
| `onBagChange`     | `(lines: AtelierBagLine[]) => void`                                        | none                                  | Every change to the bag: add, quantity, remove.                                                                      |
| `onBagOpenChange` | `(open: boolean) => void`                                                  | none                                  | Called when the bag opens or closes.                                                                                 |
| `onCheckout`      | `(lines: AtelierBagLine[], totals: AtelierTotals) => void`                 | none                                  | Called when Checkout is clicked, before navigation to `checkoutHref`.                                                |
| `className`       | `string`                                                                   | `""`                                  | Extra classes for the root element.                                                                                  |

The data types are exported with the component:

- `AtelierFinish`: `{ id, name, tone, dialTone? }`. `tone` is any CSS color for the case, crown, hands, strap and swatch ring; `dialTone` colors the dial and the swatch center (the default Lacquer finish uses the accent).
- `AtelierSize`: `{ id, label, diameter, thickness, fit }`. `diameter` in millimetres scales the drawing (drawn at 38 mm).
- `AtelierVariant`: `{ id, finishId, sizeId, price, compareAtPrice?, stock, soldOutReason? }`. `id` is the SKU shown on the plate. A `compareAtPrice` shows the struck price and the saving; `stock` of 3 or less shows "Only N left"; 0 disables the option and shows `soldOutReason` beside it.
- `AtelierBagLine`: `{ id, name, detail, price, compareAtPrice?, quantity, maxQuantity, thumbnail: "watch" | "strap", tone?, dialTone? }`.
- `AtelierTotals`: `{ pieces, subtotal, saleDiscount, codeDiscount, shipping, tax, total, code? }`.

## Tokens

Reads `--iu-background` (page), `--iu-surface` (bag panel, error panel), `--iu-border` (rules, row dividers, frames), `--iu-foreground` (text, the ink pill buttons, the selected size pill, and the drawing plate in light mode), `--iu-muted` (labels, captions, struck prices), `--iu-accent` (the seconds hand, the saving tag's outline, the low-stock dot, the just-added rule, the Lacquer dial, and focus rings; never small text), `--iu-radius` (capped at 2px for frames and inputs, 4px for the sheet; buttons stay full pills), `--iu-font` and `--iu-density` (row padding in the details list and the bag). Add them once with `npx shadcn@latest add @iloveui/tokens`.

The root derives its own drawing palette from those tokens, so it follows Theme Lab and both modes: `--atelier-plate` (the plate: `--iu-foreground` in light mode, a lifted surface in dark mode), `--atelier-ink` (the light end of the drawing), and the finish tones `--atelier-steel`, `--atelier-graphite` and `--atelier-lacquer` mixed from them, plus `--atelier-caption` for plate labels. Override any of them on a parent, or pass real material colors through each finish's `tone`.

`font-serif` sets the product name, prices and headings; previews map it to Instrument Serif, your project's serif is used elsewhere.

## Dependencies

`react`, `motion` (price and label cross-fades, the size fade-through and the bag line exit) and `lucide-react` (bag, check, minus, plus, close and alert icons). The drawer slide, scrim and drawing re-tint are CSS transitions. Tailwind CSS 4.1 or later.

## Integration steps

1. Run `npx shadcn@latest add @iloveui/atelier-product-page` (or copy `component.tsx` to `components/iloveui/atelier-product-page.tsx`).
2. Make sure the `--iu-*` tokens exist in your global CSS (`npx shadcn@latest add @iloveui/tokens` adds them) and that `font-serif` resolves to the serif you want.
3. Render `<AtelierProductPage product={product} />` on the product route. Build `product` from your catalogue: one `AtelierFinish` per finish, one `AtelierSize` per size, one `AtelierVariant` per SKU with live `stock`, and `compareAtPrice` only while a sale runs.
4. Pass `onAddToBag={(line, variant) => cart.add(variant.id, line.quantity)}` returning the request promise. On a sold-out response, set that variant's `stock` to 0 with a `soldOutReason` and reject with an `Error` whose message explains it; the error panel then offers the nearest variant that is in stock.
5. Seed `bag` from the server cart, keep it in sync with `onBagChange`, validate codes on the server with `validateCode`, and set `checkoutHref` (plus `onCheckout` for analytics) to your checkout.
6. Use `defaultBagOpen` and `highlightLineId` to land on the page with the bag open after a server-side add.
7. Using `component.html` instead: replace the product data at the top of its script, put your cart call inside `reserve(line)` (resolve when held, reject with an `Error` to show the message), and listen for the `atelier:add`, `atelier:bag` and `atelier:checkout` events on `[data-atelier]`.

## Customization ideas

- Sell a fragrance: replace the watch drawing with a flacon, finishes become concentrations (Eau de parfum, Extrait) and sizes become 50 ml and 100 ml.
- Add an engraving field under the sizes that previews the initials on a caseback view of the plate.
- Pass `currency`, `locale`, `taxRate` and `taxLabel` from the shopper's region, and add a duties row for international orders.
- Add a second plate view (profile or caseback) with a small view switcher under the figure caption.
- Replace the token-derived finish tones with your real material colors through each finish's `tone` and `dialTone`.
