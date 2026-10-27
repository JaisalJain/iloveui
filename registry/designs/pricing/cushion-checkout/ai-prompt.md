# Cushion checkout

## Component

`CushionCheckout` is a self-serve checkout for a per-seat subscription, in the soft tactile style. The left panel is the order summary on an accent tint: a billing segmented control with a sliding thumb and the yearly saving, a seat stepper with pressable round keys, line items, a tax line that follows the billing country, the total due today and a refund line. The right panel is the payment form: email, card number with live grouping and brand detection, expiry, security code, name, country and postal code, all validated inline. Changing seats, billing or country glides every amount to its new value with a spring, including the amount on the Pay button. Paying presses the button in and shows a spinner; an error shows a declined-card alert above the fields; success swaps the form for a receipt with a check that draws itself.

## Props

| Prop                | Type                                                 | Default                          | Description                                                                                        |
| ------------------- | ---------------------------------------------------- | -------------------------------- | -------------------------------------------------------------------------------------------------- |
| `productName`       | `string`                                             | `"Tidewell"`                     | Product name in the summary, the receipt and the statement line.                                   |
| `planName`          | `string`                                             | `"Team plan"`                    | Plan name in the summary.                                                                          |
| `seatPrice`         | `{ monthly: number; yearly: number }`                | `{ monthly: 1200, yearly: 960 }` | Price per seat per month in cents for each billing period. The saving badge is computed from it.   |
| `defaultBilling`    | `"monthly" \| "yearly"`                              | `"yearly"`                       | Billing period on first render.                                                                    |
| `defaultSeats`      | `number`                                             | `4`                              | Seats on first render.                                                                             |
| `minSeats`          | `number`                                             | `1`                              | Lowest seat count.                                                                                 |
| `maxSeats`          | `number`                                             | `50`                             | Highest seat count.                                                                                |
| `countries`         | `CushionCountry[]`                                   | Eight countries                  | `{ code, name, taxLabel, taxRate, postalLabel }`; the tax line and postal label follow the choice. |
| `defaultValues`     | `Partial<CushionValues>`                             | Country `GB`                     | Prefill email, card fields, name, country and postal code.                                         |
| `includes`          | `string[]`                                           | Three plan features              | Listed under the total.                                                                            |
| `refundLine`        | `string`                                             | 14-day refund sentence           | Refund and cancellation terms; the renewal date is appended.                                       |
| `status`            | `"idle" \| "loading" \| "error" \| "success"`        | uncontrolled                     | Controlled status. Leave unset and return a Promise from `onPay` to let the component drive it.    |
| `errorTitle`        | `string`                                             | `"Your card was declined"`       | Title of the error alert.                                                                          |
| `errorMessage`      | `string`                                             | Decline explanation              | Body of the error alert.                                                                           |
| `receipt`           | `CushionReceipt`                                     | Reference, date, renewal dates   | `{ reference, date, renewsOn: { monthly, yearly } }`.                                              |
| `onPay`             | `(payment: CushionPayment) => void \| Promise<void>` | none                             | Called with the form values, billing, seats and amounts in cents once every field is valid.        |
| `onOpenWorkspace`   | `() => void`                                         | none                             | Primary action on the receipt.                                                                     |
| `onDownloadReceipt` | `() => void`                                         | none                             | Secondary action on the receipt.                                                                   |
| `className`         | `string`                                             | `""`                             | Extra classes for the `<section>`.                                                                 |

## Tokens

Reads `--iu-surface` (card and focused fields), `--iu-accent` (the summary tint at 7%, the saving badge, the Pay button and its tinted shadow, the success check, focus rings), `--iu-accent-foreground` (text on those fills), `--iu-foreground` (text, control borders at 35%, the card brand chip), `--iu-muted` (helper text), `--iu-border` (card edge and panel divider), `--iu-background` (dark mode tint base), `--iu-radius` (floored at 14px for fields and 24px for the card), `--iu-font` and `--iu-density` (panel padding). Add the tokens with `npx shadcn@latest add @iloveui/tokens`.

## Dependencies

`react`, `motion` (amount tween, billing thumb, receipt entrance and the drawn check) and `lucide-react` (card, lock, stepper, alert, refund and spinner icons). Tailwind CSS 4.1 or later.

## Integration steps

1. Run `npx shadcn@latest add @iloveui/cushion-checkout` (or copy `component.tsx` to `components/iloveui/cushion-checkout.tsx`).
2. Make sure the `--iu-*` tokens exist in your global CSS.
3. Set `seatPrice`, `countries` (with your real tax registrations) and `refundLine` from your billing configuration.
4. Wire `onPay`: never send raw card data to your own server. Replace the card fields with your payment provider's hosted fields or redirect to its hosted checkout, and keep the summary, tax line and states. Return the Promise and the component shows loading, then the receipt or the error alert.
5. Pass the real `receipt` reference and dates from the payment result, and wire `onOpenWorkspace` and `onDownloadReceipt`.

## Customization ideas

- Add a discount code row under the line items that subtracts before tax.
- Collect a VAT number for businesses and set the tax line to "Reverse charge" when it validates.
- Swap the seat stepper for a usage tier slider for metered plans.
- Show a monthly equivalent under the yearly total ("$46.08 a month").
- Put the summary below the form on phones when the cart is long.
