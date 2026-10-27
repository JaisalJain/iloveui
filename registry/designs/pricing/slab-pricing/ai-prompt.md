# Slab pricing

## Component

`SlabPricing` is a complete pricing section for a usage-billed developer product, in the neo-brutalist family: a heavy headline, a chunky monthly/yearly switch with a rotated saving sticker, three plan slabs with 2px outlines and hard offset shadows, a strip with currency, tax, cancellation and refund terms, and a comparison of every limit. Exactly one plan is highlighted: it gets the accent header band, the deepest shadow and the only accent button.

Switching billing is the signature moment. The slabs stamp into their shadows one after another while every price rolls digit by digit in vertical strips (tabular figures, constant speed, so a digit that travels further rolls longer). Pressing a plan button drops it into its shadow; while checkout opens it stays pressed with three stepping blocks and keeps its width. A failed checkout puts an inline error box with a retry above the button, and a successful one turns the slab into a confirmation with the order summary.

The comparison is a real table with a sticky plan row from 768px; on phones it keeps every row comparable, with a sticky strip of plan columns over rows that set each label above its three values, and each value read with its plan name. Everything is server-rendered in its final state and instant under reduced motion.

## Props

| Prop              | Type                                            | Default                               | Description                                                                                                                          |
| ----------------- | ----------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `eyebrow`         | `string`                                        | `"Pipeyard pricing"`                  | Small uppercase label above the headline.                                                                                            |
| `headline`        | `string`                                        | `"Pay for what you deliver."`         | Section heading, rendered as an `h2`.                                                                                                |
| `subline`         | `string`                                        | Plans summary sentence                | Supporting sentence under the headline.                                                                                              |
| `plans`           | `SlabPlan[]`                                    | Starter, Team, Scale                  | The slabs, in order. Mark exactly one `highlighted`.                                                                                 |
| `featureGroups`   | `SlabFeatureGroup[]`                            | Usage, Delivery, Security and support | Comparison rows; each row's `values` is keyed by plan id.                                                                            |
| `terms`           | `SlabTerm[]`                                    | Currency, Tax, Cancel, Refunds        | The terms strip under the slabs.                                                                                                     |
| `compareTitle`    | `string`                                        | `"Compare every limit"`               | Heading above the comparison.                                                                                                        |
| `currency`        | `string`                                        | `"USD"`                               | ISO 4217 code used to format every price.                                                                                            |
| `locale`          | `string`                                        | `"en-US"`                             | Locale for number formatting and digit grouping.                                                                                     |
| `savingLabel`     | `string`                                        | `"Save 20%"`                          | Text of the sticker; screen readers hear it with the Yearly option.                                                                  |
| `defaultBilling`  | `"monthly" \| "yearly"`                         | `"monthly"`                           | Starting billing period when `billing` is not set.                                                                                   |
| `billing`         | `"monthly" \| "yearly"`                         | unset                                 | Controls the billing period; pair it with `onBillingChange`.                                                                         |
| `onBillingChange` | `(billing) => void`                             | unset                                 | Called when the switch changes.                                                                                                      |
| `status`          | `"idle" \| "loading" \| "error" \| "success"`   | unset                                 | Controls the checkout state. Leave it unset to let a promise from `onCheckout` drive it.                                             |
| `checkoutPlanId`  | `string`                                        | the highlighted plan                  | Plan the checkout state belongs to.                                                                                                  |
| `onCheckout`      | `(planId, billing) => void \| Promise<unknown>` | unset                                 | Called by every plan button. Return a promise: pending shows loading, resolved shows the confirmation, rejected shows the error box. |
| `checkoutError`   | `SlabCheckoutError`                             | Timeout copy                          | `{ title, detail, code? }` shown in the error box.                                                                                   |
| `order`           | `SlabOrder`                                     | Order PY-20817                        | Reference, date, payment method, tax label and rate, and renewal dates for the confirmation.                                         |
| `continueLabel`   | `string`                                        | `"Open dashboard"`                    | Action on the confirmation slab.                                                                                                     |
| `continueHref`    | `string`                                        | `"#dashboard"`                        | Where that action goes.                                                                                                              |
| `className`       | `string`                                        | `""`                                  | Extra classes for the `<section>`.                                                                                                   |

`SlabPlan` is `{ id, name, tagline, price: { monthly, yearly }, quota, overage, note?, everythingIn?, highlights, ctaLabel, highlighted?, badge? }`, where both prices are per month in whole currency units (yearly is the monthly equivalent of the yearly price) and `note` replaces the line under a price per billing period, for example `{ monthly: "Free forever", yearly: "Free forever" }` on a free tier. `SlabFeatureGroup` is `{ title, rows: { label, values: Record<planId, true | false | string> }[] }`: `true` prints a check, `false` a dash and a string the limit. `SlabOrder` is `{ reference, placedOn, paymentMethod, taxLabel, taxRate, renewsOn: { monthly, yearly } }`.

## Tokens

Reads `--iu-background` (section, terms cells, table group bars), `--iu-surface` (slabs, switch, table, error box), `--iu-foreground` (every 2px outline, the switch thumb, check squares, the sticker and the hard shadows in light mode), `--iu-muted` (taglines, billing notes, overage, dashes), `--iu-accent` (the highlighted band and button, the highlighted column strip in the table, the eyebrow square and focus rings), `--iu-accent-foreground` (text on accent fills), `--iu-radius` (capped at 4px for slabs and controls and 2px for stickers and chips), `--iu-font` and `--iu-density` (band padding, table and phone comparison row heights, terms cells). `--iu-border` is not used: the family draws every edge in the foreground color.

Two local variables complete the set. `--slab-shade`, declared in the section's classes, colors the hard shadows and dashed rules: the foreground in light mode and a 40% step toward the background in dark mode, so dark slabs read as extruded rather than outlined twice. `--slab-sticky-top` is read with a `0px` fallback and offsets the sticky table header and the sticky plan strip on phones, so set it on any parent. Add the tokens once with `npx shadcn@latest add @iloveui/tokens`.

## Dependencies

`react` and `lucide-react` (check, arrow, retry and alert icons). No animation library: the roll, stamp and press are CSS transitions driven by state and two timers. Tailwind CSS 4.1 or later (subgrid rows, `has-*`, `not-*`, `aria-*` and `data-*` variants).

## Integration steps

1. Run `npx shadcn@latest add @iloveui/slab-pricing` (or copy `component.tsx` to `components/iloveui/slab-pricing.tsx`).
2. Make sure the `--iu-*` tokens exist in your global CSS (`npx shadcn@latest add @iloveui/tokens` adds them).
3. Map your plans to `plans`: ids, monthly and yearly per-month prices, quota and overage text, three to five highlights, and `highlighted: true` on exactly one. Build `featureGroups` from the same plan ids, and set `savingLabel` to the smallest saving across plans so the sticker stays true.
4. Wire checkout with a promise: `onCheckout={(planId, billing) => createCheckout(planId, billing)}`. A rejection shows the error box and turns the button into Retry checkout; a resolution shows the confirmation. For a hosted checkout, assign `window.location` once you have the URL and return a promise that stays pending, so the button keeps its loading state until the page unloads.
5. To drive the state yourself (for example after a webhook confirms payment), pass `status` and `checkoutPlanId`, and pass the real `order` from your checkout session so the summary shows the actual reference, tax and renewal date.
6. Replace `terms` with your own currency, tax treatment, cancellation and refund policy.
7. If the page has a fixed header, set `--slab-sticky-top` on a parent (for example `[--slab-sticky-top:64px]`) so the table's plan row sticks below it.

## Customization ideas

- Four plans: change `md:grid-cols-3` on the plan list to `md:grid-cols-2 xl:grid-cols-4` and drop the first table column to 28%.
- Show the yearly total in the confirmation as a second stamp next to Paid ("Saved $192") when the buyer chose yearly.
- Set `currency="EUR"` and `locale="de-DE"`: prices format with the local grouping and still roll digit by digit.
- Swap the confirmation's dashboard action for a next step such as "Invite your team" with a seat count from `order`.
- For a denser, spreadsheet feel, replace the dashed row rules with solid 1px rules and set `--iu-density` to 0.8.
