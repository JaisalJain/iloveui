# Meridian scheduling bento

## Component

`MeridianBento` is a features section for a scheduling product, set as a Swiss grid of five cells separated by 1px rules. Cell 01 is a working time-zone finder: four teammates' working hours sit on a shared 24-hour UTC axis, and a one-hour meeting block (a keyboard and pointer slider) moves across them. As it moves, every row's local time cross-fades, a check or moon marks who is inside working hours, and the slider reports how many people are free. The other cells show a booking link with open slots, buffers between calls, protected focus hours and two-way calendar sync, each as a miniature interface.

## Props

| Prop            | Type                                                 | Default                         | Description                                                             |
| --------------- | ---------------------------------------------------- | ------------------------------- | ----------------------------------------------------------------------- |
| `kicker`        | `string`                                             | `"Meridian scheduling"`         | Small uppercase label above the grid rule.                              |
| `headline`      | `string`                                             | `"Meetings land where every …"` | Section heading.                                                        |
| `subline`       | `string`                                             | Product summary sentence        | Supporting paragraph beside the heading.                                |
| `people`        | `MeridianPerson[]`                                   | Four teammates in four cities   | Rows of the time-zone finder: name, city, UTC offset and working hours. |
| `defaultSlot`   | `number`                                             | `28`                            | Meeting start in half hours from 00:00 UTC (28 is 14:00).               |
| `meetingLength` | `number`                                             | `2`                             | Meeting length in half hours.                                           |
| `bookingTitle`  | `string`                                             | `"Intro call, 30 min"`          | Title on the booking card.                                              |
| `bookingHost`   | `string`                                             | `"Ines Duarte"`                 | Host shown on the booking card.                                         |
| `bookingSlots`  | `{ time: string; selected?: boolean }[]`             | Eight slots, 11:30 selected     | Open times on the booking card.                                         |
| `focusHours`    | `number[]`                                           | `[2.5, 1.5, 3, 2, 2.5]`         | Protected focus hours per weekday; the total becomes the large figure.  |
| `calendars`     | `{ name: string; detail: string; synced: string }[]` | Three calendars                 | Rows of the sync cell.                                                  |
| `onSlotChange`  | `(startHalfHour: number) => void`                    | none                            | Called when the meeting block moves.                                    |
| `className`     | `string`                                             | `""`                            | Extra classes for the `<section>`.                                      |

`MeridianPerson` is `{ name: string; city: string; utcOffset: number; workStart: number; workEnd: number }`.

## Tokens

Reads `--iu-background` (section), `--iu-surface` (cells), `--iu-border` (the rules between cells and rows), `--iu-foreground` (text, working-hour fills, the dark booking day and confirm bar), `--iu-muted` (labels and captions), `--iu-accent` (only the meeting block and its bands, plus focus rings), `--iu-accent-foreground` (grip marks on the block), `--iu-radius` (capped at 6px), `--iu-font` and `--iu-density` (cell padding and row height).

## Dependencies

`react`, `motion` (cross-fading local times) and `lucide-react` (check and moon icons). Tailwind CSS 4.1 or later.

## Integration steps

1. Run `npx shadcn@latest add @iloveui/meridian-bento` (or copy `component.tsx` into `components/iloveui/meridian-bento.tsx`).
2. Make sure the `--iu-*` tokens exist in your global CSS (`npx shadcn@latest add @iloveui/tokens`).
3. Render `<MeridianBento />` in your landing page below the hero.
4. Replace `people` with your own team or a believable sample; set `utcOffset` for the date you show, since daylight saving changes it.
5. Pass `onSlotChange` if you want to track interaction, and swap the copy in `headline`, `subline` and the booking props.

## Customization ideas

- Make the meeting length adjustable with a 30, 60 and 90 minute segmented control that sets `meetingLength`.
- Snap the block to the best overlap on mount by computing the slot with the most people in working hours.
- Replace the calendar sync rows with your real integrations and their last-sync times.
- Add a sixth cell for meeting polls, spanning four columns beside the sync row.
- Shade weekends or holidays in the strips by passing per-person blocked hours.
