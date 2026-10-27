# Gristmill order board

## Component

`GristmillOrderBoard` is a neo-brutalist fulfilment table for wholesale or e-commerce orders: 2px outlines, hard offset shadows, an oversized uppercase title and four stat blocks (open orders, bags to roast, ready to ship, open value). Every row carries a four-block stage rail (Pending, Roasting, Packed, Shipped) that is the control itself: it is a radio group, so clicking a block or pressing an arrow key moves the order to that stage, the blocks fill left to right in 40ms steps and a new sticker stamps in beside them (Shipped lands as a solid, slightly rotated sticker). Selecting rows drops a black slab under the table with the count and value, "Advance stage", "Labels" and clear. Sortable headers stay pinned in a scroll area; under a 768px container the rows become stacked tickets with the same rail.

## Props

| Prop              | Type                                          | Default          | Description                                                         |
| ----------------- | --------------------------------------------- | ---------------- | ------------------------------------------------------------------- |
| `title`           | `string`                                      | `"Orders"`       | Oversized heading.                                                  |
| `orders`          | `GristmillOrder[]`                            | 12 sample orders | Rows. An empty array renders "No orders on the board".              |
| `currency`        | `string`                                      | `"GBP"`          | ISO 4217 code; totals are shown in whole units.                     |
| `locale`          | `string`                                      | `"en-GB"`        | Locale for money.                                                   |
| `pageSize`        | `number`                                      | `6`              | Rows per page.                                                      |
| `defaultSelected` | `string[]`                                    | `[]`             | Order ids selected on first render.                                 |
| `status`          | `"ready" \| "loading" \| "error"`             | `"ready"`        | Loading shows outlined skeleton rows; error shows a retry block.    |
| `onStageChange`   | `(id: string, stage: GristmillStage) => void` | none             | Called when a rail changes; the row updates optimistically.         |
| `onAdvance`       | `(ids: string[]) => void`                     | none             | Bulk action; moves each selected unshipped order one stage forward. |
| `onPrintLabels`   | `(ids: string[]) => void`                     | none             | Bulk action.                                                        |
| `onNewOrder`      | `() => void`                                  | none             | Header and empty-state action.                                      |
| `onRetry`         | `() => void`                                  | none             | Error-state action.                                                 |
| `className`       | `string`                                      | `""`             | Extra classes for the `<section>`.                                  |

`GristmillOrder` is `{ id; customer; city; items: string; bags: number; total: number (minor units); stage: "pending" | "roasting" | "packed" | "shipped" }`. `GRISTMILL_STAGES` is exported.

## Tokens

Reads `--iu-foreground` (every outline, offset shadow, filled stage block and the bulk slab), `--iu-surface` and `--iu-background` (panel, sticky header, stickers), `--iu-muted` (cities and item lines), `--iu-accent` with `--iu-accent-foreground` (the New order button and the Advance button's shadow, plus focus rings), `--iu-radius` (capped at 4px), `--iu-font` and `--iu-density` (row height). The error block uses red with a label, never color alone.

## Dependencies

`react`, `motion` (stage fill, sticker stamp, slab height) and `lucide-react` (icons). Tailwind CSS 4.1 or later.

## Integration steps

1. Run `npx shadcn@latest add @iloveui/gristmill-order-board` (or copy `component.tsx` into `components/iloveui/`).
2. Add the `--iu-*` tokens with `npx shadcn@latest add @iloveui/tokens`.
3. Map your orders to `GristmillOrder`; rename the four stages in `GRISTMILL_STAGES` and the label map if your pipeline differs (keep four for the rail's proportions).
4. Persist changes in `onStageChange` and `onAdvance`; the board updates optimistically, so refetch and pass new `orders` on failure to roll back.
5. Drive `status` from your query and pass `onRetry`.

## Customization ideas

- Turn it into an inventory board: the rail becomes stock level (Out, Low, OK, Full) and the bulk action reorders.
- Add a "Hold" toggle that hatches the rail with a dashed outline and stops Advance.
- Show an ETA under the sticker for orders in Roasting.
- Make the bulk slab sticky to the viewport bottom on long pages.
- Swap the accent shadow on Advance for the accent fill when it is the only action you want people to take.
