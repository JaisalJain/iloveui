# Hairline pricing

## Component

`HairlinePricing` is a pricing section set on a strict 12-column Swiss grid. The headline and a billing switch hold the left four columns; three plans fill the right eight as ruled columns, and a comparison table below reuses exactly the same columns, so every value sits under its plan. Switching between monthly and yearly cross-fades each price and the line under it, which states the yearly total and the dollar saving per plan. One plan is highlighted with a heavier top rule, a tinted column that runs through the comparison, and the only accent fill: its checkout button. Checkout has loading (a hairline progress under the button), error (an alert row with Try again) and success (the button becomes a confirmation) states.

## Props

| Prop              | Type                                          | Default                          | Description                                                                                                   |
| ----------------- | --------------------------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `eyebrow`         | `string`                                      | `"Lintel · Pricing"`             | Small uppercase label on the top rule.                                                                        |
| `section`         | `string`                                      | `"02 / Plans"`                   | Index label on the right of the top rule.                                                                     |
| `headline`        | `string`                                      | `"Pay for the reviews you run."` | Section heading.                                                                                              |
| `subline`         | `string`                                      | Billing model sentence           | Supporting sentence under the headline.                                                                       |
| `plans`           | `HairlinePlan[]`                              | Solo, Studio, Company            | Three plans read best. Mark exactly one `highlighted`.                                                        |
| `rows`            | `HairlineRow[]`                               | Eight comparison rows            | `values` is keyed by plan id: `true` (check), `false` (dash) or a short string.                               |
| `currencySymbol`  | `string`                                      | `"$"`                            | Printed before every price.                                                                                   |
| `unitLabel`       | `string`                                      | `"per editor / month"`           | Unit beside each price.                                                                                       |
| `terms`           | `string`                                      | Tax and refund sentence          | The tax and refund line under the comparison.                                                                 |
| `defaultBilling`  | `"monthly" \| "yearly"`                       | `"yearly"`                       | Billing period on first render.                                                                               |
| `status`          | `"idle" \| "loading" \| "error" \| "success"` | uncontrolled                     | Controlled checkout status. Leave unset and return a Promise from `onCheckout` to let the component drive it. |
| `checkoutPlanId`  | `string`                                      | `"studio"`                       | The plan a controlled status belongs to.                                                                      |
| `errorMessage`    | `string`                                      | Timeout sentence                 | Text of the error row.                                                                                        |
| `successMessage`  | `string`                                      | Receipt sentence                 | Text under the confirmation.                                                                                  |
| `onCheckout`      | `(planId, billing) => void \| Promise<void>`  | none                             | Called by every plan button and by Try again.                                                                 |
| `onBillingChange` | `(billing) => void`                           | none                             | Called when the billing switch changes.                                                                       |
| `className`       | `string`                                      | `""`                             | Extra classes for the `<section>`.                                                                            |

`HairlinePlan` is `{ id; name; shortName?; summary; price: { monthly: number; yearly: number }; ctaLabel; highlighted?; marker? }`, with prices per seat per month in whole units.

## Tokens

Reads `--iu-background` (section), `--iu-foreground` (type, rules, the selected billing cell and the highlighted column tint), `--iu-muted` (labels and secondary text), `--iu-border` (column and row rules), `--iu-accent` and `--iu-accent-foreground` (the highlighted plan's button and focus rings only), `--iu-radius` (capped at 6px on controls), `--iu-font` and `--iu-density` (comparison row height). Add the tokens with `npx shadcn@latest add @iloveui/tokens`.

## Dependencies

`react`, `motion` (price cross-fade, billing thumb and checkout progress) and `lucide-react` (arrow, check, dash, alert and retry icons). Tailwind CSS 4.1 or later.

## Integration steps

1. Run `npx shadcn@latest add @iloveui/hairline-pricing` (or copy `component.tsx` to `components/iloveui/hairline-pricing.tsx`).
2. Make sure the `--iu-*` tokens exist in your global CSS.
3. Replace `plans` and `rows` with your own. Keep values under ten characters so the comparison fits phones.
4. Wire `onCheckout` to your checkout endpoint. Return the request's Promise and the component shows loading, then success or the error row; or drive `status` and `checkoutPlanId` yourself.
5. Rewrite `terms` with your real tax treatment and refund window.

## Customization ideas

- Add a fourth "Enterprise" column with a "Talk to sales" link instead of a price; the grid becomes four columns from `md`.
- Group comparison rows under small uppercase `<th colSpan>` headings for larger feature sets.
- Feed localized prices and set `currencySymbol` from the visitor's region.
- Set `defaultBilling="monthly"` for products where monthly is the common choice.
- Swap the highlighted plan's tint for a 2px accent left rule on wide screens.
