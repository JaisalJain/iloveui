# Private office hero

## Component

`PrivateOfficeHero` is a landing-page hero for a premium financial product, here a private bank. On wide screens a framed client statement sits on the left as the subject of the page, inverse in light mode and a stepped surface in dark mode: the client's name in italic serif, net worth as a large serif numeral, the gain for the chosen period, one fine line chart ending in a small accent mark, a period selector, an allocation hairline and the client's banker. The message sits on the right: house name with wide-tracked labels, a short accent rule, a serif headline with one italic word, subline, one pill action and three facts. Choosing Quarter, Year or Five years rolls the gain to its new value, redraws the line from the left and slides the accent mark to the new end point, all within half a second. On small screens the message comes first and the statement follows.

## Props

| Prop               | Type                         | Default                                | Description                                             |
| ------------------ | ---------------------------- | -------------------------------------- | ------------------------------------------------------- |
| `house`            | `string`                     | `"Corven & Hale"`                      | House name in the top label.                            |
| `established`      | `string`                     | `"Private office · Zürich · London"`   | Second label beside the house name.                     |
| `headline`         | `string`                     | `"Wealth, kept"`                       | The start of the one message.                           |
| `headlineEmphasis` | `string`                     | `"quietly."`                           | Word set in italic at the end of the headline.          |
| `subline`          | `string`                     | Product sentence                       | Supporting paragraph.                                   |
| `ctaLabel`         | `string`                     | `"Request an introduction"`            | Label of the only primary action.                       |
| `ctaHref`          | `string`                     | `"#introduction"`                      | Where the primary action goes.                          |
| `note`             | `string`                     | `"Relationships begin at €5 million."` | Quiet text beside the action.                           |
| `facts`            | `{ value; label }[]`         | Three facts                            | Serif figures under a hairline; three fit best.         |
| `statementTitle`   | `string`                     | `"Private statement"`                  | Label at the top of the statement.                      |
| `client`           | `string`                     | `"The Valdés-Hartmann family"`         | Client name in italic serif.                            |
| `currency`         | `string`                     | `"€"`                                  | Currency symbol for every amount.                       |
| `netWorth`         | `number`                     | `48216904`                             | Large numeral in the statement.                         |
| `periods`          | `PrivateOfficePeriod[]`      | Quarter, Year, Five years              | Each has a label, phrase, gain, percentage and series.  |
| `defaultPeriod`    | `string`                     | `"year"`                               | Period selected on first render.                        |
| `holdings`         | `{ label; share }[]`         | Four asset classes                     | Allocation hairline and list; shares should sum to 100. |
| `banker`           | `string`                     | `"Céleste Varga"`                      | Banker shown with a serif monogram.                     |
| `bankerNote`       | `string`                     | Availability line                      | Line under the banker's name.                           |
| `onPeriodChange`   | `(periodId: string) => void` | none                                   | Called when the visitor picks a period.                 |
| `className`        | `string`                     | `""`                                   | Extra classes for the `<section>`.                      |

## Tokens

Reads `--iu-background` (section; statement text and rules in light mode), `--iu-surface` (statement in dark mode), `--iu-border` (fact rules, dark statement frame), `--iu-foreground` (type, the light-mode statement fill, the pill action), `--iu-muted` (labels and supporting text), `--iu-accent` (the short rule under the house name, the chart's end mark and focus rings), `--iu-radius` (capped at 2px for the statement; the action is a deliberate full pill), `--iu-font` and `--iu-density` (allocation row spacing). Serif comes from `font-serif`. Add the tokens once with `npx shadcn@latest add @iloveui/tokens`.

## Dependencies

`react`, `motion` (the gain roll, line redraw, end-mark slide and selector ring) and `lucide-react` (the arrow in the action). Tailwind CSS 4.1 or later.

## Integration steps

1. Run `npx shadcn@latest add @iloveui/private-office-hero` (or copy `component.tsx` to `components/iloveui/private-office-hero.tsx`).
2. Make sure the `--iu-*` tokens exist in your global CSS and that `font-serif` maps to a display serif you license.
3. Render `<PrivateOfficeHero />` at the top of your landing page and pass your own `house`, `headline`, `headlineEmphasis`, `subline`, `ctaLabel` and `ctaHref`.
4. Replace the statement with an illustrative client; keep the figures plausible and label them as illustrative in your footer if regulation requires it.
5. Wire `onPeriodChange` to analytics if you want to know which horizon visitors care about.

## Customization ideas

- Re-skin it for a watch or audio brand: the statement becomes a product card with a serif model name, one specification line and a finish selector.
- Swap net worth for a travel itinerary total and the periods for legs of a journey.
- Show the allocation as four thin rules of different lengths instead of one segmented hairline.
- Replace the facts with a single sentence from the house's founding charter set in italic serif.
- Put the statement on the right with `lg:order-1` on the message for pages that lead with text.
