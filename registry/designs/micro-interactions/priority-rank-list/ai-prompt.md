# Priority rank list

## Component

`PriorityRankList` is a stack-rank list for roadmap bets, a backlog or a playlist. Each card has a big rank badge, owner, estimate and a grip handle. Drag the handle and the card lifts, leans into the direction you throw it (a tilt driven by drag velocity), and the other cards spring out of its way; on release it springs into its slot carrying the release velocity. The rank numbers roll to their new values, the top items wear a "Ships" sticker, and a capacity meter in the header refills live with the top items' estimates, turning amber with an "Over by N wk" note when the ranking no longer fits. The same reorder works from the keyboard and is announced through a polite live region. Drops call `onChange`; a returned promise shows "Saving order…", then a drawn check, and a rejection restores the previous order with Try again.

## Props

| Prop               | Type                                            | Default                   | Description                                                                           |
| ------------------ | ----------------------------------------------- | ------------------------- | ------------------------------------------------------------------------------------- |
| `items`            | `RankItem[]`                                    | Six product bets          | Items in their starting order. An empty array shows the empty state.                  |
| `eyebrow`          | `string`                                        | `"Sprout · Q1 2026"`      | Sticker label above the title.                                                        |
| `title`            | `string`                                        | `"Rank what ships first"` | Heading; also labels the list.                                                        |
| `cutoff`           | `number`                                        | `3`                       | How many items from the top ship this cycle.                                          |
| `capacityWeeks`    | `number`                                        | `10`                      | Capacity the items above the cutoff share.                                            |
| `cycleLabel`       | `string`                                        | `"this quarter"`          | Used in announcements when an item crosses the cutoff.                                |
| `savedDuration`    | `number`                                        | `2400`                    | How long "Order saved" stays, in ms.                                                  |
| `haptics`          | `boolean`                                       | `true`                    | Short `navigator.vibrate` pulses on pick-up and save, where supported.                |
| `disabled`         | `boolean`                                       | `false`                   | Locks the ranking; handles show a lock.                                               |
| `disabledReason`   | `string`                                        | Sprint-lock sentence      | Notice shown when disabled.                                                           |
| `emptyActionLabel` | `string`                                        | `"Add a priority"`        | The empty state's one action.                                                         |
| `forceState`       | `"active" \| "loading" \| "error" \| "success"` | none                      | Freezes a state for previews and visual tests.                                        |
| `onChange`         | `(items) => void \| Promise<void>`              | none                      | Called after each committed move. Return a promise to show saving; reject to restore. |
| `onComplete`       | `(items) => void`                               | none                      | Called once a new order is saved.                                                     |
| `onEmptyAction`    | `() => void`                                    | none                      | Click handler for the empty state action.                                             |
| `className`        | `string`                                        | `""`                      | Extra classes on the root `<section>`.                                                |

`RankItem` is `{ id: string; title: string; owner: string; weeks: number }`.

## Tokens

Reads `--iu-foreground` (2px outlines, hard offset shadows, text), `--iu-surface` (cards), `--iu-background` (unranked badges, meter track), `--iu-muted` (secondary text), `--iu-accent` and `--iu-accent-foreground` (top-rank badges, the eyebrow sticker, the meter fill, the lifted card's tinted shadow and focus rings), `--iu-radius` (floored at 16px), `--iu-font` and `--iu-density` (card padding and gaps). Over-capacity and save errors use semantic amber and red with icons and text. Add the tokens once with `npx shadcn@latest add @iloveui/tokens`.

## Dependencies

`react`, `motion` (`Reorder`, drag controls, velocity-driven tilt, rolling numbers, layout springs) and `lucide-react` (grip, lock, loader, alert, retry and plus icons). Tailwind CSS 4.1 or later.

## Integration steps

1. Run `npx shadcn@latest add @iloveui/priority-rank-list` (or copy `component.tsx` to `components/iloveui/priority-rank-list.tsx`).
2. Make sure the `--iu-*` tokens exist in your global CSS (`npx shadcn@latest add @iloveui/tokens`).
3. Pass your items with stable `id`s. The component owns the order while people drag; seed it with your saved order.
4. Persist in `onChange`: send the ids in order and return the request's promise. Throw on failure and the list puts the previous order back with a Try again action.
5. Set `cutoff` and `capacityWeeks` to your team's numbers, or set `capacityWeeks` to the sum of all estimates to hide the over-capacity warning.
6. Pass `disabled` while a sprint is running or for viewers, and use `forceState` only in stories and visual tests.

## Customization ideas

- A setlist: rename `weeks` to minutes, `cutoff` to the encore, and the meter becomes "set length".
- Replace the owner line with a vote count and sort by it as the default order.
- Show a dashed "cut line" card between the cutoff and the rest of the list.
- Add a horizontal variant with `axis="x"` for a kanban lane of cards.
- Raise the tilt range to ±6 degrees for a more physical feel on touch screens.
