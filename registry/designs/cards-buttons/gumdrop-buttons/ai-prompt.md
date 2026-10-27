# Gumdrop buttons

## Component

`gumdrop-buttons` is a playful button family plus one card, shipped as a component set in a single file. Every button is a chunky pill that sits on a lip, an offset shadow tinted from the accent. A press sinks the button into its lip and squashes it, and letting go springs back past rest before it settles. Hover lifts it 2px on a taller lip. A loading button keeps its exact width (the label stays in the layout, invisible) and shows three bouncing dots. On success the label shrinks away and a checkmark draws itself in its place.

The file exports five components:

- `GumdropButton`: primary, secondary, ghost and destructive variants in two sizes (`md` 48px, `sm` 36px).
- `GumdropIconButton`: a round icon-only button with a required accessible name, optionally a toggle (`aria-pressed`). It wiggles once when a mouse arrives.
- `GumdropSplitButton`: a "Publish" action joined to a chevron that opens a menu (WAI-ARIA menu button pattern).
- `StreakCard`: a reading-habit card with a 12-day streak, a week of gumdrop-shaped day markers and one action. Logging today rolls the count to 13, fills today's gumdrop while its check draws, and makes the flame hop; once the check has drawn, the button settles into a quiet tinted "Logged today" pill.
- `GumdropButtons` (also the default export): the whole set on an accent-tinted tray, ready to preview.

All motion is CSS (a `linear()` spring curve at stiffness 400, damping 18) plus one-shot Web Animations, so the React and HTML versions move identically. With reduced motion every change is instant and the dots stand still.

## Props

### GumdropButtons

| Prop               | Type                                                                                          | Default                  | Description                                                                                              |
| ------------------ | --------------------------------------------------------------------------------------------- | ------------------------ | -------------------------------------------------------------------------------------------------------- |
| `status`           | `"idle" \| "loading" \| "success"`                                                            | unset                    | Forces a status on both Publish buttons and the check-in. Leave unset for live behaviour.                |
| `disabled`         | `boolean`                                                                                     | `false`                  | Disables every button in the set.                                                                        |
| `forceState`       | `"hover" \| "focus" \| "active"`                                                              | unset                    | Renders every button in one interaction state, for previews and visual tests.                            |
| `publishLabel`     | `string`                                                                                      | `"Publish"`              | Label of the split buttons.                                                                              |
| `publishOptions`   | `GumdropMenuItem[]`                                                                           | Three publish options    | Items of the Publish menus.                                                                              |
| `onPublish`        | `(choice: string) => unknown`                                                                 | unset                    | `"now"` for the main button, otherwise the menu item id. Return a promise to show loading, then success. |
| `onSaveDraft`      | `() => unknown`                                                                               | unset                    | Save draft. Return a promise for loading and success.                                                    |
| `onPreview`        | `() => unknown`                                                                               | unset                    | Preview.                                                                                                 |
| `onDelete`         | `() => unknown`                                                                               | unset                    | Delete. Return a promise for loading and success.                                                        |
| `onNewNote`        | `() => unknown`                                                                               | unset                    | The primary icon button.                                                                                 |
| `onBookmarkChange` | `(saved: boolean) => void`                                                                    | unset                    | The bookmark toggle; both sizes share one state.                                                         |
| `onShare`          | `() => unknown`                                                                               | unset                    | The share icon button.                                                                                   |
| `onMore`           | `() => unknown`                                                                               | unset                    | The ghost "More actions" icon button.                                                                    |
| `streak`           | `Omit<StreakCardProps, "status" \| "disabled" \| "forceState" \| "onCheckIn" \| "className">` | The reading streak below | Content of the streak card.                                                                              |
| `onCheckIn`        | `() => unknown`                                                                               | unset                    | The card's action. Return a promise to show loading until it settles.                                    |
| `className`        | `string`                                                                                      | `""`                     | Extra classes for the `<section>`.                                                                       |

### GumdropButton

Accepts every native `<button>` attribute plus:

| Prop          | Type                                                   | Default           | Description                                                                             |
| ------------- | ------------------------------------------------------ | ----------------- | --------------------------------------------------------------------------------------- |
| `variant`     | `"primary" \| "secondary" \| "ghost" \| "destructive"` | `"primary"`       | Accent candy, surface candy, text only, or red for actions that destroy data.           |
| `size`        | `"md" \| "sm"`                                         | `"md"`            | 48px or 36px tall; `sm` grows to 40px on touch screens.                                 |
| `icon`        | `ReactNode`                                            | unset             | Leading icon, for example a lucide icon at 16–18px.                                     |
| `onClick`     | `(event) => unknown`                                   | unset             | Return a promise and the button shows dots while it is pending, then the check.         |
| `status`      | `"idle" \| "loading" \| "success"`                     | unset             | Controlled status, when your app owns the request state.                                |
| `loadingText` | `string`                                               | `"Working on it"` | Announced through a polite live region while loading.                                   |
| `successText` | `string`                                               | `"Done"`          | Announced on success.                                                                   |
| `successHold` | `number`                                               | `1600`            | Milliseconds the check stays before returning to idle; `0` keeps it. Uncontrolled only. |
| `forceState`  | `"hover" \| "focus" \| "active"`                       | unset             | Renders the state statically (sets `data-force-state`).                                 |

### GumdropIconButton

The same props as `GumdropButton` (without `icon` and `children`), plus `label: string` (required, the accessible name), `icon: ReactNode` (required) and `pressed?: boolean` (makes it a toggle; the icon fills with the accent when on). `variant` defaults to `"secondary"`.

### GumdropSplitButton

| Prop                                        | Type                         | Default                               | Description                                                  |
| ------------------------------------------- | ---------------------------- | ------------------------------------- | ------------------------------------------------------------ |
| `label`                                     | `string`                     | `"Publish"`                           | The main action.                                             |
| `items`                                     | `GumdropMenuItem[]`          | Club only, schedule, unlisted         | `{ id, label, hint?, icon? }` for each menu item.            |
| `menuLabel`                                 | `string`                     | `"More publish options"`              | Accessible name of the chevron.                              |
| `onClick`                                   | `() => unknown`              | unset                                 | The main action. Return a promise for loading, then success. |
| `onSelect`                                  | `(id: string) => unknown`    | unset                                 | A menu choice. Return a promise for loading, then success.   |
| `size`, `status`, `disabled`, `forceState`  | as on `GumdropButton`        |                                       |                                                              |
| `loadingText`, `successText`, `successHold` | `string`, `string`, `number` | `"Publishing"`, `"Published"`, `1600` |                                                              |

### StreakCard

| Prop                                            | Type                  | Default                 | Description                                                                            |
| ----------------------------------------------- | --------------------- | ----------------------- | -------------------------------------------------------------------------------------- |
| `title`                                         | `string`              | `"Reading streak"`      | Card heading.                                                                          |
| `streak`                                        | `number`              | `12`                    | Days in a row before today. Logging today adds one.                                    |
| `best`                                          | `number`              | `16`                    | Personal best, shown on the sticker and in the copy.                                   |
| `goal`                                          | `string`              | `"Read 20 pages"`       | Used in the prompt: "Read 20 pages today to make it 13."                               |
| `week`                                          | `StreakDay[]`         | Mon–Thu done, Fri today | `{ label, name, state: "done" \| "today" \| "upcoming" }` for seven days.              |
| `actionLabel`                                   | `string`              | `"Log today's pages"`   | The one action.                                                                        |
| `doneLabel`                                     | `string`              | `"Logged today"`        | The button's label once today is logged, after the check has drawn.                    |
| `loggedToday`                                   | `boolean`             | unset                   | Controlled: whether today is already logged (renders the settled "Logged today" pill). |
| `onCheckIn`                                     | `() => unknown`       | unset                   | Return a promise to show loading; without one, today logs at once.                     |
| `status`, `disabled`, `forceState`, `className` | as on `GumdropButton` |                         |                                                                                        |

## Tokens

Reads `--iu-accent` (primary faces, the flame, done markers, today's dashed outline and focus rings), `--iu-accent-foreground` (labels and checks on accent), `--iu-surface` (secondary faces, the card and the menu), `--iu-background` (the tray in dark mode), `--iu-foreground` (text, and the neutral the edges are mixed from), `--iu-muted` (secondary text and disabled labels), `--iu-radius` (card, menu, tray and sticker corners; buttons stay full pills), `--iu-font` and `--iu-density` (button and card padding, gaps). Edges and lips are mixed in `color-mix(in oklab, …)` from the accent at about 30% over a neutral, so a new brand color re-tints every candy at once. In light mode the focus ring is the accent shaded toward `--iu-foreground` so it keeps 3:1 on the tinted tray. The destructive button uses Tailwind's red scale with deliberate dark values, always with a trash icon and text. Add the tokens once with `npx shadcn@latest add @iloveui/tokens`.

## Dependencies

`react` and `lucide-react` (icons). No animation library: the springs are a CSS `linear()` easing curve and the one-shot moments use the Web Animations API, so the HTML version needs no runtime at all. Browsers without `linear()` fall back to a plain ease. Tailwind CSS 4.1 or later.

## Integration steps

1. Run `npx shadcn@latest add @iloveui/gumdrop-buttons` (or copy `component.tsx` to `components/iloveui/gumdrop-buttons.tsx`).
2. Make sure the `--iu-*` tokens exist in your global CSS (`npx shadcn@latest add @iloveui/tokens` adds them).
3. Import the pieces you need: `import { GumdropButton, GumdropIconButton, GumdropSplitButton, StreakCard } from "@/components/iloveui/gumdrop-buttons"`. Render `<GumdropButtons />` only for a style or docs page.
4. Wire async actions by returning the request's promise from `onClick`: `<GumdropButton variant="secondary" onClick={() => saveDraft(noteId)}>Save draft</GumdropButton>`. The button shows dots while it is pending, the check when it resolves, and returns to idle after `successHold`; a rejection returns it to idle, so show your own error message. When a store owns the request state, pass `status` instead.
5. For the split button, pass `onClick` for the main action and `onSelect(id)` for menu choices. Arrow keys, Home/End, type-ahead, Escape and focus return are built in.
6. For the streak card, map your API to `streak` (days before today), `best`, `week` and `loggedToday`, and return the check-in request from `onCheckIn`.
7. Use `forceState`, `status` and `disabled` to render states in Storybook or visual tests; never ship them hard-coded.
8. Keep one primary button per view; use secondary and ghost for the rest and destructive only for actions that delete data.

## Customization ideas

- Deepen the candy: in the `SIZE` map, raise `--gd-lip` to `6px` for `md` (and `--gd-rise` to `3px` in `VARIANT`) for a taller, toy-like press.
- Turn `GumdropIconButton` with `pressed` into a reaction bar: a heart, a bookmark and a pin, each filling with the accent when on.
- Reuse `StreakCard` for any daily habit: swap the flame for a sprouting leaf drawn from two circles and a stem, and `goal` for "Practice 15 minutes".
- Add a confirmation step to Delete: the first click swaps the label to "Delete draft?" and the second runs the request; give the button a `min-w-*` so the swap does not shift the row.
- Use the rolling digits on other counters, such as an unread badge or a cart quantity, by exporting `RollingNumber`.
