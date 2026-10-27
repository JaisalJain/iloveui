# Layer peel card

## Component

`LayerPeelCard` is a feature section that explains composition by showing it. On the right, a small savings-app screen is built from four real layers (frame, chart, balance card, round-up toast) stacked in 3D. Moving a mouse over the stage tilts the stack so the layers part slightly in parallax. Pressing Pull it apart tips the stack into an isometric view and spaces the layers out with a bouncy spring, each one outlined as a dashed sheet with a numbered sticker. The list on the left maps every layer to the component it exports as; hovering, focusing or pressing a row lifts that layer out of the stack and dims the rest. Under reduced motion there is no tilt, and pulling apart fans the sheets out flat and instantly.

## Props

| Prop               | Type                              | Default                          | Description                                                            |
| ------------------ | --------------------------------- | -------------------------------- | ---------------------------------------------------------------------- |
| `brand`            | `string`                          | `"Mallow"`                       | Product name on the sticker label.                                     |
| `headline`         | `string`                          | `"Every screen is a stack. ..."` | The one message.                                                       |
| `subline`          | `string`                          | Export explanation               | Supporting sentence.                                                   |
| `ctaLabel`         | `string`                          | `"Try it on your file"`          | Label of the only primary action.                                      |
| `ctaHref`          | `string`                          | `"#import"`                      | Where the action goes.                                                 |
| `layers`           | `PeelLayer[]`                     | Frame, Chart, Balance, Toast     | Four layers bottom to top: `{ name, exportName, note }`.               |
| `defaultExploded`  | `boolean`                         | `false`                          | Start pulled apart.                                                    |
| `onExplodedChange` | `(exploded: boolean) => void`     | none                             | Called when the visitor pulls the stack apart or stacks it back.       |
| `onLayerSelect`    | `(index: number \| null) => void` | none                             | Called when a layer is highlighted from the list, `null` when cleared. |
| `className`        | `string`                          | `""`                             | Extra classes for the `<section>`.                                     |

## Tokens

Reads `--iu-background` (section), `--iu-surface` (app frame, list rows, buttons, toast), `--iu-foreground` (2px outlines and hard shadows), `--iu-muted` (notes and labels), `--iu-accent` (balance card, active bar, stickers, primary button, focus rings; offset shadows mix it 30% into the foreground or background), `--iu-accent-foreground`, `--iu-radius` (floored at 16 to 20px), `--iu-font` and `--iu-density` (list row padding). Add them once with `npx shadcn@latest add @iloveui/tokens`.

## Dependencies

`react`, `motion` (springs for tilt, explode and the layer lift) and `lucide-react` (layers and arrow icons). Tailwind CSS 4.1 or later.

## Integration steps

1. Run `npx shadcn@latest add @iloveui/layer-peel-card` (or copy `component.tsx` to `components/iloveui/layer-peel-card.tsx`).
2. Make sure the `--iu-*` tokens exist in your global CSS (`npx shadcn@latest add @iloveui/tokens`).
3. Render `<LayerPeelCard />` as a feature section and pass your own `headline`, `subline` and `layers` (names, export names and notes).
4. Replace the miniature screen markup inside each layer with a miniature of your own product, keeping one visual per layer.
5. Wire `onExplodedChange` or `onLayerSelect` to analytics if you want to know which layer people inspect.

## Customization ideas

- Explain a design system: tokens, primitives, components and patterns as the four layers.
- Show an email template: background, content blocks, personalization and tracking pixel layer.
- Start with `defaultExploded` on a docs page and let readers stack it back.
- Explain a map product: base tiles, roads, labels and live vehicles.
- Raise `--iu-radius` above 20px for an even softer, toy-like stack.
