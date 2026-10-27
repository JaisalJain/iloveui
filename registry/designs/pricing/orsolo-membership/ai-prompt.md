# Orsolo membership

## Component

`OrsoloMembership` is a membership selection section for a premium service, in the luxury style: a centered serif headline, a one-year or two-year term switch with the saving stated, three tiers set as quiet columns with large serif prices, and a benefit comparison underneath. The tiers are a radio group. On wide screens a fine double frame with a small accent diamond glides to the chosen column and runs down through its benefits, while the other columns recede to the muted color. Below, the selection is restated with the total and the saving, and a pill button requests membership: loading draws a thin line inside the button, an error shows a quiet note with Try again, and success replaces the request with a framed member card naming the member number and the concierge.

## Props

| Prop              | Type                                             | Default                       | Description                                                                                         |
| ----------------- | ------------------------------------------------ | ----------------------------- | --------------------------------------------------------------------------------------------------- |
| `house`           | `string`                                         | `"Orsolo"`                    | Brand name in the kicker and on the member card.                                                    |
| `kicker`          | `string`                                         | `"Membership · 2027"`         | Small label above the headline.                                                                     |
| `headline`        | `string`                                         | `"Travel, arranged quietly."` | Serif headline.                                                                                     |
| `emphasis`        | `string`                                         | `"quietly"`                   | The phrase inside `headline` set in italic.                                                         |
| `subline`         | `string`                                         | Membership sentence           | Supporting sentence.                                                                                |
| `tiers`           | `OrsoloTier[]`                                   | Voyager, Reserve, Atelier     | `{ id, numeral, name, summary, annual, recommended? }`; `annual` is the one-year price per year.    |
| `benefits`        | `OrsoloBenefit[]`                                | Six benefits                  | `values` keyed by tier id: a short string, or `false` for not included.                             |
| `twoYearDiscount` | `number`                                         | `0.12`                        | Discount on the two-year term, from 0 to 1.                                                         |
| `currency`        | `string`                                         | `"EUR"`                       | ISO 4217 code for every price.                                                                      |
| `locale`          | `string`                                         | `"en-GB"`                     | Locale for number formatting.                                                                       |
| `defaultTierId`   | `string`                                         | the recommended tier          | Tier selected first.                                                                                |
| `defaultTerm`     | `"one" \| "two"`                                 | `"one"`                       | Term selected first.                                                                                |
| `terms`           | `string`                                         | VAT and refund sentence       | The tax and refund line at the foot.                                                                |
| `status`          | `"idle" \| "loading" \| "error" \| "success"`    | uncontrolled                  | Controlled status. Leave unset and return a Promise from `onRequest` to let the component drive it. |
| `errorMessage`    | `string`                                         | Desk unavailable sentence     | Text of the error note.                                                                             |
| `welcome`         | `OrsoloWelcome`                                  | Nº 0417, concierge, start     | `{ memberNumber, concierge, startsOn }` for the member card.                                        |
| `onRequest`       | `(tierId, term, total) => void \| Promise<void>` | none                          | Called by Request membership and Try again; `total` is the amount for the whole term.               |
| `onTierChange`    | `(tierId) => void`                               | none                          | Called when the selected tier changes.                                                              |
| `className`       | `string`                                         | `""`                          | Extra classes for the `<section>`.                                                                  |

## Tokens

Reads `--iu-background` (section), `--iu-foreground` (type, the frame, the selected pill and the request button), `--iu-muted` (labels and unselected columns), `--iu-border` (fine rules), `--iu-accent` (only the diamond marks, the term underline and focus rings), `--iu-radius` (capped at 2px on framed surfaces; buttons stay full pills by design), `--iu-font` and `--iu-density` (comparison row height). `--iu-surface` and `--iu-accent-foreground` are unused by design. Serif type comes from your `font-serif`. Add the tokens with `npx shadcn@latest add @iloveui/tokens`.

## Dependencies

`react`, `motion` (the gliding frame, term underline, price cross-fades and the member card entrance) and `lucide-react` (arrow and retry icons). Tailwind CSS 4.1 or later.

## Integration steps

1. Run `npx shadcn@latest add @iloveui/orsolo-membership` (or copy `component.tsx` to `components/iloveui/orsolo-membership.tsx`).
2. Make sure the `--iu-*` tokens exist and `font-serif` maps to a display serif in your Tailwind theme.
3. Replace `tiers` and `benefits` with your own; keep benefit values to one or two words so three columns fit phones.
4. Wire `onRequest` to your checkout or application endpoint and return its Promise; or drive `status` yourself.
5. Pass the real member number, concierge name and start date in `welcome` after success, and rewrite `terms` with your tax treatment and refund window.

## Customization ideas

- Replace the two-year term with "Founding member" pricing for an opening period.
- Add a fourth "By invitation" column that shows "On request" instead of a price.
- Show a waitlist position on the member card when places are limited.
- Swap the travel benefits for a private dining club, a members' workspace or an advisory retainer.
- Set `defaultTerm="two"` when the longer term is the one you want to lead with.
