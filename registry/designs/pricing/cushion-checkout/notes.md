# Cushion checkout

## Usage notes

- Use it as the checkout page of a per-seat subscription, or in a dialog after someone picks a plan. It expects per-seat prices in cents for both billing periods, a list of billing countries with their tax label and rate, and the receipt details your payment provider returns.
- The summary and the form sit side by side once the component is 42rem wide (container query) and stack below that, summary first, so the price is known before any field.
- Billing is a fieldset of two native radios with a sliding thumb; the seat stepper is a group of two labelled buttons around the count, disabled at the limits. Every change announces the new total through a polite live region; amounts are drawn by the tween for sight and read from a static sr-only copy.
- Fields have visible labels. Validation is late to punish and early to reward: an error appears on blur (for text that is there) or on submit and clears as soon as the value is fixed. Errors carry an icon, set `aria-invalid` and are referenced by `aria-describedby`; submit moves focus to the first invalid field and announces how many need attention. The card number groups as you type (4-6-5 for Amex), shows the detected brand, and is checked with the Luhn sum; the security code length follows the brand.
- The tax line follows the country: rate, tax name, the country it is charged for and the postal label all update, and the line under the Pay button repeats the tax included. The refund line states the refund window and the renewal date for the chosen billing period.
- States: default, loading (button pressed in with a spinner, width kept, fields disabled), error (an alert above the fields; the button reads Try again with the amount) and success (the form becomes a receipt; focus moves to its heading). The spinner is the only loop: it runs only while paying and pauses offscreen. Motion is instant under reduced motion.
- `--iu-density` scales the panel padding.

## Taste self-review

- One clear focal point: Yes. The total due today, the largest figure, mirrored on the accent Pay button; both move together when anything changes.
- Spacing on the 4px scale: Yes. Field gaps 20px, label gaps 8px, panel padding 24px and 36px scaled by density, control heights 40, 48 and 56px.
- Belongs in a Linear, Stripe or Vercel product: Yes. It reads like a modern hosted checkout: a calm summary beside a short form, honest tax and refund lines, and a receipt that answers what was paid and when it renews.
- Meets its category brief: Yes. A clear tax line that follows the country, a refund line with the renewal date, a monthly/yearly control with the saving stated, and loading, error and success states for checkout. As a single-plan checkout it highlights the one plan being bought.
- Distinct from every other design in its category: Yes. Slab pricing and Hairline pricing are plan tables; this is the payment step itself, with a live order summary, inline card validation and a receipt.
