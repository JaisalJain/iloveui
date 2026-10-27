# Commonplace editorial bento

## Component

`CommonplaceEditorialBento` is a features section for a reading, research or knowledge product, set as a magazine spread: a double-ruled masthead, a large serif headline with one italic phrase, and four numbered features in asymmetric columns divided by rules. The lead feature is interactive: an article excerpt with a drop cap carries three marked passages. Filing a passage (click the text or its round toggle) draws an accent underline through it, line by line, and the passage lands in the Notebook column as a numbered serif pull quote with an APA citation and page number; the count updates and the citations can be copied. The other features show a question answered from your own sources with footnotes, a reading queue set like a contents page with dot leaders, and a resurfaced quote.

## Props

| Prop               | Type                                                          | Default                         | Description                                                                 |
| ------------------ | ------------------------------------------------------------- | ------------------------------- | --------------------------------------------------------------------------- |
| `issue`            | `string`                                                      | `"No. 07 · Autumn 2026"`        | Right side of the masthead.                                                 |
| `headline`         | `string`                                                      | `"Read once."`                  | Upright part of the headline.                                               |
| `headlineEmphasis` | `string`                                                      | `"Keep what you underlined."`   | Italic part of the headline; keep it to one phrase.                         |
| `standfirst`       | `string`                                                      | Product summary                 | Paragraph beside the headline.                                              |
| `source`           | `CommonplaceSource`                                           | An essay in The Ferrous Review  | Author, short author, title, publication, issue and date used in citations. |
| `excerpt`          | `(string \| { id: string; text: string; page: number })[]`    | Three sentences, three passages | Plain text pieces and fileable passages, in reading order.                  |
| `defaultFiled`     | `string[]`                                                    | `["p1", "p2"]`                  | Passage ids already in the notebook. Pass `[]` for the empty notebook.      |
| `question`         | `string`                                                      | A pricing question              | Question shown in the Ask feature.                                          |
| `queue`            | `{ title: string; minutes: number; progress?: number }[]`     | Four pieces                     | Rows of the reading queue.                                                  |
| `resurfaced`       | `{ quote: string; from: string; date: string; note: string }` | A quote from a saved letter     | The Resurface feature.                                                      |
| `onFiledChange`    | `(ids: string[]) => void`                                     | none                            | Called with the filed passage ids after each change.                        |
| `onCopyCitations`  | `(text: string) => void`                                      | none                            | Called with the citations, one per line, after they are copied.             |
| `className`        | `string`                                                      | `""`                            | Extra classes for the `<section>`.                                          |

## Tokens

Reads `--iu-background` (the page), `--iu-surface` (the article page), `--iu-border` (column rules and hairlines), `--iu-foreground` (ink, the masthead double rule, filed toggles), `--iu-muted` (kickers, captions and citations), `--iu-accent` (the single editorial mark: the underline drawn through filed passages, plus focus rings), `--iu-radius` (capped at 2px for the article frame), `--iu-font` (body and controls) and `--iu-density` (padding of the article and the notebook rows). Display type uses your project's `font-serif`.

## Dependencies

`react`, `motion` (notebook entries arriving and leaving) and `lucide-react` (plus and check on the passage toggles). Tailwind CSS 4.1 or later with a `font-serif` family defined.

## Integration steps

1. Run `npx shadcn@latest add @iloveui/commonplace-editorial-bento` (or copy `component.tsx` into `components/iloveui/commonplace-editorial-bento.tsx`).
2. Make sure the `--iu-*` tokens exist in your global CSS (`npx shadcn@latest add @iloveui/tokens`) and that `font-serif` maps to a display serif.
3. Render `<CommonplaceEditorialBento />` on your landing page and replace `source` and `excerpt` with a passage your readers would recognise.
4. Wire `onFiledChange` to analytics or to a real notebook if you embed it in the product.
5. Use `defaultFiled={[]}` to open on the empty notebook, which invites the first action.

## Customization ideas

- Add a citation style switch (APA, Chicago, MLA) above the copy button and format `citation` accordingly.
- Let the Ask feature stream its answer when the section scrolls into view.
- Replace the reading queue with a table of contents for a course or a handbook.
- Show a tag picker beside each filed passage for readers who organise by topic.
- Swap the resurfaced quote for a weekly digest list of five lines.
