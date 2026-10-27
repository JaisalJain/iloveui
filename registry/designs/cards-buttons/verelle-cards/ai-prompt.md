# Verelle cards

## Component

`VerelleCards` is a set of three refined cards for a luxury product page or private-client flow, from an invented watch house: a product card (the watch drawn in SVG on a quiet stage, serif name, details, price between double rules, a pill Reserve button), a feature card (hand engraving, with the caseback drawn and the engraving set along its arc) and a profile card (an advisor with an italic monogram, next opening, response time and an outline booking button). Its signature is the Reserve button: it keeps its exact width while a 1px accent hairline traces around the pill as the reservation runs, then closes the loop and the label settles to "Reserved" with a check. Hover draws a second inner frame inside each card and lifts the watch by 2%; press scales buttons to 98%.

## Props

| Prop                | Type                               | Default              | Description                                                                               |
| ------------------- | ---------------------------------- | -------------------- | ----------------------------------------------------------------------------------------- |
| `product`           | `VerelleProduct`                   | Phase de Lune watch  | `{ house, name, reference, details: string[], price, allocation }`.                       |
| `advisor`           | `VerelleAdvisor`                   | Céline Marchetti     | `{ name, role, location, responseTime, nextSlot }`.                                       |
| `engraving`         | `string`                           | `"C. & A. · MMXXVI"` | Text set along the caseback arc; keep it under 24 characters.                             |
| `status`            | `"idle" \| "loading" \| "success"` | uncontrolled         | Controls the Reserve button. Omit it and the button follows the promise from `onReserve`. |
| `disabled`          | `boolean`                          | `false`              | Allocation closed: Reserve and booking are disabled with honest labels.                   |
| `forceState`        | `"hover" \| "focus" \| "active"`   | none                 | Renders an interaction state statically, for docs and previews.                           |
| `onReserve`         | `() => void \| Promise<void>`      | none                 | Return a promise to drive loading and success; a rejection returns to idle.               |
| `onBook`            | `() => void`                       | none                 | The advisor card's booking button.                                                        |
| `onEngravingStyles` | `() => void`                       | none                 | The feature card's link-style button.                                                     |
| `className`         | `string`                           | `""`                 | Extra classes for the `<section>`.                                                        |

## Tokens

Reads `--iu-surface` (cards), `--iu-background` (dial and caseback), `--iu-border` (frames and rules), `--iu-foreground` (ink, the Reserve fill, the drawing), `--iu-muted` (labels and details), `--iu-accent` (only fine marks: the hairline trace, the seconds hand, the moon, the rule under the watch, focus rings), `--iu-radius` (capped at 2px for cards; buttons are pills by design), `--iu-font` and `--iu-density` (gap between cards). Names and prices use the project's `font-serif`.

## Dependencies

`react`, `motion` (the hairline trace and note cross-fade) and `lucide-react` (arrow and check). Tailwind CSS 4.1 or later.

## Integration steps

1. Run `npx shadcn@latest add @iloveui/verelle-cards` (or copy `component.tsx` into `components/iloveui/`).
2. Add the `--iu-*` tokens (`npx shadcn@latest add @iloveui/tokens`) and map `--font-serif` in your theme.
3. Pass your `product` and `advisor`, and return your reservation request from `onReserve` (for example `onReserve={() => reserve(productId)}`).
4. Use `disabled` when the allocation or calendar is full; the copy switches to waiting-list language.
5. Replace the `Watch` drawing with your own SVG product illustration if you sell something else; keep it on the stage.

## Customization ideas

- Fragrance house: swap the watch for a drawn bottle and engraving for a monogrammed cap.
- Add a size or strap selector as a row of fine pill toggles above Reserve.
- Show the advisor's next three slots as small outline pills that book directly.
- Put the three cards in a horizontal scroller on mobile instead of a stack.
- Use the accent as the Reserve fill for brands with a strong signature color, keeping the hairline in `--iu-foreground`.
