# Hesper storefront navigation

## Component

`HesperStorefrontNav` is the header of a premium storefront (a fragrance and leather maison in the defaults): a centered announcement line, then a three-part bar with small tracked navigation on the left, a wide-set serif wordmark in the center, and a pill search, account and `Bag (n)` on the right. Collection menus open a full-width panel of fine-ruled columns beside "the subject": a framed fine-line drawing of a piece with its serif name, detail and price. Hovering or focusing any piece in the columns makes it the subject, cross-fading the drawing in over 400ms with a 2% settle, while a 16px accent dash marks the piece being shown. Search is a combobox that suggests pieces while empty and lists matches with a miniature, name and price as you type. Below 1024px a menu button opens a drawer with 30px serif sections; collections drill into a second level that slides in with a back button, the collection's pieces and prices and the featured drawing.

## Props

| Prop              | Type                      | Default                     | Description                                                                             |
| ----------------- | ------------------------- | --------------------------- | --------------------------------------------------------------------------------------- |
| `brand`           | `string`                  | `"Hesper"`                  | Wordmark, set in your serif with wide tracking.                                         |
| `brandHref`       | `string`                  | `"#maison"`                 | Where the wordmark links.                                                               |
| `announcement`    | `string`                  | Delivery and engraving line | The line above the bar.                                                                 |
| `menus`           | `HesperMenu[]`            | Fragrance, Leather          | `{ id, label, columns: { title, links: HesperPiece[] }[], featured: HesperPiece }`.     |
| `links`           | `HesperLink[]`            | New, Home, Journal          | Plain links; the first sits before the menus, the rest after.                           |
| `currentHref`     | `string`                  | `"#vetiver-nocturne"`       | The page being viewed; its collection gets the accent dash and the link `aria-current`. |
| `defaultOpenMenu` | `string \| null`          | `null`                      | Opens one menu on first render (for docs and demos).                                    |
| `bagCount`        | `number`                  | `2`                         | Items in the bag.                                                                       |
| `suggestions`     | `HesperPiece[]`           | Three pieces                | Shown in search while the field is empty.                                               |
| `careLine`        | `string`                  | Client care phone line      | Footer line of the mobile drawer.                                                       |
| `onNavigate`      | `(href: string) => void`  | none                        | Called whenever a link or search result is followed.                                    |
| `onSearch`        | `(query: string) => void` | none                        | Enter with no result highlighted (a full search page).                                  |
| `onOpenBag`       | `() => void`              | none                        | The Bag button.                                                                         |
| `onOpenAccount`   | `() => void`              | none                        | The account button.                                                                     |
| `className`       | `string`                  | `""`                        | Extra classes for the `<header>`.                                                       |

`HesperPiece` is `{ name, href, detail, price, art: "bottle" | "candle" | "diffuser" | "set" | "tote" | "cardcase" }`.

## Tokens

Reads `--iu-background` (bar, panel, drawer), `--iu-surface` (the subject frame), `--iu-border` (fine rules), `--iu-foreground` (type and the line drawings), `--iu-muted` (navigation at rest, labels, prices in lists), `--iu-accent` (one fine line per drawing, the current-collection dash, the previewed-piece dash and 1px focus rings), `--iu-radius` (capped at 2px on frames; buttons stay full pills by design), `--iu-font` and `--iu-density` (spacing between panel links). Add them with `npx shadcn@latest add @iloveui/tokens`.

## Dependencies

`react`, `motion` (the subject cross-fade, panel fade and drawer levels) and `lucide-react` (menu, search, account and chevron icons). Tailwind CSS 4.1 or later; display type uses your `font-serif`.

## Integration steps

1. Run `npx shadcn@latest add @iloveui/hesper-storefront-nav` (or copy `component.tsx` to `components/iloveui/hesper-storefront-nav.tsx`).
2. Make sure the `--iu-*` tokens exist in your global CSS and that `font-serif` maps to your display serif.
3. Render it at the top of your storefront layout and pass the current product or collection URL as `currentHref`.
4. Build `menus` from your catalogue: two or three columns per collection, three or four pieces per column, and one `featured` piece.
5. Wire `onOpenBag` to your cart drawer and keep `bagCount` in sync with your cart; route `onNavigate` with your router.
6. Map each product to the nearest `art` drawing, or extend the `Art` component with a drawing of your own product.

## Customization ideas

- Replace a drawing with a product render: keep the frame and caption and swap `Art` for your own SVG.
- Add a third collection (Home) with candles, trays and linens.
- Put a store-locator link with the nearest boutique's hours beside the client care line.
- Show stock ("Two left in 100 ml") under the subject's detail for limited pieces.
- Use a darker `--iu-background` with a champagne `--iu-accent` for an evening edition.
