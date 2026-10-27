# Typeset hero

## Component

`TypesetHero` is an editorial landing-page hero for a writing or publishing product. A masthead with a double rule sits above a five-column message (accent-ruled kicker, serif headline with one italic phrase, subline, one primary action) beside a seven-column editor window. The window holds one article and a tablist of output formats: Print sets it as a justified, hyphenated two-column page with an accent drop cap and a pull quote between rules; Web sets it as a single-column story with a byline; Newsletter sets it as a narrow, email-safe edition. Switching formats fades the page out and resets the same story in under a third of a second, which is the product's promise made visible.

## Props

| Prop               | Type                               | Default                          | Description                                               |
| ------------------ | ---------------------------------- | -------------------------------- | --------------------------------------------------------- |
| `brand`            | `string`                           | `"Quire"`                        | Wordmark set in italic serif in the masthead.             |
| `kicker`           | `string`                           | `"For independent publications"` | Uppercase label above the headline.                       |
| `headline`         | `string`                           | `"One draft, typeset for"`       | The start of the one message.                             |
| `headlineEmphasis` | `string`                           | `"every page."`                  | The phrase set in italic at the end of the headline.      |
| `subline`          | `string`                           | Product sentence                 | Supporting paragraph.                                     |
| `ctaLabel`         | `string`                           | `"Start your first issue"`       | Label of the only primary action.                         |
| `ctaHref`          | `string`                           | `"#start"`                       | Where the primary action goes.                            |
| `note`             | `string`                           | `"Free for one publication."`    | Quiet text beside the action.                             |
| `documentPath`     | `string`                           | `"Issue 14 / Night trains"`      | Document title in the editor window.                      |
| `wordCount`        | `string`                           | `"1,284 words"`                  | Shown after "Saved" in the window bar.                    |
| `article`          | `TypesetArticle`                   | Night train essay                | The story rendered in every format.                       |
| `formats`          | `TypesetFormatOption[]`            | Print, Web, Newsletter           | Tabs and the page spec shown beside them.                 |
| `defaultFormat`    | `"print" \| "web" \| "newsletter"` | `"print"`                        | Format selected on first render.                          |
| `onFormatChange`   | `(format: TypesetFormat) => void`  | none                             | Called when the visitor switches formats (for analytics). |
| `className`        | `string`                           | `""`                             | Extra classes for the `<section>`.                        |

`TypesetArticle` is `{ publication, domain, section, issue, title, dek, author, date, paragraphs: string[], pullQuote }`; three paragraphs fill the print page best.

## Tokens

Reads `--iu-background` (section and, in dark mode, the editor canvas), `--iu-surface` (window and pages), `--iu-border` (rules, frames, column rule), `--iu-foreground` (type, double rules, the primary button fill), `--iu-muted` (kickers, deks, metadata), `--iu-accent` (the kicker rule, the active tab underline, the drop cap and the web pull-quote rule, plus focus rings), `--iu-radius` (capped at 2px), `--iu-font` and `--iu-density` (window bar height). Serif comes from `font-serif` and mono from `font-mono` in your Tailwind theme. Add the tokens once with `npx shadcn@latest add @iloveui/tokens`.

## Dependencies

`react`, `motion` (the format cross-fade and sliding tab underline) and `lucide-react` (arrow and check icons). Tailwind CSS 4.1 or later.

## Integration steps

1. Run `npx shadcn@latest add @iloveui/typeset-hero` (or copy `component.tsx` to `components/iloveui/typeset-hero.tsx`).
2. Make sure the `--iu-*` tokens exist in your global CSS and that `font-serif` maps to a display serif you license.
3. Render `<TypesetHero />` at the top of your landing page and pass your own `headline`, `headlineEmphasis`, `subline`, `ctaLabel` and `ctaHref`.
4. Replace `article` with a real story from your product, ideally one a customer published, and keep `formats` aligned with the outputs you actually support.
5. Wire `onFormatChange` to your analytics if you want to know which output visitors care about.

## Customization ideas

- Add a fourth format such as "Podcast notes" or "Slides" and a matching page renderer.
- Start on `defaultFormat="newsletter"` for an email-first product.
- Replace the drop cap with a small-caps opening line by swapping the `first-letter:` classes for `first-line:uppercase first-line:tracking-[0.08em]`.
- Put a real word count and reading time from your editor into `wordCount`.
- Swap the masthead volume line for your launch date or current issue.
