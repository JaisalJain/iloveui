# Fare slide to pay

## Component

`FareSlideToPay` is a checkout card for a train fare that the customer pays by sliding a soft thumb along a pill track. The accent fill follows the thumb's leading edge and turns solid once the thumb passes the threshold line, so the customer sees when letting go will pay. Release past the line (or flick fast enough that the projected position passes it) and the thumb springs to the end, shows a spinner, then docks as a check while the track reads "Paid €40.90". Release short and it springs home carrying the release velocity. Keyboard: the thumb is a `role="slider"`; arrow keys drag it in steps, Enter, Space or End pays, Home or Escape sends it back. Every state change is announced through a polite live region. Under reduced motion the thumb still follows the pointer, but settling is instant and labels cross-fade briefly.

## Props

| Prop                  | Type                                          | Default                           | Description                                                                         |
| --------------------- | --------------------------------------------- | --------------------------------- | ----------------------------------------------------------------------------------- |
| `operator`            | `string`                                      | `"Brisa Rail"`                    | Brand shown in the card header.                                                     |
| `service`             | `string`                                      | `"Alfa 128"`                      | Train or ride name under the brand.                                                 |
| `date`                | `string`                                      | `"Thu 12 Mar 2026"`               | Travel date.                                                                        |
| `duration`            | `string`                                      | `"2h 49m"`                        | Journey time on the route line.                                                     |
| `from` / `to`         | `{ station: string; time: string }`           | Lisbon to Porto                   | Departure and arrival.                                                              |
| `seat`                | `string`                                      | `"Coach 4, seat 62, window"`      | Seat summary.                                                                       |
| `passengers`          | `string`                                      | `"1 adult"`                       | Passenger summary.                                                                  |
| `lines`               | `FareLine[]`                                  | Three fare lines                  | `{ label, amount }` rows; the total is their sum.                                   |
| `currency` / `locale` | `string`                                      | `"EUR"` / `"en-IE"`               | Passed to `Intl.NumberFormat`.                                                      |
| `paymentMethod`       | `string`                                      | `"Visa ending 4417"`              | The saved card being charged.                                                       |
| `confirmation`        | `string`                                      | Ticket email sentence             | Shown and announced after success.                                                  |
| `bookingReference`    | `string`                                      | `"BR7-K4Q2"`                      | Shown in mono after success.                                                        |
| `errorMessage`        | `string`                                      | Declined sentence                 | Shown and announced on error.                                                       |
| `refundNote`          | `string`                                      | VAT and cancellation line         | Small print at the bottom.                                                          |
| `labels`              | `Partial<FareSlideLabels>`                    | See source                        | `idle`, `retry`, `loading`, `success` and `hint` texts.                             |
| `threshold`           | `number`                                      | `0.82`                            | Fraction of travel a release must reach (after velocity projection) to pay.         |
| `keyboardStep`        | `number`                                      | `0.1`                             | Fraction of travel per arrow key press.                                             |
| `velocityProjection`  | `number`                                      | `0.18`                            | Seconds of release velocity added to the position before comparing to `threshold`.  |
| `spring`              | `{ stiffness: number; damping: number }`      | `{ stiffness: 400, damping: 30 }` | Spring used for snap-back and completion.                                           |
| `reducedMotionFadeMs` | `number`                                      | `150`                             | Cross-fade length under reduced motion.                                             |
| `status`              | `"idle" \| "loading" \| "error" \| "success"` | uncontrolled                      | Set to control the state yourself.                                                  |
| `disabled`            | `boolean`                                     | `false`                           | Locks the slider and shows `disabledLabel` and `disabledReason`.                    |
| `disabledLabel`       | `string`                                      | `"Choose a seat to pay"`          | Track text while disabled.                                                          |
| `disabledReason`      | `string`                                      | Seat hold sentence                | Explanation under the track while disabled.                                         |
| `forceState`          | `"active"`                                    | none                              | Renders the mid-drag look for docs and previews.                                    |
| `onChange`            | `(progress: number) => void`                  | none                              | Progress from 0 to 1 while the thumb moves.                                         |
| `onComplete`          | `() => void \| Promise<void>`                 | none                              | Called when the gesture completes. A promise drives loading, then success or error. |
| `className`           | `string`                                      | `""`                              | Extra classes for the card.                                                         |

## Tokens

Reads `--iu-surface` (card and thumb), `--iu-accent` (track tint, fill, focus ring), `--iu-accent-foreground` (text on the solid fill), `--iu-foreground`, `--iu-muted`, `--iu-border`, `--iu-background` (dark track), `--iu-radius` (floored at 20px for the card and 14px for the fare panel), `--iu-font` and `--iu-density` (card padding). Add them with `npx shadcn@latest add @iloveui/tokens`.

## Dependencies

`react`, `motion` (drag, springs and cross-fades) and `lucide-react` (train, arrow, spinner, check, retry and alert icons). Tailwind CSS 4.1 or later.

## Integration steps

1. Run `npx shadcn@latest add @iloveui/fare-slide-to-pay` (or copy `component.tsx` into `components/iloveui/`).
2. Make sure the `--iu-*` tokens exist in your global CSS.
3. Map your order to `lines`, `from`, `to`, `seat` and `paymentMethod`.
4. Pass `onComplete={() => confirmPayment(orderId)}` returning a promise: resolve to show the check, reject to show `errorMessage` and send the thumb home for a retry.
5. If your payment state lives elsewhere (a webhook, a store), pass `status` instead and drive it yourself.
6. Pass `disabled` until the order can be paid, with a `disabledReason` that says what is missing.

## Customization ideas

- A ride-hailing receipt: swap the route line for pickup and drop-off with an ETA, keep the slider.
- Lower `threshold` to 0.7 for one-handed phone use, or raise it to 0.95 for large amounts.
- Add a split-fare row under the total and append "your share" to the idle label.
- Use the same track for "Slide to unlock" on a kiosk by hiding the fare panel.
- Show a seat map in the disabled state and enable the slider when a seat is picked.
