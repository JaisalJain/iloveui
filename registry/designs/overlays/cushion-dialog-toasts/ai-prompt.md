# Cushion dialog and toasts

## Component

`CushionDialogToasts` is a soft, pressable scheduling flow for a newsletter tool, built as three overlay pieces you can lift out: a drafts list whose Schedule buttons open a modal dialog, the dialog itself (a day segmented control with a sliding thumb, send-time cards with predicted open rates, a time zone switch, a live summary and a loading-safe primary button), and a toast stack in the corner. The dialog is centered from 640px and becomes a bottom sheet below that, which can be dragged down by its handle to dismiss. Toasts stack as a deck; hovering or focusing the deck fans it out, shows "Paused" and freezes each toast's countdown ring until the pointer or focus leaves.

## Props

| Prop                 | Type                                                   | Default                    | Description                                                                           |
| -------------------- | ------------------------------------------------------ | -------------------------- | ------------------------------------------------------------------------------------- |
| `brand`              | `string`                                               | `"Paperlane"`              | Product name in the header.                                                           |
| `author`             | `string`                                               | `"Mara Lindgren"`          | Signed-in person, shown as a monogram.                                                |
| `audience`           | `number`                                               | `12847`                    | Subscriber count used in the copy and summary.                                        |
| `homeTimeZone`       | `string`                                               | `"Lisbon time (WET)"`      | Shown when per-reader time zones are off.                                             |
| `issues`             | `CushionIssue[]`                                       | Three drafts               | Rows of the drafts list: `{ id, number, title, words, edited }`.                      |
| `days`               | `CushionDay[]`                                         | Today, Tomorrow, Thursday  | Segmented day options; `isToday` disables slots marked `passedToday`.                 |
| `slots`              | `CushionSlot[]`                                        | 07:30, 09:00, 12:15, 17:45 | Send times with predicted open rates; the highest gets the Best tag.                  |
| `defaultDayId`       | `string`                                               | `"wed"`                    | Initially selected day.                                                               |
| `defaultTime`        | `string`                                               | `"09:00"`                  | Initially selected time.                                                              |
| `defaultOpenIssueId` | `string \| null`                                       | `null`                     | Opens the dialog for this issue on first render, without moving focus.                |
| `defaultScheduled`   | `CushionSchedule[]`                                    | `[]`                       | Issues that already have a slot.                                                      |
| `initialToasts`      | `CushionToast[]`                                       | `[]`                       | Toasts present on first render.                                                       |
| `stackExpanded`      | `boolean`                                              | `false`                    | Keeps the stack fanned out and paused, as in a notification center.                   |
| `status`             | `"idle" \| "loading" \| "error"`                       | `undefined`                | Forces the dialog's request state.                                                    |
| `errorMessage`       | `string`                                               | Send queue message         | Copy of the inline error.                                                             |
| `onSchedule`         | `(schedule: CushionSchedule) => void \| Promise<void>` | `undefined`                | Return a promise to show loading; reject it to show the error and a Try again button. |
| `onUndo`             | `(issueId: string) => void`                            | `undefined`                | Called when Undo in a toast returns an issue to drafts.                               |
| `onOpenChange`       | `(open: boolean) => void`                              | `undefined`                | Called when the dialog opens or closes.                                               |
| `className`          | `string`                                               | `""`                       | Extra classes for the root.                                                           |

`CushionToast` is `{ id, title, description?, tone?: "success" | "info", actionLabel?, duration?: number | null }`; `duration` defaults to 6000ms and `null` keeps the toast until dismissed.

## Tokens

Reads `--iu-background` (page), `--iu-surface` (cards, dialog, raised thumb), `--iu-border` (hairlines), `--iu-foreground` and `--iu-muted` (text and neutral tints), `--iu-accent` and `--iu-accent-foreground` (primary button, Best tag, switch, countdown rings, focus rings, the selected slot's bar), `--iu-radius` (floored at 14 to 28px so it stays soft), `--iu-font` and `--iu-density` (list gaps, card padding and dialog spacing). Tints and soft shadows are mixed from these tokens with `color-mix`, so they follow any theme.

## Dependencies

`react`, `motion` (dialog and sheet transitions, the sliding day thumb, drag to dismiss, the toast deck and countdown rings) and `lucide-react` (icons). Tailwind CSS 4.1 or later.

## Integration steps

1. Run `npx shadcn@latest add @iloveui/cushion-dialog-toasts` (or copy `component.tsx` into `components/iloveui/`).
2. Make sure the `--iu-*` tokens exist in your global CSS (`npx shadcn@latest add @iloveui/tokens`).
3. Render `<CushionDialogToasts issues={drafts} onSchedule={scheduleIssue} />` on the drafts route, mapping your records to `CushionIssue`.
4. Make `onSchedule` call your API and return its promise: the button shows Scheduling while it is pending, a rejection keeps the dialog open with the inline error, and a resolution closes it, returns focus to the row's button and pushes the success toast.
5. Wire `onUndo` to unschedule on the server; the component already restores the row and confirms with a second toast.
6. To reuse only the overlays, keep the dialog block and `ToastStack` and drop the drafts list; the focus trap, Escape handling, scroll lock and F8 shortcut live in the main component's effects.

## Customization ideas

- Swap the scheduling fields for a confirmation (archive, publish, transfer) and keep the same sheet, trap and toast feedback.
- Raise the stack limit from five or move the deck to the top edge for desktop apps with a bottom toolbar.
- Feed `slots` from your analytics so the Best tag follows real open rates per audience.
- Give `info` toasts a different icon set for warnings, using the amber status hue with a text label.
- Set `stackExpanded` in a notification center panel to reuse the same toast cards as a history list.
