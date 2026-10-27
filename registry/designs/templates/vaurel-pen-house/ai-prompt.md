# Vaurel pen house

## Component

`VaurelPenHouse` is a complete home page for a premium maker, in the Luxury style family: a storefront header with a Pens panel and a mobile drawer, a hero with a live nib test sheet, a four-piece collection grid with stock states and Add to bag, a craft story with an annotated nib drawing, a nib service selection with a gliding double frame, a journal, a newsletter form with validation states, and a footer. Choosing a nib grade rewrites the test loops at that line width. All drawings are inline SVG; there are no images.

## Props

| Prop               | Type                                          | Default                       | Description                                                               |
| ------------------ | --------------------------------------------- | ----------------------------- | ------------------------------------------------------------------------- |
| `brand`            | `string`                                      | `"Vaurel"`                    | Wordmark in the header and footer.                                        |
| `announcement`     | `string`                                      | Tuning line                   | Small uppercase line above the header.                                    |
| `menus`            | `VaurelMenu[]`                                | Two columns                   | Columns of the Pens panel; each link names the drawing it shows.          |
| `links`            | `{ label: string; href: string }[]`           | Paper, Nib service, Journal   | Top-level links after Pens.                                               |
| `defaultBagCount`  | `number`                                      | `0`                           | Starting bag count; Add to bag raises it.                                 |
| `defaultMenuOpen`  | `boolean`                                     | `false`                       | Opens the Pens panel on first render.                                     |
| `headline`         | `string`                                      | `"A pen tuned to your hand."` | Hero message, under 10 words.                                             |
| `emphasis`         | `string`                                      | `"your hand"`                 | Words of the headline set in italic.                                      |
| `subline`          | `string`                                      | No. 31 sentence               | Supporting sentence.                                                      |
| `ctaLabel`         | `string`                                      | `"Order the No. 31"`          | The one primary action.                                                   |
| `ctaHref`          | `string`                                      | `"#no-31"`                    | Where it goes.                                                            |
| `ctaNote`          | `string`                                      | Price note                    | Quiet text beside the action.                                             |
| `nibs`             | `VaurelNib[]`                                 | EF, F, M, B, 1.1 stub         | Grades in the test sheet; `widthMm` sets the drawn line width.            |
| `defaultNib`       | `string`                                      | `"m"`                         | Initially selected grade.                                                 |
| `pieces`           | `VaurelPiece[]`                               | Four pieces                   | Collection cards; `stock` 0 is sold out (shows `restock`), 1 to 3 is low. |
| `steps`            | `VaurelStep[]`                                | Turned, Ground, Tuned         | Craft steps with their bench time.                                        |
| `services`         | `VaurelService[]`                             | Tune, Regrind, Restoration    | Service options.                                                          |
| `defaultService`   | `string`                                      | `"tune"`                      | Initially selected service.                                               |
| `journal`          | `VaurelEntry[]`                               | Three entries                 | Journal cards with ISO date and label.                                    |
| `footerGroups`     | `VaurelLinkGroup[]`                           | Shop, Service, House, Help    | Footer link columns.                                                      |
| `defaultEmail`     | `string`                                      | `""`                          | Prefills the newsletter field.                                            |
| `newsletterStatus` | `"idle" \| "loading" \| "error" \| "success"` | `undefined`                   | Controls the form; leave undefined to let the component manage it.        |
| `onNavigate`       | `(href: string) => void`                      | `undefined`                   | Called by header, drawer and hero links.                                  |
| `onAddToBag`       | `(pieceId: string) => void`                   | `undefined`                   | Called when a piece is added.                                             |
| `onOpenBag`        | `() => void`                                  | `undefined`                   | Bag button.                                                               |
| `onOpenAccount`    | `() => void`                                  | `undefined`                   | Account button.                                                           |
| `onSelectNib`      | `(nibId: string) => void`                     | `undefined`                   | Called when the grade changes.                                            |
| `onBookService`    | `(serviceId: string) => void`                 | `undefined`                   | Book button of the service section.                                       |
| `onSubscribe`      | `(email: string) => void \| Promise<void>`    | `undefined`                   | Called with a valid address; reject to show the error state.              |
| `className`        | `string`                                      | `""`                          | Extra classes for the root.                                               |

## Tokens

Reads `--iu-background` (page), `--iu-surface` (drawing plates, craft band), `--iu-border` (rules and frames), `--iu-foreground` (text, drawings and the solid pill buttons), `--iu-muted` (labels and secondary text), `--iu-accent` (only fine lines and marks: the nib slit, the selected grade, low stock, the service diamond, loading and success rules, focus rings), `--iu-radius` (capped at 2px for surfaces; buttons are full pills), `--iu-font` (body) and `--iu-density` (craft rows and link spacing). Display type uses your project's `font-serif`; figures use `font-mono`. Add the tokens with `npx shadcn@latest add @iloveui/tokens`.

## Dependencies

`react`, `motion` (the line rewrite, the gliding frame, the panel fade and the success rule) and `lucide-react` (interface icons). Tailwind CSS 4.1 or later.

## Integration steps

1. Run `npx shadcn@latest add @iloveui/vaurel-pen-house` (or copy `component.tsx` to `components/iloveui/vaurel-pen-house.tsx`).
2. Make sure the `--iu-*` tokens exist in your global CSS and that `font-serif` maps to a display serif.
3. Render `<VaurelPenHouse />` as the page body of your home route; it brings its own `header`, `main` and `footer` landmarks.
4. Replace the brand, menus, pieces, services and journal with your data. Keep one primary action in the hero.
5. Wire `onAddToBag` and `onOpenBag` to your cart, `onBookService` to your booking flow and `onNavigate` to your router if you need client-side navigation.
6. Pass `onSubscribe` that posts to your newsletter provider and throws on failure; the component handles validation, loading, error and success.

## Customization ideas

- Swap the nib test sheet for another output preview: a knife's edge angle, a camera lens's depth of field, a typeface's weights.
- Add a fifth collection card and switch the grid to five columns on wide screens.
- Turn the service section into a membership with yearly prices, keeping the gliding frame.
- Feed the journal from your CMS and add a category filter above it.
- Set `--iu-density` to 0.8 for a tighter catalog page built from the same sections.
